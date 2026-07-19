export interface Product {
  id: number;
  title: string;
  price: number;
  quantity: number;
  images: ProductImage[];
}

export interface ProductImage {
  id: number;
  url: string;
  publicId: string;
  productId: number;
}

export interface NewProductImage {
  url: string;
  publicId: string;
}
