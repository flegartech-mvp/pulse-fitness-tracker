import { APP_DATA_VERSION, emptyAppData, type AppData } from '@/types'

export const STORAGE_KEY = 'pulse:data'
const BACKUP_KEY = 'pulse:data:corrupt-backup'

/**
 * Persistence boundary. The app only talks to this interface, so swapping
 * localStorage for IndexedDB or a real backend later is a one-file change.
 */
export interface StorageAdapter {
  load(): AppData | null
  save(data: AppData): void
  clear(): void
}

function isAppData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.version === 'number' &&
    Array.isArray(v.workouts) &&
    Array.isArray(v.metrics) &&
    Array.isArray(v.goals) &&
    Array.isArray(v.customExercises)
  )
}

/** Hook for future schema upgrades; currently a no-op at version 1. */
function migrate(data: AppData): AppData {
  if (data.version === APP_DATA_VERSION) return data
  return { ...data, version: APP_DATA_VERSION }
}

export class LocalStorageAdapter implements StorageAdapter {
  load(): AppData | null {
    let raw: string | null
    try {
      raw = localStorage.getItem(STORAGE_KEY)
    } catch {
      return null // storage unavailable (private mode, blocked)
    }
    if (!raw) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      if (!isAppData(parsed)) throw new Error('unexpected shape')
      return migrate({ ...emptyAppData(), ...parsed })
    } catch {
      // Keep the corrupt blob around for manual recovery instead of silently losing it.
      try {
        localStorage.setItem(BACKUP_KEY, raw)
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* best effort */
      }
      return null
    }
  }

  save(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Quota exceeded or storage blocked — the in-memory copy keeps the session alive.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

/** Used by tests and available as a fallback when localStorage is blocked. */
export class MemoryAdapter implements StorageAdapter {
  private data: AppData | null = null
  load(): AppData | null {
    return this.data ? structuredClone(this.data) : null
  }
  save(data: AppData): void {
    this.data = structuredClone(data)
  }
  clear(): void {
    this.data = null
  }
}

export function exportFileName(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `pulse-export-${y}${m}${d}.json`
}
