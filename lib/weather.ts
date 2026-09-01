import { LOCATION } from './config';
import type { HourlyPoint, RainWindow, WeatherPayload } from './types';

/** Probability at or above which we call an hour "rain likely". */
const RAIN_THRESHOLD = 30;
const HOURS_AHEAD = 18;

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    is_day: number;
    wind_speed_10m: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
    is_day: number[];
  };
}

function buildUrl(): string {
  const params = new URLSearchParams({
    latitude: String(LOCATION.latitude),
    longitude: String(LOCATION.longitude),
    timezone: LOCATION.timezone,
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    forecast_days: '2',
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    hourly: 'temperature_2m,precipitation_probability,weather_code,is_day',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

/**
 * Groups consecutive rain-likely hours into windows, so the UI can say
 * "2 PM – 5 PM" instead of listing four separate hours.
 */
function findRainWindows(hours: HourlyPoint[]): RainWindow[] {
  const windows: RainWindow[] = [];
  let open: RainWindow | null = null;

  for (const hour of hours) {
    if (hour.precipProbability >= RAIN_THRESHOLD) {
      if (open) {
        open.endsAt = hour.time;
        open.peakProbability = Math.max(open.peakProbability, hour.precipProbability);
      } else {
        open = { startsAt: hour.time, endsAt: hour.time, peakProbability: hour.precipProbability };
      }
    } else if (open) {
      windows.push(open);
      open = null;
    }
  }
  if (open) windows.push(open);
  return windows;
}

export async function getWeather(): Promise<WeatherPayload> {
  const response = await fetch(buildUrl(), { cache: 'no-store' });
  if (!response.ok) throw new Error(`Open-Meteo responded ${response.status}`);
  const data = (await response.json()) as OpenMeteoResponse;

  // Open-Meteo returns whole local days; start the strip at the current New
  // York hour. sv-SE gives "YYYY-MM-DD HH:mm:ss", so swap in the ISO "T" before
  // comparing against the feed's "YYYY-MM-DDTHH:mm" keys.
  const nowPrefix = new Date()
    .toLocaleString('sv-SE', { timeZone: LOCATION.timezone })
    .replace(' ', 'T')
    .slice(0, 13);
  let startIndex = data.hourly.time.findIndex((t) => t.slice(0, 13) >= nowPrefix);
  if (startIndex < 0) startIndex = 0;

  const hourly: HourlyPoint[] = data.hourly.time
    .slice(startIndex, startIndex + HOURS_AHEAD)
    .map((time, i) => {
      const index = startIndex + i;
      return {
        time,
        temperature: Math.round(data.hourly.temperature_2m[index]),
        precipProbability: data.hourly.precipitation_probability[index] ?? 0,
        weatherCode: data.hourly.weather_code[index],
        isDay: data.hourly.is_day[index] === 1,
      };
    });

  return {
    updatedAt: Date.now(),
    locationName: LOCATION.name,
    current: {
      temperature: Math.round(data.current.temperature_2m),
      apparentTemperature: Math.round(data.current.apparent_temperature),
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      humidity: Math.round(data.current.relative_humidity_2m),
      windSpeed: Math.round(data.current.wind_speed_10m),
    },
    today: {
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      precipProbabilityMax: data.daily.precipitation_probability_max[0] ?? 0,
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
    },
    hourly,
    rainWindows: findRainWindows(hourly),
  };
}
