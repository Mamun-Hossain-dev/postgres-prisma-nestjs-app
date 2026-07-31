'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ImagePlus, Save, Star, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { apiFetch } from '@/lib/api';
import type { Category, Product } from '@/lib/types';

const categories: Category[] = [
  'MOBILE',
  'LAPTOP',
  'TABLET',
  'AUDIO',
  'WATCH',
  'ACCESSORY',
];

interface Values {
  title: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  brand: string;
  category: Category;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  status: Product['status'];
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  offerStartsAt: string;
  offerEndsAt: string;
  publishedAt: string;
  specifications: string;
}

export function ProductForm({ product }: { product?: Product }) {
  const { accessToken } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview)),
    [previews],
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    defaultValues: {
      title: product?.title ?? '',
      slug: product?.slug ?? '',
      sku: product?.sku ?? '',
      shortDescription: product?.shortDescription ?? '',
      description: product?.description ?? '',
      brand: product?.brand ?? '',
      category: product?.category ?? 'MOBILE',
      price: product?.price,
      compareAtPrice: product?.compareAtPrice ?? undefined,
      quantity: product?.quantity ?? 0,
      status: product?.status ?? 'ACTIVE',
      isFeatured: product?.isFeatured ?? false,
      isTrending: product?.isTrending ?? false,
      isBestSeller: product?.isBestSeller ?? false,
      offerStartsAt: toDateTimeLocal(product?.offerStartsAt),
      offerEndsAt: toDateTimeLocal(product?.offerEndsAt),
      publishedAt:
        toDateTimeLocal(product?.publishedAt) ||
        toDateTimeLocal(new Date().toISOString()),
      specifications: JSON.stringify(product?.specifications ?? {}, null, 2),
    },
  });

  const save = handleSubmit(async (values) => {
    let specifications: Record<string, string>;
    try {
      const parsed: unknown = JSON.parse(values.specifications || '{}');
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error();
      }
      specifications = parsed as Record<string, string>;
    } catch {
      setError('specifications', { message: 'Enter a valid JSON object.' });
      return;
    }

    const data = new FormData();
    data.set('title', values.title.trim());
    if (values.slug.trim()) data.set('slug', values.slug.trim());
    data.set('sku', values.sku.trim());
    if (values.shortDescription.trim()) {
      data.set('shortDescription', values.shortDescription.trim());
    }
    data.set('description', values.description.trim());
    data.set('brand', values.brand.trim());
    data.set('category', values.category);
    data.set('price', String(values.price));
    if (values.compareAtPrice && !Number.isNaN(values.compareAtPrice)) {
      data.set('compareAtPrice', String(values.compareAtPrice));
    }
    data.set('quantity', String(values.quantity));
    data.set('status', values.status);
    data.set('isFeatured', String(values.isFeatured));
    data.set('isTrending', String(values.isTrending));
    data.set('isBestSeller', String(values.isBestSeller));
    if (values.offerStartsAt) {
      data.set('offerStartsAt', new Date(values.offerStartsAt).toISOString());
    }
    if (values.offerEndsAt) {
      data.set('offerEndsAt', new Date(values.offerEndsAt).toISOString());
    }
    if (values.publishedAt) {
      data.set('publishedAt', new Date(values.publishedAt).toISOString());
    }
    data.set('specifications', JSON.stringify(specifications));
    files.forEach((file) => data.append('images', file));

    try {
      const saved = await apiFetch<Product>(
        product ? `/products/${product.id}` : '/products',
        { method: product ? 'PATCH' : 'POST', body: data },
        accessToken,
      );
      queryClient.setQueryData(['product', String(saved.id)], saved);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(product ? 'Product updated' : 'Product created');
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to save product',
      );
    }
  });

  const removeImage = useMutation({
    mutationFn: (imageId: number) =>
      apiFetch<Product>(
        `/products/${product?.id}/images/${imageId}`,
        { method: 'DELETE' },
        accessToken,
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ['admin', 'product', String(product?.id)],
        updated,
      );
      toast.success('Image removed');
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm font-bold text-black/50"
      >
        <ArrowLeft size={16} /> Back to products
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            {product ? 'Catalog editor' : 'New catalog item'}
          </p>
          <h1 className="display mt-2 text-5xl sm:text-6xl">
            {product ? 'Edit product.' : 'Create product.'}
          </h1>
        </div>
        <Button
          form="product-form"
          type="submit"
          loading={isSubmitting}
          className="h-12"
        >
          <Save size={17} /> {product ? 'Save changes' : 'Publish product'}
        </Button>
      </div>

      <form id="product-form" onSubmit={save} className="mt-9 grid gap-6">
        <FormSection
          title="Product information"
          intro="The details customers use to identify this product."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Product title" error={errors.title?.message}>
              <Input
                placeholder="e.g. Pixel 9 Pro"
                {...register('title', {
                  required: 'Product title is required.',
                  minLength: {
                    value: 2,
                    message: 'Use at least 2 characters.',
                  },
                })}
              />
            </Field>
            <Field label="SKU" error={errors.sku?.message}>
              <Input
                placeholder="e.g. MOB-PIX9P-256"
                {...register('sku', { required: 'SKU is required.' })}
              />
            </Field>
            <Field
              label="Slug"
              hint="Optional. Generated from the title when blank."
            >
              <Input placeholder="pixel-9-pro" {...register('slug')} />
            </Field>
            <Field label="Brand" error={errors.brand?.message}>
              <Input
                placeholder="Google"
                {...register('brand', { required: 'Brand is required.' })}
              />
            </Field>
            <Field label="Category" error={errors.category?.message}>
              <select
                className="field"
                {...register('category', { required: true })}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>
            <Field
              label="Short description"
              hint="Shown in compact product summaries."
            >
              <Input maxLength={240} {...register('shortDescription')} />
            </Field>
          </div>
          <Field label="Full description" error={errors.description?.message}>
            <textarea
              rows={6}
              className="w-full rounded-2xl border bg-white/65 p-4 text-sm focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
              {...register('description', {
                required: 'Description is required.',
              })}
            />
          </Field>
        </FormSection>

        <FormSection
          title="Pricing & inventory"
          intro="Control pricing, stock visibility and merchandising."
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Price (BDT)" error={errors.price?.message}>
              <Input
                type="number"
                min={1}
                step="0.01"
                {...register('price', {
                  valueAsNumber: true,
                  required: 'Price is required.',
                  min: { value: 1, message: 'Price must be positive.' },
                })}
              />
            </Field>
            <Field label="Compare-at price">
              <Input
                type="number"
                min={1}
                step="0.01"
                {...register('compareAtPrice', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Stock quantity" error={errors.quantity?.message}>
              <Input
                type="number"
                min={0}
                {...register('quantity', {
                  valueAsNumber: true,
                  required: 'Stock is required.',
                  min: { value: 0, message: 'Stock cannot be negative.' },
                })}
              />
            </Field>
            <Field label="Catalog status">
              <select className="field" {...register('status')}>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex min-h-12 items-center gap-3 self-end rounded-2xl border bg-white/65 px-4">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#b4472f]"
                {...register('isFeatured')}
              />
              <Star size={16} />
              <span className="text-sm font-bold">Featured product</span>
            </label>
            <label className="flex min-h-12 items-center gap-3 self-end rounded-2xl border bg-white/65 px-4">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#b4472f]"
                {...register('isTrending')}
              />
              <Star size={16} />
              <span className="text-sm font-bold">Trending</span>
            </label>
            <label className="flex min-h-12 items-center gap-3 self-end rounded-2xl border bg-white/65 px-4">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#b4472f]"
                {...register('isBestSeller')}
              />
              <Star size={16} />
              <span className="text-sm font-bold">Best seller</span>
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Published at">
              <Input type="datetime-local" {...register('publishedAt')} />
            </Field>
            <Field
              label="Offer starts"
              hint="Optional; requires a compare-at price."
            >
              <Input type="datetime-local" {...register('offerStartsAt')} />
            </Field>
            <Field label="Offer ends">
              <Input type="datetime-local" {...register('offerEndsAt')} />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="Product images"
          intro="Upload JPEG, PNG, WebP or GIF images."
        >
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed bg-white/35 px-6 py-10 text-center transition hover:border-accent hover:bg-white/65 focus-within:ring-2 focus-within:ring-accent">
            <ImagePlus size={28} className="text-accent" />
            <span className="mt-3 text-sm font-bold">
              Choose product images
            </span>
            <span className="mt-1 text-xs text-black/40">
              Select one or multiple files
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
            />
          </label>
          {(product?.images.length || previews.length) && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {product?.images.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-black/5"
                >
                  <Image src={image.url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    disabled={removeImage.isPending}
                    onClick={() => removeImage.mutate(image.id)}
                    className="absolute right-2 top-2 rounded-full bg-white p-2 text-red-700 shadow opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Remove uploaded image"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              {previews.map((preview, index) => (
                <div
                  key={preview}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-black/5"
                >
                  <Image
                    src={preview}
                    alt={`New image ${index + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFiles((current) =>
                        current.filter((_, fileIndex) => fileIndex !== index),
                      )
                    }
                    className="absolute right-2 top-2 rounded-full bg-white p-2 shadow"
                    aria-label={`Remove new image ${index + 1}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        <FormSection
          title="Specifications"
          intro="Use a JSON object for flexible technical attributes."
        >
          <Field
            label="Specification JSON"
            error={errors.specifications?.message}
            hint={
              'Example: { "Display": "6.3-inch OLED", "Storage": "256 GB" }'
            }
          >
            <textarea
              rows={8}
              spellCheck={false}
              className="w-full rounded-2xl border bg-[#1d1f1c] p-4 font-mono text-sm text-white focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
              {...register('specifications')}
            />
          </Field>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Link href="/admin/products">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button type="submit" loading={isSubmitting}>
            <Save size={17} /> {product ? 'Save changes' : 'Publish product'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function toDateTimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function FormSection({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border bg-white/55 p-6 shadow-soft sm:p-8">
      <div className="mb-7">
        <h2 className="display text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-black/45">{intro}</p>
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}
