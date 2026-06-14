import { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { computeCartTotals } from '../utils/discounts';
import promotionsApi from '../api/promotions';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const initialState = {
  items: [],
  tableId: null,
  tableNumber: null,
  customer: null,
  coupon: null,
  orderId: null,
  orderType: 'dine_in',
  status: 'draft',
  kitchenCompleted: false,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.productId === action.payload.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.productId !== action.payload),
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: Math.max(0, action.payload.quantity) }
              : i
          )
          .filter((i) => i.quantity > 0),
      };

    case 'SET_TABLE': {
      const sameTable = state.tableId === action.payload.tableId && state.tableNumber === action.payload.tableNumber;
      if (sameTable) {
        return state;
      }
      return {
        ...initialState,
        tableId: action.payload.tableId,
        tableNumber: action.payload.tableNumber,
        orderType: 'dine_in',
      };
    }

    case 'SET_CUSTOMER':
      return { ...state, customer: action.payload };

    case 'SET_COUPON':
      return { ...state, coupon: action.payload };

    case 'REMOVE_COUPON':
      return { ...state, coupon: null };

    case 'SET_ORDER_ID':
      return { ...state, orderId: action.payload };

    case 'SET_ORDER_TYPE':
      return { ...state, orderType: action.payload };

    case 'LOAD_ORDER':
      return {
        ...state,
        items: action.payload.items,
        customer: action.payload.customer,
        orderId: action.payload.orderId,
        orderType: action.payload.orderType || 'dine_in',
        tableId: action.payload.tableId,
        tableNumber: action.payload.tableNumber,
        status: action.payload.status || 'draft',
        kitchenCompleted: action.payload.kitchenCompleted || false,
      };

    case 'CLEAR_CART':
      return { ...initialState };

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [promotions, setPromotions] = useState([]);
  const [totals, setTotals] = useState({
    items: [],
    subtotal: 0,
    productDiscountTotal: 0,
    orderDiscount: 0,
    orderPromo: null,
    couponDiscount: 0,
    taxTotal: 0,
    totalDiscount: 0,
    total: 0,
  });

  const { user } = useAuth();

  useEffect(() => {
    promotionsApi.getPromotions().then((res) => {
      setPromotions(res.data.filter((p) => p.isActive));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [user]);

  useEffect(() => {
    const computed = computeCartTotals(state.items, promotions, state.coupon);
    setTotals(computed);
  }, [state.items, state.coupon, promotions]);

  const addItem = useCallback((product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        productId: product.id,
        name: product.name,
        price: product.price,
        tax: product.tax ?? product.taxPercent ?? 0,
        categoryId: product.categoryId,
      },
    });
  }, []);

  const removeItem = useCallback((productId) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }, []);

  const setTable = useCallback((tableId, tableNumber) => {
    dispatch({ type: 'SET_TABLE', payload: { tableId, tableNumber } });
  }, []);

  const setOrderType = useCallback((type) => {
    dispatch({ type: 'SET_ORDER_TYPE', payload: type });
  }, []);

  const setCustomer = useCallback((customer) => {
    dispatch({ type: 'SET_CUSTOMER', payload: customer });
  }, []);

  const setCoupon = useCallback((coupon) => {
    dispatch({ type: 'SET_COUPON', payload: coupon });
  }, []);

  const removeCoupon = useCallback(() => {
    dispatch({ type: 'REMOVE_COUPON' });
  }, []);

  const loadOrder = useCallback((orderData) => {
    dispatch({ type: 'LOAD_ORDER', payload: orderData });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const setOrderId = useCallback((id) => {
    dispatch({ type: 'SET_ORDER_ID', payload: id });
  }, []);

  return (
    <CartContext.Provider
      value={{
        ...state,
        totals,
        promotions,
        addItem,
        removeItem,
        updateQuantity,
        setTable,
        setOrderType,
        setOrderId,
        setCustomer,
        setCoupon,
        removeCoupon,
        loadOrder,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
