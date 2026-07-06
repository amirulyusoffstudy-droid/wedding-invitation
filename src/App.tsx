import { useEffect, useRef, useState } from "react";
import {
  CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clipboard, Gift, Heart,
  MapPin, Menu, MessageCircle, Music, Pause, Phone, Share2, X
} from "lucide-react";
import { wedding } from "./data/wedding";
import { calendarReady, downloadCalendar, googleCalendarUrl } from "./utils/calendar";
import { getGuestName } from "./utils/guest";

function Countdown() {
  const target = new Date(wedding.dates.weddingIso).getTime();
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const id = window.setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000);
    return () => window.clearInterval(id);
  }, [target]);
  if (!remaining) return <p className="countdown-finished">Lembaran baharu kami telah bermula.</p>;
  const units = [
    ["Hari", Math.floor(remaining / 86400000)],
    ["Jam", Math.floor((remaining / 3600000) % 24)],
    ["Minit", Math.floor((remaining / 60000) % 60)],
    ["Saat", Math.floor((remaining / 1000) % 60)],
  ];
  return <div className="countdown" aria-label="Kiraan detik menuju hari perkahwinan">{units.map(([label, value]) =>
    <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}</div>;
}

function ActionLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  if (!href) return <button className="action-link" disabled title={`${label} belum dikonfigurasi`}>{icon}<span>{label}</span></button>;
  return <a className="action-link" href={href} target="_blank" rel="noreferrer">{icon}<span>{label}</span></a>;
}

function Lightbox({ index, setIndex, close }: { index: number; setIndex: (n: number) => void; close: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef(0);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") setIndex((index - 1 + wedding.gallery.length) % wedding.gallery.length);
      if (event.key === "ArrowRight") setIndex((index + 1) % wedding.gallery.length);
    };
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = ""; previous?.focus(); };
  }, [close, index, setIndex]);
  const image = wedding.gallery[index];
  return <div className="lightbox" role="dialog" aria-modal="true" aria-label="Galeri foto"
    onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
    onTouchEnd={(e) => { const delta = e.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 50) setIndex(delta > 0 ? (index - 1 + wedding.gallery.length) % wedding.gallery.length : (index + 1) % wedding.gallery.length); }}>
    <button ref={closeRef} className="lightbox-close" onClick={close} aria-label="Tutup galeri"><X /></button>
    <button className="lightbox-prev" onClick={() => setIndex((index - 1 + wedding.gallery.length) % wedding.gallery.length)} aria-label="Foto sebelumnya"><ChevronLeft /></button>
    <figure><img src={image.src} alt={image.alt} /><figcaption>{index + 1} / {wedding.gallery.length}</figcaption></figure>
    <button className="lightbox-next" onClick={() => setIndex((index + 1) % wedding.gallery.length)} aria-label="Foto seterusnya"><ChevronRight /></button>
  </div>;
}

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return <header className="section-title"><span>{eyebrow}</span><h2>{children}</h2><i aria-hidden="true">❦</i></header>;
}

type QuickPanelName = "contact" | "location" | "gift" | "wishes";

function QuickPanel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [onClose]);

  return <div className="quick-panel-backdrop" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className="quick-panel" role="dialog" aria-modal="true" aria-labelledby="quick-panel-title">
      <div className="quick-panel-handle" aria-hidden="true" />
      <header>
        <div><span>Erni & Amirul</span><h2 id="quick-panel-title">{title}</h2></div>
        <button ref={closeRef} onClick={onClose} aria-label={`Tutup ${title}`}><X /></button>
      </header>
      <div className="quick-panel-content">{children}</div>
    </section>
  </div>;
}

export default function App() {
  const [opened, setOpened] = useState(() => sessionStorage.getItem("invitation-opened") === "true");
  const [opening, setOpening] = useState(false);
  const [guest] = useState(() => getGuestName(window.location.search));
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [playing, setPlaying] = useState(false);
  const [quickPanel, setQuickPanel] = useState<QuickPanelName | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicAvailable = wedding.features.music && wedding.music.enabled && Boolean(wedding.music.src);
  const maps = wedding.links.maps;
  const waze = wedding.links.waze;
  const phone = wedding.contacts[0]?.phone.replace(/\D/g, "") ?? "";
  const whatsapp = phone ? `https://wa.me/${phone}` : "";

  useEffect(() => {
    document.documentElement.dataset.opened = String(opened);
  }, [opened]);

  function openInvitation() {
    setOpening(true);
    window.setTimeout(() => {
      sessionStorage.setItem("invitation-opened", "true");
      setOpened(true);
      if (musicAvailable && sessionStorage.getItem("music-muted") !== "true") {
        audioRef.current?.play().then(() => setPlaying(true)).catch(() => undefined);
      }
      requestAnimationFrame(() => document.getElementById("home")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    }, 550);
  }

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().then(() => { setPlaying(true); sessionStorage.removeItem("music-muted"); }).catch(() => undefined);
    else { audio.pause(); setPlaying(false); sessionStorage.setItem("music-muted", "true"); }
  }

  async function share() {
    const data = { title: wedding.event.title, text: wedding.sharing.whatsappText, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(window.location.href); setToast("Pautan disalin"); }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") setToast("Tidak dapat berkongsi pautan");
    }
    window.setTimeout(() => setToast(""), 2500);
  }

  function addCalendar() {
    if (!downloadCalendar()) { setToast("Tetapkan masa mula dan tamat dalam wedding.ts dahulu"); window.setTimeout(() => setToast(""), 3000); }
  }

  return <div className="app">
    {!opened && <div className={`cover ${opening ? "opening" : ""}`}>
      <div className="cover-photo" aria-hidden="true" style={{ backgroundImage: `linear-gradient(rgba(27,24,58,.3), rgba(28,25,62,.78)), url("${wedding.images.hero}")` }} />
      <div className="fairytale-sparkles" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>✧</i></div>
      <div className="cover-card">
        <span className="cover-kicker">Walimatul Urus</span>
        <div className="ornament" aria-hidden="true">❦</div>
        <h1>{wedding.couple.shortNames}</h1>
        <p className="cover-date">{wedding.dates.weddingDisplay}</p>
        <div className="guest">
          <span>Kepada:</span>
          <strong>{guest ?? "Tetamu yang dihormati"}</strong>
        </div>
        <p>Dengan penuh kesyukuran, kami menjemput anda ke majlis perkahwinan kami.</p>
        <button className="primary-button" onClick={openInvitation}>Buka Jemputan <Heart size={17} /></button>
      </div>
    </div>}

    {musicAvailable && <><audio ref={audioRef} src={wedding.music.src} loop={wedding.music.loop} preload="none" />
      <button className="music-control" onClick={toggleMusic} aria-label={playing ? "Jeda muzik latar" : "Mainkan muzik latar"}>{playing ? <Pause /> : <Music />}</button></>}

    <header className="topbar">
      <a href="#home" className="monogram" aria-label="Erni and Amirul home">EA</a>
      <nav aria-label="Primary navigation">
        <a href="#invitation">Jemputan</a><a href="#story">Kisah Kami</a><a href="#details">Butiran</a>
      </nav>
      <button onClick={share} className="icon-button" aria-label="Kongsi jemputan"><Share2 /></button>
    </header>

    <main>
      <section id="home" className="hero">
        <img src={wedding.images.hero} alt="Erni dan Amirul pada hari pertunangan di bawah hiasan bunga biru dan ungu" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p>{wedding.couple.theme}</p>
          <h1>Erni <em>&</em> Amirul</h1>
          <span>{wedding.couple.openingLine}</span>
          <div className="hero-date">{wedding.dates.weddingDisplay}</div>
          <Countdown />
        </div>
        <a className="scroll-cue" href="#invitation"><span>Lihat Jemputan</span><ChevronDown /></a>
      </section>

      <section id="invitation" className="paper-section formal">
        <SectionTitle eyebrow="Dengan penuh kesyukuran">Walimatul Urus</SectionTitle>
        <p className="arabic" lang="ar" dir="rtl">{wedding.invitation.bismillah}</p>
        <p>{wedding.invitation.preface}</p>
        <div className="parents"><strong>{wedding.parents.bride}</strong><span>dan</span><strong>{wedding.parents.groom}</strong></div>
        <p>{wedding.invitation.request}</p>
        <div className="couple-names"><strong>{wedding.couple.bride}</strong><i>&</i><strong>{wedding.couple.groom}</strong></div>
        <p className="blessing">{wedding.invitation.blessing}</p>
      </section>

      <section id="details" className="section event-section">
        <SectionTitle eyebrow="Simpan tarikh ini">Butiran Majlis</SectionTitle>
        <div className="date-medallion"><span>26</span><div><strong>Disember</strong><small>2026</small></div></div>
        <div className="details-grid">
          <article><CalendarDays /><span>Hari & Tarikh</span><strong>{wedding.event.day}</strong><p>{wedding.event.date}</p></article>
          <article><Heart /><span>Masa</span><strong>{wedding.event.time}</strong><p>Waktu Malaysia (UTC+8)</p></article>
          <article><MapPin /><span>Lokasi</span><strong>{wedding.event.venue}</strong><p>{wedding.event.address}</p></article>
        </div>
        <dl className="mini-details"><div><dt>Kod pakaian</dt><dd>{wedding.event.dressCode}</dd></div><div><dt>Waktu majlis</dt><dd>{wedding.event.time}</dd></div></dl>
        <div className="action-row">
          <ActionLink href={maps} icon={<MapPin />} label="Google Maps" />
          <ActionLink href={waze} icon={<Menu />} label="Waze" />
          <button className="action-link" onClick={addCalendar}><CalendarDays /><span>Kalendar</span></button>
          <ActionLink href={whatsapp} icon={<MessageCircle />} label="WhatsApp" />
          <ActionLink href={phone ? `tel:+${phone}` : ""} icon={<Phone />} label="Panggil" />
        </div>
        {calendarReady() && <a className="text-link" href={googleCalendarUrl()} target="_blank" rel="noreferrer">Atau tambah melalui Google Calendar</a>}
      </section>

      <section className="section programme">
        <SectionTitle eyebrow="Susunan acara">Atur Cara Majlis</SectionTitle>
        <div className="timeline">{wedding.itinerary.map((item) => <article key={`${item.time}-${item.title}`}><time>{item.time}</time><i /><h3>{item.title}</h3></article>)}</div>
      </section>

      <section id="story" className="story section">
        <SectionTitle eyebrow="Kisah perjalanan kami">Kita Pernah Bertemu Sebelum Berkenalan</SectionTitle>
        <div className="story-layout"><div className="story-copy">{wedding.story.map((p, i) => <p key={i}>{p}</p>)}</div>
          <div className="story-image"><img loading="lazy" src={wedding.images.story} alt="Erni dan Amirul bersama di tepi air terjun" /></div></div>
        <div className="relationship-timeline">{wedding.timeline.map((item) => <article key={item.label}><span>{item.date}</span><h3>{item.label}</h3></article>)}</div>
      </section>

      {wedding.features.gallery && <section className="section gallery-section">
        <SectionTitle eyebrow="Kenangan tercipta">Galeri Kami</SectionTitle>
        <div className="gallery">{wedding.gallery.map((image, index) => <button key={index} onClick={() => setLightbox(index)} aria-label={`Buka foto: ${image.alt}`}>
          <img loading="lazy" src={image.src} alt={image.alt} style={{ objectPosition: image.position }} width="800" height={index === 0 ? "1100" : "700"} />
        </button>)}</div>
      </section>}

      <section id="wishes" className="rsvp section">
        <SectionTitle eyebrow="Titipkan doa">Ucapan Buat Pengantin</SectionTitle>
        <p>{wedding.wishes.message}</p>
        {wedding.wishes.formUrl ? <a className="primary-button" href={wedding.wishes.formUrl} target="_blank" rel="noreferrer">Tulis Ucapan <MessageCircle /></a>
          : <button className="primary-button" disabled>Borang ucapan akan dibuka kemudian</button>}
      </section>

      <section className="section contacts">
        <SectionTitle eyebrow="Kami sedia membantu">Hubungi Keluarga</SectionTitle>
        <div className="contact-grid">{wedding.contacts.map((contact) => {
          const number = contact.phone.replace(/\D/g, "");
          return <article key={contact.name}><h3>{contact.name}</h3><p>{contact.role}</p><div>
            <ActionLink href={number ? `tel:+${number}` : ""} icon={<Phone />} label="Panggil" />
            <ActionLink href={number ? `https://wa.me/${number}` : ""} icon={<MessageCircle />} label="WhatsApp" />
          </div></article>;
        })}</div>
      </section>

      {wedding.features.gifts && wedding.gifts.enabled && <section className="section gifts">
        <details><summary><Gift /> Hadiah <ChevronDown /></summary><div><p>{wedding.gifts.message}</p>
          {wedding.gifts.accounts.map((account) => <article className="gift-account" key={account.label}><h3>{account.label}</h3>
            {account.duitNowQr && <img loading="lazy" src={account.duitNowQr} alt={`Kod QR DuitNow ${account.label}`} />}
            <span>{account.bank}</span><strong>{account.accountHolder}</strong><code>{account.accountNumber}</code>
            <button onClick={() => navigator.clipboard.writeText(account.accountNumber)}><Clipboard /> Salin nombor akaun</button>
          </article>)}</div></details>
      </section>}

      <section className="section faq">
        <SectionTitle eyebrow="Maklumat berguna">Soalan Lazim</SectionTitle>
        <div>{wedding.faq.map((item) => <details key={item.question}><summary>{item.question}<ChevronDown /></summary><p>{item.answer}</p></details>)}</div>
      </section>

      <section className="closing">
        <img loading="lazy" src={wedding.images.closing} alt="Erni dan Amirul meraikan pertunangan mereka" />
        <div><p>{wedding.closing.line}</p><h2>{wedding.couple.shortNames}</h2><span>{wedding.closing.thanks}</span><strong>Jumpa anda di sana</strong></div>
      </section>
    </main>

    <footer><span>EA</span><p>© {new Date().getFullYear()} Erni & Amirul. Dibina dengan penuh kasih.</p></footer>

    {opened && <nav className="mobile-bar" aria-label="Menu pantas">
      <button onClick={() => setQuickPanel("contact")} aria-haspopup="dialog"><Phone /><span>Hubungi</span></button>
      <button onClick={() => setQuickPanel("location")} aria-haspopup="dialog"><MapPin /><span>Lokasi</span></button>
      <button onClick={() => setQuickPanel("gift")} aria-haspopup="dialog"><Gift /><span>Hadiah</span></button>
      <button onClick={() => setQuickPanel("wishes")} aria-haspopup="dialog"><MessageCircle /><span>Ucapan</span></button>
    </nav>}
    {quickPanel === "contact" && <QuickPanel title="Hubungi" onClose={() => setQuickPanel(null)}>
      <p className="panel-intro">Hubungi wakil keluarga sekiranya anda memerlukan bantuan mengenai majlis.</p>
      <div className="panel-contact-list">{wedding.contacts.map((contact) => {
        const number = contact.phone.replace(/\D/g, "");
        return <article key={contact.name}><div><strong>{contact.name}</strong><span>{contact.role}</span></div><div className="panel-actions">
          <ActionLink href={number ? `tel:+${number}` : ""} icon={<Phone />} label="Panggil" />
          <ActionLink href={number ? `https://wa.me/${number}` : ""} icon={<MessageCircle />} label="WhatsApp" />
        </div></article>;
      })}</div>
    </QuickPanel>}
    {quickPanel === "location" && <QuickPanel title="Lokasi Majlis" onClose={() => setQuickPanel(null)}>
      <div className="panel-event">
        <MapPin />
        <strong>{wedding.event.venue}</strong>
        <p>{wedding.event.address}</p>
        <dl><div><dt>Tarikh</dt><dd>{wedding.event.date}</dd></div><div><dt>Waktu</dt><dd>{wedding.event.time}</dd></div></dl>
      </div>
      <div className="panel-wide-actions">
        <ActionLink href={maps} icon={<MapPin />} label="Google Maps" />
        <ActionLink href={waze} icon={<Menu />} label="Waze" />
      </div>
    </QuickPanel>}
    {quickPanel === "gift" && <QuickPanel title="Hadiah" onClose={() => setQuickPanel(null)}>
      <div className="panel-gift">
        <Gift />
        <p>{wedding.gifts.message}</p>
        <div className="panel-gift-accounts">{wedding.gifts.accounts.map((account) => <article key={account.label}>
          <h3>{account.label}</h3>
          {account.duitNowQr
            ? <img src={account.duitNowQr} alt={`Kod QR DuitNow ${account.label}`} />
            : <div className="qr-placeholder">Kod QR {account.label.toLowerCase()} akan dipaparkan di sini</div>}
          <span>{account.bank}</span>
          <strong>{account.accountHolder}</strong>
          <code>{account.accountNumber}</code>
          <button className="copy-button" onClick={() => {
            navigator.clipboard.writeText(account.accountNumber);
            setToast("Nombor akaun disalin");
            window.setTimeout(() => setToast(""), 2500);
          }}><Clipboard /> Salin nombor akaun</button>
        </article>)}</div>
      </div>
    </QuickPanel>}
    {quickPanel === "wishes" && <QuickPanel title="Ucapan" onClose={() => setQuickPanel(null)}>
      <div className="panel-wishes">
        <Heart />
        <p>{wedding.wishes.message}</p>
        {wedding.wishes.formUrl
          ? <a className="primary-button" href={wedding.wishes.formUrl} target="_blank" rel="noreferrer">Tulis Ucapan <MessageCircle /></a>
          : <button className="primary-button" disabled>Borang ucapan akan dibuka kemudian</button>}
      </div>
    </QuickPanel>}
    {lightbox !== null && <Lightbox index={lightbox} setIndex={setLightbox} close={() => setLightbox(null)} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
