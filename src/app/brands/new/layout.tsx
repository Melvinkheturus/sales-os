import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Brand | MergeX Sales OS",
  description: "Create a new operational brand workspace.",
};

export default function BrandNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
