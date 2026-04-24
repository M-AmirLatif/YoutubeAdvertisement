import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { copyText } from '../utils/clipboard.js';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');

  async function load() {
    const data = await api('/transactions/admin/all');
    setTransactions(data.transactions);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    await api(`/transactions/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  }

  function actionsFor(tx) {
    if (tx.status !== 'pending') return [];
    if (tx.type === 'deposit') return [{ status: 'approved', label: 'Approve' }, { status: 'rejected', label: 'Reject', danger: true }];
    if (tx.type === 'withdrawal') return [{ status: 'paid', label: 'Mark paid' }, { status: 'rejected', label: 'Reject', danger: true }];
    return [];
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
                <span>{tx.plan || 'No plan selected'}</span>
                {tx.proof && <span>Payment reference: {tx.proof}</span>}
                {tx.walletAddress && <span>Wallet: {tx.walletAddress}</span>}
                {tx.network && <span>Network: {tx.network}</span>}
              </div>
              <div className="row-actions">
                {tx.type === 'withdrawal' && tx.walletAddress && (
                  <button className="secondary" type="button" onClick={() => copyText(tx.walletAddress, 'Withdrawal wallet copied')}>
                    Copy wallet
                  </button>
                )}
                {tx.status === 'pending' ? (
                  <>
                    {actionsFor(tx).map((action) => (
                      <button
                        key={action.status}
                        className={action.danger ? 'danger' : 'secondary'}
                        onClick={() => setStatus(tx._id, action.status)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 'bold' }}>Finalized</span>
                  </>
                )}
              </div>
            </article>
          ))}
          {!visible.length && <p className="muted">No matching requests.</p>}
        </div>
      </section>
    </div>
  );
}
