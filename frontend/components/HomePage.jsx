"use client";

import PageLoader from "@/components/PageLoader";
import { useHomeCatalog } from "@/hooks/useHomeCatalog";
import { useAuth } from "@clerk/nextjs";
import { HomeHero } from "./HomeHero";
import { TrustStrip } from "./TrustStrip";

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
      <TrustStrip />
      <section id="catalog" className="scroll-mt-24 max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-base-content md:text-xl uppercase font-mono">
              Catalog
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn btn-sm ${!categoryFilter ? "btn-primary" : "btn-ghost border border-base-300"}`}
              onClick={() => setCategory("")}
            >
              All
            </button>
            {categoryChipsLoading
              ? [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="sceleton h-8 w-20 rounded-lg"
                    aria-hidden
                  />
                ))
              : categories.map((c) => (
                  <button
                    key={c}
                    className={`btn btn-sm ${categoryFilter === c ? "btn-primary" : "btn-ghost border border-base-300"}`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
          </div>
        </div>
      </section>
    </div>
  );
}
