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
  if (!remaining) return <p className="countdown-finished">Our new chapter has begun.</p>;
  const units = [
    ["Days", Math.floor(remaining / 86400000)],
    ["Hours", Math.floor((remaining / 3600000) % 24)],
    ["Minutes", Math.floor((remaining / 60000) % 60)],
    ["Seconds", Math.floor((remaining / 1000) % 60)],
  ];
  return <div className="countdown" aria-label="Countdown to the wedding">{units.map(([label, value]) =>
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
  return <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo gallery"
    onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
    onTouchEnd={(e) => { const delta = e.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 50) setIndex(delta > 0 ? (index - 1 + wedding.gallery.length) % wedding.gallery.length : (index + 1) % wedding.gallery.length); }}>
    <button ref={closeRef} className="lightbox-close" onClick={close} aria-label="Close gallery"><X /></button>
    <button className="lightbox-prev" onClick={() => setIndex((index - 1 + wedding.gallery.length) % wedding.gallery.length)} aria-label="Previous photo"><ChevronLeft /></button>
    <figure><img src={image.src} alt={image.alt} /><figcaption>{index + 1} / {wedding.gallery.length}</figcaption></figure>
    <button className="lightbox-next" onClick={() => setIndex((index + 1) % wedding.gallery.length)} aria-label="Next photo"><ChevronRight /></button>
  </div>;
}

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return <header className="section-title"><span>{eyebrow}</span><h2>{children}</h2><i aria-hidden="true">❦</i></header>;
}

export default function App() {
  const [opened, setOpened] = useState(() => sessionStorage.getItem("invitation-opened") === "true");
  const [opening, setOpening] = useState(false);
  const [guest] = useState(() => getGuestName(window.location.search));
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [playing, setPlaying] = useState(false);
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
      <div className="cover-photo" aria-hidden="true" />
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
      <button className="music-control" onClick={toggleMusic} aria-label={playing ? "Pause background music" : "Play background music"}>{playing ? <Pause /> : <Music />}</button></>}

    <header className="topbar">
      <a href="#home" className="monogram" aria-label="Erni and Amirul home">EA</a>
      <nav aria-label="Primary navigation">
        <a href="#invitation">Invitation</a><a href="#story">Our Story</a><a href="#details">Details</a>
      </nav>
      <button onClick={share} className="icon-button" aria-label="Share invitation"><Share2 /></button>
    </header>

    <main>
      <section id="home" className="hero">
        <img src={wedding.images.hero} alt="Amirul and Erni at their engagement beneath a blue and lilac flower arch" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p>{wedding.couple.theme}</p>
          <h1>Amirul <em>&</em> Erni</h1>
          <span>{wedding.couple.openingLine}</span>
          <div className="hero-date">{wedding.dates.weddingDisplay}</div>
          <Countdown />
        </div>
        <a className="scroll-cue" href="#invitation"><span>Scroll</span><ChevronDown /></a>
      </section>

      <section id="invitation" className="paper-section formal">
        <SectionTitle eyebrow="Dengan penuh kesyukuran">Walimatul Urus</SectionTitle>
        <p className="arabic" lang="ar" dir="rtl">{wedding.invitation.bismillah}</p>
        <p>{wedding.invitation.preface}</p>
        <div className="parents"><strong>{wedding.parents.bride}</strong><span>dan</span><strong>{wedding.parents.groom}</strong></div>
        <p>{wedding.invitation.request}</p>
        <div className="couple-names"><strong>{wedding.couple.groom}</strong><i>&</i><strong>{wedding.couple.bride}</strong></div>
        <p className="blessing">{wedding.invitation.blessing}</p>
      </section>

      <section id="details" className="section event-section">
        <SectionTitle eyebrow="Save the date">Butiran Majlis</SectionTitle>
        <div className="date-medallion"><span>26</span><div><strong>December</strong><small>2026</small></div></div>
        <div className="details-grid">
          <article><CalendarDays /><span>Hari & Tarikh</span><strong>{wedding.event.day}</strong><p>{wedding.event.date}</p></article>
          <article><Heart /><span>Masa</span><strong>{wedding.event.time}</strong><p>Waktu Malaysia (UTC+8)</p></article>
          <article><MapPin /><span>Lokasi</span><strong>{wedding.event.venue}</strong><p>{wedding.event.address}</p></article>
        </div>
        <dl className="mini-details"><div><dt>Dress code</dt><dd>{wedding.event.dressCode}</dd></div><div><dt>RSVP sebelum</dt><dd>{wedding.event.rsvpDeadline}</dd></div></dl>
        <div className="action-row">
          <ActionLink href={maps} icon={<MapPin />} label="Google Maps" />
          <ActionLink href={waze} icon={<Menu />} label="Waze" />
          <button className="action-link" onClick={addCalendar}><CalendarDays /><span>Calendar</span></button>
          <ActionLink href={whatsapp} icon={<MessageCircle />} label="WhatsApp" />
          <ActionLink href={phone ? `tel:+${phone}` : ""} icon={<Phone />} label="Call" />
        </div>
        {calendarReady() && <a className="text-link" href={googleCalendarUrl()} target="_blank" rel="noreferrer">Or add with Google Calendar</a>}
      </section>

      <section className="section programme">
        <SectionTitle eyebrow="Susunan acara">Atur Cara Majlis</SectionTitle>
        <div className="timeline">{wedding.itinerary.map((item) => <article key={`${item.time}-${item.title}`}><time>{item.time}</time><i /><h3>{item.title}</h3></article>)}</div>
      </section>

      <section id="story" className="story section">
        <SectionTitle eyebrow="The story so far">We Met Before We Met</SectionTitle>
        <div className="story-layout"><div className="story-copy">{wedding.story.map((p, i) => <p key={i}>{p}</p>)}</div>
          <div className="story-image"><img loading="lazy" src={wedding.images.story} alt="Amirul and Erni together beside a waterfall" /></div></div>
        <div className="relationship-timeline">{wedding.timeline.map((item) => <article key={item.label}><span>{item.date}</span><h3>{item.label}</h3></article>)}</div>
      </section>

      {wedding.features.gallery && <section className="section gallery-section">
        <SectionTitle eyebrow="Memories in the making">Galeri Kami</SectionTitle>
        <div className="gallery">{wedding.gallery.map((image, index) => <button key={index} onClick={() => setLightbox(index)} aria-label={`Open photo: ${image.alt}`}>
          <img loading="lazy" src={image.src} alt={image.alt} style={{ objectPosition: image.position }} width="800" height={index === 0 ? "1100" : "700"} />
        </button>)}</div>
      </section>}

      <section id="rsvp" className="rsvp section">
        <SectionTitle eyebrow="Kindly reply">Sahkan Kehadiran</SectionTitle>
        <p>{wedding.rsvp.message}</p>
        <strong>Tarikh akhir: {wedding.event.rsvpDeadline}</strong>
        {wedding.rsvp.formUrl ? <a className="primary-button" href={wedding.rsvp.formUrl} target="_blank" rel="noreferrer">Sahkan Kehadiran <MessageCircle /></a>
          : <button className="primary-button" disabled>Google Form belum dikonfigurasi</button>}
      </section>

      <section className="section contacts">
        <SectionTitle eyebrow="Kami sedia membantu">Hubungi Keluarga</SectionTitle>
        <div className="contact-grid">{wedding.contacts.map((contact) => {
          const number = contact.phone.replace(/\D/g, "");
          return <article key={contact.name}><h3>{contact.name}</h3><p>{contact.role}</p><div>
            <ActionLink href={number ? `tel:+${number}` : ""} icon={<Phone />} label="Call" />
            <ActionLink href={number ? `https://wa.me/${number}` : ""} icon={<MessageCircle />} label="WhatsApp" />
          </div></article>;
        })}</div>
      </section>

      {wedding.features.gifts && wedding.gifts.enabled && <section className="section gifts">
        <details><summary><Gift /> Hadiah <ChevronDown /></summary><div><p>{wedding.gifts.message}</p><span>{wedding.gifts.bank}</span><strong>{wedding.gifts.accountHolder}</strong>
          <code>{wedding.gifts.accountNumber}</code><button onClick={() => navigator.clipboard.writeText(wedding.gifts.accountNumber)}><Clipboard /> Copy account number</button>
          {wedding.gifts.duitNowQr && <img loading="lazy" src={wedding.gifts.duitNowQr} alt="DuitNow QR code for wedding gift" />}</div></details>
      </section>}

      <section className="section faq">
        <SectionTitle eyebrow="Good to know">Soalan Lazim</SectionTitle>
        <div>{wedding.faq.map((item) => <details key={item.question}><summary>{item.question}<ChevronDown /></summary><p>{item.answer}</p></details>)}</div>
      </section>

      <section className="closing">
        <img loading="lazy" src={wedding.images.closing} alt="Amirul and Erni celebrating their engagement together" />
        <div><p>{wedding.closing.line}</p><h2>{wedding.couple.shortNames}</h2><span>{wedding.closing.thanks}</span><strong>Jumpa anda di sana</strong></div>
      </section>
    </main>

    <footer><span>EA</span><p>© {new Date().getFullYear()} Amirul & Erni. Made with love.</p></footer>

    {opened && <nav className="mobile-bar" aria-label="Quick actions">
      <a href={wedding.rsvp.formUrl || "#rsvp"}><MessageCircle /><span>RSVP</span></a>
      <a href={maps || "#details"}><MapPin /><span>Maps</span></a>
      <a href={waze || "#details"}><Menu /><span>Waze</span></a>
      <button onClick={addCalendar}><CalendarDays /><span>Calendar</span></button>
      <a href={whatsapp || "#details"}><Phone /><span>Contact</span></a>
    </nav>}
    {lightbox !== null && <Lightbox index={lightbox} setIndex={setLightbox} close={() => setLightbox(null)} />}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
