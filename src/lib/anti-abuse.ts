// Simple URL & content safety validator for eltop.lat

const BLOCKED_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'grabify.link',
  'iplogger.org',
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'casino-spam.xyz',
];

const BLOCKED_WORDS = [
  '<script',
  'javascript:',
  'onerror=',
  'onload=',
  'eval(',
  'document.cookie',
];

export function sanitizeText(input: string): string {
  if (!input) return '';
  let clean = input.trim();
  // Strip dangerous characters & tags
  clean = clean.replace(/<[^>]*>?/gm, '');
  clean = clean.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#039;';
      default:
        return m;
    }
  });
  return clean;
}

export function validateListingInput(data: {
  name: string;
  tagline: string;
  url: string;
  email: string;
}): { isValid: boolean; error?: string } {
  if (!data.name || data.name.trim().length < 2) {
    return { isValid: false, error: 'El nombre debe tener al menos 2 caracteres.' };
  }
  if (data.name.length > 50) {
    return { isValid: false, error: 'El nombre no puede superar los 50 caracteres.' };
  }

  if (!data.tagline || data.tagline.trim().length < 5) {
    return { isValid: false, error: 'El tagline debe tener al menos 5 caracteres explicativos.' };
  }
  if (data.tagline.length > 120) {
    return { isValid: false, error: 'El tagline no puede superar los 120 caracteres.' };
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { isValid: false, error: 'Ingresa un correo electrónico válido para recibir tus reportes.' };
  }

  // Validate URL
  try {
    const parsedUrl = new URL(data.url.startsWith('http') ? data.url : `https://${data.url}`);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'La URL debe usar protocolo https://' };
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (BLOCKED_DOMAINS.some((blocked) => hostname.includes(blocked))) {
      return { isValid: false, error: 'El dominio ingresado no está permitido por políticas de seguridad.' };
    }
  } catch {
    return { isValid: false, error: 'Por favor ingresa una URL web válida (ej. https://mitienda.com).' };
  }

  // Check for malicious payload attempts
  const combined = `${data.name} ${data.tagline}`.toLowerCase();
  if (BLOCKED_WORDS.some((word) => combined.includes(word))) {
    return { isValid: false, error: 'Se detectó contenido no permitido en el texto.' };
  }

  return { isValid: true };
}

// In-memory rate limiting map for bid creation
const ipRateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);

  if (!entry || entry.expiresAt < now) {
    ipRateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}
