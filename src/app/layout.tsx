import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "أشياء - Ashyaa",
  description: "Used items marketplace for Kurdistan Region, Iraq",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
