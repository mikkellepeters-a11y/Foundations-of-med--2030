# MSK Production Quiz Definition Contract

Production MSK quizzes no longer need to copy question content into separate HTML files.

The pipeline is:

`Central Question Bank → Quiz Definition → Canonical Quiz Player → Tracking / Smart Review / Leaderboard`

## Files

- `shared/msk-quiz-definitions.js` — definition registry, validation, hydration, and launch URLs.
- `question-bank/msk-quiz-definitions-data.js` — canonical production quiz definitions.
- `quiz/msk-quiz-definition-validator.html` — cross-checks every definition against the central bank.
- `quiz/msk-quiz-template.html?quiz=<quiz_id>` — the canonical player in production-definition mode.

## Definition shape

```js
{
  quiz_id: 'msk-week13-monday-50',
  quiz_name: 'Week 13 Monday Daily Quiz',
  section: 'Daily Quiz',
  week: 'Week 13',
  description: 'Lectures 1–3',
  question_ids: [
    'msk-w13-l01-q001',
    'msk-w13-l01-q002'
  ],
  status: 'published',
  default_mode: 'practice',
  allowed_modes: ['practice', 'advanced_review'],
  tags: ['daily', 'week-13'],
  metadata: {}
}
```

## Rules

- `quiz_id` is permanent and unique. Never recycle it for a different quiz.
- A definition stores IDs only; stems, choices, answers, hints, explanations, media, and source references remain in the central bank.
- A published definition must contain at least one question.
- Every referenced `question_id` must exist in the central bank.
- Published definitions may reference only published bank questions.
- Duplicate question IDs inside one definition are blocked.
- `default_mode` must appear in `allowed_modes`.
- Week mismatches and canonical `source_quiz_id` mismatches are warnings so cumulative / curated quizzes can intentionally mix material.

## Publication workflow

1. Add source-supported questions to the central bank.
2. Run `quiz/msk-question-bank-validator.html` and resolve errors.
3. Add a definition containing only the desired permanent question IDs.
4. Run `quiz/msk-quiz-definition-validator.html`.
5. Resolve all definition errors and review warnings.
6. Link the quiz using:
   `quiz/msk-quiz-template.html?quiz=<quiz_id>`
7. The canonical player hydrates current question content from the bank at runtime and sends attempts through the existing MSK tracking adapter.

This means a question correction is made once in the bank and automatically appears anywhere that permanent question ID is used.
