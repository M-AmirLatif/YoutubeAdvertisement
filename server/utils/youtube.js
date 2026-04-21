export function extractYoutubeId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
    if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
    const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1];
  } catch {
    return '';
  }
  return '';
}

export function makeReferralCode(username) {
  const prefix = username.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase() || 'USER';
  return `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
