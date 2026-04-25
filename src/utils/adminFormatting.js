function formatCurrency(value) {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2)}`;
}

function formatAction(action) {
  const labels = {
    'video.create': 'Task added',
    'video.update': 'Task updated',
    'video.delete': 'Task removed',
    'video.archive': 'Task removed',
    'video.deactivate': 'Task removed',
    'transaction.approved': 'Deposit approved',
    'transaction.paid': 'Withdrawal paid',
    'transaction.rejected': 'Request rejected',
    'transaction.pending': 'Request marked pending',
    'user.update': 'User updated',
    'user.passwordReset.admin': 'Password reset by admin'
  };

  return labels[action] || action.replaceAll('.', ' ').replaceAll('_', ' ');
}

function formatTargetType(targetType) {
  return {
    Video: 'Task / video',
    Transaction: 'Money request',
    User: 'User account',
    Progress: 'Task progress'
  }[targetType] || targetType;
}

function formatActor(actor) {
  return actor?.username || 'Unknown admin';
}

function formatClientInfo(value, fallback) {
  if (!value) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === '::1' || normalized === '127.0.0.1' || normalized === 'localhost') return 'Local machine';
  if (normalized.includes('node')) return 'Server automation';
  if (normalized.includes('chrome')) return 'Chrome browser';
  if (normalized.includes('firefox')) return 'Firefox browser';
  if (normalized.includes('safari')) return 'Safari browser';
  if (normalized.includes('edge')) return 'Edge browser';
  return value;
}

function formatDetails(details) {
  if (!details || typeof details !== 'object') return 'No extra details.';

  const pieces = [];
  if (details.title) pieces.push(`Title: ${details.title}`);
  if (details.username) pieces.push(`Username: ${details.username}`);
  if (details.type) pieces.push(`Type: ${details.type}`);
  if (details.status) pieces.push(`Status: ${details.status}`);
  if (details.previousStatus) pieces.push(`Previous status: ${details.previousStatus}`);
  if (details.amount !== undefined) pieces.push(`Amount: ${formatCurrency(details.amount)}`);
  if (details.reward !== undefined) pieces.push(`Reward: ${formatCurrency(details.reward)}`);
  if (details.balance !== undefined) pieces.push(`Balance: ${formatCurrency(details.balance)}`);
  if (details.durationSeconds !== undefined) pieces.push(`Duration: ${details.durationSeconds}s`);
  if (details.notes) pieces.push(`Note: ${details.notes}`);
  if (details.deletedProgress !== undefined) pieces.push(`Removed progress rows: ${details.deletedProgress}`);
  if (details.isActive !== undefined) pieces.push(`Visible to users: ${details.isActive ? 'Yes' : 'No'}`);

  if (!pieces.length) return 'No extra details.';
  return pieces.join(' • ');
}

export {
  formatAction,
  formatActor,
  formatClientInfo,
  formatDetails,
  formatTargetType
};
