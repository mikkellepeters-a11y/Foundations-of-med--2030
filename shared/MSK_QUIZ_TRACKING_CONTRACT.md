# MSK Quiz Tracking Contract

Future MSK quizzes should load these scripts in this order:

```html
<script src="../../shared/msk-smart-review.js"></script>
<script src="../../shared/msk-quiz-tracking.js"></script>
```

Create one adapter per quiz page:

```js
const tracker = await MSKQuizTracking.createAdapter({
  quizId: 'msk-week13-monday-50',
  quizName: 'Week 13 Monday Daily Quiz',
  week: 'Week 13',
  section: 'Daily Quiz',
  mode: 'practice'
});
```

Every production question must have a permanent identity and review metadata:

```js
{
  question_id: 'w13-l02-q014',
  week: 'Week 13',
  lecture: 'Lecture 2 · Example',
  topic: 'Example Topic',
  difficulty: 'Intermediate',
  stem: 'Question stem...',
  choices: ['A...', 'B...', 'C...', 'D...'],
  correct_answer: 'B...',
  explanation: 'Detailed explanation...'
}
```

On **Submit Answer**:

```js
await tracker.recordAnswer(question, {
  selectedAnswer,
  confidence // 'guessing' | 'unsure' | 'confident'
});
```

Manual review controls:

```js
await tracker.fileQuestion(question);
await tracker.unfileQuestion(question);
```

On quiz completion:

```js
await tracker.completeQuiz({
  score,
  totalQuestions
});
```

On retake, create a new attempt token before the first submitted question:

```js
tracker.newAttempt();
```

## Guarantees

- All rows written by this adapter use `module_key = 'msk'`.
- Original quiz answers go to `question_attempts`.
- Quiz completion goes to `quiz_attempts`.
- Smart Review state goes to `review_items`.
- The second ordinary miss across attempts creates **Repeatedly Missed**.
- Wrong + high confidence creates **Confidently Wrong**.
- Low confidence creates **Low Confidence**, even if the answer was correct.
- Manual filing creates **Filed for Review** immediately.
- The full question snapshot is preserved so **Review the Module** can reproduce the question later.
- `attempt_token` prevents duplicate question/completion writes inside one quiz attempt while still allowing retakes.

The development-only validator is `review/msk-quiz-tracking-validator.html`. It uses an in-memory store and never writes fake data to Supabase.
