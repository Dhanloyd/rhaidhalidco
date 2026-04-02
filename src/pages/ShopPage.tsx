import { useState } from "react";
import { products, Product } from "@/data/products";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ShopPage = () => {
  const [filter, setFilter] = useState<"all" | "apparel" | "food">("all");

  const featured = products.filter((p) => p.badge === "featured");
  const hot = products.filter((p) => p.badge === "hot");
  const filtered = filter === "all" ? products : products.filter((p) => p.category === filter);

  const addToCart = (product: Product) => {
    toast.success(`${product.name} added to cart!`);
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden hover-lift group">
      <div className="relative overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={400} height={400} />
        {product.badge && (
          <span className={`absolute top-3 right-3 ${product.badge === "hot" ? "badge-hot" : "badge-featured"}`}>
            {product.badge === "hot" ? "🔥 Hot" : "⭐ Featured"}
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{product.category}</p>
        <h3 className="font-heading text-lg uppercase text-foreground mb-2">{product.name}</h3>
        <div className="flex items-center justify-between">
          <p className="font-heading text-xl text-primary">₱{product.price.toLocaleString()}</p>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary-light gap-1.5 font-medium" onClick={() => addToCart(product)}>
            <ShoppingCart size={14} /> Add
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <section className="gradient-navy section-padding pt-24 md:pt-32">
        <div className="container mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">Shop</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">Official RaidKhalid & Co. merchandise and fuel.</p>
        </div>
      </section>

      {/* Featured */}
      <section className="section-padding bg-muted">
        <div className="container mx-auto">
          <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-foreground mb-8 flex items-center gap-2">
            ⭐ Featured Items
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Hot */}
      <section className="section-padding">
        <div className="container mx-auto">
          <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-foreground mb-8 flex items-center gap-2">
            🔥 Hot Items
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hot.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="section-padding bg-muted">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-foreground">All Products</h2>
            <div className="flex gap-2">
              {(["all", "apparel", "food"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wider transition-colors ${
                    filter === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent border border-border/50"
                  }`}
                >
                  {f === "all" ? "All" : f === "apparel" ? "Apparel" : "Food"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShopPage;
