interface TrustBadgeProps {
  score: number;
}

export default function TrustBadge({ score }: TrustBadgeProps) {
  const color =
    score >= 70
      ? "bg-primary text-white"
      : score >= 40
        ? "bg-yellow-500 text-white"
        : "bg-error text-white";

  return (
    <div
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${color}`}
    >
      {score}
    </div>
  );
}
