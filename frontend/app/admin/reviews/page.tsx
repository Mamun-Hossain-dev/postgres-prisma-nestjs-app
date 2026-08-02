import type { Metadata } from "next";
import { AdminReviews } from "@/components/admin/admin-operations";

export const metadata: Metadata = { title: "Reviews - DeviceDock Admin" };
export default function Page() {
  return <AdminReviews />;
}
