import { Link } from "@/i18n/navigation";
import { Category } from "@/lib/api";
import { getCategoryName } from "@/lib/utils";

interface CategoryIconProps {
  category: Category;
  locale: string;
}

export default function CategoryIcon({ category, locale }: CategoryIconProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-100 transition-colors"
    >
      <span className="text-4xl">{category.icon}</span>
      <span className="text-sm font-medium text-dark text-center leading-tight">
        {getCategoryName(category, locale)}
      </span>
    </Link>
  );
}
