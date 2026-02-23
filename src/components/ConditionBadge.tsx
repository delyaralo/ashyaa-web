"use client";

import { useTranslations } from "next-intl";
import { conditionColor } from "@/lib/utils";

interface ConditionBadgeProps {
  condition: string;
  locale: string;
}

export default function ConditionBadge({ condition }: ConditionBadgeProps) {
  const t = useTranslations("listing");
  const bgColor = conditionColor(condition);

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white ${bgColor}`}
    >
      {t(condition as "new" | "like_new" | "good" | "fair" | "poor")}
    </span>
  );
}
