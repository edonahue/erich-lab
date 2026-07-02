'use strict';

(() => {
  const DATA = window.CERT_LAB_DATA;
  if (!DATA?.resources) return;

  const TRUST_LABELS = {
    official: 'Official',
    vetted: 'Vetted',
    supplemental: 'Supplemental',
    caution: 'Caution',
  };
  const TRUST_ORDER = { official: 0, vetted: 1, supplemental: 2, caution: 3 };
  const $ = (selector, root = document) => root.querySelector(selector);

  function defaultCredibility(resource) {
    if (resource.type === 'official') return 'official';
    if (resource.priority) return 'vetted';
    return 'supplemental';
  }

  DATA.resources.forEach((resource) => {
    resource.credibility ||= defaultCredibility(resource);
    resource.role ||= resource.priority ? 'Primary study resource' : 'Optional supporting resource';
    resource.integrity ||= resource.type === 'practice' ? 'Normal external-material review' : 'Low';
    resource.reviewed ||= '2026-07-02';
  });

  const officialPractice = DATA.resources.find((resource) => resource.title === 'Official SnowPro practice exam');
  if (officialPractice) {
    Object.assign(officialPractice, {
      priority: true,
      credibility: 'official',
      role: 'Final readiness calibration',
      price: 'Current registration price shown by Snowflake',
      integrity: 'Low — first-party material',
      evidence: 'Snowflake states that its practice exams use the same specifications and domain weightings as the corresponding certification exams.',
      reviewed: '2026-07-02',
    });
  }

  const cautionUrl = 'https://skillcertpro.com/product/snowflake-snowpro-core-practice-tests/';
  if (!DATA.resources.some((resource) => resource.url === cautionUrl)) {
    DATA.resources.push({
      cert: 'snowpro',
      type: 'practice',
      cost: 'paid',
      priority: false,
      credibility: 'caution',
      title: 'SkillCertPro SnowPro Core practice tests',
      url: cautionUrl,
      role: 'Not recommended for this study plan; listed for transparency',
      price: 'Sale pricing varies; verify at checkout',
      integrity: 'Unverified source quality',
      evidence:
        'Provider marketing, customer testimonials, mixed accuracy reports, and independent review-platform signals create enough reliability uncertainty to warrant caution.',
      reviewed: '2026-07-02',
      note:
        'A very large, recently updated practice package. Its volume may appeal to learners seeking extensive drilling, but uncertain sourcing and mixed external feedback make it a poor fit for this focused readiness plan.',
    });
  }

  function addStyles() {
    const style = document.createElement('style');
    style.id = 'resource-review-styles';
    style.textContent = `
      .resource-toolbar.resource-toolbar--reviewed{grid-template-columns:repeat(5,minmax(0,1fr))}
      .credibility-legend{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}
      .credibility-legend div{padding:10px;border:1px solid var(--l);border-radius:10px;background:var(--s)}
      .credibility-legend strong{display:block;margin-bottom:3px}
      .credibility-legend span{color:var(--m);font-size:.82rem}
      .trust-badge{font-weight:900}
      .trust-official{color:var(--g)}
      .trust-vetted{color:var(--a)}
      .trust-supplemental{color:var(--m)}
      .trust-caution{color:var(--r)}
      .resource-card--caution{border-color:color-mix(in srgb,var(--r) 55%,var(--l));background:color-mix(in srgb,var(--r) 5%,var(--p))}
      .resource-review{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding-top:10px;border-top:1px solid var(--l)}
      .resource-review div{min-width:0}
      .resource-review b{display:block;color:var(--i);font-size:.72rem;letter-spacing:.05em;text-transform:uppercase}
      .resource-review span{display:block;color:var(--m);font-size:.84rem}
      .resource-evidence{grid-column:1/-1;padding:10px;border-radius:8px;background:var(--s);color:var(--m);font-size:.86rem}
      @media(max-width:900px){.resource-toolbar.resource-toolbar--reviewed{grid-template-columns:1fr 1fr}.credibility-legend{grid-template-columns:1fr 1fr}.resource-review{grid-template-columns:1fr 1fr}}
      @media(max-width:540px){.resource-toolbar.resource-toolbar--reviewed,.credibility-legend,.resource-review{grid-template-columns:1fr}}
    `;
    document.head.append(style);
  }

  function addCredibilityControls() {
    const toolbar = $('.resource-toolbar');
    if (!toolbar || $('#resourceCredibility')) return;
    toolbar.classList.add('resource-toolbar--reviewed');
    const searchLabel = $('#resourceSearch')?.closest('label');
    const label = document.createElement('label');
    label.innerHTML = `Credibility<select id="resourceCredibility"><option value="all">All levels</option><option value="recommended">Recommended only</option><option value="official">Official</option><option value="vetted">Vetted</option><option value="supplemental">Supplemental</option><option value="caution">Caution</option></select>`;
    toolbar.insertBefore(label, searchLabel || null);

    const legend = document.createElement('div');
    legend.className = 'credibility-legend';
    legend.innerHTML = `
      <div><strong class="trust-official">Official</strong><span>First-party exam guides, documentation, or practice.</span></div>
      <div><strong class="trust-vetted">Vetted</strong><span>Third-party material selected as a primary recommendation.</span></div>
      <div><strong class="trust-supplemental">Supplemental</strong><span>Potentially useful, but not readiness-defining.</span></div>
      <div><strong class="trust-caution">Caution</strong><span>Material with source-quality, accuracy, or reputation concerns.</span></div>`;
    toolbar.insertAdjacentElement('afterend', legend);
  }

  function labelForCert(cert) {
    if (cert === 'general') return 'General';
    return DATA.certs[cert]?.short || cert;
  }

  function matchesCredibility(resource, selected) {
    if (selected === 'all') return true;
    if (selected === 'recommended') return ['official', 'vetted'].includes(resource.credibility);
    return resource.credibility === selected;
  }

  function renderResources() {
    const cert = $('#resourceCert')?.value || 'all';
    const type = $('#resourceType')?.value || 'all';
    const cost = $('#resourceCost')?.value || 'all';
    const credibility = $('#resourceCredibility')?.value || 'all';
    const query = ($('#resourceSearch')?.value || '').trim().toLowerCase();
    const matches = DATA.resources
      .filter((resource) => {
        const certOk = cert === 'all' || resource.cert === cert;
        const typeOk = type === 'all' || resource.type === type;
        const costOk = cost === 'all' || resource.cost === cost;
        const credibilityOk = matchesCredibility(resource, credibility);
        const searchText = `${resource.title} ${resource.note} ${resource.role || ''} ${resource.evidence || ''}`.toLowerCase();
        return certOk && typeOk && costOk && credibilityOk && (!query || searchText.includes(query));
      })
      .sort((a, b) => {
        const trustDelta = TRUST_ORDER[a.credibility] - TRUST_ORDER[b.credibility];
        if (trustDelta) return trustDelta;
        if (a.priority !== b.priority) return a.priority ? -1 : 1;
        return a.title.localeCompare(b.title);
      });

    const count = $('#resourceCount');
    if (count) count.textContent = `${matches.length} of ${DATA.resources.length} resources shown`;
    const list = $('#resourceList');
    if (!list) return;
    list.innerHTML = matches
      .map(
        (resource) => `<article class="resource-card resource-card--${resource.credibility}">
          <div>
            <h3>${resource.title}</h3>
            <p>${resource.note}</p>
            <div class="resource-meta">
              <span>${labelForCert(resource.cert)}</span>
              <span>${resource.type}</span>
              <span>${resource.cost}</span>
              <span class="trust-badge trust-${resource.credibility}">${TRUST_LABELS[resource.credibility]}</span>
              ${resource.priority ? '<span class="priority">Core pick</span>' : ''}
            </div>
          </div>
          <a href="${resource.url}" target="_blank" rel="noopener">Open ↗</a>
          <div class="resource-review">
            <div><b>Best role</b><span>${resource.role}</span></div>
            <div><b>Price context</b><span>${resource.price || (resource.cost === 'free' ? 'Free' : 'Check current provider price')}</span></div>
            <div><b>Source-quality review</b><span>${resource.integrity}</span></div>
            <div><b>Last reviewed</b><span>${resource.reviewed}</span></div>
            ${resource.evidence ? `<div class="resource-evidence"><strong>Why this rating:</strong> ${resource.evidence}</div>` : ''}
          </div>
        </article>`,
      )
      .join('');
  }

  function syncPersonalizedDefault() {
    const select = $('#resourceCredibility');
    if (!select) return;
    select.value = document.body.classList.contains('is-personalized') ? 'recommended' : 'all';
    renderResources();
  }

  addStyles();
  addCredibilityControls();
  ['#resourceCert', '#resourceType', '#resourceCost', '#resourceCredibility'].forEach((selector) =>
    $(selector)?.addEventListener('change', renderResources),
  );
  $('#resourceSearch')?.addEventListener('input', renderResources);
  $('#personalizedToggle')?.addEventListener('click', () => window.setTimeout(syncPersonalizedDefault, 0));
  syncPersonalizedDefault();
})();
