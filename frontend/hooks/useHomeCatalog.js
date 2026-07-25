import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function useHomeCatalog() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();

  const categoryFilter = searchParams.get("category")?.trim() ?? "";

  const setCategory = (category) => {
    const next = new URLSearchParams(searchParams.toString());

    if (!category) {
      next.delete("category");
    } else {
      next.set("category", category);
    }

    const query = next.toString();

    const newUrl = query ? `${pathName}?${query}` : pathName;

    router.replace(newUrl, { scroll: false });
  };

  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["product-categories"],
    queryFn: () => apiFetch("/api/products/categories"),
  });

  const {
    data: productsData,
    isLoading: loadingList,
    error,
  } = useQuery({
    queryKey: ["products", categoryFilter],
    queryFn: () =>
      apiFetch(
        categoryFilter
          ? `/api/products?category=${encodeURIComponent(categoryFilter)}`
          : "/api/products",
      ),
  });

  const categories = categoriesData?.categories ?? [];
  // const products = productsData?.products ?? [];
  const products = productsData?.rows ?? [];
  const categoryChipsLoading = loadingCategories && categories.length === 0;

  return {
    categoryFilter,
    setCategory,
    categories,
    products,
    categoryChipsLoading,
    loadingCategories,
    loadingList,
    error,
  };
}
