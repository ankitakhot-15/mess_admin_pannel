import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { auth, setToken, setUnauthorizedHandler } from '../api/client';

const AuthCtx = createContext(null);
const saved = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN': return { user: action.user };
    case 'LOGOUT': return { user: null };
    default: return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { user: localStorage.getItem('token') ? saved() : null });

  const logout = useCallback(() => {
    setToken(null); localStorage.removeItem('user'); dispatch({ type: 'LOGOUT' });
  }, []);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  const login = async (mobile, password) => {
    const { data } = await auth.login({ mobile, password });
    if (data?.user?.role !== 'ADMIN') throw new Error('This panel is only for admin accounts.');
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    dispatch({ type: 'LOGIN', user: data.user });
  };

  return <AuthCtx.Provider value={{ ...state, login, logout }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
