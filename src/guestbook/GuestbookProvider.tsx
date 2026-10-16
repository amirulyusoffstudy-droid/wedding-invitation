import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { GuestbookContext, type GuestbookState, type Wish } from "./GuestbookContext";

interface GuestbookProviderProps {
  apiUrl: string;
  enabled?: boolean;
  children: ReactNode;
}

export function GuestbookProvider({ apiUrl, enabled = true, children }: GuestbookProviderProps) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [status, setStatus] = useState<GuestbookState["status"]>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    requestRef.current = controller;
    let didTimeout = false;
    const timeout = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, 10_000);

    async function load() {
      setStatus("loading");
      try {
        const response = await fetch(apiUrl, { signal: controller.signal, cache: "no-store" });
        const result = await response.json() as { success: boolean; data?: Wish[] };
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error("Guestbook unavailable");
        }
        if (!controller.signal.aborted) {
          setWishes(result.data.filter((wish) => wish.id && wish.name && wish.message));
          setStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted || didTimeout) setStatus("error");
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void load();
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [apiUrl, enabled, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);
  const addWish = useCallback((wish: Wish) => {
    requestRef.current?.abort();
    setWishes((current) => [wish, ...current.filter((item) => item.id !== wish.id)]);
    setStatus("ready");
  }, []);

  return (
    <GuestbookContext.Provider value={{ apiUrl, wishes, status, reload, addWish }}>
      {children}
    </GuestbookContext.Provider>
  );
}
