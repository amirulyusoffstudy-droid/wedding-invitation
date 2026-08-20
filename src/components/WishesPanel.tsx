import { useEffect, useId, useState } from "react";
import { Heart, LoaderCircle, RefreshCw, Send } from "lucide-react";

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
}

interface WishesResponse {
  success: boolean;
  data?: Wish[];
  error?: string;
}

interface WishFormData {
  name: string;
  message: string;
  relationship: string;
}

type FieldErrors = Partial<Record<keyof WishFormData, string>>;
type LoadStatus = "loading" | "ready" | "error";
type SubmitStatus = "idle" | "submitting" | "success" | "error";

const EMPTY_FORM: WishFormData = { name: "", message: "", relationship: "" };
const dateFormatter = new Intl.DateTimeFormat("ms-MY", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function getFieldError(field: keyof WishFormData, value: string) {
  const trimmedValue = value.trim();
  if (field === "name" && !trimmedValue) return "Masukkan nama anda.";
  if (field === "message" && !trimmedValue) return "Tuliskan ucapan atau doa anda.";
  if (field === "name" && trimmedValue.length > 80) return "Nama mestilah 80 aksara atau kurang.";
  if (field === "message" && trimmedValue.length > 500) return "Ucapan mestilah 500 aksara atau kurang.";
  if (field === "relationship" && trimmedValue.length > 80) return "Daripada mestilah 80 aksara atau kurang.";
  return "";
}

function formatWishDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

export function WishesPanel({ apiUrl, message }: WishesPanelProps) {
  const nameId = useId();
  const messageId = useId();
  const relationshipId = useId();
  const [formData, setFormData] = useState<WishFormData>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWishes() {
      setLoadStatus("loading");
      try {
        const response = await fetch(apiUrl, { signal: controller.signal, cache: "no-store" });
        const result = await response.json() as WishesResponse;
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.error || "Ucapan tidak dapat dimuatkan");
        }
        setWishes(result.data);
        setLoadStatus("ready");
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") setLoadStatus("error");
      }
    }

    void loadWishes();
    return () => controller.abort();
  }, [apiUrl, reloadKey]);

  const updateField = (field: keyof WishFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (submitStatus === "success" || submitStatus === "error") setSubmitStatus("idle");
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
    const errors: FieldErrors = {
      name: getFieldError("name", formData.name) || undefined,
      message: getFieldError("message", formData.message) || undefined,
      relationship: getFieldError("relationship", formData.relationship) || undefined,
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setSubmitStatus("submitting");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          website: String(form.get("website") || ""),
        }),
      });
      const result = await response.json() as { success: boolean; data?: Wish; error?: string };
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "Ucapan tidak dapat dihantar");
      }
      setWishes((current) => [result.data as Wish, ...current.filter((wish) => wish.id !== result.data?.id)]);
      setFormData(EMPTY_FORM);
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
    }
  };

  return <div className="guestbook">
    <div className="guestbook-intro">
      <Heart aria-hidden="true" />
      <p>{message}</p>
      <small>Ucapan anda akan dipaparkan terus selepas dihantar.</small>
    </div>

    <form className="wish-form" onSubmit={submitWish} aria-busy={submitStatus === "submitting"} noValidate>
      <h3>Tulis Ucapan</h3>
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
        {fieldErrors.name ? <span id={`${nameId}-error`} className="field-error">{fieldErrors.name}</span> : null}
      </div>
      <div className="wish-field">
        <label htmlFor={messageId}>Ucapan dan doa</label>
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
          required
        />
        <small id={`${messageId}-help`} className="field-help">{formData.message.length}/500 aksara</small>
        {fieldErrors.message ? <span id={`${messageId}-error`} className="field-error">{fieldErrors.message}</span> : null}
      </div>
      <div className="wish-field">
        <label htmlFor={relationshipId}>Daripada <span>(pilihan)</span></label>
        <input
          id={relationshipId}
          name="relationship"
          value={formData.relationship}
          onChange={(event) => updateField("relationship", event.target.value)}
          onBlur={() => validateField("relationship")}
          placeholder="Contoh: Kawan Erni, keluarga Amirul"
          maxLength={80}
          aria-invalid={Boolean(fieldErrors.relationship)}
          aria-describedby={fieldErrors.relationship ? `${relationshipId}-error` : undefined}
        />
        {fieldErrors.relationship
          ? <span id={`${relationshipId}-error`} className="field-error">{fieldErrors.relationship}</span>
          : null}
      </div>
      <input className="wish-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button className="wish-submit" type="submit" disabled={submitStatus === "submitting"}>
        {submitStatus === "submitting"
          ? <><LoaderCircle className="is-spinning" aria-hidden="true" /> Menghantar…</>
          : <><Send aria-hidden="true" /> Hantar Ucapan</>}
      </button>
      <div className="wish-feedback" aria-live="polite">
        {submitStatus === "success" ? <p className="is-success">Ucapan berjaya dihantar dan telah dipaparkan.</p> : null}
        {submitStatus === "error" ? <p className="is-error">Ucapan tidak dapat dihantar. Cuba sekali lagi.</p> : null}
      </div>
    </form>

    <section className="wish-wall" aria-labelledby="wish-wall-title">
      <div className="wish-wall-heading">
        <div><small>Daripada keluarga & sahabat</small><h3 id="wish-wall-title">Ucapan Tetamu</h3></div>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)} aria-label="Muat semula ucapan">
          <RefreshCw aria-hidden="true" />
        </button>
      </div>

      {loadStatus === "loading" ? <p className="wish-state">Memuatkan ucapan…</p> : null}
      {loadStatus === "error" ? <div className="wish-state">
        <p>Ucapan belum dapat dimuatkan.</p>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Cuba lagi</button>
      </div> : null}
      {loadStatus === "ready" && wishes.length === 0
        ? <p className="wish-state">Jadilah tetamu pertama yang menitipkan ucapan.</p>
        : null}
      {loadStatus === "ready" ? wishes.map((wish) => <article className="wish-card" key={wish.id}>
        <p>{wish.message}</p>
        <footer>
          <strong>{wish.name}</strong>
          <span>{[wish.relationship, formatWishDate(wish.createdAt)].filter(Boolean).join(" · ")}</span>
        </footer>
      </article>) : null}
    </section>
  </div>;
}
