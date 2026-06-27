const grid = document.querySelector('#experiment-grid');
const filters = document.querySelector('#filters');
const status = document.querySelector('#catalog-status');
const count = document.querySelector('#experiment-count');

let experiments = [];
let activeFilter = 'All';

function normalizeKind(experiment) {
  return experiment.kind || 'Experiment';
}

function renderFilters() {
  const kinds = ['All', ...new Set(experiments.map(normalizeKind))];
  filters.replaceChildren(...kinds.map((kind) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-button';
    button.textContent = kind;
    button.setAttribute('aria-pressed', String(kind === activeFilter));
    button.addEventListener('click', () => {
      activeFilter = kind;
      renderFilters();
      renderExperiments();
    });
    return button;
  }));
}

function experimentCard(experiment) {
  const article = document.createElement('article');
  article.className = `experiment-card${experiment.featured ? ' featured' : ''}`;

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.innerHTML = `<span>${normalizeKind(experiment)}</span><span>${experiment.status}</span>`;

  const title = document.createElement('h3');
  title.textContent = experiment.title;

  const summary = document.createElement('p');
  summary.textContent = experiment.summary;

  const tags = document.createElement('div');
  tags.className = 'tags';
  for (const technology of experiment.technologies || []) {
    const tag = document.createElement('span');
    tag.textContent = technology;
    tags.append(tag);
  }

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const launch = document.createElement('a');
  launch.className = 'button primary';
  launch.href = experiment.href;
  launch.textContent = 'Launch';
  const source = document.createElement('a');
  source.className = 'text-link';
  source.href = experiment.source;
  source.textContent = 'Source';
  actions.append(launch, source);

  article.append(meta, title, summary, tags, actions);
  return article;
}

function renderExperiments() {
  const visible = experiments.filter((experiment) => activeFilter === 'All' || normalizeKind(experiment) === activeFilter);
  if (!visible.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No experiments match this filter yet.';
    grid.replaceChildren(empty);
  } else {
    grid.replaceChildren(...visible.map(experimentCard));
  }
  status.textContent = `${visible.length} of ${experiments.length} experiments shown.`;
}

async function loadCatalog() {
  try {
    const response = await fetch('/experiments/experiments.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Catalog request returned ${response.status}`);
    const data = await response.json();
    experiments = Array.isArray(data.experiments) ? data.experiments : [];
    if (!experiments.length) throw new Error('Catalog is empty');
    count.textContent = String(experiments.length);
    renderFilters();
    renderExperiments();
  } catch (error) {
    status.textContent = 'The live catalog could not load; the featured experiment remains available above.';
    console.error(error);
  }
}

loadCatalog();
