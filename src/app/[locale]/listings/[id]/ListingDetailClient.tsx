"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  listingsApi,
  bidsApi,
  chatApi,
  favoritesApi,
  Listing,
  Bid,
} from "@/lib/api";
import {
  formatPrice,
  getCityName,
  getCategoryName,
  timeAgo,
} from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import ConditionBadge from "@/components/ConditionBadge";
import BidTimer from "@/components/BidTimer";
import TrustBadge from "@/components/TrustBadge";

interface Props {
  listingId: number;
  locale: string;
}

export default function ListingDetailClient({ listingId, locale }: Props) {
  const t = useTranslations("listing");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoggedIn } = useAuth();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Fetch listing
  const { data: listingData, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => listingsApi.get(listingId),
    select: (res) => res.data.listing,
  });

  // Fetch bids
  const { data: bidsData } = useQuery({
    queryKey: ["bids", listingId],
    queryFn: () => bidsApi.list(listingId),
    select: (res) => res.data,
    enabled:
      !!listingData &&
      (listingData.sell_type === "bid" || listingData.sell_type === "both"),
  });

  // Place bid mutation
  const placeBidMutation = useMutation({
    mutationFn: (amount: number) => bidsApi.place(listingId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
      queryClient.invalidateQueries({ queryKey: ["bids", listingId] });
      setBidAmount("");
      setBidError("");
    },
    onError: () => {
      setBidError("Failed to place bid. Try a higher amount.");
    },
  });

  // Favorite toggle mutation
  const favoriteMutation = useMutation({
    mutationFn: () => favoritesApi.toggle(listingId),
    onSuccess: (res) => {
      setIsFavorited(res.data.favorited);
    },
  });

  // Start chat mutation
  const startChatMutation = useMutation({
    mutationFn: () => chatApi.create(listingId),
    onSuccess: (res) => {
      router.push(`/dashboard/chat/${res.data.conversation.id}`);
    },
  });

  const listing: Listing | undefined = listingData;
  const bids: Bid[] = bidsData?.data ?? [];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="aspect-[4/3] bg-gray-100 rounded-xl" />
        <div className="h-6 bg-gray-100 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{tCommon("error")}</p>
      </div>
    );
  }

  const images = listing.images;
  const selectedImage = images[selectedImageIndex];
  const isBidType =
    listing.sell_type === "bid" || listing.sell_type === "both";
  const isDirectBuy =
    listing.sell_type === "direct_buy" || listing.sell_type === "both";
  const seller = listing.user;

  const handlePlaceBid = () => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setBidError("Enter a valid amount");
      return;
    }
    placeBidMutation.mutate(amount);
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    startChatMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: listing.title,
        url: window.location.href,
      });
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Gallery */}
        <div className="space-y-3">
          {/* Main Image */}
          <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden">
            {selectedImage ? (
              <Image
                src={selectedImage.image_url}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-300">
                <svg
                  className="w-16 h-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === selectedImageIndex
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={img.thumbnail_url || img.image_url}
                    alt=""
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="space-y-5">
          {/* Title & Condition */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-dark">{listing.title}</h1>
              <div className="flex items-center gap-2 shrink-0">
                {/* Favorite */}
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      router.push("/auth/login");
                      return;
                    }
                    favoriteMutation.mutate();
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className={`w-5 h-5 ${
                      isFavorited ? "text-error fill-error" : "text-gray-400"
                    }`}
                    fill={isFavorited ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <ConditionBadge condition={listing.condition} locale={locale} />
              {listing.is_negotiable && (
                <span className="text-xs text-accent font-medium">
                  {t("negotiable")}
                </span>
              )}
            </div>
          </div>

          {/* Price / Bid Section */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {isDirectBuy && listing.price && (
              <div>
                <p className="text-sm text-gray-500">{t("price")}</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(listing.price)}
                </p>
                {listing.price_usd && (
                  <p className="text-xs text-gray-400">
                    ~{formatPrice(listing.price_usd, "USD")}
                  </p>
                )}
                <button
                  onClick={handleBuyNow}
                  disabled={startChatMutation.isPending}
                  className="mt-3 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {startChatMutation.isPending
                    ? tCommon("loading")
                    : t("buyNow")}
                </button>
              </div>
            )}

            {isBidType && listing.bid_end_at && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {listing.current_bid ? t("bids") : t("bid")}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(
                        listing.current_bid || listing.bid_start_price
                      )}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm text-gray-500">{t("timeLeft")}</p>
                    <BidTimer endAt={listing.bid_end_at} />
                  </div>
                </div>

                <p className="text-xs text-gray-400">
                  {listing.bid_count} {t("bids")}
                </p>

                {/* Place Bid Form */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => {
                      setBidAmount(e.target.value);
                      setBidError("");
                    }}
                    placeholder="Amount (IQD)"
                    className="flex-1 h-12 px-4 rounded-xl bg-white border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={handlePlaceBid}
                    disabled={placeBidMutation.isPending}
                    className="px-6 h-12 bg-accent text-white font-semibold rounded-xl hover:bg-accent-light transition-colors disabled:opacity-50"
                  >
                    {placeBidMutation.isPending
                      ? tCommon("loading")
                      : t("bidNow")}
                  </button>
                </div>
                {bidError && (
                  <p className="text-xs text-error">{bidError}</p>
                )}

                {/* Bid History */}
                {bids.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h4 className="text-sm font-semibold text-dark">
                      {t("bids")}
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {bids.map((bid) => (
                        <div
                          key={bid.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                            bid.is_winning
                              ? "bg-primary/10 text-primary"
                              : "bg-white"
                          }`}
                        >
                          <span className="font-medium">
                            {bid.user?.name || "User"}
                          </span>
                          <div className="text-end">
                            <span className="font-bold">
                              {formatPrice(bid.amount)}
                            </span>
                            <span className="text-xs text-gray-400 ms-2">
                              {timeAgo(bid.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-dark mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {listing.description}
            </p>
          </div>

          {/* City */}
          {listing.city && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
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
              {getCityName(listing.city, locale)}
            </div>
          )}

          {/* Category */}
          {listing.category && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{listing.category.icon}</span>
              <Link
                href={`/categories/${listing.category.slug}`}
                className="hover:text-primary transition-colors"
              >
                {getCategoryName(listing.category, locale)}
              </Link>
            </div>
          )}

          {/* Views */}
          <p className="text-xs text-gray-400">
            {listing.view_count} {t("views")} &middot; {timeAgo(listing.created_at)}
          </p>

          {/* AI Analysis Section */}
          {listing.ai_analysis && Object.keys(listing.ai_analysis).length > 0 && (
            <div className="bg-info/5 border border-info/20 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-info mb-2 flex items-center gap-2">
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
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                AI Analysis
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                {listing.ai_analysis.condition_rating != null && (
                  <p>
                    Condition Rating:{" "}
                    <span className="font-medium">
                      {String(listing.ai_analysis.condition_rating)}/10
                    </span>
                  </p>
                )}
                {Array.isArray(listing.ai_analysis.defects) &&
                  (listing.ai_analysis.defects as string[]).length > 0 && (
                    <div>
                      <p className="font-medium">Detected Issues:</p>
                      <ul className="list-disc list-inside ms-2">
                        {(listing.ai_analysis.defects as string[]).map(
                          (defect: string, i: number) => (
                            <li key={i}>{defect}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                {listing.ai_analysis.suggested_price != null && (
                  <p>
                    Suggested Price:{" "}
                    <span className="font-medium text-primary">
                      {formatPrice(
                        String(listing.ai_analysis.suggested_price)
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Seller Card */}
          {seller && (
            <Link
              href={`/profile/${seller.id}`}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-primary/30 transition-colors"
            >
              {seller.avatar_url ? (
                <img
                  src={seller.avatar_url}
                  alt={seller.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">
                  {seller.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-dark text-sm">
                  {seller.name}
                </p>
                <p className="text-xs text-gray-400">
                  {seller.total_sales} sales
                </p>
              </div>
              <TrustBadge score={seller.trust_score} />
            </Link>
          )}

          {/* Report Button */}
          <button className="text-xs text-gray-400 hover:text-error transition-colors">
            {tCommon("report")}
          </button>
        </div>
      </div>
    </div>
  );
}
