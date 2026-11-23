import { questions } from './questions.js'

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const levelInfo = {
  A1: { name: 'Beginner', description: 'You can understand and use familiar everyday expressions and very basic phrases.', next: 'Focus on core sentence patterns, present-tense verbs, common questions, and high-frequency vocabulary.' },
  A2: { name: 'Elementary', description: 'You can manage simple, routine exchanges and understand short texts about familiar topics.', next: 'Practice past and future forms, everyday phrasal verbs, prepositions, and short reading tasks.' },
  B1: { name: 'Intermediate', description: 'You can handle most familiar situations, maintain conversation, and understand straightforward texts.', next: 'Develop passive and reported forms, first/second conditionals, collocations, and argument-focused reading.' },
  B2: { name: 'Upper Intermediate', description: 'You can communicate effectively and understand complex ideas across many personal and professional contexts.', next: 'Strengthen subtle vocabulary, academic connectors, inversion, and inference from complex texts.' },
  C1: { name: 'Advanced', description: 'You can use English flexibly and effectively in demanding academic and professional contexts.', next: 'Refine register, precision, complex clauses, discourse markers, and critical reading.' },
  C2: { name: 'Proficient', description: 'You understand virtually everything you read and express ideas with exceptional precision and nuance.', next: 'Maintain range through extensive reading, formal writing, and careful study of stylistic nuance.' },
}

const root = document.querySelector('#app')
if (!root) throw new Error('The application root element #app was not found.')
validateQuestionBank()

let page = 'home'
let index = 0
let reviewFilter = 'all'
let answers = loadAnswers()

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char])
}

function loadAnswers() {
  try {
    const saved = JSON.parse(localStorage.getItem('tme.answers') || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(Object.entries(saved).filter(([id, choice]) => {
      const question = questions.find(item => item.id === Number(id))
      return question && Number.isInteger(choice) && choice >= 0 && choice < question.choices.length
    }))
  } catch {
    return {}
  }
}

function saveAnswers() {
  try {
    localStorage.setItem('tme.answers', JSON.stringify(answers))
  } catch {
    // The assessment remains usable for this visit when browser storage is unavailable.
  }
}

function validateQuestionBank() {
  const ids = new Set()
  for (const question of questions) {
    if (ids.has(question.id)) throw new Error(`Duplicate question id: ${question.id}`)
    if (!levels.includes(question.level)) throw new Error(`Invalid CEFR level for question ${question.id}`)
    if (!Array.isArray(question.choices) || question.choices.length !== 4) throw new Error(`Question ${question.id} must have four choices`)
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.choices.length) throw new Error(`Invalid answer key for question ${question.id}`)
    ids.add(question.id)
  }
}

function classify() {
  const levelScores = Object.fromEntries(levels.map(level => [level, { correct: 0, total: 0 }]))
  const categoryScores = {}
  let weightedCorrect = 0
  let weightedTotal = 0

  for (const question of questions) {
    const weight = levels.indexOf(question.level) + 1
    levelScores[question.level].total++
    weightedTotal += weight
    categoryScores[question.category] ??= { correct: 0, total: 0 }
    categoryScores[question.category].total++
    if (answers[question.id] === question.answer) {
      levelScores[question.level].correct++
      categoryScores[question.category].correct++
      weightedCorrect += weight
    }
  }

  const raw = weightedTotal ? weightedCorrect / weightedTotal : 0
  let level = 'A1'
  if (raw >= 0.88) level = 'C2'
  else if (raw >= 0.76) level = 'C1'
  else if (raw >= 0.61) level = 'B2'
  else if (raw >= 0.46) level = 'B1'
  else if (raw >= 0.30) level = 'A2'

  const consistent = levels.slice(0, levels.indexOf(level)).every(candidate => {
    const score = levelScores[candidate]
    return score.total > 0 && score.correct / score.total >= 0.55
  })
  if (!consistent && level !== 'A1') level = levels[Math.max(0, levels.indexOf(level) - 1)]

  const correct = questions.filter(question => answers[question.id] === question.answer).length
  const unanswered = questions.filter(question => answers[question.id] === undefined).length
  return {
    level,
    correct,
    incorrect: questions.length - correct - unanswered,
    unanswered,
    weighted: Math.round(raw * 100),
    categoryScores,
  }
}

function navigate(nextPage) {
  page = nextPage
  render()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function brand() {
  return '<span class="brand-mark">A<span>A</span></span><span>TestMyEnglish</span>'
}

function header() {
  const action = page === 'home' ? 'instructions' : 'home'
  const label = page === 'home' ? 'About the test' : 'Exit assessment'
  return `<header class="topbar"><button class="brand" data-action="home" aria-label="TestMyEnglish home">${brand()}</button><button class="text-button" data-action="${action}">${label}</button></header>`
}

function homePage() {
  return `<main class="home">
    <section class="hero-copy">
      <div class="eyebrow"><span></span> CEFR-aligned English assessment</div>
      <h1>How good is<br><em>your English?</em></h1>
      <p>Discover your estimated proficiency level with a thoughtful, ${questions.length}-question assessment and a detailed learning report.</p>
      <div class="hero-actions"><button class="primary" data-action="instructions">Start my assessment <span>→</span></button><div class="test-meta"><b>~25 min</b><span>${questions.length} questions</span></div></div>
    </section>
    <section class="hero-visual" aria-label="Assessment preview">
      <div class="visual-card card-back"></div>
      <div class="visual-card card-main"><div class="card-label">ENGLISH PROFICIENCY</div><div class="level-preview">B2</div><div class="level-name">Upper Intermediate</div>
        <div class="strength-bars">${[72, 84, 68, 76].map(width => `<div><span></span><b style="width:${width}%"></b></div>`).join('')}</div>
      </div>
      <div class="floating-note"><span>✓</span><div><b>Personalized report</b><small>Strengths &amp; learning next steps</small></div></div>
    </section>
  </main>`
}

function instructionsPage() {
  return `<main class="instructions-page">
    <div class="section-heading"><div class="eyebrow"><span></span> Before you begin</div><h1>Take a moment to<br><em>get ready.</em></h1></div>
    <div class="instruction-grid">
      <section class="instruction-card"><span class="step-number">01</span><h2>Set aside 25 minutes</h2><p>Work through the questions at a steady pace. You can change previous answers at any time.</p></section>
      <section class="instruction-card"><span class="step-number">02</span><h2>Choose the best answer</h2><p>Each question has four choices. Select one answer before moving to the next question.</p></section>
      <section class="instruction-card"><span class="step-number">03</span><h2>Review your report</h2><p>Receive an estimated CEFR level, competency breakdown, explanations, and a learning path.</p></section>
    </div>
    <div class="notice"><b>Important:</b> This independent assessment estimates reading and language knowledge only. It does not assess speaking or listening and is not an official exam.</div>
    <div class="start-row"><button class="secondary" data-action="home">Back</button><button class="primary" data-action="begin">Begin assessment <span>→</span></button></div>
  </main>`
}

function assessmentPage() {
  const question = questions[index]
  const answeredCount = Object.keys(answers).length
  const progress = Math.round(answeredCount / questions.length * 100)
  const choices = question.choices.map((choice, choiceIndex) => {
    const selected = answers[question.id] === choiceIndex
    return `<button type="button" role="radio" aria-checked="${selected}" class="choice${selected ? ' selected' : ''}" data-action="answer" data-choice="${choiceIndex}">
      <span>${String.fromCharCode(65 + choiceIndex)}</span>${escapeHtml(choice)}<b aria-hidden="true">✓</b>
    </button>`
  }).join('')
  const passage = question.passage
    ? `<div class="passage"><b>Read the passage</b><p>${escapeHtml(question.passage)}</p></div>`
    : ''
  const nextButton = index < questions.length - 1
    ? `<button class="primary" data-action="next">${answers[question.id] === undefined ? 'Skip for now' : 'Next'} <span>→</span></button>`
    : '<button class="primary" data-action="submit">Review &amp; submit <span>→</span></button>'

  return `<main class="assessment-page">
    <header class="assessment-header">
      <button class="brand" data-action="home" aria-label="TestMyEnglish home">${brand()}</button>
      <div class="assessment-progress"><div><b>Question ${index + 1} of ${questions.length}</b><span>${progress}% completed</span></div><div class="progress-track"><span style="width:${(index + 1) / questions.length * 100}%"></span></div></div>
      <button class="exit-button" data-action="home">Exit</button>
    </header>
    <section class="question-wrap">
      <div class="question-label"><span>${escapeHtml(question.category)}</span><span>CEFR ${question.level}</span></div>
      ${passage}
      <h1>${escapeHtml(question.prompt)}</h1>
      <div class="choices" role="radiogroup" aria-label="Answer choices">${choices}</div>
      <footer class="question-nav"><button class="nav-button" data-action="previous" ${index === 0 ? 'disabled' : ''}>← Previous</button>${nextButton}</footer>
    </section>
  </main>`
}

function completionPage() {
  return `<main class="complete-page">
    <div class="completion-icon">✓</div><div class="eyebrow"><span></span> Assessment complete</div>
    <h1>Your English report<br><em>is ready.</em></h1>
    <p>You answered ${Object.keys(answers).length} of ${questions.length} questions. Your estimated level has been calculated from difficulty, competency, and consistency.</p>
    <button class="primary" data-action="results">View my results <span>→</span></button>
  </main>`
}

function resultsPage() {
  const result = classify()
  const categories = Object.entries(result.categoryScores)
  const byStrength = [...categories].sort((a, b) => b[1].correct / b[1].total - a[1].correct / a[1].total)
  const strongest = byStrength[0]?.[0] || 'your language skills'
  const weakest = byStrength.at(-1)?.[0] || 'your language skills'
  const categoryCards = categories.map(([name, score]) => {
    const percent = Math.round(score.correct / score.total * 100)
    return `<div class="category-card"><div><b>${escapeHtml(name)}</b><span>${percent}%</span></div><div class="category-track"><span style="width:${percent}%"></span></div><small>${score.correct} of ${score.total} correct</small></div>`
  }).join('')
  const filters = ['all', 'correct', 'incorrect', 'unanswered'].map(filter =>
    `<button class="${reviewFilter === filter ? 'active' : ''}" data-action="filter" data-filter="${filter}" aria-pressed="${reviewFilter === filter}">${filter[0].toUpperCase()}${filter.slice(1)}</button>`
  ).join('')

  return `<main class="results-page">
    <div class="results-hero"><div><div class="eyebrow"><span></span> Your estimated proficiency</div><h1>Congratulations!</h1><p>You’ve completed your English assessment.</p></div>
      <div class="result-badge"><b>${result.level}</b><span>${levelInfo[result.level].name}</span></div>
    </div>
    <div class="stats-row"><div><span>Correct</span><b>${result.correct}<small> / ${questions.length}</small></b></div><div><span>Incorrect</span><b>${result.incorrect}</b></div><div><span>Unanswered</span><b>${result.unanswered}</b></div><div><span>Weighted score</span><b>${result.weighted}%</b></div></div>
    <section class="level-summary"><div><span class="level-letter">${result.level}</span></div><div><h2>${levelInfo[result.level].name}</h2><p>${levelInfo[result.level].description}</p></div></section>
    <section class="report-section"><div class="report-title"><div><div class="eyebrow"><span></span> Performance breakdown</div><h2>Where you stand</h2></div></div><div class="category-grid">${categoryCards}</div></section>
    <section class="learning-section">
      <div><div class="eyebrow"><span></span> Personalized feedback</div><h2>Your next step</h2></div>
      <div class="learning-grid">
        <div><span class="learning-icon">↑</span><div><h3>Strength to build on</h3><p>Your strongest area is <b>${escapeHtml(strongest)}</b>. Continue challenging yourself with more advanced texts and authentic materials.</p></div></div>
        <div><span class="learning-icon">◎</span><div><h3>Priority for improvement</h3><p><b>${escapeHtml(weakest)}</b> has the most room to grow. ${levelInfo[result.level].next}</p></div></div>
      </div>
      <div class="method-note"><b>How your level was estimated</b><p>We combine weighted accuracy across A1–C2 questions with performance consistency and competency balance. This is an estimate of reading and language knowledge, not an official qualification.</p></div>
    </section>
    <section class="review-section">
      <div class="review-header"><div><div class="eyebrow"><span></span> Question review</div><h2>Learn from every answer</h2></div><button class="text-button" data-action="retake">Retake assessment</button></div>
      <div class="filters">${filters}</div>
      <div class="review-list">${renderReviews()}</div>
    </section>
    <footer class="results-footer"><button class="secondary" data-action="home">Back to home</button><button class="primary" data-action="retake">Retake assessment <span>→</span></button></footer>
  </main>`
}

function renderReviews() {
  return questions.filter(question => {
    if (reviewFilter === 'correct') return answers[question.id] === question.answer
    if (reviewFilter === 'incorrect') return answers[question.id] !== undefined && answers[question.id] !== question.answer
    if (reviewFilter === 'unanswered') return answers[question.id] === undefined
    return true
  }).map(question => {
    const selected = answers[question.id]
    const status = selected === undefined ? 'unanswered' : selected === question.answer ? 'correct' : 'incorrect'
    const statusLabel = status === 'correct' ? '✓ Correct' : status === 'incorrect' ? '× Incorrect' : '— Unanswered'
    const choices = question.choices.map((choice, choiceIndex) => {
      const className = choiceIndex === question.answer ? 'answer correct-answer' : choiceIndex === selected ? 'answer selected-answer' : 'answer'
      return `<div class="${className}"><span>${String.fromCharCode(65 + choiceIndex)}</span>${escapeHtml(choice)}</div>`
    }).join('')
    const passage = question.passage ? `<p class="review-passage">${escapeHtml(question.passage)}</p>` : ''
    return `<article class="review-card ${status}">
      <div class="review-status">${statusLabel}<span>Question ${question.id} · CEFR ${question.level}</span></div>
      <h3>${escapeHtml(question.prompt)}</h3>${passage}
      <div class="answer-grid">${choices}</div>
      <div class="explanation"><b>Explanation</b><p>${escapeHtml(question.explanation)}</p><small><b>Concept:</b> ${escapeHtml(question.concept)}</small><small><b>Example:</b> ${escapeHtml(question.example)}</small></div>
    </article>`
  }).join('')
}

function render() {
  const content = page === 'home' ? homePage()
    : page === 'instructions' ? instructionsPage()
      : page === 'assessment' ? assessmentPage()
        : page === 'complete' ? completionPage()
          : resultsPage()
  root.innerHTML = `<div class="app-shell">${page === 'assessment' ? '' : header()}${content}</div>`
}

root.addEventListener('click', event => {
  const button = event.target.closest('[data-action]')
  if (!button || !root.contains(button) || button.disabled) return

  switch (button.dataset.action) {
    case 'home':
      navigate('home')
      break
    case 'instructions':
      navigate('instructions')
      break
    case 'begin':
      navigate('assessment')
      break
    case 'answer':
      answers[questions[index].id] = Number(button.dataset.choice)
      saveAnswers()
      render()
      break
    case 'previous':
      index = Math.max(0, index - 1)
      render()
      break
    case 'next':
      index = Math.min(questions.length - 1, index + 1)
      render()
      break
    case 'submit':
      navigate('complete')
      break
    case 'results':
      navigate('results')
      break
    case 'filter':
      reviewFilter = button.dataset.filter
      render()
      break
    case 'retake':
      answers = {}
      index = 0
      reviewFilter = 'all'
      saveAnswers()
      navigate('assessment')
      break
  }
})

render()
