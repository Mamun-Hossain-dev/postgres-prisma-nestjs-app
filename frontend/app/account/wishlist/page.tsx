import type { Metadata } from "next";
import { WishlistPage } from "@/components/account/wishlist-page";

export const metadata: Metadata = { title: "Wishlist - DeviceDock" };

export default function Page() {
  return <WishlistPage />;
}
