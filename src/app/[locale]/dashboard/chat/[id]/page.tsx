"use client";

import { useState, useRef, useEffect, useCallback, ChangeEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { chatApi, Message, Conversation } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getEcho } from "@/lib/echo";

export default function ChatRoomPage() {
  const t = useTranslations("common");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuth();

  const conversationId = Number(params.id);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
    }
  }, [isLoggedIn, router]);

  // Fetch conversation messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => chatApi.messages(conversationId),
    select: (res) => res.data,
    enabled: isLoggedIn && !!conversationId,
    refetchInterval: 5000,
  });

  // Fetch conversations to get the conversation details
  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => chatApi.conversations(),
    select: (res) => res.data,
    enabled: isLoggedIn,
  });

  const messages: Message[] = messagesData?.data ?? [];
  const conversations: Conversation[] = conversationsData?.data ?? [];
  const conversation = conversations.find((c) => c.id === conversationId);
  const otherUser =
    conversation?.buyer_id === user?.id
      ? conversation?.seller
      : conversation?.buyer;

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (formData: FormData) =>
      chatApi.sendMessage(conversationId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setMessageText("");
    },
  });

  // WebSocket for real-time messages
  useEffect(() => {
    if (!isLoggedIn || !conversationId) return;

    try {
      const echo = getEcho();
      const channel = echo.private(`conversation.${conversationId}`);
      channel.listen(".message.sent", () => {
        queryClient.invalidateQueries({
          queryKey: ["messages", conversationId],
        });
      });

      return () => {
        echo.leave(`conversation.${conversationId}`);
      };
    } catch {
      // Echo not available, rely on polling
    }
  }, [conversationId, isLoggedIn, queryClient]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = () => {
    if (!messageText.trim() && !fileInputRef.current?.files?.length) return;

    const formData = new FormData();
    if (messageText.trim()) {
      formData.append("body", messageText.trim());
    }

    sendMessageMutation.mutate(formData);
  };

  const handleSendImage = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const formData = new FormData();
    formData.append("image", e.target.files[0]);

    sendMessageMutation.mutate(formData);
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isLoggedIn) return null;

  const listingImage =
    conversation?.listing?.images?.[0]?.thumbnail_url ||
    conversation?.listing?.images?.[0]?.image_url;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header with listing info */}
      <div className="shrink-0 bg-white rounded-t-xl border border-gray-200 p-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/chat")}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-500"
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

        {/* Listing card at top */}
        {conversation?.listing && (
          <Link
            href={`/listings/${conversation.listing.id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            {listingImage && (
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={listingImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dark truncate">
                {conversation.listing.title}
              </p>
              <p className="text-xs text-gray-500">
                {otherUser?.name || "User"}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 border-x border-gray-200 px-4 py-4 space-y-3">
        {messagesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`h-10 rounded-2xl bg-gray-200 animate-pulse ${
                    i % 2 === 0 ? "w-40" : "w-52"
                  }`}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400">Start the conversation</p>
          </div>
        ) : (
          <>
            {[...messages].reverse().map((msg) => {
              const isMine = msg.sender_id === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white text-dark rounded-bl-md shadow-sm"
                    }`}
                  >
                    {/* Image message */}
                    {msg.image_url && (
                      <div className="mb-1">
                        <img
                          src={msg.image_url}
                          alt=""
                          className="max-w-full rounded-lg"
                          style={{ maxHeight: 200 }}
                        />
                      </div>
                    )}

                    {/* Text */}
                    {msg.body && (
                      <p className="text-sm whitespace-pre-line break-words">
                        {msg.body}
                      </p>
                    )}

                    {/* Time */}
                    <p
                      className={`text-[10px] mt-1 ${
                        isMine ? "text-white/60" : "text-gray-400"
                      }`}
                    >
                      {timeAgo(msg.created_at)}
                      {isMine && msg.read_at && (
                        <span className="ms-1">
                          <svg
                            className="inline w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="shrink-0 bg-white rounded-b-xl border border-gray-200 p-3 flex items-end gap-2">
        {/* Photo button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors shrink-0"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleSendImage}
          className="hidden"
        />

        {/* Text input */}
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none max-h-32"
          style={{ minHeight: "40px" }}
        />

        {/* Send button */}
        <button
          onClick={handleSendMessage}
          disabled={
            sendMessageMutation.isPending ||
            (!messageText.trim() && !fileInputRef.current?.files?.length)
          }
          className="p-2.5 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-40 shrink-0"
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
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
