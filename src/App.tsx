import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays, Clipboard, Gift, Heart, MapPin, MessageCircle,
  Navigation, Phone, Share2, X,
} from "lucide-react";
import { wedding } from "./data/wedding";
import { WishesPanel } from "./components/WishesPanel";
import { downloadCalendar } from "./utils/calendar";
import { getGuestName } from "./utils/guest";

type PanelName = "contact" | "location" | "gift" | "wishes";
const FOCUSABLE_SELECTOR = "a[href], button:not([disabled]), input:not([disabled]):not([tabindex='-1']), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";
const isConfigured = (value: string) => Boolean(value && !value.includes("PLACEHOLDER"));

function wasInvitationOpened() {
  try {
    return sessionStorage.getItem("invitation-opened") === "true";
  } catch {
    return false;
  }
}

function Panel({ title, close, children }: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusableElements = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      );
      const first = focusableElements[0];
      const last = focusableElements.at(-1);
      if (!first || !last) return;

      if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [close]);

  return <div className="panel-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget) close();
  }}>
    <section ref={panelRef} className="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
      <div className="panel-handle" aria-hidden="true" />
      <header>
        <div><small>Erni & Amirul</small><h2 id="panel-title">{title}</h2></div>
        <button ref={closeRef} onClick={close} aria-label={`Tutup ${title}`}><X /></button>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  </div>;
}

function ActionLink({ href, icon, children }: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!href) return <button className="panel-action" disabled>{icon}{children}</button>;
  const opensNewTab = /^https?:\/\//.test(href);
  return <a
    className="panel-action"
    href={href}
    {...(opensNewTab ? { target: "_blank", rel: "noreferrer" } : {})}
  >{icon}{children}</a>;
}

export default function App() {
  const [opened, setOpened] = useState(wasInvitationOpened);
  const [opening, setOpening] = useState(false);
  const [panel, setPanel] = useState<PanelName | null>(null);
  const [toast, setToast] = useState("");
  const [guest] = useState(() => getGuestName(window.location.search));
  const openingTimerRef = useRef<number | undefined>(undefined);
  const toastTimerRef = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2400);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(openingTimerRef.current);
    window.clearTimeout(toastTimerRef.current);
  }, []);

  const openInvitation = () => {
    if (opening) return;
    setOpening(true);
    const openDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420;
    openingTimerRef.current = window.setTimeout(() => {
      try {
        sessionStorage.setItem("invitation-opened", "true");
      } catch {
        // The invitation still opens when storage is unavailable.
      }
      setOpened(true);
      requestAnimationFrame(() => document.getElementById("jemputan")?.scrollIntoView());
    }, openDelay);
  };

  const closePanel = useCallback(() => setPanel(null), []);

  const copyAccountNumber = async (accountNumber: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(accountNumber);
      showToast("Nombor akaun telah disalin");
    } catch {
      showToast("Nombor akaun tidak dapat disalin");
    }
  };

  const share = async () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.delete("to");
    const publicShareUrl = shareUrl.toString();
    const data = { title: wedding.event.title, text: wedding.sharing.whatsappText, url: publicShareUrl };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(publicShareUrl);
        showToast("Pautan jemputan telah disalin");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") showToast("Pautan tidak dapat dikongsi");
    }
  };

  return <div className="invitation-app">
    {!opened && <div className={`opening-cover ${opening ? "is-opening" : ""}`}>
      <div className="opening-card">
        <div className="opening-monogram" aria-hidden="true"><span>E</span><i>&</i><span>A</span></div>
        <span>Jemputan Walimatul Urus</span>
        <p className="opening-intro">Dengan penuh kesyukuran, kami menjemput anda meraikan hari bahagia kami.</p>
        <div className="guest-name"><small>Kepada</small><strong>{guest ?? "Tetamu yang dihormati"}</strong></div>
        <button onClick={openInvitation} disabled={opening}>Buka Jemputan <Heart aria-hidden="true" /></button>
      </div>
    </div>}

    <main id="jemputan" className={opened ? "is-opened" : undefined} inert={!opened || panel !== null}>
      <section className="invite-page title-page">
        <div className="page-content vellum-card">
          <p className="kicker">Walimatul Urus</p>
          <p className="theme-line">{wedding.couple.theme}</p>
          <h1><span>{wedding.couple.bride}</span><i>&</i><span>{wedding.couple.groom}</span></h1>
          <div className="gold-rule" />
          <div className="hero-meta">
            <time dateTime="2026-12-26">26 Disember 2026</time>
            <strong>{wedding.event.venue}</strong>
          </div>
          <p className="quote">“Dengan izin Allah, dua hati disatukan dalam sebuah ikatan.”</p>
          <button className="share-button" onClick={share}><Share2 aria-hidden="true" /> Kongsi Jemputan</button>
        </div>
      </section>

      <section className="invite-page formal-page">
        <div className="page-content formal-sheet">
          <p className="arabic" lang="ar" dir="rtl">{wedding.invitation.bismillah}</p>
          <p>Assalamualaikum warahmatullahi wabarakatuh</p>
          <p>{wedding.invitation.preface}</p>
          <div className="parent-names">
            <strong>{wedding.parents.bride}</strong>
            <i>&</i>
            <strong>{wedding.parents.groom}</strong>
          </div>
          <p>{wedding.invitation.request}</p>
          <div className="formal-couple">
            <strong>{wedding.couple.bride}</strong><i>&</i><strong>{wedding.couple.groom}</strong>
          </div>
          <p className="blessing">{wedding.invitation.blessing}</p>
        </div>
      </section>

      <section className="photo-interlude" aria-label="Erni dan Amirul">
        <figure>
          <img
            src={wedding.images.hero}
            alt="Erni dan Amirul bersama pada hari pertunangan"
            width="960"
            height="1280"
            loading="lazy"
            decoding="async"
          />
          <figcaption>
            <small>Erni & Amirul</small>
            <strong>Menuju hari bahagia</strong>
            <time dateTime="2026-12-26">26 · 12 · 2026</time>
          </figcaption>
        </figure>
      </section>

      <section className="invite-page details-page">
        <div className="page-content event-sheet">
          <h2>Butiran Majlis</h2>
          <dl className="event-facts">
            <div><dt>Tempat</dt><dd>{wedding.event.venue}<small>{wedding.event.address}</small></dd></div>
            <div><dt>Tarikh</dt><dd>{wedding.event.day}, {wedding.event.date}</dd></div>
            <div><dt>Waktu</dt><dd>{wedding.event.time}</dd></div>
            {isConfigured(wedding.event.dressCode)
              ? <div><dt>Tema Busana</dt><dd>{wedding.event.dressCode}</dd></div>
              : null}
          </dl>
          <button className="calendar-button" onClick={() => {
            if (!downloadCalendar()) showToast("Kalendar belum dapat dijana");
          }}><CalendarDays /> Simpan Tarikh</button>
          <div className="programme-card">
            <h3>Atur Cara Majlis</h3>
            {wedding.itinerary.map((item) => <div key={`${item.time}-${item.title}`}>
              <strong>{item.title}</strong><time>{item.time}</time>
            </div>)}
          </div>
        </div>
      </section>

      <section className="invite-page prayer-page">
        <div className="page-content closing-vellum">
          <p className="prayer">Ya Allah, berkatilah majlis perkahwinan ini. Limpahkanlah barakah dan rahmat kepada kedua mempelai. Kurniakanlah mereka zuriat yang soleh dan solehah, kekalkanlah jodoh mereka di dunia dan di akhirat, serta sempurnakanlah agama mereka dengan berkat ikatan ini.</p>
          <Heart className="prayer-heart" />
          <h2>Terima Kasih</h2>
          <p>{wedding.closing.thanks}</p>
          <strong className="closing-names">{wedding.couple.shortNames}</strong>
          <span>Jumpa anda di sana</span>
        </div>
      </section>
    </main>

    {opened && <nav className="bottom-menu" aria-label="Menu utama" inert={panel !== null}>
      <button onClick={() => setPanel("contact")}><Phone /><span>Hubungi</span></button>
      <button onClick={() => setPanel("location")}><MapPin /><span>Lokasi</span></button>
      <button onClick={() => setPanel("gift")}><Gift /><span>Hadiah</span></button>
      <button onClick={() => setPanel("wishes")}><MessageCircle /><span>Ucapan</span></button>
    </nav>}

    {panel === "contact" && <Panel title="Hubungi" close={closePanel}>
      <div className="contact-list">{wedding.contacts.map((contact) => {
        const number = contact.phone.replace(/\D/g, "");
        return <article key={contact.name}>
          <div><strong>{contact.name}</strong><span>{contact.role}</span></div>
          <div><ActionLink href={`tel:+${number}`} icon={<Phone />}>Panggil</ActionLink>
            <ActionLink href={`https://wa.me/${number}`} icon={<MessageCircle />}>WhatsApp</ActionLink></div>
        </article>;
      })}</div>
    </Panel>}

    {panel === "location" && <Panel title="Lokasi" close={closePanel}>
      <div className="location-panel"><MapPin /><h3>{wedding.event.venue}</h3><p>{wedding.event.address}</p>
        <div><ActionLink href={wedding.links.maps} icon={<MapPin />}>Google Maps</ActionLink>
          <ActionLink href={wedding.links.waze} icon={<Navigation />}>Waze</ActionLink></div>
      </div>
    </Panel>}

    {panel === "gift" && <Panel title="Hadiah" close={closePanel}>
      <p className="panel-note">{wedding.gifts.message}</p>
      <div className="gift-list">{wedding.gifts.accounts.map((account) => <article key={account.label}>
        <h3>{account.label}</h3>
        {account.duitNowQr
          ? <img src={account.duitNowQr} alt={`Kod QR DuitNow ${account.label}`} />
          : <div className="qr-empty">Kod QR akan ditambah kemudian</div>}
        {isConfigured(account.bank) && <span>{account.bank}</span>}
        <strong>{account.accountHolder}</strong>
        {isConfigured(account.accountNumber) && <><code>{account.accountNumber}</code>
          <button onClick={() => copyAccountNumber(account.accountNumber)}>
            <Clipboard /> Salin nombor akaun
          </button></>}
      </article>)}</div>
    </Panel>}

    {panel === "wishes" && <Panel title="Ucapan" close={closePanel}>
      <WishesPanel apiUrl={wedding.wishes.apiUrl} message={wedding.wishes.message} />
    </Panel>}

    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
