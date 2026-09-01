'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface LiveData<T> {
  data: T | null;
  error: string | null;
  isRefreshing: boolean;
  /** When the last successful response landed, or null before the first one. */
  lastUpdated: number | null;
  refresh: () => void;
}

/**
 * Polls an endpoint on an interval, and also whenever the tab regains focus so
 * a dashboard left open overnight is current the moment you look at it.
 * Polling pauses entirely while the tab is hidden.
 */
export function useLiveData<T>(url: string, intervalMs: number): LiveData<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const activeRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++activeRequest.current;
    setIsRefreshing(true);
    try {
      const response = await fetch(url, { cache: 'no-store' });
      const body = await response.json();
      if (requestId !== activeRequest.current) return;
      if (!response.ok) throw new Error(body?.error ?? `Request failed (${response.status})`);
      setData(body as T);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      if (requestId !== activeRequest.current) return;
      setError((err as Error).message);
    } finally {
      if (requestId === activeRequest.current) setIsRefreshing(false);
    }
  }, [url]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(load, intervalMs);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void load();
        start();
      } else {
        stop();
      }
    };

    void load();
    start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [load, intervalMs]);

  return { data, error, isRefreshing, lastUpdated, refresh: load };
}

/**
 * Ticks on an interval so "3 min" countdowns stay honest between fetches.
 *
 * Starts as null and only takes a value after mount: the clock would otherwise
 * render one time on the server and a different one at hydration, which React
 * reports as a text mismatch.
 */
export function useNow(intervalMs = 1000): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
