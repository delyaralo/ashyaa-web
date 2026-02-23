"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { isRtl } from "@/lib/utils";

const LOCALES = [
  { code: "ku", label: "کوردی" },
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
] as const;

export default function Header() {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn } = useAuth();
  const rtl = isRtl(locale);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setLangMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-primary shrink-0"
        >
          {t("appName")}
        </Link>

        {/* Search - hidden on mobile */}
        <div className="hidden sm:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <svg
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${
                rtl ? "right-3" : "left-3"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={t("search")}
              className={`w-full h-9 rounded-lg bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${
                rtl ? "pr-9 pl-3" : "pl-9 pr-3"
              }`}
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 ms-auto">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <span className="hidden sm:inline uppercase">{locale}</span>
            </button>

            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div className="absolute end-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc.code}
                      onClick={() => switchLocale(loc.code)}
                      className={`w-full text-start px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        locale === loc.code
                          ? "text-primary font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Auth button / avatar */}
          {isLoggedIn && user ? (
            <Link
              href="/profile"
              className="flex items-center gap-2"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                  {user.name.charAt(0)}
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              {t("login")}
            </Link>
          )}

          {/* Hamburger menu - mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {/* Mobile search */}
          <div className="relative mb-3">
            <svg
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${
                rtl ? "right-3" : "left-3"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={t("search")}
              className={`w-full h-9 rounded-lg bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${
                rtl ? "pr-9 pl-3" : "pl-9 pr-3"
              }`}
            />
          </div>

          <Link
            href="/"
            className="block py-2 text-sm text-gray-700 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            {tNav("home")}
          </Link>
          <Link
            href="/categories"
            className="block py-2 text-sm text-gray-700 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            {tNav("favorites")}
          </Link>
          <Link
            href="/chat"
            className="block py-2 text-sm text-gray-700 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            {tNav("chat")}
          </Link>

          {!isLoggedIn && (
            <Link
              href="/login"
              className="block py-2 text-sm font-medium text-primary"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("login")}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
