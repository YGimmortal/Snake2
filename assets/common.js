/* ======================= SAVE DATA (localStorage) ======================= */
const SAVE_KEY = "horizon_snake_save_v2";
const LEGACY_SAVE_KEY = "horizon_snake_save_v1";
const DEFAULT_SAVE = {
  highScore: 0,
  coins: 0,
  lifetimeCoins: 0,
  gamesPlayed: 0,
  bestCombo: 0,
  ownedSkins: ["horizon"],
  selectedSkin: "horizon",
  ownedBackgrounds: ["default"],
  selectedBackground: "default",
  customBackgroundImage: null,
  ownedTrails: ["none"],
  selectedTrail: "none",
  achievements: [],
  claimedAdvancements: [],
  stats: { powerOrbs: 0, multiplierOrbs: 0, mapsPlayed: [] },
  settings: {
    speed: "normal",
    wrap: false,
    sound: true,
    volume: 80,
    shake: true,
    hazards: false,
    difficulty: "low",       // none | low | medium | high  -> extra static obstacles
    controls: "arrows",      // arrows | wasd | swipe
    mapId: "open"
  },
  history: []
};

function loadSave() {
  let save = JSON.parse(JSON.stringify(DEFAULT_SAVE));
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      save = Object.assign(JSON.parse(JSON.stringify(DEFAULT_SAVE)), parsed);
      save.settings = Object.assign({}, DEFAULT_SAVE.settings, parsed.settings || {});
      save.stats = Object.assign({ powerOrbs: 0, multiplierOrbs: 0, mapsPlayed: [] }, parsed.stats || {});
      if (!Array.isArray(save.ownedSkins) || !save.ownedSkins.includes("horizon")) {
        save.ownedSkins = ["horizon", ...(save.ownedSkins || []).filter(s => s !== "classic")];
      }
      if (!Array.isArray(save.ownedBackgrounds) || !save.ownedBackgrounds.includes("default")) {
        save.ownedBackgrounds = ["default", ...(save.ownedBackgrounds || [])];
      }
      if (!Array.isArray(save.ownedTrails) || !save.ownedTrails.includes("none")) {
        save.ownedTrails = ["none", ...(save.ownedTrails || [])];
      }
      if (save.selectedSkin === "classic") save.selectedSkin = "horizon";
      if (!Array.isArray(save.history)) save.history = [];
      if (!Array.isArray(save.achievements)) save.achievements = [];
      if (!Array.isArray(save.claimedAdvancements)) save.claimedAdvancements = [];
      if (typeof save.lifetimeCoins !== "number") save.lifetimeCoins = save.coins || 0;
      if (typeof save.gamesPlayed !== "number") save.gamesPlayed = save.history.length || 0;
      if (typeof save.bestCombo !== "number") save.bestCombo = 0;
      if (typeof save.selectedBackground !== "string") save.selectedBackground = "default";
      if (typeof save.selectedTrail !== "string") save.selectedTrail = "none";
    }
  } catch (e) { /* first run / storage blocked, use defaults */ }
  return save;
}

function persistSave(save) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
  catch (e) { /* storage unavailable / quota exceeded — game still works this session */ }
}

let save = loadSave();
function persist() { persistSave(save); }

function addCoins(n) {
  if (!n) return;
  save.coins += n;
  save.lifetimeCoins = (save.lifetimeCoins || 0) + n;
}

/* ======================= COLOR HELPERS ======================= */
function hsl2hex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(255 * x).toString(16).padStart(2, "0");
  return "#" + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
}
/* keeps every generated hue inside the cyan -> purple/magenta band (172°-322°) */
function bandHue(n) { return 172 + (((n % 150) + 150) % 150); }

function getVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function hexToRgbStr(hex) { const c = hexToRgb(hex); return `${c.r},${c.g},${c.b}`; }
function lerpColor(a, b, t) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

/* ======================= ICON SYSTEM (custom SVG glyphs, no emoji) =======================
   One consistent line-icon language used everywhere: achievements, shop tabs, powers, HUD.
   icon(name, size) returns an inline <svg> string using currentColor, so it inherits text color. */
const ICON_PATHS = {
  apple:      '<path d="M12 8.4c-1.6-1.5-4-1.7-5.7-.3C4 9.7 3.5 13.4 5.6 16.8c1.5 2.4 3.2 4.1 4.6 4.1.9 0 1.4-.3 1.8-.3s.9.3 1.8.3c1.4 0 3.4-1.9 4.8-4.4 1-1.8 1.3-3.2 1.3-3.2-3.3-1.3-3.6-5.7-.4-7.4-1-1.4-2.5-2.1-4-2-.9.1-1.5.5-2 .8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8.2c0-1.6.7-3 1.9-3.9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  star:       '<path d="M12 3.2l2.4 5.3 5.8.6-4.4 3.9 1.3 5.7L12 15.8l-5.1 2.9 1.3-5.7-4.4-3.9 5.8-.6z" fill="currentColor"/>',
  trophy:     '<path d="M7 4h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 5H4.5a2 2 0 0 0 0 4H6M17 5h2.5a2 2 0 0 1 0 4H16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 12v3m-3.5 3.5h7M9 19h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  crown:      '<path d="M4 9l3.5 3L12 6l4.5 6L20 9l-1.6 8.5H5.6L4 9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="19" r="0" fill="none"/>',
  galaxy:     '<circle cx="12" cy="12" r="2.2" fill="currentColor"/><ellipse cx="12" cy="12" rx="9" ry="3.4" fill="none" stroke="currentColor" stroke-width="1.4" transform="rotate(-18 12 12)"/><circle cx="5" cy="6" r="0.8" fill="currentColor"/><circle cx="19" cy="17" r="0.8" fill="currentColor"/>',
  flame:      '<path d="M12 3c1 3-3 4-3 8a3 3 0 0 0 6 0c1.4 1 2 2.7 2 4.2A5.2 5.2 0 0 1 12 21a5.2 5.2 0 0 1-5-5.5C7 11 9 9 9 6.5c1.2 1 1.6 2 1.6 3" fill="currentColor" stroke="none"/>',
  timer:      '<circle cx="12" cy="13" r="7.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 9v4l3 2M10 2h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  shield:     '<path d="M12 3.5l7 2.6v5.4c0 4.4-2.9 7.9-7 9-4.1-1.1-7-4.6-7-9V6.1l7-2.6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12l2 2 4-4.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  coin:       '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.5v9M9.3 9.3c0-1 1-1.8 2.7-1.8 1.9 0 2.9.9 2.9 2s-1 1.6-2.9 2c-1.9.4-2.9 1-2.9 2.1s1 2 2.9 2c1.7 0 2.7-.7 2.7-1.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  comet:      '<circle cx="15.5" cy="8.5" r="2.4" fill="currentColor"/><path d="M14 10 5 19M13.6 12.4 8 18M15.8 11l-4.8 4.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>',
  bolt:       '<path d="M13 2 5 14h5l-1 8 8-12h-5l1-8z" fill="currentColor"/>',
  cross:      '<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  palette:    '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2.2-1 2.2-2.1 0-.5-.2-1-.6-1.4-.4-.4-.6-.9-.6-1.4 0-1.1.9-2 2-2H17a4 4 0 0 0 4-4c0-4.6-4-7.1-9-7.1z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="7.5" cy="11" r="1.1" fill="currentColor"/><circle cx="9.5" cy="7.3" r="1.1" fill="currentColor"/><circle cx="14.3" cy="7" r="1.1" fill="currentColor"/><circle cx="16.6" cy="10.6" r="1.1" fill="currentColor"/>',
  jacket:     '<path d="M9 4 6 6l-2 3 2 1.5V20h12v-9.5L20 9l-2-3-3-2-1.8 2h-2.4L9 4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 6v14" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".7"/>',
  gem:        '<path d="M4 9l4-5h8l4 5-8 11L4 9z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 9h16M9 4l3 5 3-5M12 9l-2.8 0M8 9l4 11 4-11" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".75"/>',
  image:      '<rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="8.5" cy="9.5" r="1.6" fill="currentColor"/><path d="M4 17l5.5-5.5L13 15l3-3 4 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  upload:     '<path d="M12 16V5M8 9l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  map:        '<path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 4v14M15 6v14" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".7"/>',
  compass:    '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 9l-2 5-4.5 1.5L10.5 10z" fill="currentColor"/>',
  sparkles:   '<path d="M12 3l1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4z" fill="currentColor"/><path d="M18.5 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="currentColor"/><path d="M5 15l.6 1.7L7.3 17 5.6 17.6 5 19.3l-.6-1.7-1.7-.6 1.7-.6z" fill="currentColor"/>',
  bank:       '<path d="M4 10l8-5 8 5M5 10v8M9 10v8M15 10v8M19 10v8M3.5 20h17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  rocket:     '<path d="M12 3c3 1.5 4.5 5 4.5 8.5 0 2-.7 3.7-1.5 5l-3-1.3-3 1.3c-.8-1.3-1.5-3-1.5-5C7.5 8 9 4.5 12 3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="1.4" fill="currentColor"/><path d="M9 16.5 7 20l3-1M15 16.5l2 3.5-3-1" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  brick:      '<rect x="3.5" y="6" width="7" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="13.5" y="6" width="7" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="8" y="13" width="8" height="5" rx="1" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  magnet:     '<path d="M6 4h4v8.5a2 2 0 0 0 4 0V4h4v8.5a6 6 0 0 1-12 0V4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 8h4M14 8h4" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  ghost:      '<path d="M6 20V11a6 6 0 0 1 12 0v9l-2.2-1.7L14 20l-2-1.7L10 20l-1.8-1.7z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="9.7" cy="11" r="1" fill="currentColor"/><circle cx="14.3" cy="11" r="1" fill="currentColor"/>',
  grow:       '<path d="M12 21v-8m0 0c0-4 2-7 6-8-1 4-2 6-6 8zm0 0c0-4-2-7-6-8 1 4 2 6 6 8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  lock:       '<rect x="5.5" y="10.5" width="13" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  check:      '<path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  sound:      '<path d="M4 10v4h3.5L13 18V6L7.5 10z" fill="currentColor"/><path d="M16.5 9a4.5 4.5 0 0 1 0 6M18.7 6.7a8 8 0 0 1 0 10.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  mute:       '<path d="M4 10v4h3.5L13 18V6L7.5 10z" fill="currentColor"/><path d="M16 9l4.5 6M20.5 9 16 15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  gear:       '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M17.7 6.3l-1.7 1.7M8 16l-1.7 1.7M17.7 17.7 16 16M8 8 6.3 6.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  play:       '<path d="M6 4.5v15l14-7.5z" fill="currentColor"/>',
  back:       '<path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  shop:       '<path d="M5 7h14l-1 12H6L5 7z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 7a4 4 0 0 1 8 0M9 11v4M15 11v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  difficulty: '<path d="M12 3l8 4v5c0 4.6-3.1 7.9-8 9-4.9-1.1-8-4.4-8-9V7l8-4z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m13 6-4 6h3l-1 6 4-7h-3l1-5z" fill="currentColor"/>',
  controls:  '<rect x="3.5" y="5" width="17" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 9h4M9 7v4M15 8h.1M17.5 10h.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  plus:      '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  pause:     '<path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  up:        '<path d="m6 14 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  down:      '<path d="m6 10 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  left:      '<path d="m14 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  right:     '<path d="m10 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  target:    '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
  snow:      '<path d="M12 3v18M5 7l14 10M19 7 5 17M8 4l4 2 4-2M8 20l4-2 4 2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  sun:       '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  frost:      '<path d="m12 3 2.1 4.3L19 9l-4.9 1.7L12 15l-2.1-4.3L5 9l4.9-1.7L12 3zM18 14l1 2 2 .8-2 .7-1 2.1-1-2.1-2-.7 2-.8z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
};
function icon(name, size) {
  const s = size || 18;
  const body = ICON_PATHS[name] || ICON_PATHS.star;
  return `<svg class="hs-icon" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true" style="vertical-align:-4px">${body}</svg>`;
}

/* ======================= ACHIEVEMENTS / ADVANCEMENTS ======================= */
const ACHIEVEMENTS = [
  { id: "first_bite",     name: "First Bite",       desc: "Eat your first bite of food",          icon: "apple", reward: 30 },
  { id: "half_century",   name: "Half Century",     desc: "Score 100+ in a single run",            icon: "star", reward: 60 },
  { id: "centurion",      name: "Double Century",   desc: "Score 250+ in a single run",            icon: "trophy", reward: 100 },
  { id: "legend",         name: "Legend",           desc: "Score 500+ in a single run",            icon: "crown", reward: 180 },
  { id: "horizon_master", name: "Horizon Master",   desc: "Score 1000+ in a single run",           icon: "galaxy", reward: 350 },
  { id: "combo_king",     name: "Combo King",       desc: "Reach a ×5 combo streak",                icon: "flame", reward: 120 },
  { id: "survivor",       name: "Survivor",         desc: "Survive 2 minutes in one run",           icon: "timer", reward: 150 },
  { id: "shield_bearer",  name: "Shield Bearer",    desc: "Pick up a shield orb",                   icon: "shield", reward: 60 },
  { id: "collector",      name: "Coin Collector",   desc: "Earn 500 coins lifetime",                icon: "coin", reward: 100 },
  { id: "grand_master",   name: "Grand Master",     desc: "Reach level 8 in a single run",          icon: "comet", reward: 200 },
  { id: "power_house",    name: "Power House",      desc: "Collect 25 Power Cell orbs",             icon: "bolt", reward: 250 },
  { id: "multiplier_master", name: "Multiplier Master", desc: "Trigger 25 food multipliers",       icon: "cross", reward: 250 },
  { id: "skin_collector5",name: "Style Starter",    desc: "Own 5 skins",                            icon: "palette", reward: 150 },
  { id: "skin_collector20",name: "Wardrobe",        desc: "Own 20 skins",                           icon: "jacket", reward: 400 },
  { id: "skin_collector50",name: "Fashionista",     desc: "Own 50 skins",                           icon: "gem", reward: 900 },
  { id: "bg_owner",       name: "New Scenery",      desc: "Own a purchased background",             icon: "image", reward: 150 },
  { id: "custom_bg",      name: "Personal Touch",   desc: "Upload your own background",             icon: "upload", reward: 300 },
  { id: "map_explorer",   name: "Cartographer",     desc: "Play on 10 different maps",              icon: "map", reward: 400 },
  { id: "map_master",     name: "World Traveler",   desc: "Play on 25 different maps",              icon: "compass", reward: 800 },
  { id: "trailblazer",    name: "Trailblazer",      desc: "Equip a purchased trail",                icon: "sparkles", reward: 100 },
  { id: "wealthy",        name: "Wealthy",          desc: "Earn 5000 coins lifetime",               icon: "coin", reward: 500 },
  { id: "rich",           name: "Tycoon",           desc: "Earn 20000 coins lifetime",              icon: "bank", reward: 1500 },
  { id: "speed_demon",    name: "Speed Demon",      desc: "Score 300+ on Extreme speed",            icon: "rocket", reward: 600 },
  { id: "obstacle_dodger",name: "Obstacle Dodger",  desc: "Score 200+ with High difficulty obstacles", icon: "brick", reward: 500 },
];
function achievementById(id) { return ACHIEVEMENTS.find(a => a.id === id); }
function unlockAchievement(id) {
  if (save.achievements.includes(id)) return null;
  save.achievements.push(id);
  persist();
  return achievementById(id) || null;
}
function claimAdvancement(id) {
  if (!save.achievements.includes(id)) return null;
  if (save.claimedAdvancements.includes(id)) return null;
  const a = achievementById(id);
  if (!a) return null;
  save.claimedAdvancements.push(id);
  addCoins(a.reward);
  persist();
  return a;
}

/* ======================= SOUND (WebAudio synth, no files) ======================= */
let actx = null;
function ensureAudio() {
  if (!actx) {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { /* audio unsupported */ }
  }
}
function beep(freq, dur, type, vol) {
  if (!save.settings.sound || !actx) return;
  const master = (typeof save.settings.volume === "number" ? save.settings.volume : 80) / 100;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type || "square"; o.frequency.value = freq;
  g.gain.value = (vol !== undefined ? vol : 0.05) * master;
  o.connect(g); g.connect(actx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
  o.stop(actx.currentTime + dur);
}
const sfx = {
  eat: () => beep(520, .08, "square", .05),
  bonus: () => beep(760, .12, "triangle", .06),
  coin: () => beep(980, .1, "triangle", .05),
  power: () => { beep(300, .05, "sawtooth", .05); setTimeout(() => beep(700, .12, "sawtooth", .06), 60); },
  crash: () => { beep(160, .3, "sawtooth", .07); setTimeout(() => beep(90, .35, "sawtooth", .06), 90); },
  select: () => beep(360, .05, "square", .03),
  levelup: () => { beep(660, .09, "triangle", .06); setTimeout(() => beep(880, .12, "triangle", .06), 80); setTimeout(() => beep(1100, .16, "triangle", .07), 160); },
  achievement: () => { beep(880, .08, "sine", .05); setTimeout(() => beep(1320, .18, "sine", .06), 90); },
  shield: () => beep(1200, .18, "sine", .06),
  combo: (n) => beep(500 + Math.min(n, 10) * 55, .06, "square", .035),
  claim: () => { beep(700, .07, "sine", .05); setTimeout(() => beep(1050, .1, "sine", .06), 70); setTimeout(() => beep(1400, .14, "sine", .06), 150); },
};

/* ======================= SKINS (80+, tiered, powers scale with price) =======================
   Each skin now carries a "pattern" (its surface texture language) and, from Epic tier up, an
   "anim" flag for a lightweight animated detail. Patterns + tier-based eye styles are what make
   skins genuinely distinct from each other rather than palette-swaps of one base look. */
const SKIN_NAME_A = ["Cyan","Violet","Neon","Plasma","Photon","Quantum","Volt","Prism","Nova","Pulse","Aurora","Spectra","Glitch","Vapor","Ion","Laser","Chrome","Astro","Lunar","Solar","Void","Comet","Nebula","Pixel","Circuit","Binary","Cobalt","Crystal","Electric","Frost","Indigo","Magenta","Orchid","Radiant","Static"];
const SKIN_NAME_B = ["Wave","Fang","Core","Drift","Flux","Shard","Byte","Surge","Rift","Fusion","Serpent","Coil","Viper","Racer","Streak","Blade","Spiral","Storm","Echo","Signal","Matrix","Beam","Orbit","Vortex","Ray","Grid","Cell","Spark","Zenith","Phantom"];
/* pattern pools — common/rare skins vary within a small set; epic+ get richer per-skin variety */
const PATTERNS_COMMON = ["stripe", "dot", "band"];
const PATTERNS_RARE = ["scale", "diamond", "chevron"];
const PATTERNS_EPIC = ["hex", "crystal", "circuit"];
const PATTERNS_LEGENDARY = ["fissure", "aurora", "rune"];
const PATTERNS_MYTHIC = ["plasma", "nebula", "prism"];
const SKIN_TIERS = [
  { key: "common",    label: "Common",    count: 24, price: [20, 190],     power: null,                              patterns: PATTERNS_COMMON,    anim: false, eyes: "dot" },
  { key: "rare",      label: "Rare",      count: 20, price: [220, 560],    power: { type: "coin",  value: 0.10 },    patterns: PATTERNS_RARE,      anim: false, eyes: "slit" },
  { key: "epic",      label: "Epic",      count: 15, price: [600, 1150],   power: { type: "score", value: 0.15 },    patterns: PATTERNS_EPIC,      anim: true,  eyes: "ring" },
  { key: "legendary", label: "Legendary", count: 12, price: [1250, 2450],  power: { type: "combo", value: 900 },     patterns: PATTERNS_LEGENDARY, anim: true,  eyes: "diamond" },
  { key: "mythic",    label: "Mythic",    count: 8,  price: [2600, 5200],  power: { type: "score", value: 0.30 },    patterns: PATTERNS_MYTHIC,    anim: true,  eyes: "pulse" },
];
function buildSkins() {
  const list = [{
    id: "horizon", name: "Cyan Horizon", price: 0, tier: "Starter", pattern: "band", anim: false, eyes: "dot",
    head: "#eafcff", body: ["#35e7ff", "#8b5cf6"], accent: "#eafcff", glow: "rgba(53,231,255,0.6)", power: null
  }];
  let idx = 0;
  SKIN_TIERS.forEach(tier => {
    for (let i = 0; i < tier.count; i++) {
      idx++;
      const h1 = bandHue(idx * 13), h2 = bandHue(idx * 13 + 55);
      const head = hsl2hex(h1, 70, 86);
      const c1 = hsl2hex(h1, 92, 60);
      const c2 = hsl2hex(h2, 92, 56);
      const accent = hsl2hex(bandHue(idx * 13 + 90), 85, 78);
      const price = Math.round(tier.price[0] + (tier.price[1] - tier.price[0]) * (tier.count > 1 ? i / (tier.count - 1) : 0));
      const name = SKIN_NAME_A[idx % SKIN_NAME_A.length] + " " + SKIN_NAME_B[(idx * 3) % SKIN_NAME_B.length];
      const pattern = tier.patterns[i % tier.patterns.length];
      list.push({
        id: tier.key + "_" + i, name, price, tier: tier.label,
        pattern, anim: tier.anim, eyes: tier.eyes, seed: idx,
        head, body: [c1, c2], accent, glow: `rgba(${hexToRgbStr(c1)},0.65)`, power: tier.power
      });
    }
  });
  return list;
}
const SKINS = buildSkins();
function skinById(id) { return SKINS.find(s => s.id === id) || SKINS[0]; }
function skinBodyColor(skin, i, total) {
  if (skin.body === "rainbow") return `hsl(${(performance.now() / 12 + i * 24) % 360} 90% 65%)`;
  if (Array.isArray(skin.body)) return lerpColor(skin.body[0], skin.body[1], total > 1 ? i / (total - 1) : 0);
  return skin.body;
}

/* ---- shared segment texture renderer: used by both the in-game snake and shop previews ----
   Draws inside the already-clipped/filled rounded-rect segment bounds (x,y,w,w). `i` is the
   segment index (0 = head), `seed` decorrelates neighboring skins so patterns don't tile identically. */
function paintSegmentPattern(sctx, x, y, w, skin, i, isHead, tnow) {
  const seed = skin.seed || 1;
  const accent = skin.accent || "#ffffff";
  sctx.save();
  sctx.beginPath();
  if (sctx.roundRect) sctx.roundRect(x, y, w, w, w * 0.32); else sctx.rect(x, y, w, w);
  sctx.clip();
  const cx = x + w / 2, cy = y + w / 2;
  const t = tnow || 0;
  switch (skin.pattern) {
    case "stripe": {
      sctx.strokeStyle = accent; sctx.globalAlpha = 0.4; sctx.lineWidth = w * 0.14;
      sctx.beginPath(); sctx.moveTo(x, y + w * 0.3); sctx.lineTo(x + w, y + w * 0.3);
      sctx.moveTo(x, y + w * 0.75); sctx.lineTo(x + w, y + w * 0.75); sctx.stroke();
      break;
    }
    case "dot": {
      sctx.fillStyle = accent; sctx.globalAlpha = 0.5;
      sctx.beginPath(); sctx.arc(cx, cy, w * 0.13, 0, 7); sctx.fill();
      break;
    }
    case "band": {
      sctx.fillStyle = accent; sctx.globalAlpha = (i % 2 === 0) ? 0.28 : 0.12;
      sctx.fillRect(x, y, w, w);
      break;
    }
    case "scale": {
      sctx.strokeStyle = accent; sctx.globalAlpha = 0.45; sctx.lineWidth = w * 0.06;
      const off = (i % 2) * w * 0.25;
      sctx.beginPath(); sctx.arc(cx - w * 0.25 + off, y, w * 0.3, 0, Math.PI); sctx.stroke();
      sctx.beginPath(); sctx.arc(cx + w * 0.25 + off, y, w * 0.3, 0, Math.PI); sctx.stroke();
      break;
    }
    case "diamond": {
      sctx.strokeStyle = accent; sctx.globalAlpha = 0.5; sctx.lineWidth = w * 0.07;
      sctx.beginPath(); sctx.moveTo(cx, y); sctx.lineTo(x + w, cy); sctx.lineTo(cx, y + w); sctx.lineTo(x, cy); sctx.closePath(); sctx.stroke();
      break;
    }
    case "chevron": {
      sctx.strokeStyle = accent; sctx.globalAlpha = 0.5; sctx.lineWidth = w * 0.09; sctx.lineCap = "round";
      sctx.beginPath(); sctx.moveTo(x, y + w * 0.2); sctx.lineTo(cx, y + w * 0.55); sctx.lineTo(x + w, y + w * 0.2); sctx.stroke();
      break;
    }
    case "hex": {
      sctx.strokeStyle = accent; sctx.globalAlpha = 0.5; sctx.lineWidth = w * 0.055;
      sctx.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k - Math.PI / 6; const px = cx + Math.cos(a) * w * 0.36, py = cy + Math.sin(a) * w * 0.36; k === 0 ? sctx.moveTo(px, py) : sctx.lineTo(px, py); }
      sctx.closePath(); sctx.stroke();
      break;
    }
    case "crystal": {
      sctx.fillStyle = accent; sctx.globalAlpha = 0.35;
      sctx.beginPath(); sctx.moveTo(cx, y); sctx.lineTo(x + w * 0.85, cy); sctx.lineTo(cx, y + w); sctx.lineTo(x + w * 0.15, cy); sctx.closePath(); sctx.fill();
      sctx.globalAlpha = 0.7; sctx.strokeStyle = accent; sctx.lineWidth = w * 0.03; sctx.stroke();
      break;
    }
    case "circuit": {
      sctx.strokeStyle = accent; sctx.globalAlpha = skin.anim ? (0.35 + Math.sin(t / 260 + seed + i) * 0.2) : 0.5; sctx.lineWidth = w * 0.06; sctx.lineCap = "round";
      sctx.beginPath(); sctx.moveTo(x + w * 0.2, y); sctx.lineTo(x + w * 0.2, cy); sctx.lineTo(x + w * 0.8, cy); sctx.lineTo(x + w * 0.8, y + w); sctx.stroke();
      break;
    }
    case "fissure": {
      const glow = 0.4 + Math.sin(t / 300 + seed + i * 0.7) * 0.3;
      sctx.strokeStyle = accent; sctx.globalAlpha = Math.max(0.15, glow); sctx.lineWidth = w * 0.08; sctx.lineCap = "round";
      sctx.beginPath(); sctx.moveTo(x, y + w * 0.15); sctx.lineTo(cx - w * 0.1, cy); sctx.lineTo(cx + w * 0.15, y + w * 0.7); sctx.lineTo(x + w, y + w * 0.85); sctx.stroke();
      break;
    }
    case "aurora": {
      const off = Math.sin(t / 400 + seed + i * 0.5) * w * 0.12;
      const grad = sctx.createLinearGradient(x, y + off, x + w, y + w + off);
      grad.addColorStop(0, "rgba(255,255,255,0)"); grad.addColorStop(0.5, accent); grad.addColorStop(1, "rgba(255,255,255,0)");
      sctx.globalAlpha = 0.4; sctx.fillStyle = grad; sctx.fillRect(x, y, w, w);
      break;
    }
    case "rune": {
      sctx.strokeStyle = accent; sctx.globalAlpha = 0.55 + Math.sin(t / 500 + seed + i) * 0.15; sctx.lineWidth = w * 0.055;
      sctx.beginPath(); sctx.moveTo(cx, y + w * 0.15); sctx.lineTo(cx, y + w * 0.85); sctx.moveTo(x + w * 0.25, cy); sctx.lineTo(x + w * 0.75, y + w * 0.3); sctx.stroke();
      break;
    }
    case "plasma": {
      const flow = (t / 220 + i * 0.8 + seed) % (Math.PI * 2);
      const grad = sctx.createLinearGradient(x, y, x + w * Math.cos(flow) * 0.5 + w / 2, y + w * Math.sin(flow) * 0.5 + w / 2);
      grad.addColorStop(0, "rgba(255,255,255,0.05)"); grad.addColorStop(0.5, accent); grad.addColorStop(1, "rgba(255,255,255,0.05)");
      sctx.globalAlpha = 0.55; sctx.fillStyle = grad; sctx.fillRect(x, y, w, w);
      break;
    }
    case "nebula": {
      sctx.globalAlpha = 0.5;
      for (let k = 0; k < 3; k++) {
        const a = t / 900 + seed + i * 1.3 + k * 2.1;
        const px = cx + Math.cos(a) * w * 0.28, py = cy + Math.sin(a) * w * 0.28;
        sctx.fillStyle = accent; sctx.beginPath(); sctx.arc(px, py, w * 0.05, 0, 7); sctx.fill();
      }
      break;
    }
    case "prism": {
      const shift = (t / 260 + i + seed) % 1;
      sctx.globalAlpha = 0.5; sctx.fillStyle = `hsl(${(shift * 360) % 360} 90% 70%)`;
      sctx.beginPath(); sctx.moveTo(cx, y); sctx.lineTo(x + w, y + w); sctx.lineTo(x, y + w); sctx.closePath(); sctx.fill();
      break;
    }
  }
  sctx.restore();
}

/* ---- eye styles by tier, applied at the head only ---- */
function paintSnakeEyes(sctx, cx, cy, exNorm, eyNorm, r, skin, tnow) {
  const t = tnow || 0;
  const spread = r * 2.1, fwd = r * 1.1;
  const e1x = cx - spread * 0.5 * (1 - Math.abs(exNorm)) + exNorm * fwd - eyNorm * spread * 0.5;
  const e1y = cy - spread * 0.5 * (1 - Math.abs(eyNorm)) + eyNorm * fwd - exNorm * -spread * 0.5;
  const pts = [
    { x: cx + exNorm * fwd - eyNorm * spread * 0.5, y: cy + eyNorm * fwd + exNorm * spread * 0.5 },
    { x: cx + exNorm * fwd + eyNorm * spread * 0.5, y: cy + eyNorm * fwd - exNorm * spread * 0.5 },
  ];
  pts.forEach(p => {
    sctx.save();
    switch (skin.eyes) {
      case "slit": {
        sctx.fillStyle = "#04121a"; sctx.beginPath();
        sctx.ellipse(p.x, p.y, r * 0.22, r * 0.11, Math.atan2(eyNorm, exNorm) + Math.PI / 2, 0, 7); sctx.fill();
        break;
      }
      case "ring": {
        sctx.strokeStyle = skin.accent || "#fff"; sctx.lineWidth = r * 0.12; sctx.globalAlpha = 0.9;
        sctx.beginPath(); sctx.arc(p.x, p.y, r * 0.22, 0, 7); sctx.stroke();
        sctx.fillStyle = "#04121a"; sctx.beginPath(); sctx.arc(p.x, p.y, r * 0.1, 0, 7); sctx.fill();
        break;
      }
      case "diamond": {
        sctx.fillStyle = skin.accent || "#fff"; sctx.shadowColor = skin.accent || "#fff"; sctx.shadowBlur = 4;
        sctx.beginPath(); sctx.moveTo(p.x, p.y - r * 0.22); sctx.lineTo(p.x + r * 0.16, p.y); sctx.lineTo(p.x, p.y + r * 0.22); sctx.lineTo(p.x - r * 0.16, p.y); sctx.closePath(); sctx.fill();
        break;
      }
      case "pulse": {
        const pulse = 0.6 + Math.sin(t / 180) * 0.4;
        sctx.fillStyle = skin.accent || "#fff"; sctx.shadowColor = skin.accent || "#fff"; sctx.shadowBlur = 6 * pulse;
        sctx.globalAlpha = 0.7 + pulse * 0.3;
        sctx.beginPath(); sctx.arc(p.x, p.y, r * (0.14 + pulse * 0.06), 0, 7); sctx.fill();
        break;
      }
      default: {
        sctx.fillStyle = "#04121a"; sctx.beginPath(); sctx.arc(p.x, p.y, r * 0.16, 0, 7); sctx.fill();
      }
    }
    sctx.restore();
  });
}

function drawSkinPreview(canvas, skin) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.clientWidth * 2, h = canvas.height = canvas.clientHeight * 2;
  ctx.clearRect(0, 0, w, h);
  const n = 6, cell = Math.min(w, h) / 4.6;
  const t = performance.now();
  for (let i = 0; i < n; i++) {
    const x = w / 2 - (n - 1) * cell * 0.42 + i * cell * 0.84, y = h / 2 + Math.sin(i * 0.9) * cell * 0.25;
    const isHead = i === n - 1;
    const color = isHead ? skin.head : skinBodyColor(skin, i, n - 1);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.shadowColor = skin.glow; ctx.shadowBlur = 14;
    const r = cell * 0.4;
    if (ctx.roundRect) ctx.roundRect(x - r, y - r, r * 2, r * 2, r * 0.6);
    else ctx.rect(x - r, y - r, r * 2, r * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    paintSegmentPattern(ctx, x - r, y - r, r * 2, skin, i, isHead, t);
    if (isHead) paintSnakeEyes(ctx, x, y, 1, 0, r, skin, t);
  }
}

/* ======================= BACKGROUNDS (40+, incl. custom upload) ======================= */
const BG_NAME_A = ["Dusk","Nebula","Cyber","Aurora","Quantum","Deep","Neon","Astral","Nova","Static","Violet","Cobalt","Electric","Lunar","Rift"];
const BG_NAME_B = ["Horizon","Skyline","Grid","Field","Void","Expanse","Drift","Waves","Circuit","Bloom","Haze","Prism","Zone","Signal"];
const BG_TIERS = [
  { key: "common",    count: 14, price: [50, 380],    power: null, treatment: "gradient" },
  { key: "rare",      count: 12, price: [420, 1150],  power: { type: "coin",  value: 0.05 }, treatment: "particles" },
  { key: "epic",      count: 8,  price: [1250, 2500],  power: { type: "score", value: 0.08 }, treatment: "sweep" },
  { key: "legendary", count: 4,  price: [2700, 3800],  power: { type: "score", value: 0.12 }, treatment: "grid" },
];
function buildBackgrounds() {
  const list = [{ id: "default", name: "Dusk Horizon", price: 0, tier: "Free", type: "gradient", treatment: "gradient", stops: ["#05040a", "#130a24", "#20122e"], power: null }];
  let idx = 0;
  BG_TIERS.forEach(tier => {
    for (let i = 0; i < tier.count; i++) {
      idx++;
      const h1 = bandHue(idx * 17), h2 = bandHue(idx * 17 + 60), h3 = bandHue(idx * 17 + 110);
      const price = Math.round(tier.price[0] + (tier.price[1] - tier.price[0]) * (tier.count > 1 ? i / (tier.count - 1) : 0));
      list.push({
        id: "bg_" + tier.key + "_" + i,
        name: BG_NAME_A[idx % BG_NAME_A.length] + " " + BG_NAME_B[(idx * 5) % BG_NAME_B.length],
        price, tier: tier.key, type: "gradient", treatment: tier.treatment,
        stops: [hsl2hex(h1, 55, 7), hsl2hex(h2, 65, 13), hsl2hex(h3, 70, 10)],
        power: tier.power
      });
    }
  });
  list.push({ id: "custom", name: "Upload Your Own", price: 4000, tier: "Custom", type: "upload", power: { type: "score", value: 0.05 } });
  return list;
}
const BACKGROUNDS = buildBackgrounds();
function backgroundById(id) { return BACKGROUNDS.find(b => b.id === id) || BACKGROUNDS[0]; }

function drawBackgroundPreview(canvas, bg, now) {
  const c = canvas.getContext("2d");
  const w = canvas.width = Math.max(160, canvas.clientWidth * 2);
  const h = canvas.height = Math.max(80, canvas.clientHeight * 2);
  const t = now || performance.now();
  const stops = bg.stops || ["#04050a", "#0e0a20", "#1a0f2a"];
  const g = c.createLinearGradient(0,0,w,h);
  g.addColorStop(0, stops[0]); g.addColorStop(.5, stops[1]); g.addColorStop(1, stops[2]);
  c.fillStyle = g; c.fillRect(0,0,w,h);
  c.save(); c.globalAlpha = .28;
  if (bg.treatment === "particles" || bg.treatment === "sweep" || bg.treatment === "grid") {
    for (let i=0;i<18;i++) {
      const x=(i*37 + Math.sin(t/2400+i)*18) % w, y=(i*53 + Math.cos(t/1900+i)*12) % h;
      c.fillStyle = i%2 ? "#35e7ff" : "#b57bff"; c.beginPath(); c.arc(x,y,1.4+(i%3),0,Math.PI*2); c.fill();
    }
  }
  if (bg.treatment === "sweep") {
    const x=((t/16)%(w+160))-80; const lg=c.createLinearGradient(x,0,x+90,0);
    lg.addColorStop(0,"rgba(53,231,255,0)"); lg.addColorStop(.5,"rgba(53,231,255,.28)"); lg.addColorStop(1,"rgba(53,231,255,0)");
    c.fillStyle=lg; c.fillRect(x,0,90,h);
  }
  if (bg.treatment === "grid") {
    c.strokeStyle="rgba(180,220,255,.22)"; c.lineWidth=1;
    const off=(t/24)%24;
    for(let x=-24+off;x<w+24;x+=24){c.beginPath();c.moveTo(x,0);c.lineTo(x+h*.35,h);c.stroke();}
    for(let y=off;y<h;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  }
  c.restore();
}

/* ======================= TRAILS (cosmetic shop #3) ======================= */
const TRAILS = [
  { id: "none",         name: "No Trail",      price: 0,    color: null },
  { id: "trail_cyan",   name: "Cyan Trail",    price: 120,  color: "#35e7ff" },
  { id: "trail_purple", name: "Violet Trail",  price: 120,  color: "#8b5cf6" },
  { id: "trail_pink",   name: "Magenta Trail", price: 300,  color: "#ff5fa2" },
  { id: "trail_ice",    name: "Ice Trail",     price: 300,  color: "#8fd3ff" },
  { id: "trail_toxic",  name: "Toxic Trail",   price: 450,  color: "#7CFF6B" },
  { id: "trail_ember",  name: "Ember Trail",   price: 450,  color: "#ff9d3d" },
  { id: "trail_gold",   name: "Aurum Trail",   price: 700,  color: "#ffd166" },
  { id: "trail_shadow", name: "Shadow Trail",  price: 900,  color: "#c9a6ff" },
  { id: "trail_plasma", name: "Plasma Trail",  price: 1500, color: "#ff2fd6" },
  { id: "trail_prism",  name: "Prism Trail",   price: 2200, color: "rainbow" },
];
function trailById(id) { return TRAILS.find(t => t.id === id) || TRAILS[0]; }

/* ======================= MAPS (30+, procedurally laid out) ======================= */
const GRID_COLS = 24, GRID_ROWS = 24;
function inSafeZone(x, y) { return Math.abs(x - 12) <= 6 && Math.abs(y - 12) <= 3; }
function filterSafe(cells) {
  const seen = new Set(), out = [];
  cells.forEach(c => {
    if (c.x < 0 || c.x >= GRID_COLS || c.y < 0 || c.y >= GRID_ROWS) return;
    if (inSafeZone(c.x, c.y)) return;
    const k = c.x + "," + c.y;
    if (!seen.has(k)) { seen.add(k); out.push(c); }
  });
  return out.slice(0, 130);
}
function mapBorder(gap) {
  const c = [];
  for (let x = 0; x < GRID_COLS; x++) { if (x % gap !== 0) { c.push({ x, y: 0 }); c.push({ x, y: GRID_ROWS - 1 }); } }
  for (let y = 0; y < GRID_ROWS; y++) { if (y % gap !== 0) { c.push({ x: 0, y }); c.push({ x: GRID_COLS - 1, y }); } }
  return c;
}
function mapPillars(spacing) {
  const c = [];
  for (let x = spacing; x < GRID_COLS; x += spacing) for (let y = spacing; y < GRID_ROWS; y += spacing) c.push({ x, y });
  return c;
}
function mapCheckerboard(step) {
  const c = [];
  for (let x = 0; x < GRID_COLS; x += step) for (let y = 0; y < GRID_ROWS; y += step) if (((x / step) + (y / step)) % 2 === 0) c.push({ x, y });
  return c;
}
function mapRings(count) {
  const c = [];
  for (let r = 4; r <= 4 + count * 3; r += 3) for (let a = 0; a < 360; a += 15) {
    const rad = a * Math.PI / 180;
    c.push({ x: Math.round(12 + Math.cos(rad) * r), y: Math.round(12 + Math.sin(rad) * r) });
  }
  return c;
}
function mapCross(thick) {
  const c = [];
  for (let x = 0; x < GRID_COLS; x++) for (let t = 0; t < thick; t++) c.push({ x, y: 11 + t });
  for (let y = 0; y < GRID_ROWS; y++) for (let t = 0; t < thick; t++) c.push({ x: 11 + t, y });
  return c;
}
function mapDiagonal(step) {
  const c = [];
  for (let i = 0; i < GRID_COLS; i += step) { c.push({ x: i, y: i }); c.push({ x: GRID_COLS - 1 - i, y: i }); }
  return c;
}
function mapZigzag(gap) {
  const c = [];
  for (let y = 2; y < GRID_ROWS; y += gap) for (let x = 0; x < GRID_COLS; x++) if ((x + y) % 5 === 0) c.push({ x, y });
  return c;
}
function seededRand(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function mapScatter(seed, count) {
  const rnd = seededRand(seed), c = [];
  for (let i = 0; i < count; i++) c.push({ x: Math.floor(rnd() * GRID_COLS), y: Math.floor(rnd() * GRID_ROWS) });
  return c;
}
function mapCorners(size) {
  const c = [];
  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) {
    c.push({ x, y }); c.push({ x: GRID_COLS - 1 - x, y }); c.push({ x, y: GRID_ROWS - 1 - y }); c.push({ x: GRID_COLS - 1 - x, y: GRID_ROWS - 1 - y });
  }
  return c;
}
function mapSideWalls(gap) {
  const c = [];
  for (let y = 0; y < GRID_ROWS; y++) if (y % gap !== 0) { c.push({ x: 3, y }); c.push({ x: GRID_COLS - 4, y }); }
  return c;
}
const MAP_DEFS = [
  { id: "open",       name: "Open Field",         build: () => [] },
  { id: "border1",    name: "Ringwalls I",        build: () => mapBorder(2) },
  { id: "border2",    name: "Ringwalls II",       build: () => mapBorder(3) },
  { id: "border3",    name: "Ringwalls III",      build: () => mapBorder(4) },
  { id: "pillars1",   name: "Pillars Sparse",     build: () => mapPillars(6) },
  { id: "pillars2",   name: "Pillars Medium",     build: () => mapPillars(5) },
  { id: "pillars3",   name: "Pillars Dense",      build: () => mapPillars(4) },
  { id: "pillars4",   name: "Pillars Tight",      build: () => mapPillars(3) },
  { id: "checker1",   name: "Checkerboard I",     build: () => mapCheckerboard(4) },
  { id: "checker2",   name: "Checkerboard II",    build: () => mapCheckerboard(3) },
  { id: "checker3",   name: "Checkerboard III",   build: () => mapCheckerboard(2) },
  { id: "rings1",     name: "Nebula Rings I",     build: () => mapRings(2) },
  { id: "rings2",     name: "Nebula Rings II",    build: () => mapRings(3) },
  { id: "rings3",     name: "Nebula Rings III",   build: () => mapRings(4) },
  { id: "cross1",     name: "Crosshair Thin",     build: () => mapCross(1) },
  { id: "cross2",     name: "Crosshair Thick",    build: () => mapCross(2) },
  { id: "diag1",      name: "Diagonal Rift I",    build: () => mapDiagonal(3) },
  { id: "diag2",      name: "Diagonal Rift II",   build: () => mapDiagonal(2) },
  { id: "zigzag1",    name: "Zigzag Circuit I",   build: () => mapZigzag(4) },
  { id: "zigzag2",    name: "Zigzag Circuit II",  build: () => mapZigzag(3) },
  { id: "corners1",   name: "Corner Blocks I",    build: () => mapCorners(2) },
  { id: "corners2",   name: "Corner Blocks II",   build: () => mapCorners(3) },
  { id: "corners3",   name: "Corner Blocks III",  build: () => mapCorners(4) },
  { id: "sidewalls1", name: "Twin Channels I",    build: () => mapSideWalls(3) },
  { id: "sidewalls2", name: "Twin Channels II",   build: () => mapSideWalls(2) },
  { id: "scatter1",   name: "Asteroid Field I",   build: () => mapScatter(11, 18) },
  { id: "scatter2",   name: "Asteroid Field II",  build: () => mapScatter(42, 26) },
  { id: "scatter3",   name: "Asteroid Field III", build: () => mapScatter(77, 34) },
  { id: "scatter4",   name: "Asteroid Field IV",  build: () => mapScatter(103, 42) },
  { id: "scatter5",   name: "Asteroid Field V",   build: () => mapScatter(158, 50) },
  { id: "combo1",     name: "Fractured Grid I",   build: () => [...mapPillars(6), ...mapScatter(23, 10)] },
  { id: "combo2",     name: "Fractured Grid II",  build: () => [...mapCross(1), ...mapCorners(2)] },
  { id: "combo3",     name: "Fractured Grid III", build: () => [...mapRings(2), ...mapScatter(64, 12)] },
  { id: "combo4",     name: "Chaos Chamber",      build: () => [...mapCheckerboard(3), ...mapDiagonal(4)] },
];
function mapObstacles(id) {
  const def = MAP_DEFS.find(m => m.id === id) || MAP_DEFS[0];
  return filterSafe(def.build());
}

/* ======================= DIFFICULTY ======================= */
const SPEED_MS = { slow: 150, normal: 105, fast: 72, extreme: 50 };
const DIFFICULTY_EXTRA_OBSTACLES = { none: 0, low: 4, medium: 10, high: 18 };

/* ======================= POWERS (from equipped skin + background) ======================= */
function activePowerBoosts() {
  const skin = skinById(save.selectedSkin);
  const bg = backgroundById(save.selectedBackground);
  let scoreBoost = 0, coinBoost = 0, comboExtendMs = 0;
  [skin && skin.power, bg && bg.power].forEach(p => {
    if (!p) return;
    if (p.type === "score") scoreBoost += p.value;
    if (p.type === "coin") coinBoost += p.value;
    if (p.type === "combo") comboExtendMs += p.value;
  });
  return { scoreBoost, coinBoost, comboExtendMs };
}

/* polyfill roundRect just in case */
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

/* ======================= small shared UI helpers ======================= */
function fmtCoins(n) { return n + " ¢"; }

function showToast(layerEl, title, subtitle, colorVar) {
  if (!layerEl) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<b style="color:var(${colorVar || "--gold"})">${title}</b><span>${subtitle || ""}</span>`;
  layerEl.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

/* ======================= background image upload (resize + compress) ======================= */
function readImageFileAsBackground(file, maxSize, cb) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const cx = c.getContext("2d");
      cx.drawImage(img, 0, 0, c.width, c.height);
      try {
        const dataUrl = c.toDataURL("image/jpeg", 0.72);
        cb(null, dataUrl);
      } catch (err) { cb(err); }
    };
    img.onerror = () => cb(new Error("Could not read image"));
    img.src = e.target.result;
  };
  reader.onerror = () => cb(new Error("Could not read file"));
  reader.readAsDataURL(file);
}
