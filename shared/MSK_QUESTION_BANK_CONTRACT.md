# MSK Central Question Bank Contract

The canonical MSK question bank is registered through:

- `shared/msk-question-bank.js` — registry, normalization, validation, statistics, and lookup.
- `question-bank/msk-question-bank-data.js` — canonical content registration. It is intentionally empty until source-supported MSK questions exist.
- `quiz/msk-question-bank-validator.html` — development QA dashboard.

## Canonical question shape

```js
{
  question_id: 'msk-w13-l01-q001',
  source_quiz_id: 'msk-week13-monday-50',
  week: 'Week 13',
  lecture: 'Lecture 1 · Title',
  topic: 'Topic',
  difficulty: 'In-House', // or Intermediate / Step 1
  stem: 'Full question stem...',
  choices: ['Choice A', 'Choice B', 'Choice C', 'Choice D'],
  correct_answer: 'B',
  explanation: 'Detailed explanation of the correct answer.',
  choice_explanations: {
    A: 'Why A is incorrect.',
    B: 'Why B is correct.',
    C: 'Why C is incorrect.',
    D: 'Why D is incorrect.'
  },
  hint: 'Optional pre-submission hint.',
  tags: ['anatomy', 'upper-extremity'],
  media: [],
  source_refs: [],
  status: 'published',
  metadata: {}
}
```

## Required production fields

A published question must have a permanent `question_id`, stable `source_quiz_id`, week, lecture, topic, difficulty, stem, exactly four non-duplicate choices, a resolvable correct answer, and a detailed explanation.

The validator treats missing hints, tags, source references, or per-choice explanations as warnings rather than hard failures so incomplete draft work can be inspected before publication.

## Identity rules

- `question_id` is globally unique across the entire MSK bank and must never be recycled for different content.
- `source_quiz_id` identifies the question's canonical source quiz/content set and must remain stable.
- Quiz attempts still use the quiz/session `quiz_id` supplied by the production quiz shell.
- All tracking remains scoped to `module_key = 'msk'`.

## Status

- `published` — eligible for the full-bank quiz builder.
- `draft` — retained in the registry and validator but excluded from student full-bank quizzes.
- `retired` — retained for historical identity but excluded from normal bank reads.

## Quality gates

Before publishing a bank update:

1. Open `quiz/msk-question-bank-validator.html`.
2. Confirm zero errors.
3. Review warnings intentionally.
4. Confirm answer-position and difficulty distributions look plausible.
5. Confirm no duplicate IDs or broken source metadata.
6. Only then wire the questions into production quiz definitions.

The question bank contains no synthetic production data. Mock review data used elsewhere remains separate.
