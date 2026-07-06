import { useEffect, useRef, useState } from "react";
import {
  CalendarDays, Clipboard, Gift, Heart, MapPin, MessageCircle,
  Navigation, Phone, Share2, X,
} from "lucide-react";
import { wedding } from "./data/wedding";
import { downloadCalendar } from "./utils/calendar";
import { getGuestName } from "./utils/guest";

type PanelName = "contact" | "location" | "gift" | "wishes";
const isConfigured = (value: string) => Boolean(value && !value.includes("PLACEHOLDER"));

function BotanicalFrame() {
  return <div className="botanical-frame" aria-hidden="true">
    <div className="botanical botanical-top">❀ <i>✤</i> ❁</div>
    <div className="botanical botanical-left">⌇<i>❀</i>⌇</div>
    <div className="botanical botanical-right">⌇<i>❁</i>⌇</div>
    <div className="botanical botanical-bottom">❁ <i>✤</i> ❀</div>
  </div>;
}

function Panel({ title, close, children }: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [close]);

  return <div className="panel-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget) close();
  }}>
    <section className="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
      <div className="panel-handle" />
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
  return <a className="panel-action" href={href} target="_blank" rel="noreferrer">{icon}{children}</a>;
}

export default function App() {
  const [opened, setOpened] = useState(() => sessionStorage.getItem("invitation-opened") === "true");
  const [opening, setOpening] = useState(false);
  const [panel, setPanel] = useState<PanelName | null>(null);
  const [toast, setToast] = useState("");
  const [guest] = useState(() => getGuestName(window.location.search));

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const openInvitation = () => {
    setOpening(true);
    window.setTimeout(() => {
      sessionStorage.setItem("invitation-opened", "true");
      setOpened(true);
      requestAnimationFrame(() => document.getElementById("jemputan")?.scrollIntoView());
    }, 420);
  };

  const share = async () => {
    const data = { title: wedding.event.title, text: wedding.sharing.whatsappText, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Pautan jemputan telah disalin");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") showToast("Pautan tidak dapat dikongsi");
    }
  };

  return <div className="invitation-app">
    {!opened && <div className={`opening-cover ${opening ? "is-opening" : ""}`}>
      <BotanicalFrame />
      <div className="opening-card">
        <span>Walimatul Urus</span>
        <h1>Erni <i>&</i> Amirul</h1>
        <p className="opening-date">26 Disember 2026</p>
        <div className="guest-name"><small>Kepada</small><strong>{guest ?? "Tetamu yang dihormati"}</strong></div>
        <button onClick={openInvitation}>Buka Jemputan <Heart /></button>
      </div>
    </div>}

    <main id="jemputan">
      <section className="invite-page title-page">
        <BotanicalFrame />
        <div className="page-content">
          <p className="kicker">Walimatul Urus</p>
          <p className="theme-line">{wedding.couple.theme}</p>
          <h1>{wedding.couple.bride}<i>&</i>{wedding.couple.groom}</h1>
          <div className="gold-rule" />
          <time>26 Disember 2026</time>
          <strong>{wedding.event.venue}</strong>
          <p className="quote">“Dengan izin Allah, dua hati disatukan dalam sebuah ikatan.”</p>
          <button className="share-button" onClick={share}><Share2 /> Kongsi Jemputan</button>
        </div>
      </section>

      <section className="invite-page formal-page">
        <BotanicalFrame />
        <div className="page-content">
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

      <section className="invite-page details-page">
        <BotanicalFrame />
        <div className="page-content">
          <h2>Butiran Majlis</h2>
          <dl className="event-facts">
            <div><dt>Tempat</dt><dd>{wedding.event.venue}<small>{wedding.event.address}</small></dd></div>
            <div><dt>Tarikh</dt><dd>{wedding.event.day}, {wedding.event.date}</dd></div>
            <div><dt>Waktu</dt><dd>{wedding.event.time}</dd></div>
            <div><dt>Tema Busana</dt><dd>{wedding.event.dressCode}</dd></div>
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
        <BotanicalFrame />
        <div className="page-content">
          <p className="prayer">Ya Allah, berkatilah majlis perkahwinan ini. Limpahkanlah barakah dan rahmat kepada kedua mempelai. Kurniakanlah mereka zuriat yang soleh dan solehah, kekalkanlah jodoh mereka di dunia dan di akhirat, serta sempurnakanlah agama mereka dengan berkat ikatan ini.</p>
          <Heart className="prayer-heart" />
          <h2>Terima Kasih</h2>
          <p>{wedding.closing.thanks}</p>
          <strong className="closing-names">{wedding.couple.shortNames}</strong>
          <span>Jumpa anda di sana</span>
        </div>
      </section>
    </main>

    {opened && <nav className="bottom-menu" aria-label="Menu utama">
      <button onClick={() => setPanel("contact")}><Phone /><span>Hubungi</span></button>
      <button onClick={() => setPanel("location")}><MapPin /><span>Lokasi</span></button>
      <button onClick={() => setPanel("gift")}><Gift /><span>Hadiah</span></button>
      <button onClick={() => setPanel("wishes")}><MessageCircle /><span>Ucapan</span></button>
    </nav>}

    {panel === "contact" && <Panel title="Hubungi" close={() => setPanel(null)}>
      <div className="contact-list">{wedding.contacts.map((contact) => {
        const number = contact.phone.replace(/\D/g, "");
        return <article key={contact.name}>
          <div><strong>{contact.name}</strong><span>{contact.role}</span></div>
          <div><ActionLink href={`tel:+${number}`} icon={<Phone />}>Panggil</ActionLink>
            <ActionLink href={`https://wa.me/${number}`} icon={<MessageCircle />}>WhatsApp</ActionLink></div>
        </article>;
      })}</div>
    </Panel>}

    {panel === "location" && <Panel title="Lokasi" close={() => setPanel(null)}>
      <div className="location-panel"><MapPin /><h3>{wedding.event.venue}</h3><p>{wedding.event.address}</p>
        <div><ActionLink href={wedding.links.maps} icon={<MapPin />}>Google Maps</ActionLink>
          <ActionLink href={wedding.links.waze} icon={<Navigation />}>Waze</ActionLink></div>
      </div>
    </Panel>}

    {panel === "gift" && <Panel title="Hadiah" close={() => setPanel(null)}>
      <p className="panel-note">{wedding.gifts.message}</p>
      <div className="gift-list">{wedding.gifts.accounts.map((account) => <article key={account.label}>
        <h3>{account.label}</h3>
        {account.duitNowQr
          ? <img src={account.duitNowQr} alt={`Kod QR DuitNow ${account.label}`} />
          : <div className="qr-empty">Kod QR akan ditambah kemudian</div>}
        {isConfigured(account.bank) && <span>{account.bank}</span>}
        <strong>{account.accountHolder}</strong>
        {isConfigured(account.accountNumber) && <><code>{account.accountNumber}</code>
          <button onClick={() => {
            navigator.clipboard.writeText(account.accountNumber);
            showToast("Nombor akaun telah disalin");
          }}><Clipboard /> Salin nombor akaun</button></>}
      </article>)}</div>
    </Panel>}

    {panel === "wishes" && <Panel title="Ucapan" close={() => setPanel(null)}>
      <div className="wishes-panel"><Heart /><p>{wedding.wishes.message}</p>
        {wedding.wishes.formUrl
          ? <a href={wedding.wishes.formUrl} target="_blank" rel="noreferrer">Tulis Ucapan</a>
          : <button disabled>Borang ucapan akan dibuka kemudian</button>}
      </div>
    </Panel>}

    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
