"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  listingsApi,
  categoriesApi,
  citiesApi,
  Category,
  City,
} from "@/lib/api";
import { getCategoryName, getCityName } from "@/lib/utils";
import ListingCard from "@/components/ListingCard";

const CONDITIONS = ["new", "like_new", "good", "fair", "poor"] as const;
const SELL_TYPES = ["direct_buy", "bid", "both"] as const;
const SORT_OPTIONS = [
  { value: "newest", labelKey: "sortNewest" },
  { value: "price_asc", labelKey: "sortPriceLow" },
  { value: "price_desc", labelKey: "sortPriceHigh" },
  { value: "ending_soon", labelKey: "sortEndingSoon" },
] as const;

export default function ListingsPage() {
  const t = useTranslations("common");
  const tListing = useTranslations("listing");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Read filters from URL search params
  const currentCategory = searchParams.get("category") || "";
  const currentCity = searchParams.get("city") || "";
  const currentMinPrice = searchParams.get("min_price") || "";
  const currentMaxPrice = searchParams.get("max_price") || "";
  const currentCondition = searchParams.get("condition") || "";
  const currentSellType = searchParams.get("sell_type") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const searchQuery = searchParams.get("q") || "";

  // Build query params for API
  const apiParams: Record<string, string | number> = {
    page: currentPage,
    per_page: 12,
    sort: currentSort,
  };
  if (currentCategory) apiParams.category = currentCategory;
  if (currentCity) apiParams.city_id = currentCity;
  if (currentMinPrice) apiParams.min_price = currentMinPrice;
  if (currentMaxPrice) apiParams.max_price = currentMaxPrice;
  if (currentCondition) apiParams.condition = currentCondition;
  if (currentSellType) apiParams.sell_type = currentSellType;
  if (searchQuery) apiParams.q = searchQuery;

  // Fetch listings
  const { data: listingsData, isLoading } = useQuery({
    queryKey: ["listings", apiParams],
    queryFn: () => listingsApi.list(apiParams),
    select: (res) => res.data,
  });

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    select: (res) => res.data,
  });

  // Fetch cities for filter
  const { data: citiesData } = useQuery({
    queryKey: ["cities"],
    queryFn: () => citiesApi.list(),
    select: (res) => res.data,
  });

  const listings = listingsData?.data ?? [];
  const totalPages = listingsData?.last_page ?? 1;
  const categories: Category[] = categoriesData?.categories ?? [];
  const cities: City[] = citiesData?.cities ?? [];

  // Update URL search params
  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      // Reset to page 1 when filters change
      if (!updates.page) {
        params.set("page", "1");
      }
      router.push(`/listings?${params.toString()}`);
    },
    [searchParams, router]
  );

  const goToPage = (page: number) => {
    updateFilters({ page: String(page) });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Mobile filter toggle */}
      <button
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium text-dark"
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
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filters
      </button>

      {/* Filters Sidebar */}
      <aside
        className={`lg:w-64 shrink-0 space-y-5 ${
          filtersOpen ? "block" : "hidden lg:block"
        }`}
      >
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-5">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder={t("search")}
              defaultValue={searchQuery}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateFilters({ q: (e.target as HTMLInputElement).value });
                }
              }}
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              {t("categories")}
            </label>
            <select
              value={currentCategory}
              onChange={(e) => updateFilters({ category: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {getCategoryName(cat, locale)}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              {tListing("city")}
            </label>
            <select
              value={currentCity}
              onChange={(e) => updateFilters({ city: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All</option>
              {cities.map((city) => (
                <option key={city.id} value={String(city.id)}>
                  {getCityName(city, locale)}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              {tListing("price")}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                defaultValue={currentMinPrice}
                onBlur={(e) =>
                  updateFilters({ min_price: e.target.value })
                }
                className="w-1/2 h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="number"
                placeholder="Max"
                defaultValue={currentMaxPrice}
                onBlur={(e) =>
                  updateFilters({ max_price: e.target.value })
                }
                className="w-1/2 h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              {tListing("condition")}
            </label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((cond) => (
                <button
                  key={cond}
                  onClick={() =>
                    updateFilters({
                      condition: currentCondition === cond ? "" : cond,
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    currentCondition === cond
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tListing(cond)}
                </button>
              ))}
            </div>
          </div>

          {/* Sell Type */}
          <div>
            <label className="block text-sm font-semibold text-dark mb-2">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {SELL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    updateFilters({
                      sell_type: currentSellType === type ? "" : type,
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    currentSellType === type
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type === "direct_buy"
                    ? tListing("directBuy")
                    : type === "bid"
                      ? tListing("bid")
                      : tListing("both")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Sort bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {listingsData?.total ?? 0} results
          </p>
          <select
            value={currentSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
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
    </div>
  );
}
