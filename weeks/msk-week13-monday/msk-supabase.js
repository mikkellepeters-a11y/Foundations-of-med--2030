/* Supabase sync for MSK Week 13 Monday. */
(() => {
  if (window.__MSK_W13_MONDAY_SUPABASE__) return;
  if (typeof window.supabase === 'undefined' || typeof quizNum === 'undefined' || typeof quiz === 'undefined' || !quiz) return;
  window.__MSK_W13_MONDAY_SUPABASE__ = true;

  const SUPABASE_URL = 'https://ofqfdnxpftifnvxnvppe.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_06zYj2REZQMC8nXfhm7weQ_Nrotri7G';
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const QUIZ_ID = 'msk-week13-monday';
  const QUIZ_NAME = 'MSK Week 13 Monday · 70 Questions';

  const confidenceMap = {
    high: 'confident',
    medium: 'unsure',
    low: 'guessing'
  };

  function optionText(q, letter) {
    if (!letter) return null;
    const i = LETTERS.indexOf(letter);
    return i >= 0 ? (q.options[i] ?? letter) : letter;
  }

  function getResultStatus() {
    let el = document.getElementById('vignetteSupabaseStatus');
    if (el) return el;
    const modal = document.getElementById('resultModal');
    if (!modal) return null;
    el = document.createElement('div');
    el.id = 'vignetteSupabaseStatus';
    el.style.cssText = 'margin:12px 0 0;padding:10px 12px;border:1px solid var(--line,#dccfc3);border-radius:12px;background:#fffaf6;font-size:10.5px;font-weight:800;color:var(--muted,#78695f)';
    const actions = modal.querySelector('.modal-actions');
    if (actions) modal.insertBefore(el, actions);
    else modal.appendChild(el);
    return el;
  }

  function setStatus(text, kind = 'neutral') {
    const el = getResultStatus();
    if (!el) return;
    el.textContent = text;
    el.style.color = kind === 'ok' ? 'var(--green,#61765c)' : kind === 'error' ? 'var(--red,#945e55)' : 'var(--muted,#78695f)';
  }

  async function getSession() {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    return session;
  }

  async function loadReviewItems() {
    try {
      const session = await getSession();
      if (!session?.user) return;
      const { data, error } = await client
        .from('review_items')
        .select('question_id')
        .eq('user_id', session.user.id)
        .eq('quiz_id', QUIZ_ID);
      if (error) throw error;

      const prefix = `${quizNum}:`;
      const local = reviewBank().filter(k => !String(k).startsWith(prefix));
      const remote = (data || []).map(r => `${quizNum}:${r.question_id}`);
      setReviewBank([...local, ...remote]);
    } catch (err) {
      console.warn('Could not load vignette Filed for Review items', err);
    }
  }

  async function syncReviewItem(q, on) {
    try {
      const session = await getSession();
      if (!session?.user) return;
      if (on) {
        const { error } = await client.from('review_items').upsert({
          user_id: session.user.id,
          quiz_id: QUIZ_ID,
          question_id: String(q.id),
          reason: 'Manual review',
          note: q.topic || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,quiz_id,question_id' });
        if (error) throw error;
      } else {
        const { error } = await client.from('review_items')
          .delete()
          .eq('user_id', session.user.id)
          .eq('quiz_id', QUIZ_ID)
          .eq('question_id', String(q.id));
        if (error) throw error;
      }
    } catch (err) {
      console.error('MSK Filed for Review sync failed', err);
      setStatus('Could not sync Filed for Review.', 'error');
    }
  }

  async function syncAttempt() {
    if (state.supabaseSaved) {
      setStatus('Synced to My Profile ✓', 'ok');
      return;
    }

    try {
      const session = await getSession();
      if (!session?.user) {
        setStatus('Guest mode — this result stays on this device. Sign in before completing a quiz to sync it to My Profile.');
        return;
      }

      setStatus('Syncing this vignette quiz to My Profile…');
      const completedAt = new Date().toISOString();
      const answered = activeQuestions().filter(q => Object.prototype.hasOwnProperty.call(state.answers, q.id));
      const correct = activeQuestions().filter(q => state.answers[q.id] === q.answer).length;
      const total = activeQuestions().length;
      const percentage = total ? (correct / total) * 100 : 0;
      const hintsUsed = activeQuestions().filter(q => state.hintUsed[q.id]).length;
      const highConfidenceMisses = activeQuestions().filter(q => state.confidence[q.id] === 'high' && state.answers[q.id] !== q.answer).length;

      const { error: quizError } = await client.from('quiz_attempts').insert({
        user_id: session.user.id,
        quiz_id: QUIZ_ID,
        quiz_name: QUIZ_NAME,
        score: correct,
        total_questions: total,
        percentage,
        mode: 'advanced-review',
        module_key: 'msk',
        completed_at: completedAt,
        metadata: {
          module: 'Musculoskeletal–Skin',
          section: 'Week 13 Monday',
          quiz_number: quizNum,
          answered_questions: answered.length,
          hints_used: hintsUsed,
          high_confidence_misses: highConfidenceMisses
        }
      });
      if (quizError) throw quizError;

      if (answered.length) {
        const rows = answered.map(q => ({
          user_id: session.user.id,
          quiz_id: QUIZ_ID,
          question_id: String(q.id),
          topic: q.topic || 'Practice MSKs',
          difficulty: q.difficulty || 'Step 1',
          selected_answer: optionText(q, state.answers[q.id]),
          correct_answer: optionText(q, q.answer),
          is_correct: state.answers[q.id] === q.answer,
          confidence: confidenceMap[state.confidence[q.id]] || null,
          module_key: 'msk',
          week: '13',
          lecture: String(q.lecture || ''),
          answered_at: completedAt,
          metadata: {
            module: 'Musculoskeletal–Skin',
            section: 'Week 13 Monday',
            quiz_number: quizNum,
            answer_letter: state.answers[q.id] || null,
            correct_letter: q.answer,
            hint_used: !!state.hintUsed[q.id]
          }
        }));
        const { error: questionError } = await client.from('question_attempts').insert(rows);
        if (questionError) throw questionError;
      }

      state.supabaseSaved = true;
      state.supabaseSavedAt = completedAt;
      save();
      setStatus('Synced to My Profile ✓', 'ok');
    } catch (err) {
      console.error('MSK Supabase sync failed', err);
      setStatus(`Supabase sync failed: ${err?.message || 'Unknown error'}`, 'error');
    }
  }

  const originalToggleFlag = toggleFlag;
  toggleFlag = function(q) {
    const on = originalToggleFlag(q);
    syncReviewItem(q, on);
    return on;
  };

  const originalFinishQuiz = finishQuiz;
  finishQuiz = function() {
    const out = originalFinishQuiz.apply(this, arguments);
    syncAttempt();
    return out;
  };

  const originalShowResults = showResults;
  showResults = function() {
    const out = originalShowResults.apply(this, arguments);
    if (state.supabaseSaved) setStatus('Synced to My Profile ✓', 'ok');
    else setStatus('Ready to sync to My Profile.');
    return out;
  };

  const originalRetake = retake;
  retake = function() {
    const out = originalRetake.apply(this, arguments);
    return out;
  };

  loadReviewItems().then(() => {
    if (state.completed && !state.supabaseSaved) syncAttempt();
    else if (state.completed && state.supabaseSaved) setStatus('Synced to My Profile ✓', 'ok');
  });
})();
