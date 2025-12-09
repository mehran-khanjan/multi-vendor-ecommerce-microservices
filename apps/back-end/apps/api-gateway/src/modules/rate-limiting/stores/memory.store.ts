// src/rate-limiting/stores/memory.store.ts
import { Injectable } from '@nestjs/common';

interface StoreEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class MemoryStore {
  private readonly store = new Map<string, StoreEntry>();

  increment(key: string, windowMs: number): number {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime <= now) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return 1;
    }

    entry.count++;
    return entry.count;
  }

  get(key: string): number {
    const entry = this.store.get(key);
    if (!entry || entry.resetTime <= Date.now()) {
      return 0;
    }
    return entry.count;
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }
}
