
import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CheckoutCancel = () => (
  <div className="min-h-screen pt-24 flex items-center justify-center">
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
        <XCircle size={40} className="text-red-500" />
      </div>
      <h2 className="font-heading text-3xl uppercase text-foreground mb-2">Payment Cancelled</h2>
      <p className="text-muted-foreground mb-6">
        Your order was not completed. Your cart is still saved.
      </p>
      <div className="flex justify-center gap-4">
        <Link to="/checkout">
          <Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wider">
            Try Again
          </Button>
        </Link>
        <Link to="/shop">
          <Button variant="outline" className="font-heading uppercase tracking-wider">
            Back to Shop
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

export default CheckoutCancel;
