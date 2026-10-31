// Photo Organiser laukiančiųjų sąrašas: xclusiv.studio/photoorganiser iššokantis langas -> ši funkcija -> Make -> MailerLite.
// Ta pati apsauga kaip api/edits.js (robotai, kartojimai, per daug siuntimų iš vieno IP).
// ORGANISER_WEBHOOK (Vercel aplinkos kintamasis) arba WEBHOOK žemiau: Make adresas, įrašomas sujungimo metu.

const WEBHOOK = process.env.ORGANISER_WEBHOOK || "";
const LEIDZIAMI = ["https://www.xclusiv.studio", "https://xclusiv.studio"];
const PASTAS = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LANGAS_MS = 10 * 60 * 1000; // per 10 min iš vieno IP daugiausia 5 siuntimai
const RIBA_IP = 5;

const pagalIp = new Map();
const matytiPastai = new Map();

function perDaug(ip, dabar) {
  const laikai = (pagalIp.get(ip) || []).filter(t => dabar - t < LANGAS_MS);
  laikai.push(dabar);
  pagalIp.set(ip, laikai);
  return laikai.length > RIBA_IP;
}

function jauSiuntė(pastas, dabar) {
  const kada = matytiPastai.get(pastas);
  return kada && dabar - kada < 24 * 60 * 60 * 1000;
}

function pazymetiSiunta(pastas, dabar) {
  if (matytiPastai.size > 5000) matytiPastai.clear();
  matytiPastai.set(pastas, dabar);
}

module.exports = async (req, res) => {
  const kilme = req.headers.origin || "";
  if (LEIDZIAMI.includes(kilme)) {
    res.setHeader("Access-Control-Allow-Origin", kilme);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }

  const b = req.body || {};
  const dabar = Date.now();
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";

  // Robotui atsakom „ok", kad nebandytų iš naujo, bet į Make nesiunčiam
  if (b.svetaine) { res.status(200).json({ ok: true }); return; }
  const laikas = Number(b.laikas);
  if (!laikas || laikas < 2500) { res.status(200).json({ ok: true }); return; }

  const pastas = String(b.email || "").trim().toLowerCase();
  if (!PASTAS.test(pastas) || pastas.length > 120) {
    res.status(400).json({ ok: false, klaida: "pastas" });
    return;
  }
  if (perDaug(ip, dabar)) { res.status(429).json({ ok: false, klaida: "daug" }); return; }
  if (jauSiuntė(pastas, dabar)) { res.status(200).json({ ok: true }); return; }
  if (!WEBHOOK) { res.status(503).json({ ok: false, klaida: "nesujungta" }); return; }

  const kalba = b.kalba === "lt" ? "lt" : "en";
  const saltinis = String(b.saltinis || "organiser-kita").slice(0, 60);
  try {
    const r = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email: pastas, saltinis, produktas: "photo-organiser", kalba }).toString()
    });
    if (!r.ok) { res.status(502).json({ ok: false, klaida: "make" }); return; }
    pazymetiSiunta(pastas, dabar);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ ok: false, klaida: "make" });
  }
};
