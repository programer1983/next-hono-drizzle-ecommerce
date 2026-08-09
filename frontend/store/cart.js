// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// const stores = new Map();

// export const createCartStore = create(
//   persist(
//     (set, get) => ({
//       items: [],

//       addItem(productId, qty = 1) {
//         const items = [...get().items];
//         const i = items.findIndex((item) => item.productId === productId);
//         if (i >= 0) {
//           items[i] = { ...items[i], quantity: items[i].quantity + qty };
//         } else {
//           items.push({ productId, quantity: qty });
//         }
//         set({ items });
//       },

//       removeItem(productId) {
//         set({
//           items: get().items.filter((item) => item.productId !== productId),
//         });
//       },
//       setQty(productId, quantity) {
//         if (quantity <= 0) {
//           set({
//             items: get().items.filter((item) => item.productId !== productId),
//           });
//           return;
//         }
//         const updatedItems = get().items.map((item) =>
//           item.productId === productId ? { ...item, quantity } : item,
//         );
//         set({ items: updatedItems });
//       },
//       clear() {
//         set({ items: [] });
//       },
//     }),
//     { name: "northwind-cart" },
//   ),
// );

// export function getCartStore(userId = "guest") {
//   if (!stores.has(userId)) {
//     stores.set(userId, createCartStore(userId));
//   }
//   return stores.get(userId);
// }

import { create } from "zustand";
import { persist } from "zustand/middleware";

const stores = new Map();

function createCartStore(userId) {
  return create(
    persist(
      (set, get) => ({
        items: [],
        addItem(productId, qty = 1) {
          const items = [...get().items];
          const i = items.findIndex((item) => item.productId === productId);
          if (i >= 0) {
            items[i] = { ...items[i], quantity: items[i].quantity + qty };
          } else {
            items.push({ productId, quantity: qty });
          }
          set({ items });
        },
        removeItem(productId) {
          set({
            items: get().items.filter((item) => item.productId !== productId),
          });
        },
        setQty(productId, quantity) {
          if (quantity <= 0) {
            set({
              items: get().items.filter((item) => item.productId !== productId),
            });
            return;
          }
          set({
            items: get().items.map((item) =>
              item.productId === productId ? { ...item, quantity } : item,
            ),
          });
        },
        clear() {
          set({ items: [] });
        },
      }),
      { name: `northwind-cart-${userId}` },
    ),
  );
}

export function getCartStore(userId = "guest") {
  if (!stores.has(userId)) {
    stores.set(userId, createCartStore(userId));
  }
  return stores.get(userId);
}
