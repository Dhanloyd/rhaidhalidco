import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const CheckoutSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSuccess = async () => {
      // 🔥 FORCE logout after payment
      await supabase.auth.signOut();

      // clear URL params
      window.history.replaceState({}, document.title, "/signin");

      // redirect to login
      navigate("/signin");
    };

    handleSuccess();
  }, []);

  return <div>Processing payment...</div>;
};

export default CheckoutSuccess;