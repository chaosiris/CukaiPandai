// FE Wave B — Notification system: bell list + transient toasts.
// notify() pushes to the bell AND shows a toast.
// toast() shows a transient toast only (no bell entry).

import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react'

export type NotifKind = 'info' | 'success' | 'warning' | 'error'

export interface AppNotification {
  id: string
  title: string
  body?: string
  kind: NotifKind
  read: boolean
  ts: number
}

export interface TransientToast {
  id: string
  title: string
  body?: string
  kind: NotifKind
}

interface NotificationContextValue {
  notifications: AppNotification[]
  unreadCount: number
  notify: (opts: { title: string; body?: string; kind?: NotifKind }) => void
  toast: (opts: { title: string; body?: string; kind?: NotifKind }) => void
  markAllRead: () => void
  dismiss: (id: string) => void
  seedDeadlines: (items: Array<{ form: string; due_date: string; status: string }>) => void
  toasts: TransientToast[]
  dismissToast: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

let counter = 0
function nextId() {
  return `${Date.now()}-${counter++}`
}

const TOAST_DURATION_MS = 4000

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [toasts, setToasts] = useState<TransientToast[]>([])
  // Track which deadline seed keys have been shown so we never re-fire on re-render
  const seededRef = useRef<Set<string>>(new Set())

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (opts: { title: string; body?: string; kind: NotifKind }) => {
      const id = nextId()
      setToasts((prev) => [...prev, { id, ...opts }])
      setTimeout(() => dismissToast(id), TOAST_DURATION_MS)
    },
    [dismissToast]
  )

  // Pushes to bell list AND fires a toast
  const notify = useCallback(
    (opts: { title: string; body?: string; kind?: NotifKind }) => {
      const kind: NotifKind = opts.kind ?? 'info'
      const id = nextId()
      setNotifications((prev) =>
        [{ id, title: opts.title, body: opts.body, kind, read: false, ts: Date.now() }, ...prev].slice(0, 30)
      )
      pushToast({ title: opts.title, body: opts.body, kind })
    },
    [pushToast]
  )

  // Transient toast only — does not add to bell list
  const toast = useCallback(
    (opts: { title: string; body?: string; kind?: NotifKind }) => {
      pushToast({ title: opts.title, body: opts.body, kind: opts.kind ?? 'info' })
    },
    [pushToast]
  )

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Seeds bell notifications from obligation deadlines. Keyed by TIN+form+due_date to prevent
  // re-seeding on re-render. Clears previous seed keys on TIN change (handled by caller passing a
  // fresh set after persona switch).
  const seedDeadlines = useCallback(
    (items: Array<{ form: string; due_date: string; status: string }>, _tinKey?: string) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const toAdd: AppNotification[] = []

      for (const item of items) {
        const key = `${item.form}:${item.due_date}`
        if (seededRef.current.has(key)) continue

        const due = new Date(item.due_date)
        due.setHours(0, 0, 0, 0)
        const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)

        let kind: NotifKind
        let body: string

        if (item.status === 'overdue' || diffDays < 0) {
          kind = 'error'
          body = `${item.form} was due on ${item.due_date} and is now overdue.`
        } else if (diffDays <= 30) {
          kind = 'warning'
          body = `${item.form} is due in ${diffDays} day${diffDays !== 1 ? 's' : ''} (${item.due_date}).`
        } else {
          // Further out — skip seeding to avoid noise
          continue
        }

        seededRef.current.add(key)
        toAdd.push({
          id: nextId(),
          title: `${item.form} Deadline`,
          body,
          kind,
          read: false,
          ts: Date.now()
        })
      }

      if (toAdd.length > 0) {
        setNotifications((prev) => [...toAdd, ...prev].slice(0, 30))
      }
    },
    []
  )

  // Expose a reset helper via the ref so AppShell can clear seeds on persona switch
  ;(seedDeadlines as unknown as { _clearSeeds: () => void })._clearSeeds = () => {
    seededRef.current = new Set()
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, notify, toast, markAllRead, dismiss, seedDeadlines, toasts, dismissToast }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}

// Kind -> left-border accent color (token-only, no hex)
function kindColor(kind: NotifKind): string {
  if (kind === 'success') return 'var(--mustard)'
  if (kind === 'error') return 'var(--rust)'
  if (kind === 'warning') return 'var(--mustard)'
  return 'var(--denim)'
}

function kindLabel(kind: NotifKind): string {
  if (kind === 'success') return 'OK'
  if (kind === 'error') return 'ERR'
  if (kind === 'warning') return 'WARN'
  return 'INFO'
}

function ToastContainer({ toasts, onDismiss }: { toasts: TransientToast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className="toast-item" style={{ borderLeftColor: kindColor(t.kind) }}>
          <div className="toast-header">
            <span className="toast-kind" style={{ color: kindColor(t.kind) }}>
              {kindLabel(t.kind)}
            </span>
            <span className="toast-title">{t.title}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(t.id)}
            >
              x
            </button>
          </div>
          {t.body && <div className="toast-body">{t.body}</div>}
        </div>
      ))}
    </div>
  )
}
