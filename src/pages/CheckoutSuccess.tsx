
import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (orderId) {
      // Update order as paid (fallback — webhook will also handle this)
      supabase.from("orders")
        .update({ payment_status: "paid", status: "confirmed" })
        .eq("id", orderId);
    }
  }, [orderId]);

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="font-heading text-3xl uppercase text-foreground mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground mb-2">Your order has been confirmed and is being processed.</p>
        {orderId && (
          <p className="text-sm font-mono text-muted-foreground mb-6">
            Order ID: {orderId.slice(0, 8).toUpperCase()}
          </p>
        )}
        <div className="flex justify-center gap-4">
          <Link to="/my-orders">
            <Button className="bg-primary text-primary-foreground font-heading uppercase tracking-wider">
              View Orders
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="outline" className="font-heading uppercase tracking-wider">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
