# Experiment Brief: Cloud, Data & AI Certification Lab

## Intent and audience

Build a personal, public study artifact that turns three complementary certifications into a coherent career-development and portfolio-learning sequence. The primary audience is Erich, with secondary value for experienced product, analytics, and data leaders considering a more technical cloud and applied-AI path.

## Public outcome

Visitors can inspect the rationale, adjust a study pace, complete a detailed checklist, browse a curated multi-format resource library, answer warm-up questions, review flashcards, export/import progress, and download a self-contained offline copy.

## Current maturity

- Status: Prototype
- Experiment level: 2 interactive lab
- First release: complete three-certification roadmap, detailed modules, curated resources, checklist, warm-up quiz, flashcards, and offline artifact
- Immediate follow-up: realistic blueprint-weighted diagnostic pretests and result-driven personalization

## Core interaction

The user chooses among Roadmap, three certification detail sections, Resources, Quiz, and Flashcards. Hours per week and start date calculate an estimated sequence. Study actions, quiz performance, and flashcard familiarity persist in versioned local storage. Resource filters help select a bounded primary study stack.

## Certification scope

| Credential | Role in sequence | Current exam version |
| --- | --- | --- |
| SnowPro Core | Immediate data-platform relevance | COF-C03 |
| AWS Certified AI Practitioner | Compact AI/product signal and AWS bridge | AIF-C01 |
| AWS Solutions Architect – Associate | Broad cloud-architecture credibility | SAA-C03 |

CCNA is documented as the original inspiration and a possible later branch. It is not included as a fourth active exam plan because that would dilute the initial sequence and extend the calendar substantially.

## Content sourcing and rights

- Exam structure, domains, costs, candidate profiles, and service scope are derived from current official Snowflake and AWS certification pages and exam guides.
- Official documentation and training links remain external hyperlinks.
- Third-party courses, books, practice exams, podcasts, and videos are described and linked; their content is not copied or redistributed.
- Quiz and flashcard text is original authorship based on public objectives and documentation.
- The planned diagnostic banks must remain independently authored and may not reproduce, reconstruct, or solicit protected live exam questions.

## Public and private boundary

### Public

- Certification rationale and sequence
- Generic career-fit analysis
- Study modules, exam-domain summaries, and readiness gates
- Public resource links and commentary
- Generic capstone architecture concepts
- Original questions, flashcards, and progress mechanics

### Private

- Employer systems, internal data, unpublished strategy, or Disney-specific architecture
- Certification portal identifiers, accommodation details, receipts, or reimbursement records
- AWS/Snowflake credentials, account identifiers, billing data, and resource names
- Home-network addressing, secrets, and operational topology
- Personal quiz results unless intentionally exported by the user

## Local state

- Storage key: `cloudDataAiCertificationLabV1`
- Data: study-hours setting, start date, checklist completion, aggregate quiz/domain results, question exposure counts, and flashcard familiarity
- Reset: explicit confirmation before deleting local progress
- Portability: JSON export/import
- Backend: none

## Offline and failure behavior

The full roadmap, study modules, resource descriptions, quiz, flashcards, and progress mechanics work in the generated single-file HTML artifact. External resources naturally require connectivity. Local-storage failure degrades to a usable non-persistent session.

## Accessibility

- Semantic tabs and tab panels with arrow-key navigation
- Keyboard-accessible checklist, filters, quiz, flashcards, and import/export controls
- Visible focus indicators and minimum 44-pixel primary touch targets
- Safe-area support for iOS
- Responsive tables and single-column mobile fallbacks
- Reduced-motion support
- Status regions for quiz feedback and import/export messages

## Testing

- JavaScript syntax validation through the repository validator
- Experiment manifest and generated offline-artifact validation
- Astro content validation and production build
- Playwright smoke test for catalog/project/wrapper connectivity, tab navigation, localStorage, resource filtering, quiz interaction, flashcards, and offline execution
- Manual review on iPhone Safari and desktop before declaring the experiment Active

## Definition of done for initial PR

- [x] Three current certification plans with exam details and readiness gates
- [x] Adjustable schedule and local checklist
- [x] Curated resources across requested formats
- [x] Original warm-up quiz and adaptive flashcards
- [x] Export/import and reset behavior
- [x] Full offline artifact declaration
- [x] Public project notes and experiment manifest
- [x] Dedicated smoke coverage
- [ ] Blueprint-weighted diagnostic pretests and result-driven personalization
- [ ] Manual iPhone Safari acceptance check

## Graduation or retirement criteria

The lab remains Active while at least one certification is in progress. After the sequence is complete, preserve it as a public learning case study and either graduate the portfolio architecture into a permanent project or archive the scheduling controls while retaining the reusable study system.
