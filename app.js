// ─── SABİTLER & AYARLAR ──────────────────────────────────────────────────────
const LOCATION_MAP = { "1002": 'Lymhurst', "3008": 'Martlock', "2004": 'Bridgewatch', "4002": 'Fort Sterling', "0007": 'Thetford', "7": 'Thetford', "5003": 'Brecilien', "3003": 'Caerleon', "Black Market": 'Black Market', "MARTLOCK": 'Martlock', "BRIDGEWATCH": 'Bridgewatch', "FORTSTERLING": 'Fort Sterling', "LYMHURST": 'Lymhurst', "THETFORD": 'Thetford', "BRECILIEN": 'Brecilien', "CAERLEON": 'Caerleon' };
const CAPE_TYPES = { "KEEPER": 'Keeper', "UNDEAD": 'Undead', "MORGANA": 'Morgana' };
const CITY_COLORS = {
  'Lymhurst': '#4ade80',
  'Bridgewatch': '#fb923c',
  'Martlock': '#60a5fa',
  'Fort Sterling': '#a5a5c2',
  'Thetford': '#c084fc',
  'Brecilien': '#f3f4f6',
  'Caerleon': '#ef4444',
  'Black Market': '#ef4444'
};
const QUALITY_NAMES = { 1:'Normal', 2:'Good', 3:'Outstanding', 4:'Excellent', 5:'Masterpiece' };
const TIERS = [4, 5, 6, 7, 8];
const ENCHANTS = [0, 1, 2, 3, 4];
const RESOURCES = ['Plank', 'Bar', 'Leather', 'Cloth'];
const ARTIFACTS = ['Rune', 'Soul', 'Relic']; 
const RESOURCE_ENCHANTS = [0, 1, 2, 3];
const ALBION_ICON_RENDER_SIZE = 128;
const ALBION_ITEM_ICON_RENDER_SIZE = 217;
const RESOURCE_RENDER_IDS = { plank: 'PLANKS', bar: 'METALBAR', leather: 'LEATHER', cloth: 'CLOTH' };
const ARTIFACT_TIER_COLORS = {
  4: '#60a5fa',
  5: '#f87171',
  6: '#fb923c',
  7: '#facc15',
  8: '#f3f4f6'
};
const ENCHANT_SELECT_COLORS = {
  0: '#f3f4f6',
  1: '#4ade80',
  2: '#60a5fa',
  3: '#c084fc'
};
const CRAFTING_COMPARE_CITIES = ['Bridgewatch', 'Martlock', 'Lymhurst', 'Fort Sterling', 'Thetford'];
const FARM_FORM_STORAGE_KEY = 'albionFarmFormValues';
const FARM_SHARED_STORAGE_KEY = 'albionFarmSharedValues';
const FLIPPER_SALE_MODE_STORAGE_KEY = 'albionFlipperSaleModeState';
const FLIPPER_PROFIT_LOG_STORAGE_KEY = 'albionFlipperProfitLog';
const CRAFT_TOP_PROFIT_HIDDEN_STORAGE_KEY = 'albionCraftTopProfitHidden';
const CRAFT_QUANTITY_STORAGE_KEY = 'albionCraftQuantityByItem';
const LANGUAGE_STORAGE_KEY = 'albionLanguagePreference';
const ALBION_DATA_API_HOST = 'https://europe.albion-online-data.com';
const FARM_PRICE_LOCATIONS = ['Bridgewatch', 'Martlock', 'Lymhurst', 'Fort Sterling', 'Thetford', 'Brecilien'];
const FARM_MAX_FOCUS_POOL = 30000;
const FLIPPER_INITIAL_RENDER_COUNT = 30;
const FLIPPER_RENDER_STEP = 30;
const TOTAL_PROFIT_INITIAL_RENDER_COUNT = 8;
const TOTAL_PROFIT_RENDER_STEP = 8;
let pendingUpdateInfo = null;
let licenseStatusPollTimer = null;

const UPDATE_UI_TEXT = {
  tr: {
    badge: 'YENİ SÜRÜM',
    title: 'Yeni sürüm hazır',
    subtitle: 'Uygulamanın daha güncel sürümü indirilmeye hazır.',
    current: 'Mevcut',
    latest: 'Yeni',
    notes: 'Sürüm Notları',
    changelog: 'Yapılan Değişiklikler',
    later: 'Daha Sonra',
    download: 'Güncellemeyi İndir'
  },
  en: {
    badge: 'NEW VERSION',
    title: 'New version available',
    subtitle: 'A newer build of the desktop app is ready to download.',
    current: 'Current',
    latest: 'Latest',
    notes: 'Release notes',
    changelog: 'Changelog',
    later: 'Later',
    download: 'Download Update'
  }
};

function hexToRgba(hex, alpha = 1) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getArtifactIconHtml(artifactName, tier, extraClass = '') {
  const className = ['artifact-image', extraClass].filter(Boolean).join(' ');
  return `<img src="icons/${artifactName}-T${tier}.png" alt="" class="${className}" aria-hidden="true">`;
}

function getResourceIconHtml(resourceName, extraClass = '') {
  const className = ['artifact-image', extraClass].filter(Boolean).join(' ');
  return `<img src="icons/${resourceName}.png" alt="" class="${className}" aria-hidden="true">`;
}

function getAlbionRenderPath(itemId) {
  if (!itemId) return '';
  if (itemId.includes('@')) return itemId;
  const levelMatch = itemId.match(/_LEVEL(\d+)$/);
  if (levelMatch) return `${itemId}@${levelMatch[1]}`;
  return `${itemId}@0`;
}

function getAlbionIconUrl(itemId, size = ALBION_ICON_RENDER_SIZE, quality = 0) {
  const renderPath = getAlbionRenderPath(itemId);
  if (!renderPath) return '';
  return `https://render.albiononline.com/v1/item/${renderPath}.png?quality=${quality}&size=${size}&locale=en`;
}

function getAlbionIconHtml(itemId, extraClass = '', size = ALBION_ICON_RENDER_SIZE, options = {}) {
  const iconUrl = getAlbionIconUrl(itemId, size);
  const fallbackUrl = getAlbionIconUrl(itemId, 128);
  const enchantMatch = itemId ? itemId.match(/(?:@|_LEVEL)(\d+)/) : null;
  const enchantClass = enchantMatch ? `ench-${enchantMatch[1]}` : 'ench-0';
  const className = ['albion-icon', extraClass, enchantClass].filter(Boolean).join(' ');
  const loading = options.loading || 'lazy';
  const fetchPriority = options.fetchPriority || 'auto';
  return iconUrl
    ? `<img src="${iconUrl}" alt="" class="${className}" aria-hidden="true" loading="${loading}" fetchpriority="${fetchPriority}" decoding="async" onerror="if(this.dataset.fallback!=='done'){this.dataset.fallback='done';this.src='${fallbackUrl}';}">`
    : '';
}

function preloadFlipperVisibleIcons(items, count = 40) {
  items.slice(0, count).forEach(item => {
    preloadIconUrl(getAlbionIconUrl(item.rawId, 64));
  });
}

function getArtifactChain(enchant) {
  return ARTIFACTS.slice(0, Math.max(0, enchant));
}

function getArtifactRequirement(baseId) {
  if (!baseId) return 0;
  if (baseId.includes("_2H")) return 384;
  if (baseId.includes("_MAIN")) return 288;
  if (baseId.includes("_ARMOR") || baseId.includes("_BAG")) return 192;
  if (baseId.includes("_HEAD") || baseId.includes("_SHOES") || baseId.includes("_CAPE") || baseId.includes("CAPEITEM") || baseId.includes("_OFF")) return 96;
  return 0;
}

const CONSUMABLE_ENCHANT_COUNTS = {
  // Potions - high extract recipes
  'T3_POTION_MOB_RESET': 10, 'T5_POTION_MOB_RESET': 30, 'T7_POTION_MOB_RESET': 90,
  'T3_POTION_ACID': 10, 'T5_POTION_ACID': 30, 'T7_POTION_ACID': 90,
  // Potions - standard extract recipes
  'T2_POTION_ENERGY': 5, 'T4_POTION_ENERGY': 15, 'T6_POTION_ENERGY': 45,
  'T2_POTION_HEAL': 5, 'T4_POTION_HEAL': 15, 'T6_POTION_HEAL': 45,
  'T3_POTION_REVIVE': 5, 'T5_POTION_REVIVE': 15, 'T7_POTION_REVIVE': 45,
  'T3_POTION_STONESKIN': 5, 'T5_POTION_STONESKIN': 15, 'T7_POTION_STONESKIN': 45,
  'T3_POTION_CLEANSE2': 5, 'T5_POTION_CLEANSE2': 15, 'T7_POTION_CLEANSE2': 45,
  'T3_POTION_SLOWFIELD': 5, 'T5_POTION_SLOWFIELD': 15, 'T7_POTION_SLOWFIELD': 45,
  'T4_POTION_COOLDOWN': 5, 'T6_POTION_COOLDOWN': 15, 'T8_POTION_COOLDOWN': 45,
  'T4_POTION_GATHER': 5, 'T6_POTION_GATHER': 15, 'T8_POTION_GATHER': 45,
  'T4_POTION_LAVA': 5, 'T6_POTION_LAVA': 15, 'T8_POTION_LAVA': 45,
  'T4_POTION_BERSERK': 5, 'T6_POTION_BERSERK': 15, 'T8_POTION_BERSERK': 45,
  // Soups
  'T1_MEAL_SOUP': 10, 'T3_MEAL_SOUP': 30, 'T5_MEAL_SOUP': 90,
  'T1_MEAL_SOUP_FISH': 3, 'T3_MEAL_SOUP_FISH': 9, 'T5_MEAL_SOUP_FISH': 27,
  // Omelettes
  'T3_MEAL_OMELETTE_AVALON': 10, 'T5_MEAL_OMELETTE_AVALON': 30, 'T7_MEAL_OMELETTE_AVALON': 90,
  'T3_MEAL_OMELETTE': 10, 'T5_MEAL_OMELETTE': 30, 'T7_MEAL_OMELETTE': 90,
  'T3_MEAL_OMELETTE_FISH': 3, 'T5_MEAL_OMELETTE_FISH': 9, 'T7_MEAL_OMELETTE_FISH': 27,
  // Pies & Salads
  'T7_MEAL_PIE': 90,
  'T4_MEAL_SALAD_FISH': 9, 'T6_MEAL_SALAD_FISH': 27, 'T6_MEAL_SALAD': 90,
  // Sandwiches
  'T4_MEAL_SANDWICH_AVALON': 10, 'T6_MEAL_SANDWICH_AVALON': 30, 'T8_MEAL_SANDWICH_AVALON': 90,
  'T4_MEAL_SANDWICH': 10, 'T6_MEAL_SANDWICH': 30, 'T8_MEAL_SANDWICH': 90,
  'T4_MEAL_SANDWICH_FISH': 3, 'T6_MEAL_SANDWICH_FISH': 9, 'T8_MEAL_SANDWICH_FISH': 27,
  // Stews
  'T4_MEAL_STEW_AVALON': 10, 'T6_MEAL_STEW_AVALON': 30, 'T8_MEAL_STEW_AVALON': 90,
  'T4_MEAL_STEW': 10, 'T6_MEAL_STEW': 30, 'T8_MEAL_STEW': 90,
  'T4_MEAL_STEW_FISH': 3, 'T6_MEAL_STEW_FISH': 9, 'T8_MEAL_STEW_FISH': 27,
  // Roasts
  'T5_MEAL_ROAST': 30, 'T7_MEAL_ROAST': 90,
  'T5_MEAL_ROAST_FISH': 9, 'T7_MEAL_ROAST_FISH': 27
};

function getConsumableEnchantCount(baseId, tier) {
  if (CONSUMABLE_ENCHANT_COUNTS[baseId] !== undefined) {
    return CONSUMABLE_ENCHANT_COUNTS[baseId];
  }

  const t = parseInt(tier, 10);
  if (t >= 7) return 90;
  if (t >= 5) return 30;
  return 10;
}

function isConsumableResource(itemId) {
  if (!itemId) return false;
  const id = String(itemId).split('@')[0].toUpperCase();
  return /^(QUESTITEM_.+|T\d+_ALCHEMY_RARE_.+|T\d+_(AGARIC|COMFREY|BURDOCK|TEASEL|FOXGLOVE|MULLEIN|YARROW|CARROT|BEAN|WHEAT|TURNIP|CABBAGE|POTATO|CORN|PUMPKIN|EGG|MILK|MEAT|ALCOHOL|FLOUR|BUTTER)|T1_FISHSAUCE_LEVEL\d|T1_ALCHEMY_EXTRACT_LEVEL\d|T\d+_FISH_FRESHWATER_.+|T\d+_FISH_SALTWATER_.+|T1_SEAWEED|T1_FISHCHOPS)$/.test(id);
}

function isCraftRrrExcludedMaterial(itemId) {
  if (!itemId) return false;
  const id = String(itemId).split('@')[0].toUpperCase();
  return /^QUESTITEM_/.test(id) || /^T\d+_ALCHEMY_RARE_/.test(id);
}

function formatResourceDisplayName(itemId) {
  if (itemId.includes('ALCHEMY_EXTRACT_LEVEL')) {
    const match = itemId.match(/LEVEL(\d+)/);
    return `T1 Arcane Extract .${match ? match[1] : 0}`;
  }
  if (itemId.includes('FISHSAUCE_LEVEL')) {
    const match = itemId.match(/LEVEL(\d+)/);
    return `T1 Fish Sauce .${match ? match[1] : 0}`;
  }
  const match = itemId.match(/^T(\d+)_(METALBAR|PLANKS|LEATHER|CLOTH)(?:_LEVEL(\d+))?$/);
  if (!match) return itemId.replace(/_/g, ' ');

  const tier = match[1];
  const enchant = match[3] || '0';
  const resourceLabelMap = {
    METALBAR: 'Bars',
    PLANKS: 'Planks',
    LEATHER: 'Leather',
    CLOTH: 'Cloth'
  };
  const resourceName = resourceLabelMap[match[2]] || match[2];
  return `T${tier}.${enchant} ${resourceName}`;
}

function normalizeResourceType(type) {
  if (type === 'metalbar') return 'bar';
  if (type === 'planks') return 'plank';
  return type.toLowerCase();
}

function parseMarketResourceItemId(itemId) {
  if (!itemId) return null;

  const cleanId = itemId.split('@')[0];
  const match = cleanId.match(/^T(\d+)_(METALBAR|PLANKS|LEATHER|CLOTH|RUNE|SOUL|RELIC)(?:_LEVEL(\d+))?$/i);
  if (!match) return null;

  return {
    tier: match[1],
    type: normalizeResourceType(match[2]),
    enchant: match[3] ? parseInt(match[3], 10) || 0 : 0
  };
}

function isProductionArtifactItem(itemId) {
  if (!itemId) return false;
  return itemId.toUpperCase().includes('_ARTEFACT_');
}

function getArtifactPriceKey(tier, enchantLevel) {
  return `artifact_price_${tier}_${enchantLevel}`;
}

function getArtifactFallbackPrice(tier, enchantLevel) {
  const artifactItemId = getArtifactMarketItemId(tier, enchantLevel);
  if (artifactItemId && manualCraftPriceOverrides[artifactItemId] != null) {
    return parseFloat(manualCraftPriceOverrides[artifactItemId]) || 0;
  }
  return parseFloat(resourcePrices[getArtifactPriceKey(tier, enchantLevel)]) || 0;
}

function getResourceItemId(tier, resourceType, enchant = 0) {
  const normalizedType = normalizeResourceType(resourceType);
  const renderType = RESOURCE_RENDER_IDS[normalizedType];
  if (!renderType) return '';
  return enchant > 0 ? `T${tier}_${renderType}_LEVEL${enchant}` : `T${tier}_${renderType}`;
}

function getMaterialSummaryIconHtml(itemId) {
  const parsedResource = parseMarketResourceItemId(itemId);
  if (parsedResource && ['rune', 'soul', 'relic'].includes(parsedResource.type)) {
    const artifactName = parsedResource.type.charAt(0).toUpperCase() + parsedResource.type.slice(1);
    return getArtifactIconHtml(artifactName, parsedResource.tier, 'material-summary-icon');
  }
  return getAlbionIconHtml(itemId, 'material-summary-icon', 64);
}

// ─── DURUM (STATE) ───────────────────────────────────────────────────────────
let flipperItemMap = new Map();
let craftingItemMap = new Map();
let itemMap = flipperItemMap;
let itemNameMap = new Map();
let recipesMap = new Map(); 
let resourcePrices = {}; 
let resourcePricesByCity = {};
let marketDepthByCity = {};
let manualCraftPriceOverrides = {};
let availableCraftingItems = []; 
let ws = null;
let sortKey = 'profit';
let sortDir = -1;
let showIncomplete = false;
let currentPage = 'flipper';
let customSelectValues = {};
let renderTimer = null; // DOM Optimizasyonu için zamanlayıcı
let orderProcessTimer = null;
let pendingOrdersBuffer = [];
let preloadedIconUrls = new Set();
let selectedFlipperRowKey = null;
let selectedCityProfitQualityState = 1;
let selectedFarmModeState = 'farm';
let selectedCraftModeState = 'equipment';
let renderedCraftModeState = 'equipment';
let craftModeFormState = {};
let selectedAnimalSubModeState = 'pasture';
let selectedFarmItemState = 'Carrot Seeds';
let farmFormValues = {};
let farmSharedValues = {};
let farmFocusedInputState = null;
let farmBonusRenderTimer = null;
let farmPriceFetchLoading = false;
let lastAdcStatusKey = '';
let lastBridgeStatusKey = '';
let copiedFlipperRowKeys = new Set();
let recentCopiedFlipperRowKeys = new Set();
let copiedFlipperBadgeTimers = new Map();
let flipperVisibleCount = FLIPPER_INITIAL_RENDER_COUNT;
let potionsAndFoods = { potions: [], foods: [] };
let loadedConsumables = false;
let craftPriceFetchLoading = false;
let totalProfitVisibleCount = TOTAL_PROFIT_INITIAL_RENDER_COUNT;
let lastFilteredFlipperData = [];
let lastSelectedEnchantSignature = '';
let flipperSaleModeState = {};
let flipperProfitLog = [];
let currentLanguage = 'tr';
let translationMapEnToTr = {};
let translationMapTrToEn = {};
let translationObserver = null;
let isApplyingTranslations = false;
let craftQuantityManualOverride = false;
let craftAnalysisFrame = null;
let licenseEntitlements = {
  package_code: 'restricted',
  modules: { flipper: false, crafting: false, island: false },
  flip: {
    max_visible_profit: 0,
    total_visible_profit_limit: 0,
    can_edit_profit_filters: false,
    can_use_basic_profit_filters: false,
    can_use_direct_action: false,
    can_view_flip_summary: false,
    can_view_enchant_detail: false
  }
};
const BUILTIN_TRANSLATIONS = {
  enToTr: {
    Inputs: 'Girdileri',
    Price: 'Fiyatı',
    Level: 'Seviyesi',
    Count: 'Adedi',
    'Farmer Level': 'Çiftçi Seviyesi',
    Baby: 'Yavru',
    Tame: 'Evcil',
    times: 'kez',
    plants: 'bitki',
    meat: 'et',
    Plant: 'Bitki',
    Meat: 'Et',
    Results: 'Sonuçları',
    Wheat: 'Buğday',
    Bean: 'Fasulye',
    Carrot: 'Havuç',
    'Carrot Seeds': 'Havuç Tohumu',
    'Bean Seeds': 'Fasulye Tohumu',
    'Wheat Seeds': 'Buğday Tohumu',
    Turnip: 'Turp',
    'Turnip Seeds': 'Turp Tohumu',
    Cabbage: 'Lahana',
    'Cabbage Seeds': 'Lahana Tohumu',
    Potato: 'Patates',
    'Potato Seeds': 'Patates Tohumu',
    Corn: 'Mısır',
    'Corn Seeds': 'Mısır Tohumu',
    Pumpkin: 'Balkabağı',
    'Pumpkin Seeds': 'Balkabağı Tohumu',
    'Arcane Agaric': 'Gizemli Mantar',
    'Arcane Agaric Seeds': 'Gizemli Mantar Tohumu',
    'Brightleaf Comfrey': 'Parlak Yapraklı Karakafes Otu',
    'Brightleaf Comfrey Seeds': 'Parlak Yapraklı Karakafes Otu Tohumu',
    'Crenellated Burdock': 'Tırtıklı Dulavrat Otu',
    'Crenellated Burdock Seeds': 'Tırtıklı Dulavrat Otu Tohumu',
    'Dragon Teasel': 'Ejderha Fırçaotu',
    'Dragon Teasel Seeds': 'Ejderha Fırçaotu Tohumu',
    'Elusive Foxglove': 'Ele Geçmez Yüksük Otu',
    'Elusive Foxglove Seeds': 'Ele Geçmez Yüksük Otu Tohumu',
    'Firetouched Mullein': 'Ateş Dokunuşlu Sığırkuyruğu',
    'Firetouched Mullein Seeds': 'Ateş Dokunuşlu Sığırkuyruğu Tohumu',
    'Ghoul Yarrow': 'Gulyabani Civanperçemi',
    'Ghoul Yarrow Seeds': 'Gulyabani Civanperçemi Tohumu',
    'Total Net Profit': 'Toplam Net Kâr',
    '1 Slot Focus': '1 Alan Odak',
    'Planting Capacity': 'Ekim Kapasitesi',
    'Current Total Slots': 'Toplam Alan',
    'Dry Seed Yield': 'Susuz Tohum Verimi',
    'Watered Seed Yield': 'Sulu Tohum Verimi',
    'Watering Bonus': 'Sulama Bonusu',
    'Planting Mix': 'Ekim Dagilimi',
    'Watered slots use focus, dry slots use base yield': 'Sulu alanlar odak kullanir, susuz alanlar temel verimle calisir',
    Watered: 'Sulu',
    Dry: 'Susuz',
    'Watered / Focused Slots': 'Sulu / Odakli Alanlar',
    'Dry / Unfocused Slots': 'Susuz / Odaksiz Alanlar',
    'Product Yield +%10': 'Urun Verimi +%10',
    'Craft Calculator': 'Craft Hesaplayıcı',
    'Island Calculator': 'Ada Hesaplayıcı',
    Crop: 'Mahsuller',
    Herbs: 'Bitkiler',
    Animal: 'Hayvanlar',
    Chicken: 'Tavuk',
    Goat: 'Keçi',
    Goose: 'Kaz',
    Sheep: 'Koyun',
    Pig: 'Domuz',
    Cow: 'İnek',
    'Hen Egg': 'Tavuk Yumurtası',
    "Goat's Milk": 'Keçi Sütü',
    'Goose Egg': 'Kaz Yumurtası',
    "Sheep's Milk": 'Koyun Sütü',
    "Cow's Milk": 'İnek Sütü',
    'Raw Chicken': 'Tavuk Eti',
    'Raw Goat': 'Keçi Eti',
    'Raw Goose': 'Kaz Eti',
    'Raw Mutton': 'Koyun Eti',
    'Raw Pork': 'Domuz Eti',
    'Raw Beef': 'Sığır Eti',
    'Animal Product Info': 'Hayvan Ürün Bilgisi',
    Byproduct: 'Yan Ürün',
    'Byproduct Price': 'Yan Ürün Fiyatı',
    'First Cycle Profit': 'İlk Döngü Kârı',
    'Daily Production Profit': 'Günlük Üretim Kârı',
    'Production Days': 'Üretim Günü',
    'Planned Production Profit': 'Planlanan Üretim Kârı',
    'Expected Offspring': 'Beklenen Yavru',
    'Production Period': 'Üretim Süresi',
    'Meat when slaughtered': 'Kesildiğinde Verilen Et',
    None: 'Yok',
    'Only meat': 'Sadece et verir',
    'Tame Animals': 'Binek Hayvanları',
    'Farm Animals': 'Çiftlik Hayvanları',
    'Wild Animals': 'Vahşi Hayvanlar',
    'Potion Calculator': 'İksir Hesaplayıcı',
    'Food Calculator': 'Yemek Hesaplayıcı',
    'Equipment Calculator': 'Ekipman Hesaplayıcı',
    Potions: 'İksirler',
    Foods: 'Yemekler',
    'Potion Selection': 'İksir Seçimi',
    'Food Selection': 'Yemek Seçimi',
    'Search potion...': 'İksir ara...',
    'Search food...': 'Yemek ara...',
    'Arcane Extract': 'Arcane Extract',
    'Fish Sauce': 'Balık Sosu',
    'Base recipe + Arcane Extract': 'Temel reçete + Arcane Extract',
    'Base recipe + Fish Sauce': 'Temel reçete + Balık Sosu',
    'The use of focus is critical in food and potion production. Production using focus yields significantly higher profits compared to production without focus !!!': 'Yemek ve iksir üretiminde focus kullanımı kritik önemdedir. Focus kapalıyken görünen kâr, focuslu üretime göre çok düşük kalabilir !!!',
    'Daily Bonus': 'Günlük Bonus',
    'Live craft prices help fill material and sell prices before opening the in-game market.': 'Canlı üretim fiyatları, oyun içi pazarı açmadan önce malzeme ve satış fiyatlarını doldurmaya yardımcı olur.',
    Produces: 'Üretilir',
    '1 craft': '1 üretim',
    Quality: 'Kalite',
    Good: 'İyi',
    Outstanding: 'Seçkin',
    Excellent: 'Mükemmel',
    Masterpiece: 'Başyapıt',
    'RRR applies to recipe materials only': 'RRR sadece reçete malzemelerine uygulanır',
    'Extra materials': 'Ek malzemeler',
    'Craft Count': 'Üretim Adedi',
    'Focus Bonus': 'Odak Bonusu',
    'Clear Craft': 'Temizle',
    'The use of focus is critical in food and potion production. Profit when focus is off can be significantly lower compared to production with focus enabled !!!': 'Yemek ve iksir üretiminde focus kullanımı kritik önemdedir. Focus kapalıyken görünen kâr, focuslu üretime göre çok düşük kalabilir !!!',
    'Base Focus': 'Temel Odak',
    'Mastery Level': 'Ana Sınıf Seviyesi',
    'Item Spec Level': 'Ürün Spec Seviyesi',
    'Other Spec Total': 'Diğer Spec Toplamı',
    'Total Efficiency': 'Toplam Verimlilik',
    'Focus / Craft': 'Üretim Başına Odak',
    'Focus Needed': 'Gerekli Odak',
    'Per Craft Focus': 'Odak / Üretim',
    'For one craft action': '1 craft işlemi için',
    'RRR Output Estimate': 'Tahmini Çıkacak Ürün',
    'Includes recrafts from returned materials': 'İade gelen malzemelerle tekrar üretim dahil',
    'Piece Craft With Focus': 'Odakla Üretilecek Adet',
    'Final Focus Cost': 'Bir Ürünün Focus Maliyeti',
    'Shared Spec': 'Ortak Bilgi',
    'Total Focus Points': 'Toplam Odak Puanı',
    'Main Animal Level': 'Ana Hayvan Seviyesi',
    'Animal Spec Level': 'Hayvan Uzmanlık Seviyesi',
    'Animal Count': 'Hayvan Sayısı',
    'Fetch Live Prices': 'Canlı Fiyatları Getir',
    'Fetching...': 'Getiriliyor...',
    'Journal Count': 'Kitap Adeti',
    'Market': 'Pazar',
    '1 Animal Focus': '1 Hayvan Odağı',
    'Farm Seeds': 'Çiftlik Tohumları',
    'Herb Seeds': 'Bitki Tohumları',
    Pasture: 'Evcil Hayvan Çiftliği',
    Kennel: 'Vahşi Hayvan Kulübesi',
    'All Crops • Shared Total': 'Tum Mahsuller • Toplam Kazanc',
    'All Herbs • Shared Total': 'Tüm Bitkiler • Toplam Kazanç',
    'All Animals • Shared Total': 'Tum Hayvanlar • Toplam Kazanc',
    'Watered Slot': 'Sulu Alan',
    'Watered + Dry': 'Sulu + Susuz',
    'Crop Profit Breakdown': 'Mahsul Kar Dagilimi',
    'Herb Profit Breakdown': 'Bitki Kâr Dağılımı',
    'City Summary Flip': 'Şehir Özeti Flip',
    'City Summary Enchant': 'Şehir Özeti Enchant',
    'Waiting for enchant data...': 'Enchant verisi bekleniyor...',
    'Baby => Tame': 'Yavru => Evcil',
    'Tame => Mount': 'Evcil => Binek',
    '1 baby drop assumed': '1 yavru düşüşü varsayılır',
    '0 baby drop assumed': '0 yavru düşüşü varsayılır',
    'If it drops 1 baby': '1 yavru düşerse',
    'Baby Drop Value': 'Yavru Düşüş Değeri',
    'Breeding Capacity': 'Üretim Kapasitesi',
    'Mount Delta': 'Binek Farkı',
    'Access denied by membership': 'Uyelik nedeniyle erisim kapali',
    'Locked by membership': 'Uyelik nedeniyle kilitli',
    'Top 5 Profitable Products': 'En Karlı 5 Ürün',
    'Hide from Top 5': 'Top 5 listesinden gizle',
    'Reset hidden': 'Gizlenenleri sıfırla',
    'No profitable product data yet.': 'Henüz kârlı ürün verisi yok.',
    'Hidden items are ignored only in this Top 5 list.': 'Gizlenen ürünler sadece bu Top 5 listesinde yok sayılır.',
    Soup: 'Çorba',
    Omelette: 'Omlet',
    Pie: 'Turta',
    Salad: 'Salata',
    Stew: 'Yahni',
    Sandwich: 'Sandviç',
    Roast: 'Kızartma',
    Potion: 'İksir',
    Food: 'Yemek'
  },
  trToEn: {
    Girdileri: 'Inputs',
    Fiyatı: 'Price',
    Seviyesi: 'Level',
    Adedi: 'Count',
    'Çiftçi Seviyesi': 'Farmer Level',
    Yavru: 'Baby',
    Evcil: 'Tame',
    kez: 'times',
    bitki: 'plants',
    et: 'meat',
    Bitki: 'Plant',
    Et: 'Meat',
    Sonuçları: 'Results',
    Buğday: 'Wheat',
    Fasulye: 'Bean',
    Havuç: 'Carrot',
    'Havuç Tohumu': 'Carrot Seeds',
    'Fasulye Tohumu': 'Bean Seeds',
    'Buğday Tohumu': 'Wheat Seeds',
    Turp: 'Turnip',
    'Turp Tohumu': 'Turnip Seeds',
    'Toplam Net Kâr': 'Total Net Profit',
    '1 Alan Odak': '1 Slot Focus',
    'Ekim Kapasitesi': 'Planting Capacity',
    'Toplam Alan': 'Current Total Slots',
    Lahana: 'Cabbage',
    'Lahana Tohumu': 'Cabbage Seeds',
    Patates: 'Potato',
    'Patates Tohumu': 'Potato Seeds',
    Mısır: 'Corn',
    'Mısır Tohumu': 'Corn Seeds',
    Balkabağı: 'Pumpkin',
    'Balkabağı Tohumu': 'Pumpkin Seeds',
    'Gizemli Mantar': 'Arcane Agaric',
    'Gizemli Mantar Tohumu': 'Arcane Agaric Seeds',
    'Parlak Yapraklı Karakafes Otu': 'Brightleaf Comfrey',
    'Parlak Yapraklı Karakafes Otu Tohumu': 'Brightleaf Comfrey Seeds',
    'Tırtıklı Dulavrat Otu': 'Crenellated Burdock',
    'Tırtıklı Dulavrat Otu Tohumu': 'Crenellated Burdock Seeds',
    'Ejderha Fırçaotu': 'Dragon Teasel',
    'Ejderha Fırçaotu Tohumu': 'Dragon Teasel Seeds',
    'Ele Geçmez Yüksük Otu': 'Elusive Foxglove',
    'Ele Geçmez Yüksük Otu Tohumu': 'Elusive Foxglove Seeds',
    'Ateş Dokunuşlu Sığırkuyruğu': 'Firetouched Mullein',
    'Ateş Dokunuşlu Sığırkuyruğu Tohumu': 'Firetouched Mullein Seeds',
    'Gulyabani Civanperçemi': 'Ghoul Yarrow',
    'Gulyabani Civanperçemi Tohumu': 'Ghoul Yarrow Seeds',
    'Susuz Tohum Verimi': 'Dry Seed Yield',
    'Sulu Tohum Verimi': 'Watered Seed Yield',
    'Sulama Bonusu': 'Watering Bonus',
    'Ekim Dagilimi': 'Planting Mix',
    'Sulu alanlar odak kullanir, susuz alanlar temel verimle calisir': 'Watered slots use focus, dry slots use base yield',
    Sulu: 'Watered',
    Susuz: 'Dry',
    'Sulu / Odakli Alanlar': 'Watered / Focused Slots',
    'Susuz / Odaksiz Alanlar': 'Dry / Unfocused Slots',
    'Urun Verimi +%10': 'Product Yield +%10',
    'Craft Hesaplayıcı': 'Craft Calculator',
    'Ada Hesaplayıcı': 'Island Calculator',
    Mahsuller: 'Crop',
    Bitkiler: 'Herbs',
    Hayvanlar: 'Animal',
    Tavuk: 'Chicken',
    Keçi: 'Goat',
    Kaz: 'Goose',
    Koyun: 'Sheep',
    Domuz: 'Pig',
    İnek: 'Cow',
    'Tavuk Yumurtası': 'Hen Egg',
    'Keçi Sütü': "Goat's Milk",
    'Kaz Yumurtası': 'Goose Egg',
    'Koyun Sütü': "Sheep's Milk",
    'İnek Sütü': "Cow's Milk",
    'Tavuk Eti': 'Raw Chicken',
    'Keçi Eti': 'Raw Goat',
    'Kaz Eti': 'Raw Goose',
    'Koyun Eti': 'Raw Mutton',
    'Domuz Eti': 'Raw Pork',
    'Sığır Eti': 'Raw Beef',
    'Hayvan Ürün Bilgisi': 'Animal Product Info',
    'Yan Ürün': 'Byproduct',
    'Yan Ürün Fiyatı': 'Byproduct Price',
    'İlk Döngü Kârı': 'First Cycle Profit',
    'Günlük Üretim Kârı': 'Daily Production Profit',
    'Üretim Günü': 'Production Days',
    'Planlanan Üretim Kârı': 'Planned Production Profit',
    'Beklenen Yavru': 'Expected Offspring',
    'Üretim Süresi': 'Production Period',
    'Kesildiğinde Verilen Et': 'Meat when slaughtered',
    Yok: 'None',
    'Sadece et verir': 'Only meat',
    'Binek Hayvanları': 'Tame Animals',
    'Çiftlik Hayvanları': 'Farm Animals',
    'Vahşi Hayvanlar': 'Wild Animals',
    'İksir Hesaplayıcı': 'Potion Calculator',
    'Yemek Hesaplayıcı': 'Food Calculator',
    'Ekipman Hesaplayıcı': 'Equipment Calculator',
    İksirler: 'Potions',
    Yemekler: 'Foods',
    'İksir Seçimi': 'Potion Selection',
    'Yemek Seçimi': 'Food Selection',
    'İksir ara...': 'Search potion...',
    'Yemek ara...': 'Search food...',
    'Balık Sosu': 'Fish Sauce',
    'Temel reçete + Arcane Extract': 'Base recipe + Arcane Extract',
    'Temel reçete + Balık Sosu': 'Base recipe + Fish Sauce',
    'Yemek ve iksir üretiminde focus kullanımı kritik önemdedir. Focus kapalıyken görünen kâr, focuslu üretime göre çok düşük kalabilir !!!': 'The use of focus is critical in food and potion production. Profit when focus is off can be significantly lower compared to production with focus enabled !!!',
    'Günlük Bonus': 'Daily Bonus',
    'Canlı üretim fiyatları, oyun içi pazarı açmadan önce malzeme ve satış fiyatlarını doldurmaya yardımcı olur.': 'Live craft prices help fill material and sell prices before opening the in-game market.',
    Üretilir: 'Produces',
    '1 üretim': '1 craft',
    'Kalite': 'Quality',
    'İyi': 'Good',
    'Seçkin': 'Outstanding',
    'Mükemmel': 'Excellent',
    'Başyapıt': 'Masterpiece',
    'RRR sadece reçete malzemelerine uygulanır': 'RRR applies to recipe materials only',
    'Ek malzemeler': 'Extra materials',
    'Üretim Adedi': 'Craft Count',
    'Odak Bonusu': 'Focus Bonus',
    'Temizle': 'Clear Craft',
    'Temel Odak': 'Base Focus',
    'Ana Sınıf Seviyesi': 'Mastery Level',
    'Ürün Spec Seviyesi': 'Item Spec Level',
    'Diğer Spec Toplamı': 'Other Spec Total',
    'Toplam Verimlilik': 'Total Efficiency',
    'Üretim Başına Odak': 'Focus / Craft',
    'Gerekli Odak': 'Focus Needed',
    'Odak / Üretim': 'Per Craft Focus',
    '1 craft işlemi için': 'For one craft action',
    'Tahmini Çıkacak Ürün': 'Estimated Output',
    'İade gelen malzemelerle tekrar üretim dahil': 'Includes recrafts from returned materials',
    'Odakla Üretilecek Adet': 'Piece Craft With Focus',
    'Bir Ürünün Focus Maliyeti': 'Final Focus Cost',
    Crops: 'Mahsuller',
    Animals: 'Hayvanlar',
    'Ortak Bilgi': 'Shared Spec',
    'Toplam Odak Puanı': 'Total Focus Points',
    'Ana Hayvan Seviyesi': 'Main Animal Level',
    'Hayvan Uzmanlık Seviyesi': 'Animal Spec Level',
    'Hayvan Sayısı': 'Animal Count',
    'Canlı Fiyatları Getir': 'Fetch Live Prices',
    'Getiriliyor...': 'Fetching...',
    'Kitap Adeti': 'Journal Count',
    'Pazar': 'Market',
    '1 Hayvan Odağı': '1 Animal Focus',
    'Çiftlik Tohumları': 'Farm Seeds',
    'Bitki Tohumları': 'Herb Seeds',
    'Evcil Hayvan Çiftliği': 'Pasture',
    'Vahşi Hayvan Kulübesi': 'Kennel',
    'Tum Mahsuller • Toplam Kazanc': 'All Crops • Shared Total',
    'Tüm Bitkiler • Toplam Kazanç': 'All Herbs • Shared Total',
    'Tum Hayvanlar • Toplam Kazanc': 'All Animals • Shared Total',
    'Sulu Alan': 'Watered Slot',
    'Sulu + Susuz': 'Watered + Dry',
    'Mahsul Kar Dagilimi': 'Crop Profit Breakdown',
    'Bitki Kâr Dağılımı': 'Herb Profit Breakdown',
    'Şehir Özeti Flip': 'City Summary Flip',
    'Şehir Özeti Enchant': 'City Summary Enchant',
    'Enchant verisi bekleniyor...': 'Waiting for enchant data...',
    'Yavru => Evcil': 'Baby => Tame',
    'Evcil => Binek': 'Tame => Mount',
    '1 yavru düşüşü varsayılır': '1 baby drop assumed',
    '0 yavru düşüşü varsayılır': '0 baby drop assumed',
    '1 yavru düşerse': 'If it drops 1 baby',
    'Yavru Düşüş Değeri': 'Baby Drop Value',
    'Üretim Kapasitesi': 'Breeding Capacity',
    'Binek Farkı': 'Mount Delta',
    'Access denied by membership': 'Uyelik nedeniyle erisim kapali',
    'Locked by membership': 'Uyelik nedeniyle kilitli',
    'En Karlı 5 Ürün': 'Top 5 Profitable Products',
    'Top 5 listesinden gizle': 'Hide from Top 5',
    'Gizlenenleri sıfırla': 'Reset hidden',
    'Henüz kârlı ürün verisi yok.': 'No profitable product data yet.',
    'Gizlenen ürünler sadece bu Top 5 listesinde yok sayılır.': 'Hidden items are ignored only in this Top 5 list.',
    'Çorba': 'Soup',
    'Omlet': 'Omelette',
    'Turta': 'Pie',
    'Salata': 'Salad',
    'Yahni': 'Stew',
    'Sandviç': 'Sandwich',
    'Kızartma': 'Roast',
    'İksir': 'Potion',
    'Yemek': 'Food'
  }
};

const CROP_ITEMS = [
  'Carrot Seeds',
  'Bean Seeds',
  'Wheat Seeds',
  'Turnip Seeds',
  'Cabbage Seeds',
  'Potato Seeds',
  'Corn Seeds',
  'Pumpkin Seeds'
];

const HERB_ITEMS = [
  'Arcane Agaric Seeds',
  'Brightleaf Comfrey Seeds',
  'Crenellated Burdock Seeds',
  'Dragon Teasel Seeds',
  'Elusive Foxglove Seeds',
  'Firetouched Mullein Seeds',
  'Ghoul Yarrow Seeds'
];

const FARM_ITEMS = [
  ...CROP_ITEMS,
  ...HERB_ITEMS
];

const FARM_PRESETS = {
  'Carrot Seeds': { itemId: 'T3_CARROT', price: 2000, baseYield: 0, bonusYield: 2.0, totalYield: 2.0, bonusCity: 'Lymhurst Brecilien', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Bean Seeds': { itemId: 'T4_BEANPLANT', price: 3000, baseYield: 0.3333, bonusYield: 1.3333, totalYield: 1.6666, bonusCity: 'Bridgewatch Brecilien', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Wheat Seeds': { itemId: 'T5_WHEAT', price: 5000, baseYield: 0.60, bonusYield: 0.80, totalYield: 1.40, bonusCity: 'Martlock  Brecilien', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Turnip Seeds': { itemId: 'T6_TURNIP', price: 7500, baseYield: 0.7333, bonusYield: 0.5333, totalYield: 1.2666, bonusCity: 'Fort Sterling Brecilien', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Cabbage Seeds': { itemId: 'T5_CABBAGE', price: 10000, baseYield: 0.80, bonusYield: 0.40, totalYield: 1.20, bonusCity: 'Thetford  Brecilien', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Potato Seeds': { itemId: 'T7_POTATO', price: 15000, baseYield: 0.8667, bonusYield: 0.2667, totalYield: 1.1334, bonusCity: 'Martlock Brecilien', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Corn Seeds': { itemId: 'T7_CORN', price: 22500, baseYield: 0.9111, bonusYield: 0.1778, totalYield: 1.0889, bonusCity: 'Bridgewatch Brecilien', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Pumpkin Seeds': { itemId: 'T8_PUMPKIN', price: 30000, baseYield: 0.9333, bonusYield: 0.1333, totalYield: 1.0666, bonusCity: 'Lymhurst Brecilien', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Arcane Agaric Seeds': { itemId: 'T2_AGARIC', price: 3000, baseYield: 0.3333, bonusYield: 1.3333, totalYield: 1.6666, bonusCity: 'Thetford', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Brightleaf Comfrey Seeds': { itemId: 'T3_COMFREY', price: 5000, baseYield: 0.60, bonusYield: 0.80, totalYield: 1.40, bonusCity: 'Caerleon', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Crenellated Burdock Seeds': { itemId: 'T4_BURDOCK', price: 7500, baseYield: 0.7333, bonusYield: 0.5333, totalYield: 1.2666, bonusCity: 'Lymhurst', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Dragon Teasel Seeds': { itemId: 'T5_TEASEL', price: 10000, baseYield: 0.80, bonusYield: 0.40, totalYield: 1.20, bonusCity: 'Bridgewatch Caerleon', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Elusive Foxglove Seeds': { itemId: 'T6_FOXGLOVE', price: 15000, baseYield: 0.8667, bonusYield: 0.2667, totalYield: 1.1334, bonusCity: 'Martlock', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Firetouched Mullein Seeds': { itemId: 'T7_MULLEIN', price: 22500, baseYield: 0.9111, bonusYield: 0.1778, totalYield: 1.0889, bonusCity: 'Caerleon Thetford', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 },
  'Ghoul Yarrow Seeds': { itemId: 'T8_YARROW', price: 30000, baseYield: 0.9333, bonusYield: 0.1333, totalYield: 1.0666, bonusCity: 'Fort Sterling', seedPerPlot: 9, growHours: 22, cropOutputMin: 6, cropOutputMax: 12, defaultCropOutput: 9 }
};

const ANIMAL_PRESETS = {
  'Baby Chickens': { tier: 3, price: 5000, growHours: 22, baseYield: 0.60, bonusYield: 0.80, totalYield: 1.40, dietAmount: '18', dietType: 'plants', favoriteDietAmount: '9', favoriteDietType: 'Sheaf of Wheat', bonusCity: 'Fort Sterling', productInfo: { animal: 'Chicken', byproduct: 'Hen Egg', productionRange: '18-20', periodHours: 22, canNurture: false, meat: 'Raw Chicken', meatAmount: 18 } },
  'Kid': { tier: 4, price: 7500, growHours: 22, baseYield: 0.7333, bonusYield: 0.5333, totalYield: 1.2666, dietAmount: '18', dietType: 'plants', favoriteDietAmount: '9', favoriteDietType: 'Turnips', bonusCity: 'Bridgewatch', productInfo: { animal: 'Goat', byproduct: "Goat's Milk", productionRange: '18-20', periodHours: 22, canNurture: false, meat: 'Raw Goat', meatAmount: 18 } },
  'Gosling': { tier: 5, price: 10000, growHours: 22, baseYield: 0.80, bonusYield: 0.40, totalYield: 1.20, dietAmount: '18', dietType: 'plants', favoriteDietAmount: '9', favoriteDietType: 'Cabbage', bonusCity: 'Lymhurst', productInfo: { animal: 'Goose', byproduct: 'Goose Egg', productionRange: '18-20', periodHours: 22, canNurture: false, meat: 'Raw Goose', meatAmount: 18 } },
  'Lamb': { tier: 6, price: 15000, growHours: 22, baseYield: 0.8667, bonusYield: 0.2667, totalYield: 1.1334, dietAmount: '18', dietType: 'plants', favoriteDietAmount: '9', favoriteDietType: 'Potatoes', bonusCity: 'Fort Sterling', productInfo: { animal: 'Sheep', byproduct: "Sheep's Milk", productionRange: '18-20', periodHours: 22, canNurture: false, meat: 'Raw Mutton', meatAmount: 18 } },
  'Piglet': { tier: 7, price: 22500, growHours: 22, baseYield: 0.9111, bonusYield: 0.1778, totalYield: 1.0889, dietAmount: '18', dietType: 'plants', favoriteDietAmount: '9', favoriteDietType: 'Bundle of Corn', bonusCity: 'Thetford', productInfo: { animal: 'Pig', byproduct: '', meat: 'Raw Pork', meatAmount: 18 } },
  'Calf': { tier: 8, price: 30000, growHours: 22, baseYield: 0.9333, bonusYield: 0.1333, totalYield: 1.0666, dietAmount: '18', dietType: 'plants', favoriteDietAmount: '9', favoriteDietType: 'Pumpkin', bonusCity: 'Martlock', productInfo: { animal: 'Cow', byproduct: "Cow's Milk", productionRange: '18-20', periodHours: 22, canNurture: false, meat: 'Raw Beef', meatAmount: 18 } },
  "Journeyman's Ox Calf": { tier: 3, price: 25000, growHours: 22, baseYield: 0.83, bonusYield: 0.21, totalYield: 1.04, dietAmount: '10 / 44h', dietType: 'plants' },
  "Adept's Ox Calf": { tier: 4, price: 75000, growHours: 46, baseYield: 0.79, bonusYield: 0.26, totalYield: 1.05, dietAmount: '14 / 44h', dietType: 'plants' },
  "Expert's Ox Calf": { tier: 5, price: 225000, growHours: 70, baseYield: 0.79, bonusYield: 0.26, totalYield: 1.05, dietAmount: '28 / 44h', dietType: 'plants' },
  "Master's Ox Calf": { tier: 6, price: 675000, growHours: 94, baseYield: 0.81, bonusYield: 0.24, totalYield: 1.05, dietAmount: '63 / 44h', dietType: 'plants' },
  "Grandmaster's Ox Calf": { tier: 7, price: 2025000, growHours: 118, baseYield: 0.84, bonusYield: 0.20, totalYield: 1.04, dietAmount: '151 / 44h', dietType: 'plants' },
  "Elder's Ox Calf": { tier: 8, price: 6075000, growHours: 142, baseYield: 0.87, bonusYield: 0.16, totalYield: 1.03, dietAmount: '376 / 44h', dietType: 'plants' },
  "Journeyman's Foal": { tier: 3, price: 25000, growHours: 22, baseYield: 0.84, bonusYield: 0.20, totalYield: 1.04, dietAmount: '10 / 44h', dietType: 'plants' },
  "Adept's Foal": { tier: 4, price: 75000, growHours: 46, baseYield: 0.7867, bonusYield: 0.2666, totalYield: 1.0533, dietAmount: '14 / 44h', dietType: 'plants' },
  "Expert's Foal": { tier: 5, price: 225000, growHours: 70, baseYield: 0.7867, bonusYield: 0.2667, totalYield: 1.0534, dietAmount: '28 / 44h', dietType: 'plants' },
  "Master's Foal": { tier: 6, price: 675000, growHours: 94, baseYield: 0.8140, bonusYield: 0.2336, totalYield: 1.0476, dietAmount: '63 / 44h', dietType: 'plants' },
  "Grandmaster's Foal": { tier: 7, price: 2025000, growHours: 118, baseYield: 0.8420, bonusYield: 0.1975, totalYield: 1.0395, dietAmount: '151 / 44h', dietType: 'plants' },
  "Elder's Foal": { tier: 8, price: 6075000, growHours: 142, baseYield: 0.8736, bonusYield: 0.1578, totalYield: 1.0314, dietAmount: '376 / 44h', dietType: 'plants' },
  "Adept's Fawn": { tier: 4, price: 75000, growHours: 46, feedings: 2, baseYield: 0, bonusYield: 0.35, totalYield: 0.35, dietAmount: '14 / 44h', dietType: 'plants' },
  'Swiftclaw Cub': { tier: 5, price: 225000, growHours: 70, feedings: 3, baseYield: 0, bonusYield: 0.30, totalYield: 0.30, dietAmount: '26 / 44h', dietType: 'meat' },
  'Greywolf Pup': { tier: 5, price: 225000, growHours: 70, feedings: 3, baseYield: 0, bonusYield: 0.30, totalYield: 0.30, dietAmount: '26 / 44h', dietType: 'meat' },
  'Direwolf Pup': { tier: 6, price: 675000, growHours: 94, feedings: 4, baseYield: 0, bonusYield: 0.24, totalYield: 0.24, dietAmount: '58 / 44h', dietType: 'meat' },
  'Direboar Piglet': { tier: 7, price: 2025000, growHours: 118, feedings: 5, baseYield: 0, bonusYield: 0.20, totalYield: 0.20, dietAmount: '139 / 44h', dietType: 'meat' },
  'Swamp Dragon Pup': { tier: 7, price: 2025000, growHours: 118, feedings: 5, baseYield: 0, bonusYield: 0.20, totalYield: 0.20, dietAmount: '139 / 44h', dietType: 'meat' },
  'Direbear Cub': { tier: 8, price: 6075000, growHours: 142, baseYield: 0, bonusYield: 0.15, totalYield: 0.15, dietAmount: '376 / 44h', dietType: 'meat' },
  'Mammoth Calf': { tier: 8, price: 6075000, growHours: 142, baseYield: 0, bonusYield: 0.15, totalYield: 0.15, dietAmount: '376 / 44h', dietType: 'plants' },
  'Baby Moabird': { tier: 5, price: 225000, growHours: 70, feedings: 3, baseYield: 0, bonusYield: 0.30, totalYield: 0.30, dietAmount: '28 / 44h', dietType: 'plants' },
  'Wild Boarlet': { tier: 5, price: 225000, growHours: 70, feedings: 3, baseYield: 0, bonusYield: 0.30, totalYield: 0.30, dietAmount: '26 / 44h', dietType: 'meat' },
  'Bighorn Ram Lamb': { tier: 5, price: 225000, growHours: 70, feedings: 3, baseYield: 0, bonusYield: 0.30, totalYield: 0.30, dietAmount: '28 / 44h', dietType: 'plants' },
  'Mystic Owlet': { tier: 5, price: 225000, growHours: 70, feedings: 3, baseYield: 0, bonusYield: 0.30, totalYield: 0.30, dietAmount: '26 / 44h', dietType: 'meat' },
  'Hellspinner Baby': { tier: 5, price: 225000, growHours: 70, feedings: 3, baseYield: 0, bonusYield: 0.30, totalYield: 0.30, dietAmount: '26 / 44h', dietType: 'meat' },
  'Baby Swamp Salamander': { tier: 5, price: 225000, growHours: 70, feedings: 3, baseYield: 0, bonusYield: 0.30, totalYield: 0.30, dietAmount: '26 / 44h', dietType: 'meat' },
  'Winter Bear Cub': { tier: 5, price: 225000, growHours: 70, feedings: 3, baseYield: 0, bonusYield: 0.30, totalYield: 0.30, dietAmount: '26 / 44h', dietType: 'meat' }
};

const PASTURE_ITEMS = [
  "Journeyman's Foal",
  "Adept's Foal",
  "Expert's Foal",
  "Master's Foal",
  "Grandmaster's Foal",
  
  "Journeyman's Ox Calf",
  "Adept's Ox Calf",
  "Expert's Ox Calf",
  "Master's Ox Calf",
  "Grandmaster's Ox Calf"
];

const FARM_ANIMAL_ITEMS = [
  'Baby Chickens',
  'Kid',
  'Gosling',
  'Lamb',
  'Piglet',
  'Calf'
];

const KENNEL_ITEMS = [
  "Adept's Fawn",
  'Swiftclaw Cub',
  'Greywolf Pup',
  'Mystic Owlet',
  'Hellspinner Baby',
  'Direwolf Pup',
  'Direboar Piglet',
  'Swamp Dragon Pup',
  'Baby Moabird',
  'Wild Boarlet',
  'Bighorn Ram Lamb',
  'Baby Swamp Salamander',
  'Winter Bear Cub'
];

function getAnimalSubModeItems(subMode = selectedAnimalSubModeState) {
  if (subMode === 'kennel') return KENNEL_ITEMS;
  if (subMode === 'livestock') return FARM_ANIMAL_ITEMS;
  return PASTURE_ITEMS;
}

function getAnimalSubModeTitle(subMode = selectedAnimalSubModeState) {
  if (subMode === 'kennel') return 'Wild Animals';
  if (subMode === 'livestock') return 'Farm Animals';
  return 'Tame Animals';
}

const FARM_ICON_IDS = {
  'Carrot Seeds': 'T1_FARM_CARROT_SEED',
  'Bean Seeds': 'T2_FARM_BEAN_SEED',
  'Wheat Seeds': 'T3_FARM_WHEAT_SEED',
  'Turnip Seeds': 'T4_FARM_TURNIP_SEED',
  'Cabbage Seeds': 'T5_FARM_CABBAGE_SEED',
  'Potato Seeds': 'T6_FARM_POTATO_SEED',
  'Corn Seeds': 'T7_FARM_CORN_SEED',
  'Pumpkin Seeds': 'T8_FARM_PUMPKIN_SEED',
  'Arcane Agaric Seeds': 'T2_FARM_AGARIC_SEED',
  'Brightleaf Comfrey Seeds': 'T3_FARM_COMFREY_SEED',
  'Crenellated Burdock Seeds': 'T4_FARM_BURDOCK_SEED',
  'Dragon Teasel Seeds': 'T5_FARM_TEASEL_SEED',
  'Elusive Foxglove Seeds': 'T6_FARM_FOXGLOVE_SEED',
  'Firetouched Mullein Seeds': 'T7_FARM_MULLEIN_SEED',
  'Ghoul Yarrow Seeds': 'T8_FARM_YARROW_SEED',
  'Baby Chickens': 'T3_FARM_CHICKEN_BABY',
  'Kid': 'T4_FARM_GOAT_BABY',
  'Gosling': 'T5_FARM_GOOSE_BABY',
  'Lamb': 'T6_FARM_SHEEP_BABY',
  'Piglet': 'T7_FARM_PIG_BABY',
  'Calf': 'T8_FARM_COW_BABY',
  "Journeyman's Ox Calf": 'T3_FARM_OX_BABY',
  "Adept's Ox Calf": 'T4_FARM_OX_BABY',
  "Expert's Ox Calf": 'T5_FARM_OX_BABY',
  "Master's Ox Calf": 'T6_FARM_OX_BABY',
  "Grandmaster's Ox Calf": 'T7_FARM_OX_BABY',
  "Elder's Ox Calf": 'T8_FARM_OX_BABY',
  "Journeyman's Foal": 'T3_FARM_HORSE_BABY',
  "Adept's Foal": 'T4_FARM_HORSE_BABY',
  "Expert's Foal": 'T5_FARM_HORSE_BABY',
  "Master's Foal": 'T6_FARM_HORSE_BABY',
  "Grandmaster's Foal": 'T7_FARM_HORSE_BABY',
  "Elder's Foal": 'T8_FARM_HORSE_BABY',
  "Adept's Fawn": 'T4_FARM_GIANTSTAG_BABY',
  'Swiftclaw Cub': 'T5_FARM_COUGAR_BABY',
  'Direwolf Pup': 'T6_FARM_DIREWOLF_BABY',
  'Direboar Piglet': 'T7_FARM_DIREBOAR_BABY',
  'Swamp Dragon Pup': 'T7_FARM_SWAMPDRAGON_BABY',
  'Direbear Cub': 'T8_FARM_DIREBEAR_BABY',
  'Mammoth Calf': 'T8_FARM_MAMMOTH_BABY',
  'Baby Moabird': 'T5_FARM_MOABIRD_FW_BRIDGEWATCH_BABY',
  'Wild Boarlet': 'T5_FARM_DIREBOAR_FW_LYMHURST_BABY',
  'Bighorn Ram Lamb': 'T5_FARM_RAM_FW_MARTLOCK_BABY',
  'Mystic Owlet': 'T5_FARM_OWL_FW_BRECILIEN_BABY',
  'Hellspinner Baby': 'T5_FARM_SPIDER_HELL_BABY',
  'Baby Swamp Salamander': 'T5_FARM_SWAMPDRAGON_FW_THETFORD_BABY',
  'Winter Bear Cub': 'T5_FARM_DIREBEAR_FW_FORTSTERLING_BABY',
  'Greywolf Pup': 'T5_FARM_GREYWOLF_FW_CAERLEON_BABY'
};

const FARM_PRODUCT_ICON_IDS = {
  'Carrot Seeds': 'T1_CARROT@0',
  'Bean Seeds': 'T2_BEAN@0',
  'Wheat Seeds': 'T3_WHEAT@0',
  'Turnip Seeds': 'T4_TURNIP@0',
  'Cabbage Seeds': 'T5_CABBAGE@0',
  'Potato Seeds': 'T6_POTATO@0',
  'Corn Seeds': 'T7_CORN@0',
  'Pumpkin Seeds': 'T8_PUMPKIN@0',
  'Arcane Agaric Seeds': 'T2_AGARIC@0',
  'Brightleaf Comfrey Seeds': 'T3_COMFREY@0',
  'Crenellated Burdock Seeds': 'T4_BURDOCK@0',
  'Dragon Teasel Seeds': 'T5_TEASEL@0',
  'Elusive Foxglove Seeds': 'T6_FOXGLOVE@0',
  'Firetouched Mullein Seeds': 'T7_MULLEIN@0',
  'Ghoul Yarrow Seeds': 'T8_YARROW@0'
};

const FARM_DIET_ICON_IDS = {
  'Carrot': 'T1_CARROT@0',
  'Carrots': 'T1_CARROT@0',
  'Bean': 'T2_BEAN@0',
  'Beans': 'T2_BEAN@0',
  'Sheaf of Wheat': 'T3_WHEAT@0',
  'Wheat': 'T3_WHEAT@0',
  'Turnip': 'T4_TURNIP@0',
  'Turnips': 'T4_TURNIP@0',
  'Cabbage': 'T5_CABBAGE@0',
  'Potato': 'T6_POTATO@0',
  'Potatoes': 'T6_POTATO@0',
  'Bundle of Corn': 'T7_CORN@0',
  'Corn': 'T7_CORN@0',
  'Pumpkin': 'T8_PUMPKIN@0'
};

const ANIMAL_PRODUCT_ICON_IDS = {
  Chicken: 'T3_FARM_CHICKEN_GROWN',
  Goat: 'T4_FARM_GOAT_GROWN',
  Goose: 'T5_FARM_GOOSE_GROWN',
  Sheep: 'T6_FARM_SHEEP_GROWN',
  Pig: 'T7_FARM_PIG_GROWN',
  Cow: 'T8_FARM_COW_GROWN',
  'Hen Egg': 'T3_EGG',
  "Goat's Milk": 'T4_MILK',
  'Goose Egg': 'T5_EGG',
  "Sheep's Milk": 'T6_MILK',
  "Cow's Milk": 'T8_MILK',
  'Raw Chicken': 'T3_MEAT',
  'Raw Goat': 'T4_MEAT',
  'Raw Goose': 'T5_MEAT',
  'Raw Mutton': 'T6_MEAT',
  'Raw Pork': 'T7_MEAT',
  'Raw Beef': 'T8_MEAT'
};

const ANIMAL_GROWN_ICON_IDS = {
  'Baby Chickens': 'T3_FARM_CHICKEN_GROWN',
  'Kid': 'T4_FARM_GOAT_GROWN',
  'Gosling': 'T5_FARM_GOOSE_GROWN',
  'Lamb': 'T6_FARM_SHEEP_GROWN',
  'Piglet': 'T7_FARM_PIG_GROWN',
  'Calf': 'T8_FARM_COW_GROWN',
  "Journeyman's Ox Calf": 'T3_FARM_OX_GROWN',
  "Adept's Ox Calf": 'T4_FARM_OX_GROWN',
  "Expert's Ox Calf": 'T5_FARM_OX_GROWN',
  "Master's Ox Calf": 'T6_FARM_OX_GROWN',
  "Grandmaster's Ox Calf": 'T7_FARM_OX_GROWN',
  "Elder's Ox Calf": 'T8_FARM_OX_GROWN',
  "Journeyman's Foal": 'T3_FARM_HORSE_GROWN',
  "Adept's Foal": 'T4_FARM_HORSE_GROWN',
  "Expert's Foal": 'T5_FARM_HORSE_GROWN',
  "Master's Foal": 'T6_FARM_HORSE_GROWN',
  "Grandmaster's Foal": 'T7_FARM_HORSE_GROWN',
  "Elder's Foal": 'T8_FARM_HORSE_GROWN',
  "Adept's Fawn": 'T4_FARM_GIANTSTAG_GROWN',
  'Swiftclaw Cub': 'T5_FARM_COUGAR_GROWN',
  'Greywolf Pup': 'T5_FARM_GREYWOLF_FW_CAERLEON_GROWN',
  'Direwolf Pup': 'T6_FARM_DIREWOLF_GROWN',
  'Direboar Piglet': 'T7_FARM_DIREBOAR_GROWN',
  'Swamp Dragon Pup': 'T7_FARM_SWAMPDRAGON_GROWN',
  'Direbear Cub': 'T8_FARM_DIREBEAR_GROWN',
  'Mammoth Calf': 'T8_FARM_MAMMOTH_GROWN',
  'Baby Moabird': 'T5_FARM_MOABIRD_FW_BRIDGEWATCH_GROWN',
  'Wild Boarlet': 'T5_FARM_DIREBOAR_FW_LYMHURST_GROWN',
  'Bighorn Ram Lamb': 'T5_FARM_RAM_FW_MARTLOCK_GROWN',
  'Mystic Owlet': 'T5_FARM_OWL_FW_BRECILIEN_GROWN',
  'Hellspinner Baby': 'T5_FARM_SPIDER_HELL_GROWN',
  'Baby Swamp Salamander': 'T5_FARM_SWAMPDRAGON_FW_THETFORD_GROWN',
  'Winter Bear Cub': 'T5_FARM_DIREBEAR_FW_FORTSTERLING_GROWN'
};

const ANIMAL_MOUNT_RECIPES = {
  "Journeyman's Foal": { mountLabel: "Journeyman's Riding Horse", mountItemId: 'T3_MOUNT_HORSE', material1: { label: 'T3 Leather', amount: 20 } },
  "Adept's Foal": { mountLabel: "Adept's Riding Horse", mountItemId: 'T4_MOUNT_HORSE', material1: { label: 'T4 Leather', amount: 20 } },
  "Expert's Foal": { mountLabel: "Expert's Riding Horse", mountItemId: 'T5_MOUNT_HORSE', material1: { label: 'T5 Leather', amount: 20 } },
  "Master's Foal": { mountLabel: "Master's Riding Horse", mountItemId: 'T6_MOUNT_HORSE', material1: { label: 'T6 Leather', amount: 20 } },
  "Grandmaster's Foal": { mountLabel: "Grandmaster's Riding Horse", mountItemId: 'T7_MOUNT_HORSE', material1: { label: 'T7 Leather', amount: 20 } },
  "Elder's Foal": { mountLabel: "Elder's Riding Horse", mountItemId: 'T8_MOUNT_HORSE', material1: { label: 'T8 Leather', amount: 20 } },
  "Journeyman's Ox Calf": { mountLabel: "Journeyman's Transport Ox", mountItemId: 'T3_MOUNT_OX', material1: { label: 'T3 Planks', amount: 30 } },
  "Adept's Ox Calf": { mountLabel: "Adept's Transport Ox", mountItemId: 'T4_MOUNT_OX', material1: { label: 'T4 Planks', amount: 30 } },
  "Expert's Ox Calf": { mountLabel: "Expert's Transport Ox", mountItemId: 'T5_MOUNT_OX', material1: { label: 'T5 Planks', amount: 30 } },
  "Master's Ox Calf": { mountLabel: "Master's Transport Ox", mountItemId: 'T6_MOUNT_OX', material1: { label: 'T6 Planks', amount: 30 } },
  "Grandmaster's Ox Calf": { mountLabel: "Grandmaster's Transport Ox", mountItemId: 'T7_MOUNT_OX', material1: { label: 'T7 Planks', amount: 30 } },
  "Elder's Ox Calf": { mountLabel: "Elder's Transport Ox", mountItemId: 'T8_MOUNT_OX', material1: { label: 'T8 Planks', amount: 30 } },
  "Adept's Fawn": { mountLabel: "Adept's Giant Stag", mountItemId: 'T4_MOUNT_GIANTSTAG', material1: { label: 'T4 Leather', amount: 20 } },
  'Swiftclaw Cub': { mountLabel: 'Swiftclaw', mountItemId: 'T5_MOUNT_COUGAR_KEEPER', material1: { label: 'T5 Leather', amount: 20 } },
  'Greywolf Pup': { mountLabel: 'Greywolf', mountItemId: 'T5_MOUNT_GREYWOLF_FW_CAERLEON', material1: { label: 'T5 Leather', amount: 20 } },
  'Direwolf Pup': { mountLabel: 'Direwolf', mountItemId: 'T6_MOUNT_DIREWOLF', material1: { label: 'T6 Leather', amount: 20 } },
  'Direboar Piglet': { mountLabel: 'Saddled Direboar', mountItemId: 'T7_MOUNT_DIREBOAR', material1: { label: 'T7 Leather', amount: 20 } },
  'Swamp Dragon Pup': { mountLabel: 'Saddled Swamp Dragon', mountItemId: 'T7_MOUNT_SWAMPDRAGON', material1: { label: 'T7 Leather', amount: 20 } },
  'Direbear Cub': { mountLabel: 'Saddled Direbear', mountItemId: 'T8_MOUNT_DIREBEAR', material1: { label: 'T8 Leather', amount: 20 } },
  'Mammoth Calf': { mountLabel: "Elder's Transport Mammoth", mountItemId: 'T8_MOUNT_MAMMOTH_TRANSPORT', material1: { label: 'T8 Leather', amount: 20 } },
  'Baby Moabird': { mountLabel: 'Saddled Moabird', mountItemId: 'T5_MOUNT_MOABIRD_FW_BRIDGEWATCH', material1: { label: 'T5 Leather', amount: 20 }, material2: { label: 'City Material', amount: 5 } },
  'Wild Boarlet': { mountLabel: 'Saddled Wild Boar', mountItemId: 'T5_MOUNT_DIREBOAR_FW_LYMHURST', material1: { label: 'T5 Leather', amount: 20 }, material2: { label: 'City Material', amount: 5 } },
  'Bighorn Ram Lamb': { mountLabel: 'Saddled Bighorn Ram', mountItemId: 'T5_MOUNT_RAM_FW_MARTLOCK', material1: { label: 'T5 Leather', amount: 20 }, material2: { label: 'City Material', amount: 5 } },
  'Baby Swamp Salamander': { mountLabel: 'Saddled Swamp Salamander', mountItemId: 'T5_MOUNT_SWAMPDRAGON_FW_THETFORD', material1: { label: 'T5 Leather', amount: 20 }, material2: { label: 'City Material', amount: 5 } },
  'Winter Bear Cub': { mountLabel: 'Saddled Winter Bear', mountItemId: 'T5_MOUNT_DIREBEAR_FW_FORTSTERLING', material1: { label: 'T5 Leather', amount: 20 }, material2: { label: 'City Material', amount: 5 } }

};
let loadedAnimalMountRecipes = {};

function preloadFarmIcons() {
  Object.values(FARM_ICON_IDS).forEach(itemId => {
    preloadIconUrl(getAlbionIconUrl(itemId, 128));
  });
}

function preloadIconUrl(url) {
  if (!url || preloadedIconUrls.has(url)) return;
  preloadedIconUrls.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.fetchPriority = 'high';
  img.src = url;
}

function preloadCraftingIcons() {
  TIERS.forEach(tier => {
    RESOURCES.forEach(resource => {
      RESOURCE_ENCHANTS.forEach(enchant => {
        preloadIconUrl(getAlbionIconUrl(getResourceItemId(tier, resource, enchant), ALBION_ICON_RENDER_SIZE));
      });
    });
    ARTIFACTS.forEach(artifact => {
      preloadIconUrl(`icons/${artifact}-T${tier}.png`);
    });
  });

  availableCraftingItems.slice(0, 30).forEach(item => {
    preloadIconUrl(getAlbionIconUrl(item.key, ALBION_ITEM_ICON_RENDER_SIZE));
  });
}

function updateCraftSelectColors() {
  const tierSelect = document.getElementById('singleTier');
  const enchantSelect = document.getElementById('singleEnchant');

  if (tierSelect) {
    const tier = parseInt(tierSelect.value || '4', 10);
    const tierColor = ARTIFACT_TIER_COLORS[tier] || 'var(--text)';
    tierSelect.style.color = tierColor;
    tierSelect.style.borderColor = tierColor;
  }

  if (enchantSelect) {
    const enchant = parseInt(enchantSelect.value || '0', 10);
    const enchantColor = ENCHANT_SELECT_COLORS[enchant] || 'var(--text)';
    enchantSelect.style.color = enchantColor;
    enchantSelect.style.borderColor = enchantColor;
  }
}

function rrrToLpb(rrrFraction) {
  if (rrrFraction <= 0) return 0;
  if (rrrFraction >= 0.9999) return 9999;
  return rrrFraction / (1 - rrrFraction);
}

function lpbToRrr(lpbValue) {
  if (lpbValue <= 0) return 0;
  return lpbValue / (1 + lpbValue);
}

function getCraftingBonusLpb() {
  let bonusLpb = 0;
  if (document.getElementById('cityProductionBonus')?.checked) bonusLpb += 0.15;
  if (document.getElementById('dailyProductionBonus')?.checked) bonusLpb += getDailyProductionBonusLpb();
  return bonusLpb;
}

function getCraftFocusReturnRate() {
  return 0.435;
}

function getCraftBaseRrrWithFocus(baseRrrFraction) {
  if (!document.getElementById('craftFocusBonus')?.checked) return baseRrrFraction;
  return Math.max(baseRrrFraction, getCraftFocusReturnRate());
}

function getDailyProductionBonusLpb() {
  const selectedValue = parseFloat(document.getElementById('dailyProductionBonusValue')?.value || '10');
  return (Number.isFinite(selectedValue) ? selectedValue : 10) / 100;
}

function getSelectedBonusCity() {
  return document.getElementById('bonusCity')?.value || '';
}

function getCraftModeFixedBonusCity(mode = selectedCraftModeState) {
  if (mode === 'potion') return 'Brecilien';
  if (mode === 'food') return 'Caerleon';
  return '';
}

function getCraftingCompareCitiesForCurrentMode() {
  const fixedBonusCity = getCraftModeFixedBonusCity();
  return fixedBonusCity && !CRAFTING_COMPARE_CITIES.includes(fixedBonusCity)
    ? [...CRAFTING_COMPARE_CITIES, fixedBonusCity]
    : CRAFTING_COMPARE_CITIES;
}

function getCraftingRouteSellCitiesForCurrentMode() {
  const excludedCity = getCraftModeFixedBonusCity();
  return getCraftingCompareCitiesForCurrentMode().filter(cityName => cityName !== excludedCity);
}

function getCraftingRouteBuyCitiesForCurrentMode() {
  const excludedCity = getCraftModeFixedBonusCity();
  return getCraftingCompareCitiesForCurrentMode().filter(cityName => cityName !== excludedCity);
}

function syncCraftBonusCityForMode(mode = selectedCraftModeState) {
  const fixedCity = getCraftModeFixedBonusCity(mode);
  const input = document.getElementById('bonusCity');
  const pickerWrap = document.getElementById('bonusCityPickerWrap');
  const fixedHint = document.getElementById('bonusCityFixedHint');

  if (input && fixedCity) input.value = fixedCity;
  if (pickerWrap) pickerWrap.style.display = fixedCity ? 'none' : 'grid';
  if (fixedHint) {
    fixedHint.style.display = fixedCity ? '' : 'none';
    fixedHint.innerHTML = fixedCity
      ? `${getTranslatedText('Bonus City')}: <b>${fixedCity}</b>`
      : '';
  }
  updateBonusCityPills();
}

function updateBonusCityPills() {
  const selectedCity = getSelectedBonusCity();
  document.querySelectorAll('.bonus-city-pill').forEach(btn => {
    btn.classList.toggle('active', (btn.dataset.city || '') === selectedCity);
  });
}

function setBonusCity(cityName) {
  const fixedCity = getCraftModeFixedBonusCity();
  if (fixedCity) cityName = fixedCity;
  const input = document.getElementById('bonusCity');
  if (input) input.value = cityName || '';
  updateBonusCityPills();
  updateCraftingBonusPreview();
  renderCraftTable();
  analyzeSingleItem();
}

function getCraftingBonusLpbForCity(cityName) {
  let bonusLpb = 0;
  if (document.getElementById('dailyProductionBonus')?.checked) bonusLpb += getDailyProductionBonusLpb();
  if (document.getElementById('cityProductionBonus')?.checked && getSelectedBonusCity() === cityName) bonusLpb += 0.15;
  return bonusLpb;
}

function getEffectiveRrrFromInput(inputId) {
  const input = document.getElementById(inputId);
  const baseValue = input?.dataset.baseValue ?? input?.value ?? 0;
  const baseRrrFraction = getCraftBaseRrrWithFocus((parseFloat(baseValue) || 0) / 100);
  const effectiveRrr = lpbToRrr(rrrToLpb(baseRrrFraction) + getCraftingBonusLpb());
  return effectiveRrr;
}

function updateRrrBaseValue(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.dataset.baseValue = input.value;
}

function updateCraftingBonusPreview() {
  const normalInput = document.getElementById('rrrRate');
  const effectiveNormal = getEffectiveRrrFromInput('rrrRate') * 100;

  if (normalInput) normalInput.value = effectiveNormal.toFixed(1);
}

function getEffectiveRrrForCity(inputId, cityName) {
  const input = document.getElementById(inputId);
  const baseValue = input?.dataset.baseValue ?? input?.value ?? 0;
  const baseRrrFraction = getCraftBaseRrrWithFocus((parseFloat(baseValue) || 0) / 100);
  return lpbToRrr(rrrToLpb(baseRrrFraction) + getCraftingBonusLpbForCity(cityName));
}

function updateBonusToggleVisuals() {
  const mappings = [
    ['craftFocusBonus', 'craftFocusBonusToggle'],
    ['cityProductionBonus', 'cityProductionBonusToggle'],
    ['dailyProductionBonus', 'dailyProductionBonusToggle']
  ];

  mappings.forEach(([inputId, toggleId]) => {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (!input || !toggle) return;
    toggle.classList.toggle('on', input.checked);
  });
}

// ─── BOOTLOADER ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    loadLanguagePreference();
    await loadTranslations();
    await loadLicenseEntitlements();
    startLicenseStatusPolling();
    initTranslationObserver();
    loadPersistedFarmState();
    loadFlipperSaleModeState();
    await loadFlipperProfitLog();
    fetchItemNames();
    fetchRecipes();
    fetchMountRecipes();
    await loadPage('flipper');
    scheduleApplyTranslations(document.body);
    initUpdateModal();
    initClearDataModal();
    void checkForAppUpdate();
    startAdcStatusPolling();
    void cleanOldLogs();
});

async function cleanOldLogs() {
  try {
    // Arka uca (backend) eski logları temizlemesi için bir istek gönderiyoruz.
    const response = await fetch('/api/logs/cleanup', { method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      if (data?.deleted_count > 0) {
        log(`${data.deleted_count} eski log dosyası başarıyla temizlendi.`, 'success');
      }
    }
  } catch (e) {
    console.warn('[Log Cleanup] Log temizleme işlemi başarısız:', e);
  }
}

document.addEventListener('click', e => {
    const container = document.getElementById('itemSearchContainer');
    if (container && !container.contains(e.target)) toggleItemList(false);
    
    // Close custom selects when clicking outside
    document.querySelectorAll('.custom-select.open').forEach(select => {
      if (!select.contains(e.target)) select.classList.remove('open');
    });
});

function updateConnBarVisibility(pageName = currentPage) {
  const connBar = document.querySelector('.conn-bar');
  if (!connBar) return;
  const isConnVisible = pageName !== 'farm';
  connBar.style.display = isConnVisible ? '' : 'none';
}

function saveFlipperSaleModeState() {
  try {
    localStorage.setItem(FLIPPER_SALE_MODE_STORAGE_KEY, JSON.stringify(flipperSaleModeState));
  } catch (_) {}
}

function loadFlipperSaleModeState() {
  try {
    const saved = localStorage.getItem(FLIPPER_SALE_MODE_STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object') flipperSaleModeState = parsed;
  } catch (_) {
    flipperSaleModeState = {};
  }
}

async function saveFlipperProfitLog() {
  try {
    localStorage.setItem(FLIPPER_PROFIT_LOG_STORAGE_KEY, JSON.stringify(flipperProfitLog));
  } catch (_) {}
  try {
    await fetch('/api/profit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: flipperProfitLog }),
    });
  } catch (_) {}
}

async function loadFlipperProfitLog() {
  try {
    const response = await fetch('/api/profit-log', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data?.entries)) {
        flipperProfitLog = data.entries;
        try {
          localStorage.setItem(FLIPPER_PROFIT_LOG_STORAGE_KEY, JSON.stringify(flipperProfitLog));
        } catch (_) {}
        return;
      }
    }
  } catch (_) {}
  try {
    const saved = localStorage.getItem(FLIPPER_PROFIT_LOG_STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) flipperProfitLog = parsed;
  } catch (_) {
    flipperProfitLog = [];
  }
}

function appendFlipperProfitLog(entry) {
  flipperProfitLog.unshift(entry);
  if (flipperProfitLog.length > 1000) flipperProfitLog = flipperProfitLog.slice(0, 1000);
  void saveFlipperProfitLog();
}

function removeLatestFlipperProfitLogByRowKey(rowKey) {
  const index = flipperProfitLog.findIndex(entry => entry.rowKey === rowKey);
  if (index === -1) return;
  flipperProfitLog.splice(index, 1);
  void saveFlipperProfitLog();
}

function parseTranslationLine(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed || !(/[=→]/.test(trimmed))) return null;
  if (trimmed === trimmed.toUpperCase() && !trimmed.includes('=>') && !trimmed.includes('→')) return null;

  let separator = null;
  if (trimmed.includes('→')) separator = '→';
  else if (trimmed.includes('=>')) separator = '=>';
  if (!separator) return null;

  const parts = trimmed.split(separator);
  if (parts.length < 2) return null;
  const source = parts[0].trim();
  const target = parts.slice(1).join(separator).trim();
  if (!source || !target) return null;
  return { source, target };
}

function escapeRegExp(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function translateCompoundText(value, dictionary) {
  const sourceText = String(value ?? '');
  if (!sourceText.trim()) return sourceText;
  const entries = Object.entries(dictionary || {})
    .filter(([source, target]) => source && target && source !== target)
    .sort((a, b) => String(b[0]).length - String(a[0]).length);
  if (!entries.length) return sourceText;

  let translated = sourceText;
  for (const [source, target] of entries) {
    const pattern = new RegExp(escapeRegExp(source), 'g');
    translated = translated.replace(pattern, target);
  }
  return translated;
}

async function loadTranslations() {
  try {
    const response = await fetch('english-strings.txt', { cache: 'no-store' });
    if (!response.ok) return;
    const text = await response.text();
    const enToTr = {};
    const trToEn = {};
    text.split(/\r?\n/).forEach(line => {
      const parsed = parseTranslationLine(line);
      if (!parsed) return;
      enToTr[parsed.source] = parsed.target;
      if (!trToEn[parsed.target]) trToEn[parsed.target] = parsed.source;
    });
    translationMapEnToTr = enToTr;
    translationMapTrToEn = trToEn;
  } catch (_) {}
}

function getTranslatedText(text) {
  const value = String(text ?? '');
  if (!value.trim()) return value;
  if (currentLanguage === 'tr') {
    if (translationMapEnToTr[value] || BUILTIN_TRANSLATIONS.enToTr[value]) {
      return translationMapEnToTr[value] || BUILTIN_TRANSLATIONS.enToTr[value];
    }
    return translateCompoundText(
      value,
      { ...BUILTIN_TRANSLATIONS.enToTr, ...translationMapEnToTr }
    );
  }
  if (translationMapTrToEn[value] || BUILTIN_TRANSLATIONS.trToEn[value]) {
    return translationMapTrToEn[value] || BUILTIN_TRANSLATIONS.trToEn[value];
  }
  return translateCompoundText(
    value,
    { ...BUILTIN_TRANSLATIONS.trToEn, ...translationMapTrToEn }
  );
}

function nextPaint() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function translateItemName(name) {
  return getTranslatedText(name);
}

function buildTranslatedPair(primary, suffix) {
  return `${translateItemName(primary)} ${getTranslatedText(suffix)}`.trim();
}

function getCountedLabel(count, unitKey) {
  return `${count} ${getTranslatedText(unitKey)}`.trim();
}

function getDefaultLicenseEntitlements() {
  return {
    package_code: 'restricted',
    modules: { flipper: false, crafting: false, island: false },
    flip: {
      max_visible_profit: 0,
      total_visible_profit_limit: 0,
      can_edit_profit_filters: false,
      can_use_basic_profit_filters: false,
      can_use_direct_action: false,
      can_view_flip_summary: false,
      can_view_enchant_detail: false
    },
    admin: { is_admin: false, can_seed_demo_data: false }
  };
}

function getEntitlementsFromMembershipType(membershipType) {
  const normalized = String(membershipType || '').toLowerCase().trim();
  const ent = getDefaultLicenseEntitlements();

  if (normalized === 'flip_60k' || normalized === 'flip_100k') {
    ent.package_code = 'flip_60k';
    ent.modules = { flipper: true, crafting: false, island: false };
    ent.flip.max_visible_profit = 50000;
    ent.flip.total_visible_profit_limit = 500000;
    return ent;
  }
  if (normalized === 'flip_160k' || normalized === 'flip_250k') {
    ent.package_code = 'flip_160k';
    ent.modules = { flipper: true, crafting: false, island: false };
    ent.flip.max_visible_profit = 150000;
    ent.flip.total_visible_profit_limit = 1000000;
    ent.flip.can_use_basic_profit_filters = true;
    ent.flip.can_use_direct_action = true;
    ent.flip.can_view_flip_summary = true;
    return ent;
  }
  if (normalized === 'flip_unlimited') {
    ent.package_code = 'flip_unlimited';
    ent.modules = { flipper: true, crafting: false, island: false };
    ent.flip.max_visible_profit = null;
    ent.flip.can_edit_profit_filters = true;
    ent.flip.can_use_basic_profit_filters = true;
    ent.flip.can_use_direct_action = true;
    ent.flip.can_view_flip_summary = true;
    ent.flip.can_view_enchant_detail = true;
    return ent;
  }
  if (normalized === 'craft_only') {
    ent.package_code = 'craft_only';
    ent.modules = { flipper: false, crafting: true, island: false };
    return ent;
  }
  if (normalized === 'island_only') {
    ent.package_code = 'island_only';
    ent.modules = { flipper: false, crafting: false, island: true };
    return ent;
  }
  if (normalized === 'craft_island') {
    ent.package_code = 'craft_island';
    ent.modules = { flipper: false, crafting: true, island: true };
    return ent;
  }
  if (normalized === 'all_access') {
    ent.package_code = 'all_access';
    ent.modules = { flipper: true, crafting: true, island: true };
    ent.flip.max_visible_profit = null;
    ent.flip.can_edit_profit_filters = true;
    ent.flip.can_use_basic_profit_filters = true;
    ent.flip.can_use_direct_action = true;
    ent.flip.can_view_flip_summary = true;
    ent.flip.can_view_enchant_detail = true;
    return ent;
  }
  if (normalized === 'admin') {
    ent.package_code = 'admin';
    ent.modules = { flipper: true, crafting: true, island: true };
    ent.flip.max_visible_profit = null;
    ent.flip.can_edit_profit_filters = true;
    ent.flip.can_use_basic_profit_filters = true;
    ent.flip.can_use_direct_action = true;
    ent.flip.can_view_flip_summary = true;
    ent.flip.can_view_enchant_detail = true;
    ent.admin = { is_admin: true, can_seed_demo_data: true };
    return ent;
  }
  return ent;
}

function normalizeLicenseEntitlements(raw, membershipTypeOverride = '') {
  const def = getDefaultLicenseEntitlements();
  const source = raw && typeof raw === 'object' ? raw : {};
  const modules = source.modules && typeof source.modules === 'object' ? source.modules : {};
  const flip = source.flip && typeof source.flip === 'object' ? source.flip : {};
  const maxProfit = Number(flip.max_visible_profit);
  const totalProfitLimit = Number(flip.total_visible_profit_limit);
  const membershipEntitlements = getEntitlementsFromMembershipType(membershipTypeOverride || source.package_code || source.membership_type);
  const hasExplicitModules = Object.keys(modules).length > 0;
  const sourcePackageCode = String(source.package_code || '').trim().toLowerCase();
  const membershipPackageCode = String(membershipEntitlements.package_code || '').trim().toLowerCase();

  if (membershipPackageCode !== 'restricted' && (!sourcePackageCode || sourcePackageCode === 'restricted')) {
    return membershipEntitlements;
  }

  return {
    package_code: String(source.package_code || membershipEntitlements.package_code || def.package_code),
    modules: {
      flipper: modules.flipper != null ? !!modules.flipper : (hasExplicitModules ? def.modules.flipper : membershipEntitlements.modules.flipper),
      crafting: modules.crafting != null ? !!modules.crafting : (hasExplicitModules ? def.modules.crafting : membershipEntitlements.modules.crafting),
      island: modules.island != null ? !!modules.island : (hasExplicitModules ? def.modules.island : membershipEntitlements.modules.island)
    },
    flip: {
      max_visible_profit: Number.isFinite(maxProfit) && maxProfit > 0 ? maxProfit : (hasExplicitModules ? null : membershipEntitlements.flip.max_visible_profit),
      total_visible_profit_limit: Number.isFinite(totalProfitLimit) && totalProfitLimit > 0 ? totalProfitLimit : (hasExplicitModules ? null : membershipEntitlements.flip.total_visible_profit_limit),
      can_edit_profit_filters: flip.can_edit_profit_filters != null ? !!flip.can_edit_profit_filters : (hasExplicitModules ? def.flip.can_edit_profit_filters : membershipEntitlements.flip.can_edit_profit_filters),
      can_use_basic_profit_filters: flip.can_use_basic_profit_filters != null ? !!flip.can_use_basic_profit_filters : (hasExplicitModules ? def.flip.can_use_basic_profit_filters : membershipEntitlements.flip.can_use_basic_profit_filters),
      can_use_direct_action: flip.can_use_direct_action != null ? !!flip.can_use_direct_action : (hasExplicitModules ? def.flip.can_use_direct_action : membershipEntitlements.flip.can_use_direct_action),
      can_view_flip_summary: flip.can_view_flip_summary != null ? !!flip.can_view_flip_summary : (hasExplicitModules ? def.flip.can_view_flip_summary : membershipEntitlements.flip.can_view_flip_summary),
      can_view_enchant_detail: flip.can_view_enchant_detail != null ? !!flip.can_view_enchant_detail : (hasExplicitModules ? def.flip.can_view_enchant_detail : membershipEntitlements.flip.can_view_enchant_detail)
    },
    admin: {
      is_admin: !!(source.admin?.is_admin ?? membershipEntitlements.admin?.is_admin),
      can_seed_demo_data: !!(source.admin?.can_seed_demo_data ?? membershipEntitlements.admin?.can_seed_demo_data)
    },
  };
}

function isAdminLicense() {
  return String(licenseEntitlements?.package_code || '').toLowerCase() === 'admin' || !!licenseEntitlements?.admin?.is_admin;
}

function getFlipperAccessPolicy() {
  const flip = licenseEntitlements?.flip || {};
  const packageCode = String(licenseEntitlements?.package_code || '').toLowerCase();
  const isFullFlip = ['flip_unlimited', 'all_access', 'admin'].includes(packageCode) || isAdminLicense();
  const isPro = packageCode === 'flip_160k' || packageCode === 'flip_250k';
  return {
    packageCode,
    isFullFlip,
    maxItemDirectProfit: Number.isFinite(Number(flip.max_visible_profit)) && Number(flip.max_visible_profit) > 0 ? Number(flip.max_visible_profit) : null,
    totalVisibleDirectProfitLimit: Number.isFinite(Number(flip.total_visible_profit_limit)) && Number(flip.total_visible_profit_limit) > 0 ? Number(flip.total_visible_profit_limit) : null,
    canUseAllFilters: isFullFlip || !!flip.can_edit_profit_filters,
    canUseBasicProfitFilters: isFullFlip || isPro || !!flip.can_use_basic_profit_filters,
    canUseDirectAction: isFullFlip || isPro || !!flip.can_use_direct_action,
    canViewFlipSummary: isFullFlip || isPro || !!flip.can_view_flip_summary,
    canViewEnchantDetail: isFullFlip
  };
}

function isStaticPreviewEnvironment() {
  const host = window.location.hostname;
  const port = window.location.port;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  return window.location.protocol === 'file:' || (isLocalHost && port !== '8000');
}

function isFarmPlantMode(mode = selectedFarmModeState) {
  return mode === 'farm' || mode === 'herb';
}

function getActiveFarmPlantItems(mode = selectedFarmModeState) {
  return mode === 'herb' ? HERB_ITEMS : CROP_ITEMS;
}

async function loadLicenseEntitlements() {
    try {
      const response = await fetch('/api/license/status', { cache: 'no-store' });
      const data = await response.json();
      licenseEntitlements = normalizeLicenseEntitlements(data?.entitlements, data?.membership_type);
      if (data?.enabled && data.valid === false) {
        window.location.replace('/');
        return;
      }
  } catch (_) {
    licenseEntitlements = isStaticPreviewEnvironment()
      ? getEntitlementsFromMembershipType('admin')
      : getDefaultLicenseEntitlements();
  }
  applyLicenseEntitlementsToNav();
}

function startLicenseStatusPolling() {
  if (licenseStatusPollTimer) clearInterval(licenseStatusPollTimer);
  licenseStatusPollTimer = setInterval(async () => {
    try {
      const response = await fetch('/api/license/status', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (data?.enabled && data.valid === false) {
        window.location.replace('/');
        return;
      }
      licenseEntitlements = normalizeLicenseEntitlements(data?.entitlements, data?.membership_type);
      applyLicenseEntitlementsToNav();
    } catch (_) {}
  }, 60000);
}

function canAccessPage(pageName) {
  const modules = licenseEntitlements.modules || {};
  if (pageName === 'flipper') return !!modules.flipper;
  if (pageName === 'total-profit') return ['flip_unlimited', 'all_access', 'admin'].includes(String(licenseEntitlements?.package_code || '').toLowerCase());
  if (pageName === 'crafting') return !!modules.crafting;
  if (pageName === 'farm') return !!modules.island;
  return false;
}

function applyLicenseEntitlementsToNav() {
  const modules = licenseEntitlements.modules || {};
  const canUseTotalProfit = ['flip_unlimited', 'all_access', 'admin'].includes(String(licenseEntitlements?.package_code || '').toLowerCase());
  const navFlipper = document.getElementById('nav-flipper');
  const navTotal = document.getElementById('nav-total-profit');
  const navCraft = document.getElementById('nav-crafting');
  const navCraftEquipment = document.getElementById('nav-crafting-equipment');
  const navCraftFoods = document.getElementById('nav-crafting-foods');
  const navCraftPotions = document.getElementById('nav-crafting-potions');
  const navFarm = document.getElementById('nav-farm');
  const navFarmCrop = document.getElementById('nav-farm-crop');
  const navFarmHerb = document.getElementById('nav-farm-herb');
  const navFarmAnimal = document.getElementById('nav-farm-animal');

  const setLocked = (el, allowed) => {
    if (!el) return;
    el.style.opacity = allowed ? '1' : '0.48';
    el.style.pointerEvents = allowed ? '' : 'none';
    if (!allowed) el.classList.remove('active');
  };

  setLocked(navFlipper, !!modules.flipper);
  setLocked(navTotal, canUseTotalProfit);
  setLocked(navCraft, !!modules.crafting);
  setLocked(navCraftEquipment, !!modules.crafting);
  setLocked(navCraftFoods, !!modules.crafting);
  setLocked(navCraftPotions, !!modules.crafting);
  setLocked(navFarm, !!modules.island);
  setLocked(navFarmCrop, !!modules.island);
  setLocked(navFarmHerb, !!modules.island);
  setLocked(navFarmAnimal, !!modules.island);
  applyAdminOnlyControls();
}

function applyAdminOnlyControls() {
  const demoBtn = document.getElementById('adminDemoBtn');
  if (!demoBtn) return;
  const canSeedDemo = isAdminLicense() && !!licenseEntitlements?.admin?.can_seed_demo_data;
  demoBtn.style.display = canSeedDemo ? '' : 'none';
  demoBtn.textContent = currentLanguage === 'tr' ? 'Demo Veri' : 'Demo Data';
}

function applyFlipperLicenseRestrictions() {
  if (currentPage !== 'flipper') return;
  const maxBuyEl = document.getElementById('maxBuyPrice');
  const minPEl = document.getElementById('minProfit');
  const minEnchantEl = document.getElementById('minEnchantProfitAdvantage');
  const taxEl = document.getElementById('taxRate');
  const searchEl = document.getElementById('searchInput');
  const citySelect = document.getElementById('citySelect');
  const cityGroup = document.getElementById('buyCityFilterGroup');
  const maxBuyGroup = document.getElementById('maxBuyPriceGroup');
  const minProfitGroup = document.getElementById('minProfitGroup');
  const minEnchantGroup = document.getElementById('minEnchantProfitGroup');
  const taxGroup = document.getElementById('taxRateGroup');
  const tierGroup = document.getElementById('tierFilterGroup');
  const enchantGroup = document.getElementById('enchantFilterGroup');
  const searchGroup = document.getElementById('searchFilterGroup');
  const flipSummaryBox = document.getElementById('citySummaryFlipPanelBox');
  const enchantSummaryBox = document.getElementById('citySummaryEnchantPanelBox');
  const enchantPanelBox = document.getElementById('enchantDetailPanelBox');
  const policy = getFlipperAccessPolicy();
  const canUseBasicFilters = !!policy.canUseBasicProfitFilters;
  const canUseAllFilters = !!policy.canUseAllFilters;
  const canViewEnchantDetail = !!policy.canViewEnchantDetail;
  document.body.classList.toggle('hide-enchant-details', !canViewEnchantDetail);

  const setGroupEnabled = (group, enabled) => {
    if (!group) return;
    group.classList.toggle('membership-disabled', !enabled);
    group.title = enabled ? '' : getTranslatedText('Locked by membership');
  };

  if (!canUseBasicFilters && customSelectValues) {
    customSelectValues.citySelect = 'all';
    const trigger = citySelect?.querySelector('.custom-select-trigger');
    if (trigger) trigger.textContent = getTranslatedText('All');
  }
  if (!canUseAllFilters) {
    if (searchEl) searchEl.value = '';
  }

  if (citySelect) citySelect.style.pointerEvents = canUseBasicFilters ? '' : 'none';
  setGroupEnabled(cityGroup, canUseBasicFilters);
  setGroupEnabled(maxBuyGroup, canUseBasicFilters);
  setGroupEnabled(minProfitGroup, canUseBasicFilters);
  setGroupEnabled(taxGroup, true);
  setGroupEnabled(tierGroup, canUseAllFilters);
  setGroupEnabled(enchantGroup, canUseAllFilters);
  setGroupEnabled(searchGroup, canUseAllFilters);

  if (maxBuyEl) {
    if (!canUseBasicFilters) maxBuyEl.value = '0';
    maxBuyEl.disabled = !canUseBasicFilters;
    maxBuyEl.style.opacity = canUseBasicFilters ? '1' : '0.58';
    maxBuyEl.title = canUseBasicFilters ? '' : getTranslatedText('Locked by membership');
  }
  if (minPEl) {
    if (!canUseBasicFilters) minPEl.value = '0';
    minPEl.disabled = !canUseBasicFilters;
    minPEl.style.opacity = canUseBasicFilters ? '1' : '0.58';
    minPEl.title = canUseBasicFilters ? '' : getTranslatedText('Locked by membership');
  }
  if (minEnchantEl) {
    if (!canUseAllFilters) minEnchantEl.value = '0';
    minEnchantEl.disabled = !canUseAllFilters || !canViewEnchantDetail;
    minEnchantEl.style.opacity = (canUseAllFilters && canViewEnchantDetail) ? '1' : '0.58';
    minEnchantEl.title = canUseAllFilters ? '' : getTranslatedText('Locked by membership');
  }
  if (taxEl) {
    taxEl.disabled = false;
    taxEl.style.opacity = '1';
    taxEl.title = '';
  }
  if (searchEl) searchEl.disabled = !canUseAllFilters;
  if (minEnchantGroup) minEnchantGroup.style.display = canViewEnchantDetail ? '' : 'none';
  if (flipSummaryBox) flipSummaryBox.style.display = policy.canViewFlipSummary ? '' : 'none';
  if (enchantSummaryBox) enchantSummaryBox.style.display = canViewEnchantDetail ? '' : 'none';
  if (enchantPanelBox) enchantPanelBox.style.display = canViewEnchantDetail ? '' : 'none';
}

function applyProfitCap(value) {
  return value;
}

function translateTieredLabel(label) {
  const raw = String(label || '').trim();
  const tierMatch = raw.match(/^(T\d+)\s+(.+)$/i);
  if (!tierMatch) return translateItemName(raw);
  return `${tierMatch[1].toUpperCase()} ${translateItemName(tierMatch[2])}`.trim();
}

function getResolvedMountRecipeLabel(itemName, mountRecipe) {
  const fallbackRecipe = ANIMAL_MOUNT_RECIPES[itemName] || null;
  return translateItemName(fallbackRecipe?.mountLabel || mountRecipe?.mountLabel || '');
}

function getResolvedMountMaterialLabel(itemName, mountRecipe, materialIndex = 1) {
  const fallbackRecipe = ANIMAL_MOUNT_RECIPES[itemName] || null;
  const materialKey = materialIndex === 2 ? 'material2' : 'material1';
  const rawLabel = fallbackRecipe?.[materialKey]?.label || mountRecipe?.[materialKey]?.label || '';
  return translateTieredLabel(rawLabel);
}

function getAnimalProductLine(key, fallbackText = '') {
  const label = key ? getTranslatedText(key) : fallbackText;
  return getFarmPresetLineWithIcon(ANIMAL_PRODUCT_ICON_IDS[key] || '', label);
}

function getAnimalByproductLine(productInfo = {}) {
  const label = productInfo.productionRange
    ? `${getTranslatedText(productInfo.byproduct)} ${productInfo.productionRange}`
    : getTranslatedText(productInfo.byproduct || '');
  return getFarmPresetLineWithIcon(ANIMAL_PRODUCT_ICON_IDS[productInfo.byproduct] || '', label);
}

function getRangeAverage(rangeText = '') {
  const parts = String(rangeText || '').split('-').map(part => Number(part.trim()));
  const validParts = parts.filter(value => Number.isFinite(value));
  if (!validParts.length) return 0;
  return validParts.reduce((sum, value) => sum + value, 0) / validParts.length;
}

function getFarmPresetLineWithUiIcon(iconFile = '', text = '') {
  const iconHtml = iconFile ? getFarmUiInputIcon(iconFile) : '';
  if (!iconHtml) return text;
  return `<span class="farm-preset-icon-line">${iconHtml}<span>${text}</span></span>`;
}

function translateTextNode(node) {
  const original = node.nodeValue;
  if (!original || !original.trim()) return;
  const parent = node.parentElement;
  if (parent && parent.closest && parent.closest('[data-no-translate="1"]')) return;
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  const core = original.trim();
  const translated = getTranslatedText(core);
  if (translated !== core) node.nodeValue = `${leading}${translated}${trailing}`;
}

function translateElementAttributes(element) {
  if (element.closest && element.closest('[data-no-translate="1"]')) return;
  ['placeholder', 'title', 'aria-label'].forEach(attr => {
    const current = element.getAttribute(attr);
    if (!current) return;
    const translated = getTranslatedText(current);
    if (translated !== current) element.setAttribute(attr, translated);
  });
}

function applyTranslations(root = document) {
  if (isApplyingTranslations) return;
  isApplyingTranslations = true;
  try {
    const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node?.parentElement) return NodeFilter.FILTER_REJECT;
        if (['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
        return node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const textNodes = [];
    while (textWalker.nextNode()) textNodes.push(textWalker.currentNode);
    textNodes.forEach(translateTextNode);

    const elements = root.querySelectorAll ? root.querySelectorAll('[placeholder],[title],[aria-label]') : [];
    elements.forEach(translateElementAttributes);

    document.documentElement.lang = currentLanguage === 'tr' ? 'tr' : 'en';
  } finally {
    isApplyingTranslations = false;
  }
}

function scheduleApplyTranslations(root = document) {
  applyTranslations(root);
}

function initTranslationObserver() {
  if (translationObserver) translationObserver.disconnect();
  translationObserver = new MutationObserver(mutations => {
    if (isApplyingTranslations) return;
    const shouldTranslate = mutations.some(mutation =>
      mutation.type === 'childList'
      || mutation.type === 'characterData'
      || (mutation.type === 'attributes' && ['placeholder', 'title', 'aria-label'].includes(mutation.attributeName))
    );
    if (shouldTranslate) scheduleApplyTranslations(document.body);
  });
  translationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['placeholder', 'title', 'aria-label']
  });
}

function updateLanguagePills() {
  const trBtn = document.getElementById('lang-tr');
  const enBtn = document.getElementById('lang-en');
  if (trBtn) trBtn.classList.toggle('active', currentLanguage === 'tr');
  if (enBtn) enBtn.classList.toggle('active', currentLanguage === 'en');
}

function updateBrandTitle() {
  const albionEl = document.getElementById('brandAlbion');
  const flipEl = document.getElementById('brandFlip');
  const craftEl = document.getElementById('brandCraft');
  const calculatorEl = document.getElementById('brandCalculator');
  if (albionEl) albionEl.textContent = 'Albion Master';
  if (flipEl) flipEl.textContent = currentLanguage === 'tr' ? 'Al-Sat' : 'Flip';
  if (craftEl) craftEl.textContent = currentLanguage === 'tr' ? 'Üretim' : 'Craft';
  if (calculatorEl) calculatorEl.textContent = currentLanguage === 'tr' ? 'Ada' : 'Island';
  document.title = 'Albion Master';
}

function updateTopNavLabels() {
  const labels = {
    'nav-flipper-label': currentLanguage === 'tr' ? 'Kara Borsa Flipper' : 'Black Market Flipper',
    'nav-total-profit-label': currentLanguage === 'tr' ? 'Toplam Kâr' : 'Total Profit',
    'nav-crafting-label': currentLanguage === 'tr' ? 'Craft Hesaplayıcı' : 'Craft Calculator',
    'nav-crafting-equipment-label': currentLanguage === 'tr' ? 'Ekipman' : 'Equipment',
    'nav-crafting-foods-label': currentLanguage === 'tr' ? 'Yemekler' : 'Foods',
    'nav-crafting-potions-label': currentLanguage === 'tr' ? 'İksirler' : 'Potions',
    'nav-farm-label': currentLanguage === 'tr' ? 'Ada Hesaplayıcı' : 'Island Calculator',
    'nav-farm-crop-label': currentLanguage === 'tr' ? 'Mahsuller' : 'Crop',
    'nav-farm-herb-label': currentLanguage === 'tr' ? 'Bitkiler' : 'Herbs',
    'nav-farm-animal-label': currentLanguage === 'tr' ? 'Hayvanlar' : 'Animal'
  };
  Object.entries(labels).forEach(([id, label]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  });
}

function updateFarmViewLabels() {
  const labels = {
    'farm-mode-crop-label': currentLanguage === 'tr' ? 'Mahsuller' : 'Crops',
    'farm-mode-herb-label': currentLanguage === 'tr' ? 'Bitkiler' : 'Herbs',
    'farm-mode-animal-label': currentLanguage === 'tr' ? 'Hayvanlar' : 'Animals',
    'farm-sub-pasture-label': currentLanguage === 'tr' ? 'Binek Hayvanları' : 'Tame Animals',
    'farm-sub-livestock-label': currentLanguage === 'tr' ? 'Çiftlik Hayvanları' : 'Farm Animals',
    'farm-sub-kennel-label': currentLanguage === 'tr' ? 'Vahşi Hayvanlar' : 'Wild Animals'
  };
  Object.entries(labels).forEach(([id, label]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  });
}

function loadLanguagePreference() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    currentLanguage = saved === 'en' ? 'en' : 'tr';
  } catch (_) {
    currentLanguage = 'tr';
  }
  updateLanguagePills();
  updateBrandTitle();
  updateTopNavLabels();
  updateFarmViewLabels();
  updateUpdateModalText();
}

function setLanguage(lang) {
  currentLanguage = lang === 'en' ? 'en' : 'tr';
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  } catch (_) {}
  updateLanguagePills();
  updateBrandTitle();
  updateTopNavLabels();
  updateFarmViewLabels();
  updateUpdateModalText();
  updateCurrentView();
  scheduleApplyTranslations(document.body);
}

function getUpdateUiText() {
  return UPDATE_UI_TEXT[currentLanguage === 'en' ? 'en' : 'tr'];
}

function updateUpdateModalText() {
  const text = getUpdateUiText();
  const badgeEl = document.getElementById('updateModalBadge');
  const titleEl = document.getElementById('updateModalTitle');
  const subtitleEl = document.getElementById('updateModalSubtitle');
  const currentEl = document.getElementById('updateCurrentVersionLabel');
  const latestEl = document.getElementById('updateLatestVersionLabel');
  const notesEl = document.getElementById('updateNotesLabel');
  const laterBtn = document.getElementById('updateLaterBtn');
  const changelogBtn = document.getElementById('updateChangelogBtn');
  const downloadBtn = document.getElementById('updateDownloadBtn');
  if (badgeEl) badgeEl.textContent = text.badge;
  if (titleEl) titleEl.textContent = text.title;
  if (subtitleEl) subtitleEl.textContent = text.subtitle;
  if (currentEl) currentEl.textContent = text.current;
  if (latestEl) latestEl.textContent = text.latest;
  if (notesEl) notesEl.textContent = text.notes;
  if (laterBtn) laterBtn.textContent = text.later;
  if (changelogBtn) changelogBtn.textContent = text.changelog;
  if (downloadBtn) downloadBtn.textContent = text.download;
}

function closeUpdateModal() {
  const overlay = document.getElementById('updateModalOverlay');
  if (overlay) overlay.hidden = true;
}

function showUpdateModal(updateInfo) {
  pendingUpdateInfo = updateInfo;
  const overlay = document.getElementById('updateModalOverlay');
  const currentValue = document.getElementById('updateCurrentVersionValue');
  const latestValue = document.getElementById('updateLatestVersionValue');
  const notesText = document.getElementById('updateNotesText');
  const changelogBtn = document.getElementById('updateChangelogBtn');
  updateUpdateModalText();
  
  // Zorunlu güncelleme kontrolü
  const isForced = updateInfo.force_update === true;
  const laterBtn = document.getElementById('updateLaterBtn');
  if (laterBtn) laterBtn.style.display = isForced ? 'none' : '';
  if (overlay && isForced) overlay.style.pointerEvents = 'auto'; // Tıklayarak kapanmasını engellemek için

  if (currentValue) currentValue.textContent = String(updateInfo.current_version || '-');
  if (latestValue) latestValue.textContent = String(updateInfo.latest_version || '-');
  if (notesText) notesText.textContent = String(updateInfo.notes || (currentLanguage === 'tr'
    ? 'Bu sürüm için not paylaşılmadı.'
    : 'No release notes were provided for this version.'));
  if (changelogBtn) changelogBtn.style.display = String(updateInfo.changelog_url || '').trim() ? '' : 'none';
  if (overlay) overlay.hidden = false;
}

function initUpdateModal() {
  updateUpdateModalText();
  const overlay = document.getElementById('updateModalOverlay');
  const laterBtn = document.getElementById('updateLaterBtn');
  const changelogBtn = document.getElementById('updateChangelogBtn');
  const downloadBtn = document.getElementById('updateDownloadBtn');
  if (laterBtn) laterBtn.addEventListener('click', closeUpdateModal);
  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      const url = String(pendingUpdateInfo?.url || '').trim();
      if (!url) return;
      try {
        await fetch('/api/update/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
      } catch (_) {
        try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (_) {}
      }
      closeUpdateModal();
    });
  }
  if (changelogBtn) {
    changelogBtn.addEventListener('click', async () => {
      const url = String(pendingUpdateInfo?.changelog_url || '').trim();
      if (!url) return;
      try {
        await fetch('/api/update/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
      } catch (_) {
        try { window.open(url, '_blank', 'noopener,noreferrer'); } catch (_) {}
      }
    });
  }
}

function closeClearDataModal() {
  const overlay = document.getElementById('clearDataModalOverlay');
  if (overlay) overlay.hidden = true;
}

function performClearData() {
  itemMap.clear();
  marketDepthByCity = {};
  copiedFlipperRowKeys.clear();
  if (currentPage === 'crafting') {
    resourcePrices = {};
    resourcePricesByCity = {};
    manualCraftPriceOverrides = {};
  }
  updateCurrentView();
  closeClearDataModal();
}

function showClearDataModal() {
  const overlay = document.getElementById('clearDataModalOverlay');
  if (overlay) overlay.hidden = false;
}

function initClearDataModal() {
  const overlay = document.getElementById('clearDataModalOverlay');
  const cancelBtn = document.getElementById('clearDataCancelBtn');
  const confirmBtn = document.getElementById('clearDataConfirmBtn');
  if (cancelBtn) cancelBtn.addEventListener('click', closeClearDataModal);
  if (confirmBtn) confirmBtn.addEventListener('click', performClearData);
  if (overlay) {
    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeClearDataModal();
    });
  }
  document.addEventListener('keydown', event => {
    const isOpen = !(document.getElementById('clearDataModalOverlay')?.hidden ?? true);
    if (event.key === 'Escape' && isOpen) closeClearDataModal();
  });
}

async function checkForAppUpdate() {
  try {
    const response = await fetch('/api/update/status', { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    if (!data?.enabled || !data?.update_available) return;
    showUpdateModal(data);
  } catch (_) {}
}

function syncCalculatorNavState() {
  document.querySelectorAll('.nav-dropdown-item').forEach(btn => btn.classList.remove('active'));
  const craftingBtn = document.getElementById('nav-crafting');
  const craftEqBtn = document.getElementById('nav-crafting-equipment');
  const craftPoBtn = document.getElementById('nav-crafting-potions');
  const craftFoBtn = document.getElementById('nav-crafting-foods');
  const farmBtn = document.getElementById('nav-farm');
  const farmCropBtn = document.getElementById('nav-farm-crop');
  const farmHerbBtn = document.getElementById('nav-farm-herb');
  const farmAnimalBtn = document.getElementById('nav-farm-animal');
  
  if (craftingBtn) craftingBtn.classList.toggle('active', currentPage === 'crafting');
  if (farmBtn) farmBtn.classList.toggle('active', currentPage === 'farm');
  
  if (currentPage === 'crafting') {
      if (selectedCraftModeState === 'equipment' && craftEqBtn) craftEqBtn.classList.add('active');
      if (selectedCraftModeState === 'potion' && craftPoBtn) craftPoBtn.classList.add('active');
      if (selectedCraftModeState === 'food' && craftFoBtn) craftFoBtn.classList.add('active');
  }
  
  if (currentPage === 'farm') {
      if (selectedFarmModeState === 'herb') {
        if (farmHerbBtn) farmHerbBtn.classList.add('active');
      } else if (isFarmPlantMode(selectedFarmModeState)) {
        if (farmCropBtn) farmCropBtn.classList.add('active');
      } else {
        if (farmAnimalBtn) farmAnimalBtn.classList.add('active');
        const subModeBtn = document.getElementById(`nav-farm-${selectedAnimalSubModeState}`);
        if (subModeBtn) subModeBtn.classList.add('active');
      }
  }
}

async function navigateToFarmCalculator(mode, subMode = 'pasture') {
  selectedFarmModeState = mode === 'animal' ? 'animal' : (mode === 'herb' ? 'herb' : 'farm');
  if (selectedFarmModeState === 'animal') {
    selectedAnimalSubModeState = ['kennel', 'livestock'].includes(subMode) ? subMode : 'pasture';
  }
  await loadPage('farm');
}

async function navigateToCraftingPage(section) {
  const previousCraftMode = renderedCraftModeState || selectedCraftModeState;
  let nextCraftMode = 'equipment';
  if (section === 'potion' || section === 'potions') {
    nextCraftMode = 'potion';
  } else if (section === 'food' || section === 'foods') {
    nextCraftMode = 'food';
  } else if (section === 'consumable') {
    nextCraftMode = 'consumable';
  }
  selectedCraftModeState = nextCraftMode;

  if (currentPage === 'crafting') {
    if (previousCraftMode !== nextCraftMode) {
      saveCraftModeState(previousCraftMode);
      setCraftMode(nextCraftMode, { skipSave: true });
    } else {
      syncCalculatorNavState();
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    return;
  }

  await loadPage('crafting');
}

function deleteFlipperProfitLogEntry(entryId) {
  if (!entryId) return;
  const nextLog = flipperProfitLog.filter(entry => String(entry.id) !== String(entryId));
  if (nextLog.length === flipperProfitLog.length) return;
  flipperProfitLog = nextLog;
  void saveFlipperProfitLog();
  if (currentPage === 'total-profit') renderTotalProfitPage();
}

async function loadPage(pageName) {
    const appContent = document.getElementById('app-content');
    if (appContent) appContent.classList.add('is-loading');
    if (!canAccessPage(pageName)) {
      log(`${getTranslatedText('Access denied by membership')}: ${pageName}`, 'warn');
      const fallbackPage = ['flipper', 'crafting', 'farm', 'total-profit'].find(canAccessPage);
      if (!fallbackPage) return;
      pageName = fallbackPage;
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    currentPage = pageName;
    updateConnBarVisibility(pageName);
    itemMap = pageName === 'crafting' ? craftingItemMap : flipperItemMap;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const navBtn = document.getElementById(`nav-${pageName}`);
    if(navBtn) navBtn.classList.add('active');
    applyLicenseEntitlementsToNav();
    syncCalculatorNavState();

    try {
        const response = await fetch(`views/${pageName}.html`);
        const html = await response.text();
        if (appContent) appContent.innerHTML = html;
        await nextPaint();
        initUI(pageName);
        updateTopNavLabels();
        updateFarmViewLabels();
        scheduleApplyTranslations(appContent || document.getElementById('app-content'));
        if (pageName === 'flipper') applyFilters();
        if (pageName === 'flipper') applyFlipperLicenseRestrictions();
        if (pageName === 'crafting') {
            await nextPaint();
            populateItemSelect();
            preloadCraftingIcons();
            updateCraftSelectColors();
            updateRrrBaseValue('rrrRate');
            updateCraftingBonusPreview();
            updateBonusToggleVisuals();
            updateBonusCityPills();
            setCraftMode(selectedCraftModeState);
            await nextPaint();
            renderCraftTable();
        }
        if (pageName === 'farm') {
            preloadFarmIcons();
            renderFarmCalculator();
        }
        if (pageName === 'total-profit') {
            totalProfitVisibleCount = TOTAL_PROFIT_INITIAL_RENDER_COUNT;
            renderTotalProfitPage();
        }
    } catch (e) {
        console.error("View hatası:", e);
    } finally {
        if (appContent) appContent.classList.remove('is-loading');
    }
}

// ─── UI BAŞLATICI ────────────────────────────────────────────────────────────
function initUI(pageName) {
  const tContainer = document.getElementById('tierPills');
  if (tContainer) {
      tContainer.innerHTML = '';
      const flipperTiers = pageName === 'flipper' ? TIERS.filter(t => t >= 5) : TIERS;
      flipperTiers.forEach(t => {
        const p = document.createElement('div');
        p.className = 'tier-pill active'; p.textContent = 'T' + t; p.dataset.tier = t;
        p.onclick = () => { p.classList.toggle('active'); updateCurrentView(); };
        tContainer.appendChild(p);
      });
  }

  const eContainer = document.getElementById('enchantPills');
  if (eContainer) {
      eContainer.innerHTML = '';
      ENCHANTS.forEach(e => {
        const p = document.createElement('div');
        p.className = 'enchant-pill active'; p.textContent = '.' + e; p.dataset.enchant = e;
        p.onclick = () => { p.classList.toggle('active'); updateCurrentView(); };
        eContainer.appendChild(p);
      });
  }

  if (pageName === 'flipper') {
    applyFlipperLicenseRestrictions();
    applyAdminOnlyControls();
  }

}

function seedAdminDemoData() {
  if (!isAdminLicense() || !licenseEntitlements?.admin?.can_seed_demo_data) {
    log(getTranslatedText('Access denied by membership'), 'warn');
    return;
  }

  const now = Date.now();
  const targetCount = FLIPPER_INITIAL_RENDER_COUNT + 5;
  const baseTemplates = [
    { rawId: 'T5_2H_BOW', name: "Expert's Bow", tier: 5, city: 'Bridgewatch', buyPrice: 81500, bmSell: 124000 },
    { rawId: 'T5_MAIN_SPEAR', name: "Expert's Spear", tier: 5, city: 'Martlock', buyPrice: 90200, bmSell: 136000 },
    { rawId: 'T5_MAIN_SWORD', name: "Expert's Broadsword", tier: 5, city: 'Fort Sterling', buyPrice: 97600, bmSell: 145000 },
    { rawId: 'T5_2H_FIRESTAFF', name: "Expert's Great Fire Staff", tier: 5, city: 'Thetford', buyPrice: 108500, bmSell: 159000 },
    { rawId: 'T5_2H_HAMMER', name: "Expert's Great Hammer", tier: 5, city: 'Bridgewatch', buyPrice: 99200, bmSell: 148500 },
    { rawId: 'T5_MAIN_AXE', name: "Expert's Battleaxe", tier: 5, city: 'Lymhurst', buyPrice: 95400, bmSell: 144000 },
    { rawId: 'T5_MAIN_NATURESTAFF', name: "Expert's Nature Staff", tier: 5, city: 'Martlock', buyPrice: 88400, bmSell: 132500 },
    { rawId: 'T5_2H_ARCANESTAFF', name: "Expert's Great Arcane Staff", tier: 5, city: 'Fort Sterling', buyPrice: 103000, bmSell: 152500 },
    { rawId: 'T6_2H_BOW', name: "Master's Bow", tier: 6, city: 'Bridgewatch', buyPrice: 118000, bmSell: 168000 },
    { rawId: 'T6_MAIN_SWORD', name: "Master's Broadsword", tier: 6, city: 'Martlock', buyPrice: 126000, bmSell: 179500 },
    { rawId: 'T6_MAIN_SPEAR', name: "Master's Spear", tier: 6, city: 'Thetford', buyPrice: 121500, bmSell: 174000 },
    { rawId: 'T6_2H_FIRESTAFF', name: "Master's Great Fire Staff", tier: 6, city: 'Lymhurst', buyPrice: 135000, bmSell: 192500 },
    { rawId: 'T6_2H_HAMMER', name: "Master's Great Hammer", tier: 6, city: 'Fort Sterling', buyPrice: 132500, bmSell: 188000 },
    { rawId: 'T6_MAIN_AXE', name: "Master's Battleaxe", tier: 6, city: 'Bridgewatch', buyPrice: 123500, bmSell: 176500 },
    { rawId: 'T6_MAIN_HOLYSTAFF', name: "Master's Holy Staff", tier: 6, city: 'Martlock', buyPrice: 129500, bmSell: 184500 },
    { rawId: 'T6_2H_CROSSBOW', name: "Master's Crossbow", tier: 6, city: 'Thetford', buyPrice: 137500, bmSell: 196000 },
    { rawId: 'T6_ARMOR_CLOTH_SET1', name: "Master's Scholar Robe", tier: 6, city: 'Lymhurst', buyPrice: 94000, bmSell: 151000 },
    { rawId: 'T6_HEAD_CLOTH_SET1', name: "Master's Scholar Cowl", tier: 6, city: 'Fort Sterling', buyPrice: 61000, bmSell: 103500 },
    { rawId: 'T6_SHOES_CLOTH_SET1', name: "Master's Scholar Sandals", tier: 6, city: 'Thetford', buyPrice: 57500, bmSell: 98250 },
    { rawId: 'T6_ARMOR_LEATHER_SET1', name: "Master's Mercenary Jacket", tier: 6, city: 'Bridgewatch', buyPrice: 88400, bmSell: 143500 },
    { rawId: 'T6_HEAD_LEATHER_SET1', name: "Master's Mercenary Hood", tier: 6, city: 'Martlock', buyPrice: 54200, bmSell: 93600 },
    { rawId: 'T6_SHOES_LEATHER_SET1', name: "Master's Mercenary Shoes", tier: 6, city: 'Lymhurst', buyPrice: 51800, bmSell: 90200 },
    { rawId: 'T6_ARMOR_PLATE_SET1', name: "Master's Soldier Armor", tier: 6, city: 'Fort Sterling', buyPrice: 101500, bmSell: 160000 },
    { rawId: 'T6_HEAD_PLATE_SET1', name: "Master's Soldier Helmet", tier: 6, city: 'Bridgewatch', buyPrice: 63600, bmSell: 107500 },
    { rawId: 'T6_SHOES_PLATE_SET1', name: "Master's Soldier Boots", tier: 6, city: 'Martlock', buyPrice: 60200, bmSell: 102000 },
    { rawId: 'T6_OFF_SHIELD', name: "Master's Shield", tier: 6, city: 'Thetford', buyPrice: 47200, bmSell: 83500 },
    { rawId: 'T6_OFF_TORCH', name: "Master's Torch", tier: 6, city: 'Lymhurst', buyPrice: 38800, bmSell: 72100 },
    { rawId: 'T6_BAG', name: "Master's Bag", tier: 6, city: 'Fort Sterling', buyPrice: 56200, bmSell: 93400 },
    { rawId: 'T7_MAIN_SWORD', name: "Grandmaster's Broadsword", tier: 7, city: 'Martlock', buyPrice: 189000, bmSell: 264000 },
    { rawId: 'T7_2H_BOW', name: "Grandmaster's Bow", tier: 7, city: 'Bridgewatch', buyPrice: 177500, bmSell: 248000 },
    { rawId: 'T7_2H_FIRESTAFF', name: "Grandmaster's Great Fire Staff", tier: 7, city: 'Thetford', buyPrice: 202500, bmSell: 279000 },
    { rawId: 'T7_MAIN_AXE', name: "Grandmaster's Battleaxe", tier: 7, city: 'Lymhurst', buyPrice: 183200, bmSell: 258000 },
    { rawId: 'T7_2H_HAMMER', name: "Grandmaster's Great Hammer", tier: 7, city: 'Fort Sterling', buyPrice: 196000, bmSell: 272500 },
    { rawId: 'T7_ARMOR_CLOTH_SET1', name: "Grandmaster's Scholar Robe", tier: 7, city: 'Bridgewatch', buyPrice: 143500, bmSell: 214500 },
    { rawId: 'T7_ARMOR_LEATHER_SET1', name: "Grandmaster's Mercenary Jacket", tier: 7, city: 'Martlock', buyPrice: 137000, bmSell: 206500 },
    { rawId: 'T7_ARMOR_PLATE_SET1', name: "Grandmaster's Soldier Armor", tier: 7, city: 'Fort Sterling', buyPrice: 152500, bmSell: 225000 },
  ];
  const displayTemplates = baseTemplates.slice(0, targetCount);
  const demoRows = displayTemplates.map((template, index) => {
    const quality = (index % 5) + 1;
    const enchant = index % 7 === 0 ? 1 : 0;
    const delta = (index * 1850) + (quality * 950);
    const directBuyPrice = template.buyPrice + delta;
    const directBmSell = template.bmSell + delta + 18000;
    return {
      rawId: enchant > 0 ? `${template.rawId}@${enchant}` : template.rawId,
      baseId: template.rawId,
      name: template.name,
      tier: template.tier,
      enchant,
      quality,
      city: template.city,
      buyPrice: directBuyPrice + (enchant > 0 ? 8000 : 0),
      bmSell: directBmSell + (enchant > 0 ? 78000 : 0),
    };
  });

  flipperItemMap.clear();
  marketDepthByCity = {};
  resourcePricesByCity = {};

  const seedDepth = (cityName, rawId, auctionType, price, amount, orderId) => {
    const normalizedItemId = normalizeMarketItemId(rawId);
    if (!marketDepthByCity[cityName]) marketDepthByCity[cityName] = {};
    if (!marketDepthByCity[cityName][normalizedItemId]) marketDepthByCity[cityName][normalizedItemId] = { offer: {}, request: {} };
    marketDepthByCity[cityName][normalizedItemId][auctionType][orderId] = { price, amount };
  };

  demoRows.forEach((row, index) => {
    flipperItemMap.set(`${normalizeMarketItemId(row.rawId)}:${row.quality}`, {
      ...row,
      citySellPrices: {},
      timestamp: now - (index * 45000),
    });
    seedDepth(row.city, row.rawId, 'offer', row.buyPrice, 6 + (index % 4), `demo-offer-${index}`);
    seedDepth('Black Market', row.rawId, 'request', row.bmSell, 4 + (index % 3), `demo-request-${index}`);
  });

  displayTemplates.forEach((template, templateIndex) => {
    const runeItemId = getArtifactMarketItemId(template.tier, 1);
    const runePrice = 58 + (templateIndex % 5) * 6;
    resourcePrices[runeItemId] = runePrice;
    if (!resourcePricesByCity[template.city]) resourcePricesByCity[template.city] = {};
    resourcePricesByCity[template.city][runeItemId] = runePrice;
    seedDepth(template.city, runeItemId, 'offer', runePrice, 5000, `demo-rune-${templateIndex}`);
  });

  // Support rows for enchant-path calculations without crowding the visible table
  demoRows
    .filter(row => row.enchant > 0)
    .forEach((row, index) => {
      const supportRawId = row.baseId;
      const supportKey = `${normalizeMarketItemId(supportRawId)}:${row.quality}`;
      if (!flipperItemMap.has(supportKey)) {
        const supportBuy = Math.max(1, row.buyPrice - 52000);
        flipperItemMap.set(supportKey, {
          rawId: supportRawId,
          baseId: row.baseId,
          name: row.name,
          tier: row.tier,
          enchant: 0,
          quality: row.quality,
          city: row.city,
          buyPrice: supportBuy,
          bmSell: supportBuy + 36000,
          citySellPrices: {},
          timestamp: now - ((targetCount + index) * 45000),
        });
        seedDepth(row.city, supportRawId, 'offer', supportBuy, 8 + (index % 3), `demo-support-offer-${index}`);
        seedDepth('Black Market', supportRawId, 'request', supportBuy + 36000, 5 + (index % 2), `demo-support-request-${index}`);
      }
    });

  itemMap = flipperItemMap;
  selectedFlipperRowKey = `${normalizeMarketItemId(demoRows[0].rawId)}:${demoRows[0].quality}`;
  log(currentLanguage === 'tr' ? 'Demo verileri yüklendi.' : 'Demo data loaded.', 'success');
  if (currentPage === 'flipper') applyFilters();
}

function updateCurrentView() {
    if (currentPage === 'flipper') applyFilters();
    if (currentPage === 'crafting') {
      if (!loadedConsumables) fetchPotionsAndFoods();
      renderCraftTable();
      updateCraftFetchButtonState();
    }
    if (currentPage === 'farm') renderFarmCalculator();
    if (currentPage === 'total-profit') renderTotalProfitPage();
    scheduleApplyTranslations(document.getElementById('app-content'));
}

function scheduleBufferedOrderProcessing() {
  if (orderProcessTimer) return;
  orderProcessTimer = setTimeout(() => {
    const queuedOrders = pendingOrdersBuffer;
    pendingOrdersBuffer = [];
    orderProcessTimer = null;
    if (queuedOrders.length) processOrders(queuedOrders);
  }, 800);
}

function setFarmMode(mode) {
  selectedFarmModeState = mode;
  syncCalculatorNavState();
  document.querySelectorAll('.farm-mode-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.farmMode === mode);
  });
  const subWrap = document.getElementById('farmSubModeWrap');
  if (subWrap) subWrap.style.display = mode === 'animal' ? 'flex' : 'none';
  if (isFarmPlantMode(mode)) {
    const pool = getActiveFarmPlantItems(mode);
    if (!pool.includes(selectedFarmItemState)) selectedFarmItemState = pool[0];
  }
  if (mode === 'animal') {
    const pool = getAnimalSubModeItems(selectedAnimalSubModeState);
    if (!pool.includes(selectedFarmItemState)) selectedFarmItemState = pool[0];
  }
  renderFarmCalculator();
}

const CRAFT_MODE_STATE_FIELD_IDS = [
  'singleItemSelect',
  'itemSearchInput',
  'singleTier',
  'singleEnchant',
  'singleEnchantAmount',
  'craftingFee',
  'rrrRate',
  'craftBaseFocus',
  'craftMasteryLevel',
  'craftItemSpecLevel',
  'craftOtherSpecTotal',
  'craftTotalFocusPool',
  'journalCount',
  'journalProfit'
];

function saveCraftModeState(mode = renderedCraftModeState) {
  if (currentPage !== 'crafting' || !mode) return;
  const values = {};
  CRAFT_MODE_STATE_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    values[id] = el.value;
    if (id === 'rrrRate') values.rrrBaseValue = el.dataset.baseValue || el.value;
  });
  ['craftFocusBonus', 'cityProductionBonus', 'dailyProductionBonus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) values[id] = !!el.checked;
  });
  values.hasSelection = !!values.singleItemSelect;
  craftModeFormState[mode] = values;
}

function restoreCraftModeState(mode = selectedCraftModeState) {
  const state = craftModeFormState[mode];
  const resultBox = document.getElementById('singleItemResult');

  if (!state) {
    resetCraftModeDomToDefaults();
    return;
  }

  CRAFT_MODE_STATE_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el || state[id] == null) return;
    el.value = state[id];
    if (id === 'rrrRate' && state.rrrBaseValue != null) el.dataset.baseValue = state.rrrBaseValue;
  });
  ['craftFocusBonus', 'cityProductionBonus', 'dailyProductionBonus'].forEach(id => {
    const el = document.getElementById(id);
    if (el && state[id] != null) el.checked = !!state[id];
  });

  updateBonusToggleVisuals();
  updateCraftSelectColors();
  updateCraftFetchButtonState();

  if (state.hasSelection) {
    analyzeSingleItem();
    ['journalCount', 'journalProfit'].forEach(id => {
      const el = document.getElementById(id);
      if (el && state[id] != null) el.value = state[id];
    });
    analyzeSingleItem();
  } else if (resultBox) {
    resultBox.style.display = 'none';
  }
}

function clearActiveCraftModeState() {
  delete craftModeFormState[selectedCraftModeState];
  restoreCraftModeState(selectedCraftModeState);
}

function resetCraftModeDomToDefaults() {
  const defaults = {
    singleItemSelect: '',
    itemSearchInput: '',
    singleTier: '4',
    singleEnchant: '0',
    singleEnchantAmount: '0',
    craftingFee: '0',
    rrrRate: '15.2',
    craftBaseFocus: '0',
    craftMasteryLevel: '0',
    craftItemSpecLevel: '0',
    craftOtherSpecTotal: '0',
    craftTotalFocusPool: '0'
  };
  Object.entries(defaults).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = value;
    if (id === 'rrrRate') el.dataset.baseValue = value;
  });
  ['craftFocusBonus', 'cityProductionBonus', 'dailyProductionBonus'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });
  const finalFocusDisplay = document.getElementById('finalFocusCostDisplay');
  if (finalFocusDisplay) finalFocusDisplay.textContent = '0';
  const resultBox = document.getElementById('singleItemResult');
  if (resultBox) {
    resultBox.style.display = 'none';
    resultBox.innerHTML = '';
  }
  updateBonusToggleVisuals();
  updateCraftSelectColors();
  updateCraftFetchButtonState();
}

function setCraftMode(mode, options = {}) {
  if (!options.skipSave && renderedCraftModeState !== mode) {
    saveCraftModeState(renderedCraftModeState);
  }
  selectedCraftModeState = mode;
  renderedCraftModeState = mode;
  
  document.querySelectorAll('.craft-mode-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.craftMode === mode);
  });
  
  const eqPanel = document.getElementById('equipmentCraftPanel');
  const tierWrap = document.getElementById('tierWrapper');
  const enchantWrap = document.getElementById('enchantWrapper');
  const artWrap = document.getElementById('artifactCostWrapper');
  const divTier = document.getElementById('dividerTier');
  const divArt = document.getElementById('dividerArtifact');
  const panelTitle = document.getElementById('craftPanelTitle');
  
  const isConsumable = mode === 'potion' || mode === 'food' || mode === 'consumable';
  const modeCopy = {
      equipment: {
          icon: '⚔️',
          title: 'Equipment Calculator',
          label: 'Target Item Selection',
          placeholder: currentLanguage === 'tr' ? 'Örn: Bloodletter, Mercenary Jacket...' : 'For example: Bloodletter, Mercenary Jacket...'
      },
      potion: {
          icon: '🧪',
          title: 'Potion Calculator',
          label: 'Potion Selection',
          placeholder: getTranslatedText('Search potion...')
      },
      food: {
          icon: '🍲',
          title: 'Food Calculator',
          label: 'Food Selection',
          placeholder: getTranslatedText('Search food...')
      },
      consumable: {
          icon: '🧪',
          title: 'Albion Craft Simulator',
          label: 'Target Item Selection',
          placeholder: currentLanguage === 'tr' ? 'İksir veya yemek ara...' : 'Search potion or food...'
      }
  };
  const copy = modeCopy[mode] || modeCopy.equipment;

  if (panelTitle) panelTitle.innerHTML = `<i>${copy.icon}</i> ${getTranslatedText(copy.title)}`;
  
  if (eqPanel) {
      eqPanel.style.display = '';
      const label = eqPanel.querySelector('label');
      const input = eqPanel.querySelector('input[type="text"]');
      if (label) label.textContent = getTranslatedText(copy.label);
      if (input) input.placeholder = copy.placeholder;
  }

  updateCraftEnchantOptions(mode);
  syncCraftBonusCityForMode(mode);
  
  if (tierWrap) tierWrap.style.display = isConsumable ? 'none' : '';
  if (enchantWrap) enchantWrap.style.display = '';
  if (artWrap) artWrap.style.display = isConsumable ? 'none' : '';
  if (divTier) divTier.style.display = '';
  if (divArt) divArt.style.display = isConsumable ? 'none' : '';
  
  syncCalculatorNavState();

  if (currentPage === 'crafting') {
      populateItemSelect();
      restoreCraftModeState(mode);
      updateCurrentView();
  }
}

function updateCraftEnchantOptions(mode = selectedCraftModeState) {
  const enchantSelect = document.getElementById('singleEnchant');
  if (!enchantSelect) return;

  const currentValue = enchantSelect.value || '0';
  const materialLabel = mode === 'food'
    ? getTranslatedText('Fish Sauce')
    : (mode === 'potion' ? getTranslatedText('Arcane Extract') : null);

  const options = materialLabel
    ? [
        { value: '0', label: '.0 (Normal)', color: 'var(--text)' },
        { value: '1', label: `.1 (${materialLabel} I)`, color: '#4ade80' },
        { value: '2', label: `.2 (${materialLabel} II)`, color: '#60a5fa' },
        { value: '3', label: `.3 (${materialLabel} III)`, color: '#c084fc' }
      ]
    : [
        { value: '0', label: '.0 (Normal)', color: 'var(--text)' },
        { value: '1', label: '.1 (Rune)', color: '#4ade80' },
        { value: '2', label: '.2 (Soul)', color: '#60a5fa' },
        { value: '3', label: '.3 (Relic)', color: '#c084fc' }
      ];

  enchantSelect.innerHTML = options
    .map(option => `<option value="${option.value}" style="color:${option.color}">${option.label}</option>`)
    .join('');
  enchantSelect.value = ['0', '1', '2', '3'].includes(currentValue) ? currentValue : '0';
}

function updateCraftFetchButtonState() {
  const button = document.getElementById('craftFetchPricesBtn');
  if (!button) return;
  const hasSelection = !!document.getElementById('singleItemSelect')?.value;
  button.disabled = craftPriceFetchLoading || !hasSelection;
  button.textContent = craftPriceFetchLoading
    ? getTranslatedText('Fetching...')
    : getTranslatedText('Fetch Live Prices');
}

function setAnimalSubMode(mode) {
  selectedAnimalSubModeState = ['kennel', 'livestock'].includes(mode) ? mode : 'pasture';
  syncCalculatorNavState();
  document.querySelectorAll('.animal-sub-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.animalSub === selectedAnimalSubModeState);
  });
  const pool = getAnimalSubModeItems(selectedAnimalSubModeState);
  if (!pool.includes(selectedFarmItemState)) selectedFarmItemState = pool[0];
  renderFarmCalculator();
}

function setFarmItem(itemName) {
  selectedFarmItemState = itemName;
  renderFarmCalculator();
}

function setAnimalBonusCityActive(active) {
  setFarmStoredValue('farmAnimalBonusCityActive', active ? 1 : 0);
  const toggle = document.getElementById('farmAnimalBonusToggle');
  if (toggle) toggle.classList.toggle('on', !!active);
  if (farmBonusRenderTimer) clearTimeout(farmBonusRenderTimer);
  farmBonusRenderTimer = setTimeout(() => {
    renderFarmCalculator();
    farmBonusRenderTimer = null;
  }, 220);
}

function setCropBonusCityActive(active) {
  setFarmStoredValue('farmCropBonusCityActive', active ? 1 : 0);
  const toggle = document.getElementById('farmCropBonusToggle');
  if (toggle) toggle.classList.toggle('on', !!active);
  if (farmBonusRenderTimer) clearTimeout(farmBonusRenderTimer);
  farmBonusRenderTimer = setTimeout(() => {
    renderFarmCalculator();
    farmBonusRenderTimer = null;
  }, 220);
}

function setCropWateringActive(active) {
  setFarmStoredValue('farmCropWateringActive', active ? 1 : 0);
  const toggle = document.getElementById('farmCropWateringToggle');
  if (toggle) toggle.classList.toggle('on', !!active);
  if (farmBonusRenderTimer) clearTimeout(farmBonusRenderTimer);
  farmBonusRenderTimer = setTimeout(() => {
    renderFarmCalculator();
    farmBonusRenderTimer = null;
  }, 220);
}

function getFarmStateScope(mode = selectedFarmModeState, subMode = selectedAnimalSubModeState, itemName = selectedFarmItemState) {
  return `${mode}:${subMode}:${itemName}`;
}

function getFarmStoredNumber(field, fallback = 0, mode = selectedFarmModeState, subMode = selectedAnimalSubModeState, itemName = selectedFarmItemState) {
  const scope = getFarmStateScope(mode, subMode, itemName);
  const scopeValues = farmFormValues[scope] || {};
  const value = scopeValues[field];
  return value == null || Number.isNaN(value) ? fallback : value;
}

function normalizeAlbionDataItemId(itemId) {
  return String(itemId || '').replace(/@.*/g, '');
}

function setFarmStoredValue(field, value, mode = selectedFarmModeState, subMode = selectedAnimalSubModeState, itemName = selectedFarmItemState) {
  const scope = getFarmStateScope(mode, subMode, itemName);
  if (!farmFormValues[scope]) farmFormValues[scope] = {};
  farmFormValues[scope][field] = Number(value) || 0;
}

function getBestFarmApiPrice(entries) {
  const values = entries
    .map(entry => Number(entry?.sell_price_min || 0))
    .filter(value => Number.isFinite(value) && value > 0);

  if (values.length) return Math.min(...values);

  const fallbackValues = entries
    .map(entry => Number(entry?.buy_price_max || 0))
    .filter(value => Number.isFinite(value) && value > 0);

  if (!fallbackValues.length) return 0;
  return Math.min(...fallbackValues);
}

function getCurrentFarmPriceLocations() {
  const preset = getSelectedFarmPreset();
  const presetCities = parseFarmCityList(preset?.bonusCity || '');
  return presetCities.length ? presetCities : FARM_PRICE_LOCATIONS;
}

function getCurrentFarmPriceTargets() {
  if (isFarmPlantMode(selectedFarmModeState)) {
    const seedId = normalizeAlbionDataItemId(FARM_ICON_IDS[selectedFarmItemState] || '');
    const productId = normalizeAlbionDataItemId(FARM_PRODUCT_ICON_IDS[selectedFarmItemState] || '');
    return [
      { field: 'farmCropSeedCost', itemId: seedId },
      { field: 'farmCropSellPrice', itemId: productId }
    ].filter(target => target.itemId);
  }

  const babyId = normalizeAlbionDataItemId(FARM_ICON_IDS[selectedFarmItemState] || '');
  const grownId = normalizeAlbionDataItemId(ANIMAL_GROWN_ICON_IDS[selectedFarmItemState] || '');
  const preset = getSelectedFarmPreset() || {};
  const productInfo = preset.productInfo || {};
  const byproductId = normalizeAlbionDataItemId(ANIMAL_PRODUCT_ICON_IDS[productInfo.byproduct] || '');
  const targets = [
    { field: 'farmAnimalBabyCost', itemId: babyId },
    { field: 'farmAnimalSellValue', itemId: grownId }
  ];

  if (selectedAnimalSubModeState === 'livestock' && byproductId) {
    targets.push({ field: 'farmAnimalByproductPrice', itemId: byproductId });
  }

  const mountRecipes = getAnimalMountRecipes(selectedFarmItemState);
  const storedMountRecipeIndex = Math.max(0, Math.floor(getFarmStoredNumber('farmAnimalMountRecipeIndex', 0)));
  const mountRecipeIndex = Math.min(storedMountRecipeIndex, Math.max(0, mountRecipes.length - 1));
  const mountRecipe = mountRecipes[mountRecipeIndex] || null;

  if (mountRecipe?.mountItemId) {
    targets.push({
      field: 'farmAnimalMountSellValue',
      itemId: normalizeAlbionDataItemId(mountRecipe.mountItemId)
    });
  }

  if (mountRecipe?.material1?.itemId) {
    targets.push({
      field: 'farmAnimalMountMat1Price',
      itemId: normalizeAlbionDataItemId(mountRecipe.material1.itemId)
    });
  }

  if (mountRecipe?.material2?.itemId) {
    targets.push({
      field: 'farmAnimalMountMat2Price',
      itemId: normalizeAlbionDataItemId(mountRecipe.material2.itemId)
    });
  }

  return targets.filter(target => target.itemId);
}

async function fetchFarmPricesForCurrentItem() {
  if (farmPriceFetchLoading) return;
  const targets = getCurrentFarmPriceTargets();
  if (!targets.length) return;

  farmPriceFetchLoading = true;
  renderFarmCalculator();

  try {
    const uniqueIds = [...new Set(targets.map(target => target.itemId))];
    const targetLocations = getCurrentFarmPriceLocations();
    const url = `${ALBION_DATA_API_HOST}/api/v2/stats/prices/${uniqueIds.join(',')}.json?locations=${encodeURIComponent(targetLocations.join(','))}&qualities=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();

    const grouped = new Map();
    (Array.isArray(rows) ? rows : []).forEach(row => {
      const itemId = normalizeAlbionDataItemId(row?.item_id || '');
      if (!itemId) return;
      if (!grouped.has(itemId)) grouped.set(itemId, []);
      grouped.get(itemId).push(row);
    });

    targets.forEach(target => {
      const entries = grouped.get(target.itemId) || [];
      const preferredEntries = entries.filter(entry => targetLocations.includes(entry?.city));
      const price = getBestFarmApiPrice(preferredEntries.length ? preferredEntries : entries);
      if (price > 0) {
        setFarmStoredValue(target.field, Math.round(price));
      }
    });

    persistFarmState();
  } catch (e) {
    console.error('Farm fiyat cekme hatasi:', e);
  } finally {
    farmPriceFetchLoading = false;
    renderFarmCalculator();
  }
}

function parseFarmNumericInput(rawValue) {
  const normalized = String(rawValue ?? '')
    .replace(/[^\d]/g, '');
  const parsed = parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatFarmInputValue(value) {
  const numeric = Number(value) || 0;
  return formatNum(Math.round(numeric));
}

function setFarmStoredNumber(field, rawValue) {
  const activeEl = document.activeElement;
  if (activeEl && activeEl.tagName === 'INPUT') {
    farmFocusedInputState = {
      id: activeEl.id,
      start: activeEl.selectionStart,
      end: activeEl.selectionEnd
    };
  }
  const scope = getFarmStateScope();
  if (!farmFormValues[scope]) farmFormValues[scope] = {};
  farmFormValues[scope][field] = parseFarmNumericInput(rawValue);
  persistFarmState();
  renderFarmCalculator();
  restoreFarmFocusedInput();
}

function getFarmSharedNumber(field, fallback = 0) {
  const value = farmSharedValues[field];
  return value == null || Number.isNaN(value) ? fallback : value;
}

function setFarmSharedNumber(field, rawValue) {
  const activeEl = document.activeElement;
  if (activeEl && activeEl.tagName === 'INPUT') {
    farmFocusedInputState = {
      id: activeEl.id,
      start: activeEl.selectionStart,
      end: activeEl.selectionEnd
    };
  }
  const parsedValue = parseFarmNumericInput(rawValue);
  const clampedValue = /FocusPool$/i.test(field)
    ? Math.min(parsedValue, FARM_MAX_FOCUS_POOL)
    : parsedValue;
  farmSharedValues[field] = clampedValue;
  persistFarmState();
  renderFarmCalculator();
  restoreFarmFocusedInput();
}

function persistFarmState() {
  try {
    localStorage.setItem(FARM_FORM_STORAGE_KEY, JSON.stringify(farmFormValues));
    localStorage.setItem(FARM_SHARED_STORAGE_KEY, JSON.stringify(farmSharedValues));
  } catch (e) {}
}

function loadPersistedFarmState() {
  try {
    const savedForm = localStorage.getItem(FARM_FORM_STORAGE_KEY);
    const savedShared = localStorage.getItem(FARM_SHARED_STORAGE_KEY);
    if (savedForm) {
      const parsedForm = JSON.parse(savedForm);
      if (parsedForm && typeof parsedForm === 'object') farmFormValues = parsedForm;
    }
    if (savedShared) {
      const parsedShared = JSON.parse(savedShared);
      if (parsedShared && typeof parsedShared === 'object') farmSharedValues = parsedShared;
    }
  } catch (e) {}
}

function restoreFarmFocusedInput() {
  if (!farmFocusedInputState?.id) return;
  const focusInput = () => {
    const input = document.getElementById(farmFocusedInputState.id);
    if (!input) return;
    input.focus();
    const endPos = String(input.value ?? '').length;
    try {
      input.setSelectionRange(endPos, endPos);
    } catch (_) {}
  };
  focusInput();
  requestAnimationFrame(focusInput);
}

function farmScopeHasEnteredData(mode = selectedFarmModeState, subMode = selectedAnimalSubModeState, itemName = selectedFarmItemState) {
  const scope = getFarmStateScope(mode, subMode, itemName);
  const scopeValues = farmFormValues[scope];
  if (!scopeValues) return false;
  const relevantFields = isFarmPlantMode(mode)
    ? ['farmCropWateredSlotCount', 'farmCropUnwateredSlotCount', 'farmCropSeedCost', 'farmCropSellPrice']
      : ['farmAnimalCount', 'farmAnimalBabyCost', 'farmAnimalFoodCost', 'farmAnimalSellValue', 'farmAnimalByproductPrice', 'farmAnimalMountSellValue', 'farmAnimalMountMat1Price', 'farmAnimalMountMat2Price'];
  return relevantFields.some(field => {
    const value = scopeValues[field];
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric !== 0;
  });
}

function getSelectedFarmPreset() {
  return isFarmPlantMode(selectedFarmModeState)
    ? (FARM_PRESETS[selectedFarmItemState] || null)
    : (ANIMAL_PRESETS[selectedFarmItemState] || null);
}

function renderFarmCityTags(cityText) {
  if (!cityText) return '';
  const cities = parseFarmCityList(cityText);
  return cities
    .map(city => {
      const cityColor = CITY_COLORS[city] || '#f4d38a';
      return `<span class="city-tag" style="border-color:${cityColor}; color:${cityColor}; background:${hexToRgba(cityColor, 0.14)}; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);">${city}</span>`;
    })
    .join('');
}

function parseFarmCityList(cityText) {
  if (!cityText) return [];
  const knownCities = Object.keys(CITY_COLORS)
    .sort((a, b) => b.length - a.length);
  const remaining = String(cityText).replace(/\//g, ' ').trim();
  const found = [];

  knownCities.forEach(city => {
    const pattern = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(remaining)) found.push(city);
  });

  if (found.length) return found;
  return remaining.split(/\s{2,}|\//).map(city => city.trim()).filter(Boolean);
}

function renderFarmPresetBonusCityCards(cityText) {
  if (!cityText) return '';
  const cities = parseFarmCityList(cityText).sort((a, b) => {
    if (a === 'Brecilien' && b !== 'Brecilien') return 1;
    if (b === 'Brecilien' && a !== 'Brecilien') return -1;
    return 0;
  });

  return cities.map(city => `
    <div class="farm-preset-city-card">
      <span class="farm-preset-city-mini-tag">${getTranslatedText('Bonus City')}</span>
      <div class="farm-city-tag-row">${renderFarmCityTags(city)}</div>
    </div>
  `).join('');
}

function formatAlbionItemLabel(uniqueName) {
  if (!uniqueName) return '';
  const cleanId = String(uniqueName).replace(/@.*/g, '').trim();
  const resourceMatch = cleanId.match(/^T(\d+)_(METALBAR|PLANKS|LEATHER|CLOTH|RUNE|SOUL|RELIC)(?:_LEVEL(\d+))?$/i);
  if (resourceMatch) {
    const labelMap = {
      METALBAR: 'Bar',
      PLANKS: 'Plank',
      LEATHER: 'Leather',
      CLOTH: 'Cloth',
      RUNE: 'Rune',
      SOUL: 'Soul',
      RELIC: 'Relic'
    };
    const tier = `T${resourceMatch[1]}`;
    const resourceLabel = labelMap[resourceMatch[2].toUpperCase()] || resourceMatch[2];
    return `${tier} ${resourceLabel}`;
  }

  const cleaned = cleanId
    .replace(/^T(\d+)_/, 'T$1 ')
    .replace(/_/g, ' ')
    .trim();
  return cleaned.replace(/\b\w/g, char => char.toUpperCase());
}

function getAnimalNameByGrownId(grownId) {
  return Object.entries(ANIMAL_GROWN_ICON_IDS).find(([, value]) => value === grownId)?.[0] || null;
}

function getAnimalMountRecipes(itemName) {
  const loaded = loadedAnimalMountRecipes[itemName];
  if (Array.isArray(loaded) && loaded.length) {
    const armoredAllowedFoals = new Set(["Expert's Foal", "Master's Foal", "Grandmaster's Foal"]);
    if (/Foal/.test(itemName) && !armoredAllowedFoals.has(itemName)) {
      return loaded.filter(recipe => !/ARMORED_HORSE/i.test(recipe?.mountItemId || ''));
    }
    if (/Ox Calf/.test(itemName)) {
      return loaded.filter(recipe => /^T\d+_MOUNT_OX$/i.test(recipe?.mountItemId || ''));
    }
    return loaded;
  }
  const fallback = ANIMAL_MOUNT_RECIPES[itemName];
  return fallback ? [fallback] : [];
}

function getAnimalFeedingsCount(preset) {
  const explicitFeedings = Number(preset?.feedings || 0);
  if (Number.isFinite(explicitFeedings) && explicitFeedings > 0) return explicitFeedings;
  const growHours = Number(preset?.growHours || 0);
  if (!Number.isFinite(growHours) || growHours <= 0) return 0;
  if (growHours <= 22) return 1;
  if (growHours <= 46) return 2;
  if (growHours <= 70) return 3;
  if (growHours <= 94) return 4;
  if (growHours <= 118) return 5;
  return 6;
}

function formatAnimalDietAmount(dietAmount) {
  if (!dietAmount) return '';
  return String(dietAmount).split('/')[0].trim();
}

function getAnimalDietUnitsPerFeeding(preset) {
  const preferred = preset?.favoriteDietAmount || preset?.dietAmount || '0';
  const parsed = parseFloat(formatAnimalDietAmount(preferred));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAnimalFoodUnitLabel(preset) {
  if (preset?.favoriteDietType) return `1 ${preset.favoriteDietType}`;
  if (preset?.dietType === 'meat') return `1 ${getTranslatedText('Meat')}`;
  if (preset?.dietType === 'plants') return `1 ${getTranslatedText('Plant')}`;
  return '1 Feed';
}

function getMountRecipeVariantLabel(recipe) {
  const mountId = recipe?.mountItemId || '';
  if (/_ARMORED_HORSE$/i.test(mountId)) return 'Zirhli';
  if (/MOUNT_HORSE$/i.test(mountId)) return 'Normal';
  return recipe?.mountLabel || 'Secenek';
}

function setFarmMountRecipe(index) {
  const scope = getFarmStateScope();
  if (!farmFormValues[scope]) farmFormValues[scope] = {};
  farmFormValues[scope].farmAnimalMountRecipeIndex = index;
  persistFarmState();
  renderFarmCalculator();
}

function clearFarmItemInputs(mode = selectedFarmModeState, subMode = selectedAnimalSubModeState, itemName = selectedFarmItemState) {
  const scope = getFarmStateScope(mode, subMode, itemName);
  if (farmFormValues[scope]) {
    const currentValues = farmFormValues[scope];
    const preservedFields = isFarmPlantMode(mode)
      ? ['farmCropItemSpec']
      : ['farmAnimalItemLevel'];
    const nextValues = {};
    preservedFields.forEach(field => {
      if (currentValues[field] != null) nextValues[field] = currentValues[field];
    });
    if (Object.keys(nextValues).length) {
      farmFormValues[scope] = nextValues;
    } else {
      delete farmFormValues[scope];
    }
    persistFarmState();
  }
  renderFarmCalculator();
}

function getFarmMarketPrice(itemId) {
  if (!itemId) return 0;
  const baseId = String(itemId).split('@')[0];
  return resourcePrices[baseId] || resourcePrices[itemId] || 0;
}

async function fetchMountRecipes() {
  try {
    const r = await fetch('data/mount-recipes.json');
    if (!r.ok) return;
    const data = await r.json();
    const mountList = Array.isArray(data) ? data : [];
    const nextRecipes = {};

    mountList.forEach(mount => {
      const mountItemId = mount?.uniquename;
      const req = mount?.craftingrequirements;
      const resources = req?.craftresource;
      const resourceList = Array.isArray(resources) ? resources : (resources ? [resources] : []);
      if (!mountItemId || resourceList.length < 2) return;

      const grownResource = resourceList.find(res => String(res?.uniquename || '').includes('_FARM_') && String(res?.uniquename || '').includes('_GROWN'));
      if (!grownResource) return;
      const animalName = getAnimalNameByGrownId(grownResource.uniquename);
      if (!animalName) return;

      const materialResources = resourceList.filter(res => res !== grownResource);
      const recipe = {
        mountLabel: formatAlbionItemLabel(mountItemId),
        mountItemId,
        focus: parseFloat(req?.craftingfocus || '0') || 0,
        time: parseFloat(req?.time || '0') || 0
      };

      if (materialResources[0]) {
        recipe.material1 = {
          label: formatAlbionItemLabel(materialResources[0].uniquename),
          amount: parseInt(materialResources[0].count || '0', 10) || 0,
          itemId: materialResources[0].uniquename
        };
      }

      if (materialResources[1]) {
        const material2Id = materialResources[1].uniquename || '';
        recipe.material2 = {
          label: formatAlbionItemLabel(material2Id),
          amount: parseInt(materialResources[1].count || '0', 10) || 0,
          itemId: material2Id
        };
      }

      if (!nextRecipes[animalName]) nextRecipes[animalName] = [];
      nextRecipes[animalName].push(recipe);
    });

    loadedAnimalMountRecipes = nextRecipes;
    if (currentPage === 'farm') renderFarmCalculator();
  } catch (e) {}
}

function getFarmSidebarIcon(itemName) {
  const itemId = FARM_ICON_IDS[itemName] || '';
  if (itemId) {
    return `<img src="${getAlbionIconUrl(itemId, 128)}" style="border-radius:6px;" class="farm-list-icon" loading="eager" fetchpriority="high" decoding="async" alt="">`;
  }
  const animalIcon = selectedAnimalSubModeState === 'kennel' ? '🐾' : (selectedAnimalSubModeState === 'livestock' ? '🐄' : '🐎');
  return `<span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:8px; background:rgba(255,255,255,0.06); border:1px solid var(--border); font-size:14px;">${isFarmPlantMode(selectedFarmModeState) ? (selectedFarmModeState === 'herb' ? '🌿' : '🌱') : animalIcon}</span>`;
}

function renderFarmCalculator() {
  const container = document.getElementById('farmContent');
  if (!container) return;

  document.querySelectorAll('.farm-mode-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.farmMode === selectedFarmModeState);
    btn.style.display = isFarmPlantMode(selectedFarmModeState)
      ? (btn.dataset.farmMode === selectedFarmModeState ? 'inline-flex' : 'none')
      : 'none';
  });
  document.querySelectorAll('.animal-sub-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.animalSub === selectedAnimalSubModeState);
    btn.style.display = selectedFarmModeState === 'animal' ? 'inline-flex' : 'none';
  });
  const subWrap = document.getElementById('farmSubModeWrap');
  if (subWrap) subWrap.style.display = selectedFarmModeState === 'animal' ? 'flex' : 'none';

  const activeItems = isFarmPlantMode(selectedFarmModeState)
    ? getActiveFarmPlantItems(selectedFarmModeState)
    : getAnimalSubModeItems(selectedAnimalSubModeState);

  if (!activeItems.includes(selectedFarmItemState)) selectedFarmItemState = activeItems[0];

  const sharedSpecHtml = isFarmPlantMode(selectedFarmModeState)
    ? `
      <div class="farm-side-shared">
        <div class="farm-side-shared-title">${getTranslatedText('Shared Spec')}</div>
        <div class="farm-input-grid farm-input-grid-shared">
          <div class="farm-input-card farm-input-card-shared">
            <label class="farm-input-label"><span class="farm-input-label-row">${getFarmUiInputIcon('kademe-icon.png')}<span>${getTranslatedText('Crop Main Spec')}</span></span></label>
            <input type="text" inputmode="numeric" id="farmCropFarmerSpecShared" value="${formatFarmInputValue(getFarmSharedNumber('farmCropFarmerSpecShared', 0))}" class="modern-input farm-input-field" style="width:100%;" oninput="setFarmSharedNumber('farmCropFarmerSpecShared', this.value)">
          </div>
          <div class="farm-input-card farm-input-card-shared">
            <label class="farm-input-label"><span class="farm-input-label-row">${getFarmUiInputIcon('hayvanfocus-iconn.png')}<span>${getTranslatedText('Total Focus Points')}</span></span></label>
            <input type="text" inputmode="numeric" id="farmCropTotalFocusPool" value="${formatFarmInputValue(getFarmSharedNumber('farmCropTotalFocusPool', 0))}" class="modern-input farm-input-field" style="width:100%;" oninput="setFarmSharedNumber('farmCropTotalFocusPool', this.value)">
          </div>
        </div>
      </div>
    `
    : `
      <div class="farm-side-shared">
        <div class="farm-side-shared-title">${getTranslatedText('Shared Spec')}</div>
        <div class="farm-input-grid farm-input-grid-shared">
          <div class="farm-input-card farm-input-card-shared">
            <label class="farm-input-label"><span class="farm-input-label-row">${getFarmUiInputIcon('Hayvanspeclevel-icon.png')}<span>${getTranslatedText('Main Animal Level')}</span></span></label>
            <input type="text" inputmode="numeric" id="farmAnimalBreederLevelShared" value="${formatFarmInputValue(getFarmSharedNumber('farmAnimalBreederLevelShared', 0))}" class="modern-input farm-input-field" style="width:100%;" oninput="setFarmSharedNumber('farmAnimalBreederLevelShared', this.value)">
          </div>
          <div class="farm-input-card farm-input-card-shared">
            <label class="farm-input-label"><span class="farm-input-label-row">${getFarmUiInputIcon('hayvanfocus-iconn.png')}<span>${getTranslatedText('Total Focus Points')}</span></span></label>
            <input type="text" inputmode="numeric" id="farmAnimalTotalFocusPool" value="${formatFarmInputValue(getFarmSharedNumber('farmAnimalTotalFocusPool', 0))}" class="modern-input farm-input-field" style="width:100%;" oninput="setFarmSharedNumber('farmAnimalTotalFocusPool', this.value)">
          </div>
        </div>
      </div>
    `;

  const sidebarHtml = `
    <div class="glass-panel farm-side-panel ${isFarmPlantMode(selectedFarmModeState) ? 'farm-side-panel-crop' : 'farm-side-panel-animal'}">
      <div class="farm-card-title" style="margin-bottom:14px;">
        ${getTranslatedText(isFarmPlantMode(selectedFarmModeState) ? (selectedFarmModeState === 'herb' ? 'Herb Seeds' : 'Farm Seeds') : getAnimalSubModeTitle(selectedAnimalSubModeState))}
      </div>
      ${sharedSpecHtml}
      <div class="farm-side-list">
        ${activeItems.map(item => `
          <div role="button" tabindex="0" onclick="setFarmItem('${item.replace(/'/g, "\\'")}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();setFarmItem('${item.replace(/'/g, "\\'")}')}" class="farm-item-button ${(selectedFarmItemState === item) ? 'active' : ''} ${farmScopeHasEnteredData(selectedFarmModeState, selectedAnimalSubModeState, item) ? 'has-data' : ''}">
            <span class="farm-item-main">
              ${getFarmSidebarIcon(item)}
              <span class="farm-item-name">${getTranslatedText(item)}</span>
            </span>
            ${farmScopeHasEnteredData(selectedFarmModeState, selectedAnimalSubModeState, item) ? `<span class="farm-item-actions"><button type="button" class="farm-item-clear-btn" title="Clear ${item} data" aria-label="Clear ${item} data" onclick="event.stopPropagation(); clearFarmItemInputs('${selectedFarmModeState}','${selectedAnimalSubModeState}','${item.replace(/'/g, "\\'")}')">🗑</button><span class="farm-item-data-dot"></span></span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;

  if (selectedFarmModeState === 'animal') {
    const preset = getSelectedFarmPreset() || {};
    const selectedAnimalBonusCityActive = getFarmStoredNumber('farmAnimalBonusCityActive', 0) === 1;
    const animalCount = getFarmStoredNumber('farmAnimalCount', 0);
    const babyCost = getFarmStoredNumber('farmAnimalBabyCost', 0);
    const foodUnitPrice = getFarmStoredNumber('farmAnimalFoodCost', 0);
    const sellValue = getFarmStoredNumber('farmAnimalSellValue', 0);
    const animalBreederLevel = getFarmSharedNumber('farmAnimalBreederLevelShared', 0);
    const animalItemLevel = getFarmStoredNumber('farmAnimalItemLevel', 0);
    const animalEfficiency = (animalBreederLevel * 100) + (animalItemLevel * 200);
    const focusPointsPerAnimal = Math.round(1000 * Math.pow(0.5, animalEfficiency / 10000));
    const isLivestock = ['Baby Chickens', 'Kid', 'Gosling', 'Lamb', 'Piglet', 'Calf'].includes(selectedFarmItemState);
    const bonusYieldRate = isLivestock && selectedAnimalBonusCityActive ? 0.10 : 0;
    const animalYieldLabel = 'Offspring Yield';
    const mountRecipes = getAnimalMountRecipes(selectedFarmItemState);
    const storedMountRecipeIndex = Math.max(0, Math.floor(getFarmStoredNumber('farmAnimalMountRecipeIndex', 0)));
    const mountRecipeIndex = Math.min(storedMountRecipeIndex, Math.max(0, mountRecipes.length - 1));
    const mountRecipe = mountRecipes[mountRecipeIndex] || null;
    const mountDisplayLabel = mountRecipe ? getResolvedMountRecipeLabel(selectedFarmItemState, mountRecipe) : '';
    const mountMaterial1Label = mountRecipe ? getResolvedMountMaterialLabel(selectedFarmItemState, mountRecipe, 1) : '';
    const mountMaterial2Label = mountRecipe?.material2 ? getResolvedMountMaterialLabel(selectedFarmItemState, mountRecipe, 2) : '';
    const mountSellValue = getFarmStoredNumber('farmAnimalMountSellValue', 0);
    const mountMat1AutoPrice = mountRecipe?.material1?.itemId ? getFarmMarketPrice(mountRecipe.material1.itemId) : 0;
    const mountMat2AutoPrice = mountRecipe?.material2?.itemId ? getFarmMarketPrice(mountRecipe.material2.itemId) : 0;
    const mountMat1Price = getFarmStoredNumber('farmAnimalMountMat1Price', mountMat1AutoPrice);
    const mountMat2Price = getFarmStoredNumber('farmAnimalMountMat2Price', mountMat2AutoPrice);
    const feedingsPerAnimal = getAnimalFeedingsCount(preset);
    const dietUnitsPerFeeding = getAnimalDietUnitsPerFeeding(preset);
    const dailyBonusYield = feedingsPerAnimal > 0
      ? ((preset.totalYield || 0) - (preset.baseYield || 0)) / feedingsPerAnimal
      : 0;
    const totalFoodCostPerAnimal = foodUnitPrice * dietUnitsPerFeeding * feedingsPerAnimal;
    const effectiveOffspringYield = (preset.totalYield || 0) + bonusYieldRate;
    const expectedOffspringValue = babyCost * effectiveOffspringYield;
    const livestockInfo = isLivestock ? (preset.productInfo || {}) : {};
    const byproductPrice = getFarmStoredNumber('farmAnimalByproductPrice', 0);
    const livestockProductionAmount = getRangeAverage(livestockInfo.productionRange);
    const livestockExpectedOffspringValue = livestockInfo.byproduct ? expectedOffspringValue : 0;
    const livestockProductionProfitPerAnimal = livestockInfo.byproduct
      ? ((byproductPrice * livestockProductionAmount) + livestockExpectedOffspringValue - totalFoodCostPerAnimal)
      : 0;
    const livestockProductionProfitTotal = livestockProductionProfitPerAnimal * animalCount;
    const livestockFirstCycleProfitTotal = livestockInfo.byproduct
      ? ((livestockExpectedOffspringValue - babyCost - totalFoodCostPerAnimal) * animalCount)
      : 0;
    const plannedFarmingDays = getFarmStoredNumber('farmAnimalPlannedDays', 0);
    const plannedFarmingProfitTotal = plannedFarmingDays > 0 ? (plannedFarmingDays * livestockProductionProfitTotal) : 0;

    const fullBabyDropValue = babyCost * animalCount;
    const profitPerAnimal = sellValue + expectedOffspringValue - babyCost - totalFoodCostPerAnimal;
    const mountMaterialCost = mountRecipe
      ? ((mountRecipe.material1?.amount || 0) * mountMat1Price) + ((mountRecipe.material2?.amount || 0) * mountMat2Price)
      : 0;
    const mountProfitPerAnimal = mountRecipe ? (mountSellValue + expectedOffspringValue - babyCost - totalFoodCostPerAnimal - mountMaterialCost) : 0;
    const mountProfitDelta = mountRecipe ? (mountProfitPerAnimal - profitPerAnimal) : 0;
    const mountProfitIfBabyDropsPerAnimal = mountRecipe ? (mountSellValue - totalFoodCostPerAnimal - mountMaterialCost) : 0;
    const mountProfitIfNoBabyDropPerAnimal = mountRecipe ? (mountSellValue - babyCost - totalFoodCostPerAnimal - mountMaterialCost) : 0;
    const mountProfitIfBabyDropsTotal = mountProfitIfBabyDropsPerAnimal * animalCount;
    const mountProfitIfNoBabyDropTotal = mountProfitIfNoBabyDropPerAnimal * animalCount;
    const totalAvailableAnimalFocus = getFarmSharedNumber('farmAnimalTotalFocusPool', 0);
    const allAnimalScopes = [
      ...PASTURE_ITEMS.map(itemName => ({ itemName, subMode: 'pasture' })),
      ...FARM_ANIMAL_ITEMS.map(itemName => ({ itemName, subMode: 'livestock' })),
      ...KENNEL_ITEMS.map(itemName => ({ itemName, subMode: 'kennel' }))
    ];
    const totalAnimalFocusUsedAllItems = allAnimalScopes.reduce((sum, { itemName, subMode }) => {
      const itemCount = getFarmStoredNumber('farmAnimalCount', 0, 'animal', subMode, itemName);
      const itemMainLevel = getFarmSharedNumber('farmAnimalBreederLevelShared', 0);
      const itemSpecificLevel = getFarmStoredNumber('farmAnimalItemLevel', 0, 'animal', subMode, itemName);
      const itemEfficiency = (itemMainLevel * 100) + (itemSpecificLevel * 200);
      const itemFocusPerAnimal = Math.round(1000 * Math.pow(0.5, itemEfficiency / 10000));
      return sum + (itemCount * itemFocusPerAnimal);
    }, 0);
    const totalAnimalProfitAllItems = allAnimalScopes.reduce((sum, { itemName, subMode }) => {
      const itemPreset = ANIMAL_PRESETS[itemName] || {};
      const itemCount = getFarmStoredNumber('farmAnimalCount', 0, 'animal', subMode, itemName);
      const itemBabyCost = getFarmStoredNumber('farmAnimalBabyCost', 0, 'animal', subMode, itemName);
      const itemFoodUnitPrice = getFarmStoredNumber('farmAnimalFoodCost', 0, 'animal', subMode, itemName);
      const itemSellValue = getFarmStoredNumber('farmAnimalSellValue', 0, 'animal', subMode, itemName);
      const itemIsLivestock = ['Baby Chickens', 'Kid', 'Gosling', 'Lamb', 'Piglet', 'Calf'].includes(itemName);
      const itemProductInfo = itemIsLivestock ? (itemPreset.productInfo || {}) : {};
      const itemByproductPrice = getFarmStoredNumber('farmAnimalByproductPrice', 0, 'animal', subMode, itemName);
      const itemBonusActive = getFarmStoredNumber('farmAnimalBonusCityActive', 0, 'animal', subMode, itemName) === 1;
      const itemBonusYieldRate = itemIsLivestock && itemBonusActive ? 0.10 : 0;
      const itemFeedings = getAnimalFeedingsCount(itemPreset);
      const itemDietUnits = getAnimalDietUnitsPerFeeding(itemPreset);
      const itemTotalFoodCost = itemFoodUnitPrice * itemDietUnits * itemFeedings;
      if (subMode === 'livestock' && itemProductInfo.byproduct) {
        const itemProductionAmount = getRangeAverage(itemProductInfo.productionRange);
        const itemExpectedOffspringValue = itemBabyCost * ((itemPreset.totalYield || 0) + itemBonusYieldRate);
        const itemDailyProfit = ((itemByproductPrice * itemProductionAmount) + itemExpectedOffspringValue - itemTotalFoodCost) * itemCount;
        const itemFirstCycleProfit = (itemExpectedOffspringValue - itemBabyCost - itemTotalFoodCost) * itemCount;
        return sum + itemFirstCycleProfit + itemDailyProfit;
      }
      if (subMode === 'livestock') return sum;
      const itemExpectedOffspringValue = itemBabyCost * ((itemPreset.totalYield || 0) + itemBonusYieldRate);
      const itemProfitPerAnimal = itemSellValue + itemExpectedOffspringValue - itemBabyCost - itemTotalFoodCost;
      return sum + (itemProfitPerAnimal * itemCount);
    }, 0);
    const remainingAnimalFocus = totalAvailableAnimalFocus - totalAnimalFocusUsedAllItems;
    const extraPlannedDays = isLivestock && livestockInfo.byproduct && plannedFarmingDays > 1 
      ? (plannedFarmingDays - 1) * livestockProductionProfitTotal 
      : 0;
    const totalAnimalProfitWithPlanning = totalAnimalProfitAllItems + extraPlannedDays;
    const animalCapacity = Math.floor(Math.max(remainingAnimalFocus, 0) / Math.max(focusPointsPerAnimal, 1));
    const presetInfoHtml = `
      <div class="farm-preset-card farm-preset-card-animal">
        <div class="farm-preset-title">${getTranslatedText('Preset Info')}</div>
        <div class="farm-preset-grid">
          ${preset.growHours ? `<div><span class="farm-preset-key">${getFarmPresetKeyLabel('Grow', 'Buyumesuresi-icon.png')}</span><span class="farm-preset-val">${preset.growHours}h</span></div>` : ''}
          ${preset.baseYield != null ? `<div><span class="farm-preset-key">${getFarmPresetKeyLabel('Base Yield', 'HayvanSayısı-icon.png')}</span><span class="farm-preset-val">${(preset.baseYield * 100).toFixed(2)}%</span></div>` : ''}
          ${dailyBonusYield > 0 ? `<div><span class="farm-preset-key">${getFarmPresetKeyLabel('Daily Bonus', 'dailybonus-icon.png')}</span><span class="farm-preset-val">${(dailyBonusYield * 100).toFixed(2)}%</span></div>` : ''}
          ${preset.totalYield != null ? `<div><span class="farm-preset-key">${getFarmPresetKeyLabel(animalYieldLabel, 'offspingyield-icon.png')}</span><span class="farm-preset-val">${(preset.totalYield * 100).toFixed(2)}%</span></div>` : ''}
          <div><span class="farm-preset-key">${getFarmPresetKeyLabel('Feedings', 'besleme-icon.png')}</span><span class="farm-preset-val">${getCountedLabel(feedingsPerAnimal, 'times')}</span></div>
          ${preset.dietAmount ? `<div><span class="farm-preset-key">${getFarmPresetKeyLabel('Feed / Feeding', 'Yemadeti-icon.png')}</span><span class="farm-preset-val">${formatAnimalDietAmount(preset.favoriteDietAmount || preset.dietAmount)} ${translateItemName(preset.favoriteDietType || preset.dietType || '')}</span></div>` : ''}
          ${preset.favoriteDietType ? `<div class="farm-preset-wide"><span class="farm-preset-key">${getTranslatedText('Favorite Diet')}</span><span class="farm-preset-val">${preset.favoriteDietAmount || ''} ${translateItemName(preset.favoriteDietType)}</span></div>` : ''}
        </div>
      </div>
    `;
    const livestockProductCompactClass = livestockInfo.byproduct ? '' : ' farm-preset-grid-compact-two';
    const livestockProductHtml = isLivestock ? `
      <div class="farm-preset-card farm-preset-card-animal farm-product-info-card">
        <div class="farm-preset-title">${getTranslatedText('Animal Product Info')}</div>
        <div class="farm-preset-grid farm-product-info-grid${livestockProductCompactClass}">
          <div>
            <span class="farm-preset-key">${getTranslatedText('Animal')}</span>
            <span class="farm-preset-val">${getAnimalProductLine(livestockInfo.animal || '', getTranslatedText(selectedFarmItemState))}</span>
          </div>
          ${livestockInfo.byproduct ? `<div>
            <span class="farm-preset-key">${getTranslatedText('Byproduct')}</span>
            <span class="farm-preset-val">${getAnimalByproductLine(livestockInfo)}</span>
          </div>` : ''}
          ${livestockInfo.periodHours ? `<div>
            <span class="farm-preset-key">${getTranslatedText('Production Period')}</span>
            <span class="farm-preset-val">${getFarmPresetLineWithUiIcon('Buyumesuresi-icon.png', `${livestockInfo.periodHours}h`)}</span>
          </div>` : ''}
          <div>
            <span class="farm-preset-key">${getTranslatedText('Meat when slaughtered')}</span>
            <span class="farm-preset-val">${getAnimalProductLine(livestockInfo.meat || '')}</span>
          </div>
        </div>
      </div>
    ` : '';
    const mountRecipeHtml = mountRecipe ? `
      <div class="farm-preset-card farm-preset-card-animal farm-mount-card">
        <div class="farm-preset-title">${getTranslatedText('Mount Preparation')}</div>
        ${mountRecipes.length > 1 ? `
          <div class="city-profit-quality-pills" style="justify-content:center; margin-bottom:12px;">
            ${mountRecipes.map((recipe, index) => `
              <button type="button" class="city-profit-quality-pill ${index === mountRecipeIndex ? 'active quality-2' : ''}" onclick="setFarmMountRecipe(${index})">${getMountRecipeVariantLabel(recipe)}</button>
            `).join('')}
          </div>
        ` : ''}
        <div class="farm-preset-grid">
          <div>
            <span class="farm-preset-key">${getTranslatedText('Result')}</span>
            <span class="farm-preset-val">${getFarmPresetLineWithIcon(mountRecipe.mountItemId, mountDisplayLabel)}</span>
          </div>
          <div>
            <span class="farm-preset-key">${getTranslatedText('Required 1')}</span>
            <span class="farm-preset-val">${getFarmPresetLineWithIcon(mountRecipe.material1.itemId, `${mountRecipe.material1.amount}x ${mountMaterial1Label}`)}</span>
          </div>
          ${mountRecipe.material2 ? `<div class="farm-preset-wide"><span class="farm-preset-key">${getTranslatedText('Required 2')}</span><span class="farm-preset-val">${getFarmPresetLineWithIcon(mountRecipe.material2.itemId, `${mountRecipe.material2.amount}x ${mountMaterial2Label}`)}</span></div>` : ''}
        </div>
      </div>
    ` : '';
    const animalFocusToneClass = getRemainingFocusToneClass(remainingAnimalFocus);
    const animalFocusStatusHtml = `
      <div class="farm-focus-status-wrap">
        <div class="farm-bonus-toggle farm-focus-status-card ${remainingAnimalFocus >= 0 ? 'farm-focus-status-positive' : 'farm-focus-status-negative'} ${animalFocusToneClass}">
          <div class="farm-focus-status-main">
            <span class="farm-focus-status-side-icon" aria-hidden="true">✦</span>
            <div class="farm-bonus-head">
              <div class="farm-bonus-title">${getTranslatedText('Remaining Focus')}</div>
              <div class="farm-bonus-desc">${remainingAnimalFocus >= 0 ? getTranslatedText('Live Pool') : getTranslatedText('Insufficient Focus')}</div>
              <div class="farm-focus-status-value">${formatNum(Math.round(remainingAnimalFocus))}</div>
            </div>
            <span class="farm-focus-status-side-icon" aria-hidden="true">✦</span>
          </div>
        </div>
      </div>
    `;
    const bonusToggleHtml = isLivestock ? `
      <div class="farm-section-divider"></div>
      <div class="farm-bonus-row">
        <div class="farm-bonus-toggle">
          <div class="farm-bonus-head">
            <div class="farm-bonus-title">${getTranslatedText('City Bonus')}</div>
            <div class="farm-bonus-desc">${getTranslatedText('Offspring Yield +%10')}</div>
          </div>
          <label class="toggle-wrap farm-bonus-simple-toggle" onclick="setAnimalBonusCityActive(${selectedAnimalBonusCityActive ? 'false' : 'true'})">
            <div class="toggle ${selectedAnimalBonusCityActive ? 'on' : ''}" id="farmAnimalBonusToggle"></div>
            <span class="ctrl-label">${getTranslatedText('City Bonus')}</span>
          </label>
        </div>
        ${animalFocusStatusHtml}
      </div>
    ` : animalFocusStatusHtml;

    container.innerHTML = `
      <div class="farm-layout-grid">
        ${sidebarHtml}
        <div class="glass-panel farm-main-card farm-main-card-animal">
          <div class="farm-card-head" style="margin-bottom:16px;">
            <button type="button" class="farm-fetch-btn" onclick="fetchFarmPricesForCurrentItem()" ${farmPriceFetchLoading ? 'disabled' : ''}>${farmPriceFetchLoading ? getTranslatedText('Fetching...') : getTranslatedText('Fetch Live Prices')}</button>
          </div>
          ${presetInfoHtml}
          ${livestockProductHtml}
          ${mountRecipeHtml}
          ${bonusToggleHtml}
          <div class="farm-section-divider"></div>
          <div class="farm-input-grid">
            ${farmInputHtml(getTranslatedText('Animal Spec Level'), 'farmAnimalItemLevel', animalItemLevel, '1', getFarmUiInputIcon('Hayvanspeclevel-icon.png'))}
            ${farmInputHtml(getTranslatedText('Animal Count'), 'farmAnimalCount', animalCount, '1', getFarmUiInputIcon('HayvanSayısı-icon.png'))}
            ${isLivestock && livestockInfo.byproduct ? farmInputHtml(getTranslatedText('Planned Farming Days'), 'farmAnimalPlannedDays', plannedFarmingDays, '1', getFarmUiInputIcon('planlananbeklemesüresi-icon.png')) : ''}
            ${farmInputHtml(`${buildTranslatedPair('Baby', 'Price')} ${getFarmInlineMoneyIcon()}`, 'farmAnimalBabyCost', babyCost, '1', getFarmTaggedInputIcon(FARM_ICON_IDS[selectedFarmItemState] || '', 'Baby', 'farm-input-corner-tag-baby'))}
            ${farmInputHtml(`${buildTranslatedPair(getAnimalFoodUnitLabel(preset), 'Price')} ${getFarmInlineMoneyIcon()}`, 'farmAnimalFoodCost', foodUnitPrice, '1', getFarmUiInputIcon('Yemadeti-icon.png'))}
            ${!isLivestock ? farmInputHtml(`${buildTranslatedPair('Tame', 'Price')} ${getFarmInlineMoneyIcon()}`, 'farmAnimalSellValue', sellValue, '1', getFarmAnimalSellIcon(selectedFarmItemState)) : ''}
            ${isLivestock && livestockInfo.byproduct ? farmInputHtml(`${getTranslatedText('Byproduct Price')} ${getFarmInlineMoneyIcon()}`, 'farmAnimalByproductPrice', byproductPrice, '1', getFarmStaticInputIcon(ANIMAL_PRODUCT_ICON_IDS[livestockInfo.byproduct] || '')) : ''}
            ${mountRecipe ? farmInputHtml(`${buildTranslatedPair(mountDisplayLabel, 'Price')} ${getFarmInlineMoneyIcon()}`, 'farmAnimalMountSellValue', mountSellValue, '1', getFarmTaggedInputIcon(mountRecipe.mountItemId, 'Mount', 'farm-input-corner-tag-mount')) : ''}
            ${mountRecipe ? farmInputHtml(`${buildTranslatedPair(mountMaterial1Label, 'Price')} ${getFarmInlineMoneyIcon()}`, 'farmAnimalMountMat1Price', mountMat1Price, '1', getFarmMaterialInputIcon(mountRecipe.material1.itemId) || getFarmMoneyInputIcon()) : ''}
            ${mountRecipe?.material2 ? farmInputHtml(`${buildTranslatedPair(mountMaterial2Label, 'Price')} ${getFarmInlineMoneyIcon()}`, 'farmAnimalMountMat2Price', mountMat2Price, '1', getFarmMaterialInputIcon(mountRecipe.material2.itemId) || getFarmMoneyInputIcon()) : ''}
          </div>
        </div>
        <div class="glass-panel farm-main-card farm-main-card-animal">
        ${getFarmStageTitleHtml('Baby => Tame')}
          ${farmResultCardHtml('Total Net Profit', totalAnimalProfitWithPlanning, getTranslatedText('All Animals • Shared Total'))}
          ${isLivestock && livestockInfo.byproduct ? farmResultCardHtml('First Cycle Profit', livestockFirstCycleProfitTotal, '') : ''}
          ${isLivestock && livestockInfo.byproduct ? farmResultCardHtml('Daily Production Profit', livestockProductionProfitTotal, '') : ''}
          ${isLivestock && livestockInfo.byproduct && plannedFarmingDays > 0 ? farmResultCardHtml(`${plannedFarmingDays} Günlük Tahmini Kar`, plannedFarmingProfitTotal, '') : ''}
          ${selectedAnimalSubModeState === 'kennel' ? farmResultCardHtml('Baby Drop Value', fullBabyDropValue, getTranslatedText('If it drops 1 baby')) : ''}
          ${farmResultCardHtml('1 Animal Focus', -focusPointsPerAnimal, '')}
          ${farmResultCardHtml('Breeding Capacity', animalCapacity)}
          ${mountRecipe ? `
            <div class="farm-section-divider"></div>
            ${getFarmStageTitleHtml('Tame => Mount')}
            ${selectedAnimalSubModeState === 'kennel'
              ? `
                ${farmResultCardHtml('Profit If Baby Drops', mountProfitIfBabyDropsTotal, getTranslatedText('1 baby drop assumed'))}
                ${farmResultCardHtml('Profit If No Baby Drop', mountProfitIfNoBabyDropTotal, getTranslatedText('0 baby drop assumed'))}
              `
              : `
                ${farmResultCardHtml('Mount Delta', mountProfitDelta, '')}
              `}
          ` : ''}
        </div>
      </div>
    `;
    return;
  }

  const preset = getSelectedFarmPreset() || {};
  const selectedCropBonusCityActive = getFarmStoredNumber('farmCropBonusCityActive', 0) === 1;
  const cropBaseName = selectedFarmItemState.replace(/\s+Seeds$/i, '');
  const { wateredSlots, unwateredSlots, totalSlots: slotCount } = getFarmCropSplitCounts(selectedFarmItemState);
  const seedCost = getFarmStoredNumber('farmCropSeedCost', 0);
  const cropOutputMin = preset.cropOutputMin || 6;
  const cropOutputMax = preset.cropOutputMax || 12;
  const baseDefaultCropOutput = preset.defaultCropOutput || 9;
  const cityProductBonusMaxFlat = selectedCropBonusCityActive ? 2 : 0;
  const cityProductBonusAverageFlat = selectedCropBonusCityActive ? 1 : 0;
  const defaultCropOutput = baseDefaultCropOutput + cityProductBonusAverageFlat;
  const cropOutputPerSlot = defaultCropOutput;
  const sellPrice = getFarmStoredNumber('farmCropSellPrice', 0);
  const cropFarmerLevel = getFarmSharedNumber('farmCropFarmerSpecShared', 0);
  const cropItemLevel = getFarmStoredNumber('farmCropItemSpec', 0);
  const cropEfficiency = (cropFarmerLevel * 100) + (cropItemLevel * 200);
  const focusPointsPerSlotRaw = 1000 * Math.pow(0.5, cropEfficiency / 10000);
  const focusPointsPerSlot = Math.round(focusPointsPerSlotRaw);
  const totalAvailableFocus = getFarmSharedNumber('farmCropTotalFocusPool', 0);
  const activePlantItems = getActiveFarmPlantItems(selectedFarmModeState);
  const plantModeScope = selectedFarmModeState === 'herb' ? 'herb' : 'farm';

  const totalCropFocusUsedAllItems = activePlantItems.reduce((sum, itemName) => {
    const itemCounts = getFarmCropSplitCounts(itemName);
    const itemMainSpec = getFarmSharedNumber('farmCropFarmerSpecShared', 0);
    const itemSpecificSpec = getFarmStoredNumber('farmCropItemSpec', 0, plantModeScope, selectedAnimalSubModeState, itemName);
    const itemEfficiency = (itemMainSpec * 100) + (itemSpecificSpec * 200);
    const itemFocusPerSlot = Math.round(1000 * Math.pow(0.5, itemEfficiency / 10000));
    return sum + (itemCounts.wateredSlots * itemFocusPerSlot);
  }, 0);
  const remainingCropFocus = totalAvailableFocus - totalCropFocusUsedAllItems;
  const slotsPerDay = Math.floor(Math.max(remainingCropFocus, 0) / Math.max(focusPointsPerSlot, 1));
  const totalCropProfitAllItems = activePlantItems.reduce((sum, itemName) => {
    const itemPreset = FARM_PRESETS[itemName];
    if (!itemPreset) return sum;
    const itemCounts = getFarmCropSplitCounts(itemName);
    const itemSeedCost = getFarmStoredNumber('farmCropSeedCost', 0, plantModeScope, selectedAnimalSubModeState, itemName);
    const itemSellPrice = getFarmStoredNumber('farmCropSellPrice', 0, plantModeScope, selectedAnimalSubModeState, itemName);
    const itemBonusActive = getFarmStoredNumber('farmCropBonusCityActive', 0, plantModeScope, selectedAnimalSubModeState, itemName) === 1;
    const itemProfit = getCropExpectedProfitForCounts(
      itemPreset,
      itemSeedCost,
      itemSellPrice,
      itemBonusActive,
      itemCounts.wateredSlots,
      itemCounts.unwateredSlots
    );
    return sum + itemProfit.totalProfit;
  }, 0);
  const cropProfitCards = activePlantItems.map(itemName => {
    const itemPreset = FARM_PRESETS[itemName];
    if (!itemPreset) return null;
    if (!farmScopeHasEnteredData(plantModeScope, selectedAnimalSubModeState, itemName)) return null;
    const itemCounts = getFarmCropSplitCounts(itemName);
    const itemSeedCost = getFarmStoredNumber('farmCropSeedCost', 0, plantModeScope, selectedAnimalSubModeState, itemName);
    const itemSellPrice = getFarmStoredNumber('farmCropSellPrice', 0, plantModeScope, selectedAnimalSubModeState, itemName);
    const itemBonusActive = getFarmStoredNumber('farmCropBonusCityActive', 0, plantModeScope, selectedAnimalSubModeState, itemName) === 1;
    const itemProfit = getCropExpectedProfitForCounts(
      itemPreset,
      itemSeedCost,
      itemSellPrice,
      itemBonusActive,
      itemCounts.wateredSlots,
      itemCounts.unwateredSlots
    );
    const extraSeedChancePerSlot = Math.max(0, (itemProfit.wateredYield || 0) - Math.min(itemProfit.wateredYield || 0, 1));
    const expectedExtraProfitTotal = (itemSeedCost * extraSeedChancePerSlot) * itemCounts.wateredSlots;
    const expectedProfitTotal = itemProfit.totalProfit;
    const itemTotalProfit = itemProfit.totalProfit;
    const compareProfitTotal = expectedProfitTotal;
    return {
      itemName,
      totalProfit: itemTotalProfit,
      expectedProfitTotal,
      compareProfitTotal,
      extraSeedChancePerSlot
    };
  }).filter(Boolean);
  const topCropProfitValue = cropProfitCards.length
    ? Math.max(...cropProfitCards.map(card => Number(card.compareProfitTotal) || 0))
    : null;
  const cropBestCandidates = activePlantItems.map(itemName => {
    const itemPreset = FARM_PRESETS[itemName];
    if (!itemPreset) return null;
    const itemSeedCost = getFarmStoredNumber('farmCropSeedCost', 0, plantModeScope, selectedAnimalSubModeState, itemName);
    const itemSellPrice = getFarmStoredNumber('farmCropSellPrice', 0, plantModeScope, selectedAnimalSubModeState, itemName);
    if (!itemSeedCost || !itemSellPrice) return null;
    const itemBaseOutputPerSlot = itemPreset.defaultCropOutput || 9;
    const itemBonusActive = getFarmStoredNumber('farmCropBonusCityActive', 0, plantModeScope, selectedAnimalSubModeState, itemName) === 1;
    const itemCityBonusAverageFlat = itemBonusActive ? 1 : 0;
    const itemCropOutputPerSlot = itemBaseOutputPerSlot + itemCityBonusAverageFlat;
    const baseYield = itemPreset.baseYield ?? 1;
    const totalYield = itemPreset.totalYield ?? baseYield;
    const profitWithoutWatering = (itemCropOutputPerSlot * itemSellPrice) - (itemSeedCost - (baseYield * itemSeedCost));
    const profitWithWatering = (itemCropOutputPerSlot * itemSellPrice) - (itemSeedCost - (totalYield * itemSeedCost));
    const profitIfSeedReturns = (itemCropOutputPerSlot * itemSellPrice);
    const profitIfNoSeedReturn = (itemCropOutputPerSlot * itemSellPrice) - itemSeedCost;
    return { itemName, profitWithoutWatering, profitWithWatering, baseYield, itemSeedCost, profitIfSeedReturns, profitIfNoSeedReturn };
  }).filter(Boolean);
  const bestWithWatering = cropBestCandidates.length
    ? cropBestCandidates.reduce((best, item) => (best == null || item.profitWithWatering > best.profitWithWatering ? item : best), null)
    : null;
  const bestIfSeedReturns = cropBestCandidates.length
    ? cropBestCandidates.reduce((best, item) => (best == null || item.profitIfSeedReturns > best.profitIfSeedReturns ? item : best), null)
    : null;
  const bestIfNoSeedReturn = cropBestCandidates.length
    ? cropBestCandidates.reduce((best, item) => (best == null || item.profitIfNoSeedReturn > best.profitIfNoSeedReturn ? item : best), null)
    : null;
  const cropFocusToneClass = getRemainingFocusToneClass(remainingCropFocus);
  const cropBonusToggleHtml = preset.bonusCity ? `
    <div class="farm-section-divider"></div>
    <div class="farm-bonus-row">
      <div class="farm-bonus-stack">
        <div class="farm-bonus-toggle">
          <div class="farm-bonus-head">
            <div class="farm-bonus-title">${getTranslatedText('City Bonus')}</div>
            <div class="farm-bonus-desc">${getTranslatedText('Product Yield +%10')}</div>
          </div>
          <label class="toggle-wrap farm-bonus-simple-toggle" onclick="setCropBonusCityActive(${selectedCropBonusCityActive ? 'false' : 'true'})">
            <div class="toggle ${selectedCropBonusCityActive ? 'on' : ''}" id="farmCropBonusToggle"></div>
            <span class="ctrl-label">${getTranslatedText('City Bonus')}</span>
          </label>
        </div>
      </div>
      <div class="farm-focus-status-wrap">
        <div class="farm-bonus-toggle farm-focus-status-card ${remainingCropFocus >= 0 ? 'farm-focus-status-positive' : 'farm-focus-status-negative'} ${cropFocusToneClass}">
          <div class="farm-focus-status-main">
            <span class="farm-focus-status-side-icon" aria-hidden="true">✦</span>
            <div class="farm-bonus-head">
              <div class="farm-bonus-title">${getTranslatedText('Remaining Focus')}</div>
              <div class="farm-bonus-desc">${remainingCropFocus >= 0 ? getTranslatedText('Live Pool') : getTranslatedText('Insufficient Focus')}</div>
              <div class="farm-focus-status-value">${formatNum(Math.round(remainingCropFocus))}</div>
            </div>
            <span class="farm-focus-status-side-icon" aria-hidden="true">✦</span>
          </div>
        </div>
      </div>
    </div>
  ` : '';
  const presetInfoHtml = `
    <div class="farm-preset-card">
      <div class="farm-preset-title">${getTranslatedText('Preset Info')}</div>
      <div class="farm-preset-grid">
        ${(preset.cropOutputMin != null && preset.cropOutputMax != null) ? `<div class="farm-preset-state-card ${selectedCropBonusCityActive ? 'active-on' : 'active-off'}"><span class="farm-preset-key">${getFarmPresetKeyLabel('Crop', 'crop-icon.png')}</span><span class="farm-preset-val">${formatNum(cropOutputMin)}-${formatNum(cropOutputMax + cityProductBonusMaxFlat)}</span></div>` : ''}
        ${preset.baseYield != null ? `<div><span class="farm-preset-key">${getFarmPresetKeyLabel('Dry Seed Yield', 'dryseedyield-icon.png')}</span><span class="farm-preset-val">${(preset.baseYield * 100).toFixed(2)}%</span></div>` : ''}
        ${preset.totalYield != null ? `<div><span class="farm-preset-key">${getFarmPresetKeyLabel('Watered Seed Yield', 'wateredseedyield-icon.png')}</span><span class="farm-preset-val">${(preset.totalYield * 100).toFixed(2)}%</span></div>` : ''}
        ${preset.bonusYield != null ? `<div><span class="farm-preset-key">${getFarmPresetKeyLabel('Watering Bonus', 'wateringbonus-icon.png')}</span><span class="farm-preset-val">${(preset.bonusYield * 100).toFixed(2)}%</span></div>` : ''}
        ${preset.bonusCity ? renderFarmPresetBonusCityCards(preset.bonusCity) : ''}
      </div>
    </div>
  `;

  container.innerHTML = `
      <div class="farm-layout-grid">
        ${sidebarHtml}
        <div class="glass-panel farm-main-card farm-main-card-crop">
          <div class="farm-card-head" style="margin-bottom:16px;">
            <button type="button" class="farm-fetch-btn" onclick="fetchFarmPricesForCurrentItem()" ${farmPriceFetchLoading ? 'disabled' : ''}>${farmPriceFetchLoading ? getTranslatedText('Fetching...') : getTranslatedText('Fetch Live Prices')}</button>
          </div>
          ${presetInfoHtml}
          ${cropBonusToggleHtml}
          <div class="farm-section-divider"></div>
          <div class="farm-input-grid">
            ${farmInputHtml(`${translateItemName(cropBaseName)} ${getTranslatedText('Farmer Level') || 'Farmer Level'}`, 'farmCropItemSpec', cropItemLevel, '1', getFarmUiInputIcon('kademe-icon.png'))}
            ${farmInputHtml(getTranslatedText('Watered / Focused Slots'), 'farmCropWateredSlotCount', wateredSlots, '1', getFarmStateInputIcon('watered'))}
            ${farmInputHtml(getTranslatedText('Dry / Unfocused Slots'), 'farmCropUnwateredSlotCount', unwateredSlots, '1', getFarmStateInputIcon('dry'))}
            ${farmInputHtml(`${buildTranslatedPair(selectedFarmItemState, 'Price')} ${getFarmInlineMoneyIcon()}`, 'farmCropSeedCost', seedCost, '1', getFarmStaticInputIcon(FARM_ICON_IDS[selectedFarmItemState] || ''))}
          ${farmInputHtml(`${buildTranslatedPair(cropBaseName, 'Price')} ${getFarmInlineMoneyIcon()}`, 'farmCropSellPrice', sellPrice, '1', getFarmStaticInputIcon(FARM_PRODUCT_ICON_IDS[selectedFarmItemState] || ''))}
        </div>
      </div>
      <div class="glass-panel farm-main-card farm-main-card-crop">
        <div class="farm-card-title" style="margin-bottom:16px; text-align:center;">${buildTranslatedPair(selectedFarmItemState, 'Results')}</div>
        ${farmResultCardHtml('Total Net Profit', totalCropProfitAllItems, getTranslatedText(selectedFarmModeState === 'herb' ? 'All Herbs • Shared Total' : 'All Crops • Shared Total'))}
        ${farmResultCardHtml('1 Slot Focus', -focusPointsPerSlot, '')}
        ${farmResultCardHtml('Planting Capacity', slotsPerDay, getTranslatedText('Watered Slot'))}
        ${farmResultCardHtml('Current Total Slots', slotCount, getTranslatedText('Watered + Dry'))}
        ${(cropProfitCards.length || bestWithWatering || bestIfSeedReturns || bestIfNoSeedReturn) ? `
          <div class="farm-section-divider"></div>
          <div class="farm-subpanel">
            <div class="farm-subpanel-title">${getTranslatedText(selectedFarmModeState === 'herb' ? 'Herb Profit Breakdown' : 'Crop Profit Breakdown')}</div>
            ${cropProfitCards.length ? `
            <div class="farm-mini-profit-grid">${cropProfitCards.map(({ itemName, totalProfit, expectedProfitTotal, compareProfitTotal, extraSeedChancePerSlot }) => farmMiniProfitCardHtml(itemName, totalProfit, expectedProfitTotal, extraSeedChancePerSlot, topCropProfitValue != null && compareProfitTotal === topCropProfitValue)).join('')}</div>
            ` : ''}
            ${(bestWithWatering || bestIfSeedReturns || bestIfNoSeedReturn) ? `
              <div class="farm-mini-profit-grid farm-mini-recommend-grid">
                ${bestWithWatering ? farmMiniRecommendationCardHtml('Best With Watering', bestWithWatering.itemName, bestWithWatering.profitWithWatering) : ''}
                ${bestIfSeedReturns ? farmMiniRecommendationCardHtml('Best If Seed Returns', bestIfSeedReturns.itemName, bestIfSeedReturns.profitIfSeedReturns) : ''}
                ${bestIfNoSeedReturn ? farmMiniRecommendationCardHtml('Best If No Seed Return', bestIfNoSeedReturn.itemName, bestIfNoSeedReturn.profitIfNoSeedReturn) : ''}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function getFarmStaticInputIcon(itemId) {
  if (!itemId) return '';
  return `<img src="${getAlbionIconUrl(itemId, 64)}" class="farm-input-label-icon" loading="eager" decoding="async" alt="">`;
}

function getFarmUiInputIcon(filename = '') {
  if (!filename) return '';
  return `<img src="icons/${filename}" class="farm-input-label-icon farm-input-label-icon-ui" loading="eager" decoding="async" alt="">`;
}

function getFarmUiInlineIcon(filename = '') {
  if (!filename) return '';
  const extraClass = filename === 'wateringbonus-icon.png' ? ' farm-preset-key-icon-large' : '';
  return `<img src="icons/${filename}" class="farm-preset-key-icon${extraClass}" loading="eager" decoding="async" alt="">`;
}

function getFarmTaggedInputIcon(itemId, tagText = '', tagClass = '') {
  if (!itemId) return '';
  return `
    <span class="farm-input-icon-wrap">
      <img src="${getAlbionIconUrl(itemId, 64)}" class="farm-input-label-icon" loading="eager" decoding="async" alt="">
      ${tagText ? `<span class="farm-input-corner-tag ${tagClass}">${tagText}</span>` : ''}
    </span>
  `;
}

function getFarmSpecBadge(text = 'Spec') {
  return `<span class="farm-input-spec-badge" aria-hidden="true">${text}</span>`;
}

function getFarmAnimalSellIcon(itemName) {
  const itemId = ANIMAL_GROWN_ICON_IDS[itemName] || '';
  return getFarmTaggedInputIcon(itemId, 'Tame', 'farm-input-corner-tag-tame');
}

function getFarmMaterialInputIcon(itemId) {
  return getFarmStaticInputIcon(itemId);
}

function getFarmPresetLineWithIcon(itemId, text) {
  const iconHtml = itemId ? getFarmStaticInputIcon(itemId) : '';
  if (!iconHtml) return text;
  return `<span class="farm-preset-icon-line">${iconHtml}<span>${text}</span></span>`;
}

function getFarmPresetKeyLabel(label, iconFile = '') {
  const translated = getTranslatedText(label);
  if (!iconFile) return translated;
  return `<span class="farm-preset-key-row">${getFarmUiInlineIcon(iconFile)}<span>${translated}</span></span>`;
}

function getFarmResultIcon(label = '') {
  const iconMap = {
    'Total Net Profit': 'totalnetprofit-icon.png',
    'Toplam Net Kâr': 'totalnetprofit-icon.png',
    '1 Slot Focus': 'hayvanfocus-iconn.png',
    '1 Alan Odak': 'hayvanfocus-iconn.png',
    '1 Animal Focus': 'hayvanfocus-iconn.png',
    '1 Hayvan Odak': 'hayvanfocus-iconn.png',
    'Planting Capacity': 'plantingcapacity-icon.png',
    'Ekim Kapasitesi': 'plantingcapacity-icon.png',
    'Current Total Slots': 'currenttotalslots-icon.png',
    'Toplam Alan': 'currenttotalslots-icon.png',
    'Breeding Capacity': 'breedingcapacity-icon.png',
    'Mount Delta': 'mountdelta-icon.png'
  };
  const iconFile = iconMap[label] || '';
  if (!iconFile) return '';
  return `<img src="icons/${iconFile}" class="farm-result-label-icon" loading="eager" decoding="async" alt="">`;
}

function getFarmFavoriteDietIcon(itemName, preset = {}) {
  const favoriteDietName = preset.favoriteDietType || '';
  if (FARM_DIET_ICON_IDS[favoriteDietName]) {
    return getFarmStaticInputIcon(FARM_DIET_ICON_IDS[favoriteDietName]);
  }
  if (preset.dietType === 'meat') {
    return getFarmStaticInputIcon('T4_MEAT@0');
  }
  return getFarmStaticInputIcon('T1_CARROT@0');
}

function getFarmStateInputIcon(type = 'watered') {
  const isWatered = type === 'watered';
  return `<span class="farm-state-input-icon farm-state-input-icon-${isWatered ? 'watered' : 'dry'}" aria-hidden="true">${isWatered ? '💧' : '☀'}</span>`;
}

function getFarmInlineMoneyIcon() {
  return `<span class="farm-input-money-inline" aria-hidden="true"></span>`;
}

function getFarmMoneyInputIcon() {
  return `<span class="farm-input-money-icon" aria-hidden="true"></span>`;
}

function getFarmFocusInputIcon() {
  return `<span class="farm-input-focus-icon" aria-hidden="true">✦</span>`;
}

function getRemainingFocusToneClass(value) {
  const numeric = Number(value) || 0;
  if (numeric <= 5000) return 'farm-focus-tone-low';
  if (numeric <= 15000) return 'farm-focus-tone-mid';
  return 'farm-focus-tone-high';
}

function getFarmCropSplitCounts(itemName = selectedFarmItemState) {
  const mode = selectedFarmModeState === 'herb' ? 'herb' : 'farm';
  const wateredSlots = getFarmStoredNumber('farmCropWateredSlotCount', 0, mode, selectedAnimalSubModeState, itemName);
  const unwateredSlots = getFarmStoredNumber('farmCropUnwateredSlotCount', 0, mode, selectedAnimalSubModeState, itemName);
  return {
    wateredSlots,
    unwateredSlots,
    totalSlots: wateredSlots + unwateredSlots
  };
}

function getCropExpectedProfitForCounts(preset = {}, seedCost = 0, sellPrice = 0, bonusActive = false, wateredSlots = 0, unwateredSlots = 0) {
  const baseOutputPerSlot = preset.defaultCropOutput || 9;
  const cityBonusAverageFlat = bonusActive ? 1 : 0;
  const cropOutputPerSlot = baseOutputPerSlot + cityBonusAverageFlat;
  const cropRevenuePerSlot = cropOutputPerSlot * sellPrice;
  const baseYield = preset.baseYield ?? 1;
  const wateredYield = preset.totalYield ?? baseYield;
  const wateredProfit = wateredSlots * (cropRevenuePerSlot + (seedCost * wateredYield) - seedCost);
  const unwateredProfit = unwateredSlots * (cropRevenuePerSlot + (seedCost * baseYield) - seedCost);
  return {
    totalProfit: wateredProfit + unwateredProfit,
    cropOutputPerSlot,
    cropRevenuePerSlot,
    baseYield,
    wateredYield,
    totalSlots: wateredSlots + unwateredSlots
  };
}

function getFarmAnimalCountIcon() {
  return `<span class="farm-input-animal-count-icon" aria-hidden="true">◔</span>`;
}

function farmInputHtml(label, id, value, step = '1', labelIconHtml = '') {
  return `
    <div class="farm-input-card">
      <label class="farm-input-label">${labelIconHtml ? `<span class="farm-input-label-row">${labelIconHtml}<span>${label}</span></span>` : label}</label>
      <input type="text" inputmode="numeric" id="${id}" value="${formatFarmInputValue(value)}" class="modern-input farm-input-field" style="width:100%;" oninput="setFarmStoredNumber('${id}', this.value)">
    </div>
  `;
}

function farmResultCardHtml(label, value, subtext, metaText = '') {
  const translatedLabel = getTranslatedText(label);
  const translatedSubtext = subtext ? getTranslatedText(subtext) : '';
  const translatedMetaText = metaText ? getTranslatedText(metaText) : '';
  const resultIconHtml = getFarmResultIcon(label) || getFarmResultIcon(translatedLabel);
  const positive = value >= 0;
  const isNetProfit = translatedLabel === 'Net Kâr' || translatedLabel === 'Toplam Net Kâr';
  return `
    <div class="farm-result-card ${positive ? 'positive' : 'negative'} ${isNetProfit ? 'farm-result-card-net' : ''}">
      <div class="farm-result-label">${resultIconHtml ? `<span class="farm-result-label-row">${resultIconHtml}<span>${translatedLabel}</span></span>` : translatedLabel}</div>
      <div class="farm-result-mainline">
        <div class="farm-result-value">${value >= 0 ? '+' : ''}${formatNum(Math.round(value))}</div>
        ${translatedSubtext ? `<div class="farm-result-subtext">${translatedSubtext}</div>` : ''}
      </div>
      ${translatedMetaText ? `<div class="farm-result-meta">${translatedMetaText}</div>` : ''}
    </div>
  `;
}

function farmMiniProfitCardHtml(itemName, value, expectedProfitTotal = 0, extraSeedChancePerSlot = 0, isTopProfit = false) {
  const positive = value >= 0;
  const iconId = FARM_PRODUCT_ICON_IDS[itemName] || FARM_ICON_IDS[itemName] || '';
  return `
    <div class="farm-mini-profit-card ${positive ? 'positive' : 'negative'} ${isTopProfit ? 'top-profit' : ''}">
      <div class="farm-mini-profit-head">
        ${iconId ? `<img src="${getAlbionIconUrl(iconId, 64)}" class="farm-mini-profit-icon" loading="eager" decoding="async" alt="">` : ''}
        <div class="farm-mini-profit-title">${itemName.replace(/\s+Seeds$/i, '')}</div>
      </div>
      <div class="farm-mini-profit-value">${value >= 0 ? '+' : ''}${formatNum(Math.round(value))}</div>
      <div class="farm-mini-profit-split">
        <div class="farm-mini-profit-split-card farm-mini-profit-split-card-highlight">
          <div class="farm-mini-profit-split-label farm-mini-profit-split-label-strong">${getTranslatedText('Expected Profit')}</div>
          <div class="farm-mini-profit-split-value farm-mini-profit-split-value-strong">${expectedProfitTotal >= 0 ? '+' : ''}${formatNum(Math.round(expectedProfitTotal))}</div>
          <div class="farm-mini-profit-split-hint farm-mini-profit-split-hint-strong">Chance %${(extraSeedChancePerSlot * 100).toFixed(2)}</div>
        </div>
      </div>
    </div>
  `;
}

function getFarmStageTitleHtml(key) {
  const translated = getTranslatedText(key);
  const parts = translated.split('=>').map(part => part.trim()).filter(Boolean);
  if (parts.length !== 2) {
    return `<div class="farm-card-title farm-stage-title">${translated}</div>`;
  }
  return `
    <div class="farm-stage-title">
      <span class="farm-stage-chip">${parts[0]}</span>
      <span class="farm-stage-arrow" aria-hidden="true">→</span>
      <span class="farm-stage-chip">${parts[1]}</span>
    </div>
  `;
}

function farmMiniRecommendationCardHtml(label, itemName, value) {
  const positive = value >= 0;
  const iconId = FARM_PRODUCT_ICON_IDS[itemName] || FARM_ICON_IDS[itemName] || '';
  const isNoWatering = /without/i.test(label);
  return `
    <div class="farm-mini-profit-card farm-mini-recommend-card ${positive ? 'positive' : 'negative'} ${isNoWatering ? 'farm-mini-recommend-no-water' : 'farm-mini-recommend-with-water'}">
      <div class="farm-mini-recommend-label">
        <span class="farm-mini-recommend-water-icon" aria-hidden="true">${isNoWatering ? '💧' : '💧'}</span>
        <span>${label}</span>
      </div>
      <div class="farm-mini-profit-head">
        ${iconId ? `<img src="${getAlbionIconUrl(iconId, 64)}" class="farm-mini-profit-icon" loading="eager" decoding="async" alt="">` : ''}
        <div class="farm-mini-profit-title">${itemName.replace(/\s+Seeds$/i, '')}</div>
      </div>
      <div class="farm-mini-profit-value">${value >= 0 ? '+' : ''}${formatNum(Math.round(value))}</div>
    </div>
  `;
}

function setSelectedFlipperRow(rowKey) {
  selectedFlipperRowKey = rowKey;
  if (currentPage === 'flipper') applyFilters();
}

function setCityProfitQuality(quality) {
  selectedCityProfitQualityState = quality;
  analyzeSingleItem();
}

// ─── VERİ ALIMI ──────────────────────────────────────────────────────────────
async function fetchItemNames() {
  const urls = ['data/weapons.json', 'data/armors.json'];
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const items = (await r.json()).data || await r.json();
      if (Array.isArray(items)) items.forEach(item => { if (item.identifier && item.name) itemNameMap.set(item.identifier, item.name); });
    } catch (e) {}
  }
}

async function fetchRecipes() {
  try {
    const r = await fetch('data/recipes.json');
    if (r.ok) {
      const data = await r.json();
      for (const [key, val] of Object.entries(data)) recipesMap.set(key, val);
      if (currentPage === 'crafting') populateItemSelect();
    }
  } catch (e) {}
}

async function fetchPotionsAndFoods() {
  try {
    const [resPotions, resFoods] = await Promise.all([
      fetch('data/potions.json').catch(() => null),
      fetch('data/foods.json').catch(() => null)
    ]);

    let pData = [];
    let fData = [];

    if (resPotions && resPotions.ok) {
      try { pData = await resPotions.json(); } catch(e) { console.warn('potions.json okunamadi'); }
    }
    if (resFoods && resFoods.ok) {
      try { fData = await resFoods.json(); } catch(e) { console.warn('foods.json okunamadi'); }
    }

    potionsAndFoods.potions = Array.isArray(pData) ? pData : [];
    potionsAndFoods.foods = Array.isArray(fData) ? fData : [];
    loadedConsumables = true;
    
      const allConsumables = [...(potionsAndFoods.potions || []), ...(potionsAndFoods.foods || [])];
      allConsumables.forEach(c => {
            if (c.displayname_tr) {
                c.displayname = c.displayname_tr;
                if (c.displayname_en) {
                    translationMapEnToTr[c.displayname_en] = c.displayname_tr;
                    translationMapTrToEn[c.displayname_tr] = c.displayname_en;
                }
            } else if (c.displayname_en) {
                c.displayname = c.displayname_en;
            }
        itemNameMap.set(c.uniquename, c.displayname);
        const recipeArr = (c.resources || []).map(res => ({
          name: res.uniquename,
          count: res.count
        }));
        recipesMap.set(c.uniquename, recipeArr);
      });
      
      if (currentPage === 'crafting') {
          populateItemSelect();
          renderCraftTable();
      }
  } catch (e) {
    console.error('Error loading consumables:', e);
  }
}

function parseItemId(rawId) {
  if (!rawId) return null;
  const enchant = rawId.includes('@') ? parseInt(rawId.split('@')[1]) : 0;
  const baseId = rawId.split('@')[0];
  const tierMatch = baseId.match(/T(\d)/);
  const tier = tierMatch ? parseInt(tierMatch[1]) : 0;
  let name = getMarketDisplayName(baseId, tier);
  return { rawId, baseId, tier, enchant, name };
}

function getMarketDisplayName(baseId, tier = 0) {
  if (!baseId) return '';
  const mappedName = itemNameMap.get(baseId);
  if (mappedName) return mappedName;

  const tierPrefixMap = {
    2: "Novice's",
    3: "Journeyman's",
    4: "Adept's",
    5: "Expert's",
    6: "Master's",
    7: "Grandmaster's",
    8: "Elder's"
  };
  const tierPrefix = tierPrefixMap[tier] || `T${tier}`;

  if (/^T\d+_BAG_INSIGHT$/i.test(baseId)) return `${tierPrefix} Satchel of Insight`;
  if (/^T\d+_BAG$/i.test(baseId)) return `${tierPrefix} Bag`;

  return baseId;
}

function normalizeMarketItemId(rawId) {
  if (!rawId) return '';
  return rawId.includes('@') ? rawId : `${rawId}@0`;
}

function getSelectedCraftTargetId() {
  const context = getSelectedCraftContext();
  return context ? normalizeMarketItemId(context.targetId) : '';
}

function shouldTrackCraftingItem(itemId) {
  const selectedTargetId = getSelectedCraftTargetId();
  if (!selectedTargetId) return false;
  return normalizeMarketItemId(itemId) === selectedTargetId;
}

function shouldTrackFlipperItem(itemId) {
  if (!itemId) return false;
  const tierMatch = itemId.match(/^T(\d+)/i);
  const tier = tierMatch ? parseInt(tierMatch[1], 10) : 0;
  if (tier && tier < 5) return false;
  const baseId = itemId.split('@')[0].toUpperCase();
  return /_(MAIN|2H|OFF)_|_HEAD_|_ARMOR_|_BAG|SATCHEL/.test(baseId);
}

// ─── ARAMALI DROPDOWN SİSTEMİ ───────────────────────────────────────────────
function toggleItemList(show) {
    const list = document.getElementById('itemSearchList');
    if (list) {
        if (show) list.classList.add('open');
        else list.classList.remove('open');
    }
}

function getCoreItemName(name) {
    return name.replace(/^(Adept's |Expert's |Master's |Grandmaster's |Elder's |Çırak |Kalfa |Uzman |Usta |Büyük Usta |Kadim )/i, '').trim();
}

function populateItemSelect() {
    availableCraftingItems = [];
    const seen = new Set(); 

    if (selectedCraftModeState === 'potion' || selectedCraftModeState === 'food') {
        const list = selectedCraftModeState === 'potion' ? (potionsAndFoods.potions || []) : (potionsAndFoods.foods || []);
        list.forEach(c => {
            if (!c.resources || c.resources.length === 0) return;
            const key = c.uniquename;
            const name = c.displayname;
            const tier = parseInt(c.tier) || 1;
            const uniqueKey = `${tier}_${name}`;
            if (!seen.has(uniqueKey)) {
                seen.add(uniqueKey);
                const sortGroup = key.replace(/^T\d+_/, ''); // Örn: MEAL_SOUP
                availableCraftingItems.push({ key, name, tier, coreName: name, sortGroup, isConsumable: true });
            }
        });
    } else {
        const consumableIds = new Set([...(potionsAndFoods.potions || []).map(p=>p.uniquename), ...(potionsAndFoods.foods || []).map(f=>f.uniquename)]);
        Array.from(recipesMap.keys()).forEach(key => {
            if (consumableIds.has(key)) return;
        if (key.match(/^T[4-8]_/) && !key.includes('_CAPE') && !key.includes('CAPEITEM')) {
            let name = itemNameMap.get(key);
            if (!name) {
                if (key.includes('CAPEITEM')) {
                    const parts = key.split('_');
                    const cityCode = parts[3]; 
                    const cityName = LOCATION_MAP[cityCode] || cityCode;
                    name = `${cityName} Cape`;
                } else if (key.includes('_CAPE_')) {
                    const parts = key.split('_');
                    const capeName = parts[3]; 
                    const displayName = CAPE_TYPES[capeName] || capeName;
                    name = `${displayName} Cape`;
                } else if (key.endsWith('_CAPE')) {
                    name = 'Cape';
                } else {
                    name = key.replace(/^T\d_/, '');
                }
            }
            const match = key.match(/^T(\d)/);
            const tier = match ? parseInt(match[1]) : 4;
            const coreName = getCoreItemName(name);
            const uniqueKey = `${tier}_${coreName}`;
            if (!seen.has(uniqueKey)) {
                seen.add(uniqueKey);
                availableCraftingItems.push({ key, name, tier, coreName });
            }
        }
        });
    }

    availableCraftingItems.sort((a, b) => {
        if (a.isConsumable && b.isConsumable) {
            if (a.sortGroup === b.sortGroup) return a.tier - b.tier; // Aynı türse T1, T3, T5 sırala
            return a.sortGroup.localeCompare(b.sortGroup); // Değilse Türüne göre (Çorbalar, Omletler...) sırala
        }
        if (a.coreName === b.coreName) return a.tier - b.tier; 
        return a.coreName.localeCompare(b.coreName);
    });
    renderItemList(availableCraftingItems);
}

function renderItemList(items) {
    const list = document.getElementById('itemSearchList');
    if (!list) return;
    
    let html = '';
    items.forEach(item => {
        const displayName = getTranslatedText(item.name);
        const safeName = displayName.replace(/'/g, "\\'");
        
        let typeBadge = "Diğer";
        if (item.isConsumable) {
            if (item.sortGroup) {
                if (item.sortGroup.includes('SOUP')) typeBadge = getTranslatedText('Soup');
                else if (item.sortGroup.includes('OMELETTE')) typeBadge = getTranslatedText('Omelette');
                else if (item.sortGroup.includes('PIE')) typeBadge = getTranslatedText('Pie');
                else if (item.sortGroup.includes('SALAD')) typeBadge = getTranslatedText('Salad');
                else if (item.sortGroup.includes('STEW')) typeBadge = getTranslatedText('Stew');
                else if (item.sortGroup.includes('SANDWICH')) typeBadge = getTranslatedText('Sandwich');
                else if (item.sortGroup.includes('ROAST')) typeBadge = getTranslatedText('Roast');
                else if (item.sortGroup.includes('POTION')) typeBadge = getTranslatedText('Potion');
                else typeBadge = getTranslatedText(selectedCraftModeState === 'potion' ? "Potion" : "Food");
            } else {
                typeBadge = getTranslatedText(selectedCraftModeState === 'potion' ? "Potion" : "Food");
            }
        } else {
            if (item.key.includes("_HEAD")) typeBadge = "Helmet";
        else if (item.key.includes("_ARMOR")) typeBadge = "Armor";
        else if (item.key.includes("_SHOES")) typeBadge = "Shoes";
        else if (item.key.includes("_MAIN") || item.key.includes("_2H")) typeBadge = "Weapon";
        else if (item.key.includes("_OFF")) typeBadge = "Off-hand";
        else if (item.key.includes("_BAG")) typeBadge = "Bag";
        else if (item.key.includes("_CAPE") || item.key.includes("CAPEITEM")) typeBadge = "Pelerin";
        }

        const iconHtml = getAlbionIconHtml(item.key, 'search-item-icon', ALBION_ITEM_ICON_RENDER_SIZE);
        const tierEnchantLabel = item.isConsumable ? `T${item.tier}` : `T${item.tier}.0`;
        html += `<div class="searchable-item" onclick="selectCraftItem('${item.key}', '${safeName}', ${item.tier}, ${item.isConsumable ? 'true' : 'false'})">
            <span class="search-item-label">${iconHtml}<span><b style="color:var(--accent); margin-right:5px;">${tierEnchantLabel}</b> ${displayName}</span></span>
            <span style="color:#60a5fa; background:rgba(96, 165, 250, 0.12); border:1px solid rgba(96, 165, 250, 0.24); font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; letter-spacing:0.3px;">${typeBadge}</span>
        </div>`;
    });
    
    list.innerHTML = html || `<div style="padding:15px; color:var(--red); text-align:center;">${getTranslatedText('Item not found')}</div>`;
}

function filterItemSelect() {
    const val = document.getElementById('itemSearchInput').value.toLowerCase().trim();
    const filtered = availableCraftingItems.filter(i => 
        i.name.toLowerCase().includes(val) || 
        getTranslatedText(i.name).toLowerCase().includes(val) ||
        i.key.toLowerCase().includes(val) ||
        i.coreName.toLowerCase().includes(val)
    );
    renderItemList(filtered);
    toggleItemList(true);
}

function selectCraftItem(key, name, tier, isConsumable = false) {
    saveSelectedCraftQuantity();
    const hiddenInput = document.getElementById('singleItemSelect');
    if(hiddenInput) hiddenInput.value = key;
    
    const searchInput = document.getElementById('itemSearchInput');
    if(searchInput) searchInput.value = isConsumable ? `T${tier} ${name}` : `T${tier}.0 ${name}`;
    
    const tierSelect = document.getElementById('singleTier');
    if (tierSelect && tier) {
        tierSelect.value = tier;
        tierSelect.style.borderColor = 'var(--green)';
        setTimeout(() => { tierSelect.style.borderColor = 'var(--border)'; }, 1000);
    }
    
    const enchantSelect = document.getElementById('singleEnchant');
    if (enchantSelect) {
        enchantSelect.value = "0";
        enchantSelect.style.borderColor = 'var(--green)';
        setTimeout(() => { enchantSelect.style.borderColor = 'var(--border)'; }, 1000);
    }

    let runeCount = 0;
    if (!loadedConsumables || !([...(potionsAndFoods.potions || []), ...(potionsAndFoods.foods || [])].some(c => c.uniquename === key))) {
    if (key.includes("_2H")) runeCount = 384; 
    else if (key.includes("_MAIN")) runeCount = 288; 
    else if (key.includes("_ARMOR") || key.includes("_BAG")) runeCount = 192; 
    else if (key.includes("_HEAD") || key.includes("_SHOES") || key.includes("_CAPE") || key.includes("CAPEITEM") || key.includes("_OFF")) runeCount = 96;
    }

    const enchantInput = document.getElementById('singleEnchantAmount');
    if (enchantInput && runeCount > 0) {
        enchantInput.value = runeCount;
        enchantInput.style.borderColor = 'var(--green)';
        enchantInput.style.color = 'var(--green)';
        setTimeout(() => { 
            enchantInput.style.borderColor = 'var(--border)'; 
            enchantInput.style.color = 'var(--text)';
        }, 1000);
    } else if (enchantInput) {
        enchantInput.value = 0; 
    }

    toggleItemList(false);
    updateCraftSelectColors();
    updateCraftFetchButtonState();
    restoreSelectedCraftQuantity();
    if (craftAnalysisFrame) cancelAnimationFrame(craftAnalysisFrame);
    craftAnalysisFrame = requestAnimationFrame(() => {
        craftAnalysisFrame = null;
        analyzeSingleItem();
    });
    saveCraftModeState(selectedCraftModeState);
}

// ─── WEBSOCKET & FİYAT GÜNCELLEME ────────────────────────────────────────────
function toggleConnect() {
  if (ws) { ws.close(); ws = null; setConnStatus('Bağlı Değil'); return; }
  setConnStatus('Bağlanıyor...');
  ws = new WebSocket(document.getElementById('wsUrl').value.trim());
  ws.onopen = () => { setConnStatus('Bağlı'); };
  ws.onerror = () => { setConnStatus('Bağlı Değil'); };
  ws.onmessage = (e) => {
    try {
      const p = JSON.parse(e.data);
      let orders = Array.isArray(p) ? p : (p.Orders || p.MarketOrders || p.orders || []);
      if (orders.length > 0) {
        pendingOrdersBuffer.push(...orders);
        scheduleBufferedOrderProcessing();
      }
    } catch (_) {}
  };
  ws.onclose = () => { ws = null; setConnStatus('Koptu'); };
}

function setConnStatus(state) {
  const btn = document.getElementById('connectBtn');
  const endpoint = document.getElementById('connEndpoint');
  const status = document.getElementById('connStatus');
  const dot = document.getElementById('connDot');
  if (state === 'Bağlı') {
    if(status) status.textContent = currentLanguage === 'tr' ? 'Bağlı' : 'Connected';
    if(dot) dot.className = 'conn-endpoint-dot';
    if(btn) btn.textContent = getTranslatedText('Disconnect');
    if(endpoint) {
      endpoint.className = 'conn-endpoint connected';
    }
  } else if (state === 'Bağlanıyor...') {
    if(status) status.textContent = currentLanguage === 'tr' ? 'Bağlanıyor...' : 'Connecting...';
    if(dot) dot.className = 'conn-endpoint-dot';
    if(btn) btn.textContent = currentLanguage === 'tr' ? 'İptal' : 'Cancel';
    if(endpoint) {
      endpoint.className = 'conn-endpoint connecting';
    }
  } else {
    if(status) status.textContent = currentLanguage === 'tr' ? 'Bağlı Değil' : 'Disconnected';
    if(dot) dot.className = 'conn-endpoint-dot';
    if(btn) btn.textContent = getTranslatedText('Connect');
    if(endpoint) {
      endpoint.className = 'conn-endpoint disconnected';
    }
  }

  const bridgeStatusKey = state === 'Bağlı' ? 'connected' : 'disconnected';
  if (bridgeStatusKey !== lastBridgeStatusKey) {
    if (state === 'Bağlı') log('Bridge düzgün çalışıyor.', 'success');
    else log('Bridge çalışmıyor.', 'warn');
    lastBridgeStatusKey = bridgeStatusKey;
  }
}

function log(msg, type) {
  const l = document.getElementById('logList');
  if(!l) return;
  const li = document.createElement('li');
  li.style.color = type === 'success' ? 'var(--green)' : type === 'warn' ? 'var(--gold)' : 'var(--text-dim)';
  li.textContent = `[${new Date().toLocaleTimeString('tr-TR')}] ${msg}`;
  l.insertBefore(li, l.firstChild);
  if (l.children.length > 50) l.removeChild(l.lastChild);
}

async function pollAdcStatus() {
  try {
    const response = await fetch('/status');
    if (!response.ok) return;
    const data = await response.json();
    const info = document.getElementById('reconnectInfo');
    const configured = !!data?.adc_path_configured;
    const running = !!data?.adc_running;
    const message = String(data?.adc_status_message || '').trim();

    if (info) info.textContent = '';

    const statusKey = `${configured ? 1 : 0}:${running ? 1 : 0}:${message}`;
    if (statusKey !== lastAdcStatusKey) {
      if (running) log('ADC düzgün çalışıyor.', 'success');
      else if (configured) log(message || 'ADC çalışmıyor.', 'warn');
      else log(message || 'ADC ayarlanmamış.', 'warn');
      lastAdcStatusKey = statusKey;
    }
  } catch (_) {}
}

function startAdcStatusPolling() {
  pollAdcStatus();
  setInterval(pollAdcStatus, 5000);
}

async function changeAdcPath() {
  const button = document.getElementById('adcPathBtn');
  if (button) {
    button.disabled = true;
    button.textContent = getTranslatedText('Pending...');
  }

  try {
    const response = await fetch('/adc/select', { method: 'POST' });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data?.path) {
      log(`ADC yolu guncellendi. ${data.path}`, 'success');
      if (data?.message) log(data.message, 'success');
      await pollAdcStatus();
    } else if (data?.cancelled) {
      log(data.message || 'ADC yolu degistirme iptal edildi.', 'warn');
    } else {
      log(data?.message || 'ADC yolu guncellenemedi.', 'warn');
    }
  } catch (_) {
    log('ADC yolu guncellenemedi.', 'warn');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'ADC';
    }
  }
}

function updateResourcePrice(itemId, val) {
    const parsedValue = parseFloat(val) || 0;
    manualCraftPriceOverrides[itemId] = parsedValue;
    resourcePrices[itemId] = parsedValue;
    analyzeSingleItem(); 
    renderCraftTable();  
}

function updateArtifactPrice(tier, enchantLevel, val) {
    const parsedValue = parseFloat(val) || 0;
    const artifactItemId = getArtifactMarketItemId(tier, enchantLevel);
    if (artifactItemId) manualCraftPriceOverrides[artifactItemId] = parsedValue;
    resourcePrices[getArtifactPriceKey(tier, enchantLevel)] = parsedValue;
    analyzeSingleItem();
    renderCraftTable();
}

function getArtifactMarketItemId(tier, enchantLevel) {
  const artifactName = ARTIFACTS[enchantLevel - 1];
  return artifactName ? `T${tier}_${artifactName.toUpperCase()}` : '';
}

function getSelectedCraftContext() {
  const baseId = document.getElementById('singleItemSelect')?.value || '';
  if (!baseId) return null;

  const selectedTier = document.getElementById('singleTier')?.value || '4';
  const enchant = parseInt(document.getElementById('singleEnchant')?.value || '0', 10);
  const isConsumable = loadedConsumables && [...(potionsAndFoods.potions || []), ...(potionsAndFoods.foods || [])].some(c => c.uniquename === baseId);
  const tierMatch = baseId.match(/^T(\d+)/);
  const tier = isConsumable ? (tierMatch ? tierMatch[1] : selectedTier) : selectedTier;
  const targetId = (isConsumable ? baseId : baseId.replace(/^T\d_/, `T${tier}_`)) + (enchant > 0 ? `@${enchant}` : '');

  return { baseId, tier, enchant, isConsumable, targetId };
}

function getCurrentCraftPriceLocations() {
  return getCraftingCompareCitiesForCurrentMode();
}

function getCurrentCraftPriceTargets() {
  const context = getSelectedCraftContext();
  if (!context) return [];

  const recipe = recipesMap.get(context.baseId) || [];
  const targets = [];
  recipe.forEach(res => {
    const itemId = context.isConsumable ? res.name : res.name.replace(/^T\d_/, `T${context.tier}_`);
    if (itemId) targets.push({ itemId, type: 'material' });
  });

  if (context.enchant > 0) {
    if (context.isConsumable) {
      targets.push({
        itemId: context.baseId.includes('POTION') ? `T1_ALCHEMY_EXTRACT_LEVEL${context.enchant}` : `T1_FISHSAUCE_LEVEL${context.enchant}`,
        type: 'material'
      });
    } else {
      getArtifactChain(context.enchant).forEach((_, idx) => {
        const itemId = getArtifactMarketItemId(context.tier, idx + 1);
        if (itemId) targets.push({ itemId, type: 'material' });
      });
    }
  }

  targets.push({ itemId: context.targetId, type: 'product', targetId: context.targetId, baseId: context.baseId, tier: parseInt(context.tier, 10), enchant: context.enchant });
  return targets.filter(target => target.itemId);
}

function getBestApiSellPrice(entries) {
  const values = entries
    .map(entry => Number(entry?.sell_price_min || 0))
    .filter(value => Number.isFinite(value) && value > 0);
  return values.length ? Math.min(...values) : 0;
}

function getBestApiBuyPrice(entries) {
  const values = entries
    .map(entry => Number(entry?.buy_price_max || 0))
    .filter(value => Number.isFinite(value) && value > 0);
  return values.length ? Math.max(...values) : 0;
}

async function fetchCraftPricesForSelectedItem() {
  if (craftPriceFetchLoading) return;
  const targets = getCurrentCraftPriceTargets();
  if (!targets.length) return;

  craftPriceFetchLoading = true;
  updateCraftFetchButtonState();

  try {
    const locations = getCurrentCraftPriceLocations();
    const uniqueIds = [...new Set(targets.map(target => target.itemId))];
    const url = `${ALBION_DATA_API_HOST}/api/v2/stats/prices/${uniqueIds.join(',')}.json?locations=${encodeURIComponent(locations.join(','))}&qualities=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();

    const grouped = new Map();
    (Array.isArray(rows) ? rows : []).forEach(row => {
      const itemId = String(row?.item_id || '');
      if (!itemId) return;
      if (!grouped.has(itemId)) grouped.set(itemId, []);
      grouped.get(itemId).push(row);
    });

    targets.forEach(target => {
      const entries = grouped.get(target.itemId) || [];
      if (!entries.length) return;

      if (target.type === 'material') {
        let globalLowest = Number.POSITIVE_INFINITY;
        locations.forEach(cityName => {
          const cityEntries = entries.filter(entry => entry?.city === cityName);
          const price = getBestApiSellPrice(cityEntries);
          if (price > 0) {
            setCityResourcePrice(cityName, target.itemId, Math.round(price));
            globalLowest = Math.min(globalLowest, price);
          }
        });
        if (Number.isFinite(globalLowest)) resourcePrices[target.itemId] = Math.round(globalLowest);
        return;
      }

      if (target.type === 'product') {
        const normalizedKey = `${normalizeMarketItemId(target.targetId)}:1`;
        const parsed = parseItemId(target.targetId);
        if (!parsed) return;
        if (!itemMap.has(normalizedKey)) {
          itemMap.set(normalizedKey, { ...parsed, quality: 1, buyPrice: null, city: null, bmSell: null, citySellPrices: {}, timestamp: Date.now() });
        }
        const item = itemMap.get(normalizedKey);
        locations.forEach(cityName => {
          const cityEntries = entries.filter(entry => entry?.city === cityName);
          const price = getBestApiSellPrice(cityEntries) || getBestApiBuyPrice(cityEntries);
          if (price > 0) item.citySellPrices[cityName] = Math.round(price);
        });
        item.timestamp = Date.now();
      }
    });
  } catch (e) {
    console.error('Craft fiyat cekme hatasi:', e);
  } finally {
    craftPriceFetchLoading = false;
    updateCraftFetchButtonState();
    renderCraftTable();
    analyzeSingleItem();
  }
}

function setCityResourcePrice(cityName, itemId, price) {
  if (!cityName || !itemId || !price) return;
  if (!resourcePricesByCity[cityName]) resourcePricesByCity[cityName] = {};
  resourcePricesByCity[cityName][itemId] = price;
}

function getOrderAmount(order) {
  const amount = Number(
    order?.Amount ??
    order?.amount ??
    order?.ItemAmount ??
    order?.itemAmount ??
    order?.TotalCount ??
    order?.totalCount ??
    order?.StackSize ??
    order?.stackSize ??
    order?.Quantity ??
    order?.quantity ??
    0
  );
  return Number.isFinite(amount) ? amount : 0;
}

function upsertMarketDepth(cityName, itemId, order, price, auctionType) {
  if (!cityName || !itemId || !price || !['offer', 'request'].includes(auctionType)) return;
  const normalizedItemId = normalizeMarketItemId(itemId);
  const orderId = String(order?.Id ?? order?.id ?? order?.OrderId ?? order?.orderId ?? `${itemId}:${price}:${cityName}`);
  const amount = getOrderAmount(order);

  if (!marketDepthByCity[cityName]) marketDepthByCity[cityName] = {};
  if (!marketDepthByCity[cityName][normalizedItemId]) marketDepthByCity[cityName][normalizedItemId] = { offer: {}, request: {} };

  if (amount <= 0) {
    delete marketDepthByCity[cityName][normalizedItemId][auctionType][orderId];
    return;
  }

  marketDepthByCity[cityName][normalizedItemId][auctionType][orderId] = { price, amount };
}

function getLowestDepthPriceForItemInCity(cityName, itemId) {
  const entries = Object.values(marketDepthByCity[cityName]?.[itemId] || {})
    .filter(entry => Number(entry?.price) > 0 && Number(entry?.amount) > 0);
  if (!entries.length) return 0;
  return entries.reduce((min, entry) => Math.min(min, entry.price), Number.POSITIVE_INFINITY);
}

function refreshTrackedMarketPrice(itemId, cityName) {
  if (!itemId || !cityName) return;
  const cityLowest = getLowestDepthPriceForItemInCity(cityName, itemId);

  if (!resourcePricesByCity[cityName]) resourcePricesByCity[cityName] = {};
  if (cityLowest > 0) resourcePricesByCity[cityName][itemId] = cityLowest;
  else delete resourcePricesByCity[cityName][itemId];

  let globalLowest = Number.POSITIVE_INFINITY;
  Object.keys(marketDepthByCity).forEach(cityKey => {
    const cityPrice = getLowestDepthPriceForItemInCity(cityKey, itemId);
    if (cityPrice > 0) globalLowest = Math.min(globalLowest, cityPrice);
  });

  if (Number.isFinite(globalLowest)) resourcePrices[itemId] = globalLowest;
  else delete resourcePrices[itemId];
}

function getDepthPriceInfo(itemId, marketCity, requiredQty = 1) {
  if (!itemId) return { unitPrice: 0, availableQty: 0, isDepthBased: false, isSufficient: false, topPrice: 0, topQty: 0 };
  const normalizedItemId = normalizeMarketItemId(itemId);
  if (manualCraftPriceOverrides[itemId] != null) {
    const manualPrice = parseFloat(manualCraftPriceOverrides[itemId]) || 0;
    return { unitPrice: manualPrice, availableQty: Infinity, isDepthBased: false, isSufficient: true, topPrice: manualPrice, topQty: Infinity };
  }

  const cityBook = marketCity ? marketDepthByCity[marketCity]?.[normalizedItemId] : null;
  const entries = cityBook ? Object.values(cityBook.offer || {}) : [];
  const sorted = entries
    .filter(entry => Number(entry?.price) > 0 && Number(entry?.amount) > 0)
    .sort((a, b) => a.price - b.price);

  if (!sorted.length) {
    const fallbackPrice = getCraftMarketPrice(itemId, marketCity);
    return { unitPrice: fallbackPrice || 0, availableQty: 0, isDepthBased: false, isSufficient: false, topPrice: fallbackPrice || 0, topQty: 0 };
  }

  const topPrice = sorted[0]?.price || 0;
  const topQty = sorted
    .filter(entry => entry.price === topPrice)
    .reduce((sum, entry) => sum + entry.amount, 0);

  let remaining = Math.max(1, Number(requiredQty) || 1);
  let totalCost = 0;
  let totalQty = 0;

  for (const entry of sorted) {
    const takeQty = Math.min(remaining, entry.amount);
    totalCost += takeQty * entry.price;
    totalQty += takeQty;
    remaining -= takeQty;
    if (remaining <= 0) break;
  }

  if (remaining > 0) {
    const fallbackPrice = getCraftMarketPrice(itemId, marketCity);
    return {
      unitPrice: fallbackPrice || (totalQty > 0 ? totalCost / totalQty : 0),
      availableQty: totalQty,
      isDepthBased: false,
      isSufficient: false,
      topPrice,
      topQty
    };
  }

  return {
    unitPrice: totalQty > 0 ? totalCost / totalQty : 0,
    availableQty: totalQty,
    isDepthBased: true,
    isSufficient: true,
    topPrice,
    topQty
  };
}

function getOrderDepthSnapshot(cityName, itemId, auctionType = 'offer') {
  if (!cityName || !itemId) return { topPrice: 0, topQty: 0, totalQty: 0 };
  const normalizedItemId = normalizeMarketItemId(itemId);
  const book = marketDepthByCity[cityName]?.[normalizedItemId];
  const entries = Object.values(book?.[auctionType] || {})
    .filter(entry => Number(entry?.price) > 0 && Number(entry?.amount) > 0);
  if (!entries.length) return { topPrice: 0, topQty: 0, totalQty: 0 };

  if (auctionType === 'offer') {
    const topPrice = entries.reduce((min, entry) => Math.min(min, entry.price), Number.POSITIVE_INFINITY);
    const topQty = entries.filter(entry => entry.price === topPrice).reduce((sum, entry) => sum + entry.amount, 0);
    const totalQty = entries.reduce((sum, entry) => sum + entry.amount, 0);
    return { topPrice, topQty, totalQty };
  }

  const topPrice = entries.reduce((max, entry) => Math.max(max, entry.price), 0);
  const topQty = entries.filter(entry => entry.price === topPrice).reduce((sum, entry) => sum + entry.amount, 0);
  const totalQty = entries.reduce((sum, entry) => sum + entry.amount, 0);
  return { topPrice, topQty, totalQty };
}

function getCraftMarketPrice(itemId, marketCity) {
  if (manualCraftPriceOverrides[itemId] != null) {
    return manualCraftPriceOverrides[itemId];
  }
  if (marketCity && resourcePricesByCity[marketCity]?.[itemId]) {
    return resourcePricesByCity[marketCity][itemId];
  }
  return resourcePrices[itemId] || 0;
}

function getArtifactFallbackPriceForCity(tier, enchantLevel, marketCity) {
  const cityArtifactPrice = getCraftMarketPrice(getArtifactMarketItemId(tier, enchantLevel), marketCity);
  if (cityArtifactPrice) return cityArtifactPrice;
  return getArtifactFallbackPrice(tier, enchantLevel);
}

function getArtifactMarketPrice(tier, enchantLevel, marketCity) {
  const artifactItemId = getArtifactMarketItemId(tier, enchantLevel);
  if (marketCity && resourcePricesByCity[marketCity]?.[artifactItemId]) {
    return resourcePricesByCity[marketCity][artifactItemId];
  }
  return resourcePrices[artifactItemId] || getArtifactFallbackPrice(tier, enchantLevel) || 0;
}

function getFlipperSourceItem(baseId, quality, sourceEnchant) {
  const sourceItemId = sourceEnchant > 0 ? `${baseId}@${sourceEnchant}` : baseId;
  const normalizedKey = `${normalizeMarketItemId(sourceItemId)}:${quality}`;
  return itemMap.get(normalizedKey) || itemMap.get(`${sourceItemId}:${quality}`) || null;
}

function getFlipperEnchantFlipData(item, tax) {
  if (!item || item.enchant <= 0 || item.enchant >= 4 || !item.effectiveBmSell) return null;

  const artifactCount = getArtifactRequirement(item.baseId);
  if (!artifactCount) return null;

  let bestPath = null;
  for (let sourceEnchant = 0; sourceEnchant < item.enchant; sourceEnchant += 1) {
    const sourceItem = getFlipperSourceItem(item.baseId, item.quality, sourceEnchant);
    if (!sourceItem?.buyPrice) continue;
    const artifactMarketCity = sourceItem.city || item.city || null;

    let upgradeCost = 0;
    const artifactBreakdown = [];
    let validPath = true;

    for (let enchantLevel = sourceEnchant + 1; enchantLevel <= item.enchant; enchantLevel += 1) {
      const artifactItemId = getArtifactMarketItemId(item.tier, enchantLevel);
      const depthInfo = getDepthPriceInfo(artifactItemId, artifactMarketCity, artifactCount);
      const artifactPrice = depthInfo.unitPrice || getArtifactMarketPrice(item.tier, enchantLevel, artifactMarketCity);
      if (!artifactPrice) {
        validPath = false;
        break;
      }
      const artifactTotal = artifactPrice * artifactCount;
      upgradeCost += artifactTotal;
      artifactBreakdown.push({
        name: ARTIFACTS[enchantLevel - 1],
        count: artifactCount,
        unitPrice: artifactPrice,
        totalPrice: artifactTotal,
        availableQty: Number.isFinite(depthInfo.availableQty) ? depthInfo.availableQty : artifactCount,
        topPrice: depthInfo.topPrice || artifactPrice,
        topQty: depthInfo.topQty || 0,
        depthBased: !!depthInfo.isDepthBased,
        sufficientDepth: !!depthInfo.isSufficient
      });
    }

    if (!validPath) continue;

    const totalCost = sourceItem.buyPrice + upgradeCost;
    const netSell = item.effectiveBmSell * (1 - tax);
    const profit = netSell - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : null;
    const candidate = {
      sourceEnchant,
      sourceBuyPrice: sourceItem.buyPrice,
      sourceBuyCity: sourceItem.city || null,
      artifactMarketCity,
      artifactCount,
      artifactBreakdown,
      upgradeCost,
      totalCost,
      netSell,
      profit,
      roi
    };

    if (!bestPath || candidate.totalCost < bestPath.totalCost) {
      bestPath = candidate;
    }
  }

  return bestPath;
}

function processOrders(orders) {
  const selectedCity = (typeof customSelectValues !== 'undefined' && customSelectValues['citySelect']) ? customSelectValues['citySelect'] : 'all';
  let updated = false;

  orders.forEach(o => {
    const itemId = o.ItemTypeId || o.itemTypeId;
    const locId = String(o.LocationId || o.locationId || '');
    const locName = LOCATION_MAP[locId] || locId;
    const quality = o.QualityLevel || o.qualityLevel || 1;
    const auctType = (o.AuctionType || o.auctionType || '').toLowerCase();
    let price = (o.UnitPriceSilver || o.SilverAmount || o.price || 0) / (o.UnitPriceSilver ? 10000 : 1);
    if (!itemId || price <= 0) return;
    upsertMarketDepth(locName, itemId, o, price, auctType);

    const isTrackedResource = !!parseMarketResourceItemId(itemId) || isConsumableResource(itemId);
    if (isTrackedResource && auctType === 'offer') {
      if (manualCraftPriceOverrides[itemId] != null) {
        delete manualCraftPriceOverrides[itemId];
      }
      refreshTrackedMarketPrice(itemId, locName);
      updated = true;
    }

    if (isProductionArtifactItem(itemId) && auctType === 'offer') {
      if (manualCraftPriceOverrides[itemId] != null) {
        delete manualCraftPriceOverrides[itemId];
      }
      refreshTrackedMarketPrice(itemId, locName);
      updated = true;
    }

    if (currentPage === 'crafting' && !isTrackedResource && !isProductionArtifactItem(itemId) && !shouldTrackCraftingItem(itemId)) {
      return;
    }

    if (currentPage === 'flipper' && !shouldTrackFlipperItem(itemId)) {
      return;
    }

    const parsed = parseItemId(itemId);
    if (!parsed) return;

    const key = `${normalizeMarketItemId(itemId)}:${quality}`;
    if (!itemMap.has(key)) {
      itemMap.set(key, { ...parsed, quality, buyPrice: null, city: null, bmSell: null, citySellPrices: {}, timestamp: Date.now() });
    }
    const item = itemMap.get(key);

    if (locName !== 'Black Market' && locName !== 'Caerleon' && auctType === 'offer') {
      if (currentPage === 'flipper' && selectedCity !== 'all' && locName !== selectedCity) return;
      if (!item.buyPrice || price < item.buyPrice) { item.buyPrice = price; item.city = locName; updated = true; }
      if (!item.citySellPrices[locName] || price < item.citySellPrices[locName]) { item.citySellPrices[locName] = price; updated = true; }
    }

    if ((locName === 'Black Market' || locName === 'Caerleon') && auctType === 'request') {
      if (!item.bmSell || price > item.bmSell) {
        item.bmSell = price;
        item.citySellPrices['Black Market'] = price; 
        updated = true;
      }
    }
    item.timestamp = Date.now();
  });

  // DOM Render Optimizasyonu (Saniyede max 2 kez günceller)
  if (updated) {
      if (!renderTimer) {
          renderTimer = setTimeout(() => {
              updateCurrentView();
              if (currentPage === 'crafting') analyzeSingleItem();
              renderTimer = null; 
          }, 1000); 
      }
  }
}

// ─── DETAYLI TEKİL EŞYA HESAPLAYICI VE MALZEME GÖSTERİMİ ────────────────────
function calculateCraftFocusCost(baseFocus, totalEfficiency) {
    const base = Math.max(0, Number(baseFocus) || 0);
    const efficiency = Math.max(0, Number(totalEfficiency) || 0);
    if (base <= 0) return 0;
    return base * Math.pow(0.5, efficiency / 10000);
}

function calculateRrrRecraftCraftCount(initialCraftCount, rrr) {
    const safeRrr = Math.min(Math.max(Number(rrr) || 0, 0), 0.95);
    return Math.round((Math.max(0, Number(initialCraftCount) || 0)) / Math.max(0.05, 1 - safeRrr));
}

function getCraftOtherSpecEfficiencyPerLevel(baseId = document.getElementById('singleItemSelect')?.value || '') {
    return String(baseId || '').includes('POTION') ? 18 : 30;
}

function calculateCraftFocusEfficiency(masteryLevel, itemSpecLevel, otherSpecTotal, baseId = document.getElementById('singleItemSelect')?.value || '') {
    const mastery = Math.max(0, Number(masteryLevel) || 0);
    const itemSpec = Math.max(0, Number(itemSpecLevel) || 0);
    const otherSpecs = Math.max(0, Number(otherSpecTotal) || 0);
    return (mastery * 30) + (itemSpec * 250) + (otherSpecs * getCraftOtherSpecEfficiencyPerLevel(baseId));
}

function analyzeSingleItem() {
    updateCraftSelectColors();
    const baseId = document.getElementById('singleItemSelect')?.value;
    const resultBox = document.getElementById('singleItemResult');
    if (!baseId || !resultBox) {
        if(resultBox) resultBox.style.display = 'none';
        return;
    }

    resultBox.style.display = 'block';

    const selectedTier = document.getElementById('singleTier').value;
    const enchant = parseInt(document.getElementById('singleEnchant').value);
    const requiredRunes = parseInt(document.getElementById('singleEnchantAmount').value) || 0;
    const isConsumable = loadedConsumables && [...(potionsAndFoods.potions || []), ...(potionsAndFoods.foods || [])].some(c => c.uniquename === baseId);
    const selectedConsumable = isConsumable && loadedConsumables
      ? [...(potionsAndFoods.potions || []), ...(potionsAndFoods.foods || [])].find(c => c.uniquename === baseId)
      : null;
    const yieldPerCraft = selectedConsumable?.amountCrafted || 1;
    const tierMatch = baseId.match(/^T(\d+)/);
    const tier = isConsumable ? (tierMatch ? tierMatch[1] : selectedTier) : selectedTier;

    const craftRrr = getEffectiveRrrFromInput('rrrRate') || 0.152;
    const tax = parseFloat(document.getElementById('marketTax').value) / 100 || 0.065;
    const craftingFee = parseFloat(document.getElementById('craftingFee')?.value) || 0;
    
    // Auto-populate base focus for consumables
    let baseFocusCost = parseFloat(document.getElementById('craftBaseFocus')?.value) || 0;
    if (selectedConsumable && selectedConsumable.baseFocusCost) {
        baseFocusCost = selectedConsumable.baseFocusCost;
        const focusInput = document.getElementById('craftBaseFocus');
        if (focusInput) focusInput.value = baseFocusCost;
    }
    const masteryLevel = parseFloat(document.getElementById('craftMasteryLevel')?.value) || 0;
    const itemSpecLevel = parseFloat(document.getElementById('craftItemSpecLevel')?.value) || 0;
    const otherSpecTotal = parseFloat(document.getElementById('craftOtherSpecTotal')?.value) || 0;
    const totalFocusEfficiency = calculateCraftFocusEfficiency(masteryLevel, itemSpecLevel, otherSpecTotal, baseId);
    const totalFocusPool = parseFloat(document.getElementById('craftTotalFocusPool')?.value) || 0;
    const baseFocusCostPerCraft = isConsumable ? baseFocusCost * yieldPerCraft : baseFocusCost;
    const focusPerCraft = calculateCraftFocusCost(baseFocusCostPerCraft, totalFocusEfficiency);
    const focusCraftCapacityForSelected = focusPerCraft > 0 ? Math.floor(totalFocusPool / focusPerCraft) : 0;
    const quantityInput = document.getElementById('craftQuantity');
    if (isConsumable && totalFocusPool > 0 && focusCraftCapacityForSelected > 0 && quantityInput && !craftQuantityManualOverride) {
      const nextQuantity = String(focusCraftCapacityForSelected);
      if (quantityInput.value !== nextQuantity) {
        quantityInput.value = nextQuantity;
        saveCraftQuantityForItem(baseId, enchant, nextQuantity);
      }
    }
    
    // Update final focus cost display
    const finalFocusDisplay = document.getElementById('finalFocusCostDisplay');
    if (finalFocusDisplay) {
      finalFocusDisplay.textContent = formatNum(Math.ceil(focusPerCraft));
    }

    const currentQty = Math.max(1, parseInt(document.getElementById('craftQuantity')?.value || '1', 10) || 1);
    const currentJournalProfit = isConsumable ? 0 : (document.getElementById('journalProfit') ? parseFloat(document.getElementById('journalProfit').value) || 0 : 0);
    const currentJournalCount = isConsumable ? 0 : (document.getElementById('journalCount') ? parseFloat(document.getElementById('journalCount').value) || 0 : 1);
    const selectedCityProfitQuality = selectedCityProfitQualityState || 1;
    const targetId = (isConsumable ? baseId : baseId.replace(/^T\d_/, `T${tier}_`)) + (enchant > 0 ? `@${enchant}` : '');
    const recipe = recipesMap.get(baseId);
    const itemName = itemNameMap.get(baseId) || baseId;

    if (!recipe || recipe.length === 0) {
        resultBox.innerHTML = `
            <div style="color:var(--red); padding:10px; background:var(--bg4); border-radius:6px; margin-top:10px;">${getTranslatedText('Recipe data not found.')}</div>
        `;
        return;
    }

    const craftCostMethodLabel = isConsumable
      ? (baseId.includes('POTION') ? 'Base recipe + Arcane Extract' : 'Base recipe + Fish Sauce')
      : 'Flat item crafting + Runes';
    const craftYieldBadge = isConsumable
      ? `${formatNum(currentQty * yieldPerCraft)} ${getTranslatedText('Produces')}`
      : getTranslatedText('1 craft');
    let bestSellPrice = 0;
    let bestSellCity = getTranslatedText('None');
    const qualityMarketData = new Map();
    for (const [key, itemData] of itemMap.entries()) {
        if (!key.startsWith(targetId)) continue;

        let qualityBestPrice = 0;
        let qualityBestCity = getTranslatedText('None');
        for (const [city, price] of Object.entries(itemData.citySellPrices)) {
            if (price > qualityBestPrice) {
                qualityBestPrice = price;
                qualityBestCity = city;
            }
            if (price > bestSellPrice) {
                bestSellPrice = price;
                bestSellCity = city;
            }
        }

        if (qualityBestPrice > 0) {
            const existing = qualityMarketData.get(itemData.quality);
            if (!existing || qualityBestPrice > existing.price) {
                qualityMarketData.set(itemData.quality, {
                    quality: itemData.quality,
                qualityName: getTranslatedText(QUALITY_NAMES[itemData.quality]) || `Q${itemData.quality}`,
                    price: qualityBestPrice,
                    city: qualityBestCity,
                    net: qualityBestPrice * (1 - tax)
                });
            }
        }
    }

    const getCraftCostPreviewForCity = (cityName) => {
      let cityFlatRawCost = 0;
      let cityNonReturnableCost = 0;
      recipe.forEach(res => {
        const cityBaseResName = isConsumable ? res.name : res.name.replace(/^T\d_/, `T${tier}_`);
        const cityResPrice = getCraftMarketPrice(cityBaseResName, cityName);
        const lineCost = (cityResPrice || 0) * res.count;
        if (isConsumable && isCraftRrrExcludedMaterial(cityBaseResName)) cityNonReturnableCost += lineCost;
        else cityFlatRawCost += lineCost;
      });

      let cityArtifactCost = cityNonReturnableCost;
      if (enchant > 0) {
        if (isConsumable) {
          const enchantItemName = baseId.includes('POTION') ? `T1_ALCHEMY_EXTRACT_LEVEL${enchant}` : `T1_FISHSAUCE_LEVEL${enchant}`;
          const enchantItemCount = getConsumableEnchantCount(baseId, tier);
          const cityArtifactPrice = getCraftMarketPrice(enchantItemName, cityName);
          cityArtifactCost += (cityArtifactPrice || 0) * enchantItemCount;
        } else {
          const artifactChain = getArtifactChain(enchant);
          artifactChain.forEach((artifact, idx) => {
            const enchLevel = idx + 1;
            const cityArtifactPrice = getArtifactFallbackPriceForCity(tier, enchLevel, cityName);
            cityArtifactCost += cityArtifactPrice * requiredRunes;
          });
        }
      }

      const hasAnyPrice = cityFlatRawCost > 0 || cityArtifactCost > 0;
      const cityRrr = getEffectiveRrrForCity('rrrRate', cityName);
      return {
        city: cityName,
        hasAnyPrice,
        total: (cityFlatRawCost * (1 - cityRrr)) + cityArtifactCost + craftingFee
      };
    };

    const bestCraftPriceCityEntry = getCraftingCompareCitiesForCurrentMode()
      .map(getCraftCostPreviewForCity)
      .filter(entry => entry.hasAnyPrice)
      .sort((a, b) => a.total - b.total)[0] || null;
    const craftingMarketCity = bestCraftPriceCityEntry?.city || (bestSellCity !== getTranslatedText('None') ? bestSellCity : '');

    let costFlatRaw = 0;
    let nonReturnableRecipeCost = 0;
    let method1MaterialsHtml = '';

    recipe.forEach(res => {
        let visualNameBase = isConsumable ? res.name : res.name.replace(/^T\d_/, `T${tier}_`);
        let visualNameEnch = visualNameBase;
        if (!isConsumable && enchant > 0 && visualNameBase.match(/T\d+_(METALBAR|PLANKS|LEATHER|CLOTH)/)) {
            visualNameEnch += `_LEVEL${enchant}`;
        }

        let niceName = itemNameMap.get(visualNameEnch);
        if(!niceName) niceName = formatResourceDisplayName(visualNameEnch);

        let resPriceFlat = getCraftMarketPrice(visualNameBase, craftingMarketCity);
        const lineCost = (resPriceFlat || 0) * res.count;
        if (isConsumable && isCraftRrrExcludedMaterial(visualNameBase)) nonReturnableRecipeCost += lineCost;
        else costFlatRaw += lineCost;

        const baseNiceName = itemNameMap.get(visualNameBase) || formatResourceDisplayName(visualNameBase);
        const baseMaterialIcon = getAlbionIconHtml(visualNameBase, 'material-line-icon', 64);
        const totalMaterialCount = res.count * currentQty;
        method1MaterialsHtml += `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px; padding:8px 10px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px;">
            <div style="font-size:12px; color:var(--text-mid); min-width:0;" class="material-line-label">
                ${baseMaterialIcon}
                <span>
                <b style="color:var(--accent); font-size:14px;">${totalMaterialCount}x</b> ${baseNiceName}
                </span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:11px; color:var(--text-dim);">${getTranslatedText('Price:')}</span>
                <input type="number" class="modern-input" style="width: 82px; padding:6px 8px; font-size:12px;"
                       value="${resPriceFlat || 0}"
                       onchange="updateResourcePrice('${visualNameBase}', this.value)"
                       placeholder="${getTranslatedText('Pending')}">
            </div>
        </div>`;

    });

    let artifactCost = nonReturnableRecipeCost;
    if (enchant > 0) {
        if (isConsumable) {
            const enchantItemName = baseId.includes('POTION') ? `T1_ALCHEMY_EXTRACT_LEVEL${enchant}` : `T1_FISHSAUCE_LEVEL${enchant}`;
            const enchantItemCount = getConsumableEnchantCount(baseId, tier); 
            const artPrice = getCraftMarketPrice(enchantItemName, craftingMarketCity);
            artifactCost += artPrice * enchantItemCount;

            const totalArtifactCount = enchantItemCount * currentQty;
            const enchantNiceName = itemNameMap.get(enchantItemName) || formatResourceDisplayName(enchantItemName);
            const enchantMaterialIcon = getAlbionIconHtml(enchantItemName, 'material-line-icon', 64);

            method1MaterialsHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px; padding:8px 10px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px;">
                <div style="font-size:12px; color:var(--text-mid); min-width:0;" class="material-line-label">
                    ${enchantMaterialIcon}
                    <span>
                    <b style="color:var(--accent); font-size:14px;">${totalArtifactCount}x</b> ${enchantNiceName}
                    </span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:11px; color:var(--text-dim);">${getTranslatedText('Price:')}</span>
                    <input type="number" class="modern-input" style="width: 82px; padding:6px 8px; font-size:12px;"
                           value="${artPrice || 0}"
                           onchange="updateResourcePrice('${enchantItemName}', this.value)"
                           placeholder="${getTranslatedText('Pending')}">
                </div>
            </div>`;
        } else {
            const artifactChain = getArtifactChain(enchant);
            let method1ArtifactMaterialsHtml = '';
            if (requiredRunes > 0) {
            artifactChain.forEach((artifact, idx) => {
                const enchLevel = idx + 1;
                const artPrice = getArtifactFallbackPriceForCity(tier, enchLevel, craftingMarketCity);
                artifactCost += artPrice * requiredRunes;
                const totalArtifactCount = requiredRunes * currentQty;

                method1ArtifactMaterialsHtml += `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px; padding:8px 10px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:8px;">
                    <div style="font-size:12px; color:var(--text-mid); min-width:0;" class="material-line-label">
                        ${getArtifactIconHtml(artifact, tier, 'artifact-inline-image')}
                        <span>
                        <b style="color:var(--accent); font-size:14px;">${totalArtifactCount}x</b> T${tier} ${artifact}
                        </span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:11px; color:var(--text-dim);">${getTranslatedText('Price:')}</span>
                        <input type="number" class="modern-input" style="width: 82px; padding:6px 8px; font-size:12px;"
                               value="${artPrice || 0}"
                               onchange="updateArtifactPrice('${tier}', '${enchLevel}', this.value)"
                               placeholder="${getTranslatedText('Pending')}">
                    </div>
                </div>`;
            });
            method1MaterialsHtml += method1ArtifactMaterialsHtml;
            } else {
                artifactChain.forEach((artifact, idx) => {
                    const enchLevel = idx + 1;
                    const artPrice = getArtifactFallbackPriceForCity(tier, enchLevel, craftingMarketCity);
                    artifactCost += artPrice * requiredRunes;
                });
            }
        }
    }

    const craftCostPerItem = (costFlatRaw * (1 - craftRrr)) + artifactCost + craftingFee;
    const totalCraftCost = craftCostPerItem * currentQty;
    const totalFocusNeeded = focusPerCraft * currentQty;
    const focusCraftCapacity = focusCraftCapacityForSelected;
    const focusItemCapacity = focusCraftCapacity * yieldPerCraft;
    const rrrLoopCraftCount = isConsumable
      ? calculateRrrRecraftCraftCount(currentQty, craftRrr)
      : currentQty;
    const rrrLoopItemCount = rrrLoopCraftCount * yieldPerCraft;
    const focusSummaryHtml = focusPerCraft > 0 ? `
        <div class="craft-focus-summary" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:20px;">
            <div class="craft-focus-card" style="padding:14px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:10px;">
                <span style="font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600; display:block; margin-bottom:8px;">${getTranslatedText('Per Craft Focus')}</span>
                <strong style="font-size:20px; color:var(--purple);">${formatNum(Math.ceil(focusPerCraft))}</strong>
            </div>
            <div class="craft-focus-card" style="padding:14px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:10px;">
                <span style="font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600; display:block; margin-bottom:8px;">${getTranslatedText('Piece Craft With Focus')}</span>
                <strong style="font-size:20px; color:var(--green);">${formatNum(focusItemCapacity)}</strong>
            </div>
        </div>` : '';
    const consumableFocusNoteHtml = isConsumable ? `
        <div class="craft-focus-note">
            <span class="craft-focus-note-icon">✦</span>
            <span>${getTranslatedText('The use of focus is critical in food and potion production. Production using focus yields significantly higher profits compared to production without focus !!!')}</span>
        </div>` : '';

    const netSellPerItem = bestSellPrice * (1 - tax);
    const totalNetSell = netSellPerItem * (currentQty * yieldPerCraft);
    const totalJournalProfit = currentJournalProfit * currentJournalCount * currentQty;

    const totalRevenue = totalNetSell + totalJournalProfit;

    let totalProfit = 0;

    if (bestSellPrice > 0) {
        totalProfit = totalRevenue - totalCraftCost;
    }

    const getCityCraftCost = (cityName) => {
      let cityFlatRawCost = 0;
      let cityNonReturnableCost = 0;
      recipe.forEach(res => {
        const cityBaseResName = isConsumable ? res.name : res.name.replace(/^T\d_/, `T${tier}_`);
        const cityResPrice = getCraftMarketPrice(cityBaseResName, cityName);
        const lineCost = (cityResPrice || 0) * res.count;
        if (isConsumable && isCraftRrrExcludedMaterial(cityBaseResName)) cityNonReturnableCost += lineCost;
        else cityFlatRawCost += lineCost;
      });

      let cityArtifactCost = cityNonReturnableCost;
      if (enchant > 0) {
        if (isConsumable) {
            const enchantItemName = baseId.includes('POTION') ? `T1_ALCHEMY_EXTRACT_LEVEL${enchant}` : `T1_FISHSAUCE_LEVEL${enchant}`;
            const enchantItemCount = getConsumableEnchantCount(baseId, tier);
            const cityArtifactPrice = getCraftMarketPrice(enchantItemName, cityName);
            cityArtifactCost += (cityArtifactPrice || 0) * enchantItemCount;
        } else {
            const artifactChain = getArtifactChain(enchant);
            artifactChain.forEach((artifact, idx) => {
              const enchLevel = idx + 1;
              const cityArtifactPrice = getArtifactFallbackPriceForCity(tier, enchLevel, cityName);
              cityArtifactCost += cityArtifactPrice * requiredRunes;
            });
        }
      }

      return {
        rawCost: cityFlatRawCost,
        artifactCost: cityArtifactCost
      };
    };

    const craftingCompareCities = getCraftingCompareCitiesForCurrentMode();
    const cityComparisonHtml = craftingCompareCities.map(cityName => {
      const cityRrr = getEffectiveRrrForCity('rrrRate', cityName);
      const cityCostData = getCityCraftCost(cityName);
      const cityRecipeAfterRrr = cityCostData.rawCost * (1 - cityRrr);
      const bestCityCost = cityRecipeAfterRrr + cityCostData.artifactCost + craftingFee;
      const cityColor = CITY_COLORS[cityName] || 'var(--text-mid)';
      const hasCityBonus = getSelectedBonusCity() === cityName && document.getElementById('cityProductionBonus')?.checked;

      return `
      <div style="padding:12px 14px; background:linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.14)); border:1px solid ${hasCityBonus ? cityColor : 'var(--border)'}; border-radius:14px; box-shadow:${hasCityBonus ? `0 0 0 1px ${cityColor}33, 0 0 24px ${cityColor}26` : 'none'};">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
          <div style="display:inline-flex; align-items:center; gap:8px; min-width:0;">
            <span style="display:inline-flex; align-items:center; justify-content:center; min-width:36px; height:22px; padding:0 8px; border-radius:999px; background:rgba(255,255,255,0.06); border:1px solid ${hasCityBonus ? cityColor : 'rgba(255,255,255,0.08)'}; color:${cityColor}; font-size:11px; font-weight:800;">${cityName}</span>
          </div>
          <div style="font-size:15px; color:var(--green); font-weight:900; font-family:'JetBrains Mono';">${formatNum(Math.round(bestCityCost * currentQty))}</div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <span style="display:inline-flex; align-items:center; height:22px; padding:0 8px; border-radius:999px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:var(--text-dim); font-size:11px;">RRR %${(cityRrr * 100).toFixed(1)}</span>
        </div>
        <div style="display:grid; gap:4px; margin-top:10px; padding-top:9px; border-top:1px dashed rgba(255,255,255,0.08); font-size:11px;">
          ${cityCostData.artifactCost > 0 ? `<div style="display:flex; justify-content:space-between; gap:10px;"><span style="color:var(--text-dim);">${getTranslatedText('Extra materials')}</span><b style="color:var(--orange); font-family:'JetBrains Mono';">${formatNum(Math.round(cityCostData.artifactCost))}</b></div>` : ''}
        </div>
        ${isConsumable && cityCostData.artifactCost > 0 ? `<div style="margin-top:8px; color:var(--text-dim); font-size:10px; line-height:1.35;">${getTranslatedText('RRR applies to recipe materials only')}</div>` : ''}
      </div>`;
    }).join('');

    const matchingCityItems = Array.from(itemMap.values()).filter(itemData =>
      itemData.baseId === baseId &&
      itemData.tier === parseInt(tier, 10) &&
      itemData.enchant === enchant &&
      (isConsumable || itemData.quality === selectedCityProfitQuality)
    );

    const cityProfitEntries = craftingCompareCities.map(cityName => {
      const citySellPrice = matchingCityItems.reduce((best, itemData) => {
        const cityPrice = itemData.citySellPrices?.[cityName] || 0;
        const cityQuality = itemData.quality || 1;
        if (!best || cityPrice > best.price) {
          return { price: cityPrice, quality: cityQuality };
        }
        return best;
      }, null);

      const cityRrr = getEffectiveRrrForCity('rrrRate', cityName);
      const cityCostData = getCityCraftCost(cityName);
      const cityCraftCost = (cityCostData.rawCost * (1 - cityRrr)) + cityCostData.artifactCost + craftingFee;
      const cityNetSell = citySellPrice?.price ? citySellPrice.price * (1 - tax) : 0;
      const cityProfit = cityNetSell ? (cityNetSell * currentQty * yieldPerCraft) + totalJournalProfit - (cityCraftCost * currentQty) : null;

      return {
        city: cityName,
        sellPrice: citySellPrice?.price || 0,
        netSell: cityNetSell,
        quality: citySellPrice?.quality || 0,
        craftCost: cityCraftCost,
        profit: cityProfit
      };
    });

    const cityProfitHtml = cityProfitEntries
      .map(entry => {
        const cityColor = CITY_COLORS[entry.city] || 'var(--text-mid)';
        const qName = entry.quality ? (getTranslatedText(QUALITY_NAMES[entry.quality]) || `Q${entry.quality}`) : getTranslatedText('None');
        return `
        <div style="padding:12px; background:rgba(0,0,0,0.18); border:1px solid var(--border); border-radius:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:8px;">
            <span style="display:inline-flex; align-items:center; height:24px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:${cityColor}; font-size:11px; font-weight:800;">${entry.city}</span>
            <span style="font-size:12px; color:${entry.profit != null && entry.profit >= 0 ? 'var(--green)' : 'var(--red)'}; font-weight:800; font-family:'JetBrains Mono';">${entry.profit == null ? '—' : `${entry.profit >= 0 ? '+' : ''}${formatNum(Math.round(entry.profit))}`}</span>
          </div>
          <div style="display:grid; gap:4px; font-size:11px;">
            <div style="display:flex; justify-content:space-between; gap:12px;"><span style="color:var(--text-dim);">Craft</span><b style="color:var(--text);">${formatNum(Math.round(entry.craftCost / Math.max(1, yieldPerCraft)))}</b></div>
            <div style="display:flex; justify-content:space-between; gap:12px;"><span style="color:var(--text-dim);">${getTranslatedText('Sell')}</span><b style="color:var(--blue);">${entry.sellPrice ? formatNum(Math.round(entry.sellPrice)) : '—'}</b></div>
            ${isConsumable ? '' : `<div style="display:flex; justify-content:space-between; gap:12px;"><span style="color:var(--text-dim);">${getTranslatedText('Quality')}</span><b style="color:var(--text);">${qName}</b></div>`}
          </div>
        </div>`;
      })
      .join('');

    const routeBuyCities = new Set(getCraftingRouteBuyCitiesForCurrentMode());
    const routeSellCities = new Set(getCraftingRouteSellCitiesForCurrentMode());
    const bestCraftCityEntry = [...cityProfitEntries]
      .filter(entry => routeBuyCities.has(entry.city) && entry.craftCost > 0)
      .sort((a, b) => a.craftCost - b.craftCost)[0] || null;
    const bestSellCityEntry = [...cityProfitEntries]
      .filter(entry => routeSellCities.has(entry.city) && entry.netSell > 0)
      .sort((a, b) => b.netSell - a.netSell)[0] || null;
    const bestRouteProfit = (bestCraftCityEntry && bestSellCityEntry)
      ? ((bestSellCityEntry.netSell * currentQty * yieldPerCraft) + totalJournalProfit - (bestCraftCityEntry.craftCost * currentQty))
      : null;

    const trackedMaterialIds = [];
    recipe.forEach(res => {
      trackedMaterialIds.push(isConsumable ? res.name : res.name.replace(/^T\d_/, `T${tier}_`));
    });
    if (enchant > 0) {
        if (isConsumable) {
            const enchantItemName = baseId.includes('POTION') ? `T1_ALCHEMY_EXTRACT_LEVEL${enchant}` : `T1_FISHSAUCE_LEVEL${enchant}`;
            trackedMaterialIds.push(enchantItemName);
        } else if (requiredRunes > 0) {
            getArtifactChain(enchant).forEach((artifact, idx) => {
                trackedMaterialIds.push(getArtifactMarketItemId(tier, idx + 1));
            });
        }
    }

    const materialPriceSummaryRows = trackedMaterialIds
      .map(itemId => {
        const priceEntries = craftingCompareCities
          .map(cityName => ({ city: cityName, price: getCraftMarketPrice(itemId, cityName) || 0 }))
          .filter(entry => entry.price > 0);
        if (!priceEntries.length) return '';
        const cheapest = [...priceEntries].sort((a, b) => a.price - b.price)[0];
        const label = itemNameMap.get(itemId) || formatResourceDisplayName(itemId);
        const labelIcon = getMaterialSummaryIconHtml(itemId);
        const cityCells = craftingCompareCities.map(cityName => {
          const cityPrice = getCraftMarketPrice(itemId, cityName) || 0;
          const cityColor = CITY_COLORS[cityName] || 'var(--text-mid)';
          const isCheapest = cityPrice > 0 && cityPrice === cheapest.price;
          return `<td style="padding:7px 4px; text-align:center; font-size:11px; color:${cityPrice ? cityColor : 'var(--text-dim)'}; font-family:'JetBrains Mono', monospace; white-space:nowrap; ${isCheapest ? 'background:rgba(74,222,128,0.10); box-shadow:inset 0 0 0 1px rgba(74,222,128,0.18); font-weight:800;' : ''}">${cityPrice ? formatNum(Math.round(cityPrice)) : '—'}</td>`;
        }).join('');

        return `
        <tr>
          <td style="padding:7px 8px; font-size:12px; line-height:1.25; color:var(--text); font-weight:700; word-break:break-word;">
            <div style="display:inline-flex; align-items:center; gap:6px; max-width:100%;">
              ${labelIcon}
              <span style="overflow-wrap:anywhere;">${label}</span>
            </div>
          </td>
          ${cityCells}
        </tr>`;
      })
      .filter(Boolean)
      .join('');

    const qualityDifferenceHtml = Array.from(qualityMarketData.values())
      .sort((a, b) => a.quality - b.quality)
      .filter(entry => entry.quality >= 1 && entry.quality <= 4)
      .map(entry => {
        const cityColor = CITY_COLORS[entry.city] || 'var(--text-dim)';
        const qualityRevenue = (entry.net * currentQty * yieldPerCraft) + totalJournalProfit;
        const qualityProfit = qualityRevenue - (craftCostPerItem * currentQty);
        const qualityColor = entry.quality === 1 ? '#f3f4f6' : (entry.quality === 2 ? '#4ade80' : (entry.quality === 3 ? '#60a5fa' : '#c084fc'));

        return `
        <div style="padding:12px; background:rgba(0,0,0,0.18); border:1px solid var(--border); border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:8px;">
                <span style="display:inline-flex; align-items:center; height:24px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:${qualityColor}; font-size:11px; font-weight:800;">${entry.qualityName}</span>
                <span style="font-size:11px; color:${cityColor};">${entry.city}</span>
            </div>
            <div style="display:grid; gap:4px; font-size:12px;">
                <div style="display:flex; justify-content:space-between; gap:12px;"><span style="color:var(--text-dim);">${getTranslatedText('Sell')}</span><b style="color:var(--text); font-family:'JetBrains Mono';">${formatNum(Math.round(entry.price * yieldPerCraft))}</b></div>
                <div style="display:flex; justify-content:space-between; gap:12px;"><span style="color:var(--text-dim);">${getTranslatedText('Net')}</span><b style="color:var(--blue); font-family:'JetBrains Mono';">${formatNum(Math.round(entry.net * yieldPerCraft))}</b></div>
                <div style="display:flex; justify-content:space-between; gap:12px; padding-top:6px; margin-top:4px; border-top:1px dashed rgba(255,255,255,0.08);"><span style="color:var(--text-dim);">${getTranslatedText('Profit Difference')}</span><b style="color:${qualityProfit >= 0 ? 'var(--green)' : 'var(--red)'}; font-family:'JetBrains Mono';">${qualityProfit >= 0 ? '+' : ''}${formatNum(Math.round(qualityProfit))}</b></div>
            </div>
        </div>`;
      }).join('');

    resultBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid var(--border);">
            <h4 style="color:var(--text); font-size: 18px; margin:0;" class="craft-result-title">${getAlbionIconHtml(targetId, 'result-item-icon', ALBION_ITEM_ICON_RENDER_SIZE)}<span>${itemName} <span style="color:var(--text-dim); font-size:14px; margin-left:8px; font-family:'JetBrains Mono';">(T${tier}.${enchant})</span></span></h4>
            <div style="font-size:13px; color:var(--text-mid); background:rgba(0,0,0,0.3); padding:6px 12px; border-radius:8px; border:1px solid var(--border);">
                ${getTranslatedText('Market')}: <b style="color:var(--accent)">${bestSellCity}</b>
            </div>
        </div>

        <div class="craft-quantity-summary" style="display:grid; grid-template-columns: ${isConsumable ? 'repeat(4, minmax(0, 1fr))' : 'minmax(180px, 260px)'}; gap:14px; margin-bottom:24px; width:100%; max-width:100%;">
            <div class="craft-quantity-input-card" style="padding:16px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:10px; width:auto; min-width:0; display:flex; flex-direction:column; justify-content:center;">
                <span class="craft-quantity-label" style="font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600; display:block; margin-bottom:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${getTranslatedText('Craft Count')}">${getTranslatedText('Craft Count')}</span>
                <input type="number" id="craftQuantity" class="modern-input craft-quantity-input" value="${currentQty}" min="1" step="1" oninput="saveSelectedCraftQuantity(); renderCraftTopProfitPanel();" onchange="saveSelectedCraftQuantity(); analyzeSingleItem(); renderCraftTopProfitPanel();" style="width:100%; padding:8px 10px; font-size:18px; font-weight:bold; color:var(--accent);">
            </div>
            ${isConsumable ? `
            <div class="craft-quantity-output-card" style="padding:16px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:10px; width:auto; min-width:0; display:flex; flex-direction:column; justify-content:center;">
                <span class="craft-quantity-output-kicker" style="font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600; display:block; margin-bottom:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${getTranslatedText('Produces')}">${getTranslatedText('Produces')}</span>
                <strong style="font-size:24px; color:var(--orange);">${formatNum(currentQty * yieldPerCraft)}</strong>
            </div>
            <div class="craft-focus-card" style="padding:16px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:10px; width:auto; min-width:0; display:flex; flex-direction:column; justify-content:center;">
                <span style="font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600; display:block; margin-bottom:10px; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${getTranslatedText('RRR Output Estimate')}">${getTranslatedText('RRR Output Estimate')}</span>
                <strong style="font-size:24px; color:var(--purple); line-height:1.25;">≈ ${formatNum(rrrLoopItemCount)}</strong>
            </div>
            <div class="craft-focus-card" style="padding:16px; background:rgba(0,0,0,0.2); border:1px solid var(--border); border-radius:10px; width:auto; min-width:0; display:flex; flex-direction:column; justify-content:center;">
                <span style="font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600; display:block; margin-bottom:10px; line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${getTranslatedText('Piece Craft With Focus')}">${getTranslatedText('Piece Craft With Focus')}</span>
                <strong style="font-size:24px; color:var(--green);">${formatNum(focusCraftCapacity)}</strong>
            </div>
            ` : ''}
        </div>
        ${consumableFocusNoteHtml}

        ${isConsumable ? '' : `<div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:16px; margin-bottom:24px;">
            <div style="background:rgba(0,0,0,0.2); padding:16px; border-radius:12px; border:1px solid var(--border);">
                <span style="font-size:11px; color:var(--text-dim); display:block; margin-bottom:8px; text-transform:uppercase; font-weight:700;">${getTranslatedText('Journal Count')}</span>
                <input type="number" id="journalCount" class="modern-input" value="${currentJournalCount}" min="0" step="0.1" onchange="analyzeSingleItem()" style="width:100%; color:var(--blue);">
            </div>
            <div style="background:rgba(0,0,0,0.2); padding:16px; border-radius:12px; border:1px solid var(--border);">
                <span style="font-size:11px; color:var(--text-dim); display:block; margin-bottom:8px; text-transform:uppercase; font-weight:700;">${getTranslatedText('1 Book Profit')}</span>
                <input type="number" id="journalProfit" class="modern-input" value="${currentJournalProfit}" min="0" onchange="analyzeSingleItem()" style="width:100%; color:var(--green);">
            </div>
        </div>`}

        <div style="display:grid; gap:20px; margin-bottom:24px;">
            ${enchant > 0 ? `
            <div style="display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:20px;">
                    <div class="craft-detail-card">
                        <div class="craft-detail-title"><strong style="color:#fbbf24;">🔨 ${getTranslatedText('Required Materials')}</strong></div>
                    ${method1MaterialsHtml}
                </div>
                <div style="display:grid; gap:20px; min-width:0;">
                    ${isConsumable ? '' : `<div class="craft-detail-card" style="padding:20px;">
                        <div style="color:var(--text-dim); font-size:12px; text-transform:uppercase; margin-bottom:12px; font-weight:bold;">1. ${getTranslatedText('Total Cost')} (${currentQty}x)</div>
                        <div style="padding:12px; background:rgba(0,0,0,0.16); border:1px solid var(--border); border-radius:12px; min-width:0;">
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                                ${isConsumable ? '' : `<span style="font-size:14px; color:var(--text); font-weight:700;">${getTranslatedText(craftCostMethodLabel)}</span>`}
                                <b style="color:var(--orange); font-family:'JetBrains Mono'; background:rgba(251, 146, 60, 0.12); border:1px solid rgba(251, 146, 60, 0.28); border-radius:999px; padding:6px 10px; line-height:1;">${formatNum(Math.round(craftCostPerItem * currentQty))}</b>
                            </div>
                        </div>
                    </div>`}
                    <div class="craft-detail-card" style="padding:20px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <div>
                                <div style="font-size:14px; font-weight:700; color:var(--text);">${getTranslatedText('Inter-City Craft Cost Comparison')}</div>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
                            ${cityComparisonHtml}
                        </div>
                    </div>
                </div>
            </div>` : `
            <div style="display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, 1fr); gap:20px;">
                <div class="craft-detail-card">
                <div class="craft-detail-title"><strong style="color:${isConsumable ? 'var(--blue)' : 'var(--accent)'};">🔨 ${getTranslatedText('Required Materials')}</strong></div>
                    ${method1MaterialsHtml}
                </div>
                <div class="craft-detail-card" style="padding:20px;">
                    ${isConsumable ? '' : `
                    <div style="color:var(--text-dim); font-size:12px; text-transform:uppercase; margin-bottom:12px; font-weight:bold;">1. ${getTranslatedText('Total Cost')} (${currentQty}x)</div>
                    <div style="padding:12px; background:rgba(0,0,0,0.16); border:1px solid var(--border); border-radius:12px; min-width:0;">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                            ${isConsumable ? '' : `<span style="font-size:14px; color:var(--text); font-weight:700;">${getTranslatedText(craftCostMethodLabel)}</span>`}
                            <b style="color:var(--orange); font-family:'JetBrains Mono'; background:rgba(251, 146, 60, 0.12); border:1px solid rgba(251, 146, 60, 0.28); border-radius:999px; padding:6px 10px; line-height:1;">${formatNum(Math.round(craftCostPerItem * currentQty))}</b>
                        </div>
                    </div>
                    `}
                    <div style="display:flex; justify-content:space-between; align-items:center; margin:${isConsumable ? '0 0 12px' : '16px 0 12px'};">
                        <div>
                            <div style="font-size:14px; font-weight:700; color:var(--text);">${getTranslatedText('Inter-City Craft Cost Comparison')}</div>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
                        ${cityComparisonHtml}
                    </div>
                </div>
            </div>`}

        </div>

        ${isConsumable ? '' : `<div style="margin-top:24px; padding:20px; background:rgba(0,0,0,0.16); border-radius:12px; border:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-size:14px; font-weight:700; color:var(--text);">${getTranslatedText('Profit Difference by Quality')}</div>
                <div style="font-size:12px; color:var(--text-dim);">${getTranslatedText('Based on crafting cost')}</div>
            </div>
            ${qualityDifferenceHtml
              ? `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
                    ${qualityDifferenceHtml}
                 </div>`
              : `<div style="font-size:13px; color:var(--text-dim); padding:8px 0;">${getTranslatedText('To fill this section, you need to see the selected item quality sales in the market.')}</div>`
            }
        </div>`}

        <div style="margin-top:24px; padding:20px; background:rgba(0,0,0,0.16); border-radius:12px; border:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px; flex-wrap:wrap;">
                    <div>
                        <div style="font-size:14px; font-weight:700; color:var(--text);">${getTranslatedText('City-Based Net Profit Comparison')}</div>
                        <div style="font-size:12px; color:var(--text-dim);">${getTranslatedText('Craft + sell in same city')}</div>
                    </div>
                    ${isConsumable ? '' : `<div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:700; letter-spacing:0.6px;">${getTranslatedText('Quality')}</span>
                        <div class="city-profit-quality-pills">
                            <button type="button" class="city-profit-quality-pill ${selectedCityProfitQuality === 1 ? 'active quality-1' : ''}" onclick="setCityProfitQuality(1)">Normal</button>
                            <button type="button" class="city-profit-quality-pill ${selectedCityProfitQuality === 2 ? 'active quality-2' : ''}" onclick="setCityProfitQuality(2)">Good</button>
                            <button type="button" class="city-profit-quality-pill ${selectedCityProfitQuality === 3 ? 'active quality-3' : ''}" onclick="setCityProfitQuality(3)">Outstanding</button>
                            <button type="button" class="city-profit-quality-pill ${selectedCityProfitQuality === 4 ? 'active quality-4' : ''}" onclick="setCityProfitQuality(4)">Excellent</button>
                        </div>
                    </div>`}
                </div>
            <div style="display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:12px;">
                ${cityProfitHtml}
            </div>
        </div>

        <div style="margin-top:24px; padding:20px; background:rgba(0,0,0,0.16); border-radius:12px; border:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div style="font-size:14px; font-weight:700; color:var(--text);">${getTranslatedText('Material Price Summary')}</div>
                <div style="font-size:12px; color:var(--text-dim);">${getTranslatedText('Raw cross-city difference')}</div>
            </div>
            ${materialPriceSummaryRows
              ? `
              <div style="border:1px solid var(--border); border-radius:12px; background:rgba(0,0,0,0.18); overflow-x:auto; overflow-y:hidden;">
                <table style="width:100%; min-width:700px; table-layout:fixed; border-collapse:collapse; background:transparent; border:none; box-shadow:none;">
                  <thead>
                    <tr>
                      <th style="padding:7px 8px; font-size:12px; width:16%;">${getTranslatedText('Material')}</th>
                      ${craftingCompareCities.map(cityName => `<th style="padding:7px 4px; font-size:10px; line-height:1.1; text-align:center; color:${CITY_COLORS[cityName] || 'var(--text-mid)'}; width:${(84 / craftingCompareCities.length).toFixed(2)}%;">${cityName}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>${materialPriceSummaryRows}</tbody>
                </table>
              </div>`
              : `<div style="font-size:13px; color:var(--text-dim); padding:8px 0;">${getTranslatedText('Material city data is being collected.')}</div>`}
        </div>

        <div style="margin-top:24px; padding:20px; background:rgba(0,0,0,0.16); border-radius:12px; border:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">
                <div>
                    <div style="font-size:14px; font-weight:700; color:var(--text); margin-bottom:6px;">${getTranslatedText('Most Profitable City Route')}</div>
                    <div style="font-size:13px; color:var(--text-dim);">
                        ${bestCraftCityEntry ? `${getTranslatedText('Craft')}: <b style="color:${CITY_COLORS[bestCraftCityEntry.city] || 'var(--text)'};">${bestCraftCityEntry.city}</b>` : getTranslatedText('Craft city pending')}
                        ${bestSellCityEntry ? ` • ${getTranslatedText('Sell')}: <b style="color:${CITY_COLORS[bestSellCityEntry.city] || 'var(--text)'};">${bestSellCityEntry.city}</b>` : ''}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:12px; color:var(--text-dim);">${getTranslatedText('Route net profit')}</div>
                    <div style="font-size:18px; font-weight:900; color:${(bestRouteProfit || 0) >= 0 ? 'var(--green)' : 'var(--red)'}; font-family:'JetBrains Mono';">
                        ${bestRouteProfit != null ? `${bestRouteProfit >= 0 ? '+' : ''}${formatNum(Math.round(bestRouteProfit))}` : '—'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ─── TABLOLAR ────────────────────────────────────────────────────────────────
function calculateCraftCostTable(baseId, enchant, tier) {
  const recipe = recipesMap.get(baseId);
  if (!recipe) return null; 
  const rrr = getEffectiveRrrFromInput('rrrRate') || 0.152;
  const craftingFee = parseFloat(document.getElementById('craftingFee')?.value) || 0;
  let directRawCost = 0;
  let flatRawCost = 0;
  let nonReturnableCost = 0;
  const isConsumable = loadedConsumables && [...(potionsAndFoods.potions || []), ...(potionsAndFoods.foods || [])].some(c => c.uniquename === baseId);

  for (const res of recipe) {
      let baseResName = isConsumable ? res.name : res.name.replace(/^T\d_/, `T${tier}_`);
      let directResName = baseResName;
      if (!isConsumable && enchant > 0 && baseResName.match(/T\d+_(METALBAR|PLANKS|LEATHER|CLOTH)/)) directResName += `_LEVEL${enchant}`;

      let directResPrice = resourcePrices[directResName];
      if (!directResPrice) return null;
      directRawCost += directResPrice * res.count;

      let flatResPrice = resourcePrices[baseResName];
      if (!flatResPrice) return null;
      const flatLineCost = flatResPrice * res.count;
      if (isConsumable && isCraftRrrExcludedMaterial(baseResName)) nonReturnableCost += flatLineCost;
      else flatRawCost += flatLineCost;
  }

  const directCraftCost = directRawCost * (1 - rrr) + craftingFee;
  if (enchant === 0) {
      return isConsumable ? (flatRawCost * (1 - rrr)) + nonReturnableCost + craftingFee : directCraftCost;
  }

  let artifactCost = nonReturnableCost;
  if (isConsumable) {
      const enchantItemName = baseId.includes('POTION') ? `T1_ALCHEMY_EXTRACT_LEVEL${enchant}` : `T1_FISHSAUCE_LEVEL${enchant}`;
      const enchantItemCount = getConsumableEnchantCount(baseId, tier);
      const artifactPrice = resourcePrices[enchantItemName] || 0;
      artifactCost += artifactPrice * enchantItemCount;
      return (flatRawCost * (1 - rrr)) + artifactCost + craftingFee;
  } else {
      const artifactRequirement = getArtifactRequirement(baseId);
      const artifactChain = getArtifactChain(enchant);
      for (let idx = 0; idx < artifactChain.length; idx++) {
          const enchLevel = idx + 1;
          const artifactPrice = getArtifactFallbackPrice(tier, enchLevel);
          artifactCost += artifactPrice * artifactRequirement;
      }
      const flatCraftPlusArtifactsCost = (flatRawCost * (1 - rrr)) + artifactCost + craftingFee;
      return Math.min(directCraftCost, flatCraftPlusArtifactsCost);
  }
}

function getHiddenCraftTopProfitKeys() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CRAFT_TOP_PROFIT_HIDDEN_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch (_) {
    return new Set();
  }
}

function saveHiddenCraftTopProfitKeys(keys) {
  try {
    localStorage.setItem(CRAFT_TOP_PROFIT_HIDDEN_STORAGE_KEY, JSON.stringify([...keys]));
  } catch (_) {}
}

function getCraftTopProfitKey(item) {
  return [
    selectedCraftModeState,
    item?.baseId || '',
    item?.tier || '',
    item?.enchant ?? 0,
    item?.quality || 1
  ].join('|');
}

function getCraftQuantityStorage() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CRAFT_QUANTITY_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveCraftQuantityStorage(data) {
  try {
    localStorage.setItem(CRAFT_QUANTITY_STORAGE_KEY, JSON.stringify(data || {}));
  } catch (_) {}
}

function getCraftQuantityKey(baseId, enchant = 0, mode = selectedCraftModeState) {
  return [mode || '', baseId || '', enchant ?? 0].join('|');
}

function getSavedCraftQuantityForItem(baseId, enchant = 0, mode = selectedCraftModeState) {
  const data = getCraftQuantityStorage();
  const value = parseInt(data[getCraftQuantityKey(baseId, enchant, mode)] || '1', 10);
  return Math.max(1, Number.isFinite(value) ? value : 1);
}

function saveCraftQuantityForItem(baseId, enchant = 0, quantity = 1, mode = selectedCraftModeState) {
  if (!baseId) return;
  const value = Math.max(1, parseInt(quantity || '1', 10) || 1);
  const data = getCraftQuantityStorage();
  data[getCraftQuantityKey(baseId, enchant, mode)] = value;
  saveCraftQuantityStorage(data);
}

function saveSelectedCraftQuantity() {
  craftQuantityManualOverride = true;
  const baseId = document.getElementById('singleItemSelect')?.value || '';
  const enchant = parseInt(document.getElementById('singleEnchant')?.value || '0', 10) || 0;
  const quantity = document.getElementById('craftQuantity')?.value || '1';
  saveCraftQuantityForItem(baseId, enchant, quantity);
}

function syncCraftQuantityFromFocusPool() {
  craftQuantityManualOverride = false;
  analyzeSingleItem();
  renderCraftTopProfitPanel();
}

function restoreSelectedCraftQuantity(defaultValue = 1) {
  const input = document.getElementById('craftQuantity');
  if (!input) return;
  const baseId = document.getElementById('singleItemSelect')?.value || '';
  const enchant = parseInt(document.getElementById('singleEnchant')?.value || '0', 10) || 0;
  input.value = baseId ? getSavedCraftQuantityForItem(baseId, enchant) : defaultValue;
}

function hideCraftTopProfitItem(key) {
  const hidden = getHiddenCraftTopProfitKeys();
  hidden.add(String(key || ''));
  saveHiddenCraftTopProfitKeys(hidden);
  renderCraftTopProfitPanel();
}

function resetHiddenCraftTopProfitItems() {
  saveHiddenCraftTopProfitKeys(new Set());
  renderCraftTopProfitPanel();
}

window.hideCraftTopProfitItem = hideCraftTopProfitItem;
window.resetHiddenCraftTopProfitItems = resetHiddenCraftTopProfitItems;

function getCraftModeConsumableSets() {
  const potionIds = new Set([...(potionsAndFoods.potions || [])].map(c => c.uniquename));
  const foodIds = new Set([...(potionsAndFoods.foods || [])].map(c => c.uniquename));
  return { potionIds, foodIds };
}

function calculateConsumableCraftCostForCity(baseId, enchant, cityName) {
  const recipe = recipesMap.get(baseId);
  if (!recipe || !cityName) return null;
  const craftingFee = parseFloat(document.getElementById('craftingFee')?.value) || 0;
  const cityRrr = getEffectiveRrrForCity('rrrRate', cityName);
  let rawCost = 0;
  let extraCost = 0;
  for (const res of recipe) {
    const price = getCraftMarketPrice(res.name, cityName);
    if (!price) return null;
    const lineCost = price * res.count;
    if (isCraftRrrExcludedMaterial(res.name)) extraCost += lineCost;
    else rawCost += lineCost;
  }
  if (enchant > 0) {
    const enchantItemName = baseId.includes('POTION') ? `T1_ALCHEMY_EXTRACT_LEVEL${enchant}` : `T1_FISHSAUCE_LEVEL${enchant}`;
    const enchantItemCount = getConsumableEnchantCount(baseId, parseInt(String(baseId).match(/^T(\d+)/)?.[1] || '0', 10));
    const enchantPrice = getCraftMarketPrice(enchantItemName, cityName);
    if (!enchantPrice) return null;
    extraCost += enchantPrice * enchantItemCount;
  }
  return (rawCost * (1 - cityRrr)) + extraCost + craftingFee;
}

function buildCraftTopProfitEntries() {
  if (!loadedConsumables || !['potion', 'food'].includes(selectedCraftModeState)) return [];
  const { potionIds, foodIds } = getCraftModeConsumableSets();
  const tax = parseFloat(document.getElementById('marketTax')?.value || '6.5') / 100 || 0.065;
  const totalFocusPool = parseFloat(document.getElementById('craftTotalFocusPool')?.value || '0') || 0;
  const masteryLevel = parseFloat(document.getElementById('craftMasteryLevel')?.value) || 0;
  const itemSpecLevel = parseFloat(document.getElementById('craftItemSpecLevel')?.value) || 0;
  const otherSpecTotal = parseFloat(document.getElementById('craftOtherSpecTotal')?.value) || 0;
  const routeBuyCities = new Set(getCraftingRouteBuyCitiesForCurrentMode());
  const routeSellCities = new Set(getCraftingRouteSellCitiesForCurrentMode());
  const hidden = getHiddenCraftTopProfitKeys();

  return Array.from(itemMap.values())
    .filter(item => {
      if (!item || !item.baseId) return false;
      if (selectedCraftModeState === 'potion' && !potionIds.has(item.baseId)) return false;
      if (selectedCraftModeState === 'food' && !foodIds.has(item.baseId)) return false;
      return recipesMap.has(item.baseId);
    })
    .map(item => {
      const consumable = [...(potionsAndFoods.potions || []), ...(potionsAndFoods.foods || [])]
        .find(c => c.uniquename === item.baseId);
      const yieldPerCraft = consumable?.amountCrafted || 1;
      const totalFocusEfficiency = calculateCraftFocusEfficiency(masteryLevel, itemSpecLevel, otherSpecTotal, item.baseId);
      const focusPerCraft = calculateCraftFocusCost((consumable?.baseFocusCost || 0) * yieldPerCraft, totalFocusEfficiency);
      const manualQuantity = getSavedCraftQuantityForItem(item.baseId, item.enchant, selectedCraftModeState);
      const quantity = totalFocusPool > 0 && focusPerCraft > 0
        ? Math.floor(totalFocusPool / focusPerCraft)
        : manualQuantity;
      if (quantity <= 0) return null;
      const buyEntry = [...routeBuyCities]
        .map(cityName => ({ cityName, cost: calculateConsumableCraftCostForCity(item.baseId, item.enchant, cityName) }))
        .filter(entry => entry.cost != null && Number(entry.cost) > 0)
        .sort((a, b) => Number(a.cost) - Number(b.cost))[0];
      if (!buyEntry) return null;
      const sellEntry = Object.entries(item.citySellPrices || {})
        .filter(([cityName, cityPrice]) => routeSellCities.has(cityName) && Number(cityPrice) > 0)
        .sort((a, b) => Number(b[1]) - Number(a[1]))[0];
      if (!sellEntry) return null;
      const [sellCity, sellPrice] = sellEntry;
      const netSell = Number(sellPrice) * (1 - tax);
      const profitPerCraft = (netSell * yieldPerCraft) - Number(buyEntry.cost);
      const profit = profitPerCraft * quantity;
      const key = getCraftTopProfitKey(item);
      if (hidden.has(key)) return null;
      return {
        key,
        name: item.name,
        tier: item.tier,
        enchant: item.enchant,
        buyCity: buyEntry.cityName,
        sellCity,
        profit,
        profitPerCraft,
        quantity,
        yieldPerCraft
      };
    })
    .filter(Boolean)
    .filter(entry => Number.isFinite(entry.profit))
    .sort((a, b) => b.profit - a.profit);
}

function renderCraftTopProfitPanel() {
  const panel = document.getElementById('craftTopProfitPanel');
  if (!panel) return;
  const isVisibleMode = ['potion', 'food'].includes(selectedCraftModeState);
  if (!isVisibleMode || !licenseEntitlements?.modules?.crafting) {
    panel.style.display = 'none';
    panel.innerHTML = '';
    return;
  }

  const hiddenCount = getHiddenCraftTopProfitKeys().size;
  const entries = buildCraftTopProfitEntries().slice(0, 5);
  panel.style.display = '';
  const rowsHtml = entries.length
    ? entries.map((entry, index) => {
      const profitColor = entry.profit >= 0 ? 'var(--green)' : 'var(--red)';
      const buyColor = CITY_COLORS[entry.buyCity] || 'var(--text-mid)';
      const sellColor = CITY_COLORS[entry.sellCity] || 'var(--text-mid)';
      const escapedKey = String(entry.key).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `
        <div class="craft-top-profit-row">
          <span class="craft-top-profit-rank">${index + 1}</span>
          <div class="craft-top-profit-main">
            <div class="craft-top-profit-name">${entry.name} <span style="color:var(--text-dim);">T${entry.tier}.${entry.enchant}</span></div>
            <div class="craft-top-profit-meta">
              <span style="color:${buyColor};">${entry.buyCity}</span>
              <span>→</span>
              <span style="color:${sellColor};">${entry.sellCity}</span>
              ${entry.quantity > 1 ? `<span>• ${formatNum(entry.quantity)} ${getTranslatedText('Craft Unit')}</span>` : ''}
              ${entry.yieldPerCraft > 1 ? `<span>• ${formatNum(entry.quantity * entry.yieldPerCraft)} ${getTranslatedText('Piece Item')}</span>` : ''}
            </div>
          </div>
          <div class="craft-top-profit-value" style="color:${profitColor};">${entry.profit >= 0 ? '+' : ''}${formatNum(Math.round(entry.profit))}</div>
          <button type="button" class="craft-top-profit-remove" title="${getTranslatedText('Hide from Top 5')}" onclick="hideCraftTopProfitItem('${escapedKey}')">×</button>
        </div>`;
    }).join('')
    : `<div class="craft-top-profit-empty">${getTranslatedText('No profitable product data yet.')}</div>`;

  panel.innerHTML = `
    <div class="craft-top-profit-title">
      <span>${getTranslatedText('Top 5 Profitable Products')}</span>
      ${hiddenCount ? `<button type="button" class="craft-top-profit-reset" onclick="resetHiddenCraftTopProfitItems()">${getTranslatedText('Reset hidden')}</button>` : ''}
    </div>
    ${rowsHtml}
    ${hiddenCount ? `<div style="color:var(--text-dim); font-size:10px; line-height:1.35; margin-top:8px;">${getTranslatedText('Hidden items are ignored only in this Top 5 list.')}</div>` : ''}
  `;
}

function buildFlipperAnalysisRows(tax = 0.065) {
  const policy = getFlipperAccessPolicy();
  return Array.from(flipperItemMap.values()).map(i => {
    let bestBmSell = i.bmSell || null;
    let netSell = null;
    let profit = null;
    let roi = null;
    if (i.buyPrice && bestBmSell) {
      netSell = bestBmSell * (1 - tax);
      profit = netSell - i.buyPrice;
      roi = (profit / i.buyPrice) * 100;
    }
    const buyDepth = i.city ? getOrderDepthSnapshot(i.city, i.rawId, 'offer') : { topPrice: 0, topQty: 0, totalQty: 0 };
    const bmDepth = getOrderDepthSnapshot('Black Market', i.rawId, 'request');
    const executableQty = (buyDepth.topQty > 0 && bmDepth.topQty > 0) ? Math.min(buyDepth.topQty, bmDepth.topQty) : 0;
    const rawEnchantFlip = policy.canViewEnchantDetail ? getFlipperEnchantFlipData({ ...i, effectiveBmSell: bestBmSell }, tax) : null;
    const enchantFlip = rawEnchantFlip
      ? { ...rawEnchantFlip, profit: applyProfitCap(rawEnchantFlip.profit) }
      : null;
    const visibleProfit = applyProfitCap(profit);
    const hasActualEnchantPath = !!(enchantFlip && enchantFlip.sourceEnchant < i.enchant);
    const bestProfit = Math.max(visibleProfit ?? Number.NEGATIVE_INFINITY, enchantFlip?.profit ?? Number.NEGATIVE_INFINITY);
    const visibleRoi = (i.buyPrice && visibleProfit != null) ? ((visibleProfit / i.buyPrice) * 100) : roi;
    return {
      ...i,
      effectiveBmSell: bestBmSell,
      netSell,
      profit: visibleProfit,
      roi: visibleRoi,
      enchantFlip,
      enchantProfit: hasActualEnchantPath ? (enchantFlip?.profit ?? null) : null,
      enchantProfitDiff: hasActualEnchantPath ? (enchantFlip.profit - (visibleProfit || 0)) : null,
      bestProfit: Number.isFinite(bestProfit) ? bestProfit : null,
      buyTopQty: buyDepth.topQty || 0,
      bmTopQty: bmDepth.topQty || 0,
      executableQty
    };
  });
}

function renderCraftTable() {
  renderCraftTopProfitPanel();
  const tbody = document.getElementById('craftTableBody');
  if(!tbody) return;

  const searchEl = document.getElementById('searchInput');
  const search = searchEl ? searchEl.value.toLowerCase().trim() : "";
  const tax = parseFloat(document.getElementById('marketTax').value) / 100 || 0.065;
  const activeTiers = new Set([...document.querySelectorAll('.tier-pill.active')].map(el => parseInt(el.dataset.tier)));
  const enchantChecked = new Set([...document.querySelectorAll('.enchant-pill.active')].map(el => parseInt(el.dataset.enchant)));

  const isPotionMode = selectedCraftModeState === 'potion';
  const isFoodMode = selectedCraftModeState === 'food';
  const isConsumableMode = isPotionMode || isFoodMode || selectedCraftModeState === 'consumable';
  const routeSellCities = new Set(getCraftingRouteSellCitiesForCurrentMode());

  const potionIds = new Set([...(potionsAndFoods.potions || [])].map(c => c.uniquename));
  const foodIds = new Set([...(potionsAndFoods.foods || [])].map(c => c.uniquename));
  const consumableIds = new Set([...potionIds, ...foodIds]);

  const items = Array.from(itemMap.values()).filter(i => {
    if (search && !i.name.toLowerCase().includes(search)) return false;
    if (i.tier >= 4 && !activeTiers.has(i.tier)) return false;
    if (i.tier < 4 && !activeTiers.has(4)) return false;
    if (!enchantChecked.has(i.enchant)) return false;
    if (Object.keys(i.citySellPrices).length === 0) return false; 
    const recipe = recipesMap.get(i.baseId);
    if (!recipe || recipe.length === 0) return false; 
    
    const isItemPotion = potionIds.has(i.baseId);
    const isItemFood = foodIds.has(i.baseId);
    const isItemConsumable = isItemPotion || isItemFood;

    if (selectedCraftModeState === 'equipment' && isItemConsumable) return false;
    if (isPotionMode && !isItemPotion) return false;
    if (isFoodMode && !isItemFood) return false;
    if (selectedCraftModeState === 'consumable' && !isItemConsumable) return false;

    return true;
  });

  if(items.length === 0) { tbody.innerHTML = `<tr class="empty-row"><td colspan="5" style="padding: 40px;">${getTranslatedText('Market data is being collected... Please open the market in-game.')}</td></tr>`; return; }

  const craftData = [];
  items.forEach(i => {
    const cost = calculateCraftCostTable(i.baseId, i.enchant, i.tier);
    if (cost === null) return; 
    let bestCity = '-';
    let bestPrice = 0;
    for (const [cityName, cityPrice] of Object.entries(i.citySellPrices)) {
      if (isConsumableMode && !routeSellCities.has(cityName)) continue;
      if (cityPrice > bestPrice) { bestPrice = cityPrice; bestCity = cityName; }
    }
    const netSellPrice = bestPrice * (1 - tax);
    
    let yieldPerCraft = 1;
    if (loadedConsumables) {
        const consumable = [...(potionsAndFoods.potions || []), ...(potionsAndFoods.foods || [])].find(c => c.uniquename === i.baseId);
        if (consumable) yieldPerCraft = consumable.amountCrafted || 1;
    }
    const profit = (netSellPrice * yieldPerCraft) - cost; 
    craftData.push({ ...i, bestCity, bestPrice, netSellPrice, cost, profit, yieldPerCraft });
  });

  craftData.sort((a, b) => b.profit - a.profit);
  tbody.innerHTML = craftData.slice(0, 50).map(i => {
    const pClass = i.profit > 0 ? 'profit-pos' : 'profit-neg';
    const cityColor = CITY_COLORS[i.bestCity] || 'var(--text-mid)';
    const detailLabel = isConsumableMode ? `T${i.tier}.${i.enchant}` : `T${i.tier}.${i.enchant} (Q${i.quality})`;
    return `<tr>
      <td><b>${i.name}</b> <br><small style="color:var(--text-dim)">${detailLabel}</small></td>
      <td><span class="city-tag" style="border-color:${cityColor}; color:${cityColor}">${i.bestCity}</span></td>
      <td style="font-family:'JetBrains Mono',monospace;">${Math.round(i.cost).toLocaleString()}</td>
      <td style="font-family:'JetBrains Mono',monospace;">${Math.round(i.bestPrice).toLocaleString()} <br><small style="color:var(--text-dim)">(Net: ${Math.round(i.netSellPrice * (i.yieldPerCraft || 1)).toLocaleString()}${i.yieldPerCraft > 1 ? ` / ${i.yieldPerCraft}x` : ''})</small></td>
      <td class="${pClass}" style="font-size:15px;">${i.profit > 0 ? '+' : ''}${Math.round(i.profit).toLocaleString()}</td>
    </tr>`;
  }).join('');
}

function applyFilters() {
  const tbody = document.getElementById('tableBody');
  if(!tbody) return;
  const policy = getFlipperAccessPolicy();
  const searchEl = document.getElementById('searchInput');
  const searchVal = policy.canUseAllFilters && searchEl ? searchEl.value.toLowerCase().trim() : "";
  const city = policy.canUseBasicProfitFilters && typeof customSelectValues !== 'undefined' && customSelectValues['citySelect'] ? customSelectValues['citySelect'] : 'all';
  const maxBuyEl = document.getElementById('maxBuyPrice');
  const minPEl = document.getElementById('minProfit');
  const maxBuyPrice = policy.canUseBasicProfitFilters ? (maxBuyEl ? parseFloat(maxBuyEl.value) : 0) : 0;
  const minP = policy.canUseBasicProfitFilters ? (minPEl ? parseFloat(minPEl.value) : 0) : 0;
  const minEnchantProfitAdvantageEl = document.getElementById('minEnchantProfitAdvantage');
  const minEnchantProfitAdvantage = policy.canUseAllFilters && policy.canViewEnchantDetail ? (minEnchantProfitAdvantageEl ? parseFloat(minEnchantProfitAdvantageEl.value) : 0) : 0;
  const taxEl = document.getElementById('taxRate');
  const tax = policy.canUseAllFilters && taxEl ? (parseFloat(taxEl.value) / 100) : 0.065;
  const activeTiers = policy.canUseAllFilters ? new Set([...document.querySelectorAll('.tier-pill.active')].map(el => parseInt(el.dataset.tier))) : null;
  const enchantChecked = policy.canUseAllFilters ? new Set([...document.querySelectorAll('.enchant-pill.active')].map(el => parseInt(el.dataset.enchant))) : null;

  const all = buildFlipperAnalysisRows(tax);
  applyFlipperLicenseRestrictions();
  if (!policy.canViewEnchantDetail && sortKey === 'enchantProfit') {
    sortKey = 'profit';
    sortDir = -1;
  }

  const filtered = all.filter(i => {
    if (searchVal && !i.name.toLowerCase().includes(searchVal)) return false;
    if (city !== 'all' && i.city && i.city !== city) return false;
    if (maxBuyPrice > 0 && (!i.buyPrice || i.buyPrice > maxBuyPrice)) return false;
    if (policy.maxItemDirectProfit && (i.profit ?? Number.POSITIVE_INFINITY) > policy.maxItemDirectProfit) return false;
    if (activeTiers && !activeTiers.has(i.tier)) return false;
    if (enchantChecked && !enchantChecked.has(i.enchant)) return false;
    const hasData = (i.buyPrice && i.effectiveBmSell) || !!i.enchantFlip;
    if (!hasData) return showIncomplete;
    const directProfit = i.profit ?? Number.NEGATIVE_INFINITY;
    if (minP > 0 && directProfit < minP) return false;
    if (minEnchantProfitAdvantage > 0 && (i.enchantProfitDiff ?? Number.NEGATIVE_INFINITY) < minEnchantProfitAdvantage) return false;
    return true;
  });

  let limited = filtered;
  if (policy.totalVisibleDirectProfitLimit) {
    let runningTotal = 0;
    limited = [...filtered]
      .sort((a, b) => (b.profit ?? Number.NEGATIVE_INFINITY) - (a.profit ?? Number.NEGATIVE_INFINITY))
      .filter(item => {
        const directProfit = Number(item.profit) || 0;
        if (directProfit <= 0) return false;
        if (runningTotal + directProfit > policy.totalVisibleDirectProfitLimit) return false;
        runningTotal += directProfit;
        return true;
      });
  }

  const sorted = limited.sort((a, b) => {
    let va = a[sortKey], vb = b[sortKey];
    if (va == null) va = sortDir === -1 ? -Infinity : Infinity;
    if (vb == null) vb = sortDir === -1 ? -Infinity : Infinity;
    if (typeof va === 'string') return va.localeCompare(vb) * -sortDir;
    return (vb - va) * -sortDir;
  });

  flipperVisibleCount = FLIPPER_INITIAL_RENDER_COUNT;
  lastFilteredFlipperData = sorted;
  renderTable(sorted);
  renderCitySummary(sorted, minP);
  const profitable = sorted.filter(i => (i.bestProfit ?? i.profit ?? 0) > 0);
  const statItems = document.getElementById('statItems');
  if(statItems) statItems.textContent = itemMap.size;
  const statProfitable = document.getElementById('statProfitable');
  if(statProfitable) statProfitable.textContent = profitable.length;
  const statTotalProfit = document.getElementById('statTotalProfit');
  if (statTotalProfit) {
    const totalBestProfit = profitable.reduce((sum, item) => sum + (item.bestProfit || 0), 0);
    statTotalProfit.textContent = totalBestProfit > 0 ? `+${formatNum(Math.round(totalBestProfit))}` : '0';
  }
}

function loadMoreFlipperRows() {
  flipperVisibleCount += FLIPPER_RENDER_STEP;
  renderTable(lastFilteredFlipperData);
}

function loadMoreProfitLogs() {
  totalProfitVisibleCount += TOTAL_PROFIT_RENDER_STEP;
  renderTotalProfitPage();
}

function getFlipperRowSignature(item, rowKey, index) {
  const ageMinutes = Math.floor((Date.now() - item.timestamp) / 60000);
  const enchantProfit = item.enchantFlip?.profit ?? '';
  const sourceBuy = item.enchantFlip?.sourceBuyPrice ?? '';
  const canViewEnchantDetail = licenseEntitlements?.flip?.can_view_enchant_detail ? 1 : 0;
  return [
    currentLanguage,
    canViewEnchantDetail,
    rowKey,
    selectedFlipperRowKey === rowKey ? 1 : 0,
    copiedFlipperRowKeys.has(rowKey) ? 1 : 0,
    recentCopiedFlipperRowKeys.has(rowKey) ? 1 : 0,
    item.buyPrice ?? '',
    item.effectiveBmSell ?? '',
    item.profit ?? '',
    item.executableQty ?? '',
    item.roi ?? '',
    enchantProfit,
    sourceBuy,
    item.city ?? '',
    ageMinutes,
    index < 20 ? 'eager' : 'lazy'
  ].join('|');
}

function buildFlipperRowMarkup(item, index) {
  const policy = getFlipperAccessPolicy();
  const canViewEnchantDetail = !!policy.canViewEnchantDetail;
  const canUseDirectAction = !!policy.canUseDirectAction;
  const rowKey = `${item.rawId}:${item.quality}`;
  if (!selectedFlipperRowKey) selectedFlipperRowKey = rowKey;
  const age = Math.floor((Date.now() - item.timestamp) / 60000);
  const qName = QUALITY_NAMES[item.quality] || 'Normal';
  const cityCol = CITY_COLORS[item.city] || 'var(--text-dim)';
  const ageDisplay = age < 1 ? `<span style="color:var(--green); font-weight:600;">${getTranslatedText('Now')}</span>` : `<span style="color:${age >= 15 ? 'var(--red)' : 'var(--orange)'}">${age}${currentLanguage === 'tr' ? 'dk' : 'm'}</span>`;
  const buyDisplay = item.buyPrice ? formatNum(Math.round(item.buyPrice)) : `<span class="pending">${getTranslatedText('Pending')}</span>`;
  const sellDisplay = item.effectiveBmSell ? formatNum(Math.round(item.effectiveBmSell)) : `<span class="pending">${getTranslatedText('Pending')}</span>`;
  const profitDisplay = item.profit != null ? `<span class="${item.profit > 0 ? 'profit-pos' : 'profit-neg'}">${item.profit > 0 ? '+' : ''}${formatNum(Math.round(item.profit))}</span>` : `<span class="pending">—</span>`;
  const qtyBadge = item.executableQty > 1 ? `<span class="flipper-qty-pill">${formatNum(Math.round(item.executableQty))}x</span>` : '';
  const isReadyBuyPath = !!(item.enchantFlip && item.enchantFlip.sourceEnchant === item.enchant);
  const hasEnchantSourceCopy = !!(item.enchantFlip && item.enchantFlip.sourceEnchant < item.enchant);
  const enchantDisplay = (item.enchantFlip && !isReadyBuyPath)
    ? `
        <div class="${item.enchantFlip.profit > 0 ? 'profit-pos' : 'profit-neg'} flip-main-profit">${item.enchantFlip.profit > 0 ? '+' : ''}${formatNum(Math.round(item.enchantFlip.profit))}</div>
        <div class="flip-subline">${getTranslatedText('Source')}: T${item.tier}.${item.enchantFlip.sourceEnchant} • ${formatNum(Math.round(item.enchantFlip.sourceBuyPrice))}</div>
        <div class="flip-subline flip-subline-muted">${getTranslatedText('Total Cost')}: ${formatNum(Math.round(item.enchantFlip.totalCost || 0))}</div>
      `
    : `<span class="pending">—</span>`;
  const roiDisplay = item.roi != null ? `<b class="${item.profit > 0 ? 'profit-pos' : 'profit-neg'}">%${item.roi.toFixed(1)}</b>` : '<span class="pending">—</span>';
  const isMarked = copiedFlipperRowKeys.has(rowKey);
  const isRecentlyCopied = recentCopiedFlipperRowKeys.has(rowKey);
  const saleMode = flipperSaleModeState[rowKey] || '';
  const rowClasses = [
    selectedFlipperRowKey === rowKey ? 'selected' : '',
    isMarked ? 'marked' : '',
    isRecentlyCopied ? 'recently-copied' : ''
  ].filter(Boolean).join(' ');
  const copiedBadge = isRecentlyCopied ? `<span class="copied-inline-badge">Copied</span>` : '';
  const saleModeButtons = canUseDirectAction ? `
    <span class="flipper-sale-mode-group">
      <button type="button" class="flipper-sale-mode-btn ${saleMode === 'direct' ? 'active-direct' : ''} ${saleMode && saleMode !== 'direct' ? 'disabled' : ''}" onclick="setFlipperSaleMode(event, '${rowKey}', 'direct')">Flip</button>
      ${canViewEnchantDetail ? `<button type="button" class="flipper-sale-mode-btn ${saleMode === 'enchant' ? 'active-enchant' : ''} ${hasEnchantSourceCopy && !saleMode ? '' : (saleMode === 'enchant' ? '' : 'disabled')}" onclick="setFlipperSaleMode(event, '${rowKey}', 'enchant')">Enchant</button>` : ''}
    </span>
  ` : '';
  const rowSig = getFlipperRowSignature(item, rowKey, index);

  return `<tr class="${rowClasses}" data-row-key="${rowKey}" data-row-sig="${rowSig}" onclick="setSelectedFlipperRow('${rowKey}')">
      <td><div class="flipper-item-cell">${getAlbionIconHtml(item.rawId, 'flipper-item-icon', 64, { loading: index < 20 ? 'eager' : 'lazy', fetchPriority: index < 20 ? 'high' : 'auto' })}<div class="flipper-item-meta"><div class="item-name">${item.name}</div><div class="item-sub"><span class="tier-badge tier-${item.tier}">T${item.tier}${item.enchant>0?'.'+item.enchant:''}</span><span>${qName}</span>${qtyBadge}${copiedBadge}${saleModeButtons}</div></div></div></td>
      <td>${item.city ? `<span class="city-tag" style="border-color:${cityCol}; color:${cityCol}">${item.city}</span>` : '—'}</td>
      <td style="font-family:'JetBrains Mono',monospace;">${buyDisplay}</td>
      <td style="font-family:'JetBrains Mono',monospace;">${sellDisplay}</td>
      <td>${profitDisplay}</td>
      <td class="flipper-enchant-col">${canViewEnchantDetail ? enchantDisplay : ''}</td>
      <td>${roiDisplay}</td>
      <td style="font-size:12px; white-space:nowrap;">${ageDisplay}</td>
      <td class="flipper-reset-cell">${canUseDirectAction ? `<button type="button" class="flipper-reset-btn ${saleMode ? '' : 'disabled'}" onclick="resetFlipperSaleMode(event, '${rowKey}')" title="${getTranslatedText('Reset')}">↺</button>` : ''}</td>
    </tr>`;
}

function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  const footer = document.getElementById('flipperLoadMoreWrap');
  if (!tbody) return;
  if (data.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9" style="padding: 40px;">${getTranslatedText('No data to display.')}</td></tr>`;
    if (footer) footer.innerHTML = '';
    return;
  }
  const visibleItems = data.slice(0, flipperVisibleCount);
  preloadFlipperVisibleIcons(visibleItems);

  const currentRows = Array.from(tbody.querySelectorAll('tr'));
  const shouldFullReplace = currentRows.length !== visibleItems.length || currentRows.some((row, index) => row.dataset.rowKey !== `${visibleItems[index].rawId}:${visibleItems[index].quality}`);

  if (shouldFullReplace) {
    tbody.innerHTML = visibleItems.map((item, index) => buildFlipperRowMarkup(item, index)).join('');
  } else {
    visibleItems.forEach((item, index) => {
      const row = currentRows[index];
      const rowKey = `${item.rawId}:${item.quality}`;
      const nextSig = getFlipperRowSignature(item, rowKey, index);
      if (row?.dataset.rowSig !== nextSig) {
        row.outerHTML = buildFlipperRowMarkup(item, index);
      }
    });
  }

  if (footer) {
    if (data.length > visibleItems.length) {
      footer.innerHTML = `<button type="button" class="btn flipper-load-more-btn" onclick="loadMoreFlipperRows()">${getTranslatedText('Load More')} (${visibleItems.length}/${data.length})</button>`;
    } else if (data.length > FLIPPER_INITIAL_RENDER_COUNT) {
      footer.innerHTML = `<div class="flipper-load-more-done">${getTranslatedText('All results loaded')} (${data.length}/${data.length})</div>`;
    } else {
      footer.innerHTML = '';
    }
  }

  renderSelectedEnchantPanel(visibleItems);
}

function renderSelectedEnchantPanel(data) {
  const container = document.getElementById('selectedEnchantDetail');
  if (!container) return;

  const selectedItem = data.find(i => `${i.rawId}:${i.quality}` === selectedFlipperRowKey) || null;
  if (!selectedItem) {
    lastSelectedEnchantSignature = `empty|${currentLanguage}`;
    container.innerHTML = `<div style="text-align:center; color:var(--text-dim); font-size:13px; font-style:italic;">${getTranslatedText('Select an item from the table.')}</div>`;
    return;
  }

  if (!selectedItem.enchantFlip) {
    const nextSig = `no-enchant|${currentLanguage}|${selectedItem.rawId}|${selectedItem.quality}`;
    if (lastSelectedEnchantSignature === nextSig) return;
    lastSelectedEnchantSignature = nextSig;
    container.innerHTML = `
      <div class="selected-enchant-empty">
        <div class="selected-enchant-item">${selectedItem.name}</div>
        <div class="selected-enchant-sub">${getTranslatedText('No enchant path for this row.')}</div>
      </div>
    `;
    return;
  }

  if (!selectedItem.enchantFlip.artifactBreakdown.length) {
    const nextSig = `ready-buy|${currentLanguage}|${selectedItem.rawId}|${selectedItem.quality}|${selectedItem.enchantFlip.sourceEnchant}`;
    if (lastSelectedEnchantSignature === nextSig) return;
    lastSelectedEnchantSignature = nextSig;
    container.innerHTML = `
      <div class="selected-enchant-empty">
        <div class="selected-enchant-item">${selectedItem.name}</div>
        <div class="selected-enchant-sub">${getTranslatedText('Best path: buy ready')} T${selectedItem.tier}.${selectedItem.enchantFlip.sourceEnchant} ${getTranslatedText('item.')}</div>
      </div>
    `;
    return;
  }

  const artifactHtml = selectedItem.enchantFlip.artifactBreakdown.map(part => `
    <div class="selected-enchant-card">
      <div class="selected-enchant-card-title"><span>${part.name}</span></div>
      ${getArtifactIconHtml(part.name, selectedItem.tier, 'selected-enchant-card-icon')}
      <div class="selected-enchant-card-value selected-enchant-card-price" style="margin-top:6px;">${formatNum(Math.round(part.topPrice || part.unitPrice))} <span>(${getTranslatedText('Price')})</span></div>
      <div class="selected-enchant-card-value selected-enchant-card-avg">${formatNum(Math.round(part.unitPrice))} <span>(${getTranslatedText('Avg')})</span></div>
      <div class="selected-enchant-card-sub">${formatNum(Math.round(part.count))} ${getTranslatedText('count')}</div>
      <div class="selected-enchant-card-total">${formatNum(Math.round(part.totalPrice))}</div>
    </div>
  `).join('');

  const totalArtifactCost = selectedItem.enchantFlip.artifactBreakdown.reduce((sum, part) => sum + (part.totalPrice || 0), 0);
  const nextSig = [
    currentLanguage,
    selectedItem.rawId,
    selectedItem.quality,
    selectedItem.enchantFlip.sourceEnchant,
    ...selectedItem.enchantFlip.artifactBreakdown.map(part => `${part.name}:${part.unitPrice}:${part.count}:${part.totalPrice}`)
  ].join('|');
  if (lastSelectedEnchantSignature === nextSig) return;
  lastSelectedEnchantSignature = nextSig;

  container.innerHTML = `
    <div class="selected-enchant-header">
      <div>
        <div class="selected-enchant-item">${selectedItem.name}</div>
        <div class="selected-enchant-sub">${getTranslatedText('Source')}: T${selectedItem.tier}.${selectedItem.enchantFlip.sourceEnchant} • ${getTranslatedText(QUALITY_NAMES[selectedItem.quality] || 'Normal')}</div>
      </div>
      <div class="selected-enchant-header-total">${formatNum(Math.round(totalArtifactCost))}</div>
    </div>
    <div class="selected-enchant-grid">${artifactHtml}</div>
  `;
}

function renderCitySummary(data, minDirectProfit = 0) {
  const flipContainer = document.getElementById('citySummary');
  const enchantContainer = document.getElementById('citySummaryEnchant');
  if (!flipContainer && !enchantContainer) return;

  const flipProfitable = data.filter(i => (i.profit ?? 0) > 0 && (i.profit ?? Number.NEGATIVE_INFINITY) >= minDirectProfit && i.city);
  const enchantProfitable = data.filter(i => (i.bestProfit ?? 0) > 0 && i.city);

  if (flipContainer) {
    if (flipProfitable.length === 0) {
      flipContainer.innerHTML = `<div style="text-align:center; color:var(--text-dim); font-size:13px; font-style:italic;">${getTranslatedText('Waiting for profitable flip data...')}</div>`;
    } else {
      const cityTotals = new Map();
      flipProfitable.forEach(item => {
        const current = cityTotals.get(item.city) || { city: item.city, count: 0, totalProfit: 0 };
        current.count += 1;
        current.totalProfit += item.profit || 0;
        cityTotals.set(item.city, current);
      });

      flipContainer.innerHTML = Array.from(cityTotals.values())
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .slice(0, 3)
        .map(entry => {
          const cityColor = CITY_COLORS[entry.city] || 'var(--text-mid)';
          return `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border);">
            <div>
              <div style="font-size:13px; font-weight:700; color:${cityColor};">${entry.city}</div>
              <div style="font-size:11px; color:var(--text-dim);">${entry.count} ${getTranslatedText('profitable items')}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:13px; font-weight:700; color:var(--green);">+${formatNum(Math.round(entry.totalProfit))}</div>
              <div style="font-size:11px; color:var(--text-dim);">${getTranslatedText('total profit')}</div>
            </div>
          </div>`;
        })
        .join('');
    }
  }

  if (enchantContainer) {
    if (enchantProfitable.length === 0) {
      enchantContainer.innerHTML = `<div style="text-align:center; color:var(--text-dim); font-size:13px; font-style:italic;">${getTranslatedText('Waiting for profitable enchant data...')}</div>`;
    } else {
      const cityTotals = new Map();
      enchantProfitable.forEach(item => {
        const current = cityTotals.get(item.city) || { city: item.city, count: 0, totalProfit: 0 };
        current.count += 1;
        current.totalProfit += item.bestProfit || 0;
        cityTotals.set(item.city, current);
      });

      enchantContainer.innerHTML = Array.from(cityTotals.values())
        .sort((a, b) => b.totalProfit - a.totalProfit)
        .map(entry => {
          const cityColor = CITY_COLORS[entry.city] || 'var(--text-mid)';
          return `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border);">
            <div>
              <div style="font-size:13px; font-weight:700; color:${cityColor};">${entry.city}</div>
              <div style="font-size:11px; color:var(--text-dim);">${entry.count} ${getTranslatedText('profitable items')}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:13px; font-weight:700; color:var(--blue);">+${formatNum(Math.round(entry.totalProfit))}</div>
              <div style="font-size:11px; color:var(--text-dim);">${getTranslatedText('total profit')}</div>
            </div>
          </div>`;
        })
        .join('');
    }
  }
}

function isSameLocalDay(dateA, dateB) {
  return dateA.getFullYear() === dateB.getFullYear()
    && dateA.getMonth() === dateB.getMonth()
    && dateA.getDate() === dateB.getDate();
}

function getStartOfWeek(date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function renderTotalProfitPage() {
  const todayEl = document.getElementById('profitToday');
  const weekEl = document.getElementById('profitWeek');
  const monthEl = document.getElementById('profitMonth');
  const todayIconEl = document.getElementById('profitTodayIcon');
  const weekIconEl = document.getElementById('profitWeekIcon');
  const monthIconEl = document.getElementById('profitMonthIcon');
  const countEl = document.getElementById('profitCount');
  const body = document.getElementById('profitLogBody');
  const footer = document.getElementById('profitLogLoadMoreWrap');
  const modeSummary = document.getElementById('profitModeSummary');
  const topSummary = document.getElementById('profitTopSummary');
  if (!todayEl || !weekEl || !monthEl || !countEl || !body || !footer || !modeSummary || !topSummary) return;

  if (todayIconEl) todayIconEl.src = currentLanguage === 'tr' ? 'icons/bugün-icon.png' : 'icons/today-icon.png';
  if (weekIconEl) weekIconEl.src = currentLanguage === 'tr' ? 'icons/hafta-icon.png' : 'icons/week-icon.png';
  if (monthIconEl) monthIconEl.src = currentLanguage === 'tr' ? 'icons/ay-icon.png' : 'icons/month-iconn.png';

  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const logs = [...flipperProfitLog].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const todayProfit = logs
    .filter(entry => isSameLocalDay(new Date(entry.timestamp), now))
    .reduce((sum, entry) => sum + (Number(entry.profit) || 0), 0);
  const weekProfit = logs
    .filter(entry => new Date(entry.timestamp) >= weekStart)
    .reduce((sum, entry) => sum + (Number(entry.profit) || 0), 0);
  const monthProfit = logs
    .filter(entry => new Date(entry.timestamp) >= monthStart)
    .reduce((sum, entry) => sum + (Number(entry.profit) || 0), 0);

  todayEl.textContent = `${todayProfit >= 0 ? '+' : ''}${formatNum(Math.round(todayProfit))}`;
  todayEl.style.color = todayProfit >= 0 ? 'var(--green)' : 'var(--red)';
  weekEl.textContent = `${weekProfit >= 0 ? '+' : ''}${formatNum(Math.round(weekProfit))}`;
  weekEl.style.color = weekProfit >= 0 ? 'var(--green)' : 'var(--red)';
  monthEl.textContent = `${monthProfit >= 0 ? '+' : ''}${formatNum(Math.round(monthProfit))}`;
  monthEl.style.color = monthProfit >= 0 ? 'var(--green)' : 'var(--red)';
  countEl.textContent = formatNum(logs.length);

  const visibleLogs = logs.slice(0, totalProfitVisibleCount);
  body.innerHTML = logs.length ? visibleLogs.map(entry => `
    <tr>
      <td><b>${entry.itemName}</b><br><small style="color:var(--text-dim)">T${entry.tier}.${entry.enchant}</small></td>
      <td><span class="profit-mode-badge ${entry.mode === 'enchant' ? 'mode-enchant' : 'mode-direct'}">${entry.mode === 'enchant' ? getTranslatedText('Enchant') : getTranslatedText('Flip')}</span></td>
      <td>${entry.city || '—'}</td>
      <td class="${(entry.profit || 0) >= 0 ? 'profit-pos' : 'profit-neg'}">${(entry.profit || 0) >= 0 ? '+' : ''}${formatNum(Math.round(entry.profit || 0))}</td>
      <td style="font-family:'JetBrains Mono',monospace; color:var(--text-dim);">${new Date(entry.timestamp).toLocaleString('tr-TR')}</td>
      <td class="profit-log-action-cell">
        <button class="profit-log-delete-btn" onclick="deleteFlipperProfitLogEntry('${entry.id}')" title="${getTranslatedText('Delete this record')}" aria-label="${getTranslatedText('Delete this record')}">🗑</button>
      </td>
    </tr>
  `).join('') : `<tr class="empty-row"><td colspan="6">${getTranslatedText('No records yet.')}</td></tr>`;

  if (logs.length > visibleLogs.length) {
    footer.innerHTML = `<button type="button" class="btn flipper-load-more-btn" onclick="loadMoreProfitLogs()">${getTranslatedText('Load More')} (${visibleLogs.length}/${logs.length})</button>`;
  } else if (logs.length > TOTAL_PROFIT_INITIAL_RENDER_COUNT) {
    footer.innerHTML = `<div class="flipper-load-more-done">${getTranslatedText('All records loaded')} (${logs.length}/${logs.length})</div>`;
  } else {
    footer.innerHTML = '';
  }

  const directLogs = logs.filter(entry => entry.mode === 'direct');
  const enchantLogs = logs.filter(entry => entry.mode === 'enchant');
  const directProfit = directLogs.reduce((sum, entry) => sum + (Number(entry.profit) || 0), 0);
  const enchantProfit = enchantLogs.reduce((sum, entry) => sum + (Number(entry.profit) || 0), 0);

  modeSummary.innerHTML = `
    <div style="display:grid; gap:12px;">
      <div class="profit-summary-card">
        <div class="profit-summary-label">${getTranslatedText('Flip Total')}</div>
        <div class="profit-summary-value">${directProfit >= 0 ? '+' : ''}${formatNum(Math.round(directProfit))}</div>
        <div class="profit-summary-sub">${formatNum(directLogs.length)} ${getTranslatedText(directLogs.length === 1 ? 'record' : 'records')}</div>
      </div>
      <div class="profit-summary-card">
        <div class="profit-summary-label">${getTranslatedText('Enchant Total')}</div>
        <div class="profit-summary-value">${enchantProfit >= 0 ? '+' : ''}${formatNum(Math.round(enchantProfit))}</div>
        <div class="profit-summary-sub">${formatNum(enchantLogs.length)} ${getTranslatedText(enchantLogs.length === 1 ? 'record' : 'records')}</div>
      </div>
    </div>
  `;

  const topLogs = [...logs].sort((a, b) => (Number(b.profit) || 0) - (Number(a.profit) || 0)).slice(0, 5);
  topSummary.innerHTML = topLogs.length ? topLogs.map((entry, index) => `
    <div class="profit-top-row">
      ${index < 3 ? `<div class="profit-top-rank rank-${index + 1}">${getTranslatedText(`Top ${index + 1}`)}</div>` : `<div class="profit-top-rank profit-top-rank-muted">${getTranslatedText(`Top ${index + 1}`)}</div>`}
      <div class="profit-top-main">
        <div class="profit-top-name">${entry.itemName}</div>
        <div class="profit-top-meta">${entry.mode === 'enchant' ? getTranslatedText('Enchant') : getTranslatedText('Flip')} • ${entry.city || '—'}</div>
      </div>
      <div class="${(entry.profit || 0) >= 0 ? 'profit-pos' : 'profit-neg'}">${(entry.profit || 0) >= 0 ? '+' : ''}${formatNum(Math.round(entry.profit || 0))}</div>
    </div>
  `).join('') : `<div style="text-align:center; color:var(--text-dim); font-size:13px; font-style:italic;">${getTranslatedText('No records yet.')}</div>`;
}

function formatNum(n) { return n.toLocaleString('tr-TR'); }

function getClipboardItemLabel(item) {
  return getClipboardItemLabelWithEnchant(item, item?.enchant || 0);
}

function getClipboardItemLabelWithEnchant(item, enchantLevel = 0) {
  if (!item) return '';
  const cleanedName = String(item.name || '')
    .replace(/^(Journeyman's|Adept's|Expert's|Master's|Grandmaster's|Elder's)\s+/i, '')
    .trim();
  return `${cleanedName} ${item.tier}.${enchantLevel || 0}`.trim();
}

async function writeFlipperLabelToClipboard(rowKey, label, successPrefix = 'Kopyalandi') {
  if (!rowKey || !label) return false;
  try {
    await navigator.clipboard.writeText(label);
    copiedFlipperRowKeys.add(rowKey);
    recentCopiedFlipperRowKeys.add(rowKey);
    if (copiedFlipperBadgeTimers.has(rowKey)) {
      clearTimeout(copiedFlipperBadgeTimers.get(rowKey));
    }
    copiedFlipperBadgeTimers.set(rowKey, setTimeout(() => {
      recentCopiedFlipperRowKeys.delete(rowKey);
      copiedFlipperBadgeTimers.delete(rowKey);
      if (currentPage === 'flipper') updateCurrentView();
    }, 2200));
    updateCurrentView();
    log(`${successPrefix}: ${label}`, 'success');
    return true;
  } catch (_) {
    log('Kopyalama basarisiz oldu.', 'warn');
    return false;
  }
}

async function copyFlipperItemLabel(event, rowKey) {
  if (event) event.stopPropagation();
  if (!getFlipperAccessPolicy().canUseDirectAction) {
    log(getTranslatedText('Locked by membership'), 'warn');
    return;
  }
  if (rowKey) setSelectedFlipperRow(rowKey);
  const item = Array.from(itemMap.values()).find(entry => `${entry.rawId}:${entry.quality}` === rowKey);
  if (!item) return;

  const label = getClipboardItemLabel(item);
  if (!label) return;
  await writeFlipperLabelToClipboard(rowKey, label);
}

async function setFlipperSaleMode(event, rowKey, mode) {
  if (event) event.stopPropagation();
  if (!rowKey) return;
  const policy = getFlipperAccessPolicy();
  if (mode === 'direct' && !policy.canUseDirectAction) {
    log(getTranslatedText('Locked by membership'), 'warn');
    return;
  }
  if (mode === 'enchant' && !policy.canViewEnchantDetail) {
    log(getTranslatedText('Locked by membership'), 'warn');
    return;
  }
  const currentMode = flipperSaleModeState[rowKey] || '';
  if (currentMode) {
    log(getTranslatedText('This row is locked. Use Reset first.'), 'warn');
    return;
  }
  const item = Array.from(flipperItemMap.values()).find(entry => `${entry.rawId}:${entry.quality}` === rowKey);
  if (!item) {
    log(getTranslatedText('Item data could not be found.'), 'warn');
    return;
  }
  const taxInput = document.getElementById('taxRate');
  const tax = taxInput ? (parseFloat(taxInput.value) / 100) : 0.065;
  const bmSell = Number(item.bmSell) || 0;
  const buyPrice = Number(item.buyPrice) || 0;
  let label = '';
  let recordedProfit = 0;
  if (mode === 'direct') {
    label = getClipboardItemLabel(item);
    recordedProfit = (bmSell > 0 && buyPrice > 0) ? ((bmSell * (1 - tax)) - buyPrice) : 0;
  } else if (mode === 'enchant') {
    const enchantFlip = getFlipperEnchantFlipData({ ...item, effectiveBmSell: item.bmSell || null }, tax);
    if (!enchantFlip || enchantFlip.sourceEnchant >= item.enchant) {
      log(getTranslatedText('No valid enchant path for this item.'), 'warn');
      return;
    }
    label = getClipboardItemLabelWithEnchant(item, enchantFlip.sourceEnchant);
    recordedProfit = Number(enchantFlip.profit) || 0;
  }
  if (!label) {
    log(getTranslatedText('Copy label could not be created.'), 'warn');
    return;
  }

  flipperSaleModeState[rowKey] = mode;
  saveFlipperSaleModeState();
  appendFlipperProfitLog({
    id: `${rowKey}:${Date.now()}:${mode}`,
    rowKey,
    mode,
    label,
    itemName: item.name,
    tier: item.tier,
    enchant: item.enchant,
    city: item.city || '',
    profit: recordedProfit,
    timestamp: Date.now()
  });
  await writeFlipperLabelToClipboard(
    rowKey,
    label,
    mode === 'enchant' ? 'Enchant kaynak kopyalandi' : 'Flip kopyalandi'
  );
}

function resetFlipperSaleMode(event, rowKey) {
  if (event) event.stopPropagation();
  if (!rowKey) return;
  delete flipperSaleModeState[rowKey];
  removeLatestFlipperProfitLogByRowKey(rowKey);
  copiedFlipperRowKeys.delete(rowKey);
  recentCopiedFlipperRowKeys.delete(rowKey);
  if (copiedFlipperBadgeTimers.has(rowKey)) {
    clearTimeout(copiedFlipperBadgeTimers.get(rowKey));
    copiedFlipperBadgeTimers.delete(rowKey);
  }
  saveFlipperSaleModeState();
  updateCurrentView();
}

function sortBy(key) {
  if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = -1; }
  ['name','city','effectiveBmSell','profit','enchantProfit','roi'].forEach(k => {
    const el = document.getElementById('arrow-' + k);
    if(el) el.textContent = k === key ? (sortDir === -1 ? '↓' : '↑') : '↕';
    const th = document.querySelector(`th[onclick="sortBy('${k}')"]`);
    if(th) th.classList.toggle('active-sort', k === key);
  });
  updateCurrentView();
}
function toggleShowIncomplete() {
  showIncomplete = !showIncomplete;
  const el = document.getElementById('incompleteToggle');
  if(el) el.classList.toggle('on', showIncomplete);
  applyFilters();
}

function clearData() {
  showClearDataModal();
}

// ─── CUSTOM SELECT FONKSİYONLARI ─────────────────────────────────────────────
function toggleCustomSelect(selectId) {
  document.querySelectorAll('.custom-select.open').forEach(select => {
      if (select.id !== selectId) select.classList.remove('open');
  });

  const select = document.getElementById(selectId);
  if (select) select.classList.toggle('open');
}

function selectOption(selectId, value, displayText) {
  customSelectValues[selectId] = value;
  const select = document.getElementById(selectId);
  if (select) {
    const trigger = select.querySelector('.custom-select-trigger');
    if (trigger) trigger.textContent = displayText;
    select.classList.remove('open');
    select.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
    select.querySelector(`[data-value="${value}"]`).classList.add('selected');
  }
  if (currentPage === 'flipper') applyFilters();
}
