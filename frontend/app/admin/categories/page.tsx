import type { Metadata } from "next";
import { AdminCategories } from "@/components/admin/admin-operations";

export const metadata: Metadata = { title: "Categories - DeviceDock Admin" };
export default function Page() {
  return <AdminCategories />;
}
