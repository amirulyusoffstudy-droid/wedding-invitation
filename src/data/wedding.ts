// Gantikan setiap nilai yang mengandungi "PLACEHOLDER" sebelum penerbitan akhir.
const publicAsset = (filename: string) => `${import.meta.env.BASE_URL}images/${filename}`;

export const wedding = {
  couple: {
    shortNames: "Erni & Amirul",
    groom: "Muhammad Amirul",
    bride: "Erni Alysya",
    theme: "Kita Pernah Bertemu Sebelum Berkenalan",
    openingLine: "Sebelum kami dipertemukan, jalan hidup kami sebenarnya pernah bersilang.",
  },
  parents: {
    bride: "Maswani bin Marzuki & Nur Hayati binti Kamarudin",
    groom: "Mazidah bt Abd Talib & Mohd Yusoff bin Rejab",
  },
  dates: {
    engagement: "6 Julai 2025",
    weddingDisplay: "26 Disember 2026",
    weddingIso: "2026-12-26T00:00:00+08:00",
  },
  invitation: {
    bismillah: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم",
    preface: "Dengan penuh kesyukuran ke hadrat Allah SWT, kami",
    request: "Dengan segala hormatnya menjemput Dato’ / Datin / Tuan / Puan / Encik / Cik seisi keluarga ke majlis perkahwinan anakanda kami",
    blessing: "Semoga dengan kehadiran dan doa restu para tetamu, majlis ini akan bertambah seri dan diberkati Allah SWT.",
  },
  event: {
    day: "Sabtu",
    date: "26 Disember 2026",
    time: "11:00 pagi – 4:00 petang",
    startTime: "11:00",
    endTime: "16:00",
    venue: "Inap D’Bondang Resort",
    address: "Jalan Kasawari Peket 60 Dalam, 45300 Sungai Besar, Selangor",
    dressCode: "[KOD PAKAIAN PLACEHOLDER]",
    title: "Majlis Perkahwinan Erni & Amirul",
    description: "Walimatul Urus Erni Alysya dan Muhammad Amirul.",
  },
  links: {
    maps: "https://maps.app.goo.gl/s1L1t8az2jQbJCC99",
    waze: "https://waze.com/ul/hw0xug89d4",
  },
  itinerary: [
    { time: "11:00 pagi", title: "Ketibaan Tetamu" },
    { time: "12:30 tengah hari", title: "Ketibaan Pengantin" },
    { time: "1:00 petang", title: "Jamuan Makan" },
    { time: "4:00 petang", title: "Majlis Bersurai" },
  ],
  story: [
    "Sebelum kami dipertemukan, jalan hidup kami sebenarnya pernah bersilang. Amirul pernah meluangkan masa bersama salah seorang rakan Erni, dan Erni juga berada di situ—namun entah bagaimana, Amirul tidak menyedarinya.",
    "Kemudian pada suatu hari, kami dipertemukan di Tinder.",
    "Satu padanan menjadi perbualan. Perbualan bertukar menjadi panggilan lewat malam, pertemuan, gelak tawa dan perasaan yang tidak lagi mampu kami abaikan. Perlahan-lahan dan tanpa dipaksa, kami menjadi sebahagian daripada kehidupan satu sama lain.",
    "Pada 6 Julai 2025, kami mengambil langkah seterusnya dan mengikat tali pertunangan.",
    "Kini, kisah kami diteruskan menuju 26 Disember 2026—hari kami memulakan kehidupan bersama sebagai suami isteri.",
  ],
  timeline: [
    { label: "Jalan Kami Bersilang", date: "Tarikh tidak diketahui" },
    { label: "Kami Dipertemukan", date: "[PLACEHOLDER]" },
    { label: "Perbualan Pertama", date: "[PLACEHOLDER]" },
    { label: "Pertemuan Pertama", date: "[PLACEHOLDER]" },
    { label: "Kami Jatuh Cinta", date: "[PLACEHOLDER]" },
    { label: "Kami Bertunang", date: "6 Julai 2025" },
    { label: "Kami Diijabkabulkan", date: "26 Disember 2026" },
  ],
  gallery: [
    { src: publicAsset("couple-engagement-playful.jpg"), alt: "Erni dan Amirul bergurau pada hari pertunangan", position: "center 58%" },
    { src: publicAsset("couple-waterfall.jpg"), alt: "Erni dan Amirul bersama di tepi air terjun", position: "center 52%" },
    { src: publicAsset("couple-palace.jpg"), alt: "Erni dan Amirul melawat sebuah istana bersejarah", position: "center 55%" },
    { src: publicAsset("couple-cinema.jpg"), alt: "Erni dan Amirul menikmati temu janji di pawagam", position: "center 45%" },
    { src: publicAsset("couple-crossed-paths.jpg"), alt: "Erni dan Amirul membentuk simbol hati bersama", position: "center 70%" },
    { src: publicAsset("couple-engagement-ring.jpg"), alt: "Erni dan Amirul meraikan pertunangan mereka", position: "center 55%" },
  ],
  wishes: {
    formUrl: "", // PLACEHOLDER: pautan Google Form untuk ucapan sahaja.
    message: "Titipkan doa dan ucapan buat kami melalui borang ucapan.",
  },
  contacts: [
    { name: "Hayati", role: "Ibu pengantin perempuan", phone: "60178296924" },
    { name: "Dien", role: "Bapa pengantin perempuan", phone: "60183672932" },
    { name: "Mardiana", role: "Kakak pengantin lelaki", phone: "601110003141" },
    { name: "Hidayah", role: "Kakak pengantin lelaki", phone: "601112341237" },
  ],
  faq: [
    { question: "Pukul berapa tetamu perlu tiba?", answer: "Majlis bermula pada pukul 11:00 pagi dan berakhir pada pukul 4:00 petang." },
    { question: "Apakah tema atau kod pakaian?", answer: "[JAWAPAN PLACEHOLDER]" },
    { question: "Adakah kanak-kanak dijemput?", answer: "[JAWAPAN PLACEHOLDER]" },
    { question: "Bolehkah saya membawa teman?", answer: "[JAWAPAN PLACEHOLDER]" },
    { question: "Adakah tempat letak kereta disediakan?", answer: "[JAWAPAN PLACEHOLDER]" },
    { question: "Perlukah saya mengesahkan kehadiran?", answer: "Tidak. Majlis ini tidak memerlukan pengesahan kehadiran." },
    { question: "Bagaimana saya boleh menghubungi pihak keluarga?", answer: "Tekan menu Hubungi di bahagian bawah skrin untuk menghubungi wakil keluarga." },
  ],
  gifts: {
    enabled: true,
    message: "Doa restu anda adalah hadiah yang paling bermakna buat kami. Sekiranya ingin memberi hadiah, maklumat berikut disediakan untuk kemudahan anda.",
    accounts: [
      {
        label: "Pengantin Perempuan",
        bank: "[BANK PENGANTIN PEREMPUAN PLACEHOLDER]",
        accountHolder: "Erni Alysya",
        accountNumber: "[NOMBOR AKAUN PLACEHOLDER]",
        duitNowQr: "", // Tambah fail QR pengantin perempuan kemudian.
      },
      {
        label: "Pengantin Lelaki",
        bank: "[BANK PENGANTIN LELAKI PLACEHOLDER]",
        accountHolder: "Muhammad Amirul",
        accountNumber: "[NOMBOR AKAUN PLACEHOLDER]",
        duitNowQr: publicAsset("qr-amirul.jpeg"),
      },
    ],
  },
  music: {
    enabled: false,
    src: "",
    loop: true,
    volume: 0.2,
  },
  sharing: {
    whatsappText: "Dengan penuh kesyukuran, kami menjemput anda ke Majlis Perkahwinan Erni & Amirul pada 26 Disember 2026.",
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
    line: "Satu kisah, dua kehidupan dan sebuah lembaran baharu bermula pada 26 Disember 2026.",
    thanks: "Terima kasih kerana menjadi sebahagian daripada kisah kami.",
  },
} as const;

export type WeddingConfig = typeof wedding;
