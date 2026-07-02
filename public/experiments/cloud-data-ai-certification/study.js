'use strict';

(() => {
  const DATA = window.CERT_LAB_DATA;
  const STORAGE_KEY = 'cloudDataAiCertificationLabV1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const shuffle = (items) => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[other]] = [copy[other], copy[index]];
    }
    return copy;
  };

  const blankState = () => ({
    version: 1,
    settings: { hours: 7, startDate: '2026-07-06' },
    tasks: {},
    quiz: { n: 0, ok: 0, domains: {}, seen: {} },
    cards: {},
  });

  const normalizeState = (value) => ({
    ...blankState(),
    ...(value && typeof value === 'object' ? value : {}),
    settings: { ...blankState().settings, ...(value?.settings || {}) },
    tasks: value?.tasks || {},
    quiz: {
      ...blankState().quiz,
      ...(value?.quiz || {}),
      domains: value?.quiz?.domains || {},
      seen: value?.quiz?.seen || {},
    },
    cards: value?.cards || {},
  });

  function loadState() {
    try {
      return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    } catch {
      return blankState();
    }
  }

  let state = loadState();
  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  };

  function activateTab(button) {
    if (!button) return;
    const name = button.dataset.v;
    $$('.topnav [role="tab"]').forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle('on', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    $$('.view').forEach((view) => {
      const active = view.id === name;
      view.classList.toggle('on', active);
      view.hidden = !active;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $$('.topnav [role="tab"]').forEach((tab, index, tabs) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      activateTab(tabs[next]);
      tabs[next].focus();
    });
  });

  function planWeeks(hoursPerWeek) {
    const phases = Object.entries(DATA.certs).map(([key, cert]) => ({
      key,
      label: cert.label,
      weeks: Math.max(cert.weeks.length, Math.ceil(cert.hours / hoursPerWeek)),
    }));
    return { phases, total: phases.reduce((sum, phase) => sum + phase.weeks, 0) };
  }

  function renderSchedule() {
    const hours = Number($('#hours').value);
    const startDate = $('#startDate').value || '2026-07-06';
    state.settings = { hours, startDate };
    save();
    $('#hoursOut').textContent = `${hours} hour${hours === 1 ? '' : 's'}`;
    const schedule = planWeeks(hours);
    $('#totalWeeks').textContent = schedule.total;
    const finish = new Date(`${startDate}T12:00:00`);
    finish.setDate(finish.getDate() + schedule.total * 7 - 1);
    $('#targetDate').textContent = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(finish);
    $('#paceNote').textContent = schedule.phases.map((phase) => `${phase.label}: about ${phase.weeks} weeks`).join(' · ');
  }

  $('#hours').value = String(state.settings.hours);
  $('#startDate').value = state.settings.startDate;
  $('#hours').addEventListener('input', renderSchedule);
  $('#startDate').addEventListener('change', renderSchedule);
  renderSchedule();

  function taskId(certKey, weekIndex, taskIndex) {
    return `${certKey}-${weekIndex + 1}-${taskIndex + 1}`;
  }

  function allTaskEntries() {
    return Object.entries(DATA.certs).flatMap(([certKey, cert]) =>
      cert.weeks.flatMap((week, weekIndex) =>
        week.tasks.map((text, taskIndex) => ({ certKey, cert, week, weekIndex, taskIndex, text, id: taskId(certKey, weekIndex, taskIndex) })),
      ),
    );
  }

  function updateMasterProgress() {
    const tasks = allTaskEntries();
    const completed = tasks.filter((task) => state.tasks[task.id]).length;
    const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    $('#masterBar').style.width = `${percent}%`;
    $('#masterPct').textContent = `${percent}%`;
    $('#masterCount').textContent = `${completed} of ${tasks.length} study actions complete`;
  }

  function renderRoadmapTasks() {
    const container = $('#roadmapTasks');
    container.innerHTML = '';
    Object.entries(DATA.certs).forEach(([certKey, cert]) => {
      const section = document.createElement('section');
      section.className = 'task-group';
      const total = cert.weeks.reduce((sum, week) => sum + week.tasks.length, 0);
      const complete = cert.weeks.reduce((sum, week, weekIndex) => sum + week.tasks.filter((_, taskIndex) => state.tasks[taskId(certKey, weekIndex, taskIndex)]).length, 0);
      section.innerHTML = `<h3>${cert.label} <span class="small">${complete}/${total}</span></h3><div class="task-list"></div>`;
      const list = $('.task-list', section);
      cert.weeks.forEach((week, weekIndex) => {
        week.tasks.forEach((text, taskIndex) => {
          const id = taskId(certKey, weekIndex, taskIndex);
          const label = document.createElement('label');
          label.className = `task-item${state.tasks[id] ? ' done' : ''}`;
          label.innerHTML = `<input type="checkbox" ${state.tasks[id] ? 'checked' : ''} /><span><strong>${week.title}:</strong> ${text}</span>`;
          $('input', label).addEventListener('change', (event) => {
            state.tasks[id] = event.target.checked;
            label.classList.toggle('done', event.target.checked);
            save();
            renderRoadmapTasks();
            updateMasterProgress();
          });
          list.append(label);
        });
      });
      container.append(section);
    });
    updateMasterProgress();
  }

  function renderWeekPlan(certKey, selector) {
    const cert = DATA.certs[certKey];
    const container = $(selector);
    container.innerHTML = cert.weeks.map((week, index) => `<section class="week-card"><div class="week-label">Module ${index + 1}</div><div><h4>${week.title}</h4><p>${week.focus}</p><ul>${week.tasks.map((task) => `<li>${task}</li>`).join('')}</ul></div></section>`).join('');
  }

  renderRoadmapTasks();
  renderWeekPlan('snowpro', '#snowproPlan');
  renderWeekPlan('ai', '#aiPlan');
  renderWeekPlan('saa', '#saaPlan');

  const resourceCert = $('#resourceCert');
  const resourceType = $('#resourceType');
  const resourceCost = $('#resourceCost');
  const resourceSearch = $('#resourceSearch');

  function labelForCert(cert) {
    if (cert === 'general') return 'General';
    return DATA.certs[cert]?.short || cert;
  }

  function renderResources() {
    const query = resourceSearch.value.trim().toLowerCase();
    const matches = DATA.resources.filter((resource) => {
      const certOk = resourceCert.value === 'all' || resource.cert === resourceCert.value;
      const typeOk = resourceType.value === 'all' || resource.type === resourceType.value;
      const costOk = resourceCost.value === 'all' || resource.cost === resourceCost.value;
      const searchOk = !query || `${resource.title} ${resource.note}`.toLowerCase().includes(query);
      return certOk && typeOk && costOk && searchOk;
    });
    $('#resourceCount').textContent = `${matches.length} of ${DATA.resources.length} resources shown`;
    $('#resourceList').innerHTML = matches.map((resource) => `<article class="resource-card"><div><h3>${resource.title}</h3><p>${resource.note}</p><div class="resource-meta"><span>${labelForCert(resource.cert)}</span><span>${resource.type}</span><span>${resource.cost}</span>${resource.priority ? '<span class="priority">Core pick</span>' : ''}</div></div><a href="${resource.url}" target="_blank" rel="noopener">Open ↗</a></article>`).join('');
  }

  [resourceCert, resourceType, resourceCost].forEach((input) => input.addEventListener('change', renderResources));
  resourceSearch.addEventListener('input', renderResources);
  renderResources();

  let activeQuestions = [];
  let questionIndex = 0;
  let selectedAnswer = null;
  let answered = false;

  function questionPool() {
    const cert = $('#quizCert').value;
    const pool = cert === 'mixed' ? DATA.questions : DATA.questions.filter((question) => question.cert === cert);
    const lengthValue = $('#quizLength').value;
    const length = lengthValue === 'all' ? pool.length : Math.min(Number(lengthValue), pool.length);
    return shuffle(pool).slice(0, length);
  }

  function startQuiz() {
    activeQuestions = questionPool();
    questionIndex = 0;
    selectedAnswer = null;
    answered = false;
    drawQuestion();
  }

  function drawQuestion() {
    const box = $('#quizBox');
    if (!activeQuestions.length) {
      box.innerHTML = '<h2>No questions match this selection.</h2>';
      return;
    }
    if (questionIndex >= activeQuestions.length) {
      box.innerHTML = `<h2>Session complete</h2><p>You answered ${activeQuestions.length} questions. Review the mastery panel, then start a fresh set so repeated order does not become a cue.</p><div class="actions"><button class="primary" id="restartDone" type="button">New session</button></div>`;
      $('#restartDone').addEventListener('click', startQuiz);
      return;
    }
    const question = activeQuestions[questionIndex];
    const order = shuffle(question.o.map((_, index) => index));
    selectedAnswer = null;
    answered = false;
    box.innerHTML = `<div class="meta"><span>${labelForCert(question.cert)} · ${question.domain}</span><span>${questionIndex + 1} / ${activeQuestions.length}</span></div><fieldset class="question-set"><legend class="question">${question.q}</legend>${order.map((optionIndex) => `<label class="choice" data-answer="${optionIndex}"><input type="radio" name="answer" value="${optionIndex}" /> ${question.o[optionIndex]}</label>`).join('')}</fieldset><div class="feedback" id="feedback" role="status" aria-live="polite"></div><div class="actions"><button class="primary" id="checkAnswer" type="button">Check</button><button id="nextQuestion" type="button" disabled>Next</button></div>`;
    $$('.choice', box).forEach((choice) => {
      choice.addEventListener('click', () => {
        if (answered) return;
        selectedAnswer = Number(choice.dataset.answer);
        $$('.choice', box).forEach((item) => item.classList.toggle('sel', item === choice));
      });
    });
    $('#checkAnswer', box).addEventListener('click', checkAnswer);
    $('#nextQuestion', box).addEventListener('click', () => { questionIndex += 1; drawQuestion(); });
  }

  function checkAnswer() {
    if (answered || selectedAnswer === null) return;
    answered = true;
    const question = activeQuestions[questionIndex];
    const correct = selectedAnswer === question.a;
    state.quiz.n += 1;
    state.quiz.ok += Number(correct);
    state.quiz.seen[question.id] = (state.quiz.seen[question.id] || 0) + 1;
    const key = `${question.cert}:${question.domain}`;
    state.quiz.domains[key] = state.quiz.domains[key] || { n: 0, ok: 0 };
    state.quiz.domains[key].n += 1;
    state.quiz.domains[key].ok += Number(correct);
    save();
    $$('.choice', $('#quizBox')).forEach((choice) => {
      const optionIndex = Number(choice.dataset.answer);
      $('input', choice).disabled = true;
      if (optionIndex === question.a) choice.classList.add('good');
      else if (optionIndex === selectedAnswer) choice.classList.add('bad');
    });
    const feedback = $('#feedback');
    feedback.classList.add('show');
    feedback.innerHTML = `<strong>${correct ? 'Correct' : 'Review this one'}</strong><br />${question.w}<div class="actions"><button class="reviewLink" type="button">Review ${labelForCert(question.cert)} plan →</button></div>`;
    $('.reviewLink', feedback).addEventListener('click', () => activateTab($(`#tab-${question.cert}`)));
    $('#checkAnswer').disabled = true;
    $('#nextQuestion').disabled = false;
    $('#nextQuestion').focus();
    renderQuizStats();
  }

  function renderQuizStats() {
    $('#answered').textContent = state.quiz.n;
    $('#accuracy').textContent = state.quiz.n ? `${Math.round((state.quiz.ok / state.quiz.n) * 100)}%` : '—';
    const entries = Object.entries(state.quiz.domains).sort(([, a], [, b]) => b.n - a.n);
    $('#domainBars').innerHTML = entries.length ? entries.map(([key, value]) => { const percent = value.n ? Math.round((value.ok / value.n) * 100) : 0; const label = key.split(':')[1]; return `<div class="bar"><span>${label}</span><div class="track"><i style="width:${percent}%"></i></div><strong>${percent}%</strong></div>`; }).join('') : '<p class="small">Answer questions to build a domain profile.</p>';
  }

  $('#newQuiz').addEventListener('click', startQuiz);
  $('#quizCert').addEventListener('change', startQuiz);
  $('#quizLength').addEventListener('change', startQuiz);
  $('#resetProgress').addEventListener('click', () => {
    if (!window.confirm('Reset quiz, flashcard, checklist, and schedule progress for this lab?')) return;
    state = blankState();
    save();
    $('#hours').value = String(state.settings.hours);
    $('#startDate').value = state.settings.startDate;
    renderSchedule();
    renderRoadmapTasks();
    renderQuizStats();
    startQuiz();
    drawCard();
  });

  const ioPanel = $('#ioPanel');
  const ioText = $('#ioText');
  const ioApply = $('#ioApply');
  const ioMsg = $('#ioMsg');
  function openIo(mode) {
    ioPanel.hidden = false;
    ioMsg.textContent = '';
    if (mode === 'export') {
      ioText.value = JSON.stringify(state);
      ioText.readOnly = true;
      ioApply.hidden = true;
      $('#ioLabel').textContent = 'Saved progress — copy this JSON';
      ioText.focus();
      ioText.select();
      navigator.clipboard?.writeText(ioText.value).then(() => (ioMsg.textContent = 'Copied to clipboard.'), () => {});
    } else {
      ioText.value = '';
      ioText.readOnly = false;
      ioApply.hidden = false;
      $('#ioLabel').textContent = 'Paste exported progress, then Apply';
      ioText.focus();
    }
  }
  $('#exportBtn').addEventListener('click', () => openIo('export'));
  $('#importBtn').addEventListener('click', () => openIo('import'));
  $('#ioClose').addEventListener('click', () => (ioPanel.hidden = true));
  ioApply.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(ioText.value.trim());
      if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) throw new Error('shape');
      state = normalizeState(parsed);
      save();
      $('#hours').value = String(state.settings.hours);
      $('#startDate').value = state.settings.startDate;
      renderSchedule();
      renderRoadmapTasks();
      renderQuizStats();
      drawCard();
      ioMsg.textContent = 'Progress imported.';
    } catch {
      ioMsg.textContent = 'That does not look like valid progress from this lab.';
    }
  });

  let currentCard = null;
  let linearIndex = 0;
  function cardPool() {
    const deck = $('#deck').value;
    return deck === 'mixed' ? DATA.cards : DATA.cards.filter((card) => card.cert === deck);
  }
  function chooseCard() {
    const pool = cardPool();
    if (!pool.length) return null;
    const order = $('#cardOrder').value;
    if (order === 'random') return pool[Math.floor(Math.random() * pool.length)];
    if (order === 'linear') { const card = pool[linearIndex % pool.length]; linearIndex += 1; return card; }
    const weighted = pool.flatMap((card) => { const score = state.cards[card.id]?.score || 0; const copies = Math.max(1, 4 - score); return Array.from({ length: copies }, () => card); });
    return weighted[Math.floor(Math.random() * weighted.length)];
  }
  function drawCard() {
    currentCard = chooseCard();
    if (!currentCard) return;
    $('#cardKind').textContent = labelForCert(currentCard.cert);
    $('#cardFront').textContent = currentCard.f;
    $('#cardBack').textContent = currentCard.b;
    $('#cardBack').classList.remove('on');
    $('#cardSource').innerHTML = currentCard.s ? `<a href="${currentCard.s}" target="_blank" rel="noopener">Primary reference ↗</a>` : '';
    $('#cardSource').classList.remove('on');
    $('#reveal').textContent = 'Reveal';
    $('#reveal').setAttribute('aria-expanded', 'false');
  }
  function markCard(delta) {
    if (!currentCard) return;
    const progress = state.cards[currentCard.id] || { score: 0, seen: 0 };
    progress.score = Math.max(0, Math.min(3, progress.score + delta));
    progress.seen += 1;
    state.cards[currentCard.id] = progress;
    save();
    drawCard();
  }
  $('#reveal').addEventListener('click', () => {
    const shown = $('#cardBack').classList.toggle('on');
    $('#cardSource').classList.toggle('on', shown && Boolean(currentCard?.s));
    $('#reveal').textContent = shown ? 'Hide' : 'Reveal';
    $('#reveal').setAttribute('aria-expanded', String(shown));
  });
  $('#again').addEventListener('click', () => markCard(-1));
  $('#known').addEventListener('click', () => markCard(1));
  $('#nextCard').addEventListener('click', drawCard);
  $('#deck').addEventListener('change', () => { linearIndex = 0; drawCard(); });
  $('#cardOrder').addEventListener('change', drawCard);

  renderQuizStats();
  startQuiz();
  drawCard();
})();
