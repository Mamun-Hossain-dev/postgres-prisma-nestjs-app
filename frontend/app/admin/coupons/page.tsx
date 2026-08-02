import type { Metadata } from "next";
import { AdminCoupons } from "@/components/admin/admin-operations";

export const metadata: Metadata = { title: "Coupons - DeviceDock Admin" };
export default function Page() {
  return <AdminCoupons />;
}
