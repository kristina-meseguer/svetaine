// „Ką Claude padarys tavo darbe": profesijos ir darbai.
// Tekstai iš mentoryste-claude/mentoryste-2-men/06-mentoryste-700 (mentorystės programa).

const PROFESIJOS = [
  {
    pavadinimas: "Grožio specialistams",
    kam: "Kosmetologams, antakių, blakstienų ir permanento meistrams, kirpėjams, nagų meistrams, masažuotojams.",
    darbai: [
      "Iš tavo žodžių parašo priežiūros atmintinę po procedūros ir padaro ją gražiu PDF, kurį siunti klientui.",
      "Sudėlioja kainoraštį ir paslaugų aprašymus.",
      "Parašo atsakymus į klausimus, kurie kartojasi kasdien („kiek kainuoja?“, „ar skauda?“). Juos įklijuoji tu.",
      "Sumontuoja tavo reels, sugalvoja idėjų ir parašo tekstus po įrašais.",
    ],
    savaites: "3 sav. montažas, 4 sav. tavo produktas ar PDF, 6-9 sav. filmavimas, stories ir pardavimai.",
  },
  {
    pavadinimas: "Koučeriams ir konsultantams",
    kam: "Koučeriams, konsultantams ir mentoriams, kurie turi metodą galvoje, bet ne popieriuje.",
    darbai: [
      "Tu padiktuoji balsu arba įklijuoji užrašus, o Claude sudėlioja programos struktūrą ar PDF gidą.",
      "Iš tavo užrašų po sesijos parašo santrauką ir namų darbus klientui.",
      "Parašo produkto aprašymą ir paprastą puslapį, kur jį pristatai.",
    ],
    savaites: "4 sav. produktas: aprašas, PDF gidas ir puslapis, 8 sav. pasiūlymas ir kaina.",
  },
  {
    pavadinimas: "Teisininkams ir buhalteriams",
    kam: "Teisininkams, buhalteriams ir finansų konsultantams, kurie klientams aiškina tą patį ir rašo tuos pačius tekstus.",
    darbai: [
      "Ilgą dokumentą perskaito ir parašo vieno lapo santrauką klientui paprasta kalba.",
      "Paruošia kliento anketą ir atmintinę, ką atsinešti į konsultaciją.",
      "Perskaito paštą ir paruošia atsakymų juodraščius. Siunti tu.",
    ],
    savaites: "2 sav. pašto jungtis, 4 sav. tavo paslaugos aprašas ir puslapis.",
  },
  {
    pavadinimas: "NT agentams",
    kam: "Tiems, kas kiekvieną savaitę rašo skelbimus, tvarko nuotraukas ir siunčia klientams pasiūlymus.",
    darbai: [
      "Peržiūri objekto nuotraukas, pervadina jas pagal kambarius ir sudeda į aplanką.",
      "Iš tavo užrašų parašo skelbimą lietuviškai ir angliškai.",
      "Iš kelių skelbimų padaro palyginimo lentelę klientui PDF formatu.",
      "Parašo įrašus ir sumontuoja video apie objektus.",
    ],
    savaites: "3 sav. montažas ir karuselės, 6-9 sav. turinys ir pardavimai.",
  },
  {
    pavadinimas: "Mokytojams ir treneriams",
    kam: "Mokytojams, korepetitoriams, sporto treneriams ir fotografams, kurie tą patį darbą kiekvienam daro iš naujo.",
    darbai: [
      "Mokytojams: iš vadovėlio skyriaus padaro kelis testo variantus ir atsakymų lapą.",
      "Treneriams: pagal tavo šabloną padaro asmeninius planus PDF kiekvienam klientui.",
      "Fotografams: pervadina šimtus failų pagal datą ir klientą ir sudeda juos į aplankus.",
    ],
    savaites: "1 sav. diegimas ir pirmi skilai, 4 sav. PDF ir puslapis, 6-9 sav. turinys.",
  },
  {
    pavadinimas: "Turinio kūrėjams",
    kam: "Tiems, kas patys veda savo Instagram, parduoda prekes ar paslaugas ir neturi nei montuotojo, nei asistento.",
    darbai: [
      "Sumontuoja tavo video: sukarpo, uždeda subtitrus. Pirmą variantą pažiūri ir pataisai.",
      "Sugalvoja idėjų, parašo scenarijus, tekstus po įrašais ir prekių aprašymus.",
      "Perskaito tavo Instagram statistiką ir pasako, kas veikė.",
      "Kiekvieną rytą paruošia ataskaitą: skaičius ir žinučių juodraščius.",
    ],
    savaites: "2 sav. Instagram ir pašto jungtys, 3 sav. montažas, 5 sav. rytinė ataskaita, 7 sav. reels ir stories.",
  },
  {
    pavadinimas: "Pirmam produktui",
    kam: "Tiems, kas turi žinių, bet dar nieko neparduoda, ir tiems, kas nori būti matomi, bet stringa prie kameros.",
    darbai: [
      "Su Claude sudėlioji savo pirmą PDF gidą ar paslaugos aprašą ir paprastą puslapį.",
      "Antrą mėnesį mokaisi filmuotis po 15 sekundžių per dieną, kurti stories ir reels.",
      "Sudėlioji pasiūlymą, kainą ir paprastą kelią nuo įrašo iki žinutės.",
    ],
    savaites: "4 sav. produktas, 6 sav. kamera, 8 sav. pasiūlymas, 9 sav. pirmas paleidimas.",
  },
];

(() => {
  const sarasas = document.querySelector("[data-profesijos]");
  const skydas = document.querySelector("[data-darbai-skydas]");
  if (!sarasas || !skydas) return;
  const mazasJudesys = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mygtukai = [];

  function rodyti(i, fokusuoti) {
    const p = PROFESIJOS[i];
    mygtukai.forEach((b, j) => {
      const aktyvus = i === j;
      b.setAttribute("aria-selected", aktyvus ? "true" : "false");
      b.tabIndex = aktyvus ? 0 : -1;
    });
    if (fokusuoti) {
      mygtukai[i].focus();
      mygtukai[i].scrollIntoView({ block: "nearest", inline: "center", behavior: mazasJudesys ? "auto" : "smooth" });
    }
    skydas.setAttribute("aria-labelledby", "profesija-" + i);
    skydas.innerHTML = "";

    const h = document.createElement("h3");
    h.className = "darbai__pavadinimas";
    h.textContent = p.pavadinimas;
    const kam = document.createElement("p");
    kam.className = "darbai__kam";
    kam.textContent = p.kam;
    const ul = document.createElement("ul");
    ul.className = "darbai__sarasas";
    p.darbai.forEach((d) => {
      const li = document.createElement("li");
      li.textContent = d;
      ul.append(li);
    });
    const sav = document.createElement("p");
    sav.className = "darbai__savaites";
    const st = document.createElement("strong");
    st.textContent = "Mentorystėje: ";
    sav.append(st, document.createTextNode(p.savaites));

    const dalys = [h, kam, ...ul.children, sav];
    dalys.forEach((el, k) => {
      el.classList.add("darbai__kyla");
      el.style.transitionDelay = k * 60 + "ms";
    });
    skydas.append(h, kam, ul, sav);
    if (mazasJudesys) dalys.forEach((el) => el.classList.add("rodoma"));
    else requestAnimationFrame(() => requestAnimationFrame(() => dalys.forEach((el) => el.classList.add("rodoma"))));
  }

  PROFESIJOS.forEach((p, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "profesija";
    b.id = "profesija-" + i;
    b.setAttribute("role", "tab");
    b.textContent = p.pavadinimas;
    b.addEventListener("click", () => rodyti(i));
    b.addEventListener("keydown", (e) => {
      const kryptis = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!kryptis) return;
      e.preventDefault();
      rodyti((i + kryptis + PROFESIJOS.length) % PROFESIJOS.length, true);
    });
    mygtukai.push(b);
    sarasas.append(b);
  });
  rodyti(0);
})();
