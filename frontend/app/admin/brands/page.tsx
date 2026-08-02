import type { Metadata } from "next";
import { AdminBrands } from "@/components/admin/admin-operations";

export const metadata: Metadata = { title: "Brands - DeviceDock Admin" };
export default function Page() {
  return <AdminBrands />;
}
