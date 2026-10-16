import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Pause, Play, RefreshCw } from "lucide-react";
import { useGuestbook } from "../guestbook/GuestbookContext";
import "../styles/guestbook.css";

const ROTATION_INTERVAL_MS = 7_000;
const DOT_WINDOW_SIZE = 5;

export function GuestbookSection() {
  const { wishes, status, reload } = useGuestbook();
  const sectionRef = useRef<HTMLElement>(null);
  const [selection, setSelection] = useState<{ id: string; newestId: string } | null>(null);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  const activeIndex = selection?.newestId === wishes[0]?.id
    ? Math.max(0, wishes.findIndex((wish) => wish.id === selection?.id)) : 0;
  const activeWish = wishes[activeIndex];
  const rotating = wishes.length > 1 && visible && !paused && !interacting && !focused && !reducedMotion;

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media?.matches ?? false);
    media?.addEventListener("change", update);
    return () => media?.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => {
      setSelection({ id: wishes[(activeIndex + 1) % wishes.length].id, newestId: wishes[0].id });
    }, ROTATION_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [rotating, activeIndex, wishes]);

  const selectWish = (index: number) => {
    setPaused(true);
    setSelection({ id: wishes[(index + wishes.length) % wishes.length].id, newestId: wishes[0].id });
  };
  const firstDot = Math.min(Math.max(0, activeIndex - 2), Math.max(0, wishes.length - DOT_WINDOW_SIZE));

  return (
    <section
      id="ucapan-tetamu"
      ref={sectionRef}
      tabIndex={-1}
      className="design-d-guestbook"
      aria-labelledby="guestbook-title"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <Heart className="guestbook-heart" aria-hidden="true" />
      <h2 id="guestbook-title">Ucapan Tetamu</h2>
      <p className="guestbook-caption">Doa dan ingatan daripada yang tersayang</p>

      {status === "loading" && !activeWish && <p role="status">Memuatkan ucapan…</p>}
      {status === "error" && (
        <div className="guestbook-state" role="status">
          <p>Ucapan belum dapat dimuatkan.</p>
          <button type="button" onClick={reload}><RefreshCw aria-hidden="true" /> Cuba lagi</button>
        </div>
      )}
      {status === "ready" && !activeWish && <p>Jadilah yang pertama menitipkan ucapan melalui RSVP.</p>}

      {activeWish && (
        <div role="region" aria-roledescription="karusel" aria-label="Ucapan daripada tetamu">
          <div className="guestbook-stage" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
            <article className="guestbook-slide" key={activeWish.id} aria-label={`Ucapan ${activeIndex + 1} daripada ${wishes.length}`}>
              <blockquote>{activeWish.message}</blockquote>
              <p className="guestbook-author">{activeWish.name}</p>
            </article>
          </div>
          {wishes.length > 1 && (
            <>
              <div className="guestbook-controls">
                <button type="button" aria-label="Ucapan sebelumnya" onClick={() => selectWish(activeIndex - 1)}>
                  <ChevronLeft aria-hidden="true" />
                </button>
                <div className="guestbook-dots" aria-label="Pilih ucapan">
                  {wishes.slice(firstDot, firstDot + DOT_WINDOW_SIZE).map((wish, offset) => {
                    const index = firstDot + offset;
                    return (
                      <button type="button" key={wish.id} aria-label={`Lihat ucapan ${index + 1}`}
                        aria-current={index === activeIndex ? "true" : undefined}
                        onClick={() => selectWish(index)}><span /></button>
                    );
                  })}
                </div>
                <button type="button" aria-label="Ucapan seterusnya" onClick={() => selectWish(activeIndex + 1)}>
                  <ChevronRight aria-hidden="true" />
                </button>
              </div>
              <div className="guestbook-playback">
                <span>{activeIndex + 1} / {wishes.length}</span>
                {!reducedMotion && (
                  <button type="button" aria-label={paused ? "Mainkan pertukaran ucapan" : "Jeda pertukaran ucapan"}
                    onClick={() => setPaused((current) => !current)}>
                    {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
