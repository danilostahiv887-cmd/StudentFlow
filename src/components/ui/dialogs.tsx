'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { AppButton } from '@/components/ui/primitives';

export function AppModal({ open, title, onClose, children, dirty = false }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; dirty?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !dirty) onClose(); if (event.key === 'Tab' && ref.current) { const nodes = ref.current.querySelectorAll<HTMLElement>('button, input, textarea, select, a[href]'); if (nodes.length) { const first = nodes[0]; const last = nodes[nodes.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } } }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [open, dirty, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={() => !dirty && onClose()}><section ref={ref} className="app-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="modal-close" type="button" onClick={onClose} aria-label="Закрити"><X /></button></div>{children}</section></div>;
}

export function ConfirmDialog({ open, title, message, confirmText = 'Підтвердити', onCancel, onConfirm, danger = false }: { open: boolean; title: string; message: string; confirmText?: string; onCancel: () => void; onConfirm: () => void; danger?: boolean }) { return <AppModal open={open} title={title} onClose={onCancel}><p className="dialog-copy">{message}</p><div className="dialog-actions"><AppButton type="button" variant="ghost" onClick={onCancel}>Скасувати</AppButton><AppButton type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmText}</AppButton></div></AppModal>; }
