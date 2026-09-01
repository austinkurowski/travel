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
    <section className="card p-4 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 sm:text-sm">Chance of rain</h2>
        <span className="tnum text-xs text-slate-400 sm:text-sm">{today.precipProbabilityMax}% peak today</span>
      </div>

      {rainWindows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-300 sm:mt-4">No rain expected in the next {hourly.length} hours.</p>
      ) : (
        <ul className="mt-3 space-y-2 sm:mt-4">
          {rainWindows.map((window) => (
            <li
              key={window.startsAt}
              className="flex flex-col gap-0.5 rounded-xl bg-sky-500/10 px-3 py-2 ring-1 ring-inset ring-sky-400/25 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2.5"
            >
              <span className="text-sm font-medium text-sky-100 sm:text-base">
                {formatHourRange(window.startsAt, window.endsAt)}
              </span>
              <span className="tnum text-xs text-sky-200 sm:text-sm">{window.peakProbability}% chance</span>
            </li>
          ))}
        </ul>
      )}

      <div className="scroll-strip mt-4 sm:mt-6">
        <div className="flex min-w-max gap-0.5 px-1 sm:gap-1">
          {hourly.map((hour, index) => (
            <div key={hour.time} className="flex w-9 shrink-0 flex-col items-center gap-1 sm:w-11 sm:gap-1.5">
              <span className="tnum text-[10px] text-slate-400 sm:text-[11px]">{hour.precipProbability}%</span>
              <div className="flex h-16 w-full items-end rounded-md bg-white/5 sm:h-20">
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
