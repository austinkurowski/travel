import { formatDepartureClock, minutesUntil } from '@/lib/format';
import type { Board, BoardStatus, Departure } from '@/lib/types';

const STATUS_STYLES: Record<BoardStatus, string> = {
  ok: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  delayed: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  'no-service': 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
  unknown: 'bg-slate-500/15 text-slate-300 ring-slate-400/30',
};

function RouteBadge({ board }: { board: Board }) {
  const shared = 'flex shrink-0 items-center justify-center font-bold shadow-sm';
  const style = { backgroundColor: board.routeColor, color: board.routeTextColor };

  if (board.mode === 'subway') {
    return (
      <span className={`${shared} h-11 w-11 rounded-full text-xl`} style={style}>
        {board.routeLabel}
      </span>
    );
  }
  return (
    <span className={`${shared} h-11 min-w-[3.25rem] rounded-lg px-2 text-sm tracking-tight`} style={style}>
      {board.routeLabel}
    </span>
  );
}

function DelayNote({ delaySeconds }: { delaySeconds: number }) {
  const minutes = Math.round(Math.abs(delaySeconds) / 60);
  if (delaySeconds >= 300) return <div className="text-[11px] text-amber-300">{minutes} min late</div>;
  if (delaySeconds <= -120) return <div className="text-[11px] text-sky-300">{minutes} min early</div>;
  return null;
}

function DepartureRow({ departure, now }: { departure: Departure; now: number }) {
  const minutes = minutesUntil(departure.time, now);
  const imminent = minutes <= 1;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="flex w-[4.5rem] shrink-0 items-baseline justify-end gap-1">
        <span
          className={`tnum text-2xl font-semibold leading-none ${
            imminent ? 'text-emerald-300' : 'text-slate-100'
          }`}
        >
          {minutes <= 0 ? 'Now' : minutes}
        </span>
        {minutes > 0 && <span className="text-xs text-slate-500">min</span>}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-slate-300">{departure.destination ?? 'Destination unknown'}</div>
        {departure.delaySeconds != null && <DelayNote delaySeconds={departure.delaySeconds} />}
      </div>

      <span className="tnum shrink-0 text-sm text-slate-400">{formatDepartureClock(departure.time)}</span>
    </li>
  );
}

export function DepartureBoard({ board, now }: { board: Board; now: number }) {
  const criticalAlerts = board.alerts.filter((a) => a.severity !== 'info').slice(0, 2);
  // When the note is just the alert's type, the alert text below already says it.
  const showNote = board.statusNote != null && !criticalAlerts.some((alert) => alert.type === board.statusNote);

  return (
    <article className="card flex flex-col p-5">
      <header className="flex items-start gap-3">
        <RouteBadge board={board} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-tight text-slate-100">{board.directionLabel}</h3>
          <p className="truncate text-sm text-slate-500">{board.stopName}</p>
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
            STATUS_STYLES[board.status]
          }`}
        >
          {board.statusLabel}
        </span>
      </header>

      {board.departures.length > 0 ? (
        <ul className="mt-3 divide-y divide-white/5 border-t border-white/10 pt-1">
          {board.departures.map((departure) => (
            <DepartureRow key={departure.tripId} departure={departure} now={now} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 border-t border-white/10 pt-4 text-sm text-slate-400">
          {board.statusNote ?? 'Nothing scheduled right now.'}
        </p>
      )}

      {board.departures.length > 0 && showNote && (
        <p className="mt-3 text-xs text-amber-300/90">{board.statusNote}</p>
      )}

      {criticalAlerts.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
          {criticalAlerts.map((alert) => (
            <li key={alert.id} className="text-xs leading-relaxed text-slate-400">
              <span className="mr-1.5 font-semibold uppercase tracking-wide text-slate-300">{alert.type}</span>
              {alert.text}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
