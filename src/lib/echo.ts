"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let echoInstance: Echo<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEcho(): Echo<any> {
  if (echoInstance) return echoInstance;

  if (typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).Pusher = Pusher;
  }

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || "ashyaa-reverb-key",
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || "localhost",
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080),
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
    authEndpoint:
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") +
      "/broadcasting/auth",
  });

  return echoInstance;
}
