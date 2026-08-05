"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  ChevronDown,
  History,
  Minus,
  PackageX,
  Plus,
  Search,
  Warehouse,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { Select, type SelectOption } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, money } from "@/lib/api";
import type {
  CatalogOperationsSummary,
  InventoryPage,
  Product,
  StockMovement,
  StockMovementPage,
} from "@/lib/types";

const reasonOptions: SelectOption[] = [
  { value: "Manual inventory count", label: "Manual inventory count" },
  { value: "Supplier restock", label: "Supplier restock" },
  { value: "Damaged stock written off", label: "Damaged stock written off" },
  { value: "Stock correction", label: "Stock correction" },
];

const stockTabs: Array<{ value: "all" | "low" | "out"; label: string }> = [
  { value: "all", label: "All stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];

export function AdminInventory() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [stock, setStock] = useState<"all" | "low" | "out">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("Manual inventory count");

  const summary = useQuery({
    queryKey: ["operations", "summary"],
    queryFn: () =>
      apiFetch<CatalogOperationsSummary>("/operations/summary", {}, accessToken),
    enabled: Boolean(accessToken),
  });

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
  const products = inventory.data?.data ?? [];
  const activeTabCount =
    stock === "low"
      ? totals?.lowStockProducts
      : stock === "out"
        ? totals?.outOfStockProducts
        : totals?.totalProducts;

  return (
    <section>
      <AdminPageHeader
        eyebrow="Stock control"
        title="Inventory."
        description="Monitor stock health, adjust levels and track every movement on the warehouse floor."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Products"
          value={totals?.totalProducts ?? 0}
          icon={<Boxes />}
          loading={summary.isLoading}
        />
        <Metric
          label="Units in stock"
          value={totals?.totalUnits ?? 0}
          icon={<Warehouse />}
          loading={summary.isLoading}
        />
        <Metric
          label="Low stock"
          value={totals?.lowStockProducts ?? 0}
          icon={<PackageX />}
          tone="warning"
          loading={summary.isLoading}
        />
        <Metric
          label="Out of stock"
          value={totals?.outOfStockProducts ?? 0}
          icon={<X />}
          tone="danger"
          loading={summary.isLoading}
        />
      </div>

      {editing && (
        <div className="mt-5 rounded-[1.5rem] border bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-black/40">Adjusting</p>
              <p className="mt-1 font-bold">{editing.title}</p>
              <p className="mt-1 text-xs text-black/45">
                {editing.sku} · currently {editing.quantity} units
              </p>
            </div>
            <div className="flex gap-2">
              {[10, 5, 1].map((step) => (
                <Button
                  key={step}
                  variant="outline"
                  className="h-10 w-10 rounded-xl px-0"
                  aria-label={`Decrease by ${step}`}
                  onClick={() =>
                    setQuantity((value) => Math.max(0, value - step))
                  }
                >
                  <Minus size={15} />
                </Button>
              ))}
              {[1, 5, 10].map((step) => (
                <Button
                  key={step}
                  variant="outline"
                  className="h-10 w-10 rounded-xl px-0"
                  aria-label={`Increase by ${step}`}
                  onClick={() =>
                    setQuantity((value) => Math.min(1_000_000, value + step))
                  }
                >
                  <Plus size={15} />
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
            <div>
              <p className="mb-2 text-sm font-bold">New quantity</p>
              <Input
                type="number"
                min={0}
                max={1_000_000}
                value={quantity}
                onChange={(event) =>
                  setQuantity(Number(event.target.value))
                }
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-bold">Reason</p>
              <Select
                ariaLabel="Adjustment reason"
                value={reason}
                onValueChange={setReason}
                options={reasonOptions}
                className="h-14"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => adjust.mutate()} loading={adjust.isPending}>
                Save adjustment
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-[2rem] border bg-white/55 shadow-soft">
        <div className="grid gap-3 border-b p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/35"
            />
            <Input
              placeholder="Search product, SKU or brand"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-11 pl-11"
            />
          </div>
          <div className="flex gap-1 rounded-full border bg-white/60 p-1">
            {stockTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStock(tab.value);
                  setPage(1);
                }}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  stock === tab.value
                    ? "bg-ink text-white"
                    : "text-black/55 hover:text-ink"
                }`}
              >
                {tab.label}
                {tab.value === stock && typeof activeTabCount === "number" && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {activeTabCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {inventory.isLoading ? (
          <InventoryTableSkeleton />
        ) : inventory.isError ? (
          <EmptyState
            icon={<Warehouse />}
            title="Inventory could not be loaded"
            description={inventory.error.message}
            action={
              <Button onClick={() => void inventory.refetch()}>Try again</Button>
            }
          />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<PackageX />}
            title="No products match"
            description="Change the search or stock filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b bg-black/[0.025] text-[11px] uppercase tracking-wider text-black/40">
                <tr>
                  <th className="px-5 py-4 font-bold">Product</th>
                  <th className="px-5 py-4 font-bold">Stock</th>
                  <th className="px-5 py-4 font-bold">Value</th>
                  <th className="px-5 py-4 font-bold">Last change</th>
                  <th className="px-5 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    expanded={expandedId === product.id}
                    onToggleExpand={() =>
                      setExpandedId((current) =>
                        current === product.id ? null : product.id,
                      )
                    }
                    onAdjust={() => {
                      setEditing(product);
                      setQuantity(product.quantity);
                      setReason("Manual inventory count");
                    }}
                    accessToken={accessToken}
                  />
                ))}
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

function ProductRow({
  product,
  expanded,
  onToggleExpand,
  onAdjust,
  accessToken,
}: {
  product: Product;
  expanded: boolean;
  onToggleExpand: () => void;
  onAdjust: () => void;
  accessToken: string | null;
}) {
  const latest = product.stockMovements?.[0];
  const history = useQuery({
    queryKey: ["operations", "movements", product.id],
    queryFn: () =>
      apiFetch<StockMovementPage>(
        `/operations/inventory/${product.id}/movements?page=1&limit=15`,
        {},
        accessToken,
      ),
    enabled: expanded && Boolean(accessToken),
  });

  return (
    <>
      <tr className="transition hover:bg-white/70">
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#d8d0c0]">
              {product.images[0]?.url ? (
                <Image
                  src={product.images[0].url}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-[28%] rotate-6 rounded bg-ink" />
              )}
            </div>
            <div>
              <p className="font-bold">{product.title}</p>
              <p className="mt-1 text-xs text-black/40">
                {product.sku} · {product.brand}
              </p>
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <StockHealth quantity={product.quantity} />
        </td>
        <td className="px-5 py-4 font-semibold">
          {money(product.price * product.quantity)}
        </td>
        <td className="px-5 py-4">
          {latest ? (
            <p className="text-xs leading-5 text-black/55">
              <span
                className={
                  latest.change > 0 ? "font-bold text-emerald-700" : "text-black/55"
                }
              >
                {latest.change > 0 ? `+${latest.change}` : latest.change}
              </span>{" "}
              · {latest.reason}
              <span className="block text-[11px] text-black/35">
                {new Date(latest.createdAt).toLocaleString("en-BD")} by{" "}
                {latest.adjustedBy?.name ?? "admin"}
              </span>
            </p>
          ) : (
            <span className="text-xs text-black/40">No adjustments</span>
          )}
        </td>
        <td className="px-5 py-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="h-9 px-3 text-xs" onClick={onAdjust}>
              Adjust
            </Button>
            <Button
              variant={expanded ? "secondary" : "ghost"}
              className="h-9 px-3 text-xs"
              onClick={onToggleExpand}
            >
              <History size={14} /> {expanded ? "Hide history" : "History"}
              <ChevronDown
                size={14}
                className={`transition ${expanded ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-black/[0.02]">
          <td colSpan={5} className="px-5 py-4">
            {history.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-full" />
                ))}
              </div>
            ) : history.data?.data.length ? (
              <MovementHistory movements={history.data.data} />
            ) : (
              <p className="py-4 text-sm text-black/45">
                No stock movements recorded for this product yet.
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function MovementHistory({ movements }: { movements: StockMovement[] }) {
  return (
    <ol className="relative ml-3 space-y-5 border-l border-dashed border-black/15 pl-6">
      {movements.map((movement) => (
        <li key={movement.id} className="relative">
          <span
            className={`absolute -left-[31px] top-0.5 h-3 w-3 rounded-full border-2 ${
              movement.change > 0
                ? "border-emerald-500 bg-white"
                : "border-amber-500 bg-white"
            }`}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-bold">
              {movement.change > 0
                ? `+${movement.change} units`
                : `${movement.change} units`}{" "}
              <span className="ml-2 font-normal text-black/45">
                {movement.reason}
              </span>
            </p>
            <p className="text-[11px] text-black/40">
              {new Date(movement.createdAt).toLocaleString("en-BD")} ·{" "}
              {movement.adjustedBy?.name ?? "admin"}
            </p>
          </div>
          <p className="mt-1 text-xs text-black/45">
            {movement.previousStock} → {movement.newStock} units
          </p>
        </li>
      ))}
    </ol>
  );
}

function StockHealth({ quantity }: { quantity: number }) {
  const tone =
    quantity === 0 ? "danger" : quantity < 5 ? "warning" : "success";
  const barWidth = Math.min(quantity / 20, 1) * 100;
  return (
    <div className="w-32">
      <div className="flex items-center justify-between gap-3">
        <Badge tone={tone}>
          {quantity === 0 ? "Out of stock" : `${quantity} units`}
        </Badge>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
        <div
          className={`h-full rounded-full ${
            quantity === 0
              ? "bg-red-500"
              : quantity < 5
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  tone = "neutral",
  loading = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "neutral" | "warning" | "danger";
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white/60 p-5">
      <div className="flex items-center justify-between text-black/40">
        <span className="text-xs font-bold uppercase">{label}</span>
        <span
          className={
            tone === "danger"
              ? "text-red-500"
              : tone === "warning"
                ? "text-amber-500"
                : "text-accent"
          }
        >
          {icon}
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-8 w-20" />
      ) : (
        <p className="display mt-4 text-3xl">{value}</p>
      )}
    </div>
  );
}

function InventoryTableSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-5 px-5 py-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="ml-auto h-4 w-24" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      ))}
    </div>
  );
}
