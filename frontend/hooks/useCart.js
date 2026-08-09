import { useAuth } from "@clerk/nextjs";
import { getCartStore } from "@/store/cart";

export function useCart(selector) {
  const { userId } = useAuth();
  const store = getCartStore(userId ?? "guest");
  return store(selector);
}
