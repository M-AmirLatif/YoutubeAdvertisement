import { useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyForm = { title: '', description: '', videoUrl: '', channelUrl: '', driveUrl: '' };

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const data = await api('/courses');
      setCourses(data);
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
        await api(`/courses/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        setMessage('Course updated.');
      } else {
        await api('/courses', { method: 'POST', body: JSON.stringify(form) });
        setMessage('Course added.');
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function edit(course) {
    setEditingId(course._id);
    setError('');
    setMessage('');
    setForm({
      title: course.title,
      description: course.description,
      videoUrl: course.videoUrl,
      channelUrl: course.channelUrl,
      driveUrl: course.driveUrl
    });
  }

  async function remove(course) {
    if (!window.confirm(`Permanently remove "${course.title}"?`)) return;
    setError('');
    setMessage('');
    try {
      await api(`/courses/${course._id}`, { method: 'DELETE' });
      setMessage('Course removed.');
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
        <h2>Course Management</h2>
        <p>Add or edit YouTube automation course videos for users.</p>
      </section>
      <section className="panel">
        <form className="form compact" onSubmit={submit}>
          {error && <div className="alert">{error}</div>}
          {message && <div className="success">{message}</div>}
          <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="wide-label">Description<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label>YouTube Video Link<input required value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></label>
          <label>YouTube Channel Link<input value={form.channelUrl} onChange={(e) => setForm({ ...form, channelUrl: e.target.value })} placeholder="https://youtube.com/@Channel" /></label>
          <label>Google Drive Link<input value={form.driveUrl} onChange={(e) => setForm({ ...form, driveUrl: e.target.value })} placeholder="https://drive.google.com/..." /></label>
          <button className="primary">{editingId ? 'Save Course' : 'Add Course'}</button>
          {editingId && <button className="secondary" type="button" onClick={resetForm}>Cancel</button>}
        </form>
      </section>
      <section className="panel">
        <div className="section-title"><span>All Courses</span></div>
        <div className="admin-list">
          {courses.map((course) => (
            <div key={course._id} className="video-admin-row">
              <div>
                <strong>{course.title}</strong>
                <span>{course.videoUrl}</span>
              </div>
              <div>
                {course.driveUrl && <strong>Drive: {course.driveUrl}</strong>}
                <span>{course.description}</span>
              </div>
              <div className="row-actions">
                <button className="secondary" onClick={() => edit(course)}>Edit</button>
                <button className="danger" onClick={() => remove(course)}>Remove</button>
              </div>
            </div>
          ))}
          {!courses.length && <p className="muted">No courses have been added yet.</p>}
        </div>
      </section>
    </div>
  );
}
