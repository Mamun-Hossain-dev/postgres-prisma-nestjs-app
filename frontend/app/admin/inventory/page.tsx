import type { Metadata } from "next";
import { AdminInventory } from "@/components/admin/admin-operations";

export const metadata: Metadata = { title: "Inventory - DeviceDock Admin" };
export default function Page() {
  return <AdminInventory />;
}
