import busStopNames from '@/data/bus-stops.json';
import subwayStopNames from '@/data/subway-stops.json';
import { alertsForBoard, loadAlerts } from './alerts';
import {
  BUS_BOARDS,
  BUS_DELAY_THRESHOLD_SECONDS,
  DEPARTURES_PER_BOARD,
  FEEDS,
  NO_SERVICE_HORIZON_SECONDS,
  SUBWAY_BOARDS,
  type BusBoardConfig,
  type SubwayBoardConfig,
} from './config';
import { fetchGtfsFeed, presentNumber } from './feeds';
import type { Alert, Board, Departure, TransitPayload } from './types';

const BUS_STOP_NAMES = busStopNames as Record<string, string>;
const SUBWAY_STOP_NAMES = subwayStopNames as Record<string, string>;

/** A vehicle predicted to leave slightly in the past is still worth showing. */
const PAST_GRACE_SECONDS = 45;

interface StopTimeUpdateLike {
  stopId?: string | null;
  arrival?: { time?: unknown; delay?: number | null } | null;
  departure?: { time?: unknown; delay?: number | null } | null;
}

interface TripUpdateLike {
  trip: { tripId?: string | null; routeId?: string | null };
  delay?: number | null;
  stopTimeUpdate?: StopTimeUpdateLike[] | null;
}

function terminalName(updates: StopTimeUpdateLike[], names: Record<string, string>): string | null {
  for (let i = updates.length - 1; i >= 0; i--) {
    const id = updates[i].stopId;
    if (!id) continue;
    const name = names[id] ?? names[id.replace(/[NS]$/, '')];
    // Bus terminals are named per boarding berth ("… /Lane 4"), which is noise here.
    if (name) return name.replace(/\s*\/\s*Lane\s*\d+$/i, '');
  }
  return null;
}

function collectDepartures(
  tripUpdates: TripUpdateLike[],
  stopId: string,
  names: Record<string, string>,
  nowSeconds: number,
  useFeedDelay: boolean
): Departure[] {
  const byTrip = new Map<string, Departure>();

  for (const update of tripUpdates) {
    const updates = update.stopTimeUpdate ?? [];
    const match = updates.find((stu) => stu.stopId === stopId);
    if (!match) continue;

    const time = presentNumber(match.departure, 'time') ?? presentNumber(match.arrival, 'time');
    if (time == null || time <= 0 || time < nowSeconds - PAST_GRACE_SECONDS) continue;

    // Prefer the stop-level delay, falling back to the trip-level one the OBA
    // bus feed usually carries instead.
    const delaySeconds = useFeedDelay
      ? presentNumber(match.departure, 'delay') ??
        presentNumber(match.arrival, 'delay') ??
        presentNumber(update, 'delay')
      : null;

    const tripId = update.trip.tripId ?? `${time}`;
    const existing = byTrip.get(tripId);
    if (existing && existing.time <= time) continue;

    byTrip.set(tripId, {
      time,
      destination: terminalName(updates, names),
      delaySeconds,
      tripId,
    });
  }

  return Array.from(byTrip.values())
    .sort((a, b) => a.time - b.time)
    .slice(0, DEPARTURES_PER_BOARD);
}

function summarize(
  departures: Departure[],
  alerts: Alert[],
  nowSeconds: number,
  modeNoun: string
): Pick<Board, 'status' | 'statusLabel' | 'statusNote'> {
  const suspension = alerts.find((a) => a.severity === 'suspension');
  const delayAlert = alerts.find((a) => a.severity === 'delay');
  const horizonMinutes = Math.round(NO_SERVICE_HORIZON_SECONDS / 60);

  const nothingRunning = (): Pick<Board, 'status' | 'statusLabel' | 'statusNote'> =>
    suspension
      ? { status: 'no-service', statusLabel: 'Not running', statusNote: suspension.type }
      : {
          status: 'no-service',
          statusLabel: 'None predicted',
          statusNote: `No ${modeNoun} predicted in the next ${horizonMinutes} min`,
        };

  if (departures.length === 0) return nothingRunning();

  const next = departures[0];
  if (next.time - nowSeconds > NO_SERVICE_HORIZON_SECONDS) return nothingRunning();

  // Status tracks the bus you'd actually catch — a late third bus shouldn't
  // flag the board when the next one is on time.
  if (next.delaySeconds != null && next.delaySeconds >= BUS_DELAY_THRESHOLD_SECONDS) {
    return {
      status: 'delayed',
      statusLabel: 'Delayed',
      statusNote: `Next ${modeNoun.replace(/es$|s$/, '')} is running ${Math.round(next.delaySeconds / 60)} min behind schedule`,
    };
  }
  if (delayAlert) return { status: 'delayed', statusLabel: 'Delayed', statusNote: delayAlert.type };

  return { status: 'ok', statusLabel: 'On time', statusNote: null };
}

function errorBoard(
  base: Pick<Board, 'id' | 'mode' | 'routeLabel' | 'routeColor' | 'routeTextColor' | 'stopName' | 'directionLabel'>,
  message: string
): Board {
  return { ...base, status: 'unknown', statusLabel: 'No data', statusNote: message, departures: [], alerts: [] };
}

async function buildSubwayBoard(
  config: SubwayBoardConfig,
  alertEntities: Awaited<ReturnType<typeof loadAlerts>>,
  nowSeconds: number
): Promise<Board> {
  const base = {
    id: config.id,
    mode: 'subway' as const,
    routeLabel: config.routeLabel,
    routeColor: config.routeColor,
    routeTextColor: config.routeTextColor,
    stopName: config.stopName,
    directionLabel: config.directionLabel,
  };

  const feed = await fetchGtfsFeed(config.feedUrl);
  const tripUpdates: TripUpdateLike[] = [];
  for (const entity of feed.entity) {
    const update = entity.tripUpdate as TripUpdateLike | null | undefined;
    if (!update?.trip?.routeId) continue;
    if (!config.routeIds.includes(update.trip.routeId)) continue;
    tripUpdates.push(update);
  }

  // NYCT subway trip updates carry no delay field, so status leans on alerts.
  const departures = collectDepartures(tripUpdates, config.stopId, SUBWAY_STOP_NAMES, nowSeconds, false);
  const alerts = alertsForBoard(alertEntities, config.routeIds, [config.parentStopId, config.stopId], nowSeconds);

  return { ...base, ...summarize(departures, alerts, nowSeconds, 'trains'), departures, alerts };
}

function buildBusBoard(
  config: BusBoardConfig,
  tripUpdatesByRoute: Map<string, TripUpdateLike[]>,
  alertEntities: Awaited<ReturnType<typeof loadAlerts>>,
  nowSeconds: number
): Board {
  const base = {
    id: config.id,
    mode: 'bus' as const,
    routeLabel: config.routeLabel,
    routeColor: config.routeColor,
    routeTextColor: config.routeTextColor,
    stopName: config.stopName,
    directionLabel: config.directionLabel,
  };

  const tripUpdates = tripUpdatesByRoute.get(config.routeId) ?? [];
  const departures = collectDepartures(tripUpdates, config.stopId, BUS_STOP_NAMES, nowSeconds, true);
  const alerts = alertsForBoard(alertEntities, [config.routeId], [config.stopId], nowSeconds);

  return { ...base, ...summarize(departures, alerts, nowSeconds, 'buses'), departures, alerts };
}

export async function getTransit(): Promise<TransitPayload> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const errors: string[] = [];

  const [subwayAlerts, busAlerts] = await Promise.all([
    loadAlerts(FEEDS.subwayAlerts).catch((error) => {
      errors.push(`Subway alerts unavailable (${(error as Error).message})`);
      return [];
    }),
    loadAlerts(FEEDS.busAlerts).catch((error) => {
      errors.push(`Bus alerts unavailable (${(error as Error).message})`);
      return [];
    }),
  ]);

  const subwayResults = await Promise.all(
    SUBWAY_BOARDS.map((config) =>
      buildSubwayBoard(config, subwayAlerts, nowSeconds).catch((error) => {
        errors.push(`${config.routeLabel} feed unavailable (${(error as Error).message})`);
        return errorBoard(
          {
            id: config.id,
            mode: 'subway',
            routeLabel: config.routeLabel,
            routeColor: config.routeColor,
            routeTextColor: config.routeTextColor,
            stopName: config.stopName,
            directionLabel: config.directionLabel,
          },
          'Live feed unavailable'
        );
      })
    )
  );

  // One shared download covers every bus board.
  const routesNeeded = new Set(BUS_BOARDS.map((b) => b.routeId));
  const tripUpdatesByRoute = new Map<string, TripUpdateLike[]>();
  let busFeedOk = true;
  try {
    const feed = await fetchGtfsFeed(FEEDS.busTripUpdates);
    for (const entity of feed.entity) {
      const update = entity.tripUpdate as TripUpdateLike | null | undefined;
      const routeId = update?.trip?.routeId;
      if (!update || !routeId || !routesNeeded.has(routeId)) continue;
      const list = tripUpdatesByRoute.get(routeId);
      if (list) list.push(update);
      else tripUpdatesByRoute.set(routeId, [update]);
    }
  } catch (error) {
    busFeedOk = false;
    errors.push(`Bus feed unavailable (${(error as Error).message})`);
  }

  const busResults = BUS_BOARDS.map((config) =>
    busFeedOk
      ? buildBusBoard(config, tripUpdatesByRoute, busAlerts, nowSeconds)
      : errorBoard(
          {
            id: config.id,
            mode: 'bus',
            routeLabel: config.routeLabel,
            routeColor: config.routeColor,
            routeTextColor: config.routeTextColor,
            stopName: config.stopName,
            directionLabel: config.directionLabel,
          },
          'Live feed unavailable'
        )
  );

  return { updatedAt: Date.now(), boards: [...subwayResults, ...busResults], errors };
}
