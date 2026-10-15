import { useEffect, useState } from "react";
import { CalendarDays, Heart } from "lucide-react";
import { wedding } from "../data/wedding";

interface InvitationPagesProps {
  onSaveDate: () => void;
  onShare: () => void;
}

const weddingStartTime = new Date("2026-12-26T11:00:00+08:00").getTime();

function getCountdownParts() {
  const totalSeconds = Math.max(0, Math.floor((weddingStartTime - Date.now()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function padTime(value: number) {
  return value.toString().padStart(2, "0");
}

export function InvitationPages({ onSaveDate }: InvitationPagesProps) {
  const [countdown, setCountdown] = useState(getCountdownParts);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getCountdownParts());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      <section
        className="invite-page design-d-card-page design-d-invitation-page"
        aria-labelledby="design-d-invitation-title"
      >
        <div className="design-d-card-content">
          <p className="design-d-salam">
            Assalamualaikum WBT &amp; Salam Sejahtera
          </p>

          <div className="design-d-parents">
            <strong>Maswani bin Marzuki (Dien)</strong>
            <i>&amp;</i>
            <strong>Nurhayati binti Kamarudin</strong>
          </div>

          <p className="design-d-copy">
            Dengan penuh kesyukuran menjemput Dato’ / Datin / Tuan / Puan /
            Encik / Cik ke majlis perkahwinan puteri kami,
          </p>

          <h1 id="design-d-invitation-title" className="design-d-couple">
            <span>Erni Alysya binti Maswani</span>
            <i>&amp;</i>
            <span>Muhammad Amirul bin</span>
            <span>Mohd Yusoff</span>
          </h1>

          <p className="design-d-copy design-d-blessing">
            Semoga dengan kehadiran para hadirin dapat menyerikan lagi majlis
            kami.
          </p>
        </div>
      </section>

      <section
        className="invite-page design-d-card-page design-d-details-page"
        aria-labelledby="event-details-title"
      >
        <div className="design-d-card-content">
          <h2 id="event-details-title" className="design-d-section-title">
            Butiran Majlis
          </h2>

          <div className="design-d-detail-group">
            <h3>Tarikh</h3>
            <strong>Sabtu, 26 December 2026</strong>
            <span>Bersamaan 17 Rejab 1448 Hijrah</span>
          </div>

          <div className="design-d-detail-group">
            <h3>Masa</h3>
            <strong>11:00 AM - 4:00 PM</strong>
          </div>

          <div className="design-d-divider" aria-hidden="true">
            <Heart />
          </div>

          <div className="design-d-detail-group design-d-venue">
            <h3>Lokasi</h3>
            <strong>{wedding.event.venue}</strong>
            <span>45300, Sungai Besar, Selangor.</span>
          </div>

          <div className="design-d-divider" aria-hidden="true">
            <Heart />
          </div>

          <div className="design-d-programme">
            <h3>Aturcara</h3>
            <p>9:00 AM : Akad Nikah</p>
            <p>11:00 AM : Ketibaan Tetamu</p>
            <p>12:30 PM : Ketibaan Raja Sehari</p>
            <p>4:00 PM : Majlis Bersurai</p>
          </div>

          <button className="design-d-save-date" type="button" onClick={onSaveDate}>
            <CalendarDays aria-hidden="true" /> Simpan Tarikh
          </button>
        </div>
      </section>

      <section className="invite-page prayer-page" aria-labelledby="doa-title">
        <div className="page-content closing-vellum">
          <p className="arabic" lang="ar" dir="rtl">
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>
          <h2 id="doa-title">Doa Buat Mempelai</h2>
          <p className="prayer">
            Semoga cinta ini menjadi sakinah, mawaddah, dan warahmah. Semoga
            ikatan ini tumbuh mekar seperti bunga yang tidak pernah layu, semoga
            kasih ini mengalir seperti sungai yang tidak pernah kering, dan
            semoga rindu ini kekal sebagai doa yang membawa mereka ke syurga
            abadi.
          </p>
          <Heart className="prayer-heart" aria-hidden="true" />
          <strong className="closing-names">{wedding.couple.shortNames}</strong>
          <span>Terima kasih</span>
          <div className="countdown-panel" aria-label="Countdown menuju majlis">
            <p>Menuju Cinta Abadi</p>
            <div className="countdown-grid" aria-live="polite">
              <span>
                <strong>{countdown.days}</strong>
                <small>hari</small>
              </span>
              <span>
                <strong>{padTime(countdown.hours)}</strong>
                <small>jam</small>
              </span>
              <span>
                <strong>{padTime(countdown.minutes)}</strong>
                <small>minit</small>
              </span>
              <span>
                <strong>{padTime(countdown.seconds)}</strong>
                <small>saat</small>
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
