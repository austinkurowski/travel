import { fetchJsonFeed } from './feeds';
import type { Alert } from './types';

interface RawTranslation {
  text: string;
  language?: string;
}

interface RawAlertEntity {
  id: string;
  alert?: {
    active_period?: { start?: number; end?: number }[];
    informed_entity?: { route_id?: string; stop_id?: string; direction_id?: number }[];
    header_text?: { translation?: RawTranslation[] };
    'transit_realtime.mercury_alert'?: { alert_type?: string };
  };
}

interface RawAlertFeed {
  entity?: RawAlertEntity[];
}

const SUSPENSION_PATTERN = /suspend|no scheduled service|no service/i;
const DELAY_PATTERN = /delay|slow speeds|reduced service/i;

function severityFor(type: string): Alert['severity'] {
  if (SUSPENSION_PATTERN.test(type)) return 'suspension';
  if (DELAY_PATTERN.test(type)) return 'delay';
  return 'info';
}

function isActiveNow(periods: { start?: number; end?: number }[] | undefined, nowSeconds: number): boolean {
  // An alert with no active_period is treated as always in effect, per the GTFS-RT spec.
  if (!periods || periods.length === 0) return true;
  return periods.some((p) => (p.start ?? 0) <= nowSeconds && (p.end == null || p.end >= nowSeconds));
}

function englishText(translations: RawTranslation[] | undefined): string {
  if (!translations || translations.length === 0) return '';
  const plain = translations.find((t) => t.language === 'en') ?? translations.find((t) => !t.language?.includes('html'));
  return (plain ?? translations[0]).text.replace(/\s+/g, ' ').trim();
}

export async function loadAlerts(url: string): Promise<RawAlertEntity[]> {
  const feed = await fetchJsonFeed<RawAlertFeed>(url, 60_000);
  return feed.entity ?? [];
}

/**
 * Alerts that actually apply to one board.
 *
 * MTA alerts are mostly route-wide, but planned-work alerts name specific
 * stations. If every informed entity for our route names a station and none of
 * them is ours, the alert is about somewhere else on the line and we drop it.
 */
export function alertsForBoard(
  entities: RawAlertEntity[],
  routeIds: string[],
  stopIds: string[],
  nowSeconds = Math.floor(Date.now() / 1000)
): Alert[] {
  const routes = new Set(routeIds);
  const stops = new Set(stopIds);
  const results: Alert[] = [];

  for (const entity of entities) {
    const alert = entity.alert;
    if (!alert || !isActiveNow(alert.active_period, nowSeconds)) continue;

    const matching = (alert.informed_entity ?? []).filter((ie) => ie.route_id && routes.has(ie.route_id));
    if (matching.length === 0) continue;

    const isRouteWide = matching.some((ie) => !ie.stop_id);
    const namesOurStop = matching.some((ie) => ie.stop_id && stops.has(ie.stop_id));
    if (!isRouteWide && !namesOurStop) continue;

    const text = englishText(alert.header_text?.translation);
    if (!text) continue;

    const type = alert['transit_realtime.mercury_alert']?.alert_type ?? 'Service Notice';
    results.push({ id: entity.id, type, text, severity: severityFor(type) });
  }

  const rank = { suspension: 0, delay: 1, info: 2 } as const;
  return results.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
