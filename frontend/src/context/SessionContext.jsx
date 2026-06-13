import React, { createContext } from 'react';

export const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  return (
    <SessionContext.Provider value={{}}>
      {children}
    </SessionContext.Provider>
  );
};
