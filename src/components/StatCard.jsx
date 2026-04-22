export default function StatCard({ label, value, hint, tone = 'blue', icon: Icon }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
      {Icon && <div className="stat-icon"><Icon size={34} /></div>}
    </article>
  );
}
