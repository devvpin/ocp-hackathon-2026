import React, { createContext } from 'react';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  return (
    <CartContext.Provider value={{}}>
      {children}
    </CartContext.Provider>
  );
};
