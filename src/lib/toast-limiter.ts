export interface ToastRateLimiterOptions {
  throttleMs?: number;
  maxVisible?: number;
}

export interface ToastPayload {
  code?: string;
  message: string;
  status?: number;
  ref?: string;
  type?: string;
}

export interface ToastRateDecision {
  show: boolean;
  count: number;
  key: string;
}

interface ToastRateEntry {
  key: string;
  count: number;
  lastShown: number;
}

export class ToastRateLimiter {
  private throttleMs: number;
  private maxVisible: number;
  private entries: Map<string, ToastRateEntry> = new Map();

  constructor(options: ToastRateLimiterOptions = {}) {
    this.throttleMs = options.throttleMs ?? 3000;
    this.maxVisible = options.maxVisible ?? 3;
  }

  public getKey(payload: ToastPayload): string {
    const code = payload.code || (payload.status ? `HTTP_${payload.status}` : 'ERR');
    return `${payload.type || 'error'}:${code}:${payload.message}:${payload.ref || ''}`;
  }

  public shouldShow(payload: ToastPayload): ToastRateDecision {
    const now = Date.now();
    const key = this.getKey(payload);
    const existing = this.entries.get(key);

    // Clean up expired entries if too old
    for (const [k, v] of this.entries.entries()) {
      if (now - v.lastShown > this.throttleMs * 2) {
        this.entries.delete(k);
      }
    }

    if (existing && now - existing.lastShown < this.throttleMs) {
      existing.count += 1;
      return {
        show: false,
        count: existing.count,
        key,
      };
    }

    // Check active visible count
    let activeVisibleCount = 0;
    for (const entry of this.entries.values()) {
      if (now - entry.lastShown < this.throttleMs) {
        activeVisibleCount += 1;
      }
    }

    if (activeVisibleCount >= this.maxVisible) {
      return {
        show: false,
        count: (existing?.count ?? 0) + 1,
        key,
      };
    }

    const newEntry: ToastRateEntry = {
      key,
      count: 1,
      lastShown: now,
    };
    this.entries.set(key, newEntry);

    return {
      show: true,
      count: 1,
      key,
    };
  }

  public reset(): void {
    this.entries.clear();
  }
}
