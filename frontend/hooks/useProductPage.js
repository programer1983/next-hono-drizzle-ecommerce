import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export function UseProductPage() {
  const { slug } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["prodycts", slug],
    queryFn: () => apiFetch(`/api/products/${slug}`),
    enabled: Boolean(slug),
  });

  return {
    product: data?.product ?? null,
    isLoading,
    error,
  };
}
