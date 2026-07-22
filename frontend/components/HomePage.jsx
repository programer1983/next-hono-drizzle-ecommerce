"use client";

import PageLoader from "@/components/PageLoader";
import { useHomeCatalog } from "@/hooks/useHomeCatalog";
import { useAuth } from "@clerk/nextjs";
import { HomeHero } from "./HomeHero";

export default function Home() {
  const { isLoaded } = useAuth();
  const {
    categoryFilter,
    setCategory,
    categories,
    products,
    categoryChipsLoading,
    loadingCategories,
    loadingList,
    error,
  } = useHomeCatalog();

  if (!isLoaded) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-12">
      <HomeHero categories={categories} loadingCategories={loadingCategories} />
    </div>
  );
}
