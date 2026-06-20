'use client';
import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { AppButton } from '@/components/ui/primitives';

export function AppModal({
  open,
  title,
  description,
  onClose,
  children,
  dirty = false,
  size = 'md',
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  dirty?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !dirty) onClose();
      if (event.key === 'Tab' && ref.current) {
        const nodes = ref.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
        );
        if (nodes.length) {
          const first = nodes[0];
          const last = nodes[nodes.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    setTimeout(
      () => ref.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus(),
      0,
    );
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, dirty, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={() => !dirty && onClose()}>
      <section
        ref={ref}
        className={`app-modal app-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Закрити">
            <X />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Підтвердити',
  onCancel,
  onConfirm,
  danger = false,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <AppModal open={open} title={title} onClose={onCancel}>
      <p className="dialog-copy">{message}</p>
      <div className="dialog-actions">
        <AppButton type="button" variant="ghost" onClick={onCancel}>
          Скасувати
        </AppButton>
        <AppButton type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmText}
        </AppButton>
      </div>
    </AppModal>
  );
}
