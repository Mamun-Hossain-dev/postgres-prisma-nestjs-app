import type { Metadata } from "next";
import { AddressesPage } from "@/components/account/addresses-page";

export const metadata: Metadata = { title: "Addresses - DeviceDock" };

export default function Page() {
  return <AddressesPage />;
}
