const LANGUAGE_STORAGE_KEY = 'albionLanguagePreference';
let currentLicenseLanguage = 'tr';

const LICENSE_I18N = {
  tr: {
    panelTitle: 'Lisansını Aktifleştir',
    panelSub: 'Tam erişim için lisans anahtarını gir. Oturumun güvenli şekilde doğrulanır ve cihazına bağlanır.',
    keyLabel: 'Lisans Anahtarı',
    deviceLabel: 'Cihaz ID',
    refreshBtn: '↻ Yenile',
    activateBtn: '✓ Aktifleştir',
    placeholder: 'XXXX-XXXX-XXXX',
    loading: 'Yükleniyor...',
    unknown: 'Bilinmiyor',
    checking: 'Lisans durumu kontrol ediliyor...',
    disabled: 'Lisans sistemi şu an kapalı. Uygulama normal modda çalışıyor.',
    active: 'Lisans aktif.',
    required: 'Lisans gerekli.',
    statusCheckFailed: 'Lisans durumu kontrol edilemedi.',
    enterKey: 'Lütfen lisans anahtarı gir.',
    activating: 'Lisans aktifleştiriliyor...',
    activationFailed: 'Lisans aktifleştirme başarısız.',
    activated: 'Lisans aktifleştirildi.',
    expiresLabel: 'Bitiş',
    successTitle: 'Lisans Aktif Edildi',
    successDesc: 'Lisansın başarıyla tanımlandı. Aşağıdaki tarihe kadar kullanabilirsin.',
    successDescNoDate: 'Lisansın başarıyla tanımlandı.',
    continueBtn: 'Devam Et',
    membershipsBtn: 'Üyelikler',
    membershipsTitle: 'Üyelik Paketleri',
    membershipsSub: 'Paketine göre açılan ekranlar ve Flip görünür kâr limitleri değişir.',
    membershipTier: 'Üyelik Seviyesi',
    membershipCta: 'Özellikler Dahil',
    membershipCards: [
      { title: 'FLIP STARTER', price: '₺20', period: '/haftalık', desc: 'Sadece Flip modülü\nMaksimum görünür kâr: +50.000\nMin kâr ve enchant farkı filtreleri kilitli\nEnchant detay paneli kapalı' },
      { title: 'FLIP PRO', price: '₺45', period: '/haftalık', desc: 'Sadece Flip modülü\nHazır Flip listesi açık\nEnchant Flip sütunu açık\nMaksimum görünür kâr: +150.000\nEnchant detay paneli açık' },
      { title: 'FLIP UNLIMITED', price: '₺75', period: '/haftalık', desc: 'Sadece Flip modülü\nHazır Flip listesi açık\nEnchant Flip sütunu açık\nGörünür kâr limiti yok\nTüm Flip filtreleri düzenlenebilir\nEnchant detay paneli açık' },
      { title: 'CRAFT & ISLAND PACK', price: '₺30', period: '/haftalık', desc: 'Craft Hesaplayıcı açık\nAda Hesaplayıcı açık\nPasture / Kennel ekranları açık\nAda fiyat girişleri açık' },
      { title: 'ALL ACCESS', price: '₺100', period: '/haftalık', desc: 'Flip modülü açık\nCraft modülü açık\nMahsul hesaplayıcı açık\nHayvan hesaplayıcı açık\nFlipte kâr limiti yok\nEnchant detay paneli açık\nToplam Kâr ekranı açık' },
    ],
  },
  en: {
    panelTitle: 'Activate Your License',
    panelSub: 'Enter your key to unlock full access. Your session is validated securely and tied to your device.',
    keyLabel: 'License Key',
    deviceLabel: 'Device ID',
    refreshBtn: '↻ Refresh',
    activateBtn: '✓ Activate',
    placeholder: 'XXXX-XXXX-XXXX',
    loading: 'Loading...',
    unknown: 'Unknown',
    checking: 'Checking license status...',
    disabled: 'License system is currently disabled. Application runs in normal mode.',
    active: 'License active.',
    required: 'License required.',
    statusCheckFailed: 'License status could not be checked.',
    enterKey: 'Please enter a license key.',
    activating: 'Activating license...',
    activationFailed: 'License activation failed.',
    activated: 'License activated.',
    expiresLabel: 'Expires',
    successTitle: 'License Activated',
    successDesc: 'Your license was activated successfully. You can use it until the date below.',
    successDescNoDate: 'Your license was activated successfully.',
    continueBtn: 'Continue',
    membershipsBtn: 'Memberships',
    membershipsTitle: 'Membership Plans',
    membershipsSub: 'Visible modules and Flip profit limits change based on your package.',
    membershipTier: 'Membership Tier',
    membershipCta: 'Included Features',
    membershipCards: [
      { title: 'FLIP STARTER', price: '₺20', period: '/weekly', desc: 'Flip module only\nMax visible profit: +50,000\nMin profit and enchant filters are locked\nEnchant detail panel is hidden' },
      { title: 'FLIP PRO', price: '₺45', period: '/weekly', desc: 'Flip module only\nReady Flip list included\nEnchant Flip column included\nMax visible profit: +150,000\nEnchant detail panel is enabled' },
      { title: 'FLIP UNLIMITED', price: '₺75', period: '/weekly', desc: 'Flip module only\nReady Flip list included\nEnchant Flip column included\nNo visible profit cap\nAll Flip filters are editable\nEnchant detail panel is enabled' },
      { title: 'CRAFT & ISLAND PACK', price: '₺30', period: '/weekly', desc: 'Craft Calculator is enabled\nIsland Calculator is enabled\nPasture / Kennel screens are enabled\nIsland price inputs are enabled' },
      { title: 'ALL ACCESS', price: '₺100', period: '/weekly', desc: 'Flip module is enabled\nCraft module is enabled\nCrop calculator is enabled\nAnimal calculator is enabled\nNo Flip profit cap\nEnchant detail panel is enabled\nTotal Profit screen is included' },
    ],
  },
};
let lastActivationExpiresAt = '';

function t(key) {
  return (LICENSE_I18N[currentLicenseLanguage] && LICENSE_I18N[currentLicenseLanguage][key])
    || LICENSE_I18N.en[key]
    || key;
}

function translateServerMessage(message) {
  if (!message || currentLicenseLanguage === 'en') return message;
  const map = {
    'License verified.': 'Lisans doğrulandı.',
    'License activated.': 'Lisans aktifleştirildi.',
    'License active.': 'Lisans aktif.',
    'No active license.': 'Aktif lisans yok.',
    'License required.': 'Lisans gerekli.',
    'License verification failed.': 'Lisans doğrulama başarısız.',
    'License status could not be checked.': 'Lisans durumu kontrol edilemedi.',
    'License expired.': 'Lisans süresi dolmuş.',
    'License disabled.': 'Lisans devre dışı.',
    'License belongs to another device.': 'Lisans başka bir cihaza bağlı.',
    'License is bound to another device.': 'Lisans başka bir cihaza bağlı.',
    'Invalid license key.': 'Geçersiz lisans anahtarı.',
    'System clock appears to be behind the last verification time. Please correct your date/time settings.': 'Sistem saati son doğrulama zamanından geride görünüyor. Lütfen tarih ve saat ayarlarını düzeltin.',
  };
  return map[message] || message;
}

function formatLicenseDate(rawValue) {
  if (!rawValue) return '-';
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) return rawValue;
  const locale = currentLicenseLanguage === 'tr' ? 'tr-TR' : 'en-GB';
  return parsed.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function renderSuccessPopupText() {
  const titleEl = document.getElementById('licenseSuccessTitle');
  const descEl = document.getElementById('licenseSuccessDesc');
  const expiryEl = document.getElementById('licenseSuccessExpiry');
  const btnEl = document.getElementById('licenseSuccessBtn');

  if (titleEl) titleEl.textContent = t('successTitle');
  if (descEl) descEl.textContent = lastActivationExpiresAt ? t('successDesc') : t('successDescNoDate');
  if (expiryEl) expiryEl.textContent = `${t('expiresLabel')}: ${formatLicenseDate(lastActivationExpiresAt)}`;
  if (btnEl) btnEl.textContent = t('continueBtn');
}

function showLicenseSuccessPopup(expiresAt) {
  lastActivationExpiresAt = expiresAt || '';
  renderSuccessPopupText();
  const overlay = document.getElementById('licenseSuccessOverlay');
  if (overlay) {
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
  }
}

function closeLicenseSuccessPopup() {
  const overlay = document.getElementById('licenseSuccessOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
  }
  window.location.href = `/index.html?licensed=${Date.now()}`;
}

window.closeLicenseSuccessPopup = closeLicenseSuccessPopup;

function applyLicenseLanguage() {
  document.documentElement.lang = currentLicenseLanguage === 'tr' ? 'tr' : 'en';
  const trBtn = document.getElementById('lang-tr');
  const enBtn = document.getElementById('lang-en');
  if (trBtn) trBtn.classList.toggle('active', currentLicenseLanguage === 'tr');
  if (enBtn) enBtn.classList.toggle('active', currentLicenseLanguage === 'en');

  const panelTitle = document.getElementById('licensePanelTitle');
  const panelSub = document.getElementById('licensePanelSub');
  const keyLabel = document.getElementById('licenseKeyLabel');
  const deviceLabel = document.getElementById('licenseDeviceLabel');
  const refreshBtn = document.getElementById('licenseRefreshBtn');
  const activateBtn = document.getElementById('licenseActivateBtn');
  const keyInput = document.getElementById('licenseKeyInput');
  const deviceValue = document.getElementById('licenseDeviceId');

  if (panelTitle) panelTitle.textContent = t('panelTitle');
  if (panelSub) panelSub.textContent = t('panelSub');
  if (keyLabel) keyLabel.textContent = t('keyLabel');
  if (deviceLabel) deviceLabel.textContent = t('deviceLabel');
  if (refreshBtn) refreshBtn.textContent = t('refreshBtn');
  if (activateBtn) activateBtn.textContent = t('activateBtn');
  if (keyInput) keyInput.placeholder = t('placeholder');
  if (deviceValue && (!deviceValue.value || deviceValue.value === 'Loading...' || deviceValue.value === 'Yükleniyor...')) {
    deviceValue.value = t('loading');
  }
  renderSuccessPopupText();
  if (window.renderMembershipModalText) window.renderMembershipModalText();
}

function setLicenseLanguage(lang) {
  currentLicenseLanguage = lang === 'en' ? 'en' : 'tr';
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLicenseLanguage);
  } catch (_) {}
  applyLicenseLanguage();
  refreshLicenseStatus();
}

window.t = t;
Object.defineProperty(window, 'currentLicenseLanguage', {
  get() {
    return currentLicenseLanguage;
  },
});

function initLicenseLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    currentLicenseLanguage = saved === 'en' ? 'en' : 'tr';
  } catch (_) {
    currentLicenseLanguage = 'tr';
  }
  applyLicenseLanguage();
}

function setStatus(message, tone = 'warn') {
  const statusBox = document.getElementById('licenseStatusBox');
  if (!statusBox) return;
  statusBox.classList.remove('ok', 'warn', 'err');
  statusBox.classList.add(tone);
  statusBox.innerHTML = `<span class="license-status-dot"></span><span>${message}</span>`;
}

async function refreshLicenseStatus() {
  const deviceEl = document.getElementById('licenseDeviceId');
  const inputEl = document.getElementById('licenseKeyInput');
  setStatus(t('checking'), 'warn');

  try {
    const response = await fetch('/api/license/status', { cache: 'no-store' });
    const data = await response.json();

    if (deviceEl) deviceEl.value = data.device_id || t('unknown');
    if (inputEl && data.license_key) inputEl.value = data.license_key;

    if (!data.enabled) {
      setStatus(t('disabled'), 'warn');
      return;
    }

    if (data.valid) {
      const expireText = data.expires_at ? ` ${t('expiresLabel')}: ${formatLicenseDate(data.expires_at)}` : '';
      setStatus(`${translateServerMessage(data.message) || t('active')}${expireText}`, 'ok');
      setTimeout(() => {
        window.location.href = `/index.html?licensed=${Date.now()}`;
      }, 600);
      return;
    }

    setStatus(translateServerMessage(data.message) || t('required'), 'err');
  } catch (_) {
    if (deviceEl && (!deviceEl.value || deviceEl.value === t('loading'))) {
      deviceEl.value = t('unknown');
    }
    setStatus(t('statusCheckFailed'), 'err');
  }
}

async function activateLicense() {
  const inputEl = document.getElementById('licenseKeyInput');
  const key = inputEl ? inputEl.value.trim() : '';
  if (!key) {
    setStatus(t('enterKey'), 'warn');
    return;
  }

  setStatus(t('activating'), 'warn');
  try {
    const response = await fetch('/api/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: key }),
    });
    const data = await response.json();
    if (!response.ok || !data.valid) {
      setStatus(translateServerMessage(data.message) || `${t('activationFailed')} (${response.status})`, 'err');
      return;
    }
    setStatus(translateServerMessage(data.message) || t('activated'), 'ok');
    showLicenseSuccessPopup(data.expires_at);
  } catch (_) {
    setStatus(t('activationFailed'), 'err');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initLicenseLanguage();
  refreshLicenseStatus();
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (window.closeMembershipModal) window.closeMembershipModal();
  });
});
