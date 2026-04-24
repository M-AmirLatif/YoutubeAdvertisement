import { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { api } from '../api.js';
import { copyText } from '../utils/clipboard.js';

export default function Deposit() {
  const [plans, setPlans] = useState([]);
  const [depositWallet, setDepositWallet] = useState('');
  const [depositWallets, setDepositWallets] = useState({});
  const [network, setNetwork] = useState('USDT-TRC20');
  const [proof, setProof] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  const enabledNetworks = Object.keys(depositWallets).filter((key) => depositWallets[key] || depositWallet);
  const networkOptions = enabledNetworks.length ? enabledNetworks : ['USDT-TRC20', 'USDT-BEP20'];
  const activeWallet = depositWallets[network] || depositWallet;
  const amount = selectedPlan?.price || 0;

  const displayPlans = useMemo(() => plans.map((plan) => ({
    ...plan,
    dailyPercent: plan.price === 0 ? '$0.10 Daily' : `${Math.max(1, plan.rewardPerVideo).toFixed(2)}% Daily`
  })), [plans]);

  useEffect(() => {
    Promise.all([
      api('/transactions/plans'),
      api('/transactions')
    ]).then(([planData, txData]) => {
      setPlans(planData.plans);
      setDepositWallet(planData.depositWallet);
      setDepositWallets(planData.depositWallets || {});
      const networks = Object.keys(planData.depositWallets || {}).filter((key) => planData.depositWallets[key] || planData.depositWallet);
      if (networks[0]) setNetwork(networks[0]);
      setTransactions(txData.transactions.filter((tx) => tx.type === 'deposit'));
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  async function submitDeposit(event) {
    event.preventDefault();
    if (!selectedPlan) return;
    setMessage('');
    setError('');
    try {
      const response = await api('/transactions/deposit', {
        method: 'POST',
        body: JSON.stringify({ planName: selectedPlan.name, amount, network, proof })
      });
      setMessage(response.transaction.status === 'approved'
        ? `${response.plan.name} plan activated.`
        : `${response.plan.name} deposit request is pending admin review.`);
      setProof('');
      const txData = await api('/transactions');
      setTransactions(txData.transactions.filter((tx) => tx.type === 'deposit'));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="funds-layout">
      <section>
        <h1 className="page-title">Add Funds</h1>
        <h2 className="sub-title">Select a Plan Amount</h2>
        {error && <div className="alert">{error}</div>}
        {message && <div className="success">{message}</div>}
        <div className="fund-plans-grid">
          {loading && <div className="empty-state">Loading plans...</div>}
          {displayPlans.map((plan) => (
            <button
              key={plan.name}
              type="button"
              className={`fund-plan-card ${selectedPlan?.name === plan.name ? 'selected' : ''}`}
              onClick={() => {
                setSelectedPlan(plan);
                setMessage('');
                setError('');
              }}
            >
              <strong>{plan.price === 0 ? 'FREE' : `$${plan.price}`}</strong>
              <span>{plan.name} Plan</span>
              <em>{plan.dailyPercent}</em>
            </button>
          ))}
        </div>
      </section>

      <aside className="payment-card">
        <h2>Payment Details</h2>
        <div className="wallet-box">
          <span>Send USDT ({network.replace('USDT-', '')}) to:</span>
          <strong>{activeWallet || 'Wallet not configured'}</strong>
          <button type="button" onClick={() => activeWallet && copyText(activeWallet, 'Wallet address copied')}>
            <Copy size={17} /> Copy Address
          </button>
        </div>
        <form className="payment-form" onSubmit={submitDeposit}>
          <label>Network
            <select value={network} onChange={(event) => setNetwork(event.target.value)}>
              {networkOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>Amount (USDT)
            <input value={amount.toFixed(2)} readOnly />
          </label>
          <label>Transaction Hash / Proof
            <input required={amount > 0} value={proof} onChange={(event) => setProof(event.target.value)} placeholder={amount > 0 ? 'Paste transaction hash' : 'No payment needed for free plan'} />
          </label>
          <button className="primary" disabled={!selectedPlan}>{amount > 0 ? 'Submit Deposit' : 'Activate Free Plan'}</button>
        </form>
      </aside>

      <section style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
        <h2 className="sub-title">Recent Deposits</h2>
        <div className="request-table">
          <div className="request-row header">
            <strong>Date</strong><strong>Amount</strong><strong>Status</strong>
          </div>
          {transactions.slice(0, 8).map((tx) => (
            <div className="request-row" key={tx._id}>
              <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
              <span>${Number(tx.amount).toFixed(2)}</span>
              <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: tx.status === 'rejected' ? '#f87171' : 'inherit' }}>{tx.status}</span>
            </div>
          ))}
          {!transactions.length && <p>No deposits yet.</p>}
        </div>
      </section>
    </div>
  );
}
