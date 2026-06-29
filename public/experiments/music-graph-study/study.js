'use strict';

(() => {
  const STORAGE_KEY = 'musicGraphStudyV6';
  const LEGACY_STORAGE_KEYS = ['musicGraphStudyV5', 'musicGraphStudyV4'];

  const DISCOGS_QUESTIONS = [
    {
      t: 'concept',
      c: 'Discogs sources',
      q: 'Which Discogs source is the best foundation for a reproducible bulk catalog graph?',
      o: [
        'Monthly CC0 XML data dumps',
        'Repeated collection API calls from every worker',
        'Marketplace screenshots',
        'Album images',
      ],
      a: 0,
      w: 'The monthly XML dumps provide dated, repeatable catalog snapshots without consuming API requests for every record.',
    },
    {
      t: 'concept',
      c: 'Discogs sources',
      q: 'Which dump is normally the largest and most important for credit extraction?',
      o: ['Labels', 'Masters', 'Releases', 'Artists'],
      a: 2,
      w: 'The releases dump carries edition-level metadata, tracklists, and credits and is normally the largest download.',
    },
    {
      t: 'concept',
      c: 'Discogs API',
      q: 'Why should API requests be coordinated through one ingestion service?',
      o: [
        'To give every worker a copy of the account token',
        'To centralize rate control, retries, provenance, and credentials',
        'Because HTTP cannot run on ARM',
        'Because the API returns Parquet',
      ],
      a: 1,
      w: 'A single fetcher can obey rate limits, protect the token, retain raw responses, and keep request history coherent.',
    },
    {
      t: 'concept',
      c: 'Discogs rights',
      q: 'Which item is Restricted Data rather than CC0 catalog data under the Discogs API terms?',
      o: ['Release credits', 'Artist names', 'A user collection', 'Track titles'],
      a: 2,
      w: 'Collections and wantlists are user-associated Restricted Data; release and artist catalog facts are listed as CC0 data.',
    },
    {
      t: 'concept',
      c: 'Discogs rights',
      q: 'What do the current Discogs API terms say about publicly displayed API content?',
      o: [
        'It may be cached indefinitely without a source link',
        'It must not be more than six hours older than Discogs and requires specified notices and links',
        'It must be converted to XML',
        'It may include any user collection',
      ],
      a: 1,
      w: 'The current terms impose a six-hour freshness rule for displayed API content and require Discogs notices and direct links.',
    },
    {
      t: 'concept',
      c: 'Discogs identity',
      q: 'What is an Artist Name Variation (ANV)?',
      o: [
        'A separate person with the same name',
        'The way a Primary Artist Name is printed on a particular release',
        'A master release identifier',
        'An unlinked marketplace seller',
      ],
      a: 1,
      w: 'The PAN is the canonical profile identity; an ANV records a recognizable printed variation tied to that PAN.',
    },
    {
      t: 'concept',
      c: 'Discogs identity',
      q: 'Why should graph identity use Discogs artist IDs rather than matching display names alone?',
      o: [
        'Names are always unique',
        'Numerical suffixes, ANVs, aliases, and unrelated namesakes make text matching unsafe',
        'Artist IDs contain audio',
        'Display names cannot be stored in Parquet',
      ],
      a: 1,
      w: 'Discogs IDs distinguish unrelated namesakes while ANVs and aliases preserve how the same person or group may be credited.',
    },
    {
      t: 'concept',
      c: 'Discogs credits',
      q: 'What can a blank track-position field on a main credit mean?',
      o: [
        'The credit is invalid',
        'The credit applies to all tracks or its exact track scope is unclear',
        'The contributor has no artist ID',
        'The release has no tracklist',
      ],
      a: 1,
      w: 'Discogs guidelines say a blank position can mean all tracks or unclear scope, so normalization must preserve that ambiguity.',
    },
    {
      t: 'concept',
      c: 'Discogs credits',
      q: 'How should a non-linked text credit be treated in the initial playable graph?',
      o: [
        'Discard it from ingestion',
        'Preserve it in normalized evidence but exclude it from playable identity nodes initially',
        'Convert it automatically into a new artist ID',
        'Publish it as collection data',
      ],
      a: 1,
      w: 'Keeping the source text preserves evidence while avoiding unsafe identity merges before a stable linked artist exists.',
    },
    {
      t: 'build',
      c: 'Discogs ingestion',
      q: 'How should Discogs Spinner participate in the first Networked Players ingest?',
      o: [
        'Become a required runtime package',
        'Provide an optional private release-ID seed through an export or adapter',
        'Share its database schema as the graph schema',
        'Move its repository into the lab',
      ],
      a: 1,
      w: 'The projects remain separate: Spinner may bootstrap a private seed, while Networked Players owns its own ingestion contracts.',
    },
    {
      t: 'build',
      c: 'Discogs ingestion',
      q: 'Which first dump set is selected for planning?',
      o: [
        'Releases, artists, and masters; labels deferred',
        'Labels only',
        'All datasets are mandatory before a prototype',
        'No dumps, API only',
      ],
      a: 0,
      w: 'Releases provide credits, artists provide identity, and masters help group editions; labels can wait for a demonstrated need.',
    },
    {
      t: 'build',
      c: 'Discogs ingestion',
      q: 'Where should the Discogs personal access token be available?',
      o: [
        'Inside every Pi image',
        'In the public repository',
        'Only to the centralized ingestion service through local secret injection',
        'In static challenge JSON',
      ],
      a: 2,
      w: 'Workers should process acquired records without receiving the account credential.',
    },
    {
      t: 'build',
      c: 'Discogs ingestion',
      q: 'What should happen immediately after a release-detail API response is fetched?',
      o: [
        'Discard the response after extracting one field',
        'Store the raw response with provenance, then derive credits, tracklist, and metadata from it',
        'Send the token with the response to every worker',
        'Publish it unchanged',
      ],
      a: 1,
      w: 'Raw retention avoids duplicate requests and permits improved normalization without refetching the same source record.',
    },
    {
      t: 'build',
      c: 'Discogs ingestion',
      q: 'What should a worker job receive for normalization?',
      o: [
        'An unrestricted instruction to crawl Discogs',
        'A bounded batch of immutable records plus a snapshot or manifest version',
        'The entire private collection and all credentials',
        'Only album artwork',
      ],
      a: 1,
      w: 'Bounded immutable inputs make jobs repeatable, safe on 1 GB nodes, and independent of external API timing.',
    },
  ];

  const DISCOGS_CARDS = [
    {
      t: 'concept',
      f: 'Discogs monthly dumps',
      b: 'Dated compressed XML exports for releases, artists, labels, and master releases. They are the reproducible bulk catalog source and are published under CC0.',
      s: 'https://discogs-data-dumps.s3.us-west-2.amazonaws.com/index.html',
    },
    {
      t: 'concept',
      f: 'Dump size planning',
      b: 'Releases are the largest download, artists are next, masters are smaller, and labels are usually the smallest. Exact compressed and extracted sizes change monthly and must be checked before each run.',
      s: 'https://discogs-data-dumps.s3.us-west-2.amazonaws.com/index.html',
    },
    {
      t: 'concept',
      f: 'Discogs API role',
      b: 'Use the API for a private seed, targeted gaps, validation, and recent changes—not as an uncoordinated full-catalog crawler.',
      s: 'https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use',
    },
    {
      t: 'concept',
      f: 'CC0 catalog data',
      b: 'Discogs lists release facts, tracklists, credits, artist data, label data, and associated releases as CC0 content.',
      s: 'https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use',
    },
    {
      t: 'concept',
      f: 'Restricted Discogs data',
      b: 'User data such as collection and wantlist membership, marketplace information, pricing, sales history, and many images are restricted rather than general CC0 catalog data.',
      s: 'https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use',
    },
    {
      t: 'concept',
      f: 'API freshness rule',
      b: 'The current API terms say publicly displayed API content may not be more than six hours older than the corresponding Discogs information.',
      s: 'https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use',
    },
    {
      t: 'concept',
      f: 'PAN and ANV',
      b: 'A PAN is the canonical Discogs artist profile name. An ANV records a recognizable variation printed on a specific release while retaining the PAN identity.',
      s: 'https://support.discogs.com/hc/en-us/articles/360005054753-Database-Guidelines-2-Artist',
    },
    {
      t: 'concept',
      f: 'Release and master release',
      b: 'A release is a specific edition and remains the evidence source. A master groups related versions and helps organize or deduplicate editions.',
      s: 'https://support.discogs.com/hc/en-us/articles/17114733929229-Release-Page-Guide',
    },
    {
      t: 'concept',
      f: 'Main and track credits',
      b: 'Discogs credits may be release-wide or attached to individual tracks. Original role text and track scope must survive normalization.',
      s: 'https://support.discogs.com/hc/en-us/articles/360005006834-Database-Guidelines-10-Credits',
    },
    {
      t: 'concept',
      f: 'Non-linked credit',
      b: 'A text credit that does not link to a stable Discogs artist profile. Preserve it as evidence, but do not automatically merge it into a playable identity node.',
      s: 'https://support.discogs.com/hc/en-us/articles/360005006834-Database-Guidelines-10-Credits',
    },
    {
      t: 'build',
      f: 'Spinner bootstrap boundary',
      b: 'Discogs Spinner may export private release IDs for the first seed, but Networked Players remains a separate project with its own importer, schemas, and runtime.',
      s: 'https://github.com/edonahue/networked-players',
    },
    {
      t: 'build',
      f: 'Selected first dumps',
      b: 'Plan for releases, artists, and masters. Defer labels until a product or data-model requirement justifies the additional download and processing.',
    },
    {
      t: 'build',
      f: 'Centralized Discogs fetcher',
      b: 'Only the coordinator-owned ingestion service receives the token and performs outbound requests. Workers process already-acquired immutable batches.',
    },
    {
      t: 'build',
      f: 'Raw-first ingestion',
      b: 'Save the raw source record and its retrieval metadata before normalization so new parsing rules do not require another API request.',
    },
  ];

  const DISCOGS_SECTION = `
    <article class="card guide">
      <h1>Discogs data and project preparation</h1>
      <p class="intro">
        This module turns Discogs from a vague “catalog source” into an explicit acquisition, identity, rights, and
        normalization plan. It prepares the separate
        <a href="https://github.com/edonahue/networked-players" target="_blank" rel="noopener">Networked Players repository</a>
        without making that project depend on this lab or on Discogs Spinner.
      </p>
      <div class="callout">
        <strong>Selected strategy:</strong> use a private release-ID seed, monthly CC0 dumps for the durable bulk graph,
        and a centrally controlled API client only for gaps, validation, and recent changes.
      </div>

      <h2 id="d-sources">1. Choose the source by job</h2>
      <div class="table">
        <table>
          <tr><th>Source</th><th>Best use</th><th>Boundary</th></tr>
          <tr>
            <td>Discogs Spinner export or adapter</td>
            <td>Bootstrap a private list of owned release IDs.</td>
            <td>Optional one-way seed only; no runtime or schema dependency between projects.</td>
          </tr>
          <tr>
            <td>Monthly XML dumps</td>
            <td>Bulk catalog facts, credits, artist identity, and master grouping from one dated snapshot.</td>
            <td>Retain the dump date, checksum, parser version, and source IDs.</td>
          </tr>
          <tr>
            <td>Discogs API</td>
            <td>Private collection access, targeted missing records, validation, and recent changes.</td>
            <td>One credentialed fetcher; obey current rate, freshness, notice, and linking rules.</td>
          </tr>
          <tr>
            <td>Synthetic fixture</td>
            <td>Schema tests, graph correctness, and public examples.</td>
            <td>Small, fictional, deterministic, and safe to commit.</td>
          </tr>
        </table>
      </div>

      <h2 id="d-size">2. Plan for unequal dump sizes</h2>
      <p>
        Discogs publishes four monthly compressed XML datasets. Their exact sizes grow and vary, so the dump index is the
        source of truth before every acquisition. The release file is the dominant storage and processing cost.
      </p>
      <div class="table">
        <table>
          <tr><th>Dump</th><th>Relative planning size</th><th>First-project role</th></tr>
          <tr>
            <td>Releases</td>
            <td>Largest. A dated April 2025 public-tool example reported about 950 MB compressed; extracted workspace is several GB.</td>
            <td>Required: edition metadata, tracklists, main credits, and track credits.</td>
          </tr>
          <tr>
            <td>Artists</td>
            <td>Second largest. The same dated example reported about 320 MB compressed.</td>
            <td>Required: stable source identities, names, aliases, and profile relationships.</td>
          </tr>
          <tr>
            <td>Masters</td>
            <td>Materially smaller than releases, but still a real download and transform.</td>
            <td>Required initially to group related editions without replacing release-level evidence.</td>
          </tr>
          <tr>
            <td>Labels</td>
            <td>Usually the smallest of the four.</td>
            <td>Deferred until label, company, studio, or manufacturing relationships become a product requirement.</td>
          </tr>
        </table>
      </div>
      <div class="callout">
        Size examples are planning signals, not promises. Record the actual object size, free disk, checksum, download
        duration, extracted footprint, and normalized output size for every snapshot.
      </div>

      <h2 id="d-flow">3. Hybrid acquisition flow</h2>
      <div class="flow">
        <div class="node">Private release-ID seed</div>
        <div class="node">Dated dump manifest</div>
        <div class="node">Streaming XML parse</div>
        <div class="node">Raw + normalized records</div>
        <div class="node">Targeted API gap fill</div>
        <div class="node">Versioned graph snapshot</div>
      </div>
      <p>
        The collection identifies a recognizable starting set but does not become a public dataset. The dump supplies the
        bulk catalog graph. API responses are supplementary and must retain their acquisition method because API-derived
        publication has different operational obligations from dump-derived CC0 facts.
      </p>

      <h2 id="d-spinner">4. Bootstrap from Spinner without coupling the projects</h2>
      <p>
        Discogs Spinner already knows how to authenticate, discover the account username, paginate the collection, retry
        requests, and retain active release IDs. The reusable boundary is a tiny export contract—not an import of Spinner's
        package or direct dependence on its evolving SQLite schema.
      </p>
      <div class="exercise">
        <strong>Exercise: read a private seed file</strong>
        <pre>from pathlib import Path

def read_release_ids(path: Path) -&gt; set[int]:
    ids = set()
    for line in path.read_text().splitlines():
        value = line.strip()
        if value and not value.startswith("#"):
            ids.add(int(value))
    return ids</pre>
        The public repository can include this interface and a fictional fixture; the real seed stays local.
      </div>

      <h2 id="d-parse">5. Stream the compressed XML</h2>
      <p>
        Do not decompress an entire release dump into memory or build one enormous Python object tree. Open the gzip stream,
        handle one completed release element, emit durable rows, and clear parsed elements promptly.
      </p>
      <div class="exercise">
        <strong>Exercise: bounded release iteration</strong>
        <pre>import gzip
from lxml import etree

def iter_releases(path):
    with gzip.open(path, "rb") as source:
        context = etree.iterparse(source, events=("end",), tag="release")
        for _, element in context:
            yield element
            element.clear()
            while element.getprevious() is not None:
                del element.getparent()[0]</pre>
        In production, transform and flush bounded batches instead of yielding XML elements across a distributed boundary.
      </div>

      <h2 id="d-api">6. Centralize API access</h2>
      <p>
        Discogs Spinner's direct <code>httpx</code> approach is a useful reference: explicit headers, typed errors,
        pagination, transport retries, HTTP 429 handling, and cancellation. The graph pipeline should strengthen it with a
        persistent raw-response store, a request budget, jittered backoff, and proactive observation of returned rate-limit
        headers.
      </p>
      <div class="exercise">
        <strong>Exercise: inspect rate state without hard-coding a permanent quota</strong>
        <pre>def rate_state(response):
    return {
        "limit": response.headers.get("X-Discogs-Ratelimit"),
        "used": response.headers.get("X-Discogs-Ratelimit-Used"),
        "remaining": response.headers.get("X-Discogs-Ratelimit-Remaining"),
        "retry_after": response.headers.get("Retry-After"),
    }</pre>
        Only the coordinator-owned fetcher receives the token. Pi workers normalize checksummed records already acquired by
        that service.
      </div>

      <h2 id="d-identity">7. Preserve Discogs identity semantics</h2>
      <div class="table">
        <table>
          <tr><th>Discogs concept</th><th>Graph treatment</th></tr>
          <tr>
            <td>Release</td>
            <td>Specific edition and primary evidence node for a credit.</td>
          </tr>
          <tr>
            <td>Master release</td>
            <td>Groups related versions; useful for organization, never a substitute for edition evidence.</td>
          </tr>
          <tr>
            <td>PAN</td>
            <td>Canonical Discogs artist profile identity keyed by source artist ID.</td>
          </tr>
          <tr>
            <td>ANV</td>
            <td>Printed name variation retained on the evidence edge, not a new identity.</td>
          </tr>
          <tr>
            <td>Alias</td>
            <td>Distinct artist identity linked by an alias relationship; do not collapse automatically.</td>
          </tr>
          <tr>
            <td>Numerical suffix</td>
            <td>Discogs display disambiguation for unrelated namesakes; source ID remains authoritative.</td>
          </tr>
        </table>
      </div>

      <h2 id="d-credits">8. Model credits without erasing uncertainty</h2>
      <p>
        Credits may be release-wide or track-specific. Roles can contain bracketed detail, multiple roles, and ambiguous
        scope. A blank track-position field can mean “all tracks” or “scope unclear.” Preserve original source text before
        deriving a normalized role family.
      </p>
      <div class="table">
        <table>
          <tr><th>Field to preserve</th><th>Why</th></tr>
          <tr><td>Release ID and optional master ID</td><td>Reconstructs the edition-level evidence and grouping.</td></tr>
          <tr><td>Artist ID, PAN, and credited display name</td><td>Separates stable identity from printed presentation.</td></tr>
          <tr><td>Original role text</td><td>Prevents a later taxonomy from destroying source meaning.</td></tr>
          <tr><td>Normalized role family and bracket detail</td><td>Supports game rules and analysis while retaining nuance.</td></tr>
          <tr><td>Main or track-credit location</td><td>Preserves where the source expressed the credit.</td></tr>
          <tr><td>Track positions and scope status</td><td>Distinguishes specific, release-wide, and ambiguous coverage.</td></tr>
          <tr><td>Linked or non-linked status</td><td>Prevents text-only names from becoming unsafe identity merges.</td></tr>
          <tr><td>Source method and snapshot time</td><td>Separates dump-derived and API-derived obligations.</td></tr>
        </table>
      </div>
      <div class="applied">
        <strong>Selected initial rule:</strong> retain non-linked credits in normalized evidence, but exclude them from
        playable graph nodes until an explicit identity policy is tested.
      </div>

      <h2 id="d-rights">9. Operational data-use rules</h2>
      <ul>
        <li>Use the monthly dump as the durable public catalog foundation.</li>
        <li>Keep collection membership, wantlists, usernames, marketplace data, and pricing out of public artifacts.</li>
        <li>Do not make album or artist images a launch dependency.</li>
        <li>Store the source method, retrieval time, dump date, and Discogs IDs with every accepted record.</li>
        <li>Do not create extra API keys to work around rate limits.</li>
        <li>For public API-derived displays, implement the current Discogs notice, direct-link, and freshness requirements.</li>
        <li>Re-read the current API terms before public launch or any major change in data use.</li>
      </ul>
      <div class="callout">
        The six-hour API rule makes indefinitely cached public API records a poor fit for a static-first game. Static
        challenges should be built primarily from a declared CC0 dump snapshot, with API-derived material handled only
        under a separately reviewed freshness and attribution path.
      </div>

      <h2 id="d-prep">10. Preparation checklist</h2>
      <ol>
        <li>Define a one-column private release-ID seed contract and synthetic public fixture.</li>
        <li>Record the chosen dump month and expected releases, artists, and masters object sizes.</li>
        <li>Verify storage headroom for compressed input, temporary extraction, raw batches, Parquet, and rollback copies.</li>
        <li>Stream a tiny release subset and preserve raw roles, IDs, names, and track scope.</li>
        <li>Compare five manually inspected releases with Discogs pages.</li>
        <li>Build one evidence path without using non-linked contributors as identity nodes.</li>
        <li>Only then introduce distributed normalization batches and targeted API gap filling.</li>
      </ol>

      <h2>Primary and supporting references</h2>
      <p class="sources">
        <a href="https://discogs-data-dumps.s3.us-west-2.amazonaws.com/index.html" target="_blank" rel="noopener">Discogs data-dump index</a>
        ·
        <a href="https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use" target="_blank" rel="noopener">Discogs API Terms of Use</a>
        ·
        <a href="https://support.discogs.com/hc/en-us/articles/360005006834-Database-Guidelines-10-Credits" target="_blank" rel="noopener">Discogs credit guidelines</a>
        ·
        <a href="https://support.discogs.com/hc/en-us/articles/360005054753-Database-Guidelines-2-Artist" target="_blank" rel="noopener">Discogs artist guidelines</a>
        ·
        <a href="https://support.discogs.com/hc/en-us/articles/17114733929229-Release-Page-Guide" target="_blank" rel="noopener">Discogs release-page guide</a>
        ·
        <a href="https://pypi.org/project/DiscogsDataProcessorCLI/1.6/" target="_blank" rel="noopener">Dated dump-size example</a>
      </p>
    </article>`;

  function installDiscogsModule() {
    if (document.getElementById('discogs')) return;

    const quizTab = document.getElementById('tab-quiz');
    const tab = document.createElement('button');
    tab.id = 'tab-discogs';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('aria-controls', 'discogs');
    tab.dataset.v = 'discogs';
    tab.tabIndex = -1;
    tab.textContent = 'Discogs';
    quizTab.before(tab);

    const quizPanel = document.getElementById('quiz');
    const panel = document.createElement('section');
    panel.id = 'discogs';
    panel.className = 'view';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', 'tab-discogs');
    panel.hidden = true;
    panel.innerHTML = DISCOGS_SECTION;
    quizPanel.before(panel);

    const referenceGrid = document.querySelector('#references .reference-grid');
    referenceGrid?.insertAdjacentHTML(
      'beforeend',
      `<section>
        <h2>Discogs</h2>
        <ul>
          <li><a href="https://discogs-data-dumps.s3.us-west-2.amazonaws.com/index.html" target="_blank" rel="noopener">Monthly data dumps</a></li>
          <li><a href="https://support.discogs.com/hc/en-us/articles/360009334593-API-Terms-of-Use" target="_blank" rel="noopener">API Terms of Use</a></li>
          <li><a href="https://support.discogs.com/hc/en-us/articles/360005006834-Database-Guidelines-10-Credits" target="_blank" rel="noopener">Credit guidelines</a></li>
          <li><a href="https://support.discogs.com/hc/en-us/articles/360005054753-Database-Guidelines-2-Artist" target="_blank" rel="noopener">Artist identity guidelines</a></li>
          <li><a href="https://support.discogs.com/hc/en-us/articles/17114733929229-Release-Page-Guide" target="_blank" rel="noopener">Release-page guide</a></li>
          <li><a href="https://github.com/edonahue/networked-players" target="_blank" rel="noopener">Networked Players implementation repository</a></li>
        </ul>
      </section>`,
    );

    Q.push(...DISCOGS_QUESTIONS);
    C.push(...DISCOGS_CARDS);
  }

  installDiscogsModule();

  const REVIEW_TARGETS = {
    Ansible: { tab: 'concepts', anchor: 'c-ansible' },
    Containers: { tab: 'concepts', anchor: 'c-containers' },
    Swarm: { tab: 'concepts', anchor: 'c-swarm' },
    Queues: { tab: 'concepts', anchor: 'c-queues' },
    Data: { tab: 'concepts', anchor: 'c-data' },
    Graphs: { tab: 'concepts', anchor: 'c-graphs' },
    Storage: { tab: 'concepts', anchor: 'c-swarm' },
    Delivery: { tab: 'concepts', anchor: 'c-delivery' },
    Quality: { tab: 'concepts', anchor: 'c-quality' },
    Rights: { tab: 'concepts', anchor: 'c-rights' },
    Jobs: { tab: 'concepts', anchor: 'c-queues' },
    Architecture: { tab: 'concepts', anchor: 'c-swarm' },
    Privacy: { tab: 'concepts', anchor: 'c-rights' },
    Product: { tab: 'concepts', anchor: 'c-delivery' },
    'Discogs sources': { tab: 'discogs', anchor: 'd-sources' },
    'Discogs API': { tab: 'discogs', anchor: 'd-api' },
    'Discogs rights': { tab: 'discogs', anchor: 'd-rights' },
    'Discogs identity': { tab: 'discogs', anchor: 'd-identity' },
    'Discogs credits': { tab: 'discogs', anchor: 'd-credits' },
    'Discogs ingestion': { tab: 'discogs', anchor: 'd-flow' },
  };

  const blankState = () => ({
    n: 0,
    ok: 0,
    category: { concept: {}, build: {} },
    track: { concept: { n: 0, ok: 0 }, build: { n: 0, ok: 0 } },
    seen: {},
  });

  const normalizeState = (saved) => ({
    ...blankState(),
    ...saved,
    category: {
      concept: saved.category?.concept || {},
      build: saved.category?.build || {},
    },
    track: {
      concept: { n: 0, ok: 0, ...(saved.track?.concept || {}) },
      build: { n: 0, ok: 0, ...(saved.track?.build || {}) },
    },
    seen: saved.seen || {},
  });

  const shuffledOrder = (length) => {
    const order = [...Array(length).keys()];
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') return normalizeState(saved);

      for (const key of LEGACY_STORAGE_KEYS) {
        const legacy = JSON.parse(localStorage.getItem(key) || 'null');
        if (legacy && typeof legacy === 'object') return normalizeState(legacy);
      }
    } catch {}
    return blankState();
  }

  let S = loadState();
  let activeQuestions = [];
  let questionIndex = 0;
  let selectedAnswer = null;
  let answered = false;
  let cardIndex = 0;

  const selectOne = (selector) => document.querySelector(selector);
  const selectAll = (selector) => [...document.querySelectorAll(selector)];
  const trackLabel = (track) => (track === 'concept' ? 'Technology concept' : 'Build decision');
  const rate = (value) => (value?.n ? Math.round((100 * value.ok) / value.n) : null);
  const questionKey = (question) => `${question.t}|${question.c}|${question.q}`;

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
    } catch {}
    renderStats();
  }

  function questionsForTrack(track) {
    return track === 'mixed' ? Q : Q.filter((question) => question.t === track);
  }

  function refreshCategories() {
    const select = selectOne('#cat');
    const previous = select.value;
    const categories = [...new Set(questionsForTrack(selectOne('#track').value).map((question) => question.c))].sort();
    select.innerHTML = '<option>All</option>' + categories.map((category) => `<option>${category}</option>`).join('');
    if (categories.includes(previous)) select.value = previous;
  }

  function categoryScore(track, category) {
    if (track === 'mixed') {
      const concept = S.category.concept[category] || { n: 0, ok: 0 };
      const build = S.category.build[category] || { n: 0, ok: 0 };
      return { n: concept.n + build.n, ok: concept.ok + build.ok };
    }
    return S.category[track][category] || { n: 0, ok: 0 };
  }

  function weakness(question) {
    const category = categoryScore(question.t, question.c);
    const track = S.track[question.t] || { n: 0, ok: 0 };
    const categoryRate = category.n ? category.ok / category.n : 0;
    const trackRate = track.n ? track.ok / track.n : 0;
    return (categoryRate + trackRate) / 2;
  }

  function startSession() {
    const track = selectOne('#track').value;
    const category = selectOne('#cat').value;
    const mode = selectOne('#mode').value;

    let questions = questionsForTrack(track).map((question) => ({ ...question, key: questionKey(question) }));
    if (category !== 'All') questions = questions.filter((question) => question.c === category);

    if (mode === 'weak') {
      questions.sort((a, b) => weakness(a) - weakness(b) || (S.seen[a.key] || 0) - (S.seen[b.key] || 0));
    } else {
      questions.sort((a, b) => (S.seen[a.key] || 0) - (S.seen[b.key] || 0) || Math.random() - 0.5);
    }

    if (mode === 'quick') questions = questions.slice(0, 10);
    activeQuestions = questions;
    questionIndex = 0;
    drawQuestion();
    renderStats();
  }

  function drawQuestion() {
    const box = selectOne('#qbox');
    if (!activeQuestions.length) {
      box.innerHTML = '<h2>No questions match these filters</h2><p class="small">Choose another track or category.</p>';
      return;
    }

    if (questionIndex >= activeQuestions.length) {
      box.innerHTML =
        '<h2>Session complete</h2><p class="small">Use the mastery panel to choose the next area to review.</p><div class="actions"><button class="primary" id="again">Start again</button></div>';
      selectOne('#again').addEventListener('click', startSession);
      selectOne('#again').focus();
      return;
    }

    const question = activeQuestions[questionIndex];
    selectedAnswer = null;
    answered = false;
    const order = shuffledOrder(question.o.length);
    box.innerHTML = `
      <div class="meta"><span>${trackLabel(question.t)} · ${question.c}</span><span>${questionIndex + 1} / ${activeQuestions.length}</span></div>
      <fieldset class="question-set">
        <legend class="question">${question.q}</legend>
        ${order.map((n) => `<label class="choice" data-n="${n}"><input type="radio" name="answer" value="${n}"> ${question.o[n]}</label>`).join('')}
      </fieldset>
      <div class="feedback" id="fb" role="status" aria-live="polite"></div>
      <div class="actions"><button class="primary" id="check">Check</button><button id="next" disabled>Next</button></div>`;

    selectAll('.choice').forEach((choice) => {
      choice.addEventListener('click', () => {
        if (answered) return;
        selectedAnswer = Number(choice.dataset.n);
        selectAll('.choice').forEach((item) => item.classList.remove('sel'));
        choice.classList.add('sel');
      });
    });
    selectOne('#check').addEventListener('click', checkAnswer);
    selectOne('#next').addEventListener('click', () => {
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
    S.category[question.t][question.c] ||= { n: 0, ok: 0 };
    S.category[question.t][question.c].n += 1;
    S.category[question.t][question.c].ok += Number(correct);
    S.track[question.t].n += 1;
    S.track[question.t].ok += Number(correct);
    S.seen[question.key] = (S.seen[question.key] || 0) + 1;

    selectAll('.choice').forEach((choice) => {
      const n = Number(choice.dataset.n);
      choice.querySelector('input').disabled = true;
      if (n === question.a) choice.classList.add('good');
      else if (n === selectedAnswer) choice.classList.add('bad');
    });

    const feedback = selectOne('#fb');
    feedback.className = 'feedback show';
    const target = REVIEW_TARGETS[question.c];
    const review =
      !correct && target
        ? '<div class="actions"><button class="link-btn" id="review">Review the related material →</button></div>'
        : '';
    feedback.innerHTML = `<strong>${correct ? 'Correct' : 'Review this one'}</strong><br>${question.w}${review}`;

    if (!correct && target) {
      selectOne('#review')?.addEventListener('click', () => {
        const tab = selectAll('.topnav [role="tab"]').find((item) => item.dataset.v === target.tab);
        if (tab) activateTab(tab);
        const section = document.getElementById(target.anchor);
        requestAnimationFrame(() => section?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      });
    }

    selectOne('#check').disabled = true;
    selectOne('#next').disabled = false;
    selectOne('#next').focus();
    save();
  }

  function renderStats() {
    selectOne('#n').textContent = S.n;
    selectOne('#acc').textContent = S.n ? `${rate(S)}%` : '—';
    selectOne('#conceptAcc').textContent = S.track.concept.n ? `${rate(S.track.concept)}%` : '—';
    selectOne('#buildAcc').textContent = S.track.build.n ? `${rate(S.track.build)}%` : '—';

    const track = selectOne('#track')?.value || 'mixed';
    const categories = [...new Set(questionsForTrack(track).map((question) => question.c))].sort();
    selectOne('#bars').innerHTML = categories
      .map((category) => {
        const score = categoryScore(track, category);
        const value = rate(score) || 0;
        return `<div class="bar"><span>${category}</span><div class="track" aria-hidden="true"><i style="width:${value}%"></i></div><span>${score.n ? `${value}%` : '—'}</span></div>`;
      })
      .join('');
  }

  function selectedCards() {
    const deck = selectOne('#deck').value;
    return deck === 'mixed' ? C : C.filter((card) => card.t === deck);
  }

  function drawCard() {
    const cards = selectedCards();
    if (!cards.length) return;
    const card = cards[cardIndex % cards.length];
    selectOne('#cardKind').textContent = trackLabel(card.t);
    selectOne('#front').textContent = card.f;
    selectOne('#back').textContent = card.b;
    selectOne('#back').classList.remove('on');
    selectOne('#reveal').textContent = 'Reveal';
    selectOne('#reveal').setAttribute('aria-expanded', 'false');
    selectOne('#count').textContent = `Card ${(cardIndex % cards.length) + 1} of ${cards.length}`;

    const source = selectOne('#cardSource');
    if (card.s) {
      source.innerHTML = `<a href="${card.s}" target="_blank" rel="noopener">Official reference</a>`;
    } else {
      source.textContent = '';
    }
    source.classList.remove('on');
  }

  function activateTab(button, moveFocus = false) {
    selectAll('.topnav [role="tab"]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('on', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.dataset.v);
      if (panel) {
        panel.classList.toggle('on', active);
        panel.hidden = !active;
      }
    });
    if (moveFocus) button.focus();
    window.scrollTo(0, 0);
  }

  const tabs = selectAll('.topnav [role="tab"]');
  tabs.forEach((button, index) => {
    button.addEventListener('click', () => activateTab(button));
    button.addEventListener('keydown', (event) => {
      let target = null;
      if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') target = tabs[(index - 1 + tabs.length) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs[tabs.length - 1];
      if (target) {
        event.preventDefault();
        activateTab(target, true);
      }
    });
  });

  selectOne('#track').addEventListener('change', () => {
    refreshCategories();
    renderStats();
  });
  selectOne('#start').addEventListener('click', startSession);
  selectOne('#reset').addEventListener('click', () => {
    if (confirm('Reset all saved concept and build-decision progress?')) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      } catch {}
      S = blankState();
      startSession();
    }
  });

  const ioPanel = selectOne('#ioPanel');
  const ioText = selectOne('#ioText');
  const ioLabel = selectOne('#ioLabel');
  const ioApply = selectOne('#ioApply');
  const ioMsg = selectOne('#ioMsg');

  function openIo(mode) {
    ioPanel.hidden = false;
    ioMsg.textContent = '';
    if (mode === 'export') {
      const json = JSON.stringify(S);
      ioText.value = json;
      ioText.readOnly = true;
      ioApply.hidden = true;
      ioLabel.textContent = 'Your progress — long-press to copy on iPhone';
      ioText.focus();
      ioText.select();
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(json).then(
          () => {
            ioMsg.textContent = 'Copied to clipboard.';
          },
          () => {},
        );
      }
    } else {
      ioText.value = '';
      ioText.readOnly = false;
      ioApply.hidden = false;
      ioLabel.textContent = 'Paste exported progress, then Apply';
      ioText.focus();
    }
  }

  selectOne('#exportBtn').addEventListener('click', () => openIo('export'));
  selectOne('#importBtn').addEventListener('click', () => openIo('import'));
  selectOne('#ioClose').addEventListener('click', () => {
    ioPanel.hidden = true;
  });
  ioApply.addEventListener('click', () => {
    let parsed;
    try {
      parsed = JSON.parse(ioText.value.trim());
    } catch {
      ioMsg.textContent = 'That does not look like valid saved progress.';
      return;
    }
    if (!parsed || typeof parsed !== 'object' || typeof parsed.n !== 'number' || !parsed.track) {
      ioMsg.textContent = 'That does not look like saved progress from this lab.';
      return;
    }
    S = normalizeState(parsed);
    save();
    startSession();
    ioMsg.textContent = 'Progress imported.';
  });

  selectOne('#deck').addEventListener('change', () => {
    cardIndex = 0;
    drawCard();
  });
  selectOne('#reveal').addEventListener('click', () => {
    const answer = selectOne('#back');
    const source = selectOne('#cardSource');
    const revealed = !answer.classList.contains('on');
    answer.classList.toggle('on', revealed);
    source.classList.toggle('on', revealed && Boolean(source.textContent));
    selectOne('#reveal').textContent = revealed ? 'Hide' : 'Reveal';
    selectOne('#reveal').setAttribute('aria-expanded', String(revealed));
  });
  selectOne('#nextCard').addEventListener('click', () => {
    cardIndex += 1;
    drawCard();
  });

  refreshCategories();
  renderStats();
  startSession();
  drawCard();
})();
