import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Deposit() {
  const [plans, setPlans] = useState([]);
  const [minWithdrawal, setMinWithdrawal] = useState(5);
  const [depositWallet, setDepositWallet] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('USDT-TRC20');
  const [proof, setProof] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/transactions/plans').then(({ plans, minWithdrawal, depositWallet }) => {
      setPlans(plans);
      setMinWithdrawal(minWithdrawal);
      setDepositWallet(depositWallet);
    });
  }, []);

  async function deposit(plan) {
    setMessage('');
    setError('');
    try {
      const response = await api('/transactions/deposit', {
        method: 'POST',
        body: JSON.stringify({ planName: plan.name, amount: plan.price, walletAddress, network, proof })
      });
      setMessage(`${response.plan.name} deposit request is pending admin review.`);
      setProof('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function withdraw(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await api('/transactions/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount: withdrawAmount, walletAddress, network })
      });
      setMessage('Withdrawal request submitted.');
      setWithdrawAmount('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-stack">
      {message && <div className="success">{message}</div>}
      {error && <div className="alert">{error}</div>}
      <section className="panel page-heading">
        <h2>Deposits and withdrawals</h2>
        <p>Deposit requests require a transaction hash or payment proof. Minimum withdrawal is ${minWithdrawal.toFixed(2)}.</p>
      </section>
      <section className="plans-grid">
        {plans.map((plan) => (
          <article key={plan.name} className="plan-card">
            <span>{plan.name}</span>
            <strong>${plan.price}</strong>
            <p>{plan.dailyLimit} daily videos</p>
            <p>${plan.rewardPerVideo.toFixed(2)} reward per video</p>
            <button className="primary" onClick={() => deposit(plan)}>Choose plan</button>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-title"><span>USDT wallet</span></div>
        {depositWallet && <div className="copy-box">Platform deposit wallet: {depositWallet}</div>}
        <div className="form compact">
          <label>Network
            <select value={network} onChange={(e) => setNetwork(e.target.value)}>
              <option value="USDT-TRC20">USDT-TRC20</option>
              <option value="USDT-BEP20">USDT-BEP20</option>
              <option value="USDT-ERC20">USDT-ERC20</option>
            </select>
          </label>
          <label>Transaction hash / proof<input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="Required for deposit requests" /></label>
        </div>
        <label className="wide-label">Wallet address<input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="TRC20 or BEP20 wallet address" /></label>
      </section>

      <section className="panel">
        <div className="section-title"><span>Withdraw funds</span></div>
        <form className="inline-form" onSubmit={withdraw}>
          <input type="number" min={minWithdrawal} step="0.01" required value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder={`Minimum $${minWithdrawal.toFixed(2)}`} />
          <button className="primary">Request withdrawal</button>
        </form>
      </section>
    </div>
  );
}
