document.addEventListener('DOMContentLoaded', function() {
    const statusEl = document.getElementById('status');
    const startBtn = document.getElementById('start');
    const quizEl = document.getElementById('quiz');
    const numQuestions = document.getElementById('numQuestions');

    // scoreboard elements
    const sbTotal = document.getElementById('sb-total');
    const sbCorrect = document.getElementById('sb-correct');
    const sbPct = document.getElementById('sb-pct');
    const loadedCount = document.getElementById('loaded-count');
    const resetBtn = document.getElementById('resetScore');
    const clearBtn = document.getElementById('clearQuiz');

    // progress elements
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    let scoreState = { total: 0, correct: 0 };
    let currentQuestions = [];
    let answeredCount = 0;

    function updateScoreboard() {
      sbTotal.textContent = scoreState.total;
      sbCorrect.textContent = scoreState.correct;
      const pct = scoreState.total === 0 ? 0 : Math.round((scoreState.correct / scoreState.total) * 100);
      sbPct.textContent = `${pct}%`;
    }

    function updateProgress() {
      const total = currentQuestions.length || 0;
      progressText.textContent = `${answeredCount} / ${total} answered`;
      const pct = total === 0 ? 0 : Math.round((answeredCount / total) * 100);
      progressFill.style.width = `${pct}%`;
    }

    resetBtn.addEventListener('click', () => {
      scoreState.total = 0; scoreState.correct = 0; updateScoreboard();
    });

    clearBtn.addEventListener('click', () => {
      currentQuestions = []; answeredCount = 0; quizEl.innerHTML = ''; updateProgress();
    });

    // check server status
    async function checkStatus() {
      try {
        const r = await fetch('/api/status');
        const j = await r.json();
        statusEl.textContent = `Questions loaded: ${j.questions_loaded}`;
        startBtn.disabled = !j.has_questions;
        loadedCount.textContent = j.questions_loaded;
      } catch (e) {
        statusEl.textContent = 'Server status error (see console)';
        console.error(e);
        startBtn.disabled = true;
      }
    }

    async function startQuiz() {
      quizEl.innerHTML = '<div class="muted">Loading questions…</div>';
      const n = Math.max(1, Math.min(200, parseInt(numQuestions.value || '20')));
      try {
        // request 20 questions
        const r = await fetch(`/api/sample?n=${n}`);
        if (!r.ok) {
          const err = await r.json().catch(()=>({error:r.statusText}));
          quizEl.innerHTML = `<div style="color:#f88">Failed to load questions: ${err.error || r.statusText}</div>`;
          return;
        }
        const qs = await r.json();
        currentQuestions = qs;
        answeredCount = 0;
        renderQuestions(qs);
        updateProgress();
      } catch (e) {
        quizEl.innerHTML = `<div style="color:#f88">Fetch error (see console)</div>`;
        console.error(e);
      }
    }

    function createCard(q, index) {
      const div = document.createElement('div');
      div.className = 'question-card';
      div.dataset.qid = q.id;
      div.innerHTML = `<div class="q-title"><strong>Q${index+1}.</strong> ${q.question}</div>`;
      const opts = document.createElement('div'); opts.className = 'options';
      q.options.forEach((opt, i) => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio'; input.name = q.id; input.value = i;
        label.appendChild(input);
        const span = document.createElement('span'); span.textContent = opt;
        label.appendChild(span);
        opts.appendChild(label);
      });
      div.appendChild(opts);

      const actions = document.createElement('div'); actions.className = 'card-actions';
      const submit = document.createElement('button'); submit.className = 'btn primary'; submit.textContent = 'Submit';
      const hint = document.createElement('div'); hint.className = 'muted small';
      actions.appendChild(hint); actions.appendChild(submit);
      div.appendChild(actions);

      submit.addEventListener('click', () => submitAnswer(q.id, div, q));
      return div;
    }

    function renderQuestions(questions) {
      quizEl.innerHTML = '';
      questions.forEach((q, i) => {
        const card = createCard(q, i);
        quizEl.appendChild(card);
        // subtle entry animation
        card.style.opacity = '0';
        setTimeout(()=> card.style.opacity = '1', 40 + i*30);
      });
    }

    async function submitAnswer(qid, container, qMeta) {
      const sel = container.querySelector(`input[name="${qid}"]:checked`);
      if (!sel) { alert('Choose an option'); return; }
      const payload = { id: qid, selected: parseInt(sel.value) };
      try {
        const r = await fetch('/api/grade', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        if (!r.ok) {
          const err = await r.json().catch(()=>({error:r.statusText}));
          alert('Server error: ' + (err.error||r.statusText));
          return;
        }
        const j = await r.json();

        // scoreboard & progress
        scoreState.total += 1;
        if (j.correct) scoreState.correct += 1;
        answeredCount += 1;
        updateScoreboard(); updateProgress();

        // show feedback
        const msg = document.createElement('div'); msg.className = j.correct ? 'explanation' : 'explanation';
        msg.style.border = j.correct ? '1px solid rgba(110,231,183,0.08)' : '1px solid rgba(256,80,80,0.06)';
        msg.innerHTML = j.correct ? `<strong style="color:#9fffdc">Correct</strong>` : `<strong style="color:#ff9b9b">Incorrect</strong>`;
        if (j.explanation) {
          const ex = document.createElement('div'); ex.style.marginTop = '8px'; ex.style.color = '#dff6ea';
          ex.textContent = j.explanation;
          msg.appendChild(ex);
        }

        container.querySelectorAll('input').forEach(i => i.disabled = true);
        container.querySelector('button').disabled = true;
        const actions = container.querySelector('.card-actions');
        actions.querySelector('.muted').remove();
        actions.insertAdjacentElement('afterbegin', msg);
      } catch (e) {
        console.error(e);
        alert('Error submitting answer. See console.');
      }
    }

    startBtn.addEventListener('click', startQuiz);
    checkStatus();
    updateScoreboard();
    updateProgress();
});