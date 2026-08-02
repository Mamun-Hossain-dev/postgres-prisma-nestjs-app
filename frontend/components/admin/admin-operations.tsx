"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Boxes,
  Building2,
  Check,
  PackageX,
  Plus,
  Star,
  Tags,
  TicketPercent,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { apiFetch, minorMoney } from "@/lib/api";
import type {
  CatalogOperationsSummary,
  Coupon,
  InventoryPage,
  PaginatedReviews,
  Product,
  ReviewStatus,
} from "@/lib/types";

function useSummary() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["operations", "summary"],
    queryFn: () =>
      apiFetch<CatalogOperationsSummary>(
        "/operations/summary",
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
  });
}

export function AdminInventory() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const summary = useSummary();
  const [page, setPage] = useState(1);
  const [stock, setStock] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("Manual inventory count");
  const params = new URLSearchParams({
    page: String(page),
    limit: "12",
    stock,
  });
  if (search.trim()) params.set("search", search.trim());
  const inventory = useQuery({
    queryKey: ["operations", "inventory", params.toString()],
    queryFn: () =>
      apiFetch<InventoryPage>(
        `/operations/inventory?${params}`,
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
    placeholderData: (previous) => previous,
  });
  const adjust = useMutation({
    mutationFn: () =>
      apiFetch(
        `/operations/inventory/${editing?.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ quantity, reason }),
        },
        accessToken,
      ),
    onSuccess: async () => {
      toast.success("Stock updated and movement recorded");
      setEditing(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const totals = summary.data?.inventory;
  return (
    <section>
      <AdminPageHeader
        eyebrow="Stock control"
        title="Inventory."
        description="Monitor stock health and record every manual adjustment."
      />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Products"
          value={totals?.totalProducts ?? 0}
          icon={<Boxes />}
        />
        <Metric
          label="Units in stock"
          value={totals?.totalUnits ?? 0}
          icon={<Warehouse />}
        />
        <Metric
          label="Low stock"
          value={totals?.lowStockProducts ?? 0}
          icon={<PackageX />}
        />
        <Metric
          label="Out of stock"
          value={totals?.outOfStockProducts ?? 0}
          icon={<X />}
        />
      </div>
      {editing && (
        <div className="mt-5 grid gap-4 rounded-[1.5rem] border bg-white p-5 md:grid-cols-[1fr_180px_1fr_auto] md:items-end">
          <div>
            <p className="text-xs text-black/40">Adjusting</p>
            <p className="mt-1 font-bold">{editing.title}</p>
          </div>
          <Field label="New quantity">
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </Field>
          <Field label="Reason">
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={() => adjust.mutate()} loading={adjust.isPending}>
              Save
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      <div className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="grid gap-3 border-b p-4 md:grid-cols-[1fr_220px]">
          <Input
            placeholder="Search product, SKU or brand"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <Select
            ariaLabel="Stock filter"
            value={stock}
            onValueChange={(value) => {
              setStock(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: "All stock" },
              { value: "low", label: "Low stock" },
              { value: "out", label: "Out of stock" },
            ]}
          />
        </div>
        {inventory.isError ? (
          <OperationError message={inventory.error.message} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-black/40">
                <tr>
                  <th className="p-5">Product</th>
                  <th className="p-5">Brand</th>
                  <th className="p-5">Stock</th>
                  <th className="p-5">Last change</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(inventory.data?.data ?? []).map((product) => {
                  const movement = product.stockMovements?.[0];
                  return (
                    <tr key={product.id}>
                      <td className="p-5">
                        <p className="font-bold">{product.title}</p>
                        <p className="text-xs text-black/40">{product.sku}</p>
                      </td>
                      <td className="p-5">{product.brand}</td>
                      <td className="p-5">
                        <StockBadge quantity={product.quantity} />
                      </td>
                      <td className="p-5 text-xs text-black/45">
                        {movement
                          ? `${movement.change > 0 ? "+" : ""}${movement.change} · ${movement.reason}`
                          : "No adjustments"}
                      </td>
                      <td className="p-5 text-right">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditing(product);
                            setQuantity(product.quantity);
                          }}
                        >
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {inventory.data?.meta && (
          <Pagination
            page={inventory.data.meta.page}
            totalPages={inventory.data.meta.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
}

export function AdminCategories() {
  const query = useSummary();
  return (
    <SummaryList
      title="Categories."
      eyebrow="Catalog taxonomy"
      description="See how products and stock are distributed across storefront departments."
      icon={<Tags />}
      loading={query.isLoading}
      error={query.error?.message}
      rows={(query.data?.categories ?? []).map((item) => ({
        name: item.category.replaceAll("_", " "),
        count: item.productCount,
        stock: item.stockCount,
      }))}
    />
  );
}

export function AdminBrands() {
  const query = useSummary();
  return (
    <SummaryList
      title="Brands."
      eyebrow="Manufacturers"
      description="Track every manufacturer represented in the DeviceDock catalog."
      icon={<Building2 />}
      loading={query.isLoading}
      error={query.error?.message}
      rows={(query.data?.brands ?? []).map((item) => ({
        name: item.brand,
        count: item.productCount,
        stock: item.stockCount,
      }))}
    />
  );
}

function SummaryList({
  title,
  eyebrow,
  description,
  icon,
  rows,
  loading,
  error,
}: {
  title: string;
  eyebrow: string;
  description: string;
  icon: ReactNode;
  loading: boolean;
  error?: string;
  rows: Array<{ name: string; count: number; stock: number }>;
}) {
  return (
    <section>
      <AdminPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <div className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="flex items-center gap-3 border-b p-6 text-accent">
          {icon}
          <span className="font-bold">Live catalog summary</span>
        </div>
        {loading ? (
          <p className="p-8 text-sm text-black/45">Loading catalog summary…</p>
        ) : error ? (
          <OperationError message={error} />
        ) : rows.length ? (
          <div className="divide-y">
            {rows.map((row) => (
              <div
                key={row.name}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-6 p-5"
              >
                <p className="font-bold">{row.name}</p>
                <Badge>{row.count} products</Badge>
                <p className="w-24 text-right text-sm text-black/45">
                  {row.stock} units
                </p>
              </div>
            ))}
          </div>
        ) : (
          <OperationError message="No catalog records found." />
        )}
      </div>
    </section>
  );
}

export function AdminReviews() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ReviewStatus | "all">("PENDING");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["operations", "reviews", status, page],
    queryFn: () =>
      apiFetch<PaginatedReviews>(
        `/operations/reviews?page=${page}&limit=12${status === "all" ? "" : `&status=${status}`}`,
        {},
        accessToken,
      ),
    enabled: Boolean(accessToken),
  });
  const moderate = useMutation({
    mutationFn: ({ id, next }: { id: number; next: "APPROVED" | "REJECTED" }) =>
      apiFetch(
        `/operations/reviews/${id}`,
        { method: "PATCH", body: JSON.stringify({ status: next }) },
        accessToken,
      ),
    onSuccess: async () => {
      toast.success("Review status updated");
      await queryClient.invalidateQueries({
        queryKey: ["operations", "reviews"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <section>
      <AdminPageHeader
        eyebrow="Customer trust"
        title="Reviews."
        description="Moderate feedback submitted by verified customers."
      />
      <div className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="border-b p-4">
          <Select
            ariaLabel="Review status"
            value={status}
            onValueChange={(value) => {
              setStatus(value as ReviewStatus | "all");
              setPage(1);
            }}
            options={[
              { value: "all", label: "All reviews" },
              { value: "PENDING", label: "Pending" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
            ]}
          />
        </div>
        {query.isError ? (
          <OperationError message={query.error.message} />
        ) : query.data?.data.length ? (
          <div className="divide-y">
            {query.data.data.map((review) => (
              <article key={review.id} className="p-6">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="font-bold">{review.title}</p>
                    <p className="mt-1 text-xs text-black/40">
                      {review.product.title} · {review.user.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} size={14} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-black/55">
                  {review.comment}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge
                    tone={
                      review.status === "APPROVED"
                        ? "success"
                        : review.status === "REJECTED"
                          ? "danger"
                          : "warning"
                    }
                  >
                    {review.status}
                  </Badge>
                  {review.isVerified && (
                    <Badge tone="accent">
                      <BadgeCheck size={12} /> Verified order
                    </Badge>
                  )}
                  <span className="flex-1" />
                  {review.status !== "APPROVED" && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        moderate.mutate({ id: review.id, next: "APPROVED" })
                      }
                    >
                      <Check size={15} /> Approve
                    </Button>
                  )}
                  {review.status !== "REJECTED" && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        moderate.mutate({ id: review.id, next: "REJECTED" })
                      }
                    >
                      <X size={15} /> Reject
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <OperationError message="No reviews match this filter." />
        )}
        {query.data?.meta && (
          <Pagination
            page={query.data.meta.page}
            totalPages={query.data.meta.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
}

export function AdminCoupons() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState(10);
  const [minimum, setMinimum] = useState(0);
  const [limit, setLimit] = useState("");
  const query = useQuery({
    queryKey: ["operations", "coupons"],
    queryFn: () => apiFetch<Coupon[]>("/operations/coupons", {}, accessToken),
    enabled: Boolean(accessToken),
  });
  const save = useMutation({
    mutationFn: () =>
      apiFetch<Coupon>(
        "/operations/coupons",
        {
          method: "POST",
          body: JSON.stringify({
            code,
            type,
            value: type === "FIXED" ? Math.round(value * 100) : value,
            minimumAmount: Math.round(minimum * 100),
            ...(limit ? { usageLimit: Number(limit) } : {}),
          }),
        },
        accessToken,
      ),
    onSuccess: async () => {
      setCode("");
      toast.success("Coupon created");
      await queryClient.invalidateQueries({
        queryKey: ["operations", "coupons"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const update = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiFetch(
        `/operations/coupons/${id}`,
        { method: "PATCH", body: JSON.stringify({ isActive }) },
        accessToken,
      ),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["operations", "coupons"] }),
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/operations/coupons/${id}`, { method: "DELETE" }, accessToken),
    onSuccess: async () => {
      toast.success("Coupon deleted");
      await queryClient.invalidateQueries({
        queryKey: ["operations", "coupons"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <section>
      <AdminPageHeader
        eyebrow="Promotions"
        title="Coupons."
        description="Create controlled discounts with minimum orders and usage limits."
      />
      <div className="mt-6 rounded-[2rem] border bg-white/55 p-6 shadow-soft">
        <div className="grid gap-4 lg:grid-cols-5">
          <Field label="Coupon code">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="SAVE10"
            />
          </Field>
          <Field label="Discount type">
            <Select
              ariaLabel="Discount type"
              value={type}
              onValueChange={(value) => setType(value as typeof type)}
              options={[
                { value: "PERCENTAGE", label: "Percentage" },
                { value: "FIXED", label: "Fixed amount" },
              ]}
            />
          </Field>
          <Field label={type === "FIXED" ? "Value (BDT)" : "Value (%)"}>
            <Input
              type="number"
              min={1}
              value={value}
              onChange={(event) => setValue(Number(event.target.value))}
            />
          </Field>
          <Field label="Minimum order (BDT)">
            <Input
              type="number"
              min={0}
              value={minimum}
              onChange={(event) => setMinimum(Number(event.target.value))}
            />
          </Field>
          <Field label="Usage limit" hint="Leave blank for unlimited">
            <Input
              type="number"
              min={1}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
          </Field>
        </div>
        <Button
          className="mt-5"
          disabled={code.length < 3}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          <Plus size={16} /> Create coupon
        </Button>
      </div>
      <div className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        {query.isError ? (
          <OperationError message={query.error.message} />
        ) : query.data?.length ? (
          <div className="divide-y">
            {query.data.map((coupon) => (
              <div
                key={coupon.id}
                className="grid gap-4 p-5 md:grid-cols-[1fr_auto_auto_auto] md:items-center"
              >
                <div>
                  <p className="font-bold">{coupon.code}</p>
                  <p className="mt-1 text-xs text-black/40">
                    Minimum {minorMoney(coupon.minimumAmount, "bdt")}
                  </p>
                </div>
                <p className="font-bold">
                  {coupon.type === "PERCENTAGE"
                    ? `${coupon.value}%`
                    : minorMoney(coupon.value, "bdt")}
                </p>
                <Badge tone={coupon.isActive ? "success" : "danger"}>
                  {coupon.isActive ? "Active" : "Inactive"} · {coupon.usedCount}{" "}
                  used
                </Badge>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      update.mutate({
                        id: coupon.id,
                        isActive: !coupon.isActive,
                      })
                    }
                  >
                    {coupon.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => remove.mutate(coupon.id)}
                    aria-label={`Delete ${coupon.code}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<TicketPercent />}
            title="No coupons yet"
            description="Create the first promotion above."
          />
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white/60 p-5">
      <div className="flex items-center justify-between text-black/40">
        <span className="text-xs font-bold uppercase">{label}</span>
        {icon}
      </div>
      <p className="display mt-4 text-3xl">{value}</p>
    </div>
  );
}
function StockBadge({ quantity }: { quantity: number }) {
  return (
    <Badge
      tone={quantity === 0 ? "danger" : quantity < 5 ? "warning" : "success"}
    >
      {quantity === 0 ? "Out of stock" : `${quantity} units`}
    </Badge>
  );
}
function OperationError({ message }: { message: string }) {
  return (
    <EmptyState
      icon={<Warehouse />}
      title="Nothing to show"
      description={message}
    />
  );
}
