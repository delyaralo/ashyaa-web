"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Listing } from "@/lib/api";
import { formatPrice, getCityName } from "@/lib/utils";
import ConditionBadge from "./ConditionBadge";
import BidTimer from "./BidTimer";

interface ListingCardProps {
  listing: Listing;
  locale: string;
}

export default function ListingCard({ listing, locale }: ListingCardProps) {
  const t = useTranslations("listing");

  const primaryImage = listing.images.find((img) => img.is_primary) ?? listing.images[0];
  const imageUrl = primaryImage?.thumbnail_url || primaryImage?.image_url;
  const isBidding =
    (listing.sell_type === "bid" || listing.sell_type === "both") &&
    listing.bid_end_at;
  const displayPrice =
    listing.sell_type === "bid"
      ? listing.current_bid || listing.bid_start_price
      : listing.price;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`block rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow ${
        listing.is_featured ? "ring-2 ring-accent" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <svg
              className="w-12 h-12"
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

        {/* Featured badge */}
        {listing.is_featured && (
          <span className="absolute top-2 start-2 bg-accent text-white text-xs font-semibold px-2 py-0.5 rounded">
            {t("featured")}
          </span>
        )}

        {/* Condition badge */}
        <div className="absolute bottom-2 start-2">
          <ConditionBadge condition={listing.condition} locale={locale} />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-dark line-clamp-2 mb-1">
          {listing.title}
        </h3>

        <p className="text-primary font-bold text-base">
          {formatPrice(displayPrice)}
        </p>

        {/* Bid countdown */}
        {isBidding && listing.bid_end_at && (
          <div className="flex items-center gap-1 mt-1">
            <svg
              className="w-3.5 h-3.5 text-gray-400"
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
            <BidTimer endAt={listing.bid_end_at} />
          </div>
        )}

        {/* City */}
        {listing.city && (
          <p className="text-xs text-gray-400 mt-1">
            {getCityName(listing.city, locale)}
          </p>
        )}
      </div>
    </Link>
  );
}
