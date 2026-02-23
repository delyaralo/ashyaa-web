"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { listingsApi, favoritesApi, Listing } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import ListingCard from "@/components/ListingCard";

type Tab = "active" | "sold" | "favorites";

export default function DashboardPage() {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const tListing = useTranslations("listing");
  const locale = useLocale();
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("active");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    }
  }, [isLoggedIn, router]);

  // Fetch my active listings
  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ["my-listings", "active"],
    queryFn: () => listingsApi.myListings({ status: "active" }),
    select: (res) => res.data,
    enabled: isLoggedIn && activeTab === "active",
  });

  // Fetch my sold listings
  const { data: soldData, isLoading: soldLoading } = useQuery({
    queryKey: ["my-listings", "sold"],
    queryFn: () => listingsApi.myListings({ status: "sold" }),
    select: (res) => res.data,
    enabled: isLoggedIn && activeTab === "sold",
  });

  // Fetch my favorites
  const { data: favoritesData, isLoading: favoritesLoading } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => favoritesApi.list(),
    select: (res) => res.data,
    enabled: isLoggedIn && activeTab === "favorites",
  });

  const activeListings: Listing[] = activeData?.data ?? [];
  const soldListings: Listing[] = soldData?.data ?? [];
  const favoriteListings: Listing[] =
    favoritesData?.data?.map((f: { listing: Listing }) => f.listing) ?? [];

  const currentListings =
    activeTab === "active"
      ? activeListings
      : activeTab === "sold"
        ? soldListings
        : favoriteListings;

  const isCurrentLoading =
    activeTab === "active"
      ? activeLoading
      : activeTab === "sold"
        ? soldLoading
        : favoritesLoading;

  if (!isLoggedIn) {
    return null;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "active", label: tNav("myListings") },
    { key: "sold", label: tListing("sold") },
    { key: "favorites", label: tNav("favorites") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dark">
            {user?.name || t("profile")}
          </h1>
          <p className="text-sm text-gray-500">Dashboard</p>
        </div>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {tListing("createListing")}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-dark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isCurrentLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : currentListings.length === 0 ? (
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
          <p className="text-gray-500 text-sm mb-4">{t("noResults")}</p>
          {activeTab === "active" && (
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors"
            >
              {tListing("createListing")}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
