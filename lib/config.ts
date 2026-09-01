/**
 * Everything location-specific lives here. Stop IDs come from the MTA static
 * GTFS bundles and are anchored on Nostrand Ave / Fulton St in Bed-Stuy.
 */

export const LOCATION = {
  name: 'Bed-Stuy, Brooklyn',
  latitude: 40.6803,
  longitude: -73.95,
  timezone: 'America/New_York',
} as const;

export const FEEDS = {
  subwayAce: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',
  subwayG: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
  busTripUpdates: 'https://gtfsrt.prod.obanyc.com/tripUpdates',
  subwayAlerts: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json',
  busAlerts: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fbus-alerts.json',
} as const;

export interface SubwayBoardConfig {
  id: string;
  feedUrl: string;
  /** Realtime route_id values to keep. Nostrand Av is shared with the C. */
  routeIds: string[];
  routeLabel: string;
  routeColor: string;
  routeTextColor: string;
  /** Direction-specific platform ID: N = northbound, S = southbound. */
  stopId: string;
  /** Parent station ID, used to decide whether a stop-scoped alert applies here. */
  parentStopId: string;
  stopName: string;
  directionLabel: string;
}

export interface BusBoardConfig {
  id: string;
  routeId: string;
  routeLabel: string;
  routeColor: string;
  routeTextColor: string;
  /**
   * Bus stop IDs are already direction-specific — Bedford Av is one-way
   * northbound, and each side of Halsey St has its own ID — so the stop alone
   * pins the direction and we never filter on the feed's direction_id.
   */
  stopId: string;
  stopName: string;
  directionLabel: string;
}

export const SUBWAY_BOARDS: SubwayBoardConfig[] = [
  {
    id: 'a-nostrand-manhattan',
    feedUrl: FEEDS.subwayAce,
    routeIds: ['A'],
    routeLabel: 'A',
    routeColor: '#0039A6',
    routeTextColor: '#FFFFFF',
    stopId: 'A46N',
    parentStopId: 'A46',
    stopName: 'Nostrand Av',
    directionLabel: 'Manhattan bound',
  },
  {
    id: 'g-bedford-nostrand-queens',
    feedUrl: FEEDS.subwayG,
    routeIds: ['G'],
    routeLabel: 'G',
    routeColor: '#6CBE45',
    routeTextColor: '#000000',
    stopId: 'G33N',
    parentStopId: 'G33',
    stopName: 'Bedford-Nostrand Avs',
    directionLabel: 'Queens bound',
  },
];

export const BUS_BOARDS: BusBoardConfig[] = [
  {
    id: 'b44-flushing',
    routeId: 'B44',
    routeLabel: 'B44',
    routeColor: '#B933AD',
    routeTextColor: '#FFFFFF',
    stopId: '303411',
    stopName: 'Bedford Av / Fulton St',
    directionLabel: 'Toward Flushing Av',
  },
  {
    id: 'b44sbs-williamsburg',
    routeId: 'B44+',
    routeLabel: 'B44 SBS',
    routeColor: '#B933AD',
    routeTextColor: '#FFFFFF',
    stopId: '303411',
    stopName: 'Bedford Av / Fulton St',
    directionLabel: 'Toward Williamsburg Br Plaza',
  },
  {
    id: 'b26-downtown',
    routeId: 'B26',
    routeLabel: 'B26',
    routeColor: '#006CB7',
    routeTextColor: '#FFFFFF',
    stopId: '307928',
    stopName: 'Halsey St / Nostrand Av',
    directionLabel: 'Toward Downtown Brooklyn',
  },
  {
    id: 'b26-ridgewood',
    routeId: 'B26',
    routeLabel: 'B26',
    routeColor: '#006CB7',
    routeTextColor: '#FFFFFF',
    stopId: '302464',
    stopName: 'Halsey St / Nostrand Av',
    directionLabel: 'Toward Ridgewood',
  },
];

/** How many upcoming departures each board shows. */
export const DEPARTURES_PER_BOARD = 3;

/** A bus this far behind schedule gets flagged. */
export const BUS_DELAY_THRESHOLD_SECONDS = 300;

/**
 * If nothing is predicted within this window we call the board "no service"
 * rather than just empty — the realtime feeds only look ~30 minutes ahead.
 */
export const NO_SERVICE_HORIZON_SECONDS = 45 * 60;
