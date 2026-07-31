import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

function UseOrdersPage() {
  const { getToken, isSignedIn } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: () => apiFetch("/api/orders", { getToken }),
    enabled: isSignedIn,
  });

  const { data: metaData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch("/api/me", { getToken }),
    enabled: isSignedIn,
  });

  const staff =
    metaData?.user?.role === "support" || metaData?.user?.role === "admin";

  const orders = data?.orders ?? [];

  return {
    isLoading,
    error,
    staff,
    orders,
  };
}

export default UseOrdersPage;
