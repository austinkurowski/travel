import { describeWeather, formatClockLabel } from '@/lib/format';
import type { WeatherPayload } from '@/lib/types';
import { WeatherIcon } from './WeatherIcon';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
      <div className="tnum mt-0.5 text-lg font-medium text-slate-100">{value}</div>
    </div>
  );
}

export function WeatherCard({ weather }: { weather: WeatherPayload }) {
  const { current, today } = weather;
  const conditions = describeWeather(current.weatherCode);

  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">{weather.locationName}</h2>
          <div className="mt-3 flex items-end gap-3">
            <span className="tnum text-7xl font-light leading-none tracking-tight">{current.temperature}°</span>
            <span className="pb-2 text-lg text-slate-300">{conditions.label}</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">Feels like {current.apparentTemperature}°</p>
        </div>
        <WeatherIcon kind={conditions.kind} isDay={current.isDay} className="h-16 w-16 shrink-0 text-sky-300" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-5 sm:grid-cols-4">
        <Stat label="High" value={`${today.high}°`} />
        <Stat label="Low" value={`${today.low}°`} />
        <Stat label="Humidity" value={`${current.humidity}%`} />
        <Stat label="Wind" value={`${current.windSpeed} mph`} />
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
        <span>Sunrise {formatClockLabel(today.sunrise)}</span>
        <span>Sunset {formatClockLabel(today.sunset)}</span>
      </div>
    </section>
  );
}
