// --- AUDIO ENGINE (ASMR) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playSoftTone(
  freq,
  type,
  duration,
  vol,
  attackTime = 0.05,
  releaseTime = 0.3,
) {
  const ctx = getAudioCtx();
  if (ctx.state === "suspended") ctx.resume();
  const finalVolume =
    vol *
    (appSettings.soundVolume !== undefined
      ? parseFloat(appSettings.soundVolume)
      : 0.5);
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  filter.type = "lowpass";
  filter.frequency.value = 1500;
  filter.Q.value = 1;
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(
    finalVolume,
    ctx.currentTime + attackTime,
  );
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + attackTime + releaseTime,
  );

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + attackTime + releaseTime + 0.1);
}

const sounds = {
  click: () => playSoftTone(600, "sine", 0.1, 0.06, 0.01, 0.1),
  swoosh: () => playSoftTone(400, "sine", 0.2, 0.04, 0.1, 0.2),
  success: () => {
    playSoftTone(523.25, "sine", 0.6, 0.04, 0.05, 0.4);
    setTimeout(() => playSoftTone(659.25, "sine", 0.6, 0.04, 0.05, 0.4), 60);
    setTimeout(() => playSoftTone(783.99, "sine", 0.8, 0.05, 0.05, 0.5), 120);
    setTimeout(() => playSoftTone(1046.5, "sine", 1.0, 0.06, 0.05, 0.6), 180);
  },
  delete: () => {
    const ctx = getAudioCtx();
    if (ctx.state === "suspended") ctx.resume();
    const finalVolume =
      0.04 *
      (appSettings.soundVolume !== undefined
        ? parseFloat(appSettings.soundVolume)
        : 0.5);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(finalVolume, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  },
  error: () => {
    playSoftTone(200, "sine", 0.3, 0.1, 0.05, 0.2);
    setTimeout(() => playSoftTone(150, "sine", 0.4, 0.1, 0.05, 0.3), 100);
  },
  login: () => {
    playSoftTone(440.0, "sine", 1.5, 0.04, 0.2, 1.0);
    playSoftTone(554.37, "sine", 1.5, 0.04, 0.2, 1.0);
    playSoftTone(659.25, "sine", 1.5, 0.04, 0.2, 1.0);
  },
};

function playSound(soundName, ...args) {
  if (appSettings.sounds && sounds[soundName]) {
    sounds[soundName](...args);
  }
}

// --- UTILITY FUNCTIONS ---
const _hex2rgbaCache = new Map();
const hex2rgba = (hex, alpha) => {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) {
    return `rgba(99, 102, 241, ${alpha})`;
  }
  const key = hex + alpha;
  const cached = _hex2rgbaCache.get(key);
  if (cached) return cached;
  const hexValue = hex.slice(1);
  const [r, g, b] = (
    hexValue.length === 3
      ? [
          hexValue[0],
          hexValue[0],
          hexValue[1],
          hexValue[1],
          hexValue[2],
          hexValue[2],
        ]
      : hexValue.match(/\w\w/g)
  ).map((x) => parseInt(x, 16));
  const result = `rgba(${r},${g},${b},${alpha})`;
  _hex2rgbaCache.set(key, result);
  return result;
};

const stdDev = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
  return Math.sqrt(
    arr.reduce((sq, val) => sq + Math.pow(val - mean, 2), 0) / arr.length,
  );
};

const safeEval = (str) => {
  if (!str) return 0;
  let clean = str
    .toString()
    .replace(/,/g, ".")
    .replace(/x|X|×/g, "*")
    .replace(/\s+/g, "");
  try {
    return new Function("return " + clean)();
  } catch (e) {
    console.error("safeEval error on string:", str, e);
    return NaN;
  }
};

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function updateDynamicStyles() {
  let styleEl = document.getElementById("dynamic-app-styles");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "dynamic-app-styles";
    document.head.appendChild(styleEl);
  }
  const allColors = [...new Set(subjects.map((s) => s.color).filter(Boolean))];
  const key = allColors.join(",");
  if (updateDynamicStyles._lastKey === key) return; // no change
  updateDynamicStyles._lastKey = key;
  styleEl.innerHTML = allColors
    .map(
      (color) =>
        `.hover-border-${color.substring(1)}:hover { border-color: ${color} !important; }`,
    )
    .join("\n");
}

// --- NOTIFICATIONS ---
function notify(msg, type = "success") {
  // Les notifications ont été désactivées.
}

// --- CORE APP ---
let user = null;
let subjects = [];
let academicData = {};
let isDark = false;
const defaultSettings = {
  theme: "system",
  sounds: true,
  soundVolume: 0.5,
  fixedNav: true,
  zenMode: false,
  showAvatar: true,
  animations: true,
  blur: true,
  blobs: true,
  confirmDelete: true,
  showNoteDate: true,
  highContrast: false,
  reduceMotion: false,
  dyslexicFont: false,
  mainCardCollapsed: true,
  defaultSort: "noteCount",
  sortOrder: "desc",
  tagColors: {},
  manualGeneralAverage: null,
  autoReload: false,
  mobileMode: "editing", // "editing" or "view"
  hideAddSubject: false,
};
let appSettings = { ...defaultSettings };
const sortOptions = [
  {
    value: "date",
    label: "Date d'ajout",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3M3 11h18M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />',
  },
  {
    value: "noteCount",
    label: "Nombre de notes",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />',
  },
  {
    value: "average",
    label: "Moyenne",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l4 8 4-4 4 10 4-8" />',
  },
  {
    value: "alpha",
    label: "Alphabétique",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h7" />',
  },
  {
    value: "highestNote",
    label: "Meilleure note",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118L12 15.347l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L4.643 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L11.049 2.927z" />',
  },
  {
    value: "lowestNote",
    label: "Plus faible note",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v13m0 0l4-4m-4 4l-4-4" />',
  },
  {
    value: "stdDev",
    label: "Écart type",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 16l4-8 4 4 4-10 4 8" />',
  },
  {
    value: "coefWeightedAvg",
    label: "Moyenne pondérée",
    icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2" stroke="currentColor" fill="none"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h.01M12 7h.01M16 7h.01M8 11h8M8 15h8" />',
  },
  {
    value: "lastModified",
    label: "Dernière modification",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2a10 10 0 100 20 10 10 0 000-20z" />',
  },
  {
    value: "customTag",
    label: "Tag",
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.59 13.41L13.41 20.59a2 2 0 01-2.83 0L3.41 13.41a2 2 0 010-2.83L10.59 3.41a2 2 0 012.83 0L20.59 10.59a2 2 0 010 2.82z" />',
  },
];
let selectedColor = "#6366f1";
let pinState = {
  mode: "check", // 'check', 'set', 'confirm', 'verify'
  targetUser: null,
  currentPin: "",
  length: 4,
  firstPin: "", // for confirmation when setting
  onSuccess: null, // Callback for 'verify' mode
};
let chartsInstance = {};
let fullscreenChart = null;
let currentFullscreenChartInfo = {
  chartId: null,
  chartType: null,
};
// Flag for phone-restricted experience (no hover primary)
let isPhoneXP = false;

function detectPhoneXP() {
  const canHover =
    window.matchMedia && window.matchMedia("(hover: hover)").matches;
  const pointerCoarse =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const hasTouch = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
  // If the device cannot hover and has a coarse pointer or touch points, consider it a phone experience.
  isPhoneXP = !canHover && (pointerCoarse || hasTouch);
  return isPhoneXP;
}

function applyPhoneExperience() {
  document.body.classList.add("phone-xp");
  // Hide theme toggle button
  const themeBtn = document.querySelector('button[onclick="cycleTheme()"]');
  if (themeBtn) themeBtn.style.display = "none";

  // Hide expand/collapse all accordions button
  const toggleAllBtn = document.querySelector(
    'button[onclick="toggleAllAccordions()"]',
  );
  if (toggleAllBtn) toggleAllBtn.style.display = "none";

  // Ensure only avatar is shown (remove account name)
  const headerName = document.getElementById("header-user-name");
  if (headerName) headerName.classList.add("hidden");

  // Hide footer
  const footer = document.querySelector("footer");
  if (footer) footer.style.display = "none";

  // Hide tab navigation on phone
  const tabNav = document.querySelector("nav");
  if (tabNav) tabNav.style.display = "none";

  // Make main input and analysis more compact via CSS class
  document.documentElement.classList.add("phone-xp");

  // Ensure mobile semester label is visible
  const mobileSemLabel = document.getElementById("mobile-semester-label");
  if (mobileSemLabel) mobileSemLabel.classList.remove("hidden");
  updateMobileSemesterLabel();

  // Remove arrows around semester controls (if present)
  document
    .querySelectorAll(
      'button[onclick="cycleSemester(-1)"], button[onclick="cycleSemester(1)"], #semester-menu',
    )
    .forEach((el) => (el.style.display = "none"));
}
let pendingSubjectData = null;

window.onload = () => {
  // Check if mobile device
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || window.innerWidth < 768;
  if (isMobile) {
    document.body.classList.add("is-mobile");
  }

  loadSettings();
  applyAllSettings();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (user) scheduleRenderGrades();
    }, 250);
  }, { passive: true });

  // Use a timeout to ensure the loading animation is visible for a minimum duration
  setTimeout(() => {
    // 1. Start hiding loader
    const loader = document.getElementById("loading-screen");
    loader.style.opacity = "0";

    // 2. After loader fade-out is complete, show the correct screen
    setTimeout(() => {
      loader.style.display = "none";

      const stayLoggedInInfo = JSON.parse(
        localStorage.getItem("noteo_stay_logged_in"),
      );
      if (stayLoggedInInfo && stayLoggedInInfo.expires > Date.now()) {
        const profilesForStay = Object.keys(localStorage)
          .filter((k) => k.startsWith("noteo_profile_"))
          .map((k) => JSON.parse(localStorage.getItem(k)));
        const userToLogin = profilesForStay.find(
          (p) => p.id === stayLoggedInInfo.userId,
        );
        if (userToLogin) {
          loginAs(userToLogin, true); // forceUnlock = true
          return; // Skip normal flow
        }
      }
      // If not logged in, clear any old data
      localStorage.removeItem("noteo_stay_logged_in");

      const profiles = Object.keys(localStorage)
        .filter((k) => k.startsWith("noteo_profile_"))
        .map((k) => JSON.parse(localStorage.getItem(k)));

      if (profiles.length > 1) {
        // More than one user, show selection screen
        showUserSelectionScreen(profiles);
      } else if (profiles.length === 1) {
        // One user, attempt to log them in
        loginAs(profiles[0]);
      } else {
        // No users, show the creation form
        document.getElementById("login-screen").classList.remove("hidden");
        updateLoginSessions();
      }
    }, 400); // This must match the loader's transition time
  }, 300); // This is the minimum loading display time

  // Cache important DOM elements for faster access
  cacheDom();
  // Initialize EmailJS for PIN recovery (lazy — loads on demand)
  initEmailJS();

  // Defer non-critical tasks to idle time
  const deferTask = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
  deferTask(() => {
    // Detect and apply phone-restricted experience when appropriate
    try {
      if (detectPhoneXP()) {
        applyPhoneExperience();
        initScrollToggleButton();
      }
    } catch (e) {
      console.warn("Phone XP detection error", e);
    }
    // Show warnings and cloud import prompt if needed
    maybeShowPhoneWarning();
    maybeShowMobileModeModal();
    checkCloudImportFromUrl();
  });

  // Add event listeners for the duplicate subject modal
  document.getElementById("duplicate-opt-update").onclick = () => {
    if (!pendingSubjectData) return;
    processSubjectAddition(pendingSubjectData, "update");
    closeModals();
  };
  document.getElementById("duplicate-opt-create").onclick = () => {
    if (!pendingSubjectData) return;
    processSubjectAddition(pendingSubjectData, "create");
    closeModals();
  };
  document.getElementById("duplicate-opt-rename").onclick = () => {
    if (!pendingSubjectData) return;
    closeModals();
    setTimeout(() => {
      // Timeout to allow modal to close before prompt
      const newName = prompt(
        "Entrez un nouveau nom pour la matière :",
        pendingSubjectData.name,
      );
      if (newName && newName.trim() !== "") {
        pendingSubjectData.name = newName.trim();
        const existingSubject = subjects.find(
          (s) => s.name.toLowerCase() === pendingSubjectData.name.toLowerCase(),
        );
        if (existingSubject) {
          openDuplicateSubjectModal(pendingSubjectData);
        } else {
          processSubjectAddition(pendingSubjectData, "create");
        }
      } else {
        pendingSubjectData = null;
      }
    }, 300);
  };
};

function showUserSelectionScreen(profiles) {
  const grid = document.getElementById("user-selection-grid");
  grid.innerHTML = "";

  profiles.forEach((s) => {
    const hasPin = s.authSecret || s.hashedPin;
    const card = document.createElement("button");
    card.className =
      "glass-card p-6 rounded-[2rem] flex flex-col items-center gap-4 text-center hover:!border-indigo-500 group transition-all duration-300";
    card.onclick = () => handleUserSelection(s);

    card.innerHTML = `
                    <div class="relative">
                        <img src="https://ui-avatars.com/api/?name=${s.prenom}+${s.nom}&background=6366f1&color=fff&rounded=true&bold=true&size=128" class="w-24 h-24 rounded-full shadow-lg group-hover:scale-105 transition-transform" alt="Avatar">
                        ${
                          hasPin
                            ? `
                            <div class="absolute bottom-0 right-0 w-8 h-8 bg-[var(--bg-card)] rounded-full flex items-center justify-center border-2 border-[var(--border)] shadow-md">
                                <svg class="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            </div>
                        `
                            : ""
                        }
                    </div>
                    <span class="font-bold text-lg text-[var(--text-main)] mt-2">${s.prenom}</span>
                `;
    grid.appendChild(card);
  });
  document.getElementById("user-selection-screen").classList.remove("hidden");
}

function handleUserSelection(session) {
  const stayLoggedIn = document.getElementById(
    "stay-logged-in-checkbox",
  ).checked;
  if (stayLoggedIn) {
    const twoHours = 2 * 60 * 60 * 1000;
    const expiry = Date.now() + twoHours;
    localStorage.setItem(
      "noteo_stay_logged_in",
      JSON.stringify({ userId: session.id, expires: expiry }),
    );
  } else {
    localStorage.removeItem("noteo_stay_logged_in");
  }
  loginAs(session);
}

function toggleColorMenu(e) {
  e.stopPropagation();
  playSound("click");
  document.getElementById("color-menu").classList.toggle("show");
}

function updateSelectedColorUI(color, name) {
  document.getElementById("selected-color-preview").style.backgroundColor =
    color;
  document.getElementById("selected-color-name").textContent = name;
}

function selectColor(el) {
  playSound("click");
  document
    .querySelectorAll(".color-dot")
    .forEach((d) => d.classList.remove("active"));
  el.classList.add("active");
  selectedColor = el.dataset.color;
  updateSelectedColorUI(el.dataset.color, el.dataset.name);
  document.getElementById("color-menu").classList.remove("show");
}

function setCustomColor(color) {
  playSound("click");
  document
    .querySelectorAll(".color-dot")
    .forEach((d) => d.classList.remove("active"));
  selectedColor = color;
  // Visual feedback could be added here if desired
  updateSelectedColorUI(color, "Perso.");
  document.getElementById("color-menu").classList.remove("show");
}

function toggleMainCard() {
  const card = document.getElementById("main-card");
  const isCollapsed = card.classList.toggle("collapsed");
  document
    .getElementById("main-card-icon-minus")
    .classList.toggle("hidden", isCollapsed);
  document
    .getElementById("main-card-icon-plus")
    .classList.toggle("hidden", !isCollapsed);
  updateSetting("mainCardCollapsed", isCollapsed);
}

function applyMainCardState() {
  const card = document.getElementById("main-card");
  const isCollapsed = card.classList.contains("collapsed");

  // Determine the desired state
  let wantCollapsed;
  if (subjects.length === 0) {
    wantCollapsed = false; // Always open if no subjects
  } else {
    wantCollapsed = appSettings.mainCardCollapsed; // Respect user setting
  }

  // Apply the state only if it's different from current
  if (wantCollapsed !== isCollapsed) {
    toggleMainCard();
  }
}

function updateLoginSessions() {
  const sessions = Object.keys(localStorage)
    .filter((k) => k.startsWith("noteo_profile_"))
    .map((k) => JSON.parse(localStorage.getItem(k)));
  const area = document.getElementById("login-sessions-area");
  const list = document.getElementById("login-sessions-list");
  if (sessions.length > 0) {
    area.classList.remove("hidden");
    list.innerHTML = "";
    sessions.forEach((s) => {
      const btn = document.createElement("button");
      btn.className =
        "w-full p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] hover:border-indigo-500 hover:text-indigo-500 transition-all text-left font-bold flex justify-between items-center";
      btn.innerHTML = `<span>${s.prenom} ${s.nom}</span> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
      btn.onclick = () => loginAs(s);
      list.appendChild(btn);
    });
  }
}

function completeLogin(userProfile) {
  user = userProfile;
  localStorage.setItem("noteo_v8_active", JSON.stringify(user));
  loadUserData();
  playSound("login");
  showApp();
}

function loginAs(session, forceUnlock = false) {
  // Backward compatibility for old hashedPin property
  if (session.hashedPin && !session.authSecret) {
    session.authSecret = session.hashedPin;
    session.authType = "pin4";
    delete session.hashedPin;
    localStorage.setItem(
      `noteo_profile_${session.id}`,
      JSON.stringify(session),
    );
  }

  // Ensure cloudId is present when using cloud mode
  if (session.storageMode === "cloud" && !session.cloudId) {
    session.cloudId = crypto?.randomUUID?.() || `cloud_${Date.now()}`;
    localStorage.setItem(
      `noteo_profile_${session.id}`,
      JSON.stringify(session),
    );
  }

  const pinSkipExpiry = JSON.parse(
    localStorage.getItem(`noteo_pin_unlock_expiry_${session.id}`),
  );
  if (
    session.authSecret &&
    !forceUnlock &&
    (!pinSkipExpiry || pinSkipExpiry < Date.now())
  ) {
    openPinModal("check", session);
  } else {
    completeLogin(session);
  }
}

document.getElementById("login-form").onsubmit = (e) => {
  e.preventDefault();
  const prenom = document.getElementById("prenom").value.trim();
  const nom = document.getElementById("nom").value.trim();
  const periodType = document.getElementById("new-account-period-type").value;
  const storageMode =
    document.querySelector('input[name="storage-mode"]:checked')?.value ||
    "local";
  const cloudId =
    storageMode === "cloud"
      ? crypto?.randomUUID?.() || `cloud_${Date.now()}`
      : null;
  const id = (prenom + nom).toLowerCase().replace(/\s/g, "");

  if (localStorage.getItem(`noteo_profile_${id}`)) {
    alert(
      "Un utilisateur avec ce nom et prénom existe déjà. Veuillez vous connecter via l'écran de sélection de profil.",
    );
    return;
  }

  const newProfile = {
    id,
    prenom,
    nom,
    periodType: periodType,
    storageMode,
    cloudId,
  };
  localStorage.setItem(`noteo_profile_${id}`, JSON.stringify(newProfile));

  // Create initial data for this new user
  const periodTypeName =
    newProfile.periodType === "trimesters" ? "Trimestre" : "Semestre";
  const periodCount = newProfile.periodType === "trimesters" ? 3 : 2;
  const initialSemesters = [];
  const firstId = Date.now();

  for (let i = 0; i < periodCount; i++) {
    initialSemesters.push({
      id: firstId + i,
      name: `${periodTypeName} ${i + 1}`,
      subjects: [],
    });
  }

  const initialAcademicData = {
    semesters: initialSemesters,
    currentSemesterId: firstId,
  };
  localStorage.setItem(
    `noteo_v8_data_${id}`,
    JSON.stringify(initialAcademicData),
  );

  loginAs(newProfile);
  openTutoModal();
};

function showApp(silent = false) {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("user-selection-screen").classList.add("hidden");
  const dash = document.getElementById("dashboard-screen");
  dash.classList.remove("hidden");
  setTimeout(() => dash.classList.replace("opacity-0", "opacity-100"), 50);

  document.getElementById("user-display").textContent =
    `${user.prenom} ${user.nom}`;
  document.getElementById("header-user-name").textContent = user.prenom;
  document.getElementById("user-avatar").src =
    `https://ui-avatars.com/api/?name=${user.prenom}+${user.nom}&background=6366f1&color=fff&rounded=true&bold=true`;
  document.getElementById("lock-session-btn").style.display = user.authSecret
    ? "flex"
    : "none";

  renderGrades();
  updateSemesterUI();
  applyMainCardState();
  updateSortButtonUI();
  applyMobileMode(); // Apply mobile mode settings
}

// --- NOUVEAUX MENUS (MODALS) ---
function lockSession() {
  if (!user || !user.authSecret) return;
  playSound("swoosh");
  localStorage.removeItem(`noteo_pin_unlock_expiry_${user.id}`);
  localStorage.removeItem("noteo_stay_logged_in");
  closeModals();

  const unlockSuccess = () => {
    playSound("success");
  };

  openPinModal("check", user, { onSuccess: unlockSuccess });
}

function openUserSwitchModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("user-menu").classList.remove("show");
  const list = document.getElementById("modal-user-list");
  list.innerHTML = "";

  const sessions = Object.keys(localStorage)
    .filter((k) => k.startsWith("noteo_profile_"))
    .map((k) => JSON.parse(localStorage.getItem(k)));
  sessions.forEach((s) => {
    const isCurrent = user && s.id === user.id;
    const hasPin = s.authSecret || s.hashedPin;
    const btn = document.createElement("button");
    btn.className = `w-full text-left p-4 rounded-2xl font-bold flex items-center justify-between transition-all border ${isCurrent ? "bg-indigo-500/10 border-indigo-500 text-indigo-600" : "bg-[var(--input-bg)] border-[var(--border)] hover:border-indigo-400"}`;
    btn.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">${s.prenom[0]}</div>
                        <span>${s.prenom} ${s.nom} ${isCurrent ? '<span class="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full ml-2">ACTIF</span>' : ""}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        ${hasPin ? '<svg class="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>' : ""}
                        <svg class="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                `;
    btn.onclick = () => {
      closeModals();
      setTimeout(() => loginAs(s), 300);
    };
    list.appendChild(btn);
  });
  const modal = document.getElementById("switch-user-modal");
  modal.classList.add("open");
}

/* ===== EmailJS Configuration ===== */
const EMAILJS_CONFIG = {
  serviceId: "service_noteo",
  templateId: "template_noteo_pin",
  publicKey: "YOUR_EMAILJS_PUBLIC_KEY"
};

let recoveryState = { timerId: null, resendCooldown: 0 };

let _emailJSLoaded = false;
function initEmailJS() {
  // EmailJS is now lazy-loaded on first use via loadEmailJS()
  // This function is kept for backward compatibility
}
function loadEmailJS() {
  if (_emailJSLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (typeof emailjs !== "undefined") {
      if (EMAILJS_CONFIG.publicKey !== "YOUR_EMAILJS_PUBLIC_KEY") emailjs.init(EMAILJS_CONFIG.publicKey);
      _emailJSLoaded = true;
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    s.onload = () => {
      if (EMAILJS_CONFIG.publicKey !== "YOUR_EMAILJS_PUBLIC_KEY") emailjs.init(EMAILJS_CONFIG.publicKey);
      _emailJSLoaded = true;
      resolve();
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function forgotPin() {
  const { targetUser } = pinState;
  if (!targetUser) return;

  const profileKey = `noteo_profile_${targetUser.id}`;
  const profileData = JSON.parse(localStorage.getItem(profileKey));

  closePinModal();
  playSound("swoosh");

  const modal = document.getElementById("recovery-modal");
  document.getElementById("recovery-step-email").classList.remove("hidden");
  document.getElementById("recovery-step-code").classList.add("hidden");
  document.getElementById("recovery-step-noemail").classList.add("hidden");
  document.getElementById("recovery-send-error").classList.add("hidden");
  document.getElementById("recovery-code-error").classList.add("hidden");

  if (profileData && profileData.recoveryEmail) {
    const email = profileData.recoveryEmail;
    const masked = maskEmail(email);
    document.getElementById("recovery-email-display").textContent = masked;
    document.getElementById("recovery-send-btn").disabled = false;
    document.getElementById("recovery-send-btn").textContent = "Envoyer le code";
  } else {
    document.getElementById("recovery-step-email").classList.add("hidden");
    document.getElementById("recovery-step-noemail").classList.remove("hidden");
  }

  document.body.classList.add("modal-open");
  modal.classList.add("open");
}

function maskEmail(email) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const masked = local.length <= 2 ? local[0] + "***" : local[0] + "***" + local.slice(-1);
  return masked + "@" + domain;
}

function closeRecoveryModal() {
  playSound("click");
  document.getElementById("recovery-modal").classList.remove("open");
  document.body.classList.remove("modal-open");
  if (recoveryState.timerId) { clearInterval(recoveryState.timerId); recoveryState.timerId = null; }
}

async function sendRecoveryCode() {
  const { targetUser } = pinState;
  if (!targetUser) return;

  const profileKey = `noteo_profile_${targetUser.id}`;
  const profileData = JSON.parse(localStorage.getItem(profileKey));
  if (!profileData || !profileData.recoveryEmail) return;

  const sendBtn = document.getElementById("recovery-send-btn");
  const errorEl = document.getElementById("recovery-send-error");
  errorEl.classList.add("hidden");
  sendBtn.disabled = true;
  sendBtn.textContent = "Envoi en cours…";

  const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = await hashPin(recoveryCode);

  sessionStorage.setItem("noteo_recovery", JSON.stringify({
    userId: targetUser.id,
    code: hashedCode,
    expires: Date.now() + 10 * 60 * 1000,
  }));

  let emailSent = false;
  try {
    await loadEmailJS();
  } catch (e) {
    console.warn("Failed to load EmailJS", e);
  }
  if (typeof emailjs !== "undefined" && EMAILJS_CONFIG.publicKey !== "YOUR_EMAILJS_PUBLIC_KEY") {
    try {
      await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
        to_email: profileData.recoveryEmail,
        to_name: profileData.prenom || "Utilisateur",
        recovery_code: recoveryCode,
      });
      emailSent = true;
    } catch (err) {
      console.warn("EmailJS error:", err);
    }
  }

  if (!emailSent) {
    console.info("[Noteo] Recovery code (EmailJS not configured):", recoveryCode);
  }

  sendBtn.textContent = "Code envoyé ✓";
  playSound("click");

  setTimeout(() => {
    document.getElementById("recovery-step-email").classList.add("hidden");
    document.getElementById("recovery-step-code").classList.remove("hidden");
    document.getElementById("recovery-code-input").value = "";
    document.getElementById("recovery-code-input").focus();
    document.getElementById("recovery-code-error").classList.add("hidden");
    startRecoveryTimer();
  }, 600);
}

function startRecoveryTimer() {
  recoveryState.resendCooldown = 60;
  const timerEl = document.getElementById("recovery-timer");
  const resendBtn = document.getElementById("recovery-resend-btn");
  resendBtn.disabled = true;

  if (recoveryState.timerId) clearInterval(recoveryState.timerId);
  recoveryState.timerId = setInterval(() => {
    recoveryState.resendCooldown--;
    if (recoveryState.resendCooldown > 0) {
      timerEl.textContent = `Le code expire dans 10 min · Renvoyer dans ${recoveryState.resendCooldown}s`;
    } else {
      timerEl.textContent = "Le code expire dans 10 min";
      resendBtn.disabled = false;
      clearInterval(recoveryState.timerId);
      recoveryState.timerId = null;
    }
  }, 1000);
  timerEl.textContent = `Le code expire dans 10 min · Renvoyer dans 60s`;
}

async function verifyRecoveryCode() {
  const { targetUser } = pinState;
  const input = document.getElementById("recovery-code-input").value.trim();
  const errorEl = document.getElementById("recovery-code-error");
  errorEl.classList.add("hidden");

  if (!input || input.length !== 6 || !/^\d{6}$/.test(input)) {
    errorEl.textContent = "Veuillez entrer un code à 6 chiffres.";
    errorEl.classList.remove("hidden");
    playSound("error");
    return;
  }

  const recoveryData = JSON.parse(sessionStorage.getItem("noteo_recovery"));
  if (!recoveryData || recoveryData.userId !== targetUser.id) {
    errorEl.textContent = "Session expirée. Veuillez recommencer.";
    errorEl.classList.remove("hidden");
    playSound("error");
    return;
  }

  if (recoveryData.expires < Date.now()) {
    errorEl.textContent = "Le code a expiré. Renvoyez un nouveau code.";
    errorEl.classList.remove("hidden");
    playSound("error");
    sessionStorage.removeItem("noteo_recovery");
    return;
  }

  const hashedInput = await hashPin(input);
  if (hashedInput !== recoveryData.code) {
    errorEl.textContent = "Code incorrect. Vérifiez et réessayez.";
    errorEl.classList.remove("hidden");
    playSound("error");
    return;
  }

  sessionStorage.removeItem("noteo_recovery");
  if (recoveryState.timerId) { clearInterval(recoveryState.timerId); recoveryState.timerId = null; }
  playSound("click");
  closeRecoveryModal();
  setTimeout(() => openAuthSetup(), 300);
}

function forceResetPin() {
  const { targetUser } = pinState;
  if (!targetUser) return;

  const profileKey = `noteo_profile_${targetUser.id}`;
  const profileData = JSON.parse(localStorage.getItem(profileKey));
  if (!profileData) return;

  delete profileData.authSecret;
  delete profileData.authType;
  delete profileData.hashedPin;
  delete profileData.recoveryEmail;
  localStorage.setItem(profileKey, JSON.stringify(profileData));

  playSound("delete");
  closeRecoveryModal();

  if (pinState.mode === "check") {
    completeLogin(profileData);
  }
}

function openPinModal(mode, userProfile, onSuccessCallback = null) {
  document.body.classList.add("modal-open");
  pinState.mode = mode;
  pinState.targetUser = userProfile;
  pinState.currentPin = "";
  pinState.length =
    onSuccessCallback?.length ||
    parseInt(userProfile.authType?.replace("pin", "")) ||
    4;
  pinState.recoveryEmail = onSuccessCallback?.recoveryEmail || null;
  pinState.onSuccess =
    onSuccessCallback?.onSuccess || (() => completeLogin(userProfile));
  if (mode === "set") pinState.firstPin = "";

  const modal = document.getElementById("pin-modal");
  const title = document.getElementById("pin-modal-title");
  const userDisplay = document.getElementById("pin-modal-user");
  const forgotBtn = document.getElementById("forgot-pin-btn");

  userDisplay.textContent = `Pour ${userProfile.prenom} ${userProfile.nom}`;
  if (mode === "set")
    title.textContent = `Définir un PIN à ${pinState.length} chiffres`;
  else if (mode === "confirm")
    title.textContent = `Confirmer le PIN à ${pinState.length} chiffres`;
  else if (mode === "verify") title.textContent = "Vérifier le code PIN actuel";
  else title.textContent = "Entrer le code PIN";

  // Show forgot button only on login check
  forgotBtn.classList.toggle("hidden", mode !== "check");

  document.getElementById("skip-pin-checkbox").checked = false;

  updatePinDisplay();
  modal.classList.add("open");
  playSound("swoosh");
}

function closePinModal() {
  document.getElementById("pin-modal").classList.remove("open");
}

function updatePinDisplay() {
  document.getElementById("pin-display").textContent = "●".repeat(
    pinState.currentPin.length,
  );
}

async function handlePinInput(input) {
  playSound("click");
  if (input === "backspace")
    pinState.currentPin = pinState.currentPin.slice(0, -1);
  else if (pinState.currentPin.length < pinState.length)
    pinState.currentPin += input;

  updatePinDisplay();

  if (pinState.currentPin.length === pinState.length)
    setTimeout(submitPin, 200);
}

function openTutoModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("tuto-modal").classList.add("open");
}

function openVersionModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("version-modal").classList.add("open");
}

function openChangelogModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("changelog-modal").classList.add("open");
}

function openHelpModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("help-modal").classList.add("open");
  const searchInput = document.getElementById("help-search");
  if (searchInput) { searchInput.value = ""; }
  renderHelpCards("");
}

function filterHelp(query) {
  renderHelpCards(query);
}

/* ===== Help Articles Data ===== */
const helpArticles = [
  { title: "🚀 Premiers pas — Créer un compte", content: `<ol class="list-decimal list-inside space-y-1"><li>Sur l'écran d'accueil, cliquez sur <strong>« Créer un nouveau compte »</strong>.</li><li>Renseignez votre <strong>prénom</strong> et votre <strong>nom</strong>.</li><li>Choisissez l'organisation de l'année : <strong>Semestres</strong> ou <strong>Trimestres</strong>.</li><li>Sélectionnez le mode de sauvegarde : <strong>Local</strong> (navigateur) ou <strong>Cloud</strong> (serveur).</li><li>Cliquez sur <strong>« Créer un compte »</strong> — vous êtes connecté(e) immédiatement.</li></ol><p class="mt-2">💾 Vos données sont sauvegardées automatiquement à chaque modification.</p>` },
  { title: "📚 Ajouter une matière", content: `<ol class="list-decimal list-inside space-y-1"><li>Dans l'onglet <strong>Notes</strong>, cliquez sur <strong>« Ajouter une matière »</strong>.</li><li>Saisissez le <strong>nom</strong> de la matière (ex : Mathématiques).</li><li>Définissez un <strong>coefficient</strong> si nécessaire (par défaut : 1).</li><li>Choisissez une <strong>couleur</strong> pour identifier la matière visuellement.</li><li>Cliquez sur <strong>« Ajouter »</strong> — la matière apparaît dans la liste.</li></ol><p>💡 Vous pouvez créer autant de matières que vous le souhaitez.</p>`,
    tutorial: [
      { selector: "#btn-notes", text: "Cliquez sur l'onglet Notes pour commencer." },
      { selector: "#subject-name", text: "Saisissez le nom de la matière ici." },
      { selector: "#calc-top", text: "Définissez le coefficient de la matière." },
      { selector: "#selected-color-preview", text: "Choisissez une couleur pour votre matière." },
      { selector: "#calc-form", text: "Validez le formulaire pour ajouter la matière." }
    ]
  },
  { title: "✍️ Formats de saisie des notes", content: `<p class="font-semibold text-[var(--text-main)]">Noteo accepte de nombreux formats :</p><ul class="space-y-1 list-disc list-inside"><li><code class="bg-[var(--input-bg)] px-1 rounded">15/20</code> — note sur 20</li><li><code class="bg-[var(--input-bg)] px-1 rounded">15</code> — dénominateur 20 par défaut</li><li><code class="bg-[var(--input-bg)] px-1 rounded">15.5/20</code> ou <code class="bg-[var(--input-bg)] px-1 rounded">15,5/20</code> — décimales (point ou virgule)</li><li><code class="bg-[var(--input-bg)] px-1 rounded">15/20 + 12/20 + 18/20</code> — plusieurs notes en une seule saisie</li><li><code class="bg-[var(--input-bg)] px-1 rounded">15/20 * 2</code> ou <code class="bg-[var(--input-bg)] px-1 rounded">15/20 coeff 2</code> — coefficient individuel</li><li><code class="bg-[var(--input-bg)] px-1 rounded">AB</code> ou <code class="bg-[var(--input-bg)] px-1 rounded">ABS</code> — note absente (ignorée)</li></ul><p>📋 Le <strong>copier-coller depuis Pronote</strong> fonctionne directement.</p>`,
    tutorial: [
      { selector: "#btn-notes", text: "Assurez-vous d'être sur l'onglet Notes." },
      { selector: "#calc-bot", text: "Saisissez votre note ici dans le champ dédié." },
      { selector: "#calc-form", text: "Validez pour enregistrer la note." }
    ]
  },
  { title: "⚖️ Coefficients et pondérations", content: `<p class="font-semibold text-[var(--text-main)]">Il y a deux niveaux de coefficients :</p><ul class="space-y-1 list-disc list-inside"><li><strong>Coefficient de matière</strong> : modifiable via ✏️ sur la carte matière. Influe sur la moyenne générale.</li><li><strong>Coefficient de note individuelle</strong> : saisi avec <code class="bg-[var(--input-bg)] px-1 rounded">* 2</code> dans le champ.</li></ul><p>⚠️ Mettre le coefficient à <strong>0</strong> exclut la matière de la moyenne générale.</p><p>🧮 La moyenne pondérée tient compte des deux niveaux.</p>` },
  { title: "🧮 Comment est calculée la moyenne générale", content: `<p>Chaque note est ramenée sur 20 (<code class="bg-[var(--input-bg)] px-1 rounded">note / dénominateur × 20</code>), puis la moyenne pondérée est calculée.</p><p>La moyenne générale :</p><pre class="bg-[var(--input-bg)] rounded p-2 text-xs overflow-x-auto">Σ (moyenne_matière × coeff_matière) / Σ coeff_matières</pre><p>📌 Sans note, une matière n'est pas comptée.</p><p>✏️ Vous pouvez saisir une <strong>moyenne manuelle</strong> via le crayon ✏️ à côté de la moyenne.</p>` },
  { title: "🗂️ Gérer les périodes (semestres / trimestres)", content: `<ul class="space-y-1 list-disc list-inside"><li><strong>Naviguer</strong> : flèches ◀ ▶ dans le sélecteur en haut.</li><li><strong>Ajouter</strong> : Paramètres ⚙️ → Données → « Ajouter une période ».</li><li><strong>Renommer</strong> : Paramètres ⚙️ → Données → « Renommer la période ».</li><li><strong>Supprimer</strong> : Paramètres ⚙️ → Données → « Supprimer la période ».</li></ul><p>📅 Chaque période est indépendante.</p>`,
    tutorial: [
      { selector: "#current-semester-name", text: "Voici le nom de votre période actuelle." },
      { selector: "#semester-menu", text: "Utilisez les flèches pour naviguer entre les périodes." }
    ]
  },
  { title: "🔀 Intervertir deux périodes", content: `<ol class="list-decimal list-inside space-y-1"><li>Allez dans <strong>Paramètres ⚙️ → Données</strong>.</li><li>Cliquez sur « Intervertir deux périodes ».</li><li>Entrez les numéros des deux périodes à échanger.</li></ol><p>💡 Échange <strong>toutes les données</strong> des deux périodes.</p><p>⚠️ Il faut au moins <strong>deux périodes</strong>.</p>` },
  { title: "📑 Trier et ordonner les matières", content: `<p>Cliquez sur l'icône de tri 🔢 pour choisir :</p><ul class="space-y-1 list-disc list-inside"><li>Date d'ajout / Alphabétique</li><li>Moyenne (haute → basse ou basse → haute)</li><li>Nombre de notes / Note max / Note min</li><li>Écart-type / Moyenne pondérée / Dernière modification</li><li>Par tag (couleur) personnalisé</li></ul><p>🔄 Le tri est <strong>mémorisé</strong> entre les sessions.</p><p>📌 Le bouton épingle fixe une matière en haut.</p>`,
    tutorial: [
      { selector: "#btn-notes", text: "Rendez-vous sur l'onglet Notes." },
      { selector: "#sort-menu-btn", text: "Cliquez ici pour ouvrir le menu de tri." },
      { selector: "#grades-container", text: "Les matières sont triées selon votre choix ici." }
    ]
  },
  { title: "🏷️ Tags et couleurs des matières", content: `<p>Chaque matière possède une <strong>couleur / tag</strong> pour l'identifier et trier.</p><ul class="space-y-1 list-disc list-inside"><li>Cliquez sur le <strong>cercle coloré</strong> pour changer la couleur.</li><li>Regroupez par catégorie puis triez « par tag ».</li><li>Renommez un tag : <strong>Paramètres ⚙️ → Données → Tags personnalisés</strong>.</li></ul>` },
  { title: "📊 Analyser ses résultats avec les graphiques", content: `<ol class="list-decimal list-inside space-y-1"><li>Allez dans l'onglet <strong>Graphiques</strong>.</li><li>Cochez les <strong>matières</strong> à afficher.</li><li>Choisissez une <strong>période</strong> ou affichez tout.</li><li>Sélectionnez un <strong>type de graphique</strong>.</li><li>Cliquez sur <strong>« Mettre à jour »</strong>.</li></ol><p>🖥️ Le plein écran agrandit le graphique.</p><p>⚠️ Vérifiez qu'au moins une matière est cochée.</p>`,
    tutorial: [
      { selector: "#btn-charts", text: "Passez sur l'onglet Graphiques." },
      { selector: "#chart-subject-selector", text: "Sélectionnez les matières à afficher ici." },
      { selector: "#chart-type-selector", text: "Choisissez le type de graphique souhaité." },
      { selector: "#charts-grid", text: "Le graphique s'affiche dans cette zone." }
    ]
  },
  { title: "📈 Types de graphiques disponibles", content: `<ul class="space-y-1 list-disc list-inside"><li><strong>Barres</strong> — comparaison des moyennes par matière.</li><li><strong>Lignes</strong> — évolution des notes dans le temps.</li><li><strong>Radar</strong> — profil scolaire global.</li><li><strong>Histogramme de répartition</strong> — distribution des notes.</li><li><strong>Boîte à moustaches</strong> — médiane, quartiles et extrêmes.</li><li><strong>Barres groupées multi-périodes</strong> — comparer sur plusieurs semestres.</li></ul>` },
  { title: "🌙 Basculer entre thème clair et sombre", content: `<ul class="space-y-1 list-disc list-inside"><li>Cliquez sur le <strong>bouton soleil / lune ☀️🌙</strong> en haut à droite.</li><li>Thème automatique : <strong>Paramètres ⚙️ → Apparence → Thème → Système</strong>.</li><li>Le choix est <strong>mémorisé</strong>.</li></ul><p>🎨 La couleur principale est personnalisable indépendamment.</p>` },
  { title: "🧘 Mode Zen", content: `<p>Le Mode Zen simplifie l'interface :</p><ul class="space-y-1 list-disc list-inside"><li>Masque les <strong>blobs animés</strong>.</li><li>Masque la <strong>moyenne générale</strong>.</li><li>Interface épurée, sans distraction.</li></ul><p>Activez-le via <strong>Paramètres ⚙️ → Apparence → Mode Zen</strong>.</p>` },
  { title: "🎨 Personnaliser l'application", content: `<p>Dans <strong>Paramètres ⚙️ → Apparence</strong> :</p><ul class="space-y-1 list-disc list-inside"><li><strong>Couleur principale</strong> — sélecteur de couleur.</li><li><strong>Sons ASMR</strong> — activer et régler le volume.</li><li><strong>Animations</strong> — désactivables.</li><li><strong>Flou (glassmorphism)</strong> — désactivable.</li><li><strong>Navigation fixe</strong> — la barre reste visible.</li><li><strong>Afficher l'avatar</strong> — masquer si souhaité.</li></ul>` },
  { title: "🔔 Notifications (toasts)", content: `<p>Les toasts apparaissent en <strong>bas à droite</strong> :</p><ul class="space-y-1 list-disc list-inside"><li>🟢 <strong>Vert</strong> — opération réussie.</li><li>🔴 <strong>Rouge</strong> — erreur.</li><li>🔵 <strong>Bleu</strong> — information neutre.</li></ul><p>⏱️ Disparaissent après ~3 secondes.</p>` },
  { title: "🔒 Protéger son compte avec un PIN", content: `<ol class="list-decimal list-inside space-y-1"><li>Ouvrez <strong>Paramètres ⚙️ → Sécurité</strong>.</li><li>Activez « Code PIN » et choisissez la longueur : 4, 6 ou 8 chiffres.</li><li>Saisissez votre PIN deux fois.</li><li>Notez le <strong>code de récupération</strong>.</li></ol><p>🛡️ Le PIN est <strong>hashé en SHA-256</strong>.</p><p>⏳ Verrouillage après <strong>15 min</strong> d'inactivité.</p>` },
  { title: "🔑 PIN oublié — récupération", content: `<ol class="list-decimal list-inside space-y-1"><li>Sur l'écran de saisie du PIN, cliquez sur <strong>« PIN oublié ? »</strong>.</li><li>Confirmez l'envoi du code à votre <strong>adresse email</strong> de récupération.</li><li>Saisissez le <strong>code à 6 chiffres</strong> reçu par email.</li><li>Définissez un <strong>nouveau PIN</strong>.</li></ol><p>⚠️ Si aucun email n'est configuré, vous pourrez forcer la réinitialisation (supprime le PIN actuel).</p><p>💡 Pensez à vérifier vos <strong>spams</strong> si vous ne recevez pas l'email.</p>` },
  { title: "👤 Gérer plusieurs comptes", content: `<ul class="space-y-1 list-disc list-inside"><li>Cliquez sur votre <strong>avatar</strong> → « Changer d'utilisateur ».</li><li>Sélectionnez un compte ou créez-en un nouveau.</li><li>Chaque profil a ses propres <strong>données, paramètres et PIN</strong>.</li><li>Capacité limitée par le <strong>localStorage</strong> (~5–10 Mo).</li></ul><p>📱 Idéal pour gérer les notes de <strong>plusieurs enfants</strong>.</p>`,
    tutorial: [
      { selector: "#user-avatar", text: "Cliquez sur votre avatar pour accéder au menu utilisateur." },
      { selector: "#user-menu", text: "Ici vous pouvez changer d'utilisateur ou en créer un nouveau." }
    ]
  },
  { title: "☁️ Stockage local vs cloud", content: `<div class="grid grid-cols-2 gap-3"><div class="bg-[var(--input-bg)] rounded-lg p-3"><p class="font-bold text-[var(--text-main)] mb-1">💾 Local</p><ul class="space-y-1 list-disc list-inside text-xs"><li>Données dans le navigateur</li><li>Fonctionne hors-ligne</li><li>Totalement privé</li><li>Perdu si cache effacé</li></ul></div><div class="bg-[var(--input-bg)] rounded-lg p-3"><p class="font-bold text-[var(--text-main)] mb-1">🌐 Cloud</p><ul class="space-y-1 list-disc list-inside text-xs"><li>Données sur un serveur</li><li>Accès multi-appareils</li><li>Compte requis</li><li>Nécessite internet</li></ul></div></div><p>💡 En mode local, <strong>exportez régulièrement</strong> vos données.</p>` },
  { title: "📤 Exporter ses données", content: `<ol class="list-decimal list-inside space-y-1"><li>Allez dans <strong>Paramètres ⚙️ → Données</strong>.</li><li>Cliquez sur « Exporter le compte ».</li><li>Cochez les <strong>périodes</strong> à inclure.</li><li>Un fichier <code class="bg-[var(--input-bg)] px-1 rounded">.json</code> est téléchargé.</li></ol><p>📦 Contient : matières, notes, coefficients, couleurs et paramètres.</p>` },
  { title: "📥 Importer des données", content: `<ol class="list-decimal list-inside space-y-1"><li>Allez dans <strong>Paramètres ⚙️ → Données</strong>.</li><li>Cliquez sur « Importer un fichier ».</li><li>Sélectionnez le <code class="bg-[var(--input-bg)] px-1 rounded">.json</code> exporté.</li><li>Confirmez l'import.</li></ol><p>⚠️ Seuls les fichiers <strong>exportés par Noteo</strong> sont acceptés.</p>` },
  { title: "🗑️ Supprimer des matières, notes ou un compte", content: `<ul class="space-y-1 list-disc list-inside"><li><strong>Supprimer une note</strong> : historique → ✕ à côté de la note.</li><li><strong>Supprimer une matière</strong> : icône 🗑️ sur la carte.</li><li><strong>Vider la période</strong> : Paramètres ⚙️ → Données → « Vider la période ».</li><li><strong>Supprimer le compte</strong> : Paramètres ⚙️ → Données → « Supprimer le compte » — <strong>irréversible</strong>.</li></ul><p>💾 <strong>Exportez avant de supprimer</strong>.</p>` },
  { title: "♿ Accessibilité", content: `<p>Options dans <strong>Paramètres ⚙️ → Accessibilité</strong> :</p><ul class="space-y-1 list-disc list-inside"><li><strong>Police OpenDyslexic</strong> — optimisée pour les dyslexiques.</li><li><strong>Contraste élevé</strong> — meilleure lisibilité.</li><li><strong>Réduire les animations</strong> — respecte aussi le réglage OS.</li><li><strong>Boutons tactiles agrandis</strong> — sur mobile.</li></ul>` },
  { title: "⌨️ Astuces et raccourcis", content: `<ul class="space-y-1 list-disc list-inside"><li>Cercle coloré = changer la couleur/tag.</li><li>📌 épingle = fixer en haut de liste.</li><li>« Rester connecté(e) » = ne plus saisir son nom.</li><li>Clic sur le logo « N. » = retour en haut.</li><li>Entrée ↵ = valider l'ajout d'une note.</li><li>Scroll horizontal dans le sélecteur de périodes (mobile).</li><li>Le formulaire peut être réduit / agrandi.</li></ul>` },
  { title: "❓ Dépannage — problèmes courants", content: `<ul class="space-y-2 list-none"><li>🔄 <strong>Notes absentes</strong> → rechargez (F5).</li><li>📊 <strong>Graphique vide</strong> → cochez une matière + « Mettre à jour ».</li><li>📥 <strong>Import échoue</strong> → vérifiez le format .json Noteo.</li><li>🧮 <strong>Moyenne incorrecte</strong> → vérifiez les coefficients.</li><li>🔢 <strong>PIN refusé</strong> → numérique uniquement, vérifiez Verr. Maj.</li><li>💨 <strong>App lente</strong> → désactivez le flou et les blobs.</li><li>💾 <strong>Données disparues</strong> → cache vidé, exportez régulièrement.</li><li>📱 <strong>Affichage cassé</strong> → activez le mode mobile.</li></ul>` }
];

let currentHelpArticleIndex = null;
let tutorialSteps = [];
let tutorialCurrentStep = 0;

function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || "";
}

function renderHelpCards(query) {
  const q = (query || "").trim().toLowerCase();
  const container = document.getElementById("help-items");
  if (!container) return;
  container.innerHTML = "";
  let visible = 0;
  helpArticles.forEach((article, i) => {
    const match = !q || article.title.toLowerCase().includes(q) || stripHtml(article.content).toLowerCase().includes(q);
    if (!match) return;
    visible++;
    const card = document.createElement("div");
    card.className = "help-card help-item";
    card.setAttribute("onclick", "openHelpDetail(" + i + ")");
    card.innerHTML = '<span>' + article.title + '</span><svg class="w-4 h-4 flex-shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>';
    container.appendChild(card);
  });
  const noResults = document.getElementById("help-no-results");
  if (noResults) noResults.classList.toggle("hidden", visible > 0);
}

function openHelpDetail(index) {
  playSound("click");
  document.getElementById("help-modal").classList.remove("open");
  currentHelpArticleIndex = index;
  const article = helpArticles[index];
  if (!article) return;
  document.getElementById("help-detail-title").textContent = article.title;
  document.getElementById("help-detail-body").innerHTML = article.content;
  const tutoBtn = document.getElementById("help-detail-tuto-btn");
  if (tutoBtn) tutoBtn.classList.toggle("hidden", !article.tutorial);
  document.getElementById("help-detail-modal").classList.add("open");
}

function closeHelpDetail() {
  playSound("click");
  document.getElementById("help-detail-modal").classList.remove("open");
  document.getElementById("help-modal").classList.add("open");
}

/* ===== Interactive Tutorial Engine ===== */
function startTutorial() {
  const article = helpArticles[currentHelpArticleIndex];
  if (!article || !article.tutorial) return;
  playSound("click");
  document.getElementById("help-detail-modal").classList.remove("open");
  document.body.classList.remove("modal-open");
  tutorialSteps = article.tutorial;
  tutorialCurrentStep = 0;
  const overlay = document.getElementById("tuto-overlay");
  overlay.classList.remove("hidden");
  window.addEventListener("resize", onTutoResize);
  showTutoStep();
}

function onTutoResize() {
  if (tutorialCurrentStep >= tutorialSteps.length) return;
  const step = tutorialSteps[tutorialCurrentStep];
  const el = step && document.querySelector(step.selector);
  if (el) positionTutoElements(el);
}

function ensureTutoTabVisible(selector) {
  const chartsSelectors = ["#btn-charts", "#chart-subject-selector", "#chart-type-selector", "#charts-grid"];
  const notesSelectors = ["#btn-notes", "#subject-name", "#calc-top", "#calc-bot", "#calc-form", "#selected-color-preview", "#grades-container", "#sort-menu-btn"];
  if (chartsSelectors.includes(selector)) {
    document.getElementById("tab-notes").classList.add("hidden");
    document.getElementById("tab-charts").classList.remove("hidden");
    document.getElementById("btn-notes").classList.remove("active");
    document.getElementById("btn-charts").classList.add("active");
  } else if (notesSelectors.includes(selector)) {
    document.getElementById("tab-charts").classList.add("hidden");
    document.getElementById("tab-notes").classList.remove("hidden");
    document.getElementById("btn-charts").classList.remove("active");
    document.getElementById("btn-notes").classList.add("active");
  }
}

function showTutoStep() {
  if (tutorialCurrentStep >= tutorialSteps.length) { closeTutorial(); return; }
  const step = tutorialSteps[tutorialCurrentStep];
  ensureTutoTabVisible(step.selector);
  const el = document.querySelector(step.selector);
  const hole = document.getElementById("tuto-hole");
  const arrow = document.getElementById("tuto-arrow");
  const tooltip = document.getElementById("tuto-tooltip");
  const text = document.getElementById("tuto-text");
  const counter = document.getElementById("tuto-counter");
  const nextBtn = document.getElementById("tuto-next-btn");

  text.textContent = step.text;
  counter.textContent = (tutorialCurrentStep + 1) + " / " + tutorialSteps.length;
  nextBtn.textContent = tutorialCurrentStep === tutorialSteps.length - 1 ? "Terminer" : "Suivant";

  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => positionTutoElements(el), 350);
  } else {
    hole.setAttribute("width", "0");
    hole.setAttribute("height", "0");
    arrow.style.display = "none";
    tooltip.style.top = "50%";
    tooltip.style.left = "50%";
    tooltip.style.transform = "translate(-50%, -50%)";
  }
}

function positionTutoElements(el) {
  const rect = el.getBoundingClientRect();
  const pad = 8;
  const hole = document.getElementById("tuto-hole");
  const arrow = document.getElementById("tuto-arrow");
  const tooltip = document.getElementById("tuto-tooltip");

  hole.setAttribute("x", rect.left - pad);
  hole.setAttribute("y", rect.top - pad);
  hole.setAttribute("width", rect.width + pad * 2);
  hole.setAttribute("height", rect.height + pad * 2);

  const arrowW = 48, arrowH = 48;
  const cx = rect.left + rect.width / 2;
  arrow.style.display = "block";
  arrow.style.left = (cx - arrowW / 2) + "px";
  arrow.style.top = (rect.top - arrowH - 8) + "px";

  tooltip.style.transform = "";
  const ttWidth = 300;
  let ttLeft = cx - ttWidth / 2;
  if (ttLeft < 12) ttLeft = 12;
  if (ttLeft + ttWidth > window.innerWidth - 12) ttLeft = window.innerWidth - 12 - ttWidth;
  tooltip.style.left = ttLeft + "px";

  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow > 120) {
    tooltip.style.top = (rect.bottom + pad + 12) + "px";
    arrow.style.top = (rect.top - arrowH - 8) + "px";
    arrow.querySelector("svg").style.transform = "";
  } else {
    tooltip.style.top = (rect.top - 100) + "px";
    arrow.style.top = (rect.bottom + 8) + "px";
    arrow.querySelector("svg").style.transform = "rotate(180deg)";
  }
}

function nextTutoStep() {
  playSound("click");
  tutorialCurrentStep++;
  if (tutorialCurrentStep >= tutorialSteps.length) {
    closeTutorial();
  } else {
    showTutoStep();
  }
}

function closeTutorial(silent) {
  if (!silent) playSound("click");
  document.getElementById("tuto-overlay").classList.add("hidden");
  window.removeEventListener("resize", onTutoResize);
  tutorialSteps = [];
  tutorialCurrentStep = 0;
}

function openLegalModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("legal-modal").classList.add("open");
}

function openAverageInfoModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("average-info-modal").classList.add("open");
}

function openOpenSourceModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("open-source-modal").classList.add("open");
}

function openDuplicateSubjectModal(data) {
  pendingSubjectData = data;
  document.getElementById("duplicate-subject-name").textContent = data.name;
  const modal = document.getElementById("duplicate-subject-modal");
  modal.classList.add("open");
  document.body.classList.add("modal-open");
  playSound("swoosh");
}

function openSettings() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  updateSettingsUI(); // Update simple values
  switchSettingsTab("profile"); // Set initial tab and render its content
  document.getElementById("settings-modal").classList.add("open");
}

function updateThemeButtonsUI() {
  document
    .querySelectorAll('button[id^="theme-btn-"]')
    .forEach((btn) =>
      btn.classList.remove("bg-indigo-500", "text-white", "shadow"),
    );
  const activeThemeBtn = document.getElementById(
    `theme-btn-${appSettings.theme}`,
  );
  if (activeThemeBtn)
    activeThemeBtn.classList.add("bg-indigo-500", "text-white", "shadow");
}

function updateSettingsUI() {
  if (!user) return;
  // --- Profile Tab ---
  // This is simple, so we can keep it here.
  // The heavy lists are moved to dedicated render functions.
  document.getElementById("settings-prenom").value = user.prenom;
  document.getElementById("settings-nom").value = user.nom;

  // --- Settings Toggles ---
  document
    .querySelectorAll('.settings-tab-btn[id^="theme-btn-"]')
    .forEach((btn) =>
      btn.classList.remove("bg-indigo-500", "text-white", "shadow"),
    );
  const activeThemeBtn = document.getElementById(
    `theme-btn-${appSettings.theme}`,
  );
  if (activeThemeBtn)
    activeThemeBtn.classList.add("bg-indigo-500", "text-white", "shadow");
  updateThemeButtonsUI();

  // Set all toggles based on appSettings
  document.getElementById("sound-toggle").checked = appSettings.sounds;
  document.getElementById("setting-soundVolume").value =
    appSettings.soundVolume;
  document.getElementById("setting-fixedNav").checked = appSettings.fixedNav;
  document.getElementById("setting-zenMode").checked = appSettings.zenMode;
  document.getElementById("setting-showAvatar").checked =
    appSettings.showAvatar;
  document.getElementById("setting-animations").checked =
    appSettings.animations;
  document.getElementById("setting-blur").checked = appSettings.blur;
  document.getElementById("setting-blobs").checked = appSettings.blobs;
  document.getElementById("setting-hideAddSubject").checked =
    appSettings.hideAddSubject;
  document.getElementById("setting-confirmDelete").checked =
    appSettings.confirmDelete;
  document.getElementById("setting-showNoteDate").checked =
    appSettings.showNoteDate;
  document.getElementById("setting-highContrast").checked =
    appSettings.highContrast;
  document.getElementById("setting-reduceMotion").checked =
    appSettings.reduceMotion;
  document.getElementById("setting-dyslexicFont").checked =
    appSettings.dyslexicFont;
  document.getElementById("setting-periodType").value =
    user.periodType || "semesters";
  const defaultSortEl = document.getElementById("setting-defaultSort");
  if (defaultSortEl) defaultSortEl.value = appSettings.defaultSort;

  // Sort Toggle UI removed from settings (handled in main UI)
  const sortContainer = document.getElementById("sort-order-container");
  if (sortContainer) sortContainer.classList.add("hidden");
  updateSortButtonUI();

  // Moyenne générale manuelle (Override)
  const manualAvgInput = document.getElementById(
    "manual-general-average-input",
  );
  if (manualAvgInput) {
    const override =
      appSettings.manualGeneralAverage !== null &&
      !isNaN(parseFloat(appSettings.manualGeneralAverage))
        ? parseFloat(appSettings.manualGeneralAverage)
        : "";
    manualAvgInput.value = override !== "" ? override.toFixed(2) : "";
  }

  // --- PIN Management ---
  const pinArea = document.getElementById("pin-management-area");
  if (user.authSecret || user.hashedPin) {
    pinArea.innerHTML = `
                    <p class="text-sm text-[var(--text-muted)]">Ce compte est protégé par un code PIN.</p>
                    <div class="flex gap-2 pt-2">
                        <button onclick="changeProtection()" class="px-4 py-2 rounded-xl bg-indigo-600/10 text-indigo-500 font-bold hover:bg-indigo-600/20 transition-all">Changer la protection</button>
                        <button onclick="removeProtection()" class="px-4 py-2 rounded-xl bg-rose-600/10 text-rose-500 font-bold hover:bg-rose-600/20 transition-all">Supprimer la protection</button>
                    </div>
                `;
  } else {
    pinArea.innerHTML = `
                    <p class="text-sm text-[var(--text-muted)]">Protégez ce compte avec un code PIN à 4, 6 ou 8 chiffres.</p>
                    <button onclick="openAuthSetup()" class="mt-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all">Définir une protection</button>
                `;
  }
}

function closeModals() {
  playSound("click");
  if (DOM_CACHE.modalOverlays) {
    DOM_CACHE.modalOverlays.forEach((m) => m.classList.remove("open"));
  } else {
    document
      .querySelectorAll(".modal-overlay")
      .forEach((m) => m.classList.remove("open"));
  }
  document.body.classList.remove("modal-open");
  if (fullscreenChart) {
    fullscreenChart.destroy();
    fullscreenChart = null;
    currentFullscreenChartInfo = { chartId: null, chartType: null };
  }
  const tutoOverlay = document.getElementById("tuto-overlay");
  if (tutoOverlay && !tutoOverlay.classList.contains("hidden")) {
    closeTutorial(true);
  }
}

// --- Close modals by clicking outside modal-content (on the overlay backdrop) ---
document.addEventListener("click", function (e) {
  // Only handle direct clicks on a modal-overlay (the backdrop), not on its children
  if (!e.target.classList.contains("modal-overlay")) return;
  if (!e.target.classList.contains("open")) return;
  // Never close pin-modal by clicking outside (security-sensitive)
  if (e.target.id === "pin-modal") return;
  // Never close recovery-modal by clicking outside
  if (e.target.id === "recovery-modal") return;
  closeModals();
});

function switchSettingsTab(tabName) {
  playSound("click");
  document
    .querySelectorAll(".settings-tab-content")
    .forEach((c) => c.classList.add("hidden"));
  document
    .getElementById(`settings-tab-content-${tabName}`)
    .classList.remove("hidden");
  document
    .querySelectorAll(".settings-tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .getElementById(`settings-tab-btn-${tabName}`)
    ?.classList.add("active");

  // Render heavy content only when tab is switched to
  if (tabName === "data") renderSettingsDataList();
  if (tabName === "accounts") renderSettingsAccountsList();
}

function renderSettingsDataList() {
  const notesList = document.getElementById("settings-notes-list");
  notesList.innerHTML = "";
  if (subjects.length === 0) {
    notesList.innerHTML =
      '<p class="text-sm text-[var(--text-muted)]">Aucune note à modifier pour le moment.</p>';
    return;
  }

  const computedGeneralAverage =
    subjects.reduce((sum, s) => sum + s.avg, 0) / subjects.length;
  const overrideAvg =
    appSettings.manualGeneralAverage !== null &&
    !isNaN(parseFloat(appSettings.manualGeneralAverage))
      ? parseFloat(appSettings.manualGeneralAverage)
      : null;
  const displayedGeneralAverage =
    overrideAvg !== null ? overrideAvg : computedGeneralAverage;

  notesList.innerHTML = `
                <div class="p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)] space-y-3">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <h4 class="font-bold text-[var(--text-main)]">Moyenne générale</h4>
                            <p class="text-xs text-[var(--text-muted)]">La moyenne générale est calculée sans coefficients, donc elle peut différer de celle affichée sur Pronote. Vous pouvez la modifier manuellement ici.</p>
                        </div>
                        <button onclick="openAverageInfoModal()" class="text-sm font-bold text-indigo-500 hover:underline">?</button>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                        <input id="manual-general-average-input" type="number" step="0.01" min="0" max="20" value="${displayedGeneralAverage.toFixed(2)}" oninput="updateManualGeneralAverage(this.value)" class="w-full sm:w-52 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-body)] text-[var(--text-main)]">
                        <button onclick="resetManualGeneralAverage()" class="mt-2 sm:mt-0 w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-400 transition-all">Réinitialiser</button>
                    </div>
                </div>
            `;

  // Tags management UI
  const allTags = getAllTags();
  const tagOverviewHtml = `
                <div class="mt-4 p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)]">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-bold text-[var(--text-main)]">Gérer les tags</h4>
                        <button onclick="addGlobalTagPrompt()" class="px-3 py-1 rounded-lg bg-indigo-500 text-white text-sm font-bold">Ajouter un tag</button>
                    </div>
                    <div id="tags-overview" class="space-y-2">
                        ${allTags.length ? allTags.map((t) => `<div class="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-body)] border border-[var(--border)]"><div class="flex items-center gap-3"><input type="color" value="${appSettings.tagColors?.[t] || "#6366f1"}" onchange="setTagColor('${t}', this.value)" class="w-8 h-8 rounded-lg border-0"><span class="font-bold">${t}</span><span class="text-xs text-[var(--text-muted)]">(${subjects.filter((s) => Array.isArray(s.tags) && s.tags.includes(t)).length})</span></div><div><button onclick="deleteTag('${t}')" class="px-2 py-1 rounded-lg text-rose-500 border border-rose-200 text-sm">Supprimer</button></div></div>`).join("") : '<p class="text-sm text-[var(--text-muted)]">Aucun tag défini.</p>'}
                    </div>
                </div>
            `;
  notesList.insertAdjacentHTML("beforeend", tagOverviewHtml);

  // Tri des matières dans l'édition rapide (même logique que l'affichage principal)
  const sortedSubjects = [...subjects];
  switch (appSettings.defaultSort) {
    case "average":
      sortedSubjects.sort((a, b) =>
        appSettings.sortOrder === "asc" ? a.avg - b.avg : b.avg - a.avg,
      );
      break;
    case "alpha":
      sortedSubjects.sort((a, b) =>
        appSettings.sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name),
      );
      break;
    case "noteCount":
      sortedSubjects.sort((a, b) =>
        appSettings.sortOrder === "asc"
          ? a.history.length - b.history.length
          : b.history.length - a.history.length,
      );
      break;
    case "date":
    default:
      sortedSubjects.sort((a, b) =>
        appSettings.sortOrder === "asc" ? a.id - b.id : b.id - a.id,
      );
      break;
  }

  sortedSubjects.forEach((sub) => {
    const subDiv = document.createElement("div");
    subDiv.className =
      "bg-[var(--input-bg)] rounded-2xl border border-[var(--border)] overflow-hidden";
    let inner = `<div class="p-4 font-black flex flex-col md:flex-row md:items-center justify-between items-start gap-2" style="background-color: ${hex2rgba(sub.color, 0.1)};">
                                <div class="flex items-center gap-3 w-full md:w-auto">
                                    <input type="color" value="${sub.color}" onchange="changeSubjectColor(${sub.id}, this.value)" class="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent">
                                    <span class="flex-grow font-bold" style="color:${sub.color}">${sub.name}</span>
                                </div>
                                <div class="w-full md:w-auto mt-3 md:mt-0 flex items-center gap-3">
                                    <input type="text" value="${Array.isArray(sub.tags) ? sub.tags.join(", ") : ""}" onchange="updateSubjectTags(${sub.id}, this.value)" placeholder="Tags (séparés par des virgules)" class="px-3 py-2 rounded-xl border border-[var(--border)] w-full md:w-64 bg-[var(--bg-body)]">
                                    <span class="text-xs bg-white/50 px-2 py-1 rounded-lg" style="color:${sub.color}">${sub.history.length} notes</span>
                                </div>
                             </div><div class="p-2 space-y-1">`;
    sub.history.forEach((n) => {
      inner += `
                        <div class="flex justify-between items-center p-2 hover:bg-[var(--bg-card)] rounded-xl group transition-all text-left">
                            <span class="font-bold text-sm flex-grow">
                                ${n.name ? `<span class="block text-xs text-indigo-500 mb-0.5">${n.name}</span>` : ""}
                                ${n.display}${n.coef && n.coef !== 1 ? ` <span class="font-bold text-xs text-[var(--text-muted)]">x${n.coef}</span>` : ""} 
                                <span class="text-[10px] text-[var(--text-muted)] ml-2 ${appSettings.showNoteDate ? "" : "hidden"}">${n.date}</span>
                            </span>
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="editNote(${sub.id}, ${n.id})" class="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-md"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button><button onclick="deleteSpecificNote(${sub.id}, ${n.id})" class="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-md"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                            </div>
                        </div>`;
    });
    inner += `</div>`;
    subDiv.innerHTML = inner;
    notesList.appendChild(subDiv);
  });
}

function renderSettingsAccountsList() {
  const accList = document.getElementById("settings-accounts-list");
  accList.innerHTML = "";
  const sessions = Object.keys(localStorage)
    .filter((k) => k.startsWith("noteo_profile_"))
    .map((k) => JSON.parse(localStorage.getItem(k)));
  sessions.forEach((s) => {
    const div = document.createElement("div");
    div.className =
      "flex items-center justify-between p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)]";
    div.innerHTML = `
                    <span class="font-bold">${s.prenom} ${s.nom}</span>
                    <div class="flex gap-2">
                        <button onclick="deleteAccount('${s.id}')" class="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                `;
    accList.appendChild(div);
  });
}

// Tag management helpers
function addGlobalTagPrompt() {
  const tag = prompt("Entrez le nom du nouveau tag :");
  if (!tag) return;
  const t = tag.trim();
  // ensure tagColors entry
  appSettings.tagColors = appSettings.tagColors || {};
  if (!appSettings.tagColors[t]) appSettings.tagColors[t] = "#6366f1";
  // Assign to no subjects by default
  markTagCacheDirty();
  scheduleSaveSettings();
  renderSettingsDataList();
}

function setTagColor(tag, color) {
  if (!tag) return;
  appSettings.tagColors = appSettings.tagColors || {};
  appSettings.tagColors[tag] = color;
  scheduleSaveSettings();
  scheduleRenderGrades();
  renderSettingsDataList();
}

function deleteTag(tag) {
  if (!confirm(`Supprimer le tag "${tag}" de toutes les matières ?`)) return;
  // remove tag mapping
  if (appSettings.tagColors) delete appSettings.tagColors[tag];
  // remove tag from all subjects
  subjects.forEach((s) => {
    if (Array.isArray(s.tags)) s.tags = s.tags.filter((t) => t !== tag);
  });
  markTagCacheDirty();
  scheduleSave();
  scheduleSaveSettings();
  scheduleRenderGrades();
  renderSettingsDataList();
  playSound("delete");
}

function updateSubjectTags(subjectId, value) {
  const sub = subjects.find((s) => s.id === subjectId);
  if (!sub) return;
  const tags = value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  sub.tags = Array.from(new Set(tags));
  // ensure tagColors entries exist for new tags
  appSettings.tagColors = appSettings.tagColors || {};
  sub.tags.forEach((t) => {
    if (!appSettings.tagColors[t]) appSettings.tagColors[t] = "#6366f1";
  });
  markTagCacheDirty();
  scheduleSave();
  scheduleSaveSettings();
  scheduleRenderGrades();
  renderSettingsDataList();
  playSound("success");
}

async function submitPin() {
  const { mode, currentPin, targetUser, onSuccess } = pinState;

  if (mode === "set") {
    pinState.firstPin = currentPin;
    openPinModal("confirm", targetUser);
    return;
  }

  if (mode === "confirm") {
    if (currentPin === pinState.firstPin) {
      targetUser.authSecret = await hashPin(currentPin);
      targetUser.authType = `pin${pinState.length}`;
      if (pinState.recoveryEmail) {
        targetUser.recoveryEmail = pinState.recoveryEmail;
      } else {
        delete targetUser.recoveryEmail;
      }
      localStorage.setItem(
        `noteo_profile_${targetUser.id}`,
        JSON.stringify(targetUser),
      );
      if (user && user.id === targetUser.id) {
        user.authSecret = targetUser.authSecret;
        user.authType = targetUser.authType;
      }
      playSound("success");
      closePinModal();
      updateSettingsUI();
    } else {
      playSound("error");
      alert("Les codes PIN ne correspondent pas. Veuillez réessayer.");
      openPinModal("set", targetUser);
    }
    return;
  }

  // For 'check' and 'verify' modes
  const hashedPin = await hashPin(currentPin);
  if (hashedPin === (targetUser.authSecret || targetUser.hashedPin)) {
    playSound("success");

    if (document.getElementById("skip-pin-checkbox").checked) {
      const fifteenMinutes = 15 * 60 * 1000;
      const expiry = Date.now() + fifteenMinutes;
      localStorage.setItem(
        `noteo_pin_unlock_expiry_${targetUser.id}`,
        JSON.stringify(expiry),
      );
    }

    closePinModal();
    if (onSuccess) {
      setTimeout(onSuccess, 100);
    }
  } else {
    playSound("error");
    document
      .querySelector("#pin-modal .modal-content")
      .classList.add("animate-shake");
    setTimeout(
      () =>
        document
          .querySelector("#pin-modal .modal-content")
          .classList.remove("animate-shake"),
      500,
    );
    pinState.currentPin = "";
    updatePinDisplay();
  }
}

// --- GESTION DES PARAMETRES ---
document.getElementById("profile-form").onsubmit = (e) => {
  e.preventDefault();
  user.prenom = document.getElementById("settings-prenom").value;
  user.nom = document.getElementById("settings-nom").value;
  saveUserProfile();
  showApp();
  playSound("success");
};

function openAuthSetup() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("recovery-email-input").value =
    user.recoveryEmail || "";
  document.getElementById("auth-setup-modal").classList.add("open");
}

function setupProtection(type) {
  closeModals();
  const recoveryEmail = document
    .getElementById("recovery-email-input")
    .value.trim();
  if (type.startsWith("pin")) {
    const length = parseInt(type.replace("pin", ""));
    setTimeout(
      () =>
        openPinModal("set", user, {
          length,
          recoveryEmail,
          onSuccess: () => {},
        }),
      300,
    );
  }
}

function changeProtection() {
  const verificationSuccess = () => {
    setTimeout(openAuthSetup, 300);
  };
  openPinModal("verify", user, { onSuccess: verificationSuccess });
}

function removeProtection() {
  const removalAction = () => {
    if (confirm("Voulez-vous vraiment supprimer le code PIN de ce compte ?")) {
      delete user.authSecret;
      delete user.authType;
      delete user.hashedPin; // For old profiles
      delete user.recoveryEmail;
      localStorage.setItem(`noteo_profile_${user.id}`, JSON.stringify(user));
      playSound("delete");
      updateSettingsUI();
    }
  };
  if (user.authSecret || user.hashedPin) {
    openPinModal("verify", user, { onSuccess: removalAction });
  }
}

function deleteAccount(id) {
  if (
    !appSettings.confirmDelete ||
    confirm("Supprimer ce compte et toutes ses notes ?")
  ) {
    localStorage.removeItem(`noteo_profile_${id}`);
    localStorage.removeItem(`noteo_v8_data_${id}`);
    playSound("delete");
    if (user.id === id) logout();
    else updateSettingsUI();
  }
}

function deleteSpecificNote(subId, noteId) {
  const sub = subjects.find((s) => s.id === subId);
  if (sub) {
    sub.history = sub.history.filter((n) => n.id !== noteId);
    if (sub.history.length === 0) {
      subjects = subjects.filter((s) => s.id !== subId);
    } else {
      recalculateSubjectAverage(sub);
    }
    scheduleSave();
    scheduleRenderGrades();
    playSound("delete");
    const dataTab = document.getElementById("settings-tab-content-data");
    if (!dataTab.classList.contains("hidden")) {
      renderSettingsDataList();
    }
  }
}

function changeSubjectColor(subId, newColor) {
  const sub = subjects.find((s) => s.id === subId);
  if (sub) {
    sub.color = newColor;
    scheduleSave();
    scheduleRenderGrades();
    updateDynamicStyles();
  }
  playSound("click");
}

function editNote(subId, noteId) {
  const sub = subjects.find((s) => s.id === subId);
  const note = sub.history.find((n) => n.id === noteId);
  if (note) {
    const currentCoef = note.coef || 1;
    const currentDisplay = `${note.display}${currentCoef !== 1 ? "x" + currentCoef : ""}`;
    const newVal = prompt(
      `Modifier la note (${currentDisplay}).\nFormat: note/bareme ou note/baremexCOEF.\nVous pouvez aussi ajouter un nom ex: "DS Maths: 15/20"`,
      `${note.name ? note.name + ": " : ""}${currentDisplay}`,
    );

    if (newVal) {
      let fullNoteString = newVal.trim();
      let notePart = fullNoteString;
      let newCoef = 1;

      // Try to parse name if present
      if (newVal.includes(":")) {
        const splitName = newVal.split(":");
        note.name = splitName[0].trim();
        notePart = splitName[1].trim();
      } else {
        // If no colon, clear the name
        note.name = "";
      }

      // Now parse coefficient from the remaining notePart
      if (notePart.toLowerCase().includes("x")) {
        const parts = notePart.toLowerCase().split("x");
        notePart = parts[0].trim();
        newCoef = parseFloat(parts[1].replace(",", ".")) || 1;
      }

      if (notePart.includes("/")) {
        const parts = notePart.split("/");
        const n = parseFloat(parts[0].replace(",", "."));
        const b = parseFloat(parts[1].replace(",", "."));
        if (!isNaN(n) && !isNaN(b)) {
          note.val = (n / b) * 20;
          note.display = `${n}/${b}`;
          note.coef = newCoef;

          recalculateSubjectAverage(sub);

          save();
          renderGrades();
          playSound("success");
          const dataTab = document.getElementById("settings-tab-content-data");
          if (!dataTab.classList.contains("hidden")) {
            renderSettingsDataList();
          }
        }
      }
    }
  }
}

function saveUserProfile() {
  if (!user) return;
  localStorage.setItem(`noteo_profile_${user.id}`, JSON.stringify(user));
  // Also update the active user in localStorage if it exists
  const activeUser = JSON.parse(localStorage.getItem("noteo_v8_active"));
  if (activeUser && activeUser.id === user.id) {
    localStorage.setItem("noteo_v8_active", JSON.stringify(user));
  }
}

function addNewAccountFromSelection() {
  playSound("click");
  document.getElementById("user-selection-screen").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  updateLoginSessions();
}

function addNewAccount() {
  playSound("click");
  closeModals();
  const dash = document.getElementById("dashboard-screen");
  if (!dash.classList.contains("hidden")) dash.classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  updateLoginSessions();
}
function logout() {
  if (confirm("Se déconnecter ?")) {
    playSound("delete");
    const profiles = Object.keys(localStorage)
      .filter((k) => k.startsWith("noteo_profile_"))
      .map((k) => JSON.parse(localStorage.getItem(k)));

    localStorage.removeItem("noteo_v8_active");
    localStorage.removeItem("noteo_stay_logged_in");
    user = null;
    subjects = [];
    academicData = {};

    document.getElementById("dashboard-screen").classList.add("hidden");
    document.getElementById("login-screen").classList.add("hidden");
    document.getElementById("user-selection-screen").classList.add("hidden");

    if (profiles.length > 0) {
      showUserSelectionScreen(profiles);
    } else {
      document.getElementById("login-screen").classList.remove("hidden");
      updateLoginSessions();
    }
  }
}

// --- USER MENU ---
function toggleUserMenu(e) {
  e.stopPropagation();
  playSound("click");
  document.getElementById("user-menu").classList.toggle("show");
}

// --- THEME & SETTINGS ---
function loadSettings() {
  const saved = JSON.parse(localStorage.getItem("noteo_v9_settings"));
  appSettings = { ...defaultSettings, ...saved };
}
function saveSettings() {
  localStorage.setItem("noteo_v9_settings", JSON.stringify(appSettings));
}

// --- Performance helpers: debounced saves and render batching ---
function debounce(fn, wait) {
  let t = null;
  return function (...args) {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn.apply(this, args);
    }, wait);
  };
}

const scheduleSave = debounce(() => save(), 200);
const scheduleSaveSettings = debounce(() => saveSettings(), 200);
// Use rAF-based scheduling for renders to align with paint and avoid setTimeout churn
let _renderRaf = null;
function scheduleRenderGrades() {
  if (_renderRaf) cancelAnimationFrame(_renderRaf);
  _renderRaf = requestAnimationFrame(() => {
    _renderRaf = null;
    renderGrades();
  });
}

// DOM cache and tag memoization
const DOM_CACHE = {};
const _mediaQueryLg = window.matchMedia("(min-width: 1024px)");
const _mediaQueryMd = window.matchMedia("(min-width: 768px)");
function cacheDom() {
  DOM_CACHE.gradesContainer = document.getElementById("grades-container");
  DOM_CACHE.gradesActions = document.getElementById("grades-actions");
  DOM_CACHE.sortMenu = document.getElementById("sort-menu");
  DOM_CACHE.sortMenuBtn = document.getElementById("sort-menu-btn");
  DOM_CACHE.dropdownMenus = document.querySelectorAll(".dropdown-menu");
  DOM_CACHE.modalOverlays = document.querySelectorAll(".modal-overlay");
  DOM_CACHE.tabCharts = document.getElementById("tab-charts");
  DOM_CACHE.chartsGrid = document.getElementById("charts-grid");
  DOM_CACHE.moyenneGen = document.getElementById("moyenne-gen");
  DOM_CACHE.mainCard = document.getElementById("main-card");
}

// Tag cache to avoid recomputing tags repeatedly during sorting/rendering
const tagCache = { version: 0, tags: [] };
function markTagCacheDirty() {
  tagCache.version++;
}

function toggleSortOrder() {
  const newOrder = appSettings.sortOrder === "asc" ? "desc" : "asc";
  updateSetting("sortOrder", newOrder);
  updateSortButtonUI();
  playSound("click");
}

function updateSortButtonUI() {
  const btn = document.getElementById("sort-order-btn");
  if (!btn) return;
  const label = btn.querySelector("span");
  const icon = btn.querySelector("svg");
  if (appSettings.sortOrder === "asc") {
    label.textContent = "Croissant";
    icon.innerHTML =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>';
  } else {
    label.textContent = "Décroissant";
    icon.innerHTML =
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>';
  }
  // Mini UI in the sort menu
  const mini = document.getElementById("sort-order-btn-mini");
  if (mini) {
    const miniLabel = mini.querySelector("span");
    const miniIcon = mini.querySelector("svg");
    if (appSettings.sortOrder === "asc") {
      miniLabel.textContent = "Croissant";
      miniIcon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>';
    } else {
      miniLabel.textContent = "Décroissant";
      miniIcon.innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>';
    }
  }
  // Update main sort button label/icon
  const labelMain = document.getElementById("sort-menu-btn-label");
  const iconMain = document.getElementById("sort-menu-btn-icon");
  const current =
    sortOptions.find((o) => o.value === appSettings.defaultSort) ||
    sortOptions[0];
  if (labelMain) labelMain.textContent = current ? current.label : "Trier";
  if (iconMain && current) iconMain.innerHTML = current.icon;
}

function toggleSortMenu(e) {
  e.stopPropagation();
  playSound("swoosh");
  const menu = DOM_CACHE.sortMenu || document.getElementById("sort-menu");
  if (!menu) return;
  const showing = menu.style.display === "block";
  const dropdowns =
    DOM_CACHE.dropdownMenus || document.querySelectorAll(".dropdown-menu");
  dropdowns.forEach((m) => {
    if (m !== menu) m.classList.remove("show");
    m.style.display = "none";
  });
  if (!showing) {
    renderSortMenu();
    menu.style.display = "block";
    setTimeout(() => menu.classList.add("show"), 10);
  } else {
    menu.classList.remove("show");
    setTimeout(() => (menu.style.display = "none"), 200);
  }
}

function renderSortMenu() {
  const list = document.getElementById("sort-options-list");
  if (!list) return;
  list.innerHTML = "";
  sortOptions.forEach((opt) => {
    if (opt.value === "customTag" && getAllTags().length === 0) return; // don't show Tag option when no tags exist
    const btn = document.createElement("button");
    btn.className =
      "w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--input-bg)] flex items-center gap-3";
    btn.dataset.value = opt.value;
    btn.innerHTML = `<svg class="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">${opt.icon}</svg><span class="font-bold">${opt.label}</span>`;
    if (appSettings.defaultSort === opt.value)
      btn.classList.add("bg-indigo-500/10", "text-indigo-600");
    btn.onclick = (ev) => {
      ev.stopPropagation();
      setSortCriterion(opt.value);
      document.getElementById("sort-menu").classList.remove("show");
      setTimeout(
        () => (document.getElementById("sort-menu").style.display = "none"),
        200,
      );
    };
    list.appendChild(btn);
  });
}

function getAllTags() {
  // Use cached value when possible
  const currentVersion = subjects
    .map((s) => (Array.isArray(s.tags) ? s.tags.join("|") : ""))
    .join("||");
  if (tagCache._lastVersion === currentVersion && tagCache.tags.length)
    return tagCache.tags;
  const all = new Set();
  subjects.forEach((s) => {
    if (Array.isArray(s.tags))
      s.tags.forEach((t) => {
        const tt = (t || "").toString().trim();
        if (tt) all.add(tt);
      });
  });
  tagCache.tags = Array.from(all);
  tagCache._lastVersion = currentVersion;
  return tagCache.tags;
}

function setSortCriterion(value) {
  updateSetting("defaultSort", value);
  updateSortButtonUI();
  renderGrades();
  playSound("click");
}

function requestReload() {
  if (appSettings.autoReload) {
    window.location.reload();
  } else {
    document.getElementById("reload-modal").classList.add("open");
  }
}

function updateSetting(key, value) {
  // Gestion spéciale pour le type de période qui modifie les données utilisateur
  if (key === "periodType" && user) {
    if (user.periodType === value) return; // Pas de changement

    let confirmMsg = `Changer l'organisation de l'année mettra à jour vos périodes.`;
    if (value === "semesters" && academicData.semesters.length > 2) {
      confirmMsg += `\n\nATTENTION : Vous passez à 2 semestres. La 3ème période sera SUPPRIMÉE ainsi que toutes les notes qu'elle contient.`;
    } else if (value === "trimesters" && academicData.semesters.length < 3) {
      confirmMsg += `\n\nUne 3ème période sera ajoutée automatiquement.`;
    }
    confirmMsg += `\n\nVoulez-vous continuer ?`;

    if (confirm(confirmMsg)) {
      const oldPeriodType =
        user.periodType || (value === "semesters" ? "trimesters" : "semesters");
      user.periodType = value;

      const oldPeriodName =
        oldPeriodType === "trimesters" ? "Trimestre" : "Semestre";
      const newPeriodName = value === "trimesters" ? "Trimestre" : "Semestre";

      // 1. Rename existing periods
      academicData.semesters.forEach((semester) => {
        const regex = new RegExp(oldPeriodName, "i");
        if (semester.name.match(regex)) {
          semester.name = semester.name.replace(regex, newPeriodName);
        }
      });

      // 2. Adjust number of periods (2 for semesters, 3 for trimesters)
      if (value === "semesters" && academicData.semesters.length > 2) {
        academicData.semesters = academicData.semesters.slice(0, 2);
        // If current semester was deleted (e.g. we were on the 3rd one), switch to the first
        if (
          !academicData.semesters.find(
            (s) => s.id === academicData.currentSemesterId,
          )
        ) {
          academicData.currentSemesterId = academicData.semesters[0].id;
          switchSemester(academicData.semesters[0].id); // Handles UI refresh
        }
      } else if (value === "trimesters") {
        while (academicData.semesters.length < 3) {
          const newId = Date.now() + academicData.semesters.length;
          academicData.semesters.push({
            id: newId,
            name: `${newPeriodName} ${academicData.semesters.length + 1}`,
            subjects: [],
          });
        }
      }

      scheduleSave(); // Save academicData changes (debounced)
      saveUserProfile(); // Save user profile change
      requestReload(); // Ask for reload to ensure clean state
      playSound("success");
    } else {
      // L'utilisateur a annulé, on remet la valeur précédente dans le select
      document.getElementById("setting-periodType").value = user.periodType;
    }
    return; // Ce n'est pas un paramètre d'application standard, on s'arrête ici.
  }

  // Logique originale pour les autres paramètres
  appSettings[key] = value;
  applySetting(key, value);
  saveSettings();
}

function applySetting(key, value) {
  const bodyClassList = document.body.classList;
  switch (key) {
    case "theme":
      applyTheme();
      break;
    case "zenMode":
      bodyClassList.toggle("zen-mode", value);
      break;
    case "fixedNav":
      bodyClassList.toggle("fixed-nav", value);
      break;
    case "showAvatar":
      document.getElementById("user-avatar").style.display = value
        ? "block"
        : "none";
      break;
    case "animations":
      bodyClassList.toggle("no-animations", !value);
      break;
    case "blur":
      bodyClassList.toggle("no-blur", !value);
      break;
    case "blobs":
      document.querySelector(".blobs-container").style.display = value
        ? "block"
        : "none";
      break;
    case "hideAddSubject":
      document.getElementById("main-card").style.display = value
        ? "none"
        : "block";
      break;
    case "highContrast":
      bodyClassList.toggle("high-contrast", value);
      break;
    case "reduceMotion":
      bodyClassList.toggle("no-animations", value);
      break; // Alias for animations
    case "dyslexicFont":
      bodyClassList.toggle("dyslexic-font", value);
      break;
    case "showNoteDate":
      renderGrades();
      break;
    case "defaultSort":
    case "sortOrder":
    case "manualGeneralAverage":
      renderGrades();
      updateSettingsUI();
      break;
  }
}

function updateManualGeneralAverage(value) {
  const parsed = parseFloat(value);
  if (value === "" || isNaN(parsed)) {
    updateSetting("manualGeneralAverage", null);
  } else {
    updateSetting("manualGeneralAverage", Math.min(20, Math.max(0, parsed)));
  }
}

function resetManualGeneralAverage() {
  updateSetting("manualGeneralAverage", null);
}

function applyAllSettings() {
  // Apply all settings on load
  Object.keys(appSettings).forEach((key) => {
    // Theme is applied separately
    if (key !== "theme") applySetting(key, appSettings[key]);
  });
  applyTheme();
}

function setThemePreference(pref) {
  updateSetting("theme", pref);
  updateThemeButtonsUI();
}

function applyTheme() {
  let applyDark = appSettings.theme === "dark";
  if (appSettings.theme === "system") {
    applyDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.body.classList.toggle("dark-theme", applyDark);
  document.body.classList.toggle("light-mode", !applyDark);
  isDark = applyDark;
  if (!document.getElementById("tab-charts").classList.contains("hidden"))
    switchTab("charts"); // Re-render charts with new theme
}
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", applyTheme);

function cycleTheme() {
  playSound("click");
  // isDark reflects the current visual state (light/dark), even with 'system' theme
  const nextTheme = isDark ? "light" : "dark";
  setThemePreference(nextTheme);
}

function toggleSounds(enabled) {
  updateSetting("sounds", enabled);
}

// --- DATA MANAGEMENT ---
function openExportModal() {
  playSound("swoosh");
  const list = document.getElementById("export-semester-list");
  list.innerHTML = academicData.semesters
    .map(
      (s) => `
                <label class="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--input-bg)] cursor-pointer border border-transparent">
                    <input type="checkbox" data-semester-id="${s.id}" class="export-semester-checkbox styled-checkbox" checked>
                    <span class="font-bold text-sm">${s.name}</span>
                </label>
            `,
    )
    .join("");
  document.getElementById("export-semester-modal").classList.add("open");
}

function performSelectiveExport() {
  const selectedIds = [
    ...document.querySelectorAll(".export-semester-checkbox:checked"),
  ].map((cb) => Number(cb.dataset.semesterId));
  if (selectedIds.length === 0) {
    playSound("error");
    alert("Veuillez sélectionner au moins une période à exporter.");
    return;
  }

  const selectedSemesters = academicData.semesters.filter((s) =>
    selectedIds.includes(s.id),
  );
  const dataToExport = {
    academicData: {
      semesters: selectedSemesters,
      currentSemesterId: selectedIds.includes(academicData.currentSemesterId)
        ? academicData.currentSemesterId
        : selectedIds[0],
    },
  };

  const dataStr = JSON.stringify(dataToExport, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `noteo_export_${user.id}_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  playSound("success");
  closeModals();
}

function exportFullAccount() {
  if (
    !appSettings.confirmDelete ||
    confirm(
      "Exporter une sauvegarde complète de ce compte ?\nLe fichier contiendra votre profil, toutes vos notes sur toutes les périodes, ainsi que vos paramètres d'application actuels.",
    )
  ) {
    const fullBackup = {
      profile: user,
      academicData: academicData,
      settings: appSettings,
    };
    const dataStr = JSON.stringify(fullBackup, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noteo_sauvegarde_compte_${user.id}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSound("success");
  }
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      // 1. Check for Full Account Backup format
      if (data.profile && data.academicData && data.settings) {
        if (
          confirm(
            `Importer la sauvegarde complète du compte pour ${data.profile.prenom} ?\n\nATTENTION : Ceci remplacera le profil existant (s'il a le même nom), ses notes, et écrasera les paramètres actuels de l'application.`,
          )
        ) {
          localStorage.setItem(
            `noteo_profile_${data.profile.id}`,
            JSON.stringify(data.profile),
          );
          localStorage.setItem(
            `noteo_v8_data_${data.profile.id}`,
            JSON.stringify(data.academicData),
          );
          appSettings = data.settings;
          saveSettings();
          applyAllSettings();
          alert(
            "Importation réussie. Vous allez être connecté au compte importé.",
          );
          setTimeout(() => loginAs(data.profile), 300);
        }
      }
      // 2. Check for New (multi-semester) format
      else if (data.academicData && data.academicData.semesters) {
        if (
          confirm(
            `Importer les données de périodes pour ${user.prenom} ?\nLes données actuelles de cet utilisateur seront écrasées par le contenu du fichier.`,
          )
        ) {
          academicData = data.academicData;
          const currentSemester =
            academicData.semesters.find(
              (s) => s.id === academicData.currentSemesterId,
            ) || academicData.semesters[0];
          subjects = currentSemester.subjects;
          scheduleSave();
          scheduleRenderGrades();
          updateSemesterUI();
          playSound("success");
        }
      }
      // 3. Check for Old (single semester) format
      else if (data.subjects && Array.isArray(data.subjects)) {
        if (
          confirm(
            `Importer les données (ancien format) pour ${user.prenom} ?\nLes données actuelles de la période active seront écrasées.`,
          )
        ) {
          const initialId = Date.now();
          const currentSemester = academicData.semesters.find(
            (s) => s.id === academicData.currentSemesterId,
          );
          if (currentSemester) {
            currentSemester.subjects = data.subjects;
            subjects = currentSemester.subjects;
          }
          scheduleSave();
          scheduleRenderGrades();
          updateSemesterUI();
          playSound("success");
        }
      } else {
        throw new Error("Format de fichier non reconnu.");
      }
    } catch (err) {
      playSound("error");
      alert("Erreur lors de l'importation : " + err.message);
    }
    event.target.value = ""; // Reset file input
  };
  reader.readAsText(file);
}

function encodeCloudPayload(payload) {
  try {
    const json = JSON.stringify(payload);
    return btoa(encodeURIComponent(json));
  } catch (e) {
    console.warn("Cloud encode error", e);
    return null;
  }
}

function decodeCloudPayload(payload) {
  try {
    const json = decodeURIComponent(atob(payload));
    return JSON.parse(json);
  } catch (e) {
    console.warn("Cloud decode error", e);
    return null;
  }
}

function generateCloudLink() {
  if (!user) return;

  // First try to get existing cloud link
  let url = getCloudLink();
  if (!url) {
    // Generate new link if none exists
    updateCloudLink();
    url = getCloudLink();
  }

  if (!url) {
    showToast("Impossible de générer le lien Cloud.", "error");
    return;
  }

  const output = document.getElementById("cloud-link-output");
  if (output) {
    output.value = url;
    output.classList.remove("hidden");
    output.select();
    try {
      navigator.clipboard.writeText(url);
      showToast("✓ Lien copié", "success");
    } catch (e) {
      showToast("Impossible de copier le lien", "error");
    }
  }
}

function importCloudLinkPrompt() {
  const raw = prompt(
    "Collez le lien de synchronisation Cloud (ou uniquement le code 'cloud=...') :",
  );
  if (!raw) return;
  let cloud = raw.trim();
  try {
    const url = new URL(raw);
    cloud = url.searchParams.get("cloud") || cloud;
  } catch (e) {
    // Not a URL, use as-is
  }
  if (!cloud) {
    showToast("Le lien Cloud est invalide.", "error");
    return;
  }
  importCloudData(cloud);
}

function importCloudData(cloudPayload) {
  const payload = decodeCloudPayload(cloudPayload);
  if (!payload || !payload.profile) {
    showToast(
      "Impossible d'importer les données Cloud. Format invalide.",
      "error",
    );
    return;
  }

  const proceed = confirm(
    `Importer les données depuis le Cloud pour ${payload.profile.prenom} ${payload.profile.nom} ? Cela écrasera les données actuelles de l'utilisateur.`,
  );
  if (!proceed) return;

  // Persist profile and data
  localStorage.setItem(
    `noteo_profile_${payload.profile.id}`,
    JSON.stringify(payload.profile),
  );
  localStorage.setItem(
    `noteo_v8_data_${payload.profile.id}`,
    JSON.stringify(payload.academicData),
  );
  appSettings = payload.settings || appSettings;
  saveSettings();
  applyAllSettings();

  showToast("✓ Données importées", "success");
  setTimeout(() => window.location.reload(), 300);
}

function updateCloudLink() {
  if (!user) return;

  const payload = {
    profile: user,
    academicData,
    settings: appSettings,
    timestamp: Date.now(),
  };

  const encoded = encodeCloudPayload(payload);
  if (!encoded) return;

  const url = `${window.location.origin}${window.location.pathname}?cloud=${encoded}`;

  // Store the updated cloud link
  localStorage.setItem(`noteo_cloud_link_${user.id}`, url);

  // If this is the first time, show a notification
  const existingLink = localStorage.getItem(`noteo_cloud_link_${user.id}`);
  if (!existingLink) {
    showToast("✓ Lien Cloud généré automatiquement", "success");
  }
}

function getCloudLink() {
  if (!user) return null;
  return localStorage.getItem(`noteo_cloud_link_${user.id}`);
}

function checkCloudImportFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const cloud = params.get("cloud");
  if (!cloud) return;

  const payload = decodeCloudPayload(cloud);
  if (!payload || !payload.profile) return;

  // Check if this cloud data belongs to current user
  if (user && user.id === payload.profile.id) {
    // Auto-sync for same user
    history.replaceState(null, "", window.location.pathname);
    syncCloudData(cloud);
    return;
  }

  // Ask for import for different user
  history.replaceState(null, "", window.location.pathname);
  if (
    confirm(
      "Un lien Cloud a été détecté dans l'URL. Voulez-vous importer ces données ?",
    )
  ) {
    importCloudData(cloud);
  }
}

function syncCloudData(cloudPayload) {
  const payload = decodeCloudPayload(cloudPayload);
  if (!payload || !payload.profile) {
    showToast("Données Cloud corrompues", "error");
    return;
  }

  // Update local data with cloud data
  localStorage.setItem(
    `noteo_profile_${payload.profile.id}`,
    JSON.stringify(payload.profile),
  );
  localStorage.setItem(
    `noteo_v8_data_${payload.profile.id}`,
    JSON.stringify(payload.academicData),
  );

  if (payload.settings) {
    appSettings = { ...appSettings, ...payload.settings };
    saveSettings();
    applyAllSettings();
  }

  showToast("✓ Données synchronisées depuis le Cloud", "success");

  // Reload to apply changes
  setTimeout(() => window.location.reload(), 500);
}

function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.style.animation = "slideInToast 0.3s ease-out forwards";

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOutToast 0.3s ease-out forwards";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

function hideToast(toastEl) {
  if (toastEl) {
    toastEl.style.animation = "slideOutToast 0.3s ease-out forwards";
    setTimeout(() => {
      toastEl.remove();
    }, 300);
  }
}

function clearCurrentUserNotes() {
  if (
    !appSettings.confirmDelete ||
    confirm(
      "Voulez-vous vraiment supprimer toutes les notes pour la période actuelle ? Cette action est irréversible.",
    )
  ) {
    subjects = [];
    scheduleSave();
    scheduleRenderGrades();
    playSound("delete");
    updateSettingsUI();
  }
}

function deleteAllData() {
  if (
    !appSettings.confirmDelete ||
    confirm(
      "ATTENTION : Voulez-vous vraiment supprimer TOUS les comptes et TOUTES les données de l'application ?",
    )
  ) {
    localStorage.clear();
    logout();
  }
}

// --- CALCULATIONS & RENDER ---
function loadUserData() {
  // If cloud mode is active and we have a mirrored cloud store, try to load from it.
  if (user.storageMode === "cloud" && user.cloudId) {
    try {
      const cloudRaw = localStorage.getItem(`noteo_cloud_${user.cloudId}`);
      if (cloudRaw) {
        const cloudData = JSON.parse(cloudRaw);
        if (cloudData && cloudData.academicData) {
          academicData = cloudData.academicData;
          subjects = academicData.semesters.find(
            (s) => s.id === academicData.currentSemesterId,
          )?.subjects;
          return;
        }
      }
    } catch (e) {
      console.warn("Erreur lors du chargement des données Cloud", e);
    }
  }

  const data = localStorage.getItem(`noteo_v8_data_${user.id}`);
  let parsedData = data ? JSON.parse(data) : null;

  // Backward compatibility: if data is an array, it's the old format
  if (Array.isArray(parsedData)) {
    const initialId = Date.now();
    academicData = {
      semesters: [{ id: initialId, name: "Semestre 1", subjects: parsedData }],
      currentSemesterId: initialId,
    };
    save(); // Immediately save in new format
  } else if (
    parsedData &&
    parsedData.semesters &&
    parsedData.semesters.length > 0
  ) {
    academicData = parsedData;
  } else {
    const periodCount = user && user.periodType === "trimesters" ? 3 : 2;
    const periodTypeName =
      user && user.periodType === "trimesters" ? "Trimestre" : "Semestre";
    const initialSemesters = [];
    const firstId = Date.now();

    for (let i = 0; i < periodCount; i++) {
      initialSemesters.push({
        id: firstId + i,
        name: `${periodTypeName} ${i + 1}`,
        subjects: [],
      });
    }

    academicData = { semesters: initialSemesters, currentSemesterId: firstId };
  }

  // Ensure currentSemesterId is valid
  let currentSemester = academicData.semesters.find(
    (s) => s.id === academicData.currentSemesterId,
  );
  if (!currentSemester) {
    currentSemester = academicData.semesters[0];
    academicData.currentSemesterId = currentSemester
      ? currentSemester.id
      : null;
  }

  // If there are no semesters at all (edge case from corrupted data)
  if (!currentSemester) {
    const initialId = Date.now();
    const periodTypeName =
      user && user.periodType === "trimesters" ? "Trimestre" : "Semestre";
    currentSemester = {
      id: initialId,
      name: `${periodTypeName} 1`,
      subjects: [],
    };
    academicData.semesters = [currentSemester];
    academicData.currentSemesterId = initialId;
  }

  subjects = currentSemester.subjects;
}

let _saveTimer = null;
function save() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(_saveNow, 80);
}
function _saveNow() {
  _saveTimer = null;
  const semesterIndex = academicData.semesters.findIndex(
    (s) => s.id === academicData.currentSemesterId,
  );
  if (semesterIndex > -1) {
    academicData.semesters[semesterIndex].subjects = subjects;
  }
  localStorage.setItem(
    `noteo_v8_data_${user.id}`,
    JSON.stringify(academicData),
  );

  // Cloud backup mirror (local, pour partage via lien)
  if (user.storageMode === "cloud" && user.cloudId) {
    localStorage.setItem(
      `noteo_cloud_${user.cloudId}`,
      JSON.stringify({
        profile: user,
        academicData,
        settings: appSettings,
        timestamp: Date.now(),
      }),
    );
  }

  // Auto-update cloud link for all users (not just cloud mode)
  updateCloudLink();
}

function recalculateSubjectAverage(sub) {
  if (!sub || !sub.history) return;

  let totalPoints = 0;
  let totalMaxPoints = 0;
  sub.history.forEach((note) => {
    const displayParts = note.display.split("/");
    if (displayParts.length === 2) {
      const n = parseFloat(displayParts[0].replace(",", "."));
      const b = parseFloat(displayParts[1].replace(",", "."));
      const c = note.coef || 1;
      if (!isNaN(n) && !isNaN(b)) {
        totalPoints += n * c;
        totalMaxPoints += b * c;
      }
    }
  });
  sub.avg = totalMaxPoints > 0 ? (totalPoints / totalMaxPoints) * 20 : 0;
}

document.getElementById("calc-form").onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById("subject-name").value.trim();
  const topRaw = document.getElementById("calc-top").value.trim();
  const botRaw = document.getElementById("calc-bot").value.trim();
  let finalColor = selectedColor;

  const data = { name, finalColor, topRaw, botRaw };
  const existingSubject = subjects.find(
    (s) => s.name.toLowerCase() === name.toLowerCase(),
  );

  if (existingSubject) {
    openDuplicateSubjectModal(data);
  } else {
    processSubjectAddition(data, "create");
  }
};

function processSubjectAddition(data, mode) {
  const { name, finalColor, topRaw, botRaw } = data;
  try {
    const topParts = topRaw.split("+");
    const botParts = botRaw.split("+");

    let sub;
    if (mode === "create") {
      sub = { id: Date.now(), name, color: finalColor, history: [], tags: [] };
      subjects.push(sub);
    } else {
      // mode === 'update'
      sub = subjects.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (!sub) {
        // Fallback
        sub = {
          id: Date.now(),
          name,
          color: finalColor,
          history: [],
          tags: [],
        };
        subjects.push(sub);
      } else {
        sub.color = finalColor; // Update color on existing
      }
    }

    let addedCount = 0;
    topParts.forEach((part, i) => {
      let noteVal = part.trim();
      let originalNotePart = noteVal; // Keep original for display if needed
      let coef = 1;
      if (noteVal.toLowerCase().includes("x")) {
        const split = noteVal.toLowerCase().split("x");
        noteVal = split[0];
        coef = safeEval(split[1]) || 1;
      }
      const n = safeEval(noteVal);
      const b = safeEval(botParts[i] || botParts[0] || "20");

      if (!isNaN(n) && !isNaN(b) && b !== 0) {
        const norm = (n / b) * 20;
        sub.history.push({
          id: Math.random(),
          val: norm,
          coef: coef,
          display: `${n}/${b}`,
          name: "",
          date: new Date().toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
          }),
        });
        addedCount++;
      }
    });
    if (addedCount > 0) {
      recalculateSubjectAverage(sub);
      scheduleSave();
      scheduleRenderGrades();
      playSound("success");
      document.getElementById("calc-form").reset();
      document.getElementById("calc-top").focus();
    } else {
      throw new Error("Aucune note valide n'a été ajoutée.");
    }
  } catch (err) {
    playSound("error");
    console.error("Erreur dans processSubjectAddition:", err);
  }
  pendingSubjectData = null;
}

// Close sort menu when clicking outside
document.addEventListener("click", (e) => {
  const menu = DOM_CACHE.sortMenu || document.getElementById("sort-menu");
  if (!menu) return;
  if (menu.classList.contains("show")) {
    // If click is inside the menu or the button, ignore
    const btn =
      DOM_CACHE.sortMenuBtn || document.getElementById("sort-menu-btn");
    if (btn && (btn.contains(e.target) || menu.contains(e.target))) return;
    menu.classList.remove("show");
    setTimeout(() => {
      menu.style.display = "none";
    }, 200);
  }
});

function renderGrades() {
  try {
    if (!DOM_CACHE.gradesContainer || !DOM_CACHE.gradesActions) cacheDom();

    const cont = DOM_CACHE.gradesContainer;
    const actions = DOM_CACHE.gradesActions;

    if (!cont) {
      console.error("renderGrades: #grades-container introuvable");
      return;
    }

    cont.innerHTML = "";
    cont.className = "flex items-start gap-8";

    // Configuration des colonnes (Masonry JS)
    const isLg = _mediaQueryLg.matches;
    const isMd = _mediaQueryMd.matches;
    const colCount = isLg ? 3 : isMd ? 2 : 1;
    const cols = [];
    const frag = document.createDocumentFragment();

    for (let i = 0; i < colCount; i++) {
      const col = document.createElement("div");
      col.className = "flex-1 w-full space-y-8 flex flex-col";
      cols.push(col);
      frag.appendChild(col);
    }

    if (subjects.length === 0) {
      if (actions) actions.classList.add("hidden");
      return;
    }
    if (actions) actions.classList.remove("hidden");

    const genTotal = subjects.reduce((sum, s) => sum + s.avg, 0);
    const computedGeneralAverage =
      subjects.length > 0 ? genTotal / subjects.length : 0;
    const overrideAvg =
      appSettings.manualGeneralAverage !== null &&
      !isNaN(parseFloat(appSettings.manualGeneralAverage))
        ? parseFloat(appSettings.manualGeneralAverage)
        : null;
    const generalAverage =
      overrideAvg !== null ? overrideAvg : computedGeneralAverage;

    const generalAverageSubject = {
      id: "general",
      name: "Moyenne Générale",
      color: "#f59e0b", // Amber/Gold for general average (Positive/Eye-catching)
      avg: generalAverage,
      history: subjects
        .map((s) => ({
          id: s.id,
          val: s.avg,
          display: s.name,
          color: s.color,
        }))
        .sort((a, b) => b.val - a.val),
    };

    let sortedSubjects = [...subjects];
    // If sorting by Tag: group by tag frequency (most-common tags first), subjects without tags at the bottom
    if (appSettings.defaultSort === "customTag") {
      const allTags = getAllTags();
      if (allTags.length === 0) {
        // fallback to date
        sortedSubjects.sort((a, b) =>
          appSettings.sortOrder === "asc" ? a.id - b.id : b.id - a.id,
        );
      } else {
        // count occurrences (use trimmed tag keys to avoid mismatch)
        const counts = {};
        allTags.forEach((t) => (counts[t] = 0));
        subjects.forEach((s) => {
          if (Array.isArray(s.tags))
            s.tags.forEach((t) => {
              const tt = (t || "").toString().trim();
              if (tt) counts[tt] = (counts[tt] || 0) + 1;
            });
        });
        // sort tags by frequency
        const tagsSorted = Object.keys(counts).sort((a, b) =>
          appSettings.sortOrder === "asc"
            ? counts[a] - counts[b]
            : counts[b] - counts[a],
        );
        const added = new Set();
        const grouped = [];
        tagsSorted.forEach((tag) => {
          const tagKey = tag.toString().trim();
          // collect subjects with this tag (compare trimmed)
          const group = subjects.filter(
            (s) =>
              Array.isArray(s.tags) &&
              s.tags.map((x) => (x || "").toString().trim()).includes(tagKey) &&
              !added.has(s.id),
          );
          // sort within group by number of tags (more tags first) then name
          group.sort((a, b) => {
            const diff = (b.tags?.length || 0) - (a.tags?.length || 0);
            if (diff !== 0) return diff;
            return a.name.localeCompare(b.name);
          });
          group.forEach((s) => {
            added.add(s.id);
            grouped.push(s);
          });
        });
        // then append those without tags
        subjects.forEach((s) => {
          if (!added.has(s.id)) grouped.push(s);
        });
        sortedSubjects = grouped;
      }
    } else {
      switch (appSettings.defaultSort) {
        case "average":
          sortedSubjects.sort((a, b) =>
            appSettings.sortOrder === "asc" ? a.avg - b.avg : b.avg - a.avg,
          );
          break;
        case "alpha":
          sortedSubjects.sort((a, b) =>
            appSettings.sortOrder === "asc"
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name),
          );
          break;
        case "noteCount":
          sortedSubjects.sort((a, b) =>
            appSettings.sortOrder === "asc"
              ? a.history.length - b.history.length
              : b.history.length - a.history.length,
          );
          break;
        case "date":
        default:
          sortedSubjects.sort((a, b) => {
            // Fallback logic for date if ID is timestamp-based
            return appSettings.sortOrder === "asc" ? a.id - b.id : b.id - a.id;
          });
          break;
      }
    }

    const allSubjectsToRender = [generalAverageSubject, ...sortedSubjects];

    const fragment = document.createDocumentFragment();

    function getDisplayColorForSubject(sub) {
      if (!sub) return null;
      if (Array.isArray(sub.tags) && sub.tags.length) {
        // choose first tag with assigned color
        for (const t of sub.tags) {
          const c = appSettings.tagColors?.[t];
          if (c) return c;
        }
      }
      return sub.color || null;
    }

    allSubjectsToRender.forEach((s, idx) => {
      const displayColor = getDisplayColorForSubject(s) || s.color || "#6366f1";
      const bgColor = hex2rgba(displayColor, 0.1);

      const card = document.createElement("div");
      card.className = "glass-card p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] animate-entrance w-full";

      let historyHtml;
      if (s.id === "general") {
        historyHtml = s.history
          .map((n) => {
            const subjectBgColor = hex2rgba(n.color, 0.1);
            return `<div class="flex justify-between items-center p-3 bg-[var(--input-bg)] rounded-xl text-sm border border-[var(--border)]">
                                    <span class="font-bold text-[var(--text-main)] flex-grow">${n.display}</span>
                                    <span class="font-black px-2 py-0.5 rounded-md text-xs" style="background:${subjectBgColor}; color:${n.color}">${n.val.toFixed(2)}</span>
                                </div>`;
          })
          .join("");
      } else {
        historyHtml = s.history
          .map((n) => {
            const colorClassName = s.color
              ? `hover-border-${s.color.substring(1)}`
              : "";
            const coefDisplay =
              n.coef && n.coef !== 1
                ? `<span class="font-bold text-[var(--text-muted)] text-xs ml-2">x${n.coef}</span>`
                : "";
            return `<div class="flex justify-between items-center p-3 bg-[var(--input-bg)] rounded-xl text-sm border border-[var(--border)] hover:scale-[1.02] transition-all ${colorClassName}">
                                    ${appSettings.showNoteDate ? `<span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider min-w-[3rem]">${n.date}</span>` : ""}
                                    <div class="flex items-center gap-3">
                                        <div class="flex flex-col items-end flex-grow text-right">
                                            <span class="font-bold text-[var(--text-main)]">${n.display}${coefDisplay}</span>
                                            ${n.name ? `<span class="text-[10px] text-[var(--text-muted)] italic max-w-[150px] truncate">${n.name}</span>` : ""}
                                        </div>
                                        <span class="font-black px-2 py-0.5 rounded-md text-xs" style="background:${bgColor}; color:${s.color}">${n.val.toFixed(1)}/20</span>
                                    </div>
                                </div>`;
          })
          .reverse()
          .join("");
      }

      card.innerHTML = `
                    <div class="flex items-start justify-between mb-4 z-10 relative">
                        <div class="flex items-center gap-3 sm:gap-4 cursor-pointer flex-grow group" onclick="toggleAcc('${s.id}')">
                            <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" style="background:${displayColor}; box-shadow: 0 4px 15px ${hex2rgba(displayColor, 0.4)}">${s.id === "general" ? "G" : s.name[0].toUpperCase()}</div>
                            <div class="min-w-0">
                                <h4 class="text-base sm:text-lg font-black text-[var(--text-main)] leading-tight truncate">${s.name}</h4>
                                <p class="text-xs font-bold text-[var(--text-muted)] flex items-center gap-2 mt-1">
                                    <span style="color:${displayColor}">${s.history.length}</span> ${s.id === "general" ? "matières" : "notes"}
                                    <svg class="w-3 h-3 transition-transform duration-300" id="icon-${s.id}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </p>
                                ${Array.isArray(s.tags) && s.tags.length ? `<div class="mt-2 flex items-center gap-2">${s.tags.map((t) => `<span class="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[var(--input-bg)] border border-[var(--border)]" style="color:${appSettings.tagColors?.[t] || displayColor}">${t}</span>`).join("")}</div>` : ""}
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <div class="px-2 sm:px-3 py-1 rounded-xl font-black text-lg sm:text-xl hover:scale-110 transition-transform cursor-default" style="background:${bgColor}; color:${displayColor}">${s.avg.toFixed(2)}</div>
                        </div>
                    </div>
                    <div id="acc-${s.id}" class="history-content">
                        <div class="pt-4 mt-2 border-t border-[var(--border)] space-y-2">
                            ${historyHtml}
                        </div>
                    </div>
                `;
      cols[idx % colCount].appendChild(card);
    });
    cont.appendChild(frag);
    updateDynamicStyles();
    const tabChartsEl = document.getElementById("tab-charts");
    if (tabChartsEl && !tabChartsEl.classList.contains("hidden"))
      renderChartControls();
  } catch (err) {
    console.error("Erreur dans renderGrades:", err);
    const cont = document.getElementById("grades-container");
    if (cont)
      cont.innerHTML = `<div class="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold">Erreur lors du rendu des cartes: ${err.message}</div>`;
  }
}

function toggleAcc(id) {
  playSound("click");
  const content = document.getElementById(`acc-${id}`);
  const icon = document.getElementById(`icon-${id}`);
  if (content.classList.contains("open")) {
    content.classList.remove("open");
    icon.style.transform = "rotate(0deg)";
  } else {
    content.classList.add("open");
    icon.style.transform = "rotate(180deg)";
  }
}

function toggleAllAccordions() {
  playSound("swoosh");
  const allContent = document.querySelectorAll(".history-content");
  // Check if any is closed, if so open all. If all open, close all.
  const anyClosed = Array.from(allContent).some(
    (el) => !el.classList.contains("open"),
  );

  allContent.forEach((el) => {
    const iconId = el.id.replace("acc-", "icon-");
    const icon = document.getElementById(iconId);
    if (anyClosed) {
      el.classList.add("open");
      if (icon) icon.style.transform = "rotate(180deg)";
    } else {
      el.classList.remove("open");
      if (icon) icon.style.transform = "rotate(0deg)";
    }
  });
}

// --- SEMESTER MANAGEMENT ---
function cycleSemester(direction) {
  playSound("click");
  const semesters = academicData.semesters;
  if (semesters.length <= 1) return;

  const currentIndex = semesters.findIndex(
    (s) => s.id === academicData.currentSemesterId,
  );
  let nextIndex = currentIndex + direction;

  if (nextIndex >= semesters.length) {
    nextIndex = 0;
  } else if (nextIndex < 0) {
    nextIndex = semesters.length - 1;
  }

  const nextSemesterId = semesters[nextIndex].id;
  switchSemester(nextSemesterId);
}

function toggleSemesterMenu(e) {
  e.stopPropagation();
  playSound("click");
  const menu = document.getElementById("semester-menu");
  renderSemesterMenu();
  menu.classList.toggle("show");
}

function renderSemesterMenu() {
  const menu = document.getElementById("semester-menu");
  const currentSemesterId = academicData.currentSemesterId;
  menu.innerHTML = `
                <p class="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-2 px-2">Périodes</p>
                <div class="space-y-1 mb-4 max-h-40 overflow-y-auto">
                    ${academicData.semesters
                      .map(
                        (s) => `
                        <button onclick="switchSemester(${s.id})" class="w-full text-left px-3 py-2 text-sm font-bold rounded-xl transition-all flex items-center justify-between ${s.id === currentSemesterId ? "bg-[var(--input-bg)] text-[var(--text-main)]" : "text-[var(--text-muted)] hover:bg-[var(--input-bg)]"}">
                            <span>${s.name}</span>
                            ${s.id === currentSemesterId ? '<svg class="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>' : ""}
                        </button>
                    `,
                      )
                      .join("")}
                </div>
                <div class="mt-2 pt-2 border-t border-[var(--border)] space-y-2">
                    <button onclick="addSemester()" class="w-full text-left px-3 py-2 text-xs font-bold text-[var(--text-main)] hover:bg-[var(--input-bg)] rounded-xl transition-all flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Ajouter une période
                    </button>
                    <button onclick="renameSemester()" class="w-full text-left px-3 py-2 text-xs font-bold text-[var(--text-main)] hover:bg-[var(--input-bg)] rounded-xl transition-all flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Renommer la période active
                    </button>
                    <button onclick="swapSemesterWith()" class="w-full text-left px-3 py-2 text-xs font-bold text-[var(--text-main)] hover:bg-[var(--input-bg)] rounded-xl transition-all flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h10M7 16h10"></path></svg>
                        Intervertir avec une autre période
                    </button>
                    <button onclick="deleteSemester()" class="w-full text-left px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Supprimer la période active
                    </button>
                </div>
            `;
}

function switchSemester(id) {
  academicData.currentSemesterId = id;
  const currentSemester = academicData.semesters.find((s) => s.id === id);
  subjects = currentSemester.subjects;
  save();
  renderGrades();
  applyMainCardState();
  updateSemesterUI();
  document.getElementById("semester-menu").classList.remove("show");
  if (!document.getElementById("tab-charts").classList.contains("hidden")) {
    switchTab("charts");
  }
}

function addSemester() {
  const periodTypeName =
    appSettings.periodType === "trimesters" ? "Trimestre" : "Semestre";
  const defaultName = `${periodTypeName} ${academicData.semesters.length + 1}`;
  const name = prompt("Nom de la nouvelle période :", defaultName);
  if (name) {
    const newSemester = { id: Date.now(), name: name, subjects: [] };
    academicData.semesters.push(newSemester);
    switchSemester(newSemester.id);
    playSound("success");
  }
}

function renameSemester() {
  const currentSemester = academicData.semesters.find(
    (s) => s.id === academicData.currentSemesterId,
  );
  if (currentSemester) {
    const newName = prompt(
      "Nouveau nom pour la période :",
      currentSemester.name,
    );
    if (newName && newName.trim() !== "") {
      currentSemester.name = newName.trim();
      save();
      updateSemesterUI();
      renderSemesterMenu();
      playSound("success");
    }
  }
}

function deleteSemester() {
  if (academicData.semesters.length <= 1) {
    alert("Vous ne pouvez pas supprimer la dernière période.");
    playSound("error");
    return;
  }
  const currentSemester = academicData.semesters.find(
    (s) => s.id === academicData.currentSemesterId,
  );
  if (
    currentSemester &&
    (!appSettings.confirmDelete ||
      confirm(
        `Voulez-vous vraiment supprimer la période "${currentSemester.name}" et toutes les notes associées ?`,
      ))
  ) {
    academicData.semesters = academicData.semesters.filter(
      (s) => s.id !== academicData.currentSemesterId,
    );
    switchSemester(academicData.semesters[0].id);
    playSound("delete");
  }
}

function swapSemesterWith() {
  if (academicData.semesters.length < 2) {
    alert("Il faut au moins deux périodes pour pouvoir les intervertir.");
    playSound("error");
    return;
  }

  const currentSemester = academicData.semesters.find(
    (s) => s.id === academicData.currentSemesterId,
  );
  const others = academicData.semesters.filter(
    (s) => s.id !== academicData.currentSemesterId,
  );
  const list = others.map((s, i) => `${i + 1}. ${s.name}`).join("\n");
  const choice = prompt(
    `Sélectionnez le numéro de la période à intervertir avec "${currentSemester.name}":\n\n${list}`,
  );
  if (!choice) return;

  const idx = parseInt(choice.trim(), 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= others.length) {
    alert("Choix invalide.");
    playSound("error");
    return;
  }

  const target = others[idx];
  const temp = currentSemester.subjects;
  currentSemester.subjects = target.subjects;
  target.subjects = temp;

  // Ensure the currently active semester data is kept in sync
  subjects = currentSemester.subjects;

  save();
  renderGrades();
  renderSettingsDataList();
  playSound("success");
  alert(
    `Contenu interverti entre "${currentSemester.name}" et "${target.name}".`,
  );
}

function updateSemesterUI() {
  const currentSemester = academicData.semesters.find(
    (s) => s.id === academicData.currentSemesterId,
  );
  if (currentSemester) {
    const semesterNameEl = document.getElementById("current-semester-name");
    if (semesterNameEl) semesterNameEl.textContent = currentSemester.name;
    updateMobileSemesterLabel();
  }
}

function updateMobileSemesterLabel() {
  const el = document.getElementById("mobile-semester-label");
  if (!el) return;
  const currentSemester =
    academicData && Array.isArray(academicData.semesters)
      ? academicData.semesters.find(
          (s) => s.id === academicData.currentSemesterId,
        )
      : null;
  if (currentSemester) {
    el.textContent = currentSemester.name;
  }
}

function initScrollToggleButton() {
  const btn = document.getElementById("scroll-toggle-btn");
  const iconPath = document.getElementById("scroll-toggle-path");
  if (!btn || !iconPath) return;

  const update = () => {
    if (!isPhoneXP) {
      btn.classList.add("hidden");
      return;
    }
    const atTop = window.scrollY < 120;
    btn.classList.remove("hidden");
    if (atTop) {
      iconPath.setAttribute("d", "M5 9l7 7 7-7");
      btn.title = "Aller en bas";
    } else {
      iconPath.setAttribute("d", "M19 15l-7-7-7 7");
      btn.title = "Aller en haut";
    }
  };

  btn.addEventListener("click", () => {
    if (window.scrollY < 120) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  window.addEventListener("scroll", update);
  update();
}

function openPhoneWarningModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("phone-warning-modal").classList.add("open");
}

function dismissPhoneWarning() {
  const checkbox = document.getElementById("dismiss-phone-warning");
  if (checkbox && checkbox.checked) {
    localStorage.setItem("noteo_phone_warning_dismissed", "1");
  }
  closeModals();
}

function maybeShowPhoneWarning() {
  if (!isPhoneXP) return;
  if (localStorage.getItem("noteo_phone_warning_dismissed")) return;
  openPhoneWarningModal();
}

function openSafariWarningModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("safari-warning-modal").classList.add("open");
}

function dismissSafariWarning() {
  localStorage.setItem("noteo_safari_warning_dismissed", "1");
  closeModals();
}

// --- MOBILE MODE MANAGEMENT ---
// REMINDER: Always consider mobile mode when adding new UI elements!
// Check applyMobileMode() and maybeShowMobileModeModal() for mobile-specific behavior

function maybeShowMobileModeModal() {
  if (!document.body.classList.contains("is-mobile")) return;
  if (localStorage.getItem("noteo_mobile_mode_selected")) return;
  openMobileModeModal();
}

function openMobileModeModal() {
  playSound("swoosh");
  document.body.classList.add("modal-open");
  document.getElementById("mobile-mode-modal").classList.add("open");
}

function setMobileMode(mode) {
  localStorage.setItem("noteo_mobile_mode_selected", "1");
  localStorage.setItem("noteo_mobile_mode", mode);
  appSettings.mobileMode = mode;
  // Automatically set hideAddSubject based on mode
  appSettings.hideAddSubject = mode === "view";
  saveSettings();
  applyMobileMode();
  closeModals();
  // Show success message
  showToast(
    "Mode " + (mode === "view" ? "visualisation" : "édition") + " activé",
    "success",
  );
}

function applyMobileMode() {
  const mode = appSettings.mobileMode || "editing";
  const hideAddSubject = appSettings.hideAddSubject || false;
  const mainCard = document.getElementById("main-card");
  const cloudImportSection = document.getElementById("cloud-import-section");

  // Hide main card if in view mode OR if hideAddSubject is enabled
  const shouldHideMainCard = mode === "view" || hideAddSubject;
  if (mainCard) mainCard.style.display = shouldHideMainCard ? "none" : "block";

  // Show cloud import if in view mode and not already filled
  if (
    mode === "view" &&
    cloudImportSection &&
    !localStorage.getItem("noteo_cloud_link")
  ) {
    cloudImportSection.style.display = "block";
  } else if (cloudImportSection) {
    cloudImportSection.style.display = "none";
  }
}

function importCloudAccount() {
  const linkInput = document.getElementById("cloud-link-input");
  const link = linkInput.value.trim();

  if (!link) {
    showToast("Veuillez entrer un lien de partage", "error");
    return;
  }

  // Basic validation - should be a URL
  let cloudCode = null;
  try {
    const url = new URL(link);
    cloudCode = url.searchParams.get("cloud");
    if (!cloudCode) {
      showToast("Le lien ne contient pas de données Cloud valides", "error");
      return;
    }
  } catch (e) {
    showToast("Lien invalide", "error");
    return;
  }

  // Import the cloud data
  const payload = decodeCloudPayload(cloudCode);
  if (!payload || !payload.profile) {
    showToast("Données Cloud invalides", "error");
    return;
  }

  // Store the link for future sync
  localStorage.setItem("noteo_cloud_link", link);

  // Import the data
  importCloudData(cloudCode);

  // Hide the import section
  document.getElementById("cloud-import-section").style.display = "none";
  playSound("click");
  document
    .getElementById("tab-notes")
    .classList.toggle("hidden", tab !== "notes");
  document
    .getElementById("tab-charts")
    .classList.toggle("hidden", tab !== "charts");
  document
    .getElementById("btn-notes")
    .classList.toggle("active", tab === "notes");
  document
    .getElementById("btn-charts")
    .classList.toggle("active", tab === "charts");
  if (tab === "charts") renderChartControls();
}

function switchTab(tab) {
  console.log("Switching to tab:", tab);
  playSound("click");
  document
    .getElementById("tab-notes")
    .classList.toggle("hidden", tab !== "notes");
  document
    .getElementById("tab-charts")
    .classList.toggle("hidden", tab !== "charts");
  document
    .getElementById("btn-notes")
    .classList.toggle("active", tab === "notes");
  document
    .getElementById("btn-charts")
    .classList.toggle("active", tab === "charts");
  if (tab === "charts") renderChartControls();
}

function updateAllCharts() {
  const currentData = getSelectedChartData();
  if (currentData.length === 0) {
    playSound("error");
    alert("Veuillez sélectionner au moins une matière à afficher.");
    return;
  }

  document.querySelectorAll("#charts-grid .glass-card").forEach((wrapper) => {
    const chartType = wrapper.dataset.chartType;
    const canvas = wrapper.querySelector("canvas");
    if (!canvas) return;
    const chartId = canvas.id;
    const chartInstance = chartsInstance[chartId];

    if (chartInstance && chartType) {
      const newChartConfig = getChartConfig(chartType, currentData);
      if (newChartConfig) {
        const finalConfig =
          typeof newChartConfig.config === "function"
            ? newChartConfig.config()
            : newChartConfig.config;
        chartInstance.data = finalConfig.data;
        chartInstance.update();
      }
    }
  });
  playSound("success");
}

// --- NEW CHARTING SYSTEM ---
const chartTypes = [
  // 22 total
  { id: "avgBar", name: "Moyennes par matière (Barres)" },
  { id: "avgLine", name: "Moyennes par matière (Ligne)" },
  { id: "avgRadar", name: "Radar de compétences" },
  { id: "avgPolar", name: "Moyennes (Polaire)" },
  { id: "avgPie", name: "Proportion (Camembert)" },
  { id: "bubble", name: "Vue d'ensemble (Bulles)" },
  { id: "gradeCount", name: "Nombre de notes par matière" },
  { id: "gradeDist", name: "Distribution des notes" },
  { id: "stackedGrades", name: "Répartition des notes (Empilé)" },
  { id: "bestWorst", name: "Meilleures/Pires notes" },
  { id: "highestLowestNote", name: "Notes extrêmes par matière" },
  { id: "subjectEvo", name: "Évolution par matière" },
  { id: "overallEvo", name: "Évolution de la moyenne générale" },
  { id: "notesTimeline", name: "Chronologie des notes" },
  { id: "avgComparison", name: "Moyenne vs Générale" },
  { id: "consistency", name: "Consistance des notes (Écart-type)" },
  { id: "passFailRatio", name: "Taux de réussite (Notes ≥ 10)" },
  { id: "gradeFunnel", name: "Entonnoir de réussite" },
  { id: "coefDistribution", name: "Répartition des coefficients" },
  { id: "coefImpact", name: "Impact des coefficients" },
  { id: "averageByCoef", name: "Moyenne par coefficient" },
  { id: "subjectVsAll", name: "Radar: Matière vs Reste" },
];

function renderChartControls() {
  const subjectSelector = document.getElementById("chart-subject-selector");
  const typeSelector = document.getElementById("chart-type-selector");
  const noDataMsg = document.getElementById("no-charts-msg");
  const grid = document.getElementById("charts-grid");

  if (subjects.length === 0) {
    grid.innerHTML = "";
    noDataMsg.classList.remove("hidden");
    noDataMsg.innerHTML = `<p class="text-[var(--text-muted)] font-bold text-lg">Ajoutez des notes pour générer des analyses.</p>`;
    subjectSelector.innerHTML = "";
    typeSelector.innerHTML = "";
    return;
  }
  noDataMsg.classList.add("hidden");

  subjectSelector.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <button onclick="selectAllChartSubjects(true)" class="text-xs font-bold text-indigo-500">Tout</button>
                    <button onclick="selectAllChartSubjects(false)" class="text-xs font-bold text-indigo-500">Aucun</button>
                </div>
                ${subjects
                  .map(
                    (s) => `
                <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--input-bg)] cursor-pointer">
                    <input type="checkbox" data-subject-id="${s.id}" class="chart-subject-checkbox styled-checkbox" checked>
                    <span class="font-bold text-sm" style="color:${s.color}">${s.name}</span>
                </label>
            `,
                  )
                  .join("")}`;

  typeSelector.innerHTML = chartTypes
    .map(
      (t) =>
        `<button class="chart-type-btn" onclick="addChart('${t.id}')">${t.name}</button>`,
    )
    .join("");
}

function selectAllChartSubjects(select) {
  document
    .querySelectorAll(".chart-subject-checkbox")
    .forEach((cb) => (cb.checked = select));
}

function clearCharts() {
  document.getElementById("charts-grid").innerHTML = "";
  Object.values(chartsInstance).forEach((c) => c.destroy());
  chartsInstance = {};
}

function getSelectedChartData() {
  const selectedIds = [
    ...document.querySelectorAll(".chart-subject-checkbox:checked"),
  ].map((cb) => Number(cb.dataset.subjectId));
  return subjects.filter((s) => selectedIds.includes(s.id));
}

function addChart(type) {
  // Vérification anti-doublon
  const existingChart = document.querySelector(
    `.glass-card[data-chart-type="${type}"]`,
  );
  if (existingChart) {
    existingChart.scrollIntoView({ behavior: "smooth", block: "center" });
    existingChart.classList.add("animate-shake");
    setTimeout(() => existingChart.classList.remove("animate-shake"), 500);
    playSound("error");
    return;
  }

  const data = getSelectedChartData();
  if (data.length === 0) {
    playSound("error");
    alert("Veuillez sélectionner au moins une matière.");
    return;
  }

  const grid = document.getElementById("charts-grid");
  const chartId = `chart-${Date.now()}`;
  const chartConfig = getChartConfig(type, data);

  if (!chartConfig) {
    // Handles cases where a chart is not applicable (e.g. radar with < 2 subjects)
    console.error(
      `Chart type ${type} not found or not applicable for current selection`,
    );
    playSound("error");
    alert(
      `Le graphique "${chartTypes.find((t) => t.id === type)?.name}" ne peut pas être généré avec la sélection actuelle (ex: nécessite au moins 2 matières).`,
    );
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className =
    "glass-card p-6 rounded-[2rem] animate-entrance h-[28rem] flex flex-col";
  wrapper.dataset.chartType = type;
  wrapper.dataset.chartId = chartId;
  wrapper.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-black text-lg text-[var(--text-main)]">${chartConfig.name}</h3>
                    <div class="flex items-center gap-1">
                        <button onclick="openChartFullscreen('${chartId}', '${type}')" title="Plein écran" class="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-full">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"></path></svg>
                        </button>
                        <button onclick="this.closest('.glass-card').remove(); chartsInstance['${chartId}'].destroy(); delete chartsInstance['${chartId}']" title="Supprimer le graphique" class="p-1 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-full">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="flex-grow relative w-full h-full min-h-0">
                    <canvas id="${chartId}"></canvas>
                </div>
            `;
  grid.appendChild(wrapper);

  const ctx = document.getElementById(chartId).getContext("2d");
  const finalConfig =
    typeof chartConfig.config === "function"
      ? chartConfig.config()
      : chartConfig.config;
  chartsInstance[chartId] = new Chart(ctx, finalConfig);
  playSound("swoosh");
}

function openChartFullscreen(chartId, chartType) {
  const data = getSelectedChartData();
  document.body.classList.add("modal-open");
  const chartConfigResult = getChartConfig(chartType, data);
  if (!chartConfigResult) return;

  currentFullscreenChartInfo = { chartId, chartType };

  const modal = document.getElementById("fullscreen-chart-modal");
  const canvas = document.getElementById("fullscreen-chart-canvas");
  const ctx = canvas.getContext("2d");

  if (fullscreenChart) fullscreenChart.destroy();

  const config =
    typeof chartConfigResult.config === "function"
      ? chartConfigResult.config()
      : chartConfigResult.config;

  // Adapt options for fullscreen
  config.options.plugins.legend.display = true;
  config.options.plugins.legend.position = "bottom";

  fullscreenChart = new Chart(ctx, config);
  modal.classList.add("open");
  playSound("swoosh");
}

function navigateFullscreenChart(direction) {
  const grid = document.getElementById("charts-grid");
  const chartCards = Array.from(
    grid.querySelectorAll(".glass-card[data-chart-id]"),
  );
  const currentIndex = chartCards.findIndex(
    (card) => card.dataset.chartId === currentFullscreenChartInfo.chartId,
  );
  if (currentIndex === -1) return;

  let nextIndex =
    (currentIndex + direction + chartCards.length) % chartCards.length;
  const nextCard = chartCards[nextIndex];
  openChartFullscreen(nextCard.dataset.chartId, nextCard.dataset.chartType);
}

function getChartConfig(type, data) {
  const textColor = isDark ? "#f8fafc" : "#0f172a";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const labels = data.map((s) => s.name);
  const averages = data.map((s) => s.avg);
  const colors = data.map((s) => s.color);
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor } } },
    scales: {
      y: {
        min: 0,
        max: 20,
        grid: { color: gridColor },
        ticks: { color: textColor },
      },
      x: { grid: { color: gridColor }, ticks: { color: textColor } },
    },
  };

  const chartConfigs = {
    avgBar: {
      name: "Moyennes par matière (Barres)",
      config: {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Moyenne",
              data: averages,
              backgroundColor: colors.map((c) => hex2rgba(c, 0.7)),
              borderColor: colors,
              borderWidth: 2,
            },
          ],
        },
        options: { ...baseOptions, plugins: { legend: { display: false } } },
      },
    },
    avgLine: {
      name: "Moyennes par matière (Ligne)",
      config: {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Moyenne",
              data: averages,
              borderColor: "#6366f1",
              tension: 0.4,
              fill: true,
              backgroundColor: hex2rgba("#6366f1", 0.1),
            },
          ],
        },
        options: baseOptions,
      },
    },
    avgRadar: {
      name: "Radar de compétences",
      config: {
        type: "radar",
        data: {
          labels,
          datasets: [
            {
              label: "Moyenne",
              data: averages,
              borderColor: "#6366f1",
              backgroundColor: hex2rgba("#6366f1", 0.2),
            },
          ],
        },
        options: {
          ...baseOptions,
          scales: { r: { min: 0, max: 20, pointLabels: { color: textColor } } },
        },
      },
    },
    avgPolar: {
      name: "Moyennes (Polaire)",
      config: {
        type: "polarArea",
        data: {
          labels,
          datasets: [
            {
              label: "Moyenne",
              data: averages,
              backgroundColor: colors.map((c) => hex2rgba(c, 0.7)),
            },
          ],
        },
        options: { ...baseOptions, scales: { r: { min: 0, max: 20 } } },
      },
    },
    avgPie: {
      name: "Proportion (Camembert)",
      config: {
        type: "pie",
        data: {
          labels,
          datasets: [
            {
              data: averages,
              backgroundColor: colors.map((c) => hex2rgba(c, 0.8)),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "top", labels: { color: textColor } },
          },
        },
      },
    },
    gradeCount: {
      name: "Nombre de notes par matière",
      config: {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Nombre de notes",
              data: data.map((s) => s.history.length),
              backgroundColor: colors.map((c) => hex2rgba(c, 0.7)),
            },
          ],
        },
        options: { ...baseOptions, scales: { y: { min: 0, max: undefined } } },
      },
    },
    gradeDist: {
      name: "Distribution des notes",
      config: () => {
        const allNotes = data.flatMap((s) => s.history.map((h) => h.val));
        const ranges = { "0-5": 0, "5-10": 0, "10-15": 0, "15-20": 0 };
        allNotes.forEach((n) => {
          if (n < 5) ranges["0-5"]++;
          else if (n < 10) ranges["5-10"]++;
          else if (n < 15) ranges["10-15"]++;
          else ranges["15-20"]++;
        });
        return {
          type: "bar",
          data: {
            labels: Object.keys(ranges),
            datasets: [
              {
                label: "Nombre de notes",
                data: Object.values(ranges),
                backgroundColor: ["#ef4444", "#f97316", "#eab308", "#22c55e"],
              },
            ],
          },
          options: {
            ...baseOptions,
            scales: { y: { min: 0, max: undefined } },
          },
        };
      },
    },
    bestWorst: {
      name: "Meilleures/Pires notes",
      config: () => {
        // Takes 3 best and 3 worst
        const allNotes = data.flatMap((s) =>
          s.history.map((h) => ({ ...h, subject: s.name, color: s.color })),
        );
        allNotes.sort((a, b) => a.val - b.val);
        const selection = [...allNotes.slice(0, 3), ...allNotes.slice(-3)];
        return {
          type: "bar",
          data: {
            labels: selection.map((n) => `${n.subject}: ${n.display}`),
            datasets: [
              {
                label: "Note /20",
                data: selection.map((n) => n.val),
                backgroundColor: selection.map((n) => n.color),
              },
            ],
          },
          options: { ...baseOptions, indexAxis: "y" },
        };
      },
    },
    subjectEvo: {
      name: "Évolution par matière",
      config: () => ({
        type: "line",
        data: {
          labels: Array.from(
            { length: Math.max(0, ...data.map((s) => s.history.length)) },
            (_, i) => `Note ${i + 1}`,
          ),
          datasets: data.map((s) => ({
            label: s.name,
            data: s.history.map((h) => h.val),
            borderColor: s.color,
            tension: 0.4,
            fill: false,
          })),
        },
        options: baseOptions,
      }),
    },
    overallEvo: {
      name: "Évolution de la moyenne générale",
      config: () => {
        const allNotes = data
          .flatMap((s) =>
            s.history.map((h) => ({
              ...h,
              date: new Date(h.date.split("/").reverse().join("-")),
            })),
          )
          .sort((a, b) => a.date - b.date);
        const evolution = [];
        let sum = 0;
        allNotes.forEach((n, i) => {
          sum += n.val;
          evolution.push(sum / (i + 1));
        });
        return {
          type: "line",
          data: {
            labels: allNotes.map((_, i) => `Note ${i + 1}`),
            datasets: [
              {
                label: "Moyenne générale",
                data: evolution,
                borderColor: "#6366f1",
                tension: 0.4,
                fill: true,
                backgroundColor: hex2rgba("#6366f1", 0.1),
              },
            ],
          },
          options: baseOptions,
        };
      },
    },
    bubble: {
      name: "Vue d'ensemble (Bulles)",
      config: {
        type: "bubble",
        data: {
          datasets: data.map((s) => ({
            label: s.name,
            data: [{ x: s.avg, y: s.history.length, r: s.avg * 1.5 }],
            backgroundColor: hex2rgba(s.color, 0.7),
          })),
        },
        options: {
          ...baseOptions,
          scales: {
            x: { title: { display: true, text: "Moyenne" } },
            y: { title: { display: true, text: "Nombre de notes" } },
          },
        },
      },
    },
    stackedGrades: {
      name: "Répartition des notes (Empilé)",
      config: () => {
        const ranges = { "15-20": [], "10-15": [], "5-10": [], "0-5": [] };
        data.forEach((s) => {
          ranges["15-20"].push(s.history.filter((h) => h.val >= 15).length);
          ranges["10-15"].push(
            s.history.filter((h) => h.val >= 10 && h.val < 15).length,
          );
          ranges["5-10"].push(
            s.history.filter((h) => h.val >= 5 && h.val < 10).length,
          );
          ranges["0-5"].push(s.history.filter((h) => h.val < 5).length);
        });
        return {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "15-20",
                data: ranges["15-20"],
                backgroundColor: "#22c55e",
              },
              {
                label: "10-15",
                data: ranges["10-15"],
                backgroundColor: "#eab308",
              },
              {
                label: "5-10",
                data: ranges["5-10"],
                backgroundColor: "#f97316",
              },
              { label: "0-5", data: ranges["0-5"], backgroundColor: "#ef4444" },
            ],
          },
          options: {
            ...baseOptions,
            scales: {
              x: {
                stacked: true,
                grid: { color: gridColor },
                ticks: { color: textColor },
              },
              y: {
                stacked: true,
                min: 0,
                max: undefined,
                grid: { color: gridColor },
                ticks: { color: textColor },
              },
            },
          },
        };
      },
    },
    // --- 10 NEW CHARTS ---
    avgComparison: {
      name: "Moyenne vs Générale",
      config: () => {
        const generalAverage =
          data.reduce((sum, s) => sum + s.avg, 0) / data.length;
        return {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Moyenne Matière",
                data: averages,
                backgroundColor: colors.map((c) => hex2rgba(c, 0.7)),
              },
              {
                label: "Moyenne Générale",
                data: data.map(() => generalAverage),
                type: "line",
                borderColor: "#f43f5e",
                fill: false,
              },
            ],
          },
          options: baseOptions,
        };
      },
    },
    consistency: {
      name: "Consistance des notes (Écart-type)",
      config: () => {
        const deviations = data.map((s) => stdDev(s.history.map((h) => h.val)));
        return {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Écart-type (plus c'est bas, plus c'est constant)",
                data: deviations,
                backgroundColor: colors.map((c) => hex2rgba(c, 0.7)),
              },
            ],
          },
          options: {
            ...baseOptions,
            scales: {
              y: {
                min: 0,
                max: undefined,
                grid: { color: gridColor },
                ticks: { color: textColor },
              },
            },
          },
        };
      },
    },
    notesTimeline: {
      name: "Chronologie des notes",
      config: () => {
        const allNotes = data
          .flatMap((s) =>
            s.history.map((h) => ({
              x: new Date(
                h.date.split("/")[1] +
                  "/" +
                  h.date.split("/")[0] +
                  "/" +
                  new Date().getFullYear(),
              ),
              y: h.val,
              subject: s.name,
            })),
          )
          .sort((a, b) => a.x - b.x);
        return {
          type: "line",
          data: {
            datasets: data.map((s) => ({
              label: s.name,
              data: allNotes.filter((n) => n.subject === s.name),
              borderColor: s.color,
              tension: 0.4,
              fill: false,
            })),
          },
          options: {
            ...baseOptions,
            scales: {
              x: {
                type: "time",
                time: { unit: "day" },
                grid: { color: gridColor },
                ticks: { color: textColor },
              },
              y: {
                min: 0,
                max: 20,
                grid: { color: gridColor },
                ticks: { color: textColor },
              },
            },
          },
        };
      },
    },
    coefDistribution: {
      name: "Répartition des coefficients",
      config: () => {
        const coefs = data.flatMap((s) => s.history.map((h) => h.coef || 1));
        const coefCounts = coefs.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {});
        return {
          type: "pie",
          data: {
            labels: Object.keys(coefCounts).map((c) => `Coef x${c}`),
            datasets: [
              {
                data: Object.values(coefCounts),
                backgroundColor: [
                  "#6366f1",
                  "#a855f7",
                  "#ec4899",
                  "#f97316",
                  "#22c55e",
                  "#06b6d4",
                ],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "top", labels: { color: textColor } },
            },
          },
        };
      },
    },
    coefImpact: {
      name: "Impact des coefficients",
      config: () => {
        const avgWithCoef = data.map((s) => s.avg);
        const avgWithoutCoef = data.map((s) => {
          const total = s.history.reduce((sum, n) => sum + n.val, 0);
          return s.history.length > 0 ? total / s.history.length : 0;
        });
        return {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Moyenne sans coefs",
                data: avgWithoutCoef,
                backgroundColor: hex2rgba("#94a3b8", 0.7),
              },
              {
                label: "Moyenne avec coefs",
                data: avgWithCoef,
                backgroundColor: colors.map((c) => hex2rgba(c, 0.7)),
              },
            ],
          },
          options: baseOptions,
        };
      },
    },
    gradeFunnel: {
      name: "Entonnoir de réussite",
      config: () => {
        const allNotes = data.flatMap((s) => s.history.map((h) => h.val));
        const ranges = {
          "≥ 16 (Très bien)": allNotes.filter((n) => n >= 16).length,
          "≥ 12 (Bien)": allNotes.filter((n) => n >= 12).length,
          "≥ 10 (Passable)": allNotes.filter((n) => n >= 10).length,
          "< 10 (Échec)": allNotes.filter((n) => n < 10).length,
        };
        return {
          type: "bar",
          data: {
            labels: Object.keys(ranges),
            datasets: [
              {
                label: "Nombre de notes",
                data: Object.values(ranges),
                backgroundColor: ["#10b981", "#22c55e", "#eab308", "#ef4444"],
              },
            ],
          },
          options: {
            ...baseOptions,
            indexAxis: "y",
            scales: {
              y: {
                stacked: true,
                grid: { color: gridColor },
                ticks: { color: textColor },
              },
              x: {
                min: 0,
                max: undefined,
                grid: { color: gridColor },
                ticks: { color: textColor },
              },
            },
          },
        };
      },
    },
    passFailRatio: {
      name: "Taux de réussite (Notes ≥ 10)",
      config: () => {
        const allNotes = data.flatMap((s) => s.history);
        const passed = allNotes.filter((n) => n.val >= 10).length;
        const failed = allNotes.length - passed;
        return {
          type: "doughnut",
          data: {
            labels: ["Réussite (≥10)", "Échec (<10)"],
            datasets: [
              {
                data: [passed, failed],
                backgroundColor: ["#22c55e", "#ef4444"],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "top", labels: { color: textColor } },
            },
          },
        };
      },
    },
    subjectVsAll: {
      name: "Radar: Matière vs Reste",
      config: () => {
        if (data.length < 2) return null;
        const firstSubject = data[0];
        const otherSubjects = data.slice(1);
        const getMetrics = (subjects) => {
          const notes = subjects.flatMap((s) => s.history.map((h) => h.val));
          if (notes.length === 0)
            return { avg: 0, max: 0, min: 0, consistency: 20 };
          const avg =
            subjects.reduce((sum, s) => sum + s.avg, 0) / subjects.length;
          const max = Math.max(...notes);
          const min = Math.min(...notes);
          const consistency = 20 - stdDev(notes);
          return { avg, max, min, consistency };
        };

        typeSelector.innerHTML = chartTypes
          .map(
            (t) =>
              `<button class="chart-type-btn" onclick="addChart('${t.id}')">${t.name}</button>`,
          )
          .join("");

        // If phone experience is active, collapse selectors by default and attach toggles to headers
        if (isPhoneXP) {
          try {
            // Subject header is the previous element of the subject selector
            const subjHeader = subjectSelector.previousElementSibling;
            const typeHeader = typeSelector.previousElementSibling;
            if (subjHeader && subjectSelector) {
              subjectSelector.style.display = "none";
              subjHeader.style.cursor = "pointer";
              subjHeader.onclick = (e) => {
                e.preventDefault();
                subjectSelector.style.display =
                  subjectSelector.style.display === "none" ? "block" : "none";
              };
            }
            if (typeHeader && typeSelector) {
              typeSelector.style.display = "none";
              typeHeader.style.cursor = "pointer";
              typeHeader.onclick = (e) => {
                e.preventDefault();
                typeSelector.style.display =
                  typeSelector.style.display === "none" ? "block" : "none";
              };
            }
          } catch (e) {
            console.warn("Phone chart toggles error", e);
          }
        }
        return {
          type: "radar",
          data: {
            labels: ["Moyenne", "Note Max", "Note Min", "Consistance"],
            datasets: [
              {
                label: firstSubject.name,
                data: [
                  firstMetrics.avg,
                  firstMetrics.max,
                  firstMetrics.min,
                  firstMetrics.consistency,
                ],
                borderColor: firstSubject.color,
                backgroundColor: hex2rgba(firstSubject.color, 0.2),
              },
              {
                label: "Moyenne des autres",
                data: [
                  otherMetrics.avg,
                  otherMetrics.max,
                  otherMetrics.min,
                  otherMetrics.consistency,
                ],
                borderColor: "#94a3b8",
                backgroundColor: hex2rgba("#94a3b8", 0.2),
              },
            ],
          },
          options: {
            ...baseOptions,
            scales: {
              r: {
                min: 0,
                max: 20,
                pointLabels: { color: textColor },
                grid: { color: gridColor },
                ticks: { color: textColor, backdropColor: "transparent" },
              },
            },
          },
        };
      },
    },
    highestLowestNote: {
      name: "Notes extrêmes par matière",
      config: () => {
        const highest = data.map((s) =>
          s.history.length ? Math.max(...s.history.map((h) => h.val)) : 0,
        );
        const lowest = data.map((s) =>
          s.history.length ? Math.min(...s.history.map((h) => h.val)) : 0,
        );
        return {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Note la plus basse",
                data: lowest,
                backgroundColor: hex2rgba("#ef4444", 0.7),
              },
              {
                label: "Note la plus haute",
                data: highest,
                backgroundColor: hex2rgba("#22c55e", 0.7),
              },
            ],
          },
          options: baseOptions,
        };
      },
    },
    averageByCoef: {
      name: "Moyenne par coefficient",
      config: () => {
        const notesByCoef = {};
        data
          .flatMap((s) => s.history)
          .forEach((n) => {
            const c = n.coef || 1;
            if (!notesByCoef[c]) notesByCoef[c] = [];
            notesByCoef[c].push(n.val);
          });
        const coefLabels = Object.keys(notesByCoef).sort((a, b) => a - b);
        const coefAvgs = coefLabels.map((c) => {
          const notes = notesByCoef[c];
          return notes.reduce((sum, val) => sum + val, 0) / notes.length;
        });
        return {
          type: "bar",
          data: {
            labels: coefLabels.map((c) => `Coef x${c}`),
            datasets: [
              {
                label: "Moyenne des notes",
                data: coefAvgs,
                backgroundColor: "#6366f1",
              },
            ],
          },
          options: baseOptions,
        };
      },
    },
  };

  const chart = chartConfigs[type];
  if (!chart) return null;
  // If config is a function, call it to get the dynamic config
  if (typeof chart.config === "function") {
    return { name: chart.name, config: chart.config() };
  }
  return chart;
}

window.addEventListener("keydown", (e) => {
  // Shortcut to lock session: Ctrl+L or Cmd+L
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
    e.preventDefault();
    if (user && user.authSecret) {
      lockSession();
    }
  }
});

// ===================================================================
// DEV TERMINAL — Hidden developer panel (zero-cost when closed)
// Activated by typing {prenom}{nom}dev on the keyboard
// ===================================================================
(function () {
  // --- State ---
  let _devKeyBuffer = "";
  let _devOpen = false;
  let _devInitialized = false; // lazy init flag
  let _devConsoleLogs = [];
  let _devConsoleHooked = false;
  let _devCurrentPlatform = null;
  let _devFpsRaf = null;
  let _devActiveTab = "info";
  let _devDirtyTabs = new Set();

  // Saved originals for navigator overrides
  const _realUA = navigator.userAgent;
  const _realPlatform = navigator.platform;
  const _realMaxTP = navigator.maxTouchPoints;

  const _origConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  // Platform presets: UA, platform, maxTouchPoints, classes, isSafari
  const PLATFORMS = {
    "desktop-win": {
      ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      platform: "Win32",
      maxTP: 0,
      classes: [],
      safari: false,
      label: "Desktop Windows",
      os: "windows",
      viewport: null,
    },
    "desktop-mac": {
      ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
      platform: "MacIntel",
      maxTP: 0,
      classes: ["is-safari"],
      safari: true,
      label: "Desktop macOS (Safari)",
      os: "macos",
      viewport: null,
    },
    "desktop-linux": {
      ua: "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
      platform: "Linux x86_64",
      maxTP: 0,
      classes: [],
      safari: false,
      label: "Desktop Linux",
      os: "linux",
      viewport: null,
    },
    "phone-android": {
      ua: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
      platform: "Linux armv8l",
      maxTP: 5,
      classes: ["is-mobile", "phone-xp"],
      safari: false,
      label: "Phone Android",
      os: "android",
      viewport: { w: 412, h: 915 },
    },
    "phone-ios": {
      ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      platform: "iPhone",
      maxTP: 5,
      classes: ["is-mobile", "phone-xp", "is-safari"],
      safari: true,
      label: "iPhone (Safari)",
      os: "ios",
      viewport: { w: 393, h: 852 },
    },
    "tablet-ipad": {
      ua: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      platform: "iPad",
      maxTP: 5,
      classes: ["is-mobile", "is-safari"],
      safari: true,
      label: "iPad (Safari)",
      os: "ipados",
      viewport: { w: 820, h: 1180 },
    },
    "tablet-android": {
      ua: "Mozilla/5.0 (Linux; Android 14; SM-X810) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      platform: "Linux armv8l",
      maxTP: 5,
      classes: ["is-mobile"],
      safari: false,
      label: "Tablette Android",
      os: "android",
      viewport: { w: 800, h: 1280 },
    },
  };

  // --- Activation: keystroke detection (always lightweight) ---
  window.addEventListener("keydown", (e) => {
    // Skip modifier combos and special keys
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    // Skip if user is typing in an input/textarea
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;

    _devKeyBuffer += e.key.toLowerCase();
    if (_devKeyBuffer.length > 60) _devKeyBuffer = _devKeyBuffer.slice(-60);

    if (user && user.prenom && user.nom) {
      const secret = (user.prenom + user.nom + "dev").toLowerCase().replace(/\s/g, "");
      if (_devKeyBuffer.endsWith(secret)) {
        _devKeyBuffer = "";
        toggleDevTerminal();
      }
    }
  });

  // --- Lazy init (runs once on first open) ---
  function _initDevTerminal() {
    if (_devInitialized) return;
    _devInitialized = true;
    _hookConsole();
    _initDrag();
  }

  // --- Console hooks (only installed on first open) ---
  function _hookConsole() {
    if (_devConsoleHooked) return;
    _devConsoleHooked = true;

    function capture(type, origFn, args) {
      const time = new Date().toLocaleTimeString("fr-FR", { hour12: false });
      const parts = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === null) { parts.push("null"); continue; }
        if (a === undefined) { parts.push("undefined"); continue; }
        if (typeof a === "object") {
          try { parts.push(JSON.stringify(a, null, 2)); } catch { parts.push(String(a)); }
          continue;
        }
        parts.push(String(a));
      }
      _devConsoleLogs.push({ type, time, msg: parts.join(" ") });
      if (_devConsoleLogs.length > 800) _devConsoleLogs.splice(0, 300);
      if (_devOpen && _devActiveTab === "console") _devDirtyTabs.add("console");
      origFn.apply(console, args);
    }

    console.log = function () { capture("log", _origConsole.log, arguments); };
    console.warn = function () { capture("warn", _origConsole.warn, arguments); };
    console.error = function () { capture("error", _origConsole.error, arguments); };
  }

  // --- Drag to resize ---
  function _initDrag() {
    const handle = document.getElementById("dev-drag-handle");
    const terminal = document.getElementById("dev-terminal");
    if (!handle || !terminal) return;

    let dragging = false;
    let startY = 0;
    let startH = 0;

    handle.addEventListener("mousedown", (e) => {
      dragging = true;
      startY = e.clientY;
      startH = terminal.offsetHeight;
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const newH = Math.min(
        Math.max(startH + (startY - e.clientY), 180),
        window.innerHeight * 0.92
      );
      terminal.style.height = newH + "px";
    });

    window.addEventListener("mouseup", () => {
      if (!dragging) return;
      dragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    });

    // Touch support
    handle.addEventListener("touchstart", (e) => {
      dragging = true;
      startY = e.touches[0].clientY;
      startH = terminal.offsetHeight;
      e.preventDefault();
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
      if (!dragging) return;
      const newH = Math.min(
        Math.max(startH + (startY - e.touches[0].clientY), 180),
        window.innerHeight * 0.92
      );
      terminal.style.height = newH + "px";
    }, { passive: true });

    window.addEventListener("touchend", () => { dragging = false; });
  }

  // --- FPS counter (only runs when terminal is visible) ---
  function _startFps() {
    if (_devFpsRaf) return;
    let frames = 0;
    let last = performance.now();
    const el = document.getElementById("dev-sb-fps");

    function tick(now) {
      frames++;
      if (now - last >= 1000) {
        if (el) el.textContent = "FPS : " + frames;
        frames = 0;
        last = now;
        // Also update mem
        _updateStatusBar();
      }
      if (_devOpen) {
        _devFpsRaf = requestAnimationFrame(tick);
      } else {
        _devFpsRaf = null;
      }
    }
    _devFpsRaf = requestAnimationFrame(tick);
  }

  function _stopFps() {
    if (_devFpsRaf) {
      cancelAnimationFrame(_devFpsRaf);
      _devFpsRaf = null;
    }
  }

  function _updateStatusBar() {
    const memEl = document.getElementById("dev-sb-mem");
    const domEl = document.getElementById("dev-sb-dom");
    if (memEl && performance.memory) {
      memEl.textContent = "Heap : " + (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + " Mo";
    }
    if (domEl) {
      domEl.textContent = "DOM : " + document.querySelectorAll("*").length + " éléments";
    }
  }

  // --- Toggle / Open / Close ---
  window.toggleDevTerminal = function () {
    _devOpen = !_devOpen;
    if (_devOpen) {
      _initDevTerminal();
      const el = document.getElementById("dev-terminal");
      if (el) el.classList.remove("dev-hidden");
      _startFps();
      _renderActiveTab();
      _updateSimBadge();
      const badge = document.getElementById("dev-terminal-user");
      if (badge && user) badge.textContent = user.prenom + " " + user.nom;
    } else {
      closeDevTerminal();
    }
  };

  window.closeDevTerminal = function () {
    _devOpen = false;
    _stopFps();
    const el = document.getElementById("dev-terminal");
    if (el) el.classList.add("dev-hidden");
  };

  window.toggleDevTerminalSize = function () {
    const el = document.getElementById("dev-terminal");
    if (el) el.classList.toggle("dev-expanded");
  };

  // --- Tab switching ---
  window.devSwitchTab = function (tabName) {
    _devActiveTab = tabName;
    document.querySelectorAll("#dev-terminal .dev-tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.devtab === tabName);
    });
    document.querySelectorAll("#dev-terminal .dev-panel").forEach((p) => {
      p.classList.toggle("active", p.id === "dev-panel-" + tabName);
    });
    _renderActiveTab();
  };

  function _renderActiveTab() {
    switch (_devActiveTab) {
      case "info": _renderSysInfo(); break;
      case "app": _renderAppInfo(); break;
      case "storage": devRefreshStorage(); break;
      case "platform": _renderPlatformStatus(); break;
      case "perf": _renderPerfInfo(); break;
      case "console": _renderConsoleLogs(); break;
    }
    _devDirtyTabs.delete(_devActiveTab);
  }

  window.refreshDevInfo = function () {
    _renderActiveTab();
    _updateStatusBar();
  };

  // --- System Info ---
  function _renderSysInfo() {
    const el = document.getElementById("dev-sys-info");
    if (!el) return;

    const nav = navigator;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    const cards = [];

    cards.push(_card("Navigateur", {
      "User Agent": nav.userAgent,
      Langue: nav.language,
      Langues: (nav.languages || []).join(", "),
      "Cookies activés": nav.cookieEnabled ? "Oui" : "Non",
      "Do Not Track": nav.doNotTrack || "non défini",
      Plateforme: nav.platform,
      "Max Touch Points": nav.maxTouchPoints,
    }));

    cards.push(_card("Écran", {
      Résolution: screen.width + " × " + screen.height,
      Viewport: window.innerWidth + " × " + window.innerHeight,
      "Device Pixel Ratio": window.devicePixelRatio,
      "Profondeur couleur": screen.colorDepth + " bits",
      Orientation: (screen.orientation && screen.orientation.type) || "N/A",
    }));

    const hw = { "CPU Cores": nav.hardwareConcurrency || "N/A" };
    if (nav.deviceMemory) hw["RAM"] = nav.deviceMemory + " Go";
    if (conn) {
      hw["Connexion"] = conn.effectiveType || "N/A";
      hw["Downlink"] = conn.downlink ? conn.downlink + " Mbps" : "N/A";
      hw["RTT"] = conn.rtt != null ? conn.rtt + " ms" : "N/A";
      hw["Save Data"] = conn.saveData ? "Oui" : "Non";
    }
    cards.push(_card("Hardware / Réseau", hw));

    const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
    cards.push(_card("Media Queries", {
      "(hover: hover)": mq("(hover: hover)") ? "✓ oui" : "✗ non",
      "(pointer: coarse)": mq("(pointer: coarse)") ? "✓ oui" : "✗ non",
      "(pointer: fine)": mq("(pointer: fine)") ? "✓ oui" : "✗ non",
      "(prefers-color-scheme: dark)": mq("(prefers-color-scheme: dark)") ? "✓ oui" : "✗ non",
      "(prefers-reduced-motion)": mq("(prefers-reduced-motion: reduce)") ? "✓ oui" : "✗ non",
      "(display-mode: standalone)": mq("(display-mode: standalone)") ? "✓ oui" : "✗ non",
    }));

    el.innerHTML = cards.join("");
  }

  // --- App Info ---
  function _renderAppInfo() {
    const el = document.getElementById("dev-app-info");
    if (!el) return;
    const cards = [];

    if (user) {
      cards.push(_card("Utilisateur actif", {
        ID: user.id,
        Prénom: user.prenom,
        Nom: user.nom,
        "Type période": user.periodType || "N/A",
        "Storage mode": user.storageMode || "N/A",
        "Auth": user.authSecret ? "✓ PIN configuré" : "✗ Pas de PIN",
        Email: user.recoveryEmail || "Non défini",
      }));
    } else {
      cards.push(_card("Utilisateur", { Statut: "Aucun utilisateur actif" }));
    }

    if (typeof appSettings === "object") {
      const s = {};
      for (const [k, v] of Object.entries(appSettings)) {
        s[k] = typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
      }
      cards.push(_card("Paramètres (appSettings)", s));
    }

    const bodyClasses = Array.from(document.body.classList);
    const htmlClasses = Array.from(document.documentElement.classList);
    cards.push(_card("DOM / Classes", {
      "Éléments totaux": document.querySelectorAll("*").length,
      Modales: document.querySelectorAll(".modal-overlay").length,
      "Classes <body>": bodyClasses.join(", ") || "(aucune)",
      "Classes <html>": htmlClasses.join(", ") || "(aucune)",
      isPhoneXP: typeof isPhoneXP !== "undefined" ? String(isPhoneXP) : "N/A",
    }));

    if (typeof subjects !== "undefined" && Array.isArray(subjects)) {
      const totalGrades = subjects.reduce((a, s) => a + (s.grades ? s.grades.length : 0), 0);
      cards.push(_card("Données scolaires", {
        Matières: subjects.length,
        "Notes totales": totalGrades,
        "Moy. notes/matière": subjects.length ? (totalGrades / subjects.length).toFixed(1) : "0",
      }));
    }

    el.innerHTML = cards.join("");
  }

  // --- Performance ---
  function _renderPerfInfo() {
    const el = document.getElementById("dev-perf-info");
    if (!el) return;
    const cards = [];

    if (performance.timing) {
      const t = performance.timing;
      const ns = t.navigationStart;
      cards.push(_card("Navigation Timing", {
        "Page Load": (t.loadEventEnd - ns) + " ms",
        "DOM Ready": (t.domContentLoadedEventEnd - ns) + " ms",
        "DOM Interactive": (t.domInteractive - ns) + " ms",
        DNS: (t.domainLookupEnd - t.domainLookupStart) + " ms",
        "TCP Connect": (t.connectEnd - t.connectStart) + " ms",
        TTFB: (t.responseStart - ns) + " ms",
        "DOM Parsing": (t.domComplete - t.domInteractive) + " ms",
      }));
    }

    if (performance.memory) {
      const m = performance.memory;
      const mb = (b) => (b / 1048576).toFixed(1) + " Mo";
      const pct = ((m.usedJSHeapSize / m.jsHeapSizeLimit) * 100).toFixed(1);
      cards.push(_card("Mémoire JS", {
        "Heap utilisé": mb(m.usedJSHeapSize),
        "Heap total": mb(m.totalJSHeapSize),
        "Heap limite": mb(m.jsHeapSizeLimit),
        Utilisation: pct + " %",
      }));
    }

    if (performance.getEntriesByType) {
      const res = performance.getEntriesByType("resource");
      const totalKo = (res.reduce((a, r) => a + (r.transferSize || 0), 0) / 1024).toFixed(1);
      const top5 = res.slice().sort((a, b) => b.duration - a.duration).slice(0, 5);
      const rd = { "Ressources": res.length, "Transfert total": totalKo + " Ko" };
      top5.forEach((r, i) => {
        rd["#" + (i + 1) + " " + r.name.split("/").pop().substring(0, 28)] = r.duration.toFixed(0) + " ms";
      });
      cards.push(_card("Ressources (top 5 lentes)", rd));
    }

    let lsBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      lsBytes += (k.length + (localStorage.getItem(k) || "").length) * 2;
    }
    cards.push(_card("Stockage local", {
      "Clés localStorage": localStorage.length,
      "Taille estimée": (lsBytes / 1024).toFixed(1) + " Ko",
    }));

    el.innerHTML = cards.join("");
  }

  // --- Storage inspector ---
  window.devRefreshStorage = function () {
    const el = document.getElementById("dev-storage-list");
    if (!el) return;
    const search = (document.getElementById("dev-storage-search") || {}).value || "";
    const filter = search.toLowerCase();
    let html = "";
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (filter && !key.toLowerCase().includes(filter)) continue;
      const val = localStorage.getItem(key) || "";
      const size = ((key.length + val.length) * 2 / 1024).toFixed(1);
      const preview = val.length > 100 ? val.substring(0, 100) + "…" : val;
      count++;
      html +=
        '<div class="dev-storage-item" onclick="devToggleStorageItem(this)">' +
        '<span class="dev-storage-key">' + _esc(key) + "</span>" +
        '<span class="dev-storage-size">' + size + " Ko</span>" +
        '<div class="dev-storage-preview">' + _esc(preview) + "</div>" +
        '<div class="dev-storage-expanded">' + _esc(val) + "</div>" +
        "</div>";
    }
    if (!html) html = '<div style="color:#6e7681;padding:10px;">Aucune donnée' + (filter ? ' correspondant à "' + _esc(filter) + '"' : '') + '.</div>';
    el.innerHTML = html;
  };

  window.devToggleStorageItem = function (el) {
    const expanded = el.querySelector(".dev-storage-expanded");
    if (expanded) {
      expanded.style.display = expanded.style.display === "block" ? "none" : "block";
    }
  };

  window.devExportStorage = function () {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "noteo_localstorage_export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================
  // PLATFORM SIMULATOR — truly overrides navigator properties
  // so ALL platform-dependent code reacts as if on that device
  // ============================================================

  function _overrideNavigator(prop, value) {
    try {
      Object.defineProperty(navigator, prop, {
        get: function () { return value; },
        configurable: true,
      });
    } catch (ex) {
      // Some browsers prevent override; use writable fallback
      try { navigator[prop] = value; } catch (_) {}
    }
  }

  function _restoreNavigator(prop, realValue) {
    try {
      Object.defineProperty(navigator, prop, {
        get: function () { return realValue; },
        configurable: true,
      });
    } catch (_) {
      try { navigator[prop] = realValue; } catch (_) {}
    }
  }

  function _undoPhoneExperience() {
    const themeBtn = document.querySelector('button[onclick="cycleTheme()"]');
    if (themeBtn) themeBtn.style.display = "";
    const toggleAllBtn = document.querySelector('button[onclick="toggleAllAccordions()"]');
    if (toggleAllBtn) toggleAllBtn.style.display = "";
    const headerName = document.getElementById("header-user-name");
    if (headerName) headerName.classList.remove("hidden");
    const footer = document.querySelector("footer");
    if (footer) footer.style.display = "";
    const tabNav = document.querySelector("nav");
    if (tabNav) tabNav.style.display = "";
    document.querySelectorAll(
      'button[onclick="cycleSemester(-1)"], button[onclick="cycleSemester(1)"], #semester-menu'
    ).forEach((el) => (el.style.display = ""));
    const mobileSemLabel = document.getElementById("mobile-semester-label");
    if (mobileSemLabel) mobileSemLabel.classList.add("hidden");
  }

  window.devSimulatePlatform = function (plat) {
    const body = document.body;
    const html = document.documentElement;

    // 1. Clean slate: remove all simulation classes + device chrome
    body.classList.remove("phone-xp", "is-mobile", "is-safari");
    html.classList.remove("phone-xp");
    _undoPhoneExperience();
    _removeDeviceChrome();

    if (plat === "reset") {
      _devCurrentPlatform = null;

      // Restore real navigator values
      _restoreNavigator("userAgent", _realUA);
      _restoreNavigator("platform", _realPlatform);
      _restoreNavigator("maxTouchPoints", _realMaxTP);

      // Re-run real detection
      if (typeof detectPhoneXP === "function") {
        detectPhoneXP();
        if (isPhoneXP && typeof applyPhoneExperience === "function") {
          applyPhoneExperience();
          if (typeof initScrollToggleButton === "function") initScrollToggleButton();
        }
      }
      // Re-apply real mobile UA check
      const isMobileReal = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(_realUA)
        || window.innerWidth < 768;
      if (isMobileReal) body.classList.add("is-mobile");

      _updateSimBadge();
      _updatePlatButtons();
      _renderPlatformStatus();
      _tryRerender();
      return;
    }

    const preset = PLATFORMS[plat];
    if (!preset) return;

    _devCurrentPlatform = plat;

    // 2. Override navigator properties so any code reading them sees the simulated values
    _overrideNavigator("userAgent", preset.ua);
    _overrideNavigator("platform", preset.platform);
    _overrideNavigator("maxTouchPoints", preset.maxTP);

    // 3. Apply CSS classes
    preset.classes.forEach((c) => {
      body.classList.add(c);
      if (c === "phone-xp") html.classList.add("phone-xp");
    });

    // 4. Update isPhoneXP global
    if (typeof window.isPhoneXP !== "undefined") {
      window.isPhoneXP = preset.classes.includes("phone-xp");
    }

    // 5. Apply phone experience side-effects if phone/tablet
    if (preset.classes.includes("phone-xp")) {
      if (typeof applyPhoneExperience === "function") applyPhoneExperience();
      if (typeof initScrollToggleButton === "function") initScrollToggleButton();
    }

    // 6. Safari class → disables backdrop-filter via CSS
    // (is-safari already added above if in preset.classes)

    // 7. Apply device chrome overlays (status bar, home bar, etc.)
    _applyDeviceChrome(plat);

    _updateSimBadge();
    _updatePlatButtons();
    _renderPlatformStatus();
    _tryRerender();
  };

  function _tryRerender() {
    if (typeof renderGrades === "function" && user) {
      try { renderGrades(); } catch (_) {}
    }
  }

  function _updateSimBadge() {
    const badge = document.getElementById("dev-sim-badge");
    const sb = document.getElementById("dev-sb-platform");
    if (_devCurrentPlatform) {
      const p = PLATFORMS[_devCurrentPlatform];
      if (badge) {
        badge.textContent = "SIM: " + (p ? p.label : _devCurrentPlatform);
        badge.style.display = "";
      }
      if (sb) sb.textContent = "Plateforme : " + (p ? p.label : _devCurrentPlatform);
    } else {
      if (badge) badge.style.display = "none";
      if (sb) sb.textContent = "Plateforme : réelle";
    }
  }

  function _updatePlatButtons() {
    document.querySelectorAll(".dev-platform-btn").forEach((btn) => {
      btn.classList.toggle("active-plat", btn.dataset.plat === _devCurrentPlatform);
    });
  }

  function _renderPlatformStatus() {
    const el = document.getElementById("dev-platform-status");
    if (!el) return;

    const rows = {
      "Mode": _devCurrentPlatform ? "Simulé" : "Réel",
      "Preset": _devCurrentPlatform || "—",
      "navigator.userAgent": navigator.userAgent.substring(0, 90) + (navigator.userAgent.length > 90 ? "…" : ""),
      "navigator.platform": navigator.platform,
      "navigator.maxTouchPoints": navigator.maxTouchPoints,
      "isPhoneXP": typeof isPhoneXP !== "undefined" ? String(isPhoneXP) : "N/A",
      "body.is-mobile": document.body.classList.contains("is-mobile") ? "✓" : "✗",
      "body.phone-xp": document.body.classList.contains("phone-xp") ? "✓" : "✗",
      "body.is-safari": document.body.classList.contains("is-safari") ? "✓" : "✗",
      "html.phone-xp": document.documentElement.classList.contains("phone-xp") ? "✓" : "✗",
      "backdrop-filter": document.body.classList.contains("is-safari") || document.body.classList.contains("phone-xp") ? "✗ Désactivé" : "✓ Actif",
      "nav visible": document.querySelector("nav") ? (document.querySelector("nav").style.display !== "none" ? "✓" : "✗") : "N/A",
      "footer visible": document.querySelector("footer") ? (document.querySelector("footer").style.display !== "none" ? "✓" : "✗") : "N/A",
    };

    let html = "";
    for (const [k, v] of Object.entries(rows)) {
      const cls = String(v).startsWith("✓") ? " good" : String(v).startsWith("✗") ? " warn" : "";
      html +=
        '<div class="dev-card-row"><span class="dev-card-key">' + _esc(k) +
        '</span><span class="dev-card-val' + cls + '">' + _esc(String(v)) + "</span></div>";
    }
    el.innerHTML = html;
  }

  // --- Console viewer ---
  function _renderConsoleLogs() {
    const el = document.getElementById("dev-console-output");
    if (!el) return;
    const sE = document.getElementById("dev-console-errors");
    const sW = document.getElementById("dev-console-warns");
    const sL = document.getElementById("dev-console-logs");
    const showE = sE ? sE.checked : true;
    const showW = sW ? sW.checked : true;
    const showL = sL ? sL.checked : true;

    let html = "";
    let count = 0;
    for (const entry of _devConsoleLogs) {
      if (entry.type === "log" && !showL) continue;
      if (entry.type === "warn" && !showW) continue;
      if (entry.type === "error" && !showE) continue;
      count++;
      html +=
        '<div class="dev-log-entry log-type-' + entry.type + '">' +
        '<span class="log-time">' + _esc(entry.time) + "</span>" +
        '<span class="log-msg">' + _esc(entry.msg) + "</span></div>";
    }
    if (!html) html = '<div style="color:#30363d;padding:10px;">Aucun log capturé.</div>';
    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;

    const badge = document.getElementById("dev-console-count");
    if (badge) badge.textContent = count + " entrée" + (count !== 1 ? "s" : "");
  }

  window.devClearConsole = function () {
    _devConsoleLogs = [];
    _renderConsoleLogs();
  };

  window.devFilterConsole = function () {
    _renderConsoleLogs();
  };

  // --- Helpers ---
  function _card(title, data) {
    let html = '<div class="dev-card"><div class="dev-card-title">' + _esc(title) + "</div>";
    for (const [k, v] of Object.entries(data)) {
      html +=
        '<div class="dev-card-row"><span class="dev-card-key">' + _esc(k) +
        '</span><span class="dev-card-val">' + _esc(String(v)) + "</span></div>";
    }
    return html + "</div>";
  }

  function _esc(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ============================================================
  // DEVICE CHROME SIMULATION — Show realistic OS overlays
  // ============================================================

  function _getTimeStr() {
    const now = new Date();
    return now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
  }

  function _createIOSChrome() {
    // Status bar
    const statusBar = document.createElement("div");
    statusBar.id = "dev-ios-statusbar";
    statusBar.className = "dev-device-statusbar dev-device-ios-statusbar";
    statusBar.innerHTML =
      '<div class="dev-ios-sb-left"><span class="dev-ios-sb-time">' + _getTimeStr() + '</span></div>' +
      '<div class="dev-ios-sb-notch"><div class="dev-ios-dynamic-island"></div></div>' +
      '<div class="dev-ios-sb-right">' +
        '<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M1 8.5h1.5v3H1zM4 6h1.5v5.5H4zM7 3.5h1.5V12H7zM10 1h1.5v10.5H10z"/></svg>' +
        '<svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 3.6a6 6 0 014.24 1.76l1.06-1.06A7.5 7.5 0 008 1.5a7.5 7.5 0 00-5.3 2.8l1.06 1.06A6 6 0 018 3.6zm0 3a3 3 0 012.12.88l1.06-1.06A4.5 4.5 0 008 4.6a4.5 4.5 0 00-3.18 1.82l1.06 1.06A3 3 0 018 6.6zm0 3a1 1 0 100 2 1 1 0 000-2z"/></svg>' +
        '<div class="dev-ios-battery"><div class="dev-ios-battery-fill"></div></div>' +
      '</div>';
    document.body.appendChild(statusBar);

    // Home indicator
    const homeBar = document.createElement("div");
    homeBar.id = "dev-ios-homebar";
    homeBar.className = "dev-device-homebar dev-device-ios-homebar";
    homeBar.innerHTML = '<div class="dev-ios-home-indicator"></div>';
    document.body.appendChild(homeBar);

    // Update time every minute
    statusBar._timeInterval = setInterval(() => {
      const timeEl = statusBar.querySelector(".dev-ios-sb-time");
      if (timeEl) timeEl.textContent = _getTimeStr();
    }, 30000);
  }

  function _createAndroidChrome() {
    // Status bar
    const statusBar = document.createElement("div");
    statusBar.id = "dev-android-statusbar";
    statusBar.className = "dev-device-statusbar dev-device-android-statusbar";
    statusBar.innerHTML =
      '<div class="dev-android-sb-left">' +
        '<span class="dev-android-sb-time">' + _getTimeStr() + '</span>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.7"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/></svg>' +
      '</div>' +
      '<div class="dev-android-sb-right">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.8"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.8"><path d="M2 22h20V2L2 22zm18-2H6.83L20 6.83V20z"/></svg>' +
        '<div class="dev-android-battery"><div class="dev-android-battery-fill"></div></div>' +
      '</div>';
    document.body.appendChild(statusBar);

    // Navigation bar (gesture bar)
    const navBar = document.createElement("div");
    navBar.id = "dev-android-navbar";
    navBar.className = "dev-device-navbar dev-device-android-navbar";
    navBar.innerHTML = '<div class="dev-android-gesture-bar"></div>';
    document.body.appendChild(navBar);

    statusBar._timeInterval = setInterval(() => {
      const timeEl = statusBar.querySelector(".dev-android-sb-time");
      if (timeEl) timeEl.textContent = _getTimeStr();
    }, 30000);
  }

  function _removeDeviceChrome() {
    const ids = ["dev-ios-statusbar", "dev-ios-homebar", "dev-android-statusbar", "dev-android-navbar"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        if (el._timeInterval) clearInterval(el._timeInterval);
        el.remove();
      }
    });
    document.body.classList.remove("dev-sim-ios", "dev-sim-android", "dev-sim-ipados");
  }

  function _applyDeviceChrome(plat) {
    _removeDeviceChrome();
    if (!plat || plat === "reset") return;
    const preset = PLATFORMS[plat];
    if (!preset) return;

    const os = preset.os;
    if (os === "ios") {
      document.body.classList.add("dev-sim-ios");
      _createIOSChrome();
    } else if (os === "ipados") {
      document.body.classList.add("dev-sim-ipados");
      _createIOSChrome();
    } else if (os === "android") {
      document.body.classList.add("dev-sim-android");
      _createAndroidChrome();
    }
    // Desktop platforms: no device chrome
  }

  // ============================================================
  // QUICK ACTIONS — accessible from the App tab
  // ============================================================

  window.devQuickAction = function (action) {
    switch (action) {
      case "toggle-theme":
        if (typeof cycleTheme === "function") cycleTheme();
        break;
      case "clear-cache":
        if (typeof cacheDom === "function") cacheDom();
        _origConsole.log("[Dev] DOM cache rechargé");
        break;
      case "reload":
        window.location.reload();
        break;
      case "force-render":
        if (typeof renderGrades === "function" && user) renderGrades();
        _origConsole.log("[Dev] Rendu forcé des notes");
        break;
      case "toggle-animations":
        if (typeof updateSetting === "function") {
          updateSetting("animations", !appSettings.animations);
          _origConsole.log("[Dev] Animations: " + appSettings.animations);
        }
        break;
      case "toggle-blur":
        if (typeof updateSetting === "function") {
          updateSetting("blur", !appSettings.blur);
          _origConsole.log("[Dev] Blur: " + appSettings.blur);
        }
        break;
      case "toggle-blobs":
        if (typeof updateSetting === "function") {
          updateSetting("blobs", !appSettings.blobs);
          _origConsole.log("[Dev] Blobs: " + appSettings.blobs);
        }
        break;
      case "perf-snapshot":
        _capturePerformanceSnapshot();
        break;
    }
    if (_devOpen) _renderActiveTab();
  };

  function _capturePerformanceSnapshot() {
    const snap = {
      timestamp: new Date().toISOString(),
      dom: document.querySelectorAll("*").length,
      memory: performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + " Mo" : "N/A",
      viewport: window.innerWidth + "×" + window.innerHeight,
      platform: _devCurrentPlatform || "réelle",
    };
    _origConsole.log("[Dev] Performance snapshot:", snap);
  }

  // --- App Info with Quick Actions ---
  const _origRenderAppInfo = _renderAppInfo;
  _renderAppInfo = function () {
    _origRenderAppInfo();
    const el = document.getElementById("dev-app-info");
    if (!el) return;
    // Append quick actions card
    el.innerHTML += '<div class="dev-card" style="grid-column: 1 / -1;">' +
      '<div class="dev-card-title">Actions rapides</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;margin-top:4px;">' +
        '<button onclick="devQuickAction(\'toggle-theme\')" class="dev-btn" style="padding:8px;">🎨 Changer thème</button>' +
        '<button onclick="devQuickAction(\'force-render\')" class="dev-btn" style="padding:8px;">🔄 Re-render notes</button>' +
        '<button onclick="devQuickAction(\'toggle-animations\')" class="dev-btn" style="padding:8px;">✨ Toggle animations</button>' +
        '<button onclick="devQuickAction(\'toggle-blur\')" class="dev-btn" style="padding:8px;">💎 Toggle blur</button>' +
        '<button onclick="devQuickAction(\'toggle-blobs\')" class="dev-btn" style="padding:8px;">🫧 Toggle blobs</button>' +
        '<button onclick="devQuickAction(\'perf-snapshot\')" class="dev-btn dev-btn-accent" style="padding:8px;">📊 Snapshot perf</button>' +
        '<button onclick="devQuickAction(\'clear-cache\')" class="dev-btn" style="padding:8px;">🗑️ Recharger cache DOM</button>' +
        '<button onclick="devQuickAction(\'reload\')" class="dev-btn" style="padding:8px;border-color:#f8514940;color:#f85149;">♻️ Recharger la page</button>' +
      '</div>' +
    '</div>';
  };

  // --- Viewport indicator for platform tab ---
  const _origRenderPlatformStatus = _renderPlatformStatus;
  _renderPlatformStatus = function () {
    _origRenderPlatformStatus();
    const el = document.getElementById("dev-platform-status");
    if (!el) return;
    // Add viewport info
    const vp = _devCurrentPlatform && PLATFORMS[_devCurrentPlatform] && PLATFORMS[_devCurrentPlatform].viewport;
    const vpInfo = vp ? vp.w + " × " + vp.h + " (simulé)" : window.innerWidth + " × " + window.innerHeight + " (réel)";
    el.innerHTML +=
      '<div class="dev-card-row"><span class="dev-card-key">Viewport cible</span><span class="dev-card-val">' + vpInfo + '</span></div>' +
      '<div class="dev-card-row"><span class="dev-card-key">Device chrome</span><span class="dev-card-val' +
      (_devCurrentPlatform && PLATFORMS[_devCurrentPlatform] && PLATFORMS[_devCurrentPlatform].os !== "windows" && PLATFORMS[_devCurrentPlatform].os !== "macos" && PLATFORMS[_devCurrentPlatform].os !== "linux" ? ' good">✓ Actif' : ' warn">✗ Inactif') +
      '</span></div>';
  };

})();
