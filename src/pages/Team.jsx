import { useEffect, useMemo, useState } from 'react';
import { Network, UsersRound, WalletCards } from 'lucide-react';
import { api } from '../api.js';

export default function Team() {
  const [team, setTeam] = useState(null);
  const [activeLevel, setActiveLevel] = useState('level1');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/users/team').then(setTeam).catch((err) => setError(err.message));
  }, []);

  const members = useMemo(() => team?.levels?.[activeLevel] || [], [team, activeLevel]);
  const stats = team?.stats || { level1: 0, level2: 0, total: 0, referralEarnings: 0 };

  return (
    <div className="team-page">
      <h1 className="page-title">Team Overview</h1>
      {error && <div className="alert">{error}</div>}
      <section className="team-stats">
        <article className="team-stat blue">
          <UsersRound size={70} />
          <span>Level 1 Members</span>
          <strong>{stats.level1}</strong>
          <small>Direct Referrals</small>
        </article>
        <article className="team-stat green">
          <Network size={70} />
          <span>Team Network</span>
          <strong>{stats.total}</strong>
          <small>Total Members (L1 + L2)</small>
        </article>
        <article className="team-stat cyan">
          <WalletCards size={70} />
          <span>Referral Earnings</span>
          <strong>${Number(stats.referralEarnings || 0).toFixed(2)}</strong>
          <small>Total plan-purchase referral rewards</small>
        </article>
      </section>

      <section className="team-panel">
        <div className="team-tabs">
          <button className={activeLevel === 'level1' ? 'active' : ''} onClick={() => setActiveLevel('level1')}>Level 1 ({stats.level1})</button>
          <button className={activeLevel === 'level2' ? 'active' : ''} onClick={() => setActiveLevel('level2')}>Level 2 ({stats.level2})</button>
        </div>
        <div className="team-members">
          {members.map((member) => (
            <article className="member-row" key={member._id}>
              <strong>{member.username}</strong>
              <span>{member.email}</span>
              <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
            </article>
          ))}
          {!members.length && (
            <div className="team-empty">
              <UsersRound size={72} />
              <p>No members found in this level yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
