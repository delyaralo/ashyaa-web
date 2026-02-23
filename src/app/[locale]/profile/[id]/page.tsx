"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usersApi, listingsApi, User } from "@/lib/api";
import { getCityName, timeAgo } from "@/lib/utils";
import TrustBadge from "@/components/TrustBadge";
import ListingCard from "@/components/ListingCard";

export default function UserProfilePage() {
  const t = useTranslations("common");
  const tListing = useTranslations("listing");
  const locale = useLocale();
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);

  // Fetch user profile
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersApi.get(userId),
    select: (res) => res.data.user,
    enabled: !!userId,
  });

  // Fetch user's active listings
  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ["listings", "user", userId],
    queryFn: () =>
      listingsApi.list({ user_id: userId, status: "active", per_page: 20 }),
    select: (res) => res.data,
    enabled: !!userId,
  });

  const user: User | undefined = userData;
  const listings = listingsData?.data ?? [];

  if (userLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{t("error")}</p>
      </div>
    );
  }

  // Calculate account age
  const accountAge = (() => {
    const createdDate = new Date(user.id); // Approximation - no created_at on User type
    return timeAgo(new Date().toISOString()); // Placeholder
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold">
              {user.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-dark">{user.name}</h1>
              {user.is_verified && (
                <svg
                  className="w-5 h-5 text-info shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {user.is_shop && (
                <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                  Shop
                </span>
              )}
            </div>

            {/* City */}
            {user.city && (
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {getCityName(user.city, locale)}
              </div>
            )}
          </div>

          {/* Trust Badge */}
          <TrustBadge score={user.trust_score} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-primary">
              {user.trust_score}
            </p>
            <p className="text-xs text-gray-500 mt-1">Trust Score</p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-dark">
              {user.total_sales}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Sales</p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-dark">
              {listings.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Active Listings</p>
          </div>
        </div>
      </div>

      {/* Active Listings */}
      <section>
        <h2 className="text-lg font-bold text-dark mb-4">Active Listings</h2>
        {listingsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <svg
              className="w-12 h-12 mx-auto text-gray-300 mb-3"
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
            <p className="text-sm text-gray-400">{t("noResults")}</p>
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
      </section>

      {/* Reviews section placeholder */}
      <section>
        <h2 className="text-lg font-bold text-dark mb-4">Reviews</h2>
        <div className="bg-white rounded-xl p-8 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-sm text-gray-400">No reviews yet</p>
        </div>
      </section>
    </div>
  );
}
