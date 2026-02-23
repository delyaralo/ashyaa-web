import { Metadata } from "next";
import { listingsApi } from "@/lib/api";
import ListingDetailClient from "./ListingDetailClient";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await listingsApi.get(Number(id));
    const listing = res.data.listing;
    return {
      title: `${listing.title} - Ashyaa`,
      description: listing.description?.slice(0, 160),
    };
  } catch {
    return { title: "Listing - Ashyaa" };
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id, locale } = await params;
  return <ListingDetailClient listingId={Number(id)} locale={locale} />;
}
