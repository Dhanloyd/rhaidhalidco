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

export const categoryEmojis: Record<ProductCategory, string> = {
  "fashion-apparel": "👗",
  "pastries": "🧁",
  "digital-products": "💻",
  "beauty-health": "💄",
  "home-kitchen": "🏠",
  "hobbies-lifestyle": "🎨",
};

export const products: Product[] = [
  { id: "1", name: "RaidKhalid Home Jersey", price: 1800, category: "fashion-apparel", badge: "featured", image: "https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=400&h=400&fit=crop" },
  { id: "2", name: "RaidKhalid Cap", price: 750, category: "fashion-apparel", image: "https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=400&h=400&fit=crop" },
  { id: "3", name: "Team Hoodie", price: 1500, category: "fashion-apparel", badge: "hot", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop" },
  { id: "4", name: "RaidKhalid Sneakers", price: 3200, category: "fashion-apparel", badge: "featured", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop" },
  { id: "5", name: "Wristbands", price: 350, category: "fashion-apparel", image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400&h=400&fit=crop" },
  { id: "6", name: "Basketball-Themed Cupcakes", price: 90, category: "pastries", badge: "featured", image: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&h=400&fit=crop" },
  { id: "7", name: "RaidKhalid Protein Bar", price: 120, category: "pastries", image: "https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=400&h=400&fit=crop" },
  { id: "8", name: "Sports Snacks Bundle", price: 400, category: "pastries", badge: "hot", image: "https://images.unsplash.com/photo-1604467707321-70d009801bf4?w=400&h=400&fit=crop" },
  { id: "9", name: "Blue Slam Energy Drink", price: 150, category: "pastries", badge: "hot", image: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&h=400&fit=crop" },
  { id: "10", name: "Digital Team Poster Pack", price: 299, category: "digital-products", badge: "featured", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop" },
  { id: "11", name: "E-Book: Basketball Mastery", price: 499, category: "digital-products", image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop" },
  { id: "12", name: "Sports Face Wash", price: 350, category: "beauty-health", image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop" },
  { id: "13", name: "Recovery Balm", price: 580, category: "beauty-health", badge: "hot", image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop" },
  { id: "14", name: "RaidKhalid Sports Mug", price: 450, category: "home-kitchen", badge: "featured", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop" },
  { id: "15", name: "Team Water Bottle", price: 650, category: "home-kitchen", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop" },
  { id: "16", name: "Mini Basketball Set", price: 890, category: "hobbies-lifestyle", badge: "hot", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop" },
  { id: "17", name: "Team Card Collection", price: 350, category: "hobbies-lifestyle", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop" },
];
