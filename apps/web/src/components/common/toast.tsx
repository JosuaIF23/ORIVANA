import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ToastItem {
  id: number;
  tone: 'success' | 'error';
  message: string;
}

interface ToastApi {
  /** Call only after the service has confirmed the change. */
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (tone: ToastItem['tone'], message: string) => {
      seq += 1;
      const id = seq;
      setItems((list) => [...list.slice(-2), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );
  const api = useMemo<ToastApi>(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-20 z-[60] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2 md:bottom-4">
        {items.map((t) => (
          <div key={t.id} role="status" className={cn('pointer-events-auto flex items-start gap-3 rounded-card border bg-elevated p-3 text-sm text-fg', t.tone === 'success' ? 'border-knowledge/50' : 'border-danger/60')}>
            {t.tone === 'success' ? <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-knowledge" /> : <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />}
            <p className="min-w-0 flex-1">{t.message}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="rounded-badge text-fg-muted hover:text-fg">
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
