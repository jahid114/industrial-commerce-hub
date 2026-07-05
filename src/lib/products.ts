import { products } from "@/data/products";
import type { Product } from "@/data/types";

// Publicly listed = featured flag on. Non-featured products are portal-only.
export const isPublicProduct = (p: Product) => !!p.featured;

export const getPublicProducts = (): Product[] => products.filter(isPublicProduct);
export const getAllProducts = (): Product[] => products;

export const isPublicProductId = (id: string): boolean => {
  const p = products.find((x) => x.id === id);
  return !!p && isPublicProduct(p);
};
