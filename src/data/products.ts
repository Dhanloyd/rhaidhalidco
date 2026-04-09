// 👇 import your image (adjust path if needed)
import pastriesImg from "../assets/21f0a1bc-16ce-4849-8ecd-06f4e6e3c905.jpg";

export type ProductCategory =
  | "fashion-apparel"
  | "pastries"
  | "digital-products"
  | "beauty-health"
  | "home-kitchen"
  | "hobbies-lifestyle";

export interface Product {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  badge?: "hot" | "featured";
}

export const categoryLabels: Record<ProductCategory, string> = {
  "fashion-apparel": "Fashion & Apparel",
  "pastries": "Pastries",
  "digital-products": "Digital Products",
  "beauty-health": "Beauty & Health",
  "home-kitchen": "Home & Kitchen",
  "hobbies-lifestyle": "Hobbies & Lifestyle",
};

// 👇 mixed: emojis + 1 image
export const categoryIcons: Record<ProductCategory, string> = {
  "fashion-apparel": "👗",
  "pastries": pastriesImg, // ✅ your image
  "digital-products": "💻",
  "beauty-health": "💄",
  "home-kitchen": "🏠",
  "hobbies-lifestyle": "🎨",
};