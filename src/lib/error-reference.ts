/**
 * Crockford's Base32 alphabet (excluding I, L, O, U to avoid visual ambiguity).
 */
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Generates a client-side collision-resistant Crockford Base32 reference ID.
 * Format: ERR-CXXXX (e.g. ERR-C8F3K)
 */
export function generateClientErrorRef(): string {
  let code = 'C';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    for (let i = 0; i < 4; i++) {
      code += CROCKFORD_ALPHABET[array[i] % 32];
    }
  } else {
    for (let i = 0; i < 4; i++) {
      code += CROCKFORD_ALPHABET[Math.floor(Math.random() * 32)];
    }
  }
  return `ERR-${code}`;
}
