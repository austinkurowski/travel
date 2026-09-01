'use client';

import { useLiveData, useNow } from '@/hooks/useLiveData';
import { formatRelativeAge } from '@/lib/format';
import type { TransitPayload, WeatherPayload } from '@/lib/types';
import { DepartureBoard } from './DepartureBoard';
import { RainOutlook } from './RainOutlook';
import { WeatherCard } from './WeatherCard';

const TRANSIT_INTERVAL_MS = 20_000;
const WEATHER_INTERVAL_MS = 10 * 60_000;

function Skeleton({ className }: { className: string }) {
  return <div className={`card animate-pulse bg-ink-700/50 ${className}`} />;
}

function Banner({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/25">
      {message}
    </div>
  );
}

export function Dashboard() {
  const now = useNow(1000);
  const transit = useLiveData<TransitPayload>('/api/transit', TRANSIT_INTERVAL_MS);
  const weather = useLiveData<WeatherPayload>('/api/weather', WEATHER_INTERVAL_MS);

  const clock =
    now === null
      ? null
      : new Date(now).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/New_York',
        });

  const isLive = transit.error === null && transit.lastUpdated !== null;
  const boardsReady = transit.data !== null && now !== null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bed-Stuy Live</h1>
          <p className="mt-1 text-sm text-slate-400">Weather and real-time departures near Nostrand Ave</p>
        </div>
        <div className="text-right">
          <div className="tnum text-2xl font-light tabular-nums text-slate-200">{clock ?? '\u2014'}</div>
          <div className="mt-1 flex items-center justify-end gap-2 text-xs text-slate-500">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isLive ? 'animate-pulseDot bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            <span>
              {transit.lastUpdated && now !== null
                ? `Updated ${formatRelativeAge(now - transit.lastUpdated)}`
                : 'Connecting…'}
            </span>
            <button
              type="button"
              onClick={transit.refresh}
              className="rounded-md px-2 py-0.5 text-slate-400 ring-1 ring-inset ring-white/10 transition hover:bg-white/5 hover:text-slate-200"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {weather.error && <Banner message={`Weather unavailable — ${weather.error}`} />}
        {transit.error && <Banner message={`Transit feed unavailable — ${transit.error}`} />}
        {transit.data?.errors.map((message) => (
          <Banner key={message} message={message} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {weather.data ? (
          <>
            <WeatherCard weather={weather.data} />
            <RainOutlook weather={weather.data} />
          </>
        ) : (
          <>
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </>
        )}
      </div>

      <h2 className="mb-4 mt-10 text-sm font-semibold uppercase tracking-widest text-slate-400">Next departures</h2>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {boardsReady
          ? transit.data!.boards.map((board) => <DepartureBoard key={board.id} board={board} now={now!} />)
          : Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-56" />)}
      </div>

      <footer className="mt-12 text-xs leading-relaxed text-slate-600">
        Departures from MTA GTFS-Realtime feeds, refreshed every {TRANSIT_INTERVAL_MS / 1000}s. Weather from
        Open-Meteo, refreshed every {WEATHER_INTERVAL_MS / 60_000} min.
      </footer>
    </main>
  );
}
