export interface Product {
  id: string;
  name: string;
  price: number;
  category: "apparel" | "food";
  image: string;
  badge?: "hot" | "featured";
}

export const products: Product[] = [
  { id: "1", name: "RaidKhalid Home Jersey", price: 1800, category: "apparel", badge: "featured", image: "https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=400&h=400&fit=crop" },
  { id: "2", name: "RaidKhalid Cap", price: 750, category: "apparel", image: "https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=400&h=400&fit=crop" },
  { id: "3", name: "Team Hoodie", price: 1500, category: "apparel", badge: "hot", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop" },
  { id: "4", name: "RaidKhalid Sneakers", price: 3200, category: "apparel", badge: "featured", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop" },
  { id: "5", name: "Wristbands", price: 350, category: "apparel", image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400&h=400&fit=crop" },
  { id: "6", name: "Blue Slam Energy Drink", price: 150, category: "food", badge: "hot", image: "https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&h=400&fit=crop" },
  { id: "7", name: "RaidKhalid Protein Bar", price: 120, category: "food", image: "https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=400&h=400&fit=crop" },
  { id: "8", name: "Basketball-Themed Cupcakes", price: 90, category: "food", badge: "featured", image: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&h=400&fit=crop" },
  { id: "9", name: "Hydration Packs", price: 250, category: "food", image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop" },
  { id: "10", name: "Sports Snacks Bundle", price: 400, category: "food", badge: "hot", image: "https://images.unsplash.com/photo-1604467707321-70d009801bf4?w=400&h=400&fit=crop" },
];
