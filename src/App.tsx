import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clipboard,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Volume2,
  VolumeX,
  UserCheck,
} from "lucide-react";
import { wedding } from "./data/wedding";
import { InvitationPages } from "./components/InvitationPages";
import { ActionLink, Panel } from "./components/Panel";
import { WishesPanel } from "./components/WishesPanel";
import { GuestbookSection } from "./components/GuestbookSection";
import { GuestbookProvider } from "./guestbook/GuestbookProvider";
import { downloadCalendar } from "./utils/calendar";

type PanelName = "contact" | "location" | "gift" | "rsvp";
const isConfigured = (value: string) =>
  Boolean(value && !value.includes("PLACEHOLDER"));
const OPENING_DURATION_MS = 420;
const TOAST_DURATION_MS = 2_400;

function wasInvitationOpened() {
  try {
    return sessionStorage.getItem("invitation-opened") === "true";
  } catch {
    return false;
  }
}

export default function App() {
  const [opened, setOpened] = useState(wasInvitationOpened);
  const [opening, setOpening] = useState(false);
  const [panel, setPanel] = useState<PanelName | null>(null);
  const [toast, setToast] = useState("");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const shouldFocusInvitationRef = useRef(false);
  const openingTimerRef = useRef<number | undefined>(undefined);
  const toastTimerRef = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    window.clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = window.setTimeout(
      () => setToast(""),
      TOAST_DURATION_MS,
    );
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(openingTimerRef.current);
      window.clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const playMusic = useCallback(async () => {
    const audio = audioRef.current;
    if (!wedding.music.enabled || !audio) return;
    audio.volume = wedding.music.volume;
    try {
      await audio.play();
      setMusicPlaying(true);
    } catch {
      setMusicPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (opened) void playMusic();
  }, [opened, playMusic]);

  useEffect(() => {
    if (!opened || !shouldFocusInvitationRef.current) return;
    shouldFocusInvitationRef.current = false;
    requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true });
      mainRef.current?.scrollIntoView();
    });
  }, [opened]);

  const openInvitation = () => {
    if (opening) return;
    void playMusic();
    setOpening(true);
    const openDelay = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : OPENING_DURATION_MS;
    openingTimerRef.current = window.setTimeout(() => {
      try {
        sessionStorage.setItem("invitation-opened", "true");
      } catch {
        // The invitation still opens when storage is unavailable.
      }
      shouldFocusInvitationRef.current = true;
      setOpened(true);
    }, openDelay);
  };

  const closePanel = useCallback(() => setPanel(null), []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void playMusic();
    else {
      audio.pause();
      setMusicPlaying(false);
    }
  };

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
    const data = {
      title: wedding.event.title,
      text: wedding.sharing.whatsappText,
      url: publicShareUrl,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(publicShareUrl);
        showToast("Pautan jemputan telah disalin");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError")
        showToast("Pautan tidak dapat dikongsi");
    }
  };

  return (
    <GuestbookProvider apiUrl={wedding.wishes.apiUrl} enabled={opened}>
    <div className="invitation-app design-d">
      {wedding.music.enabled ? (
        <audio
          ref={audioRef}
          src={wedding.music.src}
          loop={wedding.music.loop}
          preload="metadata"
          onPlay={() => setMusicPlaying(true)}
          onPause={() => setMusicPlaying(false)}
          onEnded={() => setMusicPlaying(false)}
        />
      ) : null}

      {!opened && (
        <div className={`opening-cover ${opening ? "is-opening" : ""}`}>
          <div className="opening-card">
            <div className="opening-heading">
              <i>Majlis Raikan</i>
              <span>Cinta</span>
            </div>
            <div className="opening-monogram">
              <span>Erni</span>
              <span>Alysya</span>
              <i>&</i>
              <span>Muhammad</span>
              <span>Amirul</span>
            </div>
            <div className="opening-details" aria-label="Tarikh dan lokasi majlis">
              <time dateTime="2026-12-26">26 . 12 . 2026</time>
              <span>Inap D’Bondang Resort,</span>
              <em>#AmiruLamarErni</em>
            </div>
            <button onClick={openInvitation} disabled={opening}>
              Buka Jemputan <Heart aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <main
        ref={mainRef}
        id="jemputan"
        className={opened ? "is-opened" : undefined}
        inert={!opened || panel !== null}
        tabIndex={-1}
      >
        <InvitationPages
          onShare={() => void share()}
          onSaveDate={() => {
            if (!downloadCalendar()) showToast("Kalendar belum dapat dijana");
          }}
        />
        <GuestbookSection />
      </main>

      {opened && (
        <nav
          className="bottom-menu"
          aria-label="Menu utama"
          inert={panel !== null}
        >
          <button onClick={() => setPanel("contact")}>
            <Phone aria-hidden="true" />
            <span>Hubungi</span>
          </button>
          <button onClick={() => setPanel("location")}>
            <MapPin aria-hidden="true" />
            <span>Lokasi</span>
          </button>
          <button onClick={() => setPanel("gift")}>
            <Gift aria-hidden="true" />
            <span>Hadiah</span>
          </button>
          <button onClick={() => setPanel("rsvp")}>
            <UserCheck aria-hidden="true" />
            <span>RSVP</span>
          </button>
        </nav>
      )}

      {opened && wedding.music.enabled ? (
        <button
          className={`music-toggle ${musicPlaying ? "is-playing" : ""}`}
          type="button"
          onClick={toggleMusic}
          aria-label={musicPlaying ? "Jeda muzik latar" : "Mainkan muzik latar"}
          aria-pressed={musicPlaying}
          title={musicPlaying ? "Jeda muzik" : "Mainkan muzik"}
        >
          {musicPlaying ? (
            <Volume2 aria-hidden="true" />
          ) : (
            <VolumeX aria-hidden="true" />
          )}
        </button>
      ) : null}

      {panel === "contact" && (
        <Panel title="Hubungi" close={closePanel}>
          <div className="contact-list">
            {wedding.contacts.map((contact) => {
              const number = contact.phone.replace(/\D/g, "");
              return (
                <article key={contact.name}>
                  <div className="contact-identity">
                    <strong>{contact.name}</strong>
                    <span>{contact.role}</span>
                  </div>
                  <div className="contact-actions">
                    <a
                      href={`tel:+${number}`}
                      aria-label={`Panggil ${contact.name}`}
                      title={`Panggil ${contact.name}`}
                    >
                      <Phone aria-hidden="true" />
                    </a>
                    <a
                      href={`https://wa.me/${number}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`WhatsApp ${contact.name}`}
                      title={`WhatsApp ${contact.name}`}
                    >
                      <MessageCircle aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>
      )}

      {panel === "location" && (
        <Panel title="Lokasi" close={closePanel}>
          <div className="location-panel">
            <MapPin aria-hidden="true" />
            <h3>{wedding.event.venue}</h3>
            <p>{wedding.event.address}</p>
            <div>
              <ActionLink
                href={wedding.links.maps}
                icon={<MapPin aria-hidden="true" />}
              >
                Google Maps
              </ActionLink>
              <ActionLink
                href={wedding.links.waze}
                icon={<Navigation aria-hidden="true" />}
              >
                Waze
              </ActionLink>
            </div>
          </div>
        </Panel>
      )}

      {panel === "gift" && (
        <Panel title="Hadiah" close={closePanel}>
          <p className="panel-note">{wedding.gifts.message}</p>
          <div className="gift-list">
            {wedding.gifts.accounts.map((account) => (
              <article key={account.label}>
                <h3>{account.label}</h3>
                {account.duitNowQr ? (
                  <img
                    src={account.duitNowQr}
                    alt={`Kod QR DuitNow ${account.label}`}
                  />
                ) : (
                  <div className="qr-empty">Kod QR akan ditambah kemudian</div>
                )}
                {isConfigured(account.bank) && <span>{account.bank}</span>}
                <strong>{account.accountHolder}</strong>
                {isConfigured(account.accountNumber) && (
                  <>
                    <code>{account.accountNumber}</code>
                    <button
                      onClick={() => copyAccountNumber(account.accountNumber)}
                    >
                      <Clipboard aria-hidden="true" /> Salin nombor akaun
                    </button>
                  </>
                )}
              </article>
            ))}
          </div>
        </Panel>
      )}

      {panel === "rsvp" && (
        <Panel title="RSVP & Ucapan" close={closePanel}>
          <WishesPanel
            message={wedding.wishes.message}
            onWishSubmitted={() => {
              setPanel(null);
              requestAnimationFrame(() => {
                const guestbook = document.getElementById("ucapan-tetamu");
                guestbook?.focus({ preventScroll: true });
                guestbook?.scrollIntoView({ block: "start", behavior: "auto" });
              });
            }}
          />
        </Panel>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
    </GuestbookProvider>
  );
}
