import { apparelProducts, ProductCard } from "./ShopPage";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const ApparelShopPage = () => (
  <div>
    <section className="gradient-navy section-padding pt-24 md:pt-32">
      <div className="container mx-auto text-center">
        <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">Apparel</h1>
        <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">Official RaidKhalid & Co. gear — jerseys, caps, sneakers and more.</p>
      </div>
    </section>

    <section className="section-padding">
      <div className="container mx-auto">
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-8">
          <ChevronLeft size={16} /> Back to Shop
        </Link>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {apparelProducts.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </section>
  </div>
);

export default ApparelShopPage;
