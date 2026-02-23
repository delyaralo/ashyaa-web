"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { listingsApi, categoriesApi, Category } from "@/lib/api";
import { getCategoryName } from "@/lib/utils";
import ListingCard from "@/components/ListingCard";

export default function CategoryListingsPage() {
  const t = useTranslations("common");
  const tListing = useTranslations("listing");
  const locale = useLocale();
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const slug = params.slug;
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const currentSort = searchParams.get("sort") || "newest";

  // Fetch categories to find the current one
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    select: (res) => res.data,
  });

  const categories: Category[] = categoriesData?.categories ?? [];
  const currentCategory = categories.find((c) => c.slug === slug);

  // Fetch listings for this category
  const { data: listingsData, isLoading } = useQuery({
    queryKey: ["listings", "category", slug, currentPage, currentSort],
    queryFn: () =>
      listingsApi.list({
        category: slug,
        page: currentPage,
        per_page: 12,
        sort: currentSort,
      }),
    select: (res) => res.data,
  });

  const listings = listingsData?.data ?? [];
  const totalPages = listingsData?.last_page ?? 1;

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    if (!updates.page) params.set("page", "1");
    router.push(`/categories/${slug}?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    updateParams({ page: String(page) });
  };

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex items-center gap-4">
        {currentCategory && (
          <>
            <span className="text-5xl">{currentCategory.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-dark">
                {getCategoryName(currentCategory, locale)}
              </h1>
              <p className="text-sm text-gray-500">
                {listingsData?.total ?? 0} items
              </p>
            </div>
          </>
        )}
        {!currentCategory && !isLoading && (
          <h1 className="text-2xl font-bold text-dark">{slug}</h1>
        )}
      </div>

      {/* Sort Bar */}
      <div className="flex items-center justify-end">
        <select
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="h-9 px-3 rounded-lg bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="ending_soon">Ending Soon</option>
        </select>
      </div>

      {/* Listing Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-500 text-sm">{t("noResults")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                Math.abs(p - currentPage) <= 2
            )
            .map((page, idx, arr) => (
              <span key={page} className="flex items-center gap-2">
                {idx > 0 && arr[idx - 1] !== page - 1 && (
                  <span className="text-gray-400 text-sm">...</span>
                )}
                <button
                  onClick={() => goToPage(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === currentPage
                      ? "bg-primary text-white"
                      : "bg-white border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              </span>
            ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
