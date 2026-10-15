import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]):not([tabindex='-1']), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

interface PanelProps {
  title: string;
  close: () => void;
  children: ReactNode;
}

export function Panel({ title, close, children }: PanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
          [],
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);
      if (!firstElement || !lastElement) return;

      if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [close]);

  return (
    <div
      className="panel-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={panelRef}
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
      >
        <div className="panel-handle" aria-hidden="true" />
        <header>
          <div>
            <small>Erni &amp; Amirul</small>
            <h2 id="panel-title">{title}</h2>
          </div>
          <button ref={closeRef} onClick={close} aria-label={`Tutup ${title}`}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="panel-body">{children}</div>
      </section>
    </div>
  );
}

interface ActionLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

export function ActionLink({ href, icon, children }: ActionLinkProps) {
  if (!href) {
    return (
      <button className="panel-action" disabled>
        {icon}
        {children}
      </button>
    );
  }

  const opensNewTab = /^https?:\/\//.test(href);
  return (
    <a
      className="panel-action"
      href={href}
      {...(opensNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {icon}
      {children}
    </a>
  );
}
