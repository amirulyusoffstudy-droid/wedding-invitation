// Replace every value containing "PLACEHOLDER" before publishing.
const publicAsset = (filename: string) => `${import.meta.env.BASE_URL}images/${filename}`;

export const wedding = {
  couple: {
    shortNames: "Erni & Amirul",
    groom: "Muhammad Amirul",
    bride: "Erni Alysya",
    theme: "We Met Before We Met",
    openingLine: "Before we ever matched, our paths had already crossed.",
  },
  parents: {
    bride: "[NAME OF BRIDE’S PARENTS]",
    groom: "[NAME OF GROOM’S PARENTS]",
  },
  dates: {
    engagement: "6 July 2025",
    weddingDisplay: "26 December 2026",
    weddingIso: "2026-12-26T00:00:00+08:00",
  },
  invitation: {
    bismillah: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم",
    preface: "Dengan penuh kesyukuran ke hadrat Allah SWT, kami",
    request: "Dengan segala hormatnya menjemput Dato’ / Datin / Tuan / Puan / Encik / Cik seisi keluarga ke majlis perkahwinan anakanda kami",
    blessing: "Semoga dengan kehadiran dan doa restu para tetamu, majlis ini akan bertambah seri dan diberkati Allah SWT.",
  },
  event: {
    day: "Saturday / Sabtu",
    date: "26 December 2026",
    time: "[TIME PLACEHOLDER]",
    startTime: "", // Use HH:mm, e.g. "11:00", when confirmed.
    endTime: "", // Use HH:mm, e.g. "16:00", when confirmed.
    venue: "[VENUE PLACEHOLDER]",
    address: "[FULL ADDRESS PLACEHOLDER]",
    dressCode: "[DRESS CODE PLACEHOLDER]",
    rsvpDeadline: "[RSVP DEADLINE PLACEHOLDER]",
    title: "Majlis Perkahwinan Erni & Amirul",
    description: "Walimatul Urus Erni Alysya dan Muhammad Amirul.",
  },
  links: {
    maps: "", // PLACEHOLDER: paste a Google Maps URL.
    waze: "", // PLACEHOLDER: paste a Waze URL.
    googleCalendar: "", // Optional; generated automatically when times are configured.
  },
  itinerary: [
    { time: "11:00 AM", title: "Ketibaan Tetamu" },
    { time: "12:30 PM", title: "Ketibaan Pengantin" },
    { time: "1:00 PM", title: "Jamuan Makan" },
    { time: "4:00 PM", title: "Majlis Bersurai" },
  ],
  story: [
    "Before we ever matched, our paths had already crossed. Amirul had spent time with one of Erni’s friends, and Erni had been there too—but somehow, he never noticed her.",
    "Then one day, they matched on Tinder.",
    "A match became a conversation. Conversations became late-night calls, meetups, laughter, and feelings neither of them could ignore. Slowly and naturally, they became part of each other’s lives.",
    "On 6 July 2025, they took the next step and got engaged.",
    "Now, their story continues toward 26 December 2026—the day they begin their forever together.",
  ],
  timeline: [
    { label: "Our Paths Crossed", date: "Date unknown" },
    { label: "We Matched", date: "[PLACEHOLDER]" },
    { label: "Our First Conversation", date: "[PLACEHOLDER]" },
    { label: "Our First Meeting", date: "[PLACEHOLDER]" },
    { label: "We Fell in Love", date: "[PLACEHOLDER]" },
    { label: "We Got Engaged", date: "6 July 2025" },
    { label: "We Say “I Do”", date: "26 December 2026" },
  ],
  gallery: [
    { src: publicAsset("couple-engagement-playful.jpg"), alt: "Amirul and Erni sharing a playful moment at their engagement", position: "center 58%" },
    { src: publicAsset("couple-waterfall.jpg"), alt: "Amirul and Erni together beside a waterfall", position: "center 52%" },
    { src: publicAsset("couple-palace.jpg"), alt: "Amirul and Erni visiting a historic palace", position: "center 55%" },
    { src: publicAsset("couple-cinema.jpg"), alt: "Amirul and Erni enjoying a cinema date", position: "center 45%" },
    { src: publicAsset("couple-crossed-paths.jpg"), alt: "Amirul and Erni making a heart shape together outdoors", position: "center 70%" },
    { src: publicAsset("couple-engagement-ring.jpg"), alt: "Amirul and Erni celebrating their engagement", position: "center 55%" },
  ],
  rsvp: {
    formUrl: "", // PLACEHOLDER: public Google Form URL.
    wishesIncluded: true,
    message: "Sahkan kehadiran, bilangan tetamu, keperluan makanan dan tinggalkan pesanan buat kami melalui borang RSVP.",
  },
  contacts: [
    { name: "[ORGANISER NAME]", role: "[RELATIONSHIP / ROLE]", phone: "" }, // Malaysian international format, e.g. 60123456789.
  ],
  faq: [
    { question: "Pukul berapa tetamu perlu tiba?", answer: "[ANSWER PLACEHOLDER]" },
    { question: "Apakah tema atau kod pakaian?", answer: "[ANSWER PLACEHOLDER]" },
    { question: "Adakah kanak-kanak dijemput?", answer: "[ANSWER PLACEHOLDER]" },
    { question: "Bolehkah saya membawa teman?", answer: "[ANSWER PLACEHOLDER]" },
    { question: "Adakah tempat letak kereta disediakan?", answer: "[ANSWER PLACEHOLDER]" },
    { question: "Bilakah tarikh akhir RSVP?", answer: "[ANSWER PLACEHOLDER]" },
    { question: "Bagaimana saya boleh menghubungi pihak keluarga?", answer: "[ANSWER PLACEHOLDER]" },
  ],
  gifts: {
    enabled: true, // Review all payment details before deploying publicly.
    message: "Doa restu anda adalah hadiah yang paling bermakna buat kami.",
    bank: "[BANK PLACEHOLDER]",
    accountHolder: "[ACCOUNT HOLDER PLACEHOLDER]",
    accountNumber: "[ACCOUNT NUMBER PLACEHOLDER]",
    duitNowQr: "",
  },
  music: {
    enabled: false,
    src: "", // Only use audio you own or are licensed to use.
    loop: true,
    volume: 0.2,
  },
  sharing: {
    whatsappText: "Dengan penuh kesyukuran, kami menjemput anda ke Majlis Perkahwinan Erni & Amirul pada 26 December 2026.",
  },
  images: {
    hero: publicAsset("couple-closing.jpg"),
    story: publicAsset("couple-waterfall.jpg"),
    closing: publicAsset("couple-engagement-ring.jpg"),
  },
  features: {
    gallery: false,
    gifts: true,
    music: false,
  },
  closing: {
    line: "One story, two lives, and a new chapter beginning on 26 December 2026.",
    thanks: "Terima kasih kerana menjadi sebahagian daripada kisah kami.",
  },
} as const;

export type WeddingConfig = typeof wedding;
