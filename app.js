// BRATV — o conteúdo vem do site.json (editado pelo painel /admin)
const CONFIG = {
  planilha: "",   // URL do Apps Script (Google Planilhas) que recebe os leads
  jogos: "https://script.google.com/macros/s/AKfycbzd172L9dOLvHoMEnFhhw5SH_cBbZStj2hYwXdhW-LKihxi_OLGJwSzMU3nwCWnVl07/exec"
};
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let D = null;

/* ---------- Fila: uma animação de texto por vez ---------- */
const Q = []; let qBusy = false;
function enqueue(el, base) { if (!el) return; Q.push([el, base]); runQ(); }
function runQ() { if (qBusy || !Q.length) return; qBusy = true; const [el, b] = Q.shift(); const n = formText(el, b) || 0; setTimeout(() => { qBusy = false; runQ(); }, (b + n * 0.022 + 0.45) * 1000); }

/* ---------- Aberração de lente ---------- */
const LENS_SEL = "h1,h2,h3,.syn,.tags,.meta-top,.sec-t span,.stats b,.stats span,.card .nm,.rc p,.faq summary,.sub,.capture .kick,.ch,.big,.final p,.logo img,.final img,.meta-top img";
function lens() {
  const W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2, K = W < 700 ? 0.7 : 1.6;
  document.querySelectorAll(LENS_SEL).forEach(el => {
    el.classList.add("lens");
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > H) return;
    const dx = ((r.left + r.width / 2) - cx) / cx, dy = ((r.top + r.height / 2) - cy) / cy;
    el.style.setProperty("--cx", (dx * Math.abs(dx) * K).toFixed(2) + "px");
    el.style.setProperty("--cy", (dy * Math.abs(dy) * K * .6).toFixed(2) + "px");
  });
}
let lensT; const lensReq = () => { clearTimeout(lensT); lensT = setTimeout(lens, 140); };
addEventListener("scroll", lensReq, { passive: true }); addEventListener("resize", lensReq);

/* ---------- Palavras se formando ---------- */
function formText(el, base) {
  if (!el) return; let k = 0;
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(w => {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
        const wd = document.createElement("span"); wd.className = "wd";
        [...w].forEach(c => { const s = document.createElement("span"); s.className = "lt"; s.textContent = c; s.style.setProperty("--d", (base + k * 0.022 + Math.random() * 0.05).toFixed(3) + "s"); k++; wd.appendChild(s); });
        frag.appendChild(wd);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) walk(n);
  });
  walk(el);
  return k;
}

/* ---------- Cards ---------- */
const fmt = n => n.toLocaleString("pt-BR");
const card = o => {
  const img = o.img ? `#111 url('${esc(o.img)}') center/cover` : "linear-gradient(150deg,#333,#111)";
  const nome = (!o.img || o.mostrarNome) ? `<div class="nm" style="font-family:'Bebas Neue',sans-serif;font-size:${o.fs || 28}px">${esc(o.titulo)}</div>` : "";
  return `<div class="card" tabindex="0" title="${esc(o.titulo)}"><div class="cv" style="background:${img}"></div>${o.selo ? `<span class="badge">${esc(o.selo)}</span>` : ""}${o.qualidade ? `<span class="q">${esc(o.qualidade)}</span>` : ""}${nome}${o.progresso ? `<div class="pr" style="width:${+o.progresso}%"></div>` : ""}<div class="info"><span class="m">${esc(o.relevancia || "96%")} relevante</span><span class="b">${esc(o.idade || "14")}</span><span>${esc(o.genero)}</span></div></div>`;
};

/* ---------- Render a partir do site.json ---------- */
function render() {
  document.querySelectorAll("[data-logo]").forEach(i => i.src = D.logo || "logo.png");
  const T = D.textos || {};
  document.querySelectorAll("[data-txt]").forEach(el => { const v = T[el.dataset.txt]; if (v != null && v !== "") el.textContent = v; });
  $("faqList").innerHTML = (D.faq || []).map((f, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(f.p)}</summary><p>${esc(f.r)}</p></details>`).join("");
  $("stats").innerHTML = (D.stats || []).map(s => {
    const num = /^\d+$/.test(String(s.valor).replace(/\./g, ""));
    return `<div><b ${num ? `data-n="${String(s.valor).replace(/\./g, "")}"` : ""}>${num ? fmt(+String(s.valor).replace(/\./g, "")) : esc(s.valor)}<i>${esc(s.destaque)}</i></b><span>${esc(s.label)}</span></div>`;
  }).join("");
  $("top10").innerHTML = (D.top10 || []).map((o, i) => `<div class="it"><span class="n">${i + 1}</span>${card(o)}</div>`).join("");
  $("cont").innerHTML = (D.continuar || []).map(card).join("");
  $("esp").innerHTML = (D.esportes || []).map(card).join("");
  $("kids").innerHTML = (D.infantil || []).map(card).join("");
  const tk = D.ticker || [];
  $("track").innerHTML = [...tk, ...tk].map(t => `<span>${t}</span>`).join("");
  $("scenes").innerHTML = (D.destaques || []).map((f, i) => {
    const m = f.imgMobile ? `--m:url('${esc(f.imgMobile)}');` : "";
    return `<div class="scene${i === 0 ? " on" : ""}"><div class="art img${f.imgMobile ? " has-m" : ""}" style="background-image:url('${esc(f.img)}');${f.posicao ? `background-position:${esc(f.posicao)};` : ""}${m}"></div></div>`;
  }).join("");
}

/* ---------- Billboard ---------- */
let cur = 0, timer, first = true, billOff = false;
function tags(f) {
  return [f.relevancia ? `<span class="m">${esc(f.relevancia)} relevante</span>` : "", f.aoVivo ? `<span class="live">AO VIVO</span>` : "", f.ano ? `<span>${esc(f.ano)}</span>` : "", f.idade ? `<span class="b">${esc(f.idade)}</span>` : "", f.genero ? `<span>${esc(f.genero)}</span>` : "", f.qualidade ? `<span class="b">${esc(f.qualidade)}</span>` : ""].join("");
}
function show(i) {
  const F = D.destaques || []; if (!F.length) return;
  cur = i;
  document.querySelectorAll(".scene").forEach((s, k) => s.classList.toggle("on", k === i));
  const f = F[i];
  const bi = $("billInfo");
  bi.innerHTML = `<div class="meta-top"><img src="${esc(D.logo || "logo.png")}" alt="BRATV" style="height:18px;width:auto"> ${esc(f.tipo)}</div><h1 class="ttl ${esc(f.estilo || "")}">${esc(f.titulo)}</h1><div class="tags">${tags(f)}</div><p class="syn">${esc(f.sinopse)}</p>`;
  enqueue(bi.querySelector(".ttl"), first ? 2.3 : 0.05);
  bi.classList.toggle("arttitle", !!f.tituloNaArte); bi.classList.remove("glitch"); void bi.offsetWidth; if (!first) bi.classList.add("glitch"); first = false;
  const dots = $("dots");
  [...dots.children].forEach((d, k) => { d.classList.remove("on", "done"); if (k < i) d.classList.add("done"); });
  void dots.offsetWidth; dots.children[i] && dots.children[i].classList.add("on");
  clearTimeout(timer); if (!billOff) timer = setTimeout(() => show((cur + 1) % F.length), 7000);
}
function setupBillboard() {
  const F = D.destaques || [];
  const dots = $("dots");
  dots.innerHTML = F.map((_, i) => `<button aria-label="Destaque ${i + 1}"><i></i></button>`).join("");
  [...dots.children].forEach((d, i) => d.addEventListener("click", () => show(i)));
  show(0);
  new IntersectionObserver(([e]) => { billOff = !e.isIntersecting; document.querySelector(".bill").classList.toggle("off", billOff); clearTimeout(timer); if (!billOff && F.length) timer = setTimeout(() => show((cur + 1) % F.length), 7000); }).observe(document.querySelector(".bill"));
  new IntersectionObserver(([e]) => document.querySelector(".ticker").classList.toggle("off", !e.isIntersecting)).observe(document.querySelector(".ticker"));
}

/* ---------- Contadores ---------- */
function setupCounters() {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const el = e.target, n = +el.dataset.n, suf = el.innerHTML.replace(/^[^<]*/, ""); const t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / 1400); el.innerHTML = fmt(Math.round(n * (1 - Math.pow(1 - p, 3)))) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .4 });
  document.querySelectorAll("[data-n]").forEach(el => io.observe(el));
}

/* ---------- Jogos reais do dia ---------- */
function rotuloJogo(j) {
  if (j.status === "IN_PLAY" || j.status === "PAUSED") return { badge: "AO VIVO", placar: `${j.golsCasa ?? 0} x ${j.golsFora ?? 0}`, tk: "<em>ao vivo</em>" };
  if (j.status === "FINISHED") return { badge: "ENCERRADO", placar: `${j.golsCasa} x ${j.golsFora}`, tk: "<em>fim</em>" };
  return { badge: "HOJE " + j.hora.replace(":00", "H").replace(":", "H"), placar: "x", tk: `<em>${j.hora}</em>` };
}
async function carregarJogos() {
  if (!CONFIG.jogos) return;
  try {
    const r = await fetch(CONFIG.jogos); const d = await r.json();
    const js = (d.jogos || []).slice(0, 12); if (!js.length) return;
    const ord = { IN_PLAY: 0, PAUSED: 0, TIMED: 1, SCHEDULED: 1, FINISHED: 2 };
    js.sort((a, b) => (ord[a.status] ?? 1) - (ord[b.status] ?? 1) || a.hora.localeCompare(b.hora));
    const tk = js.map(j => { const l = rotuloJogo(j); return `<b>${esc(j.casa)} ${l.placar} ${esc(j.fora)}</b> ${esc(j.competicao)} ${l.tk}`; });
    $("track").innerHTML = [...tk, ...tk].map(t => `<span>${t}</span>`).join("");
    const fotos = (D.esportes || []).filter(e => /futebol/i.test(e.genero || "")).map(e => e.img);
    const outros = (D.esportes || []).filter(e => !/futebol/i.test(e.genero || ""));
    const cards = js.slice(0, 6).map((j, i) => { const l = rotuloJogo(j); return { titulo: `${j.casa} × ${j.fora}`, genero: j.competicao, img: fotos.length ? fotos[i % fotos.length] : "", mostrarNome: true, selo: l.badge, idade: "L", fs: 20 }; });
    $("esp").innerHTML = [...cards, ...outros].map(card).join("");
  } catch (e) { /* sem conexão: mantém os cards do painel */ }
}

/* ---------- Guia de programação ---------- */
function buildEPG() {
  const now = new Date();
  const start = new Date(now); start.setMinutes(now.getMinutes() < 30 ? 0 : 30, 0, 0); start.setMinutes(start.getMinutes() - 30);
  const SPAN = 180, pct = m => (m / SPAN * 100);
  const hh = d => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  let head = `<div class="epg-head"><div class="ch" style="font-weight:600;color:var(--mute)">Canal</div><div class="times">`;
  for (let m = 0; m < SPAN; m += 30) head += `<span style="left:${pct(m)}%">${hh(new Date(start.getTime() + m * 60000))}</span>`;
  head += `</div></div>`;
  const CH = [
    ["Esporte 1", "E1", "#166534", [["Pré-jogo", 40], ["Capital × Litoral", 110], ["Pós-jogo", 60]]],
    ["Cinema Total", "CT", "#7c2d12", [["Maré Alta", 95], ["Poeira Vermelha", 124]]],
    ["Jornal 24h", "24", "#1e3a8a", [["Edição da tarde", 60], ["Mercado", 30], ["Brasil Agora", 60], ["Edição da noite", 60]]],
    ["Luta PPV", "PPV", "#991b1b", [["Card preliminar", 120], ["Noite de Campeões", 120]]],
    ["Séries+", "S+", "#6d28d9", [["Herdeiros E7", 50], ["Herdeiros E8", 50], ["Código Zero E1", 55], ["Código Zero E2", 55]]],
    ["Kids", "K", "#db2777", [["Turma do Quintal", 25], ["Dino Rex", 25], ["Planeta Bolha", 25], ["Robôs em Férias", 25], ["Fadas do Lago", 25], ["Dino Rex", 25], ["Turma do Quintal", 25], ["Planeta Bolha", 25]]]
  ];
  const nowM = (now - start) / 60000; let rows = "";
  CH.forEach(([nm, ab, col, progs], ci) => {
    let m = -((ci * 13) % 35), cells = "";
    progs.forEach(([t, d]) => {
      const a = Math.max(0, m), b = Math.min(SPAN, m + d);
      if (b > 0 && a < SPAN) {
        const st = new Date(start.getTime() + m * 60000), en = new Date(start.getTime() + (m + d) * 60000);
        cells += `<div class="prog${nowM >= m && nowM < m + d ? " now" : ""}" style="left:calc(${pct(a)}% + 3px);width:calc(${pct(b - a)}% - 6px)"><b>${t}</b><small>${hh(st)} – ${hh(en)}</small></div>`;
      }
      m += d;
    });
    rows += `<div class="epg-row"><div class="ch"><i style="background:${col}">${ab}</i>${nm}</div><div class="progs">${cells}</div></div>`;
  });
  $("epg").innerHTML = head + rows + `<div class="nowline" style="left:calc(150px + (100% - 150px) * ${nowM / SPAN})"></div>`;
  $("clock").textContent = "Agora: " + hh(now);
}

/* ---------- Calculadora ---------- */
function calc() {
  const m = +$("mes").value, a = +$("anos").value, r = +$("reaj").value / 100;
  let tot = 0; for (let y = 0; y < a; y++) tot += m * 12 * Math.pow(1 + r, y);
  $("vm").textContent = "R$ " + m; $("va").textContent = a + (a > 1 ? " anos" : " ano"); $("vr").textContent = Math.round(r * 100) + "%";
  $("tot").textContent = "R$ " + fmt(Math.round(tot)); $("nm").textContent = a * 12;
}

/* ---------- Lead ---------- */
function origem() { try { return new URLSearchParams(location.search).get("utm_source") || "direto"; } catch (e) { return "direto"; } }
function codigo(o) { const m = { facebook: "FB", fb: "FB", instagram: "IG", ig: "IG", google: "GG", youtube: "YT", yt: "YT", tiktok: "TK", whatsapp: "WA", direto: "DR" }; const pre = m[o.toLowerCase()] || o.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "DR"; return "BRA-" + pre + Math.random().toString(36).slice(2, 7).toUpperCase(); }
function salvarLead(lead) { if (!CONFIG.planilha) return; try { fetch(CONFIG.planilha, { method: "POST", mode: "no-cors", body: JSON.stringify(lead) }).catch(() => {}); } catch (e) {} }
function setupLead() {
  const zap = msg => "https://wa.me/" + (D.whatsapp || "") + "?text=" + encodeURIComponent(msg);
  const ABRE = D.mensagem || "Gostaria de testar grátis o sistema vitalício e sem mensalidade dos canais.";
  const COD = codigo(origem());
  document.querySelectorAll(".js-zap").forEach(a => a.href = zap(ABRE + "\nCupom de desconto: " + COD));
  let nome = "";
  const passo = n => [1, 2, 3].forEach(i => { $("step" + i).hidden = i !== n; $("p" + i).classList.toggle("on", i <= n); });
  $("step1").addEventListener("submit", e => {
    e.preventDefault();
    nome = $("nome").value.trim();
    if (nome.length < 2) { $("err").textContent = "Digite seu nome para continuar."; $("nome").focus(); return; }
    $("err").textContent = "";
    $("ola").textContent = nome.split(" ")[0] + ", onde você vai assistir?";
    passo(2);
  });
  $("voltar").addEventListener("click", () => passo(1));
  document.querySelectorAll(".dev").forEach(b => b.addEventListener("click", () => {
    const ap = b.dataset.d;
    $("abrirZap").href = zap(ABRE + "\nNome: " + nome + "\nAparelho: " + ap + "\nCupom de desconto: " + COD);
    $("resumo").innerHTML = "Seu cupom de desconto:<br><span class=\"coupon\">" + COD + "</span><br>Toque no botão para liberar o teste no seu " + esc(ap === "Outro aparelho" ? "aparelho" : ap) + ".";
    passo(3);
    salvarLead({ codigo: COD, nome, aparelho: ap, origem: origem(), data: new Date().toISOString() });
  }));
}

/* ---------- Início ---------- */
async function boot() {
  try {
    const r = await fetch("site.json?v=" + Date.now(), { cache: "no-store" });
    D = await r.json();
  } catch (e) { D = { destaques: [], textos: {} }; }
  render();
  setupBillboard();
  setupCounters();
  setupLead();
  addEventListener("scroll", () => $("nav").classList.toggle("solid", scrollY > 40), { passive: true });
  buildEPG(); setInterval(buildEPG, 60000);
  ["mes", "anos", "reaj"].forEach(id => $(id).addEventListener("input", calc)); calc();
  carregarJogos(); setInterval(carregarJogos, 120000);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    enqueue($("capH"), 0);
    const fo = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fo.unobserve(e.target); enqueue(e.target, 0.05); } }), { threshold: .4, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".sec-t h2,.faq h2,.calc h2,.trial h2,.rc h3,.final h2,.stats span,.calc .r .lb").forEach(h => fo.observe(h));
  }
  setTimeout(lens, 60);
}
boot();
