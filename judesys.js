// Judesys: užuolaida, išnyrantis tekstas, krūva, laiko juostos bėgis, šachmatų ištirpimas, kontūrų linijos.
// Viskas be bibliotekų. Kas priklauso nuo slinkimo, skaičiuojama viename requestAnimationFrame.

(() => {
  const mazasJudesys = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const riba = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  // ---------- Tekstas: žodžiai arba raidės, kiekvienas savo vėlavimu ----------
  function skaidyti(el, budas) {
    budas = budas || el.dataset.split || "words";
    el.dataset.split = budas;
    el.classList.remove("rodoma");
    const tekstas = el.textContent.trim().replace(/\s+/g, " ");
    const d = parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0;
    const s = parseFloat(getComputedStyle(el).getPropertyValue("--s")) || (budas === "letters" ? 26 : 110);
    el.textContent = "";
    const sr = document.createElement("span");
    sr.className = "sr";
    sr.textContent = tekstas;
    const matomas = document.createElement("span");
    matomas.setAttribute("aria-hidden", "true");
    let i = 0;
    tekstas.split(" ").forEach((zodis, zi, visi) => {
      if (budas === "words") {
        const u = document.createElement("span");
        u.className = "u";
        u.textContent = zodis;
        u.style.transitionDelay = d + i++ * s + "ms";
        matomas.append(u);
      } else {
        const z = document.createElement("span");
        z.className = "z";
        for (const raide of zodis) {
          const u = document.createElement("span");
          u.className = "u";
          u.textContent = raide;
          u.style.transitionDelay = d + i++ * s + "ms";
          z.append(u);
        }
        matomas.append(z);
      }
      if (zi < visi.length - 1) matomas.append(" ");
    });
    el.append(sr, matomas);
  }
  $$("[data-split]").forEach((el) => skaidyti(el));

  // Metai ant didžiųjų plokščių po pasirodymo nurimsta iki 40 %
  function poRodymo(el) {
    if (el.classList.contains("plokste__metai") && el.closest(".eilute--centras")) {
      setTimeout(() => el.classList.add("nusistovejo"), 2200 + 600);
    }
  }

  // ---------- Pasirodymas, kai elementas ateina į ekraną ----------
  let stebetojas = null;
  function pradetiStebeti() {
    const elementai = $$("[data-split], [data-kyla], [data-savaites], [data-skaiciai]").filter(
      (el) => !el.hasAttribute("data-po-uzuolaidos") && !el.closest("[data-rezultatas]") && !el.closest("[data-turinys]")
    );
    if (mazasJudesys || !("IntersectionObserver" in window)) {
      elementai.forEach((el) => el.classList.add("rodoma"));
      return;
    }
    stebetojas = new IntersectionObserver(
      (irasai) =>
        irasai.forEach((ir) => {
          if (!ir.isIntersecting) return;
          ir.target.classList.add("rodoma");
          poRodymo(ir.target);
          stebetojas.unobserve(ir.target);
        }),
      { rootMargin: "0px 0px -18% 0px" }
    );
    elementai.forEach((el) => stebetojas.observe(el));
  }

  // ---------- Užuolaida ----------
  const uzuolaida = $("[data-uzuolaida]");
  function paleistiPuslapi() {
    $$("[data-po-uzuolaidos]").forEach((el) => el.classList.add("rodoma"));
    pradetiStebeti();
  }

  if (!uzuolaida || mazasJudesys) {
    uzuolaida && uzuolaida.remove();
    paleistiPuslapi();
  } else {
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = "hidden";
    let p = 0;
    let pasiruoses = false;
    let paskutinis = performance.now();
    const zingsnis = (t) => {
      const dt = Math.min(64, t - paskutinis) / 1000;
      paskutinis = t;
      // be pasiruošimo lėtai artėja prie 0,7; pasiruošus greitai baigia iki 1
      const tikslas = pasiruoses ? 1 : 0.7;
      const greitis = pasiruoses ? 9 : 0.9;
      p += (tikslas - p) * (1 - Math.exp(-greitis * dt));
      uzuolaida.style.setProperty("--p", p.toFixed(4));
      if (pasiruoses && p > 0.995) return baigti();
      requestAnimationFrame(zingsnis);
    };
    requestAnimationFrame(zingsnis);

    const nuotrauka = $(".pradzia__foto img");
    const foto = nuotrauka.decode ? nuotrauka.decode().catch(() => {}) : Promise.resolve();
    const sriftai = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([Promise.all([foto, sriftai]), new Promise((r) => setTimeout(r, 4000))]).then(() => (pasiruoses = true));

    function baigti() {
      uzuolaida.style.setProperty("--p", 1);
      uzuolaida.classList.add("isvalyta");
      setTimeout(() => {
        uzuolaida.classList.add("kyla");
        uzuolaida.setAttribute("aria-label", "Pakrauta");
        document.documentElement.style.overflow = "";
        paleistiPuslapi();
        const pradzia = performance.now();
        const salinti = () => {
          if (parseFloat(getComputedStyle(uzuolaida).opacity) <= 0.004 || performance.now() - pradzia > 3000) uzuolaida.remove();
          else requestAnimationFrame(salinti);
        };
        requestAnimationFrame(salinti);
      }, 430 + 240);
    }
  }

  // ---------- Matomumas: skaičiuojam tik tai, kas ekrane ----------
  const matomi = new Set();
  const matomumas =
    "IntersectionObserver" in window
      ? new IntersectionObserver((ir) => {
          ir.forEach((i) => (i.isIntersecting ? matomi.add(i.target) : matomi.delete(i.target)));
          prasyti();
        })
      : null;
  const stebeti = (el) => (matomumas ? matomumas.observe(el) : matomi.add(el));

  // ---------- Krūva: pirmas ekranas susitraukia ir patamsėja, kai testas užvažiuoja ----------
  const kruvosVidus = $("[data-kruva-vidus]");
  const seselis = $("[data-kruva-seselis]");
  const testas = $("#testas");

  // ---------- Laiko juosta ----------
  const istorija = $("[data-istorija]");
  const eilutes = $$("[data-eilute]");
  const begis = $("[data-begis]");
  const begioEiga = $("[data-begis-eiga]");
  const zyme = $("[data-begis-zyme]");
  if (istorija) stebeti(istorija);

  // ---------- Apačia ----------
  const apacia = $("[data-apacia]");
  const figura = $("[data-apacia-figura] img");
  if (apacia) stebeti(apacia);

  // ---------- Šachmatų vėliava: tamsa ištirpsta į šviesų bloką ----------
  const sachmatai = $("[data-sachmatai]");
  const mentoryste = $("#mentoryste");
  if (mentoryste) stebeti(mentoryste);
  const maisa = (a, b) => {
    const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  function piestiSachmatus(p) {
    const w = sachmatai.clientWidth;
    const h = sachmatai.clientHeight;
    if (sachmatai.width !== Math.round(w * DPR) || sachmatai.height !== Math.round(h * DPR)) {
      sachmatai.width = Math.round(w * DPR);
      sachmatai.height = Math.round(h * DPR);
    }
    const c = sachmatai.getContext("2d");
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, w, h);
    c.fillStyle = "#1E1A17";
    const langelis = Math.max(22, w / 42);
    const eil = Math.ceil(h / langelis);
    const stulp = Math.ceil(w / langelis);
    for (let r = 0; r < eil; r++) {
      const y = r / Math.max(1, eil - 1);
      // apatinės eilės ištirpsta pirmos, viršutinės (prie tamsaus bloko) paskutinės
      const faze = p * 1.6 - (1 - y) * 1.0;
      if (faze >= 0.55) continue;
      if (faze < 0) {
        c.fillRect(0, r * langelis, w, langelis + 0.5);
        continue;
      }
      const dalis = faze / 0.55;
      for (let k = 0; k < stulp; k++) {
        if ((r + k) % 2 === 1) continue;
        if (maisa(r, k) < dalis * 0.75) continue;
        c.fillRect(k * langelis, r * langelis, langelis + 0.5, langelis + 0.5);
      }
    }
  }

  // ---------- Vienas kadras visam slinkimui ----------
  let laukia = false;
  function kadras() {
    laukia = false;
    const vh = window.innerHeight;

    if (kruvosVidus && testas && !mazasJudesys) {
      const q = riba(1 - testas.getBoundingClientRect().top / vh);
      kruvosVidus.style.transform = q > 0 ? `scale(${1 - 0.1 * q})` : "";
      seselis.style.opacity = (0.55 * q).toFixed(3);
    }

    if (istorija && matomi.has(istorija) && window.innerWidth >= 900) {
      const u = Math.min(window.innerWidth, 1600) / 1440;
      // bėgis: nuo „bėgio viršus pasiekia ekrano vidurį" iki „bloko apačia pasiekia ekrano apačią"
      const br = begis.getBoundingClientRect();
      const paskutine = eilutes[eilutes.length - 1];
      const poilsis = paskutine.offsetTop + paskutine.offsetHeight / 2 - 50 * u;
      const eiga = riba((vh / 2 - br.top) / (br.height - vh / 2));
      const kelias = eiga * poilsis;
      begioEiga.setAttribute("height", Math.max(0, kelias).toFixed(1));
      zyme.style.setProperty("--zy", kelias.toFixed(1) + "px");
      zyme.style.setProperty("--zr", ((kelias / poilsis) * 1800).toFixed(1) + "deg");

      if (!mazasJudesys) {
        eilutes.forEach((eil) => {
          const r = eil.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const t = riba((vh - r.top) / (vh + r.height));
          const plokste = eil.querySelector("[data-paralakse]");
          const kelione = parseFloat(plokste.dataset.paralakse) * u;
          plokste.style.setProperty("--py", ((1 - 2 * t) * kelione).toFixed(1) + "px");
          const tekstas = eil.querySelector("[data-paralakse-tekstas]");
          if (tekstas) tekstas.style.setProperty("--cy", ((1 - 2 * t) * 110 * u).toFixed(1) + "px");
          const t2 = riba((vh - r.top) / (vh / 2));
          plokste.style.setProperty("--iy", (-10 + 10 * t2).toFixed(2) + "%");
        });
      }
    }

    if (sachmatai && mentoryste && matomi.has(mentoryste)) {
      const p = mazasJudesys ? 1 : riba((vh - mentoryste.getBoundingClientRect().top) / vh);
      piestiSachmatus(p);
    }

    // puslapio gale apatinių elementų nebeįmanoma prislinkti iki stebėjimo ribos: parodom juos
    if (stebetojas && window.scrollY + vh >= document.documentElement.scrollHeight - 4) {
      $$("[data-apacia] [data-kyla]:not(.rodoma), [data-apacia] [data-split]:not(.rodoma)").forEach((el) => {
        el.classList.add("rodoma");
        stebetojas.unobserve(el);
      });
    }

    if (figura && apacia && matomi.has(apacia) && !mazasJudesys) {
      const r = apacia.getBoundingClientRect();
      const t = riba((vh - r.top) / r.height);
      figura.style.setProperty("--fy", ((1 - t) * 60).toFixed(1) + "px");
    }
  }
  const prasyti = () => {
    if (!laukia) {
      laukia = true;
      requestAnimationFrame(kadras);
    }
  };
  window.addEventListener("scroll", prasyti, { passive: true });
  window.addEventListener("resize", prasyti);
  setTimeout(prasyti, 50);

  // ---------- Kontūrų linijos: keturių sinusų laukas, žygiuojantys kvadratai ----------
  const drobes = $$("canvas[data-konturai]").map((cv) => ({
    cv,
    alfa: parseFloat(cv.dataset.konturai) || 0.1,
    spalva: cv.dataset.spalva || "#EBE4DB",
  }));
  drobes.forEach((d) => stebeti(d.cv));

  function laukas(x, y, t) {
    const ax = x + 0.37 * Math.sin(y * 1.3 + t * 1.66);
    const ay = y + 0.37 * Math.sin(x * 1.1 - t * 1.66 * 0.8);
    return (
      Math.sin(ax * 1.15 + t * 0.21) +
      Math.sin(ay * 1.45 - t * 0.17) +
      Math.sin((ax + ay) * 0.8 + t * 0.13) +
      Math.sin(Math.hypot(ax - 1.8, ay - 1.1) * 1.6 - t * 0.25)
    );
  }

  function piestiKonturus(d, t) {
    const { cv } = d;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * DPR) || cv.height !== Math.round(h * DPR)) {
      cv.width = Math.round(w * DPR);
      cv.height = Math.round(h * DPR);
    }
    const c = cv.getContext("2d");
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, w, h);
    const ilgas = Math.max(w, h);
    const langelis = ilgas / 96;
    const nx = Math.ceil(w / langelis) + 1;
    const ny = Math.ceil(h / langelis) + 1;
    const mastelis = 3.8 / ilgas;
    const v = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = laukas(i * langelis * mastelis * 1.6, j * langelis * mastelis * 1.6, t);

    c.strokeStyle = d.spalva;
    c.globalAlpha = d.alfa;
    c.lineWidth = 1;
    c.beginPath();
    const lygiai = [-2.5, -1.75, -1, -0.25, 0.5, 1.25, 2, 2.75];
    const tarp = (a, b, l) => (l - a) / (b - a || 1e-6);
    for (const l of lygiai) {
      for (let j = 0; j < ny - 1; j++) {
        for (let i = 0; i < nx - 1; i++) {
          const a = v[j * nx + i], b = v[j * nx + i + 1], cc = v[(j + 1) * nx + i + 1], dd = v[(j + 1) * nx + i];
          const atvejis = (a > l ? 8 : 0) | (b > l ? 4 : 0) | (cc > l ? 2 : 0) | (dd > l ? 1 : 0);
          if (atvejis === 0 || atvejis === 15) continue;
          const x = i * langelis, y = j * langelis, s = langelis;
          const virsus = [x + s * tarp(a, b, l), y];
          const desine = [x + s, y + s * tarp(b, cc, l)];
          const apacia = [x + s * tarp(dd, cc, l), y + s];
          const kaire = [x, y + s * tarp(a, dd, l)];
          const linija = (p, q) => { c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); };
          switch (atvejis) {
            case 1: case 14: linija(kaire, apacia); break;
            case 2: case 13: linija(apacia, desine); break;
            case 3: case 12: linija(kaire, desine); break;
            case 4: case 11: linija(virsus, desine); break;
            case 5: linija(kaire, virsus); linija(apacia, desine); break;
            case 6: case 9: linija(virsus, apacia); break;
            case 7: case 8: linija(kaire, virsus); break;
            case 10: linija(kaire, apacia); linija(virsus, desine); break;
          }
        }
      }
    }
    c.stroke();
    c.globalAlpha = 1;
  }

  if (mazasJudesys) {
    window.addEventListener("load", () => drobes.forEach((d) => piestiKonturus(d, 0)));
  } else {
    let paskutinisKonturas = 0;
    const pradzia = performance.now();
    const ciklas = (t) => {
      if (t - paskutinisKonturas >= 24 && !document.hidden) {
        paskutinisKonturas = t;
        const laikas = (t - pradzia) / 1000;
        drobes.forEach((d) => matomi.has(d.cv) && piestiKonturus(d, laikas));
      }
      requestAnimationFrame(ciklas);
    };
    requestAnimationFrame(ciklas);
  }

  // testas.js naudoja tą patį teksto skaidymą klausimams ir rezultatui
  window.Judesys = {
    mazasJudesys,
    skaidyti,
    parodyti(el) {
      if (mazasJudesys) return el.classList.add("rodoma");
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("rodoma")));
    },
  };
})();
