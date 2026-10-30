import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { inbox } from '../api/client';
import { useAuth } from './AuthContext';
import { asList } from '../hooks/useApi';

const Ctx = createContext(null);
const POLL_MS = 30000;

function reducer(s, a) {
  switch (a.type) {
    case 'SET': return { items: a.items, unread: a.unread, loading: false };
    case 'READ': return { ...s, items: s.items.map((n) => (n.id === a.id ? { ...n, read: true } : n)), unread: Math.max(0, s.unread - (s.items.find((n) => n.id === a.id && !n.read) ? 1 : 0)) };
    case 'READ_ALL': return { ...s, items: s.items.map((n) => ({ ...n, read: true })), unread: 0 };
    case 'REMOVE': { const gone = s.items.find((n) => n.id === a.id); return { ...s, items: s.items.filter((n) => n.id !== a.id), unread: gone && !gone.read ? s.unread - 1 : s.unread }; }
    default: return s;
  }
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { items: [], unread: 0, loading: true });

  const refresh = useCallback(async () => {
    try {
      const r = await inbox.list();
      dispatch({ type: 'SET', items: asList(r.data), unread: r.meta?.unread ?? 0 });
    } catch { /* keep the last known list; polling will retry */ }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [user, refresh]);

  const actions = {
    refresh,
    markRead: async (id) => { dispatch({ type: 'READ', id }); await inbox.read(id).catch(refresh); },
    markAll: async () => { dispatch({ type: 'READ_ALL' }); await inbox.readAll().catch(refresh); },
    remove: async (id) => { dispatch({ type: 'REMOVE', id }); await inbox.remove(id).catch(refresh); },
  };
  return <Ctx.Provider value={{ ...state, ...actions }}>{children}</Ctx.Provider>;
}
export const useNotifications = () => useContext(Ctx);
