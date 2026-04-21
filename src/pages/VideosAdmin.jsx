import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function VideosAdmin() {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({ title: '', youtubeUrl: '', reward: 0.25, durationSeconds: 30 });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

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
    try {
      if (editingId) {
        await api(`/videos/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/videos', { method: 'POST', body: JSON.stringify(form) });
      }
      setForm({ title: '', youtubeUrl: '', reward: 0.25, durationSeconds: 30 });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(video) {
    setEditingId(video._id);
    setForm({
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      reward: video.reward,
      durationSeconds: video.durationSeconds
    });
  }

  async function remove(id) {
    await api(`/videos/${id}`, { method: 'DELETE' });
    load();
  }

  async function toggle(video) {
    await api(`/videos/${video._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !video.isActive }) });
    load();
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-title"><span>Admin video link and task management</span></div>
        <form className="form compact" onSubmit={submit}>
          {error && <div className="alert">{error}</div>}
          <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>YouTube URL<input required value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} /></label>
          <label>Reward<input type="number" min="0" step="0.01" value={form.reward} onChange={(e) => setForm({ ...form, reward: Number(e.target.value) })} /></label>
          <label>Duration seconds<input type="number" min="1" value={form.durationSeconds} onChange={(e) => setForm({ ...form, durationSeconds: Number(e.target.value) })} /></label>
          <button className="primary">{editingId ? 'Save video' : 'Add video'}</button>
          {editingId && <button className="secondary" type="button" onClick={() => {
            setEditingId(null);
            setForm({ title: '', youtubeUrl: '', reward: 0.25, durationSeconds: 30 });
          }}>Cancel</button>}
        </form>
      </section>
      <section className="panel">
        <div className="table-list">
          {videos.map((video) => (
            <div key={video._id} className="table-row">
              <span>{video.title}</span>
              <strong>${video.reward.toFixed(2)} · {video.isActive ? 'Active' : 'Inactive'}</strong>
              <button className="secondary" onClick={() => edit(video)}>Edit</button>
              <button className="secondary" onClick={() => toggle(video)}>{video.isActive ? 'Pause' : 'Activate'}</button>
              <button className="danger" onClick={() => remove(video._id)}>Delete</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
