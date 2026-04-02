import { products, Product } from "@/data/products";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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

const apparelProducts = products.filter((p) => p.category === "apparel");
const foodProducts = products.filter((p) => p.category === "food");

const ShopPage = () => (
  <div>
    <section className="gradient-navy section-padding pt-24 md:pt-32">
      <div className="container mx-auto text-center">
        <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">Shop</h1>
        <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg mb-8">Official RaidKhalid & Co. merchandise and fuel.</p>
        <div className="flex justify-center gap-4">
          <Link to="/shop/apparel">
            <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-heading uppercase tracking-wider">
              🏀 Apparel
            </Button>
          </Link>
          <Link to="/shop/food">
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-heading uppercase tracking-wider">
              🍔 Food & Drinks
            </Button>
          </Link>
        </div>
      </div>
    </section>

    {/* Featured */}
    <section className="section-padding bg-muted">
      <div className="container mx-auto">
        <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-foreground mb-8">⭐ Featured Items</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.filter((p) => p.badge === "featured").map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>

    {/* Hot */}
    <section className="section-padding">
      <div className="container mx-auto">
        <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-wider text-foreground mb-8">🔥 Hot Items</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.filter((p) => p.badge === "hot").map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  </div>
);

export default ShopPage;
export { ProductCard, apparelProducts, foodProducts };
