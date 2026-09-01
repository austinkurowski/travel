import { formatHourLabel, formatHourRange } from '@/lib/format';
import type { WeatherPayload } from '@/lib/types';

function barColor(probability: number): string {
  if (probability >= 70) return 'bg-sky-400';
  if (probability >= 40) return 'bg-sky-500/80';
  if (probability >= 15) return 'bg-sky-600/60';
  return 'bg-white/10';
}

export function RainOutlook({ weather }: { weather: WeatherPayload }) {
  const { rainWindows, hourly, today } = weather;

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Chance of rain</h2>
        <span className="tnum text-sm text-slate-400">{today.precipProbabilityMax}% peak today</span>
      </div>

      {rainWindows.length === 0 ? (
        <p className="mt-4 text-slate-300">No rain expected in the next {hourly.length} hours.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rainWindows.map((window) => (
            <li
              key={window.startsAt}
              className="flex items-center justify-between rounded-xl bg-sky-500/10 px-4 py-2.5 ring-1 ring-inset ring-sky-400/25"
            >
              <span className="font-medium text-sky-100">{formatHourRange(window.startsAt, window.endsAt)}</span>
              <span className="tnum text-sm text-sky-200">{window.peakProbability}% chance</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 -mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-1 px-1">
          {hourly.map((hour, index) => (
            <div key={hour.time} className="flex w-11 shrink-0 flex-col items-center gap-1.5">
              <span className="tnum text-[11px] text-slate-400">{hour.precipProbability}%</span>
              <div className="flex h-20 w-full items-end rounded-md bg-white/5">
                <div
                  className={`w-full rounded-md transition-all duration-500 ${barColor(hour.precipProbability)}`}
                  style={{ height: `${Math.max(hour.precipProbability, 3)}%` }}
                />
              </div>
              <span className="tnum text-[11px] text-slate-500">{hour.temperature}°</span>
              <span className="whitespace-nowrap text-[10px] uppercase tracking-wide text-slate-500">
                {index === 0 ? 'Now' : formatHourLabel(hour.time).replace(' ', '')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
