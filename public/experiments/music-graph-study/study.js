'use strict';

const STORAGE_KEY = 'musicGraphStudyV4';
const blankState = () => ({
  n: 0,
  ok: 0,
  cat: {},
  track: { concept: { n: 0, ok: 0 }, build: { n: 0, ok: 0 } },
  seen: {},
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return blankState();
    return {
      ...blankState(),
      ...saved,
      cat: saved.cat || {},
      seen: saved.seen || {},
      track: {
        concept: { n: 0, ok: 0, ...(saved.track?.concept || {}) },
        build: { n: 0, ok: 0, ...(saved.track?.build || {}) },
      },
    };
  } catch {
    return blankState();
  }
}

let S = loadState();
let activeQuestions = [];
let questionIndex = 0;
let selectedAnswer = null;
let answered = false;
let cardIndex = 0;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const trackLabel = (track) => track === 'concept' ? 'Technology concept' : 'Build decision';
const rate = (value) => value?.n ? Math.round((100 * value.ok) / value.n) : null;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch {}
  renderStats();
}

function questionsForTrack(track) {
  return track === 'mixed' ? Q : Q.filter((question) => question.t === track);
}

function refreshCategories() {
  const select = $('#cat');
  const previous = select.value;
  const categories = [...new Set(questionsForTrack($('#track').value).map((question) => question.c))].sort();
  select.innerHTML = '<option>All</option>' + categories.map((category) => `<option>${category}</option>`).join('');
  if (categories.includes(previous)) select.value = previous;
}

function weakness(question) {
  const category = S.cat[question.c] || { n: 0, ok: 0 };
  const track = S.track[question.t] || { n: 0, ok: 0 };
  const categoryRate = category.n ? category.ok / category.n : 0;
  const trackRate = track.n ? track.ok / track.n : 0;
  return (categoryRate + trackRate) / 2;
}

function startSession() {
  const track = $('#track').value;
  const category = $('#cat').value;
  const mode = $('#mode').value;

  let questions = questionsForTrack(track)
    .map((question, index) => ({ ...question, bankIndex: Q.indexOf(question), sessionIndex: index }));

  if (category !== 'All') questions = questions.filter((question) => question.c === category);

  if (mode === 'weak') {
    questions.sort((a, b) => weakness(a) - weakness(b) || (S.seen[a.bankIndex] || 0) - (S.seen[b.bankIndex] || 0));
  } else {
    questions.sort((a, b) => (S.seen[a.bankIndex] || 0) - (S.seen[b.bankIndex] || 0) || Math.random() - .5);
  }

  if (mode === 'quick') questions = questions.slice(0, 10);
  activeQuestions = questions;
  questionIndex = 0;
  drawQuestion();
  renderStats();
}

function drawQuestion() {
  const box = $('#qbox');
  if (!activeQuestions.length) {
    box.innerHTML = '<h2>No questions match these filters</h2><p class="small">Choose another track or category.</p>';
    return;
  }

  if (questionIndex >= activeQuestions.length) {
    box.innerHTML = '<h2>Session complete</h2><p class="small">Use the mastery panel to choose the next area to review.</p><div class="actions"><button class="primary" id="again">Start again</button></div>';
    $('#again').addEventListener('click', startSession);
    return;
  }

  const question = activeQuestions[questionIndex];
  selectedAnswer = null;
  answered = false;
  box.innerHTML = `
    <div class="meta"><span>${trackLabel(question.t)} · ${question.c}</span><span>${questionIndex + 1} / ${activeQuestions.length}</span></div>
    <div class="question">${question.q}</div>
    ${question.o.map((option, index) => `<label class="choice" data-n="${index}"><input type="radio" name="answer"> ${option}</label>`).join('')}
    <div class="feedback" id="fb"></div>
    <div class="actions"><button class="primary" id="check">Check</button><button id="next" disabled>Next</button></div>`;

  $$('.choice').forEach((choice) => {
    choice.addEventListener('click', () => {
      if (answered) return;
      selectedAnswer = Number(choice.dataset.n);
      $$('.choice').forEach((item) => item.classList.remove('sel'));
      choice.classList.add('sel');
    });
  });
  $('#check').addEventListener('click', checkAnswer);
  $('#next').addEventListener('click', () => {
    questionIndex += 1;
    drawQuestion();
  });
}

function checkAnswer() {
  if (selectedAnswer === null || answered) return;
  answered = true;
  const question = activeQuestions[questionIndex];
  const correct = selectedAnswer === question.a;

  S.n += 1;
  S.ok += Number(correct);
  S.cat[question.c] ||= { n: 0, ok: 0 };
  S.cat[question.c].n += 1;
  S.cat[question.c].ok += Number(correct);
  S.track[question.t].n += 1;
  S.track[question.t].ok += Number(correct);
  S.seen[question.bankIndex] = (S.seen[question.bankIndex] || 0) + 1;

  $$('.choice').forEach((choice, index) => {
    if (index === question.a) choice.classList.add('good');
    else if (index === selectedAnswer) choice.classList.add('bad');
  });

  const feedback = $('#fb');
  feedback.className = 'feedback show';
  feedback.innerHTML = `<strong>${correct ? 'Correct' : 'Review this one'}</strong><br>${question.w}`;
  $('#next').disabled = false;
  save();
}

function renderStats() {
  $('#n').textContent = S.n;
  $('#acc').textContent = S.n ? `${rate(S)}%` : '—';
  $('#conceptAcc').textContent = S.track.concept.n ? `${rate(S.track.concept)}%` : '—';
  $('#buildAcc').textContent = S.track.build.n ? `${rate(S.track.build)}%` : '—';

  const track = $('#track')?.value || 'mixed';
  const categories = [...new Set(questionsForTrack(track).map((question) => question.c))].sort();
  $('#bars').innerHTML = categories.map((category) => {
    const score = S.cat[category] || { n: 0, ok: 0 };
    const value = rate(score) || 0;
    return `<div class="bar"><span>${category}</span><div class="track"><i style="width:${value}%"></i></div><span>${score.n ? `${value}%` : '—'}</span></div>`;
  }).join('');
}

function selectedCards() {
  const deck = $('#deck').value;
  return deck === 'mixed' ? C : C.filter((card) => card.t === deck);
}

function drawCard() {
  const cards = selectedCards();
  if (!cards.length) return;
  const card = cards[cardIndex % cards.length];
  $('#cardKind').textContent = trackLabel(card.t);
  $('#front').textContent = card.f;
  $('#back').textContent = card.b;
  $('#back').classList.remove('on');
  $('#reveal').textContent = 'Reveal';
  $('#count').textContent = `Card ${(cardIndex % cards.length) + 1} of ${cards.length}`;

  const source = $('#cardSource');
  if (card.s) {
    source.innerHTML = `<a href="${card.s}" target="_blank" rel="noopener">Official reference</a>`;
    source.classList.remove('on');
  } else {
    source.textContent = '';
    source.classList.remove('on');
  }
}

$$('.topnav button').forEach((button) => {
  button.addEventListener('click', () => {
    $$('.topnav button').forEach((item) => item.classList.toggle('on', item === button));
    $$('.view').forEach((view) => view.classList.toggle('on', view.id === button.dataset.v));
    window.scrollTo(0, 0);
  });
});

$('#track').addEventListener('change', () => {
  refreshCategories();
  renderStats();
});
$('#start').addEventListener('click', startSession);
$('#reset').addEventListener('click', () => {
  if (confirm('Reset all saved concept and build-decision progress?')) {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    S = blankState();
    startSession();
  }
});
$('#deck').addEventListener('change', () => { cardIndex = 0; drawCard(); });
$('#reveal').addEventListener('click', () => {
  const answer = $('#back');
  const source = $('#cardSource');
  answer.classList.toggle('on');
  source.classList.toggle('on', answer.classList.contains('on') && Boolean(source.textContent));
  $('#reveal').textContent = answer.classList.contains('on') ? 'Hide' : 'Reveal';
});
$('#nextCard').addEventListener('click', () => { cardIndex += 1; drawCard(); });

refreshCategories();
renderStats();
startSession();
drawCard();
