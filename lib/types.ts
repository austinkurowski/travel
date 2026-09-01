export type BoardStatus = 'ok' | 'delayed' | 'no-service' | 'unknown';

export interface Departure {
  /** Epoch seconds of the predicted departure. */
  time: number;
  /** Where this particular run terminates — short-turns are common on all six boards. */
  destination: string | null;
  /** Positive = behind schedule. Buses report this directly; the subway feeds do not. */
  delaySeconds: number | null;
  tripId: string;
}

export interface Alert {
  id: string;
  /** MTA "mercury" alert type, e.g. Delays, Planned - Detour, Planned - Suspended. */
  type: string;
  text: string;
  severity: 'info' | 'delay' | 'suspension';
}

export interface Board {
  id: string;
  mode: 'subway' | 'bus';
  routeLabel: string;
  routeColor: string;
  routeTextColor: string;
  stopName: string;
  directionLabel: string;
  status: BoardStatus;
  /** Short pill text; distinguishes a real suspension from a quiet stretch. */
  statusLabel: string;
  statusNote: string | null;
  departures: Departure[];
  alerts: Alert[];
}

export interface TransitPayload {
  updatedAt: number;
  boards: Board[];
  errors: string[];
}

export interface RainWindow {
  startsAt: string;
  endsAt: string;
  peakProbability: number;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  precipProbability: number;
  weatherCode: number;
  isDay: boolean;
}

export interface WeatherPayload {
  updatedAt: number;
  locationName: string;
  current: {
    temperature: number;
    apparentTemperature: number;
    weatherCode: number;
    isDay: boolean;
    humidity: number;
    windSpeed: number;
  };
  today: {
    high: number;
    low: number;
    precipProbabilityMax: number;
    sunrise: string;
    sunset: string;
  };
  hourly: HourlyPoint[];
  rainWindows: RainWindow[];
}
