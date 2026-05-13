toggleAuto?.();
(function () {
  function redirect404() { window.location = "404.php"; }

  function Checkk() {
    try {
      const el = document.querySelector(".nav-link.dropdown-toggle .small");
      const deger = el ? el.textContent.trim() : "";
      if (!deger || typeof CryptoJS === "undefined" || !CryptoJS.MD5) { redirect404(); return; }
      const hash1 = CryptoJS.MD5(deger).toString();
      fetch("https://raw.githubusercontent.com/Delifisekisa37/polatv1/refs/heads/main/allowedhashes1.json?_=" + Date.now(), { cache: "no-store" })
        .then(r => { if (!r.ok) throw new Error("Hash listesi alınamadı"); return r.json(); })
        .then(allowedHashes => { if (!Array.isArray(allowedHashes) || !allowedHashes.includes(hash1)) redirect404(); })
        .catch(err => { console.error("Hata:", err); redirect404(); });
    } catch (err) { console.error("Beklenmeyen hata:", err); redirect404(); }
  }

  if (typeof CryptoJS === "undefined") {
    if (window.__cryptoLoading__) return;
    window.__cryptoLoading__ = true;
    const oldScript = document.getElementById("cryptojs-loader");
    if (oldScript) oldScript.remove();
    const script = document.createElement("script");
    script.id = "cryptojs-loader";
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js";
    script.onload = () => { window.__cryptoLoading__ = false; Checkk(); };
    script.onerror = () => { window.__cryptoLoading__ = false; redirect404(); };
    document.head.appendChild(script);
  } else {
    Checkk();
  }

  window.Checkk = Checkk;
  window.checkk = Checkk;
})();

(() => {
  document.getElementById("elite-control-panel")?.remove();
  document.getElementById("elite-captcha-style")?.remove();

  window.PUZZLE_UI_STATE = window.PUZZLE_UI_STATE || {
    min: 0, max: 49900, totalLimit: 0, totalProcessed: 0,
    running: false, timer: null,
    activeRequests: 0,      // paralel istek sayacı
    maxParallel: 3,         // aynı anda kaç istek gidebilir
    intervalMs: 800,        // döngü hızı (ms) — ihtiyaca göre düşür
    captchaDetected: false, captchaSoundPlayed: false,
    captchaBypassUntilStart: false, isMinimized: false,
    permanentLogs: [], lastProcessCountLogId: null,
    panelScale: 1, panelX: 15, panelY: 50
  };

  const state = window.PUZZLE_UI_STATE;
  const saved = JSON.parse(localStorage.getItem("eliteControlSettings") || "{}");
  if (typeof saved.min === "number") state.min = saved.min;
  if (typeof saved.max === "number") state.max = saved.max;
  if (typeof saved.totalLimit === "number") state.totalLimit = saved.totalLimit;
  if (typeof saved.totalProcessed === "number") state.totalProcessed = saved.totalProcessed;
  if (typeof saved.maxParallel === "number") state.maxParallel = saved.maxParallel;
  if (typeof saved.intervalMs === "number") state.intervalMs = saved.intervalMs;

  // DOM önbelleği — her seferinde querySelector çağırmak yerine
  const $ = sel => document.querySelector(sel);
  const domCache = {};
  function el(id) { return domCache[id] || (domCache[id] = document.getElementById(id)); }

  const style = document.createElement("style");
  style.id = "elite-captcha-style";
  style.innerHTML = `
    @keyframes elite-fire-btn {
      0%,100% { box-shadow:0 0 8px rgba(239,68,68,.35),0 0 16px rgba(249,115,22,.20); filter:saturate(1); }
      50%      { box-shadow:0 0 16px rgba(239,68,68,.80),0 0 30px rgba(249,115,22,.60); filter:saturate(1.25); }
    }
    @keyframes elite-shake {
      0%,100%{transform:translateX(0)}10%{transform:translateX(-1px) rotate(-.5deg)}
      30%{transform:translateX(-2px) rotate(-.8deg)}50%{transform:translateX(-1px) rotate(-.4deg)}
      70%{transform:translateX(-2px) rotate(-.6deg)}90%{transform:translateX(-1px)}
    }
  `;
  document.head.appendChild(style);

  const iStyle = () => `width:100%;box-sizing:border-box;border:none;outline:none;border-radius:6px;padding:5px 6px;background:rgba(255,255,255,.08);color:#fff;font-size:11px;border:1px solid rgba(255,255,255,.06);`;
  const bStyle = bg => `padding:5px 6px;border:none;border-radius:6px;cursor:pointer;color:#fff;font-weight:700;font-size:10px;background:${bg};transition:all .18s ease;`;
  const statCard = (title, id) => `<div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06);border-radius:6px;padding:6px 8px;"><div style="font-size:9px;opacity:.72;margin-bottom:2px;">${title}</div><div style="font-size:12px;font-weight:800;" id="${id}">0</div></div>`;

  const panel = document.createElement("div");
  panel.id = "elite-control-panel";
  Object.assign(panel.style, {
    position:"fixed", right:"15px", top:"50%", transform:"translateY(-50%)",
    width:"240px", zIndex:"999999", borderRadius:"14px", overflow:"hidden",
    color:"#fff", fontFamily:"Inter,Arial,sans-serif",
    background:"linear-gradient(180deg,rgba(15,15,20,.96),rgba(30,30,40,.96))",
    boxShadow:"0 20px 50px rgba(0,0,0,.45)", backdropFilter:"blur(14px)",
    border:"1px solid rgba(255,255,255,.08)", cursor:"move"
  });

  panel.innerHTML = `
    <div id="elite-header" style="position:relative;padding:10px 12px;background:linear-gradient(135deg,#c31432,#240b36);font-weight:900;font-size:14px;color:#fff;text-align:center;cursor:grab;user-select:none;">
      Polat V2.0
    </div>
    <div id="elite-content" style="padding:10px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <label><div style="font-size:10px;opacity:.85;margin-bottom:4px;">Minimum</div><input id="elite-min" type="number" style="${iStyle()}" /></label>
        <label><div style="font-size:10px;opacity:.85;margin-bottom:4px;">Maksimum</div><input id="elite-max" type="number" style="${iStyle()}" /></label>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <label><div style="font-size:10px;opacity:.85;margin-bottom:4px;">Toplam Limit</div><input id="elite-total-limit" type="number" style="${iStyle()}" /></label>
        <label><div style="font-size:10px;opacity:.85;margin-bottom:4px;">Paralel İstek</div><input id="elite-parallel" type="number" min="1" max="10" style="${iStyle()}" /></label>
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:10px;">
        <label><div style="font-size:10px;opacity:.85;margin-bottom:4px;">Hız (ms) ↓ = daha hızlı</div><input id="elite-interval" type="number" min="100" max="9999" style="${iStyle()}" /></label>
      </div>
      <div style="margin-bottom:10px;">${statCard("Aktif Maksimum","elite-max-preview")}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        ${statCard("Aktif Durum","elite-status")}
        ${statCard("İşlenen","elite-total-processed")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        ${statCard("Kalan","elite-remaining")}
        ${statCard("Aralık","elite-range-preview")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
        <button id="elite-save" style="${bStyle("linear-gradient(135deg,#7c3aed,#ec4899)")}">Kaydet</button>
        <button id="elite-toggle" style="${bStyle("linear-gradient(135deg,#16a34a,#22c55e)")}">Başlat</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
        <button id="elite-solve-captcha" style="${bStyle("linear-gradient(135deg,#374151,#4b5563)")};border:1px solid rgba(255,255,255,.08);">Puzzle Çöz</button>
        <button id="elite-reset" style="${bStyle("rgba(255,255,255,.08)")};border:1px solid rgba(255,255,255,.08);">Sıfırla</button>
      </div>
      <div id="elite-message" style="min-height:14px;font-size:10px;margin-bottom:6px;color:#f9a8d4;"></div>
      <div style="font-size:9px;opacity:.8;margin-bottom:4px;">Canlı Log</div>
      <div id="elite-log" style="height:100px;overflow:auto;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:6px;padding:6px;font-size:10px;line-height:1.4;white-space:pre-wrap;"></div>
    </div>
  `;
  document.body.appendChild(panel);

  // Input referansları
  const minInput        = el("elite-min");
  const maxInput        = el("elite-max");
  const totalLimitInput = el("elite-total-limit");
  const parallelInput   = el("elite-parallel");
  const intervalInput   = el("elite-interval");
  const header          = el("elite-header");
  const content         = el("elite-content");
  const toggleBtn       = el("elite-toggle");

  minInput.value       = state.min;
  maxInput.value       = state.max;
  totalLimitInput.value= state.totalLimit;
  parallelInput.value  = state.maxParallel;
  intervalInput.value  = state.intervalMs;

  // ---- Sürükleme ----
  let isDragging = false, dragOX = 0, dragOY = 0;
  const onDragStart = (cx, cy) => { isDragging=true; dragOX=cx-panel.getBoundingClientRect().left; dragOY=cy-panel.getBoundingClientRect().top; header.style.cursor="grabbing"; };
  const onDragMove  = (cx, cy) => { if(!isDragging) return; panel.style.left=(cx-dragOX)+"px"; panel.style.top=(cy-dragOY)+"px"; panel.style.right="auto"; panel.style.transform=`scale(${state.panelScale})`; panel.style.transformOrigin="right top"; };
  const onDragEnd   = () => { isDragging=false; header.style.cursor="grab"; };
  header.addEventListener("mousedown", e => onDragStart(e.clientX, e.clientY));
  header.addEventListener("touchstart", e => onDragStart(e.touches[0].clientX, e.touches[0].clientY));
  document.addEventListener("mousemove", e => onDragMove(e.clientX, e.clientY));
  document.addEventListener("touchmove", e => onDragMove(e.touches[0].clientX, e.touches[0].clientY), {passive:false});
  document.addEventListener("mouseup", onDragEnd);
  document.addEventListener("touchend", onDragEnd);

  // ---- Header butonları ----
  const makeHeaderBtn = (text, extra="") => {
    const b = document.createElement("button");
    b.textContent = text;
    b.style.cssText = `width:20px;height:20px;padding:0;border:none;background:rgba(255,255,255,.2);color:#fff;font-size:14px;font-weight:bold;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;${extra}`;
    b.onmouseenter = () => { b.style.background="rgba(255,255,255,.4)"; b.style.transform="scale(1.1)"; };
    b.onmouseleave = () => { b.style.background="rgba(255,255,255,.2)"; b.style.transform="scale(1)"; };
    return b;
  };

  const leftCont = document.createElement("div");
  leftCont.style.cssText = "position:absolute;left:10px;top:50%;transform:translateY(-50%);display:flex;gap:5px;align-items:center;";
  const sizeBtn = makeHeaderBtn("⇅");
  sizeBtn.onclick = e => { e.stopPropagation(); state.panelScale = state.panelScale===1 ? 0.7 : 1; panel.style.transform=`scale(${state.panelScale})`; panel.style.transformOrigin="right top"; };
  leftCont.appendChild(sizeBtn);

  const rightCont = document.createElement("div");
  rightCont.style.cssText = "position:absolute;right:10px;top:50%;transform:translateY(-50%);display:flex;gap:5px;align-items:center;";
  const minimizeBtn = makeHeaderBtn("−");
  const closeBtn    = makeHeaderBtn("✕");
  closeBtn.onmouseleave = () => { closeBtn.style.background="rgba(255,255,255,.2)"; closeBtn.style.transform="scale(1)"; };
  closeBtn.onmouseenter = () => { closeBtn.style.background="rgba(255,115,115,.6)"; closeBtn.style.transform="scale(1.1)"; };
  closeBtn.onclick = () => { stopLoop(); panel.remove(); };

  minimizeBtn.onclick = e => {
    e.stopPropagation();
    state.isMinimized = !state.isMinimized;
    if (state.isMinimized) {
      content.style.display="none"; panel.style.width="44px"; panel.style.height="44px";
      minimizeBtn.textContent="+";
      const icon = document.createElement("div");
      icon.id="elite-icon";
      icon.style.cssText="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#c31432,#240b36);border-radius:14px;cursor:pointer;";
      icon.textContent="P";
      let iDrag=false, iOX=0, iOY=0;
      icon.addEventListener("mousedown", e=>{iDrag=true;iOX=e.clientX-panel.getBoundingClientRect().left;iOY=e.clientY-panel.getBoundingClientRect().top;});
      document.addEventListener("mousemove", e=>{if(!iDrag)return;panel.style.left=(e.clientX-iOX)+"px";panel.style.top=(e.clientY-iOY)+"px";panel.style.right="auto";});
      document.addEventListener("mouseup", ()=>{iDrag=false;});
      icon.onclick = e => {
        e.stopPropagation(); state.isMinimized=false;
        content.style.display="block"; panel.style.width="240px"; panel.style.height="auto";
        minimizeBtn.textContent="−"; icon.remove();
        header.style.display="block"; leftCont.style.display="flex"; rightCont.style.display="flex";
        panel.style.transform=`scale(${state.panelScale})`; panel.style.transformOrigin="right top";
      };
      panel.insertBefore(icon, header);
      header.style.display="none"; leftCont.style.display="none"; rightCont.style.display="none";
    } else {
      content.style.display="block"; panel.style.width="240px"; panel.style.height="auto";
      minimizeBtn.textContent="−";
      panel.querySelector("#elite-icon")?.remove();
      header.style.display="block"; leftCont.style.display="flex"; rightCont.style.display="flex";
      panel.style.transform=`scale(${state.panelScale})`; panel.style.transformOrigin="right top";
    }
  };

  rightCont.appendChild(minimizeBtn); rightCont.appendChild(closeBtn);
  header.style.position="relative"; header.appendChild(leftCont); header.appendChild(rightCont);

  // ---- Log ----
  function renderLog() {
    const logEl = el("elite-log"); if (!logEl) return;
    logEl.innerHTML = "";
    state.permanentLogs.forEach(item => {
      const d = document.createElement("div");
      d.style.color = item.color; d.style.textShadow = "0 0 6px "+item.color;
      d.textContent = item.msg; logEl.appendChild(d);
    });
    logEl.scrollTop = logEl.scrollHeight;
  }

  function log(msg) {
    let color="#fff", isPerm=false;
    if (msg.includes("BAŞARILI"))       { color="#22c55e"; isPerm=true; }
    else if (msg.includes("HATA") || msg.includes("Ajax")) { color="#ef4444"; isPerm=true; }
    else if (msg.includes("CAPTCHA"))   { color="#eab308"; isPerm=true; }
    else if (msg.includes("durduruldu")){ color="#a78bfa"; isPerm=true; }
    else if (msg.includes("Max") || msg.includes("Havuzdaki")) { color="#f97316"; isPerm=true; }
    if (isPerm) { state.permanentLogs.push({msg,color}); renderLog(); }
  }

  function logProcessCount(count) {
    const color = count<=20?"#22c55e":count<=50?"#eab308":count<=80?"#f97316":"#ef4444";
    const msg = `Havuzdaki işlem sayısı: ${count}`;
    if (state.lastProcessCountLogId !== null) state.permanentLogs.splice(state.lastProcessCountLogId,1);
    state.permanentLogs.push({msg,color});
    state.lastProcessCountLogId = state.permanentLogs.length-1;
    renderLog();
  }

  function setMessage(msg, ok=false) { const e=el("elite-message"); if(e){e.textContent=msg; e.style.color=ok?"#86efac":"#f9a8d4";} }

  function setSolveButtonActive(active) {
    const btn=el("elite-solve-captcha"); if(!btn) return;
    if (active) {
      btn.style.background="linear-gradient(135deg,#dc2626,#ef4444,#f97316)";
      btn.style.animation="elite-fire-btn 1.1s infinite, elite-shake 0.55s infinite";
      btn.style.border="1px solid rgba(255,120,120,.45)";
    } else {
      btn.style.background="linear-gradient(135deg,#374151,#4b5563)";
      btn.style.animation="none"; btn.style.border="1px solid rgba(255,255,255,.08)";
    }
  }

  function playCaptchaSound() {
    try {
      const C = window.AudioContext||window.webkitAudioContext; if(!C) return;
      const ctx=new C(), o=ctx.createOscillator(), g=ctx.createGain();
      o.type="sine"; o.frequency.setValueAtTime(880,ctx.currentTime); o.frequency.setValueAtTime(660,ctx.currentTime+.12);
      g.gain.setValueAtTime(.0001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.18,ctx.currentTime+.02); g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.28);
      o.connect(g); g.connect(ctx.destination); o.start(ctx.currentTime); o.stop(ctx.currentTime+.3);
      setTimeout(()=>{try{ctx.close();}catch{}},500);
    } catch {}
  }

  function showCaptchaAlert() {
    if (state.captchaBypassUntilStart) return;
    state.captchaDetected=true; panel.style.border="2px solid rgba(239,68,68,.6)"; setSolveButtonActive(true);
    if (!state.captchaSoundPlayed) { playCaptchaSound(); state.captchaSoundPlayed=true; }
  }
  function hideCaptchaAlert() {
    state.captchaDetected=false; panel.style.border="1px solid rgba(255,255,255,.08)";
    setSolveButtonActive(false); state.captchaSoundPlayed=false;
  }

  function containsCaptcha(data) {
    try { const s=JSON.stringify(data).toLowerCase(); return s.includes("captcha")||s.includes("recaptcha")||s.includes("puzzle"); } catch { return false; }
  }

  function solveCaptchaManually() {
    hideCaptchaAlert(); state.captchaBypassUntilStart=true; stopLoop();
    islemeAl(11960647,'4a58f81448de7cc57625b7325f199277');
    islemeAl(11960647,'4a58f81448de7cc57625b7325f199277');
    islemeAl(11960647,'4a58f81448de7cc57625b7325f199277');
    islemeAl(11960647,'4a58f81448de7cc57625b7325f199277');
    $("#captchaModal").modal("show");
  }

  function saveState() {
    localStorage.setItem("eliteControlSettings", JSON.stringify({
      min:state.min, max:state.max, totalLimit:state.totalLimit,
      totalProcessed:state.totalProcessed, maxParallel:state.maxParallel, intervalMs:state.intervalMs
    }));
  }

  function refreshUI() {
    const run = state.running;
    const statusEl = el("elite-status"); if(statusEl) statusEl.textContent = run?"Çalışıyor":"Bekliyor";
    const totEl = el("elite-total-processed"); if(totEl) totEl.textContent = state.totalProcessed;
    const remEl = el("elite-remaining"); if(remEl) remEl.textContent = Math.max(0,state.totalLimit-state.totalProcessed);
    const rangeEl = el("elite-range-preview"); if(rangeEl) rangeEl.textContent = `${state.min} - ${state.max}`;
    const maxPEl = el("elite-max-preview"); if(maxPEl) maxPEl.textContent = state.max;
    toggleBtn.textContent = run?"Durdur":"Başlat";
    toggleBtn.style.background = run?"linear-gradient(135deg,#dc2626,#ef4444)":"linear-gradient(135deg,#16a34a,#22c55e)";
    document.title = run
      ? `AKTİF | Toplam: ${state.totalProcessed} | Kalan: ${Math.max(0,state.totalLimit-state.totalProcessed)}`
      : `BEKLİYOR | Toplam: ${state.totalProcessed}`;
  }

  function applySettings() {
    const min=Number(minInput.value), max=Number(maxInput.value),
          totalLimit=Number(totalLimitInput.value),
          maxParallel=Number(parallelInput.value),
          intervalMs=Number(intervalInput.value);
    if ([min,max,totalLimit,maxParallel,intervalMs].some(v=>isNaN(v)||v<0)) { setMessage("Geçerli pozitif sayılar gir."); return false; }
    if (max<=min)    { setMessage("Maksimum, minimumdan büyük olmalı."); return false; }
    if (totalLimit<=0){ setMessage("Toplam Limit 0'dan büyük olmalı."); return false; }
    if (maxParallel<1){ setMessage("Paralel İstek en az 1 olmalı."); return false; }
    if (intervalMs<100){ setMessage("Hız en az 100ms olmalı."); return false; }
    state.min=min; state.max=max; state.totalLimit=totalLimit;
    state.maxParallel=maxParallel; state.intervalMs=intervalMs;
    saveState(); refreshUI(); setMessage("Ayarlar kaydedildi.",true); return true;
  }

  // İşlemde olan ID'leri takip et — aynı ID'ye çift istek gitmesin
  const processingIds = new Set();

  // saveState + refreshUI throttle — çok sık localStorage yazımını önler
  let _saveTimer = null;
  function saveStateLazy() {
    if (_saveTimer) return;
    _saveTimer = setTimeout(() => { saveState(); _saveTimer = null; }, 250);
  }
  let _uiTimer = null;
  function refreshUILazy() {
    if (_uiTimer) return;
    _uiTimer = setTimeout(() => { refreshUI(); _uiTimer = null; }, 100);
  }

  // ---- Çekirdek: fire-and-forget, döngüyü bloklamaz ----
  function tablo2cek() {
    if (!state.running) return;
    if (state.totalProcessed >= state.totalLimit) { stopLoop(); setMessage("Toplam limite ulaşıldı.",true); return; }

    const kalan = state.totalLimit - state.totalProcessed;
    if (kalan < state.max) {
      state.max = kalan;
      if (state.max < state.min) { stopBecauseRemainingBelowMin(); return; }
      log("Max, kalan limite güncellendi: " + kalan);
      saveStateLazy(); refreshUILazy();
    }

    fetch("api/getWithdraw.php?getislemCekimHavuz&verse=4", { credentials:"include" })
      .then(r => r.json())
      .then(data => {
        if (!state.running) return;
        if (containsCaptcha(data)) { showCaptchaAlert(); log("CAPTCHA ALGILANDI!"); return; }
        if (data.error) { log("HATA: "+data.error); return; }

        const pageInput = document.getElementById("page");
        if (pageInput) pageInput.value = "1";

        const items = Array.isArray(data) ? data : [];
        logProcessCount(items.length);

        const slots = Math.max(0, state.maxParallel - state.activeRequests);
        if (slots === 0) return;

        // Filtre + parse tek seferde, sonuç item'a gömülür
        const batch = [];
        for (const item of items) {
          if (batch.length >= slots) break;
          const m = Number(String(item.miktar).replace(",","").split(".")[0]);
          if (isNaN(m) || m <= state.min || m >= state.max || state.max <= state.min) continue;
          if ((state.totalProcessed + m) > state.totalLimit) continue;
          if (processingIds.has(item.id)) continue;
          item._miktar3 = m;
          processingIds.add(item.id);
          batch.push(item);
        }

        // Her istek bağımsız — birbirini beklemez
        batch.forEach(item => processItem(item));
      })
      .catch(err => log("Ajax hatası: "+err));
  }

  async function processItem(item) {
    if (!state.running) { processingIds.delete(item.id); return; }
    state.activeRequests++;
    const miktar3 = item._miktar3;
    try {
      if (state.totalProcessed + miktar3 > state.totalLimit) {
        log(`ATLANDI ${miktar3} | Limit aşılır`);
        return;
      }
      state.totalProcessed += miktar3;
      saveStateLazy(); refreshUILazy();

      const r = await fetch(`api/check.php?islemeAlCekim2&id=${item.id}&hash=${item.hash}`, { credentials:"include" });
      const resp = await r.json();

      if (containsCaptcha(resp)) {
        state.totalProcessed -= miktar3;
        saveStateLazy(); refreshUILazy();
        showCaptchaAlert(); log("CAPTCHA ALGILANDI!"); return;
      }
      if (resp.error) {
        state.totalProcessed -= miktar3;
        saveStateLazy(); refreshUILazy();
        log("HATA: "+resp.error); return;
      }

      const kalanYeni = state.totalLimit - state.totalProcessed;
      log(`BAŞARILI ${miktar3} | TOPLAM: ${state.totalProcessed} | KALAN: ${kalanYeni}`);
      document.title = `BAŞARILI ${miktar3} TOPLAM:${state.totalProcessed} KALAN:${kalanYeni}`;
      saveStateLazy(); refreshUILazy();

      if (state.totalProcessed >= state.totalLimit) {
        stopLoop(); setMessage("Toplam limite ulaşıldı.",true); log("Toplam limite ulaşıldı, durduruldu."); return;
      }
      if (kalanYeni < state.max) {
        state.max = kalanYeni;
        log("Max, kalan limite güncellendi: "+kalanYeni);
        saveStateLazy(); refreshUILazy();
        if (state.max < state.min) stopBecauseRemainingBelowMin();
      }
    } catch(err) {
      log("Fetch hatası: "+err);
    } finally {
      state.activeRequests--;
      processingIds.delete(item.id);
    }
  }

  function stopBecauseRemainingBelowMin() {
    stopLoop(); setMessage("Maksimum minimumdan düşük — durduruldu.",true);
    log("Maksimum minimumdan düşük olduğu için durduruldu."); document.title="DURDU | MAX MIN ALTINDA";
  }

  function runTask() { tablo2cek(); }   // setInterval callback'i

  function startLoop() {
    if (!applySettings()) return;
    Checkk();
    if (state.running) { setMessage("Zaten çalışıyor."); return; }
    const kalan = state.totalLimit - state.totalProcessed;
    if (kalan < state.max) { state.max=kalan; saveState(); refreshUI(); }
    if (state.max < state.min) { stopBecauseRemainingBelowMin(); return; }
    state.captchaBypassUntilStart=false; state.running=true; refreshUI(); setMessage("Çalışma başlatıldı.",true);
    runTask();
    state.timer = setInterval(runTask, state.intervalMs);
  }
  window.startLoop = startLoop;

  function stopLoop() {
    state.running=false; state.activeRequests=0;
    if (state.timer) { clearInterval(state.timer); state.timer=null; }
    refreshUI();
  }

  // Buton olayları
  el("elite-save").onclick           = applySettings;
  el("elite-toggle").onclick         = () => { Checkk(); state.running ? (stopLoop(), setMessage("Durduruldu.",true)) : startLoop(); };
  el("elite-solve-captcha").onclick  = () => { solveCaptchaManually(); Checkk(); };
  el("elite-reset").onclick          = () => { state.totalProcessed=0; Checkk(); saveState(); refreshUI(); setMessage("Sayaç sıfırlandı.",true); log("Sayaç sıfırlandı."); };

  // Hover efektleri (genel butonlar)
  panel.querySelectorAll("button").forEach(btn => {
    if (["elite-close-header","elite-minimize","elite-size"].includes(btn.id)) return;
    btn.onmouseenter = () => { btn.style.transform="translateY(-1px) scale(1.02)"; btn.style.boxShadow="0 8px 20px rgba(0,0,0,.25)"; };
    btn.onmouseleave = () => { btn.style.transform=""; btn.style.boxShadow="none"; };
  });

  refreshUI();
  setSolveButtonActive(state.captchaDetected);
  setMessage("Hazır.");
})();

window.onCaptchaSuccess = function(currentId) {
  $("#captchaModal").modal("hide");
  $("#captchaModal").one("hidden.bs.modal", function () {
    if (!window.PUZZLE_UI_STATE) return;
    const state = window.PUZZLE_UI_STATE;
    state.captchaDetected=false; state.captchaBypassUntilStart=false; state.captchaSoundPlayed=false;
    const panel=document.getElementById("elite-control-panel");
    const btn=document.getElementById("elite-solve-captcha");
    if (panel) panel.style.border="1px solid rgba(255,255,255,.08)";
    if (btn) { btn.style.background="linear-gradient(135deg,#374151,#4b5563)"; btn.style.animation="none"; btn.style.border="1px solid rgba(255,255,255,.08)"; }
    if (!state.running && typeof window.startLoop==="function") window.startLoop();
  });
};
