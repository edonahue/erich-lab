'use strict';

(() => {
  const DATA = window.CERT_LAB_DATA;
  const STORAGE_KEY = 'cloudDataAiCertificationLabV1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const BASE_HOURS = { snowpro: 45, ai: 20, saa: 90 };

  function readQuiz() {
    try {
      const root = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return root.quiz || { domains: {} };
    } catch {
      return { domains: {} };
    }
  }

  function render() {
    const container = $('#personalizedPlan');
    if (!container) return;
    const quiz = readQuiz();
    const hoursPerWeek = Number($('#hours')?.value || 7);
    const cards = ['snowpro', 'ai', 'saa'].map((cert) => {
      const entries = Object.entries(quiz.domains || {})
        .filter(([key]) => key.startsWith(`${cert}:`))
        .map(([key, value]) => ({
          domain: key.split(':')[1],
          n: value.n || 0,
          ok: value.ok || 0,
          percent: value.n ? Math.round((value.ok / value.n) * 100) : 0,
        }));
      const answered = entries.reduce((sum, item) => sum + item.n, 0);
      const correct = entries.reduce((sum, item) => sum + item.ok, 0);
      if (!answered) {
        return `<section class="decision"><span class="decision-tag optional">No baseline yet</span><h3>${DATA.certs[cert].label}</h3><p>Use the warm-up quiz to reveal initial concept gaps. The default estimate remains ${BASE_HOURS[cert]} focused hours.</p><button type="button" class="profile-quiz" data-cert="${cert}">Start ${DATA.certs[cert].short} questions</button></section>`;
      }
      const accuracy = Math.round((correct / answered) * 100);
      const factor = accuracy >= 85 ? 0.7 : accuracy >= 75 ? 0.85 : accuracy >= 60 ? 1 : 1.2;
      const adjusted = Math.max(5, Math.round(BASE_HOURS[cert] * factor));
      const weeks = Math.max(DATA.certs[cert].weeks.length, Math.ceil(adjusted / hoursPerWeek));
      const weak = entries
        .filter((item) => item.percent < 70)
        .sort((a, b) => a.percent - b.percent)
        .slice(0, 3);
      const picks = DATA.resources.filter((resource) => resource.cert === cert && resource.priority).slice(0, 2);
      return `<section class="decision"><span class="decision-tag ${accuracy >= 75 ? 'selected' : 'leading'}">${accuracy}% over ${answered} answers</span><h3>${DATA.certs[cert].label}</h3><p><strong>Working estimate: ${adjusted} hours · about ${weeks} weeks</strong> at the current pace.</p><p>${weak.length ? `Review first: ${weak.map((item) => `${item.domain} (${item.percent}%)`).join(' · ')}` : 'No sampled domain is below 70%; preserve breadth and increase scenario difficulty.'}</p><p class="small">Core resources: ${picks.map((item) => `<a href="${item.url}" target="_blank" rel="noopener">${item.title}</a>`).join(' · ')}</p><button type="button" class="profile-quiz" data-cert="${cert}">Run another set</button></section>`;
    });
    container.innerHTML = `<div class="personal-grid">${cards.join('')}</div><p class="small">This profile uses only original questions answered inside this lab. Treat it as a study-priority signal, not a pass prediction; current external mocks remain the booking gate.</p>`;
    $$('.profile-quiz', container).forEach((button) =>
      button.addEventListener('click', () => {
        $('#quizCert').value = button.dataset.cert;
        $('#newQuiz').click();
        $('#tab-quiz').click();
      }),
    );
  }

  $('#hours')?.addEventListener('input', render);
  document.addEventListener('click', (event) => {
    if (['checkAnswer', 'resetProgress', 'ioApply'].includes(event.target.id)) window.setTimeout(render, 0);
  });
  render();
})();
