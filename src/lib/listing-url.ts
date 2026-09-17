export function normalizeListingUrl(value: string): string {
  const rawValue = value.trim();
  const withProtocol = rawValue.match(/^https?:\/\//i) ? rawValue : `https://${rawValue}`;
  const parsed = new URL(withProtocol);
  parsed.protocol = 'https:';
  parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  parsed.hash = '';
  parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
  return parsed.toString();
}