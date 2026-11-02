"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/client";

/**
 * Small data hook: fetches `url` (null = idle) and re-fetches on an interval
 * while `pollMs` is greater than zero.
 */
export function useApi<T>(url: string | null, options: { pollMs?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));

  const pollRef = useRef(options.pollMs ?? 0);
  pollRef.current = options.pollMs ?? 0;
  const urlRef = useRef(url);
  urlRef.current = url;

  const refresh = useCallback(async () => {
    const target = urlRef.current;
    if (!target) {
      setLoading(false);
      return;
    }
    try {
      const result = await apiFetch<T>(target);
      setData(result);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(Boolean(url));
    void refresh();
  }, [url, refresh]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (pollRef.current > 0 && urlRef.current) void refresh();
    }, Math.max(2000, options.pollMs || 4000));
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  return { data, error, loading, refresh, setData };
}
