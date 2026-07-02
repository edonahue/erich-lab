'use strict';

(() => {
  const MODE_KEY = 'cloudDataAiCertificationPersonalizedV1';
  const SCORES = [
    { label: 'Quiz 1', correct: 6, total: 10 },
    { label: 'Quiz 2', correct: 20, total: 20 },
    { label: 'Quiz 3', correct: 16, total: 19 },
    { label: 'Quiz 4', correct: 17, total: 20 },
    { label: 'Quiz 5', correct: 8, total: 10 },
    { label: 'Quiz 6', correct: 9, total: 10 },
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const totalCorrect = SCORES.reduce((sum, item) => sum + item.correct, 0);
  const totalQuestions = SCORES.reduce((sum, item) => sum + item.total, 0);
  const recentCorrect = SCORES.slice(1).reduce((sum, item) => sum + item.correct, 0);
  const recentQuestions = SCORES.slice(1).reduce((sum, item) => sum + item.total, 0);
  const aggregate = ((totalCorrect / totalQuestions) * 100).toFixed(1);
  const recentAggregate = ((recentCorrect / recentQuestions) * 100).toFixed(1);

  function addStyles() {
    const style = document.createElement('style');
    style.id = 'personalized-mode-styles';
    style.textContent = `
      .mode-toggle-card{display:flex;justify-content:space-between;gap:18px;align-items:center;margin:18px 0;padding:14px 16px;background:var(--p);border:1px solid var(--l);border-radius:14px;box-shadow:var(--shadow)}
      .mode-toggle-card p{margin:3px 0 0;color:var(--m)}
      .mode-switch{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:7px 12px;border:1px solid var(--l);border-radius:999px;background:var(--ctl);color:var(--i);font-weight:850;cursor:pointer}
      .mode-switch-track{position:relative;width:42px;height:24px;border-radius:999px;background:var(--s);box-shadow:inset 0 0 0 1px var(--l)}
      .mode-switch-track::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:var(--m);transition:transform .18s ease,background .18s ease}
      .mode-switch[aria-checked='true'] .mode-switch-track{background:color-mix(in srgb,var(--a) 28%,var(--s))}
      .mode-switch[aria-checked='true'] .mode-switch-track::after{transform:translateX(18px);background:var(--a)}
      .readiness-card{padding:18px;border:1px solid var(--l);border-radius:14px;background:linear-gradient(145deg,color-mix(in srgb,var(--a) 8%,var(--p)),var(--p));box-shadow:var(--shadow)}
      .readiness-heading{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
      .readiness-heading h3{margin:4px 0;font-size:1.5rem}
      .readiness-badge{display:inline-flex;padding:6px 10px;border-radius:999px;background:color-mix(in srgb,var(--w) 14%,var(--p));color:var(--w);font-weight:900;white-space:nowrap}
      .readiness-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:16px 0}
      .readiness-stat{padding:12px;border-radius:10px;background:var(--s)}
      .readiness-stat strong{display:block;font-size:1.45rem;color:var(--i)}
      .readiness-stat span{font-size:.78rem;color:var(--m)}
      .score-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;align-items:end;margin:18px 0 8px}
      .score-column{display:grid;grid-template-rows:100px auto auto;gap:5px;text-align:center;color:var(--m);font-size:.75rem}
      .score-bar-wrap{height:100px;display:flex;align-items:flex-end;border-radius:8px;background:var(--s);overflow:hidden}
      .score-bar{width:100%;min-height:4px;background:linear-gradient(180deg,var(--a2),var(--a))}
      .score-column b{color:var(--i)}
      .readiness-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}
      .readiness-grid section{padding:14px;border:1px solid var(--l);border-radius:10px;background:var(--p)}
      .readiness-grid h4{margin:0 0 7px}
      .readiness-grid ul,.readiness-grid ol{margin:0;padding-left:20px;color:var(--m)}
      .readiness-grid li{margin:6px 0}
      .compact-readiness{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center}
      .compact-readiness strong{font-size:1.35rem}
      .compact-readiness p{margin:0;color:var(--m)}
      .compact-readiness button{min-height:44px;padding:9px 13px;border:1px solid var(--l);border-radius:8px;background:var(--a);color:#fff;font-weight:800;cursor:pointer}
      .personalized-only{display:none}
      .is-personalized .personalized-only{display:block}
      .is-personalized .general-only{display:none!important}
      .is-personalized #tab-ai,.is-personalized #tab-saa{display:none}
      .is-personalized #roadmapTasks .task-group:not(:first-child){display:none}
      .is-personalized #roadmap table tbody tr:not(:first-child){display:none}
      .is-personalized .personalized-filter-control{display:none!important}
      @media(max-width:800px){.mode-toggle-card,.readiness-heading{align-items:stretch;flex-direction:column}.mode-switch{align-self:flex-start}.readiness-stats{grid-template-columns:1fr 1fr}.readiness-grid{grid-template-columns:1fr}.compact-readiness{grid-template-columns:1fr}.score-strip{gap:5px}.score-column{font-size:.67rem}}
      @media(prefers-reduced-motion:reduce){.mode-switch-track::after{transition:none}}
    `;
    document.head.append(style);
  }

  function markGeneralRoadmapGroups() {
    const article = $('#roadmap .guide');
    if (!article) return;
    ['One coherent sequence', 'Career and project fit', 'Progressive capstone'].forEach((prefix) => {
      const heading = $$('h2', article).find((item) => item.textContent.trim().startsWith(prefix));
      if (!heading) return;
      heading.classList.add('general-only');
      let sibling = heading.nextElementSibling;
      while (sibling && sibling.tagName !== 'H2') {
        sibling.classList.add('general-only');
        sibling = sibling.nextElementSibling;
      }
    });
    $('.settings-grid', article)?.classList.add('general-only');
  }

  function scoreBars() {
    return SCORES.map((item) => {
      const percent = Math.round((item.correct / item.total) * 100);
      return `<div class="score-column" aria-label="${item.label}: ${item.correct} of ${item.total}, ${percent} percent"><div class="score-bar-wrap"><i class="score-bar" style="height:${percent}%"></i></div><b>${percent}%</b><span>${item.correct}/${item.total}</span></div>`;
    }).join('');
  }

  function detailedProfile() {
    return `
      <div class="readiness-heading">
        <div><p class="eyebrow">Personalized SnowPro view</p><h3>Close to ready—validate once more</h3><p>Your results show strong broad retention and repeated success after the first baseline. They do not yet prove even coverage across every COF-C03 domain or full-exam pacing.</p></div>
        <span class="readiness-badge">Conditional go</span>
      </div>
      <div class="readiness-stats">
        <div class="readiness-stat"><strong>90%</strong><span>latest quiz · 9/10</span></div>
        <div class="readiness-stat"><strong>${aggregate}%</strong><span>all quizzes · ${totalCorrect}/${totalQuestions}</span></div>
        <div class="readiness-stat"><strong>${recentAggregate}%</strong><span>after baseline · ${recentCorrect}/${recentQuestions}</span></div>
        <div class="readiness-stat"><strong>6</strong><span>separate quiz sessions</span></div>
      </div>
      <div class="score-strip" role="img" aria-label="Quiz percentages in order: 60, 100, 84, 85, 80, and 90 percent">${scoreBars()}</div>
      <div class="readiness-grid">
        <section><h4>What the trend supports</h4><ul><li>Broad concepts are sticking across repeated sessions.</li><li>The 20/20 and later mid-80s to 90% results suggest scenario handling, not only basic recall.</li><li>The latest 9/10 is a strong short-form result, though ten questions alone have wide uncertainty.</li><li>The initial 6/10 now looks more like a baseline than your current level.</li></ul></section>
        <section><h4>Remaining uncertainty</h4><ul><li>No domain-level results were retained, so a hidden weak domain could be masked by the aggregate.</li><li>Short sets do not test 100-question concentration or the 115-minute pace.</li><li>Exact feature limits, privilege behavior, data-protection edge cases, and wording traps remain the most plausible miss types.</li><li>Representative practice is useful evidence, but it is not an exact replica of the live exam or its scaled scoring.</li></ul></section>
        <section><h4>Focused final review</h4><ul><li>Revisit every missed or uncertain item and write the rule that distinguishes the correct answer.</li><li>Drill role hierarchy and grants, warehouse scaling and caching, loading choices, Time Travel versus Fail-safe, sharing versus replication, and streams/tasks/Dynamic Tables.</li><li>Review the current C03 guide for newer platform and AI Data Cloud topics rather than broadly relearning SQL.</li><li>Practice multiple-select discipline: identify the requested number of choices and reject each distractor explicitly.</li></ul></section>
        <section><h4>Remaining readiness gate</h4><ol><li>Take one fresh 100-question mixed assessment in 115 minutes.</li><li>Aim for at least 80–85% with no domain below 70%.</li><li>If you meet that gate, schedule the exam while the material is fresh.</li><li>If you miss it, spend one focused week only on the two weakest domains, then retest with fresh questions.</li></ol></section>
      </div>
      <div class="callout"><strong>Bottom line:</strong> you appear close to exam-ready and may already be capable of passing, but one fresh full-length timed result is the responsible final check. Do not convert the 85.4% raw practice aggregate directly into Snowflake’s scaled score.</div>
    `;
  }

  function compactProfile() {
    return `<div class="compact-readiness"><strong>SnowPro: close to ready</strong><p>Six representative practice sessions total ${totalCorrect}/${totalQuestions} (${aggregate}%); the five after your first baseline total ${recentCorrect}/${recentQuestions} (${recentAggregate}%).</p><button id="openPersonalized" type="button">Open Personalized view</button></div>`;
  }

  function renderProfile(personalized) {
    const container = $('#personalizedPlan');
    if (!container) return;
    container.className = 'readiness-card';
    container.innerHTML = personalized ? detailedProfile() : compactProfile();
    $('#openPersonalized')?.addEventListener('click', () => applyMode(true));
    const heading = container.previousElementSibling;
    if (heading?.tagName === 'H2') heading.textContent = personalized ? 'Your SnowPro readiness profile' : 'Your evolving study profile';
  }

  function setSelect(selector, value) {
    const select = $(selector);
    if (!select || select.value === value) return;
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function keepAllowedTabVisible() {
    const active = $('.topnav [role="tab"].on');
    if (active && ['ai', 'saa'].includes(active.dataset.v)) $('#tab-roadmap')?.click();
  }

  function applyMode(personalized) {
    document.body.classList.toggle('is-personalized', personalized);
    const toggle = $('#personalizedToggle');
    toggle?.setAttribute('aria-checked', String(personalized));
    try {
      localStorage.setItem(MODE_KEY, personalized ? '1' : '0');
    } catch {}
    renderProfile(personalized);
    if (personalized) {
      keepAllowedTabVisible();
      setSelect('#resourceCert', 'snowpro');
      setSelect('#quizCert', 'snowpro');
      setSelect('#deck', 'snowpro');
    } else {
      setSelect('#resourceCert', 'all');
      setSelect('#quizCert', 'mixed');
      setSelect('#deck', 'mixed');
    }
  }

  function addToggle() {
    const hero = $('.hero');
    if (!hero) return;
    const card = document.createElement('div');
    card.className = 'mode-toggle-card';
    card.innerHTML = `<div><strong>Choose the lab view</strong><p>Personalized mode narrows the lab to your current SnowPro readiness, targeted review, and SnowPro-only resources and practice.</p></div><button id="personalizedToggle" class="mode-switch" type="button" role="switch" aria-checked="false"><span class="mode-switch-track" aria-hidden="true"></span><span>Personalized</span></button>`;
    hero.insertAdjacentElement('afterend', card);
    $('#personalizedToggle').addEventListener('click', () => applyMode(!document.body.classList.contains('is-personalized')));
  }

  function prepareFilters() {
    $('#resourceCert')?.closest('label')?.classList.add('personalized-filter-control');
    $('#quizCert')?.closest('.control')?.classList.add('personalized-filter-control');
    $('#deck')?.closest('.control')?.classList.add('personalized-filter-control');
  }

  addStyles();
  addToggle();
  markGeneralRoadmapGroups();
  prepareFilters();
  const savedMode = (() => {
    try {
      return localStorage.getItem(MODE_KEY) === '1';
    } catch {
      return false;
    }
  })();
  applyMode(savedMode);
})();
