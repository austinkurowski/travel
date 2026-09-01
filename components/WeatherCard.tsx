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
    <section className="card p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 sm:text-sm">
            {weather.locationName}
          </h2>
          <div className="mt-2 flex items-end gap-2 sm:mt-3 sm:gap-3">
            <span className="tnum text-5xl font-light leading-none tracking-tight sm:text-7xl">
              {current.temperature}°
            </span>
            <span className="pb-1 text-base text-slate-300 sm:pb-2 sm:text-lg">{conditions.label}</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400 sm:mt-2 sm:text-sm">Feels like {current.apparentTemperature}°</p>
        </div>
        <WeatherIcon
          kind={conditions.kind}
          isDay={current.isDay}
          className="h-12 w-12 shrink-0 text-sky-300 sm:h-16 sm:w-16"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-white/10 pt-4 sm:mt-6 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-5 sm:pt-5">
        <Stat label="High" value={`${today.high}°`} />
        <Stat label="Low" value={`${today.low}°`} />
        <Stat label="Humidity" value={`${current.humidity}%`} />
        <Stat label="Wind" value={`${current.windSpeed} mph`} />
      </div>

      <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-1">
        <span>Sunrise {formatClockLabel(today.sunrise)}</span>
        <span>Sunset {formatClockLabel(today.sunset)}</span>
      </div>
    </section>
  );
}
