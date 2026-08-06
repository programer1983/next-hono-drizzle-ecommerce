"use client";

import { createContext, useContext } from "react";

const OrderContext = createContext(null);

export function OrderProvider({ children, value }) {
  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrderContext() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error(
      "useOrderContext должен использоваться внутри OrderProvider",
    );
  }
  return context;
}
