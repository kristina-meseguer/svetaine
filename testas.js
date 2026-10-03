// Testas „Ar tau tinka Claude Code?". Tekstai iš mentoryste-claude/testas-tinka.
// Atsakymai niekur nesiunčiami: viskas skaičiuojasi žmogaus naršyklėje.

const KLAUSIMAI = [
  {
    tekstas: "Ar turi Mac arba Windows kompiuterį?",
    atsakymai: [
      { tekstas: "Taip", balai: 2 },
      { tekstas: "Turiu tik telefoną ar planšetę", stop: "telefonas" },
    ],
  },
  {
    tekstas: "Kiek valandų per savaitę darai tą patį darbą?",
    pastaba: "Pavyzdžiui: atsakai į tuos pačius klausimus, rašai panašius tekstus, tvarkai failus ar montuoji video.",
    atsakymai: [
      { tekstas: "Mažiau nei 2 valandas", balai: 0 },
      { tekstas: "Nuo 2 iki 5 valandų", balai: 1 },
      { tekstas: "Daugiau nei 5 valandas", balai: 2 },
    ],
  },
  {
    tekstas: "Ar 9 savaites gali skirti apie valandą per dieną?",
    atsakymai: [
      { tekstas: "Taip", balai: 2 },
      { tekstas: "Ne kasdien, bet dažnai", balai: 1 },
      { tekstas: "Ne", balai: 0 },
    ],
  },
  {
    tekstas: "Kaip jautiesi su technika?",
    atsakymai: [
      { tekstas: "Bijau, bet noriu išmokti", balai: 2 },
      { tekstas: "Moku tiek, kiek reikia", balai: 2 },
      { tekstas: "Noriu, kad viskas būtų padaryta už mane", stop: "uz-mane" },
    ],
  },
  {
    tekstas: "Ką norėtum, kad Claude darytų pirmiausia?",
    pastaba: "Šitas klausimas be balų. Jis pasako, nuo ko pradėti, jei tau tinka.",
    atsakymai: [
      { raide: "A", tekstas: "turinį ir video" },
      { raide: "B", tekstas: "dokumentus ir atmintines klientams" },
      { raide: "C", tekstas: "mano produktą" },
      { raide: "D", tekstas: "laiškus ir dienos tvarką" },
    ],
  },
];

const PRADZIA = {
  A: "montažas ir reels (3 ir 7 savaitės)",
  B: "atmintinės, kainoraščiai ir pasiūlymai PDF formatu (4 savaitė)",
  C: "tavo produktas, kaina ir paleidimas (4, 8 ir 9 savaitės)",
  D: "pašto jungtis ir rytinė ataskaita (2 ir 5 savaitės)",
};

const REZULTATAI = {
  tinka: {
    pavadinimas: "Tinka",
    aprasas: "Tu turi kompiuterį, laiko mokytis ir noro daryti pats. Kuo daugiau valandų suskaičiavai antrame klausime, tuo daugiau darbo Claude gali iš tavęs perimti.",
  },
  planas: {
    pavadinimas: "Tinka, bet su planu",
    aprasas: "Pradėti gali, bet pirma pasitarkim, ar dabar tavo metas ir nuo ko pradėti. Pirmą savaitę dirbi savarankiškai, kada tau patogu.",
  },
  netinka: {
    pavadinimas: "Kol kas netinka",
    aprasas: "Be kompiuterio, be laiko ar be noro daryti pačiam mentorystė tau neduos to, ko tikiesi. Grįžk, kai tai pasikeis. Tai ne trūkumas, tai tik ne tas metas.",
  },
};

const STOP_PRIEZASTIS = {
  telefonas: "Telefone Claude yra, bet tavo kompiuterio failų jis nemato. Mokymams reikia Mac arba Windows kompiuterio.",
  "uz-mane": "Claude darbus padaro, bet pasakyti, ko nori, ir patikrinti, ką jis padarė, turėsi tu.",
};

const MAX_BALU = 8;

// ---------- Elementai ----------
const $ = (s) => document.querySelector(s);
const sekcija = $("#testas");
const klausimoBlokas = $("[data-klausimas]");
const turinys = $("[data-turinys]");
const nr = $("[data-nr]");
const eiga = $("[data-eiga]");
const tekstas = $("[data-tekstas]");
const pastaba = $("[data-pastaba]");
const atsakymai = $("[data-atsakymai]");
const atgal = $("[data-atgal]");
const rezultatas = $("[data-rezultatas]");
const veikla = $("[data-veikla]");
const perziura = $("[data-perziura]");
const busena = $("[data-busena]");
const mazasJudesys = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let dabartinis = 0;
let pasirinkta = []; // atsakymo indeksas kiekvienam klausimui
let galutinis = null;

// ---------- Klausimai ----------
function rodytiKlausima(i, kryptis = "pirmyn") {
  const k = KLAUSIMAI[i];
  const piesti = () => {
    nr.textContent = i + 1;
    eiga.style.width = ((i + 1) / KLAUSIMAI.length) * 100 + "%";
    tekstas.textContent = k.tekstas;
    tekstas.style.setProperty("--s", "60");
    if (window.Judesys) Judesys.skaidyti(tekstas, "words");
    pastaba.hidden = !k.pastaba;
    pastaba.textContent = k.pastaba || "";
    atsakymai.setAttribute("aria-label", k.tekstas);
    atsakymai.innerHTML = "";
    k.atsakymai.forEach((a, j) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atsakymas";
      b.style.setProperty("--i", j);
      b.setAttribute("aria-pressed", pasirinkta[i] === j ? "true" : "false");
      if (a.raide) {
        const r = document.createElement("span");
        r.className = "atsakymas__raide";
        r.textContent = a.raide;
        b.append(r);
      }
      b.append(document.createTextNode(a.tekstas));
      b.addEventListener("click", () => pasirinkti(i, j, b));
      atsakymai.append(b);
    });
    atgal.hidden = i === 0;
    turinys.classList.remove("iseina");
    turinys.classList.remove("ateina");
    void turinys.offsetWidth;
    turinys.classList.add("ateina");
    if (window.Judesys) Judesys.parodyti(tekstas);
  };
  if (kryptis && !mazasJudesys && tekstas.textContent) {
    turinys.classList.add("iseina");
    setTimeout(piesti, 180);
  } else {
    piesti();
  }
  dabartinis = i;
}

function pasirinkti(i, j, mygtukas) {
  pasirinkta[i] = j;
  pasirinkta.length = i + 1; // pakeitus atsakymą, tolesni nebegalioja
  atsakymai.querySelectorAll(".atsakymas").forEach((b) => b.setAttribute("aria-pressed", "false"));
  mygtukas.setAttribute("aria-pressed", "true");
  const a = KLAUSIMAI[i].atsakymai[j];
  setTimeout(() => {
    if (a.stop || i === KLAUSIMAI.length - 1) {
      rodytiRezultata();
    } else {
      rodytiKlausima(i + 1);
      tekstas.focus({ preventScroll: true });
    }
  }, mazasJudesys ? 0 : 260);
}

atgal.addEventListener("click", () => {
  if (dabartinis > 0) rodytiKlausima(dabartinis - 1, "atgal");
});

// ---------- Rezultatas ----------
function suskaiciuoti() {
  let balai = 0;
  let stop = null;
  let raide = null;
  pasirinkta.forEach((j, i) => {
    const a = KLAUSIMAI[i].atsakymai[j];
    if (a.stop) stop = a.stop;
    if (a.balai) balai += a.balai;
    if (a.raide) raide = a.raide;
  });
  let tipas = "netinka";
  if (!stop && balai >= 6) tipas = "tinka";
  else if (!stop && balai >= 3) tipas = "planas";
  return { balai, stop, raide, tipas };
}

function baluZodis(n) {
  const d = n % 10;
  const s = n % 100;
  if (d === 0 || (s >= 10 && s <= 20)) return n + " balų";
  if (d === 1) return n + " balas";
  return n + " balai";
}

function rodytiRezultata() {
  galutinis = suskaiciuoti();
  const r = REZULTATAI[galutinis.tipas];
  const pavadinimas = $("[data-rez-pavadinimas]");
  pavadinimas.textContent = r.pavadinimas;
  pavadinimas.style.setProperty("--d", "120");
  pavadinimas.style.setProperty("--s", "34");
  if (window.Judesys) Judesys.skaidyti(pavadinimas, "letters");
  $("[data-rez-balai]").textContent = galutinis.stop ? "" : baluZodis(galutinis.balai) + " iš " + MAX_BALU;
  $("[data-rez-balai]").hidden = !!galutinis.stop;
  $("[data-rez-aprasas]").textContent = galutinis.stop
    ? STOP_PRIEZASTIS[galutinis.stop] + " " + r.aprasas
    : r.aprasas;

  const tinka = galutinis.tipas !== "netinka";
  const pradzia = $("[data-rez-pradzia]");
  pradzia.hidden = !(tinka && galutinis.raide);
  if (tinka && galutinis.raide) {
    pradzia.innerHTML = "";
    const st = document.createElement("strong");
    st.textContent = "Nuo ko pradėti tau: ";
    pradzia.append(st, document.createTextNode(PRADZIA[galutinis.raide] + "."));
  }
  $("[data-zinute]").hidden = !tinka;
  $("[data-netinka]").hidden = tinka;
  busena.textContent = "";
  atnaujintiZinute();

  klausimoBlokas.hidden = true;
  rezultatas.hidden = false;
  sekcija.classList.add("rodomas-rezultatas");
  rezultatas.classList.remove("ateina");
  void rezultatas.offsetWidth;
  rezultatas.classList.add("ateina");
  if (window.Judesys) Judesys.parodyti(pavadinimas);
  sekcija.scrollIntoView({ behavior: mazasJudesys ? "auto" : "smooth", block: "start" });
  $("[data-rez-pavadinimas]").focus({ preventScroll: true });
}

function zinutesTekstas() {
  if (!galutinis) return "";
  const dalys = ["TESTAS", baluZodis(galutinis.balai)];
  if (galutinis.raide) dalys.push(galutinis.raide);
  const v = veikla.value.trim();
  if (v) dalys.push("veikla: " + v);
  return dalys.join(", ");
}

function atnaujintiZinute() {
  perziura.textContent = zinutesTekstas();
}
veikla.addEventListener("input", atnaujintiZinute);

// Mygtukas nukopijuoja žinutę ir atidaro Instagram pokalbį (nuoroda pati veikia ir be kopijavimo)
$("[data-rasyti]").addEventListener("click", () => {
  const t = zinutesTekstas();
  const pavyko = () => (busena.textContent = "Žinutė nukopijuota. Instagram pokalbyje paspausk ir palaikyk laukelį, tada „Įklijuoti“.");
  const nepavyko = () => (busena.textContent = "Nepavyko nukopijuoti. Parašyk ranka: " + t);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(t).then(pavyko, nepavyko);
  } else {
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.append(ta);
      ta.select();
      document.execCommand("copy") ? pavyko() : nepavyko();
      ta.remove();
    } catch (e) {
      nepavyko();
    }
  }
});

$("[data-is-naujo]").addEventListener("click", () => {
  pasirinkta = [];
  galutinis = null;
  veikla.value = "";
  rezultatas.hidden = true;
  klausimoBlokas.hidden = false;
  sekcija.classList.remove("rodomas-rezultatas");
  tekstas.textContent = "";
  rodytiKlausima(0, null);
  sekcija.scrollIntoView({ behavior: mazasJudesys ? "auto" : "smooth", block: "start" });
  tekstas.focus({ preventScroll: true });
});

// Mygtukai „Pradėti testą": nuveda prie testo ir perkelia fokusą į klausimą
document.querySelectorAll("[data-pradeti]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    sekcija.scrollIntoView({ behavior: mazasJudesys ? "auto" : "smooth", block: "start" });
    const fokusas = rezultatas.hidden ? tekstas : $("[data-rez-pavadinimas]");
    setTimeout(() => fokusas.focus({ preventScroll: true }), mazasJudesys ? 0 : 500);
  })
);

rodytiKlausima(0, null);
