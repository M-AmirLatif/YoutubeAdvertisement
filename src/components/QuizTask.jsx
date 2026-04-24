import { useState } from 'react';
import { CheckCircle2, PlayCircle, XCircle } from 'lucide-react';
import { api } from '../api.js';

export default function QuizTask({ quiz, progress, onComplete }) {
  const [active, setActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const completed = progress?.completed;

  if (!active && !completed) {
    return (
      <article className="video-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{quiz.title}</h3>
            <div className="muted">{quiz.questions.length} Multiple Choice Questions</div>
          </div>
          <div className="status"><PlayCircle size={18} /> Ready</div>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ color: 'var(--brand-green)' }}>${quiz.reward.toFixed(2)} reward</strong>
          <button className="primary" onClick={() => setActive(true)}>Start Quiz</button>
        </div>
      </article>
    );
  }

  if (completed) {
    return (
      <article className="video-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{quiz.title}</h3>
            <div className="muted">Score: {progress.score} / {progress.totalQuestions}</div>
          </div>
          <div className="status done"><CheckCircle2 size={18} /> Completed</div>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <strong style={{ color: 'var(--brand-green)' }}>Reward Credited</strong>
        </div>
      </article>
    );
  }

  const question = quiz.questions[currentIndex];

  async function handleOptionSelect(optIndex) {
    if (feedback !== null || submitting) return; // Wait until they click next

    setSubmitting(true);
    try {
      const { correct, correctOptionIndex } = await api(`/quizzes/${quiz._id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ questionIndex: currentIndex, answerIndex: optIndex })
      });
      
      const newAnswers = [...answers];
      newAnswers[currentIndex] = optIndex;
      setAnswers(newAnswers);

      setFeedback({
        selected: optIndex,
        correct,
        correctOptionIndex
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFeedback(null);
    } else {
      // Submit the whole quiz
      setSubmitting(true);
      try {
        const result = await api(`/quizzes/${quiz._id}/submit`, {
          method: 'POST',
          body: JSON.stringify({ answers })
        });
        onComplete(quiz._id, result.progress);
      } catch (err) {
        setError(err.message);
        setSubmitting(false);
      }
    }
  }

  return (
    <article className="video-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', margin: 0 }}>{quiz.title}</h3>
        <span className="muted" style={{ fontSize: '14px' }}>Question {currentIndex + 1} of {quiz.questions.length}</span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <strong style={{ fontSize: '18px', display: 'block', marginBottom: '16px' }}>{question.questionText}</strong>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((opt, i) => {
            let bgColor = 'var(--bg-app)';
            let borderColor = 'var(--border)';
            let icon = null;

            if (feedback) {
              if (feedback.correctOptionIndex === i) {
                bgColor = 'rgba(16, 185, 129, 0.1)';
                borderColor = 'var(--brand-green)';
                icon = <CheckCircle2 size={18} color="var(--brand-green)" />;
              } else if (feedback.selected === i && !feedback.correct) {
                bgColor = 'rgba(239, 68, 68, 0.1)';
                borderColor = 'var(--brand-red)';
                icon = <XCircle size={18} color="var(--brand-red)" />;
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleOptionSelect(i)}
                disabled={feedback !== null || submitting}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  textAlign: 'left',
                  cursor: feedback !== null ? 'default' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span>{opt}</span>
                {icon}
              </button>
            );
          })}
        </div>
      </div>

      {error && <div className="mini-alert" style={{ marginBottom: '16px' }}>{error}</div>}

      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="progress-track" style={{ width: '60%', margin: 0 }}>
          <span style={{ width: `${((currentIndex) / quiz.questions.length) * 100}%` }} />
        </div>
        {feedback !== null && (
          <button className="primary" onClick={handleNext} disabled={submitting}>
            {currentIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish & Claim Reward'}
          </button>
        )}
      </div>
    </article>
  );
}
