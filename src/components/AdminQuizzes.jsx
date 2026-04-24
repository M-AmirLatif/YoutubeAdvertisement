import { useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyQuestion = { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 };
const emptyForm = { title: '', reward: 0.5, isActive: true, questions: [{ ...emptyQuestion }] };

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const data = await api('/quizzes/admin/all');
      setQuizzes(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await api(`/quizzes/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        setMessage('MCQ Task updated.');
      } else {
        await api('/quizzes', { method: 'POST', body: JSON.stringify(form) });
        setMessage('MCQ Task added.');
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(quiz) {
    setEditingId(quiz._id);
    setError('');
    setMessage('');
    setForm({
      title: quiz.title,
      reward: quiz.reward,
      isActive: quiz.isActive,
      questions: quiz.questions.map(q => ({
        questionText: q.questionText,
        options: [...q.options],
        correctOptionIndex: q.correctOptionIndex
      }))
    });
  }

  async function remove(quiz) {
    if (!window.confirm(`Permanently remove "${quiz.title}"?`)) return;
    setError('');
    setMessage('');
    try {
      await api(`/quizzes/${quiz._id}`, { method: 'DELETE' });
      setMessage('MCQ Task removed.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggle(quiz) {
    if (!window.confirm(`Are you sure you want to ${quiz.isActive ? 'pause' : 'activate'} "${quiz.title}"?`)) return;
    setError('');
    setMessage('');
    try {
      await api(`/quizzes/${quiz._id}`, { method: 'PUT', body: JSON.stringify({ ...quiz, isActive: !quiz.isActive }) });
      setMessage(quiz.isActive ? 'Task paused.' : 'Task activated.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setMessage('');
  }

  function addQuestion() {
    setForm({ ...form, questions: [...form.questions, { ...emptyQuestion }] });
  }

  function removeQuestion(index) {
    const q = [...form.questions];
    q.splice(index, 1);
    setForm({ ...form, questions: q });
  }

  function updateQuestion(index, field, value) {
    const q = [...form.questions];
    q[index][field] = value;
    setForm({ ...form, questions: q });
  }

  function updateOption(qIndex, optIndex, value) {
    const q = [...form.questions];
    q[qIndex].options[optIndex] = value;
    setForm({ ...form, questions: q });
  }

  return (
    <div>
      <section className="panel">
        <div className="section-title"><span>{editingId ? 'Edit MCQ Task' : 'Create New MCQ Task'}</span></div>
        <form className="form compact" onSubmit={submit}>
          {error && <div className="alert" style={{ gridColumn: '1 / -1' }}>{error}</div>}
          {message && <div className="success" style={{ gridColumn: '1 / -1' }}>{message}</div>}
          <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. YouTube Marketing Quiz" /></label>
          <label>Reward ($)<input type="number" min="0" step="0.01" value={form.reward} onChange={(e) => setForm({ ...form, reward: Number(e.target.value) })} /></label>
          
          <div className="nav-divider section-span-full" style={{ marginTop: '20px', marginBottom: '20px' }}>Questions</div>
          
          {form.questions.map((q, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-card-header">
                <strong>Question {qIndex + 1}</strong>
                {form.questions.length > 1 && (
                  <button type="button" className="danger" onClick={() => removeQuestion(qIndex)} style={{ padding: '4px 8px', fontSize: '12px' }}>Remove</button>
                )}
              </div>
              <label>Question Text<input required value={q.questionText} onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)} /></label>
              
              <div className="question-options-grid">
                {q.options.map((opt, optIndex) => (
                  <label key={optIndex} className="question-option">
                    <input 
                      type="radio" 
                      name={`correct-${qIndex}`} 
                      checked={q.correctOptionIndex === optIndex} 
                      onChange={() => updateQuestion(qIndex, 'correctOptionIndex', optIndex)}
                    />
                    <input 
                      type="text"
                      required 
                      value={opt} 
                      onChange={(e) => updateOption(qIndex, optIndex, e.target.value)} 
                      placeholder={`Option ${optIndex + 1}`}
                    />
                  </label>
                ))}
              </div>
              <div className="muted" style={{ fontSize: '11px', marginTop: '4px' }}>Select the radio button next to the correct answer.</div>
            </div>
          ))}

          <button type="button" className="secondary section-span-full" onClick={addQuestion} style={{ marginBottom: '20px' }}>+ Add Question</button>

          <label>Status
            <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}>
              <option value="active">Active for users</option>
              <option value="inactive">Hidden from users</option>
            </select>
          </label>
          <div className="segmented-actions section-span-full">
            <button className="primary">{editingId ? 'Save MCQ Task' : 'Add MCQ Task'}</button>
            {editingId && <button className="secondary" type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="section-title"><span>All MCQ Tasks</span></div>
        <div className="admin-list">
          {quizzes.map((quiz) => (
            <div key={quiz._id} className="video-admin-row">
              <div>
                <strong>{quiz.title}</strong>
                <span>{quiz.questions.length} Questions</span>
              </div>
              <div>
                <strong>${Number(quiz.reward || 0).toFixed(2)}</strong>
              </div>
              <em className={quiz.isActive ? 'status-pill active' : 'status-pill'}>{quiz.isActive ? 'Active' : 'Hidden'}</em>
              <div className="row-actions">
                <button className="secondary" onClick={() => edit(quiz)}>Edit</button>
                <button className="secondary" onClick={() => toggle(quiz)}>{quiz.isActive ? 'Pause' : 'Activate'}</button>
                <button className="danger" onClick={() => remove(quiz)}>Remove</button>
              </div>
            </div>
          ))}
          {!quizzes.length && <p className="muted">No MCQ tasks have been added yet.</p>}
        </div>
      </section>
    </div>
  );
}
