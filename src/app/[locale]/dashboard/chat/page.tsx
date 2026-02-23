"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { chatApi, Conversation } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function ChatListPage() {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    }
  }, [isLoggedIn, router]);

  // Fetch conversations
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => chatApi.conversations(),
    select: (res) => res.data,
    enabled: isLoggedIn,
    refetchInterval: 10000, // Poll every 10s
  });

  const conversations: Conversation[] = conversationsData?.data ?? [];

  if (!isLoggedIn) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-dark mb-6">{tNav("chat")}</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-100 animate-pulse"
            >
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-gray-500 text-sm">{t("noResults")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const otherUser =
              conv.buyer_id === user?.id ? conv.seller : conv.buyer;
            const listingImage =
              conv.listing?.images?.[0]?.thumbnail_url ||
              conv.listing?.images?.[0]?.image_url;
            const latestMessage = conv.latest_message;
            const isUnread =
              latestMessage &&
              latestMessage.sender_id !== user?.id &&
              !latestMessage.read_at;

            return (
              <Link
                key={conv.id}
                href={`/dashboard/chat/${conv.id}`}
                className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${
                  isUnread
                    ? "bg-primary/5 hover:bg-primary/10"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {/* Listing thumbnail */}
                <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                  {listingImage ? (
                    <img
                      src={listingImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <svg
                        className="w-6 h-6"
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

                {/* Chat info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm font-semibold text-dark truncate ${
                        isUnread ? "font-bold" : ""
                      }`}
                    >
                      {otherUser?.name || "User"}
                    </p>
                    {conv.last_message_at && (
                      <span className="text-xs text-gray-400 shrink-0 ms-2">
                        {timeAgo(conv.last_message_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {conv.listing?.title}
                  </p>
                  {latestMessage && (
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        isUnread ? "text-dark font-medium" : "text-gray-400"
                      }`}
                    >
                      {latestMessage.image_url
                        ? "Photo"
                        : latestMessage.body || ""}
                    </p>
                  )}
                </div>

                {/* Unread indicator */}
                {isUnread && (
                  <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
