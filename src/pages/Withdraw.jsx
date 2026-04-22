import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Withdraw() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [minWithdrawal, setMinWithdrawal] = useState(5);
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('USDT-TRC20');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api('/transactions/plans'),
      api('/transactions')
    ]).then(([planData, txData]) => {
      setMinWithdrawal(planData.minWithdrawal);
      setTransactions(txData.transactions.filter((tx) => tx.type === 'withdrawal'));
    }).catch((err) => setError(err.message));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await api('/transactions/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, walletAddress, network })
      });
      const data = await api('/transactions');
      setTransactions(data.transactions.filter((tx) => tx.type === 'withdrawal'));
      await refreshUser();
      setMessage('Withdrawal request submitted.');
      setAmount('');
      setWalletAddress('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="withdraw-layout">
      <section>
        <h1 className="page-title">Withdraw Funds</h1>
        {message && <div className="success">{message}</div>}
        {error && <div className="alert">{error}</div>}
        <div className="balance-panel">
          <span>Available Balance</span>
          <strong>${(user?.balance || 0).toFixed(2)}</strong>
          <small><Lock size={18} fill="currentColor" /> Min Withdraw: ${minWithdrawal.toFixed(2)}</small>
        </div>

        <form className="request-card" onSubmit={submit}>
          <h2>Request Payout</h2>
          <label>Amount (USDT)
            <input type="number" min={minWithdrawal} step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" />
          </label>
          <label>Network
            <select value={network} onChange={(event) => setNetwork(event.target.value)}>
              <option value="USDT-TRC20">USDT-TRC20</option>
              <option value="USDT-BEP20">USDT-BEP20</option>
            </select>
          </label>
          <label>Your Wallet Address
            <input required value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} placeholder="Enter wallet address" />
          </label>
          <button className="primary">Submit Request</button>
        </form>
      </section>

      <section>
        <h2 className="sub-title">Recent Requests</h2>
        <div className="request-table">
          <div className="request-row header"><strong>Date</strong><strong>Amount</strong><strong>Status</strong></div>
          {transactions.slice(0, 8).map((tx) => (
            <div className="request-row" key={tx._id}>
              <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
              <span>${Number(tx.amount).toFixed(2)}</span>
              <span>{tx.status}</span>
            </div>
          ))}
          {!transactions.length && <p>No withdrawals yet.</p>}
        </div>
      </section>
    </div>
  );
}
