export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder';

const WEATHER_CODES: Record<number, { kind: WeatherKind; label: string }> = {
  0: { kind: 'clear', label: 'Clear' },
  1: { kind: 'clear', label: 'Mainly clear' },
  2: { kind: 'partly', label: 'Partly cloudy' },
  3: { kind: 'cloudy', label: 'Overcast' },
  45: { kind: 'fog', label: 'Fog' },
  48: { kind: 'fog', label: 'Freezing fog' },
  51: { kind: 'drizzle', label: 'Light drizzle' },
  53: { kind: 'drizzle', label: 'Drizzle' },
  55: { kind: 'drizzle', label: 'Heavy drizzle' },
  56: { kind: 'drizzle', label: 'Freezing drizzle' },
  57: { kind: 'drizzle', label: 'Freezing drizzle' },
  61: { kind: 'rain', label: 'Light rain' },
  63: { kind: 'rain', label: 'Rain' },
  65: { kind: 'rain', label: 'Heavy rain' },
  66: { kind: 'rain', label: 'Freezing rain' },
  67: { kind: 'rain', label: 'Freezing rain' },
  71: { kind: 'snow', label: 'Light snow' },
  73: { kind: 'snow', label: 'Snow' },
  75: { kind: 'snow', label: 'Heavy snow' },
  77: { kind: 'snow', label: 'Snow grains' },
  80: { kind: 'rain', label: 'Light showers' },
  81: { kind: 'rain', label: 'Showers' },
  82: { kind: 'rain', label: 'Heavy showers' },
  85: { kind: 'snow', label: 'Snow showers' },
  86: { kind: 'snow', label: 'Snow showers' },
  95: { kind: 'thunder', label: 'Thunderstorm' },
  96: { kind: 'thunder', label: 'Thunderstorm with hail' },
  99: { kind: 'thunder', label: 'Thunderstorm with hail' },
};

export function describeWeather(code: number): { kind: WeatherKind; label: string } {
  return WEATHER_CODES[code] ?? { kind: 'cloudy', label: 'Unsettled' };
}

/**
 * Open-Meteo returns wall-clock strings already in New York time. We format by
 * string slicing rather than `new Date` so the label never shifts if the
 * browser is in another timezone.
 */
export function formatHourNumber(hour24: number): string {
  const hour = ((hour24 % 24) + 24) % 24;
  const suffix = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

export function formatHourLabel(isoLocal: string): string {
  return formatHourNumber(Number(isoLocal.slice(11, 13)));
}

/**
 * Renders a rain window inclusively: hours 14:00–17:00 all being wet means the
 * rain runs until 6 PM, not 5 PM.
 */
export function formatHourRange(startIso: string, endIso: string): string {
  const start = Number(startIso.slice(11, 13));
  const end = Number(endIso.slice(11, 13)) + 1;
  return `${formatHourNumber(start)} – ${formatHourNumber(end)}`;
}

export function formatClockLabel(isoLocal: string): string {
  const hour = Number(isoLocal.slice(11, 13));
  const minute = isoLocal.slice(14, 16);
  const suffix = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${minute} ${suffix}`;
}

export function minutesUntil(epochSeconds: number, nowMs: number): number {
  return Math.round((epochSeconds * 1000 - nowMs) / 60_000);
}

export function formatDepartureClock(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

export function formatRelativeAge(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s ago`;
}
