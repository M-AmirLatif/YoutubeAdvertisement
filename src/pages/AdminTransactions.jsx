import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');
  const [notes, setNotes] = useState({});

  async function load() {
    const data = await api('/transactions/admin/all');
    setTransactions(data.transactions);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    await api(`/transactions/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, notes: notes[id] || '' }) });
    load();
  }

  const visible = transactions.filter((tx) => filter === 'all' || tx.type === filter || tx.status === filter);

  return (
    <div className="page-stack">
      <section className="panel page-heading">
        <h2>Deposit and withdrawal requests</h2>
        <p>Approve deposits, mark withdrawals paid, or reject requests.</p>
      </section>
      <section className="panel">
        <div className="toolbar">
          {['all', 'pending', 'deposit', 'withdrawal', 'approved', 'paid', 'rejected'].map((item) => (
            <button key={item} className={filter === item ? 'chip active' : 'chip'} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
        <div className="admin-list">
          {visible.map((tx) => (
            <article className="admin-row transaction-row" key={tx._id}>
              <div>
                <strong>{tx.type} - ${tx.amount.toFixed(2)}</strong>
                <span>{tx.user?.email || 'Unknown user'}</span>
              </div>
              <div>
                <strong>{tx.status}</strong>
                <span>{tx.plan || tx.walletAddress || 'No wallet provided'}</span>
                {tx.proof && <span>Proof: {tx.proof}</span>}
                {tx.network && <span>{tx.network}</span>}
              </div>
              <div className="row-actions">
                <input value={notes[tx._id] || ''} onChange={(e) => setNotes({ ...notes, [tx._id]: e.target.value })} placeholder="Admin note" />
                <button className="secondary" onClick={() => setStatus(tx._id, 'approved')}>Approve</button>
                <button className="secondary" onClick={() => setStatus(tx._id, 'paid')}>Paid</button>
                <button className="danger" onClick={() => setStatus(tx._id, 'rejected')}>Reject</button>
              </div>
            </article>
          ))}
          {!visible.length && <p className="muted">No matching requests.</p>}
        </div>
      </section>
    </div>
  );
}
