import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function AdminTaskHistory() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(nextPage = page) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ status, search, page: String(nextPage), limit: '50' });
      const data = await api(`/admin/task-history?${params.toString()}`);
      setRows(data.rows);
      setTotal(data.total);
      setPage(data.page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [status]);

  function submit(event) {
    event.preventDefault();
    load(1);
  }

  const maxPage = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="page-stack">
      <section className="panel page-heading">
        <h2>Task history</h2>
        <p>Review per-user watch progress, completion status, reward payment, IP address, and device details.</p>
      </section>
      {error && <div className="alert">{error}</div>}
      <section className="panel">
        <form className="toolbar" onSubmit={submit}>
          {['all', 'completed', 'incomplete', 'rewarded'].map((item) => (
            <button type="button" key={item} className={status === item ? 'chip active' : 'chip'} onClick={() => setStatus(item)}>{item}</button>
          ))}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user, video, or IP" />
          <button className="secondary">Search</button>
        </form>
        <div className="admin-list">
          {loading && <p className="muted">Loading task history...</p>}
          {!loading && rows.map((item) => (
            <article className="history-row" key={item._id}>
              <div>
                <strong>{item.user?.email || 'Unknown user'}</strong>
                <span>{item.user?.username || 'No username'}{item.user?.isSuspended ? ' - Suspended' : ''}</span>
              </div>
              <div>
                <strong>{item.video?.title || 'Deleted video'}</strong>
                <span>${Number(item.video?.reward || 0).toFixed(2)} reward - {item.video?.durationSeconds || 0}s target</span>
              </div>
              <div>
                <strong>{item.completed ? 'Completed' : 'Incomplete'}</strong>
                <span>{Math.round(item.percent || 0)}% - {Math.round(item.watchedSeconds || 0)}s watched</span>
              </div>
              <div>
                <strong>{item.rewardPaid ? 'Reward paid' : 'No reward'}</strong>
                <span>{item.completedAt ? new Date(item.completedAt).toLocaleString() : 'Not completed'}</span>
              </div>
              <div>
                <strong>{item.ipAddress || 'No IP'}</strong>
                <span title={item.userAgent || ''}>{item.userAgent ? item.userAgent.slice(0, 80) : 'No device data'}</span>
              </div>
            </article>
          ))}
          {!loading && !rows.length && <p className="muted">No task history found.</p>}
        </div>
        <div className="pagination-bar">
          <button className="secondary" disabled={page <= 1} onClick={() => load(page - 1)}>Previous</button>
          <span>Page {page} of {maxPage} - {total} records</span>
          <button className="secondary" disabled={page >= maxPage} onClick={() => load(page + 1)}>Next</button>
        </div>
      </section>
    </div>
  );
}
