"use client";

import { useState, useEffect } from "react";
import { getCountdown } from "@/lib/utils";

interface BidTimerProps {
  endAt: string;
}

export default function BidTimer({ endAt }: BidTimerProps) {
  const [countdown, setCountdown] = useState(getCountdown(endAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const value = getCountdown(endAt);
      setCountdown(value);
      if (value === "Ended") {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endAt]);

  const isEnded = countdown === "Ended";
  const endTime = new Date(endAt).getTime();
  const remaining = endTime - Date.now();
  const isUrgent = !isEnded && remaining < 5 * 60 * 1000;

  return (
    <span
      className={`font-mono text-sm font-semibold ${
        isEnded
          ? "text-gray-400"
          : isUrgent
            ? "text-error"
            : "text-primary"
      }`}
    >
      {countdown}
    </span>
  );
}
