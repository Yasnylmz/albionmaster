async function ensureMembershipMarkup() {
  if (document.getElementById('licenseMembershipOverlay')) return true;
  try {
    const response = await fetch('/views/membership.html', { cache: 'no-store' });
    if (!response.ok) return false;
    const html = await response.text();
    document.body.insertAdjacentHTML('beforeend', html);
    return true;
  } catch (_) {
    return false;
  }
}

function detectBadgeLabel(title) {
  const value = String(title || '').toLowerCase();
  if (value.includes('flip unlimited')) return 'POPULAR';
  return '';
}

function detectCardType(title) {
  const value = String(title || '').toLowerCase();
  if (value.includes('all')) return 'all';
  if (value.includes('flip')) return 'flip';
  if (value.includes('craft')) return 'craft';
  if (value.includes('island')) return 'island';
  return 'all';
}

function detectPlanClass(title) {
  const value = String(title || '').toLowerCase();
  if (value.includes('flip starter')) return 'plan-flip-starter';
  if (value.includes('flip pro')) return 'plan-flip-pro';
  if (value.includes('flip unlimited')) return 'plan-flip-unlimited';
  if (value.includes('craft')) return 'plan-craft-island';
  if (value.includes('all')) return 'plan-all-access';
  return '';
}

function getPlanAccent(type) {
  if (type === 'flip') return '#f59e0b';
  if (type === 'craft') return '#3b82f6';
  if (type === 'island') return '#22c55e';
  return '#a855f7';
}

function renderMembershipModalText() {
  const btnEl = document.getElementById('licenseMembershipBtn');
  const titleEl = document.getElementById('licenseMembershipTitle');
  const gridEl = document.getElementById('pricingGrid');

  if (btnEl) btnEl.textContent = window.t('membershipsBtn');
  if (titleEl) titleEl.textContent = window.t('membershipsTitle');
  if (!gridEl) return;

  const cards = window.t('membershipCards') || [];
  const orderedCards = [
    ...cards.filter((card) => String(card.title || '').toLowerCase().includes('flip')),
    ...cards.filter((card) => !String(card.title || '').toLowerCase().includes('flip')),
  ];

  gridEl.innerHTML = orderedCards.map((card) => {
    const features = String(card.desc || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const badge = detectBadgeLabel(card.title);
    const type = detectCardType(card.title);
    const planClass = detectPlanClass(card.title);

    return `
      <div class="pricing-card ${planClass}" style="--accent:${getPlanAccent(type)}">
        ${badge ? `<span class="popular-badge">${badge}</span>` : ''}
        <h2 class="plan-name">${card.title}</h2>
        <p class="plan-price">${card.price || 'FREE'}</p>
        <span class="plan-period">${card.period || '/package'}</span>
        <ul class="plan-features">
          ${features.map((feature) => `<li>✓ ${feature}</li>`).join('')}
        </ul>
        <button type="button" class="plan-btn">${window.t('membershipCta')}</button>
      </div>
    `;
  }).join('');
}

async function openMembershipModal() {
  await ensureMembershipMarkup();
  renderMembershipModalText();
  const overlay = document.getElementById('licenseMembershipOverlay');
  if (!overlay) return;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeMembershipModal() {
  const overlay = document.getElementById('licenseMembershipOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
}

window.openMembershipModal = openMembershipModal;
window.closeMembershipModal = closeMembershipModal;
window.renderMembershipModalText = renderMembershipModalText;

document.addEventListener('DOMContentLoaded', async () => {
  await ensureMembershipMarkup();
  renderMembershipModalText();
  const membershipOverlay = document.getElementById('licenseMembershipOverlay');
  if (membershipOverlay) {
    membershipOverlay.addEventListener('click', (event) => {
      if (event.target === membershipOverlay) closeMembershipModal();
    });
  }
});
