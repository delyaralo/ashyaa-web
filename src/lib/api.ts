import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Types
export interface City {
  id: number;
  name_ku: string;
  name_ar: string;
  name_en: string;
  lat: string;
  lng: string;
}

export interface Category {
  id: number;
  name_ku: string;
  name_ar: string;
  name_en: string;
  slug: string;
  icon: string;
  parent_id: number | null;
  children: Category[];
}

export interface User {
  id: number;
  phone: string;
  name: string;
  avatar_url: string | null;
  city_id: number | null;
  is_verified: boolean;
  is_shop: boolean;
  trust_score: number;
  total_sales: number;
  lang: string;
  city?: City;
}

export interface ListingImage {
  id: number;
  image_url: string;
  thumbnail_url: string;
  is_primary: boolean;
}

export interface Listing {
  id: number;
  user_id: number;
  title: string;
  description: string;
  sell_type: "direct_buy" | "bid" | "both";
  price: string | null;
  price_usd: string | null;
  bid_start_price: string | null;
  current_bid: string | null;
  bid_end_at: string | null;
  bid_count: number;
  condition: "new" | "like_new" | "good" | "fair" | "poor";
  city_id: number;
  status: string;
  is_featured: boolean;
  is_negotiable: boolean;
  view_count: number;
  ai_analysis: Record<string, unknown> | null;
  created_at: string;
  images: ListingImage[];
  user?: User;
  city?: City;
  category?: Category;
}

export interface Bid {
  id: number;
  listing_id: number;
  user_id: number;
  amount: string;
  is_winning: boolean;
  created_at: string;
  user?: { id: number; name: string; avatar_url: string | null };
}

export interface Conversation {
  id: number;
  listing_id: number;
  buyer_id: number;
  seller_id: number;
  last_message_at: string;
  listing?: { id: number; title: string; images: ListingImage[] };
  buyer?: User;
  seller?: User;
  latest_message?: Message;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string | null;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
  sender?: { id: number; name: string; avatar_url: string | null };
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

// API functions
export const authApi = {
  sendOtp: (phone: string) => api.post("/auth/send-otp", { phone }),
  verifyOtp: (phone: string, code: string) =>
    api.post<{ token: string; user: User; is_new: boolean }>(
      "/auth/verify-otp",
      { phone, code }
    ),
  logout: () => api.post("/auth/logout"),
};

export const listingsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<Listing>>("/listings", { params }),
  get: (id: number) => api.get<{ listing: Listing }>(`/listings/${id}`),
  create: (data: FormData) =>
    api.post<{ listing: Listing }>("/listings", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/listings/${id}`, data),
  delete: (id: number) => api.delete(`/listings/${id}`),
  markSold: (id: number, soldToUserId?: number) =>
    api.post(`/listings/${id}/mark-sold`, {
      sold_to_user_id: soldToUserId,
    }),
  myListings: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Listing>>("/users/me/listings", { params }),
};

export const categoriesApi = {
  list: () => api.get<{ categories: Category[] }>("/categories"),
};

export const citiesApi = {
  list: () => api.get<{ cities: City[] }>("/cities"),
};

export const bidsApi = {
  place: (listingId: number, amount: number) =>
    api.post<{ bid: Bid }>(`/listings/${listingId}/bid`, { amount }),
  list: (listingId: number) =>
    api.get<PaginatedResponse<Bid>>(`/listings/${listingId}/bids`),
};

export const chatApi = {
  conversations: () =>
    api.get<PaginatedResponse<Conversation>>("/conversations"),
  create: (listingId: number) =>
    api.post<{ conversation: Conversation }>("/conversations", {
      listing_id: listingId,
    }),
  messages: (conversationId: number) =>
    api.get<PaginatedResponse<Message>>(
      `/conversations/${conversationId}/messages`
    ),
  sendMessage: (conversationId: number, data: FormData) =>
    api.post<{ message: Message }>(
      `/conversations/${conversationId}/messages`,
      data,
      { headers: { "Content-Type": "multipart/form-data" } }
    ),
};

export const favoritesApi = {
  toggle: (listingId: number) =>
    api.post<{ favorited: boolean }>(`/favorites/${listingId}`),
  list: () => api.get<PaginatedResponse<{ listing: Listing }>>("/users/me/favorites"),
};

export const usersApi = {
  get: (id: number) => api.get<{ user: User }>(`/users/${id}`),
  update: (data: FormData) =>
    api.put<{ user: User }>("/users/me", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const aiApi = {
  analyze: (images: string[]) =>
    api.post<{ analysis: Record<string, unknown> }>("/ai/analyze", { images }),
};

export const notificationsApi = {
  list: () => api.get("/users/me/notifications"),
};

export default api;
