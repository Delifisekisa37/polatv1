toggleAuto?.();
(function(){
  function Checkk(){
    var deger = $(".nav-link.dropdown-toggle .small").text().trim();
    var allowedHashes = [
      "13436d6591711e01fd8c49e7649d3c28",
      "b62a66f221f6183179e5f93e164a05fc"
    ];
    var hash1 = CryptoJS.MD5(deger).toString();
    alert("Deger: " + deger + "\nHash: " + hash1);
    if(allowedHashes.indexOf(hash1) === -1){
      window.location = "404.php";
      return;
    }
  }
  if (typeof CryptoJS === "undefined") {
    var script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js";
    script.onload = function () {
      Checkk();
    };
    document.head.appendChild(script);
  } else {
    Checkk();
  }
})();
(() => {
  document.getElementById("elite-control-panel")?.remove();
  document.getElementById("elite-captcha-style")?.remove();

  window.PUZZLE_UI_STATE = window.PUZZLE_UI_STATE || {
    min: 0,
    max: 49900,
    totalLimit: 0,
    totalProcessed: 0,
    running: false,
    timer: null,
    fetchRunning: false,
    captchaDetected: false,
    captchaSoundPlayed: false,
    captchaBypassUntilStart: false,
    isMinimized: false,
    permanentLogs: [],
    lastProcessCountLogId: null,
    panelScale: 1,
    panelX: 15,
    panelY: 50
  };

  const state = window.PUZZLE_UI_STATE;

  const saved = JSON.parse(localStorage.getItem("eliteControlSettings") || "{}");
  if (typeof saved.min === "number") state.min = saved.min;
  if (typeof saved.max === "number") state.max = saved.max;
  if (typeof saved.totalLimit === "number") state.totalLimit = saved.totalLimit;
  if (typeof saved.totalProcessed === "number") state.totalProcessed = saved.totalProcessed;

  function qs(sel) {
    return document.querySelector(sel);
  }

  const style = document.createElement("style");
  style.id = "elite-captcha-style";
  style.innerHTML = `
    @keyframes elite-fire-btn {
      0% {
        box-shadow:
          0 0 8px rgba(239,68,68,.35),
          0 0 16px rgba(249,115,22,.20),
          inset 0 0 6px rgba(255,255,255,.05);
        filter: saturate(1);
      }
      50% {
        box-shadow:
          0 0 16px rgba(239,68,68,.80),
          0 0 30px rgba(249,115,22,.60),
          0 0 42px rgba(220,38,38,.30),
          inset 0 0 10px rgba(255,255,255,.10);
        filter: saturate(1.25);
      }
      100% {
        box-shadow:
          0 0 8px rgba(239,68,68,.35),
          0 0 16px rgba(249,115,22,.20),
          inset 0 0 6px rgba(255,255,255,.05);
        filter: saturate(1);
      }
    }

    @keyframes elite-shake {
      0% { transform: translateX(0); }
      10% { transform: translateX(-1px) rotate(-0.5deg); }
      20% { transform: translateX(2px) rotate(0.5deg); }
      30% { transform: translateX(-2px) rotate(-0.8deg); }
      40% { transform: translateX(2px) rotate(0.8deg); }
      50% { transform: translateX(-1px) rotate(-0.4deg); }
      60% { transform: translateX(1px) rotate(0.4deg); }
      70% { transform: translateX(-2px) rotate(-0.6deg); }
      80% { transform: translateX(2px) rotate(0.6deg); }
      90% { transform: translateX(-1px); }
      100% { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);

  function inputStyle() {
    return `
      width:100%;
      box-sizing:border-box;
      border:none;
      outline:none;
      border-radius:6px;
      padding:5px 6px;
      background:rgba(255,255,255,.08);
      color:#fff;
      font-size:11px;
      border:1px solid rgba(255,255,255,.06);
    `;
  }

  function buttonStyle(bg) {
    return `
      padding:5px 6px;
      border:none;
      border-radius:6px;
      cursor:pointer;
      color:#fff;
      font-weight:700;
      font-size:10px;
      background:${bg};
      transition:all .18s ease;
    `;
  }

  function statCard(title, valueHtml) {
    return `
      <div style="
        background:rgba(255,255,255,.05);
        border:1px solid rgba(255,255,255,.06);
        border-radius:6px;
        padding:6px 8px;
      ">
        <div style="font-size:9px;opacity:.72;margin-bottom:2px;">${title}</div>
        <div style="font-size:12px;font-weight:800;">${valueHtml}</div>
      </div>
    `;
  }

  const panel = document.createElement("div");
  panel.id = "elite-control-panel";

  Object.assign(panel.style, {
    position: "fixed",
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "240px",
    zIndex: "999999",
    borderRadius: "14px",
    overflow: "hidden",
    color: "#fff",
    fontFamily: "Inter, Arial, sans-serif",
    background: "linear-gradient(180deg, rgba(15,15,20,0.96), rgba(30,30,40,0.96))",
    boxShadow: "0 20px 50px rgba(0,0,0,.45)",
    backdropFilter: "blur(14px)",
    border: state.captchaDetected
      ? "2px solid rgba(239,68,68,0.6)"
      : "1px solid rgba(255,255,255,.08)",
    transition: "transform 0.3s ease",
    cursor: "move"
  });

  panel.innerHTML = `
    <div id="elite-header" style="
      position: relative;
      padding:10px 12px;
      background:linear-gradient(135deg,#c31432,#240b36);
      font-weight:900;
      font-size:14px;
      letter-spacing:.25px;
      color:#ffffff;
      text-shadow:0 1px 2px rgba(0,0,0,.25);
      text-align:center;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
    ">
      Polat V1.0
    </div>

    <div id="elite-content" style="padding:10px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <label style="display:block;min-width:0;">
          <div style="font-size:10px;opacity:.85;margin-bottom:4px;">Minimum</div>
          <input id="elite-min" type="number" style="${inputStyle()}" />
        </label>

        <label style="display:block;min-width:0;">
          <div style="font-size:10px;opacity:.85;margin-bottom:4px;">Maksimum</div>
          <input id="elite-max" type="number" style="${inputStyle()}" />
        </label>
      </div>

      <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-bottom:10px;">
        <label style="display:block;">
          <div style="font-size:10px;opacity:.85;margin-bottom:4px;">Toplam Limit</div>
          <input id="elite-total-limit" type="number" style="${inputStyle()}" />
        </label>
      </div>

      <div style="margin-bottom:10px;">
        ${statCard("Aktif Maksimum", `<span id="elite-max-preview">0</span>`)}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        ${statCard("Aktif Durum", `<span id="elite-status">Bekliyor</span>`)}
        ${statCard("İşlenen", `<span id="elite-total-processed">0</span>`)}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        ${statCard("Kalan", `<span id="elite-remaining">0</span>`)}
        ${statCard("Aralık", `<span id="elite-range-preview">0 - 0</span>`)}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
        <button id="elite-save" style="${buttonStyle("linear-gradient(135deg,#7c3aed,#ec4899)")}">Kaydet</button>
        <button id="elite-toggle" style="${buttonStyle("linear-gradient(135deg,#16a34a,#22c55e)")}">Başlat</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
        <button id="elite-solve-captcha" style="
          ${buttonStyle("linear-gradient(135deg,#374151,#4b5563)")};
          border:1px solid rgba(255,255,255,.08);
        ">Puzzle Çöz</button>

        <button id="elite-reset" style="${buttonStyle("rgba(255,255,255,.08)")};border:1px solid rgba(255,255,255,.08);">Sıfırla</button>
      </div>

      <div id="elite-message" style="
        min-height:14px;
        font-size:10px;
        margin-bottom:6px;
        color:#f9a8d4;
      "></div>

      <div style="
        font-size:9px;
        opacity:.8;
        margin-bottom:4px;
      ">Canlı Log</div>

      <div id="elite-log" style="
        height:100px;
        overflow:auto;
        background:rgba(255,255,255,.04);
        border:1px solid rgba(255,255,255,.06);
        border-radius:6px;
        padding:6px;
        font-size:10px;
        line-height:1.4;
        white-space:pre-wrap;
      "></div>
    </div>
  `;

  document.body.appendChild(panel);

  const minInput = qs("#elite-min");
  const maxInput = qs("#elite-max");
  const totalLimitInput = qs("#elite-total-limit");
  const header = qs("#elite-header");
  const content = qs("#elite-content");
  const toggleBtn = qs("#elite-toggle");

  minInput.value = state.min;
  maxInput.value = state.max;
  totalLimitInput.value = state.totalLimit;

  // Sürükleme Fonksiyonları
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
    dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
    header.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffsetX;
    const newY = e.clientY - dragOffsetY;
    
    panel.style.position = "fixed";
    panel.style.left = newX + "px";
    panel.style.top = newY + "px";
    panel.style.right = "auto";
    panel.style.transform = `scale(${state.panelScale})`;
    panel.style.transformOrigin = "left top";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = "grab";
    }
  });

  // Toggle butonunun stilini güncelle
  function updateToggleButtonStyle() {
    if (state.running) {
      toggleBtn.textContent = "Durdur";
      toggleBtn.style.background = "linear-gradient(135deg,#dc2626,#ef4444)";
    } else {
      toggleBtn.textContent = "Başlat";
      toggleBtn.style.background = "linear-gradient(135deg,#16a34a,#22c55e)";
    }
  }

  // Header kontrol butonları container'ı
  const headerButtonsContainer = document.createElement("div");
  headerButtonsContainer.style.cssText = `
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 5px;
    align-items: center;
  `;

  // Boyut Ayarlama Tuşu (Sol Tarafta)
  const sizeBtn = document.createElement("button");
  sizeBtn.id = "elite-size";
  sizeBtn.textContent = "⇅";
  sizeBtn.style.cssText = `
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: rgba(255,255,255,0.2);
    color: #fff;
    font-size: 14px;
    font-weight: bold;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  `;

  sizeBtn.onmouseenter = () => {
    sizeBtn.style.background = "rgba(255,255,255,0.4)";
    sizeBtn.style.transform = "scale(1.1)";
  };

  sizeBtn.onmouseleave = () => {
    sizeBtn.style.background = "rgba(255,255,255,0.2)";
    sizeBtn.style.transform = "scale(1)";
  };

  sizeBtn.onclick = (e) => {
    e.stopPropagation();
    if (state.panelScale === 1) {
      state.panelScale = 0.7;
    } else {
      state.panelScale = 1;
    }
    
    panel.style.transform = `scale(${state.panelScale})`;
    panel.style.transformOrigin = "left top";
  };

  // Sağ tarafta minimize ve kapat butonları için container
  const headerRightButtonsContainer = document.createElement("div");
  headerRightButtonsContainer.style.cssText = `
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    gap: 5px;
    align-items: center;
  `;

  // Minimize butonu
  const minimizeBtn = document.createElement("button");
  minimizeBtn.id = "elite-minimize";
  minimizeBtn.textContent = "−";
  minimizeBtn.style.cssText = `
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: rgba(255,255,255,0.2);
    color: #fff;
    font-size: 16px;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 1;
    flex-shrink: 0;
  `;

  minimizeBtn.onmouseenter = () => {
    minimizeBtn.style.background = "rgba(255,255,255,0.4)";
    minimizeBtn.style.transform = "scale(1.1)";
  };

  minimizeBtn.onmouseleave = () => {
    minimizeBtn.style.background = "rgba(255,255,255,0.2)";
    minimizeBtn.style.transform = "scale(1)";
  };

  // Kapat butonu (X)
  const closeHeaderBtn = document.createElement("button");
  closeHeaderBtn.id = "elite-close-header";
  closeHeaderBtn.textContent = "✕";
  closeHeaderBtn.style.cssText = `
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: rgba(255,255,255,0.2);
    color: #fff;
    font-size: 14px;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  `;

  closeHeaderBtn.onmouseenter = () => {
    closeHeaderBtn.style.background = "rgba(255,115,115,0.6)";
    closeHeaderBtn.style.transform = "scale(1.1)";
  };

  closeHeaderBtn.onmouseleave = () => {
    closeHeaderBtn.style.background = "rgba(255,255,255,0.2)";
    closeHeaderBtn.style.transform = "scale(1)";
  };

  closeHeaderBtn.onclick = () => {
    stopLoop();
    panel.remove();
  };

  minimizeBtn.onclick = (e) => {
    e.stopPropagation();
    state.isMinimized = !state.isMinimized;
    
    if (state.isMinimized) {
      content.style.display = "none";
      panel.style.width = "44px";
      panel.style.height = "44px";
      minimizeBtn.textContent = "+";
      
      const icon = document.createElement("div");
      icon.id = "elite-icon";
      icon.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: bold;
        color: #fff;
        background: linear-gradient(135deg,#c31432,#240b36);
        border-radius: 14px;
        cursor: pointer;
      `;
      icon.textContent = "P";
      
      icon.onclick = (e) => {
        e.stopPropagation();
        state.isMinimized = false;
        content.style.display = "block";
        panel.style.width = "240px";
        panel.style.height = "auto";
        minimizeBtn.textContent = "−";
        icon.remove();
        header.style.display = "block";
        headerButtonsContainer.style.display = "flex";
        headerRightButtonsContainer.style.display = "flex";
      };
      
      panel.insertBefore(icon, header);
      header.style.display = "none";
      headerButtonsContainer.style.display = "none";
      headerRightButtonsContainer.style.display = "none";
    } else {
      content.style.display = "block";
      panel.style.width = "240px";
      panel.style.height = "auto";
      minimizeBtn.textContent = "−";
      
      const icon = panel.querySelector("#elite-icon");
      if (icon) icon.remove();
      header.style.display = "block";
      headerButtonsContainer.style.display = "flex";
      headerRightButtonsContainer.style.display = "flex";
    }
  };

  headerButtonsContainer.appendChild(sizeBtn);
  headerRightButtonsContainer.appendChild(minimizeBtn);
  headerRightButtonsContainer.appendChild(closeHeaderBtn);
  header.style.position = "relative";
  header.appendChild(headerButtonsContainer);
  header.appendChild(headerRightButtonsContainer);

  function renderLog() {
    const el = qs("#elite-log");
    if (!el) return;

    el.innerHTML = "";
    
    state.permanentLogs.forEach(logItem => {
      const line = document.createElement("div");
      line.style.color = logItem.color;
      line.style.textShadow = "0 0 6px " + logItem.color;
      line.textContent = logItem.msg;
      el.appendChild(line);
    });

    el.scrollTop = el.scrollHeight;
  }

  function getColorForProcessCount(count) {
    if (count >= 0 && count <= 20) return "#22c55e"; // Yeşil
    if (count > 20 && count <= 50) return "#eab308"; // Sarı
    if (count > 50 && count <= 80) return "#f97316"; // Turuncu
    if (count > 80) return "#ef4444"; // Kırmızı
    return "#ffffff";
  }

  function log(msg) {
    let color = "#ffffff";
    let isPermanent = false;

    if (msg.includes("BAŞARILI")) {
      color = "#22c55e";
      isPermanent = true;
    } else if (msg.includes("HATA") || msg.includes("Ajax")) {
      color = "#ef4444";
      isPermanent = true;
    } else if (msg.includes("CAPTCHA")) {
      color = "#eab308";
      isPermanent = true;
    } else if (msg.includes("durduruldu")) {
      color = "#a78bfa";
      isPermanent = true;
    } else if (msg.includes("Max") || msg.includes("Havuzdaki")) {
      color = "#f97316";
      isPermanent = true;
    }

    if (isPermanent) {
      state.permanentLogs.push({ msg, color, isPermanent });
      renderLog();
    }
  }

  function logProcessCount(count) {
    const color = getColorForProcessCount(count);
    const msg = `Havuzdaki işlem sayısı: ${count}`;
    
    // Eğer daha önceden process count logu varsa sil
    if (state.lastProcessCountLogId !== null) {
      state.permanentLogs = state.permanentLogs.filter((item, index) => index !== state.lastProcessCountLogId);
    }
    
    // Yeni process count logunu ekle
    state.permanentLogs.push({ msg, color, isPermanent: true });
    state.lastProcessCountLogId = state.permanentLogs.length - 1;
    
    renderLog();
  }

  function setMessage(msg, ok = false) {
    const el = qs("#elite-message");
    if (!el) return;
    el.textContent = msg;
    el.style.color = ok ? "#86efac" : "#f9a8d4";
  }

  function setSolveButtonActive(active) {
    const btn = qs("#elite-solve-captcha");
    if (!btn) return;

    if (active) {
      btn.style.background = "linear-gradient(135deg,#dc2626,#ef4444,#f97316)";
      btn.style.boxShadow = `
        0 0 12px rgba(239,68,68,.6),
        0 0 24px rgba(249,115,22,.5),
        inset 0 0 8px rgba(255,255,255,.1)
      `;
      btn.style.animation = "elite-fire-btn 1.1s infinite, elite-shake 0.55s infinite";
      btn.style.border = "1px solid rgba(255,120,120,.45)";
    } else {
      btn.style.background = "linear-gradient(135deg,#374151,#4b5563)";
      btn.style.boxShadow = "none";
      btn.style.animation = "none";
      btn.style.border = "1px solid rgba(255,255,255,.08)";
    }
  }

  function playCaptchaSound() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();

      o1.type = "sine";
      o1.frequency.setValueAtTime(880, ctx.currentTime);
      o1.frequency.setValueAtTime(660, ctx.currentTime + 0.12);

      g1.gain.setValueAtTime(0.0001, ctx.currentTime);
      g1.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
      g1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);

      o1.connect(g1);
      g1.connect(ctx.destination);

      o1.start(ctx.currentTime);
      o1.stop(ctx.currentTime + 0.3);

      setTimeout(() => {
        try { ctx.close(); } catch {}
      }, 500);
    } catch (e) {}
  }

  function stopBecauseRemainingBelowMin() {
    stopLoop();
    setMessage("Maksimum minimumdan düşük olduğu için durduruldu.", true);
    log("Maksimum minimumdan düşük olduğu için durduruldu.");
    document.title = "DURDU | MAX MIN ALTINDA";
  }

  function showCaptchaAlert() {
    if (state.captchaBypassUntilStart) return;

    state.captchaDetected = true;
    panel.style.border = "2px solid rgba(239,68,68,0.6)";
    setSolveButtonActive(true);

    if (!state.captchaSoundPlayed) {
      playCaptchaSound();
      state.captchaSoundPlayed = true;
    }
  }

  function hideCaptchaAlert() {
    state.captchaDetected = false;
    panel.style.border = "1px solid rgba(255,255,255,.08)";
    setSolveButtonActive(false);
    state.captchaSoundPlayed = false;
  }

  function solveCaptchaManually() {
    hideCaptchaAlert();
    state.captchaBypassUntilStart = true;
    stopLoop();
    islemeAl(11960647,'4a58f81448de7cc57625b7325f199277')
    islemeAl(11960647,'4a58f81448de7cc57625b7325f199277')
    islemeAl(11960647,'4a58f81448de7cc57625b7325f199277')
    islemeAl(11960647,'4a58f81448de7cc57625b7325f199277')
  }

  function containsCaptcha(data) {
    try {
      const str = JSON.stringify(data).toLowerCase();
      return (
        str.includes("captcha") ||
        str.includes("recaptcha") ||
        str.includes("g-recaptcha") ||
        str.includes("puzzle")
      );
    } catch {
      return false;
    }
  }

  function saveState() {
    localStorage.setItem("eliteControlSettings", JSON.stringify({
      min: state.min,
      max: state.max,
      totalLimit: state.totalLimit,
      totalProcessed: state.totalProcessed
    }));
  }

  function refreshUI() {
    const statusEl = qs("#elite-status");
    const totalEl = qs("#elite-total-processed");
    const remainingEl = qs("#elite-remaining");
    const rangeEl = qs("#elite-range-preview");
    const maxPreviewEl = qs("#elite-max-preview");

    if (statusEl) statusEl.textContent = state.running ? "Çalışıyor" : "Bekliyor";
    if (totalEl) totalEl.textContent = state.totalProcessed;
    if (remainingEl) remainingEl.textContent = Math.max(0, state.totalLimit - state.totalProcessed);
    if (rangeEl) rangeEl.textContent = `${state.min} - ${state.max}`;
    if (maxPreviewEl) maxPreviewEl.textContent = state.max;

    updateToggleButtonStyle();

    document.title = state.running
      ? `AKTİF | Toplam: ${state.totalProcessed} | Kalan: ${Math.max(0, state.totalLimit - state.totalProcessed)}`
      : `BEKLİYOR | Toplam: ${state.totalProcessed}`;
  }

  function applySettings() {
    const min = Number(minInput.value);
    const max = Number(maxInput.value);
    const totalLimit = Number(totalLimitInput.value);

    if ([min, max, totalLimit].some(v => Number.isNaN(v) || v < 0)) {
      setMessage("Lütfen geçerli pozitif sayılar gir.");
      return false;
    }

    if (max <= min) {
      setMessage("Maksimum, minimumdan büyük olmalı.");
      return false;
    }

    if (totalLimit <= 0) {
      setMessage("Toplam Limit 0'dan büyük olmalı.");
      return false;
    }

    state.min = min;
    state.max = max;
    state.totalLimit = totalLimit;

    saveState();
    refreshUI();
    setMessage("Ayarlar kaydedildi.", true);
    return true;
  }

  function tablo2cek(options) {
    const {
      mini,
      maks,
      toplamLimit,
      toplamAlinan,
      fetchCalisiyor,
      intervalId,
      onUpdate,
      onStop,
      onError,
      onLog,
      onProcessCount
    } = options;

    if (toplamAlinan >= toplamLimit) {
      const stopMsg = "Toplam limite ulaşıldı, işlem durduruldu.";
      document.title = "DURDU | TOPLAM LIMIT TAMAMLANDI";

      if (intervalId) clearInterval(intervalId);

      if (typeof onLog === "function") onLog(stopMsg);
      if (typeof onStop === "function") {
        onStop({ toplamAlinan, toplamLimit });
      }
      return;
    }

    const kalanBaslangic = toplamLimit - toplamAlinan;
    if (kalanBaslangic < maks) {
      state.max = kalanBaslangic;
      saveState();
      refreshUI();

      if (typeof onLog === "function") {
        onLog(`Max, kalan limite güncellendi: ${kalanBaslangic}`);
      }

      if (state.max < state.min) {
        if (typeof onStop === "function") {
          onStop({ toplamAlinan, toplamLimit, reason: "max_below_min" });
        }
        return;
      }
    }

    const url = "api/getWithdraw.php?getislemCekimHavuz&verse=4";

    jQuery.ajax({
      url: url,
      async: true,
      method: "get",
      dataType: "json",
      success: function(data) {
        if (containsCaptcha(data)) {
          showCaptchaAlert();
          if (typeof onLog === "function") onLog("CAPTCHA ALGILANDI!");
          if (typeof onError === "function") onError("Captcha algılandı");
          return false;
        }

        if (typeof data.error !== "undefined") {
          if (typeof onError === "function") onError(data.error);
          return false;
        }

        const pageInput = qs("#page");
        if (pageInput) pageInput.value = "1";

        // Havuzdaki işlem sayısını logla
        const islemSayisi = (Array.isArray(data) ? data.length : 0);
        if (typeof onProcessCount === "function") {
          onProcessCount(islemSayisi);
        }

        jQuery.each(data, function(i, item) {
          if (fetchCalisiyor()) {
            return false;
          }

          const id = item.id;
          const miktar = item.miktar;
          const banka = item.banka;
          const hash = item.hash;
          const miktar2 = String(miktar).replace(",", "");
          const miktar3 = Number(miktar2.split(".")[0]);

          if (isNaN(miktar3)) {
            return;
          }

          if (miktar3 > mini && miktar3 < state.max && state.max > mini) {
            if (toplamAlinan + miktar3 > toplamLimit) {
              return;
            }

            state.fetchRunning = true;

            fetch(`api/check.php?islemeAlCekim2&id=${id}&hash=${hash}`, {
              credentials: "include"
            })
              .then(r => r.json())
              .then(resp => {
                if (containsCaptcha(resp)) {
                  showCaptchaAlert();
                  if (typeof onLog === "function") onLog("CAPTCHA ALGILANDI!");
                  if (typeof onError === "function") onError("Captcha algılandı");
                  return;
                }

                if (resp.error) {
                  if (typeof onLog === "function") onLog(`HATA: ${resp.error}`);
                  if (typeof onError === "function") onError(resp.error);
                } else {
                  const yeniToplam = state.totalProcessed + miktar3;
                  const kalanLimit = toplamLimit - yeniToplam;

                  if (typeof onUpdate === "function") {
                    onUpdate({
                      alinan: miktar3,
                      toplamAlinan: yeniToplam,
                      kalanLimit
                    });
                  }

                  if (typeof onLog === "function") {
                    onLog(`BAŞARILI ${miktar3} | TOPLAM: ${yeniToplam} | KALAN: ${kalanLimit}`);
                  }

                  document.title = "BAŞARILI " + miktar3 + " TOPLAM:" + yeniToplam + " KALAN:" + kalanLimit;

                  if (yeniToplam >= toplamLimit) {
                    const stopMsg = "Toplam limite ulaşıldı, işlem durduruldu.";
                    document.title = "DURDU | TOPLAM LIMIT TAMAMLANDI";

                    if (state.timer) {
                      clearInterval(state.timer);
                      state.timer = null;
                    }

                    state.running = false;
                    refreshUI();

                    if (typeof onLog === "function") onLog(stopMsg);
                    if (typeof onStop === "function") {
                      onStop({
                        toplamAlinan: yeniToplam,
                        toplamLimit
                      });
                    }
                    return;
                  }

                  if (kalanLimit < state.max) {
                    state.max = kalanLimit;
                    saveState();
                    refreshUI();

                    if (typeof onLog === "function") {
                      onLog(`Max, kalan limite güncellendi: ${kalanLimit}`);
                    }

                    if (state.max < state.min) {
                      if (typeof onStop === "function") {
                        onStop({
                          toplamAlinan: yeniToplam,
                          toplamLimit,
                          reason: "max_below_min"
                        });
                      }
                    }
                  }
                }
              })
              .catch(err => {
                if (typeof onLog === "function") onLog(`Fetch hatası: ${err}`);
                if (typeof onError === "function") onError(err);
              })
              .finally(() => {
                state.fetchRunning = false;
              });

            return false;
          }
        });
      },
      error: function(xhr, status, error) {
        if (typeof onLog === "function") onLog(`Ajax hatası: ${error}`);
        if (typeof onError === "function") onError(error);
      }
    });
  }

  function runTask() {
    if (!state.running) return;

    if (state.totalLimit <= 0) {
      stopLoop();
      setMessage("Toplam Limit 0'dan büyük olmalı.");
      return;
    }

    if (state.fetchRunning) {
      return;
    }

    if (state.totalProcessed >= state.totalLimit) {
      stopLoop();
      setMessage("Toplam limite ulaşıldı.", true);
      return;
    }

    const kalan = state.totalLimit - state.totalProcessed;

    if (kalan < state.max) {
      state.max = kalan;
      saveState();
      refreshUI();
      log("Max, kalan limite güncellendi: " + kalan);
    }

    if (state.max < state.min) {
      stopBecauseRemainingBelowMin();
      return;
    }

    tablo2cek({
      mini: state.min,
      maks: state.max,
      toplamLimit: state.totalLimit,
      toplamAlinan: state.totalProcessed,
      fetchCalisiyor: () => state.fetchRunning,
      intervalId: state.timer,
      onUpdate: ({ toplamAlinan }) => {
        state.totalProcessed = toplamAlinan;
        saveState();
        refreshUI();
      },
      onStop: ({ toplamAlinan, reason }) => {
        state.totalProcessed = toplamAlinan;
        saveState();
        refreshUI();

        if (reason === "max_below_min") {
          stopBecauseRemainingBelowMin();
        } else {
          setMessage("Toplam limite ulaşıldı, durduruldu.", true);
        }
      },
      onError: (err) => {
        setMessage("Hata oluştu: " + err);
      },
      onLog: (msg) => {
        log(msg);
      },
      onProcessCount: (count) => {
        logProcessCount(count);
      }
    });
  }

  function startLoop() {
    if (!applySettings()) return;

    if (state.running) {
      setMessage("Zaten çalışıyor.");
      return;
    }

    const kalan = state.totalLimit - state.totalProcessed;

    if (kalan < state.max) {
      state.max = kalan;
      saveState();
      refreshUI();
      log("Max, kalan limite güncellendi: " + kalan);
    }

    if (state.max < state.min) {
      stopBecauseRemainingBelowMin();
      return;
    }

    state.captchaBypassUntilStart = false;
    state.running = true;
    refreshUI();
    setMessage("Çalışma başlatıldı.", true);

    runTask();
    state.timer = setInterval(runTask, 5200);
  }

  window.startLoop = startLoop;

  function stopLoop() {
    state.running = false;
    state.fetchRunning = false;

    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }

    refreshUI();
  }

  qs("#elite-save").onclick = applySettings;
  qs("#elite-toggle").onclick = () => {
    if (state.running) {
      stopLoop();
      setMessage("Durduruldu.", true);
    } else {
      startLoop();
    }
  };
  qs("#elite-solve-captcha").onclick = () => {
    solveCaptchaManually();
  };
  qs("#elite-reset").onclick = () => {
    state.totalProcessed = 0;
    saveState();
    refreshUI();
    setMessage("Sayaç sıfırlandı.", true);
    log("Sayaç sıfırlandı.");
  };

  Array.from(panel.querySelectorAll("button")).forEach(btn => {
    if (btn.id === "elite-close-header" || btn.id === "elite-minimize" || btn.id === "elite-size") return;
    
    btn.onmouseenter = () => {
      if (btn.id === "elite-solve-captcha") {
        if (state.captchaDetected) {
          btn.style.transform = "translateY(-1px) scale(1.03)";
          btn.style.boxShadow =
            "0 0 20px rgba(239,68,68,.9), 0 0 34px rgba(249,115,22,.7), 0 8px 20px rgba(0,0,0,.25)";
        } else {
          btn.style.transform = "translateY(-1px) scale(1.02)";
          btn.style.boxShadow = "0 8px 20px rgba(0,0,0,.20)";
        }
      } else {
        btn.style.transform = "translateY(-1px) scale(1.02)";
        btn.style.boxShadow = "0 8px 20px rgba(0,0,0,.25)";
      }
    };

    btn.onmouseleave = () => {
      btn.style.transform = "translateY(0) scale(1)";

      if (btn.id === "elite-solve-captcha") {
        if (state.captchaDetected) {
          btn.style.boxShadow =
            "0 0 12px rgba(239,68,68,.6), 0 0 24px rgba(249,115,22,.5), inset 0 0 8px rgba(255,255,255,.1)";
        } else {
          btn.style.boxShadow = "none";
        }
      } else {
        btn.style.boxShadow = "none";
      }
    };
  });

  refreshUI();
  setSolveButtonActive(state.captchaDetected);
  setMessage("Hazır.");
})();

window.onCaptchaSuccess = function(currentId) {
  $("#captchaModal").modal("hide");

  $("#captchaModal").one("hidden.bs.modal", function () {
    if (window.PUZZLE_UI_STATE) {
      const state = window.PUZZLE_UI_STATE;
      const panel = document.getElementById("elite-control-panel");
      const btn = document.getElementById("elite-solve-captcha");

      state.captchaDetected = false;
      state.captchaBypassUntilStart = false;
      state.captchaSoundPlayed = false;

      if (panel) {
        panel.style.border = "1px solid rgba(255,255,255,.08)";
      }

      if (btn) {
        btn.style.background = "linear-gradient(135deg,#374151,#4b5563)";
        btn.style.boxShadow = "none";
        btn.style.animation = "none";
        btn.style.border = "1px solid rgba(255,255,255,.08)";
      }

      if (!state.running && typeof window.startLoop === "function") {
        window.startLoop();
      }
    }
  });
};
