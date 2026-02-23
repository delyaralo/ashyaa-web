"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { listingsApi, categoriesApi, Listing, Category } from "@/lib/api";
import { formatPrice, getCategoryName, getCityName } from "@/lib/utils";
import ListingCard from "@/components/ListingCard";
import CategoryIcon from "@/components/CategoryIcon";
import BidTimer from "@/components/BidTimer";

export default function HomePage() {
  const t = useTranslations("common");
  const tListing = useTranslations("listing");
  const locale = useLocale();

  // Featured listings
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["listings", "featured"],
    queryFn: () => listingsApi.list({ is_featured: 1, per_page: 10 }),
    select: (res) => res.data,
  });

  // Categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    select: (res) => res.data,
  });

  // Ending soon bids
  const { data: endingSoonData, isLoading: endingSoonLoading } = useQuery({
    queryKey: ["listings", "ending-soon"],
    queryFn: () =>
      listingsApi.list({
        sell_type: "bid",
        sort: "bid_end_at",
        order: "asc",
        per_page: 8,
      }),
    select: (res) => res.data,
  });

  // Recent listings
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ["listings", "recent"],
    queryFn: () => listingsApi.list({ per_page: 12, sort: "newest" }),
    select: (res) => res.data,
  });

  const featured: Listing[] = featuredData?.data ?? [];
  const categories: Category[] = categoriesData?.categories ?? [];
  const endingSoon: Listing[] = endingSoonData?.data ?? [];
  const recent: Listing[] = recentData?.data ?? [];

  return (
    <div className="space-y-8">
      {/* Featured Listings - Horizontal Scroll */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark">
            {tListing("featured")}
          </h2>
          <Link
            href="/listings?is_featured=1"
            className="text-sm text-primary font-medium hover:underline"
          >
            {t("seeAll")}
          </Link>
        </div>

        {featuredLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-56 h-64 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {featured.map((listing) => (
              <div key={listing.id} className="shrink-0 w-56 snap-start">
                <ListingCard listing={listing} locale={locale} />
              </div>
            ))}
            {featured.length === 0 && (
              <p className="text-sm text-gray-400">{t("noResults")}</p>
            )}
          </div>
        )}
      </section>

      {/* Categories Row */}
      <section>
        <h2 className="text-lg font-bold text-dark mb-4">
          {t("categories")}
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-hide">
          {categories.map((cat) => (
            <div key={cat.id} className="shrink-0 snap-start">
              <CategoryIcon category={cat} locale={locale} />
            </div>
          ))}
        </div>
      </section>

      {/* Ending Soon */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark">
            {tListing("endingSoon")}
          </h2>
          <Link
            href="/listings?sell_type=bid&sort=ending_soon"
            className="text-sm text-primary font-medium hover:underline"
          >
            {t("seeAll")}
          </Link>
        </div>

        {endingSoonLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {endingSoon.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {listing.images[0] && (
                    <img
                      src={
                        listing.images[0].thumbnail_url ||
                        listing.images[0].image_url
                      }
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-dark line-clamp-1">
                    {listing.title}
                  </h3>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    {formatPrice(listing.current_bid || listing.bid_start_price)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <svg
                      className="w-3 h-3 text-error"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {listing.bid_end_at && (
                      <BidTimer endAt={listing.bid_end_at} />
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {endingSoon.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full">
                {tListing("noBids")}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Recent Listings Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-dark">
            {tListing("new")}
          </h2>
          <Link
            href="/listings"
            className="text-sm text-primary font-medium hover:underline"
          >
            {t("seeAll")}
          </Link>
        </div>

        {recentLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                locale={locale}
              />
            ))}
            {recent.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full">
                {t("noResults")}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
