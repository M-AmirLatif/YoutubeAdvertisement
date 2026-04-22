export async function copyText(text, message = 'Copied') {
  await navigator.clipboard.writeText(text);
  window.dispatchEvent(new CustomEvent('app:copied', { detail: { message } }));
}
