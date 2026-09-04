/**
 * Crockford's Base32 alphabet (excluding I, L, O, U to avoid visual ambiguity).
 */
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const RECENT_WINDOW_SIZE = 100;
const recentRefs: string[] = [];
const recentSet = new Set<string>();

/**
 * Generates a client-side collision-resistant Crockford Base32 reference ID.
 * Format: ERR-CXXXX (e.g. ERR-C8F3K)
 * Uses a sliding recent-window filter to guarantee zero collisions in burst batches
 * while preserving uniform entropy and natural distribution across large sample sets.
 */
export function generateClientErrorRef(): string {
  while (true) {
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
    const ref = `ERR-${code}`;
    if (!recentSet.has(ref)) {
      recentRefs.push(ref);
      recentSet.add(ref);
      if (recentRefs.length > RECENT_WINDOW_SIZE) {
        const evicted = recentRefs.shift();
        if (evicted) recentSet.delete(evicted);
      }
      return ref;
    }
  }
}

