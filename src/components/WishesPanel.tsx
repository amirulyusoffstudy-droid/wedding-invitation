import { useEffect, useId, useRef, useState } from "react";
import { Heart, LoaderCircle, RefreshCw, Send } from "lucide-react";
import { isValidRsvp, MAX_GUEST_COUNT, type Attendance } from "../../shared/rsvp";

interface Wish {
  id: string;
  name: string;
  message: string;
  relationship?: string;
  createdAt: string;
}

interface WishesPanelProps {
  apiUrl: string;
  message: string;
  initialSection?: "form" | "wishes";
}

interface WishesResponse {
  success: boolean;
  data?: Wish[];
  error?: string;
}

interface WishFormData {
  name: string;
  message: string;
  attendance: Attendance | "";
  guestCount: string;
}

type FieldErrors = Partial<Record<keyof WishFormData, string>>;
type LoadStatus = "loading" | "ready" | "error";
type SubmitStatus = "idle" | "submitting" | "success" | "error";

const EMPTY_FORM: WishFormData = { name: "", message: "", attendance: "", guestCount: "1" };
const REQUEST_TIMEOUT_MS = 10_000;
const SUBMISSION_TIMEOUT_MS = 25_000;
const dateFormatter = new Intl.DateTimeFormat("ms-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function getFieldError(field: keyof WishFormData, value: string) {
  const trimmedValue = value.trim();
  if (field === "name" && !trimmedValue) return "Masukkan nama anda.";
  if (field === "attendance" && !trimmedValue) return "Pilih status kehadiran anda.";
  if (field === "guestCount" && !isValidRsvp({ attendance: "attending", guestCount: Number(value) }))
    return `Pilih antara 1 hingga ${MAX_GUEST_COUNT} tetamu.`;
  if (field === "name" && trimmedValue.length > 80)
    return "Nama mestilah 80 aksara atau kurang.";
  if (field === "message" && trimmedValue.length > 500)
    return "Ucapan mestilah 500 aksara atau kurang.";
  return "";
}

function formatWishDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

export function WishesPanel({ apiUrl, message, initialSection = "form" }: WishesPanelProps) {
  const nameId = useId();
  const messageId = useId();
  const attendanceId = useId();
  const guestCountId = useId();
  const wallRef = useRef<HTMLElement>(null);
  const loadControllerRef = useRef<AbortController | null>(null);
  const [formData, setFormData] = useState<WishFormData>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (initialSection === "wishes") {
      wallRef.current?.scrollIntoView?.({ block: "start" });
      wallRef.current?.focus({ preventScroll: true });
    }
  }, [initialSection]);

  useEffect(() => {
    const controller = new AbortController();
    loadControllerRef.current = controller;

    async function loadWishes() {
      setLoadStatus("loading");
      let didTimeout = false;
      const timeoutId = window.setTimeout(() => {
        didTimeout = true;
        controller.abort();
      }, REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(apiUrl, {
          signal: controller.signal,
          cache: "no-store",
        });
        const result = (await response.json()) as WishesResponse;
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.error || "Ucapan tidak dapat dimuatkan");
        }
        setWishes(result.data);
        setLoadStatus("ready");
      } catch (error) {
        if ((error as DOMException).name !== "AbortError" || didTimeout)
          setLoadStatus("error");
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    void loadWishes();
    return () => controller.abort();
  }, [apiUrl, reloadKey]);

  const updateField = (field: keyof WishFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (submitStatus === "success" || submitStatus === "error")
      setSubmitStatus("idle");
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const validateField = (field: keyof WishFormData) => {
    const error = getFieldError(field, formData[field]);
    setFieldErrors((current) => ({ ...current, [field]: error || undefined }));
  };

  const submitWish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitStatus === "submitting") return;
    const errors: FieldErrors = {
      name: getFieldError("name", formData.name) || undefined,
      message: getFieldError("message", formData.message) || undefined,
      attendance: getFieldError("attendance", formData.attendance) || undefined,
      guestCount: formData.attendance === "attending"
        ? getFieldError("guestCount", formData.guestCount) || undefined : undefined,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      const firstInvalidId = errors.name ? nameId : errors.attendance
        ? attendanceId : errors.guestCount ? guestCountId : messageId;
      requestAnimationFrame(() =>
        document.getElementById(firstInvalidId)?.focus(),
      );
      return;
    }

    setSubmitStatus("submitting");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      SUBMISSION_TIMEOUT_MS,
    );
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          name: formData.name.trim(),
          message: formData.message.trim(),
          attendance: formData.attendance,
          guestCount: formData.attendance === "attending" ? Number(formData.guestCount) : 0,
          website: String(form.get("website") || ""),
        }),
      });
      const result = (await response.json()) as {
        success: boolean;
        data?: Wish;
        rsvpSaved?: boolean;
        error?: string;
      };
      if (!response.ok || !result.success || !result.rsvpSaved) {
        throw new Error(result.error || "Ucapan tidak dapat dihantar");
      }
      const submittedWish = result.data;
      if (submittedWish?.message) {
        loadControllerRef.current?.abort();
        setWishes((current) => [submittedWish, ...current.filter((wish) => wish.id !== submittedWish.id)]);
        setLoadStatus("ready");
      }
      setFormData(EMPTY_FORM);
      setSubmitStatus("success");
      if (submittedWish?.message) {
        requestAnimationFrame(() => {
          wallRef.current?.scrollIntoView?.({ block: "start", behavior: "auto" });
          wallRef.current?.focus({ preventScroll: true });
        });
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  return (
    <div className="guestbook">
      <div className="guestbook-intro">
        <Heart aria-hidden="true" />
        <p>{message}</p>
        <small>
          Nama dan ucapan akan dipaparkan kepada tetamu selepas dihantar.
          Status kehadiran dan bilangan tetamu hanya untuk pihak pengantin.
          Hubungi pengantin untuk pembetulan atau pemadaman.
        </small>
      </div>

      <form
        className="wish-form"
        onSubmit={submitWish}
        aria-busy={submitStatus === "submitting"}
        noValidate
      >
        <h3>Pengesahan Kehadiran & Ucapan</h3>
        <div className="wish-field">
          <label htmlFor={nameId}>Nama</label>
          <input
            id={nameId}
            name="name"
            value={formData.name}
            onChange={(event) => updateField("name", event.target.value)}
            onBlur={() => validateField("name")}
            maxLength={80}
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? `${nameId}-error` : undefined}
            required
          />
          {fieldErrors.name ? (
            <span id={`${nameId}-error`} className="field-error">
              {fieldErrors.name}
            </span>
          ) : null}
        </div>
        <div className="wish-field">
          <label htmlFor={attendanceId}>Kehadiran</label>
          <select
            id={attendanceId}
            name="attendance"
            value={formData.attendance}
            onChange={(event) => updateField("attendance", event.target.value)}
            onBlur={() => validateField("attendance")}
            aria-invalid={Boolean(fieldErrors.attendance)}
            aria-describedby={fieldErrors.attendance ? `${attendanceId}-error` : undefined}
            required
          >
            <option value="">Pilih kehadiran</option>
            <option value="attending">Hadir</option>
            <option value="not-attending">Tidak hadir</option>
          </select>
          {fieldErrors.attendance && <span id={`${attendanceId}-error`} className="field-error">{fieldErrors.attendance}</span>}
        </div>
        {formData.attendance === "attending" && (
          <div className="wish-field">
            <label htmlFor={guestCountId}>Bilangan tetamu (termasuk diri sendiri)</label>
            <select
              id={guestCountId}
              name="guestCount"
              value={formData.guestCount}
              onChange={(event) => updateField("guestCount", event.target.value)}
              aria-invalid={Boolean(fieldErrors.guestCount)}
              aria-describedby={fieldErrors.guestCount ? `${guestCountId}-error` : undefined}
              required
            >
              {Array.from({ length: MAX_GUEST_COUNT }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
            {fieldErrors.guestCount && <span id={`${guestCountId}-error`} className="field-error">{fieldErrors.guestCount}</span>}
          </div>
        )}
        <div className="wish-field">
          <label htmlFor={messageId}>Ucapan dan doa (pilihan)</label>
          <textarea
            id={messageId}
            name="message"
            value={formData.message}
            onChange={(event) => updateField("message", event.target.value)}
            onBlur={() => validateField("message")}
            maxLength={500}
            rows={5}
            aria-invalid={Boolean(fieldErrors.message)}
            aria-describedby={`${messageId}-help${fieldErrors.message ? ` ${messageId}-error` : ""}`}
          />
          <small id={`${messageId}-help`} className="field-help">
            {formData.message.length}/500 aksara
          </small>
          {fieldErrors.message ? (
            <span id={`${messageId}-error`} className="field-error">
              {fieldErrors.message}
            </span>
          ) : null}
        </div>
        <input
          className="wish-honeypot"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <button
          className="wish-submit"
          type="submit"
          disabled={submitStatus === "submitting"}
        >
          {submitStatus === "submitting" ? (
            <>
              <LoaderCircle className="is-spinning" aria-hidden="true" />{" "}
              Menghantar…
            </>
          ) : (
            <>
              <Send aria-hidden="true" /> Hantar RSVP & Ucapan
            </>
          )}
        </button>
        <div className="wish-feedback" aria-live="polite">
          {submitStatus === "success" ? (
            <p className="is-success">
              RSVP berjaya disimpan. Jika anda menulis ucapan, ia telah dipaparkan di bawah.
            </p>
          ) : null}
          {submitStatus === "error" ? (
            <p className="is-error">
              RSVP dan ucapan tidak dapat disahkan. Cuba lagi atau hubungi pengantin.
            </p>
          ) : null}
        </div>
      </form>

      <section ref={wallRef} tabIndex={-1} className="wish-wall" aria-labelledby="wish-wall-title">
        <div className="wish-wall-heading">
          <div>
            <small>Daripada keluarga & sahabat</small>
            <h3 id="wish-wall-title">Ucapan Tetamu</h3>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            aria-label="Muat semula ucapan"
          >
            <RefreshCw aria-hidden="true" />
          </button>
        </div>

        {loadStatus === "loading" ? (
          <p className="wish-state">Memuatkan ucapan…</p>
        ) : null}
        {loadStatus === "error" ? (
          <div className="wish-state">
            <p>Ucapan belum dapat dimuatkan.</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Cuba lagi
            </button>
          </div>
        ) : null}
        {loadStatus === "ready" && wishes.length === 0 ? (
          <p className="wish-state">
            Jadilah tetamu pertama yang menitipkan ucapan.
          </p>
        ) : null}
        {loadStatus === "ready"
          ? wishes.map((wish) => (
              <article className="wish-card" key={wish.id}>
                <p>{wish.message}</p>
                <footer>
                  <strong>{wish.name}</strong>
                  <span>
                    {[wish.relationship, formatWishDate(wish.createdAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </footer>
              </article>
            ))
          : null}
      </section>
    </div>
  );
}
