import { createContext, useContext, useState, useCallback } from 'react';
import sessionsApi from '../api/sessions';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionsApi.getCurrent();
      setSession(res.data);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const openSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionsApi.open();
      setSession(res.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const closeSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionsApi.close(session?.id);
      setSession(res.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, [session]);

  return (
    <SessionContext.Provider
      value={{ session, loading, fetchSession, openSession, closeSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export default SessionContext;
