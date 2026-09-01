import type { WeatherKind } from '@/lib/format';

const CLOUD = 'M6.8 18.5h10.4a3.7 3.7 0 0 0 .3-7.39 6 6 0 0 0-11.44-1.3A3.85 3.85 0 0 0 6.8 18.5Z';

const SUN_RAYS = [
  'M12 2.5v2',
  'M12 19.5v2',
  'M2.5 12h2',
  'M19.5 12h2',
  'M5.2 5.2l1.4 1.4',
  'M17.4 17.4l1.4 1.4',
  'M18.8 5.2l-1.4 1.4',
  'M6.6 17.4l-1.4 1.4',
];

function Drops({ paths }: { paths: string[] }) {
  return (
    <>
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </>
  );
}

export function WeatherIcon({
  kind,
  isDay = true,
  className = 'h-10 w-10',
}: {
  kind: WeatherKind;
  isDay?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {kind === 'clear' &&
        (isDay ? (
          <>
            <circle cx="12" cy="12" r="4.2" />
            <Drops paths={SUN_RAYS} />
          </>
        ) : (
          <path d="M20.5 14.6A8.2 8.2 0 0 1 9.4 3.5a7.7 7.7 0 1 0 11.1 11.1Z" />
        ))}

      {kind === 'partly' && (
        <>
          {isDay ? <circle cx="8.5" cy="7.5" r="3" /> : <path d="M11.6 8.3A4.6 4.6 0 0 1 7 3.7a4.3 4.3 0 1 0 4.6 4.6Z" />}
          <path d={CLOUD} />
        </>
      )}

      {kind === 'cloudy' && (
        <>
          <path d={CLOUD} />
          <path d="M8.6 8.2A5 5 0 0 1 15.9 6" opacity={0.5} />
        </>
      )}

      {kind === 'fog' && (
        <>
          <path d="M6.8 15.5h10.4a3.7 3.7 0 0 0 .3-7.39 6 6 0 0 0-11.44-1.3A3.85 3.85 0 0 0 6.8 15.5Z" />
          <Drops paths={['M4 18.8h16', 'M6.5 21.5h11']} />
        </>
      )}

      {kind === 'drizzle' && (
        <>
          <path d="M6.8 15.5h10.4a3.7 3.7 0 0 0 .3-7.39 6 6 0 0 0-11.44-1.3A3.85 3.85 0 0 0 6.8 15.5Z" />
          <Drops paths={['M9 18.4v1.4', 'M12 18.8v1.8', 'M15 18.4v1.4']} />
        </>
      )}

      {kind === 'rain' && (
        <>
          <path d="M6.8 15.5h10.4a3.7 3.7 0 0 0 .3-7.39 6 6 0 0 0-11.44-1.3A3.85 3.85 0 0 0 6.8 15.5Z" />
          <Drops paths={['M8.6 18.2l-1 3', 'M12.4 18.2l-1 3', 'M16.2 18.2l-1 3']} />
        </>
      )}

      {kind === 'snow' && (
        <>
          <path d="M6.8 15.5h10.4a3.7 3.7 0 0 0 .3-7.39 6 6 0 0 0-11.44-1.3A3.85 3.85 0 0 0 6.8 15.5Z" />
          <Drops paths={['M9 19.4h.01', 'M12 21h.01', 'M15 19.4h.01', 'M12 18.4h.01']} />
        </>
      )}

      {kind === 'thunder' && (
        <>
          <path d="M6.8 14.5h10.4a3.7 3.7 0 0 0 .3-7.39 6 6 0 0 0-11.44-1.3A3.85 3.85 0 0 0 6.8 14.5Z" />
          <path d="M13.2 16.4l-3 3.6h3l-1 3.2" />
        </>
      )}
    </svg>
  );
}
