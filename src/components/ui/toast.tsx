'use client';
import { createContext, useContext, useState } from 'react';
const ToastContext = createContext<{ push: (message: string) => void }>({ push: () => undefined });
export function ToastProvider({ children }: { children: React.ReactNode }) { const [items, setItems] = useState<string[]>([]); const push = (message: string) => { setItems((current) => [...current, message]); window.setTimeout(() => setItems((current) => current.slice(1)), 3500); }; return <ToastContext.Provider value={{ push }}>{children}<div className="toast-stack" aria-live="polite">{items.map((item, index) => <div className="toast" key={`${item}-${index}`}>{item}</div>)}</div></ToastContext.Provider>; }
export const useToast = () => useContext(ToastContext);
