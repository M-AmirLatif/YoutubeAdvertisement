import { useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyForm = { title: '', description: '', videoUrl: '', channelUrl: '', order: 0 };

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const data = await api.courses.list();
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
        await api.courses.update(editingId, form);
        setMessage('Course updated.');
      } else {
        await api.courses.create(form);
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
      order: course.order
    });
  }

  async function remove(course) {
    if (!window.confirm(`Permanently remove "${course.title}"?`)) return;
    setError('');
    setMessage('');
    try {
      await api.courses.delete(course._id);
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
          <label>YouTube Embed URL<input required value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." /></label>
          <label>YouTube Channel URL<input value={form.channelUrl} onChange={(e) => setForm({ ...form, channelUrl: e.target.value })} placeholder="https://youtube.com/@Channel" /></label>
          <label>Order (Sorting)<input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></label>
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
                <strong>Order: {course.order}</strong>
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
