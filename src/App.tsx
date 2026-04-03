import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "./components/Layout";
import AdminLayout from "./components/admin/AdminLayout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import FoundersPage from "./pages/FoundersPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import PlayersPage from "./pages/PlayersPage";
import ShopPage from "./pages/ShopPage";
import ApparelShopPage from "./pages/ApparelShopPage";
import FoodShopPage from "./pages/FoodShopPage";
import ContactPage from "./pages/ContactPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import OrdersPage from "./pages/admin/OrdersPage";
import ProductsPage from "./pages/admin/ProductsPage";
import POSPage from "./pages/admin/POSPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public site */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/about" element={<Layout><AboutPage /></Layout>} />
            <Route path="/founders" element={<Layout><FoundersPage /></Layout>} />
            <Route path="/activities" element={<Layout><ActivitiesPage /></Layout>} />
            <Route path="/players" element={<Layout><PlayersPage /></Layout>} />
            <Route path="/shop" element={<Layout><ShopPage /></Layout>} />
            <Route path="/shop/apparel" element={<Layout><ApparelShopPage /></Layout>} />
            <Route path="/shop/food" element={<Layout><FoodShopPage /></Layout>} />
            <Route path="/contact" element={<Layout><ContactPage /></Layout>} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout><DashboardPage /></AdminLayout>} />
            <Route path="/admin/orders" element={<AdminLayout><OrdersPage /></AdminLayout>} />
            <Route path="/admin/products" element={<AdminLayout><ProductsPage /></AdminLayout>} />
            <Route path="/admin/pos" element={<AdminLayout><POSPage /></AdminLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
