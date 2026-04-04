import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Layout from "./components/Layout";
import AdminLayout from "./components/admin/AdminLayout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import FoundersPage from "./pages/FoundersPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import PlayersPage from "./pages/PlayersPage";
import ShopPage from "./pages/ShopPage";
import CartPage from "./pages/CartPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import ContactPage from "./pages/ContactPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import OrdersPage from "./pages/admin/OrdersPage";
import ProductsPage from "./pages/admin/ProductsPage";
import NewsManagementPage from "./pages/admin/NewsManagementPage";
import HighlightsPage from "./pages/admin/HighlightsPage";
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
          <CartProvider>
            <Routes>
              {/* Public site */}
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/about" element={<Layout><AboutPage /></Layout>} />
              <Route path="/founders" element={<Layout><FoundersPage /></Layout>} />
              <Route path="/activities" element={<Layout><ActivitiesPage /></Layout>} />
              <Route path="/players" element={<Layout><PlayersPage /></Layout>} />
              <Route path="/shop" element={<Layout><ShopPage /></Layout>} />
              <Route path="/cart" element={<Layout><CartPage /></Layout>} />
              <Route path="/my-orders" element={<Layout><MyOrdersPage /></Layout>} />
              <Route path="/contact" element={<Layout><ContactPage /></Layout>} />

              {/* Auth */}
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout><DashboardPage /></AdminLayout>} />
              <Route path="/admin/orders" element={<AdminLayout><OrdersPage /></AdminLayout>} />
              <Route path="/admin/products" element={<AdminLayout><ProductsPage /></AdminLayout>} />
              <Route path="/admin/news" element={<AdminLayout><NewsManagementPage /></AdminLayout>} />
              <Route path="/admin/highlights" element={<AdminLayout><HighlightsPage /></AdminLayout>} />
              <Route path="/admin/pos" element={<AdminLayout><POSPage /></AdminLayout>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
