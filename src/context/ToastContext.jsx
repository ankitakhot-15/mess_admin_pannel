import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, type = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l, { id, text, type }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status">{items.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.text}</div>)}</div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/** run(() => api call, 'Success text') -> true/false, shows a toast either way */
export function useRun() {
  const toast = useToast();
  return async (fn, okText) => {
    try { const r = await fn(); toast(okText || r?.message || 'Done'); return true; }
    catch (e) { toast(e.message, 'err'); return false; }
  };
}
