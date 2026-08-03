"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/field";
import { apiFetch } from "@/lib/api";
import type { Address } from "@/lib/types";

type AddressValues = Omit<Address, "id">;

export function AddressesPage() {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const addresses = useQuery({
    queryKey: ["account", "addresses"],
    queryFn: () => apiFetch<Address[]>("/account/addresses", {}, accessToken),
    enabled: Boolean(accessToken),
  });
  const { register, handleSubmit, reset, formState } = useForm<AddressValues>({
    defaultValues: {
      label: "Home",
      recipientName: user?.name ?? "",
      phone: user?.phone ?? "",
      addressLine: "",
      area: "",
      city: "Dhaka",
      postalCode: "",
      deliveryZone: "DHAKA",
      isDefault: false,
    },
  });
  const save = useMutation({
    mutationFn: ({
      values,
      id,
    }: {
      values: AddressValues;
      id: number | null;
    }) =>
      apiFetch<Address>(
        id ? `/account/addresses/${id}` : "/account/addresses",
        { method: id ? "PUT" : "POST", body: JSON.stringify(values) },
        accessToken,
      ),
    onSuccess: async () => {
      reset();
      setEditingId(null);
      toast.success("Address saved");
      await queryClient.invalidateQueries({
        queryKey: ["account", "addresses"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch<null>(
        `/account/addresses/${id}`,
        { method: "DELETE" },
        accessToken,
      ),
    onSuccess: async () => {
      toast.success("Address removed");
      await queryClient.invalidateQueries({
        queryKey: ["account", "addresses"],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AccountShell active="addresses">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <form
          onSubmit={handleSubmit((values) =>
            save.mutate({ values, id: editingId }),
          )}
          className="grid content-start gap-4 rounded-[2rem] border bg-white/55 p-7 shadow-soft"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            Delivery details
          </p>
          <h1 className="display text-4xl">
            {editingId ? "Edit address." : "Add an address."}
          </h1>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label">
              <Input {...register("label", { required: true })} />
            </Field>
            <Field label="Recipient">
              <Input {...register("recipientName", { required: true })} />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                placeholder="e.g. 01XXXXXXXXX"
                {...register("phone", { required: true, minLength: 7 })}
              />
            </Field>
            <Field label="Area">
              <Input {...register("area", { required: true })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Address">
                <Input
                  placeholder="House, road, block or village"
                  {...register("addressLine", {
                    required: true,
                    minLength: 5,
                  })}
                />
              </Field>
            </div>
            <Field label="City">
              <Input {...register("city", { required: true })} />
            </Field>
            <Field label="Postal code">
              <Input {...register("postalCode")} />
            </Field>
          </div>
          <label className="text-sm font-bold">
            Delivery zone
            <select
              {...register("deliveryZone")}
              className="mt-2 h-12 w-full rounded-xl border bg-white px-3 font-normal"
            >
              <option value="DHAKA">Inside Dhaka · ৳60</option>
              <option value="OUTSIDE_DHAKA">Outside Dhaka · ৳120</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" {...register("isDefault")} /> Make default
          </label>
          <div className="flex gap-2">
            <Button
              type="submit"
              loading={formState.isSubmitting || save.isPending}
            >
              <Plus size={16} /> Save address
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  reset();
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
        <section>
          <h2 className="display text-5xl">Your addresses.</h2>
          <div className="mt-6 grid gap-4">
            {addresses.isLoading ? (
              <p>Loading addresses…</p>
            ) : addresses.data?.length ? (
              addresses.data.map((address) => (
                <article
                  key={address.id}
                  className="rounded-[1.5rem] border bg-white/55 p-6"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-bold">
                        {address.label}{" "}
                        {address.isDefault && (
                          <span className="ml-2 text-xs text-accent">
                            DEFAULT
                          </span>
                        )}
                      </p>
                      <p className="mt-2 text-sm">
                        {address.recipientName} · {address.phone}
                      </p>
                      <p className="mt-1 text-sm text-black/50">
                        {address.addressLine}, {address.area}, {address.city}
                        {address.postalCode ? ` ${address.postalCode}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          aria-label="Make default"
                          onClick={() =>
                            save.mutate({
                              id: address.id,
                              values: { ...address, isDefault: true },
                            })
                          }
                        >
                          <Star size={16} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        aria-label="Edit address"
                        onClick={() => {
                          setEditingId(address.id);
                          reset({
                            ...address,
                            postalCode: address.postalCode ?? "",
                          });
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label="Delete address"
                        className="text-red-700"
                        onClick={() => remove.mutate(address.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                icon={<MapPin />}
                title="No saved addresses"
                description="Add your first delivery address."
              />
            )}
          </div>
        </section>
      </div>
    </AccountShell>
  );
}
