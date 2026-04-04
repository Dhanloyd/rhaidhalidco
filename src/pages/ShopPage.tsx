import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { categoryLabels, categoryEmojis, type ProductCategory } from "@/data/products";
import { Link, useParams } from "react-router-dom";

const allCategories = Object.keys(categoryLabels) as ProductCategory[];

interface DbProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  in_stock: boolean;
}

const ProductCard = ({ product }: { product: DbProduct }) => {
  const { addToCart } = useCart();
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden hover-lift group">
      <div className="relative overflow-hidden">
        {product.image_url && (
          <img src={product.image_url} alt={product.name} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        )}
        {product.badge && (
          <span className={`absolute top-3 right-3 ${product.badge === "hot" ? "badge-hot" : "badge-featured"}`}>
            {product.badge === "hot" ? "🔥 Hot" : "⭐ Featured"}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-heading text-lg uppercase text-foreground mb-2">{product.name}</h3>
        <div className="flex items-center justify-between">
          <p className="font-heading text-xl text-primary">₱{Number(product.price).toLocaleString()}</p>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary-light gap-1.5 font-medium" onClick={() => addToCart(product.id)}>
            <ShoppingCart size={14} /> Add
          </Button>
        </div>
      </div>
    </div>
  );
};

const ShopPage = () => {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    supabase.from("products").select("*").eq("in_stock", true).order("created_at", { ascending: false })
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, []);

  const filtered = activeCategory === "all" ? products : products.filter((p) => p.category === activeCategory);
  const featured = products.filter((p) => p.badge === "featured");
  const hot = products.filter((p) => p.badge === "hot");

  return (
    <div>
      <section className="gradient-navy section-padding pt-24 md:pt-32">
        <div className="container mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">Shop</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg mb-8">Official RaidKhalid & Co. merchandise and products.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="sm"
              variant={activeCategory === "all" ? "default" : "outline"}
              className={`font-heading uppercase tracking-wider ${activeCategory === "all" ? "bg-primary-foreground text-primary" : "border-primary-foreground/50 bg-transparent hover:bg-primary-foreground/10"}`}
              style={activeCategory !== "all" ? { color: "hsl(0 0% 100%)" } : {}}
              onClick={() => setActiveCategory("all")}
            >
              All
            </Button>
            {allCategories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={activeCategory === cat ? "default" : "outline"}
                className={`font-heading uppercase tracking-wider ${activeCategory === cat ? "bg-primary-foreground text-primary" : "border-primary-foreground/50 bg-transparent hover:bg-primary-foreground/10"}`}
                style={activeCategory !== cat ? { color: "hsl(0 0% 100%)" } : {}}
                onClick={() => setActiveCategory(cat)}
              >
                {categoryEmojis[cat]} {categoryLabels[cat]}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          {activeCategory === "all" && featured.length > 0 && (
            <section className="section-padding bg-muted">
              <div className="container mx-auto">
                <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-foreground mb-8">⭐ Featured Items</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featured.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            </section>
          )}

          {activeCategory === "all" && hot.length > 0 && (
            <section className="section-padding">
              <div className="container mx-auto">
                <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-foreground mb-8">🔥 Hot Items</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hot.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            </section>
          )}

          <section className="section-padding">
            <div className="container mx-auto">
              {activeCategory !== "all" && (
                <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-foreground mb-8">
                  {categoryEmojis[activeCategory as ProductCategory]} {categoryLabels[activeCategory as ProductCategory]}
                </h2>
              )}
              {activeCategory === "all" && <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-foreground mb-8">All Products</h2>}
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No products in this category yet</div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ShopPage;
