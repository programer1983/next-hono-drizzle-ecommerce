import { apiFetch } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export function useOrderDetailPage() {
  const { id } = useParams();
  const { getToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: () => apiFetch(`/api/orders/${id}`, { getToken }),
    enabled: Boolean(id),
  });

  const order = data?.order ?? null;
  const items = data?.items ?? [];
  const paid = order?.status === "paid";

  return {
    id,
    isLoading,
    error,
    order,
    items,
    paid,
  };
}
