import { useEffect, useState } from 'react';
import { api } from '../api.js';
import AdminQuizzes from '../components/AdminQuizzes.jsx';

const emptyForm = { title: '', youtubeUrl: '', reward: 0.25, durationSeconds: 30, isActive: true };

export default function VideosAdmin() {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('video');

  async function load() {
    const data = await api('/videos/admin/all');
    setVideos(data.videos);
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
        await api(`/videos/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        setMessage('Task updated.');
      } else {
        await api('/videos', { method: 'POST', body: JSON.stringify(form) });
        setMessage('Task added.');
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(video) {
    setEditingId(video._id);
    setError('');
    setMessage('');
    setForm({
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      reward: video.reward,
      durationSeconds: video.durationSeconds,
      isActive: video.isActive
    });
  }

  async function archive(video) {
    if (!window.confirm(`Permanently remove "${video.title}" from videos, user tasks, and task history?`)) return;
    setError('');
    setMessage('');
    try {
      await api(`/videos/${video._id}`, { method: 'DELETE' });
      setMessage('Task permanently removed.');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggle(video) {
    if (!window.confirm(`Are you sure you want to ${video.isActive ? 'pause' : 'activate'} the task "${video.title}"?`)) return;
    setError('');
    setMessage('');
    try {
      await api(`/videos/${video._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !video.isActive }) });
      setMessage(video.isActive ? 'Task paused.' : 'Task activated.');
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

  return (
    <div className="page-stack">
      <section className="panel page-heading">
        <h2>Task Management</h2>
        <p>Add, edit, or archive tasks that users will complete for rewards.</p>
        <div className="segmented-actions">
          <button className={activeTab === 'video' ? 'primary' : 'secondary'} onClick={() => setActiveTab('video')}>Video Tasks</button>
          <button className={activeTab === 'mcq' ? 'primary' : 'secondary'} onClick={() => setActiveTab('mcq')}>MCQ Tasks</button>
        </div>
      </section>

      {activeTab === 'mcq' ? (
        <AdminQuizzes />
      ) : (
        <>
          <section className="panel">
            <form className="form compact task-admin-form" onSubmit={submit}>
          {error && <div className="alert">{error}</div>}
          {message && <div className="success">{message}</div>}
          <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>YouTube URL<input required value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} /></label>
          <label>Reward<input type="number" min="0" step="0.01" value={form.reward} onChange={(e) => setForm({ ...form, reward: Number(e.target.value) })} /></label>
          <label>Duration seconds<input type="number" min="1" value={form.durationSeconds} onChange={(e) => setForm({ ...form, durationSeconds: Number(e.target.value) })} /></label>
          <div className="task-admin-controls section-span-full">
            <label className="task-admin-status">Status
              <select value={form.isActive ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}>
                <option value="active">Active for users</option>
                <option value="inactive">Hidden from users</option>
              </select>
            </label>
            <div className="task-admin-buttons">
              <button className="primary">{editingId ? 'Save task' : 'Add task'}</button>
              {editingId && <button className="secondary" type="button" onClick={resetForm}>Cancel</button>}
            </div>
          </div>
        </form>
      </section>
      <section className="panel task-admin-list-panel">
        <div className="section-title"><span>All tasks</span></div>
        <div className="admin-list">
          {videos.map((video) => (
            <div key={video._id} className="video-admin-row">
              <div>
                <strong>{video.title}</strong>
                <span>{video.youtubeUrl}</span>
              </div>
              <div>
                <strong>${Number(video.reward || 0).toFixed(2)}</strong>
                <span>{video.durationSeconds}s required</span>
              </div>
              <em className={video.isActive ? 'status-pill active' : 'status-pill'}>{video.isActive ? 'Active' : 'Hidden'}</em>
              <div className="row-actions">
                <button className="secondary" onClick={() => edit(video)}>Edit</button>
                <button className="secondary" onClick={() => toggle(video)}>{video.isActive ? 'Pause' : 'Activate'}</button>
                <button className="danger" onClick={() => archive(video)}>Remove</button>
              </div>
            </div>
          ))}
          {!videos.length && <p className="muted">No tasks have been added yet.</p>}
        </div>
          </section>
        </>
      )}
    </div>
  );
}
