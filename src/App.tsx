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
import CheckoutPage from "./pages/CheckoutPage";
import WishlistPage from "./pages/WishlistPage";
import AddressesPage from "./pages/AddressesPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import ProfilePage from "./pages/ProfilePage";
import ContactPage from "./pages/ContactPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import OrdersPage from "./pages/admin/OrdersPage";
import ProductsPage from "./pages/admin/ProductsPage";
import InventoryPage from "./pages/admin/InventoryPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import VouchersPage from "./pages/admin/VouchersPage";
import FlashSalesPage from "./pages/admin/FlashSalesPage";
import SuppliersPage from "./pages/admin/SuppliersPage";
import NewsManagementPage from "./pages/admin/NewsManagementPage";
import HighlightsPage from "./pages/admin/HighlightsPage";
import POSPage from "./pages/admin/POSPage";
import FoundersManagementPage from "./pages/admin/FoundersManagementPage";
import PlayersManagementPage from "./pages/admin/PlayersManagementPage";
import ActivitiesManagementPage from "./pages/admin/ActivitiesManagementPage";
import PageContentPage from "./pages/admin/PageContentPage";
import AdminAboutPage from "./pages/admin/AdminAboutPage";
import AdminContactPage from "./pages/admin/AdminContactPage";
import SocialLinksPage from "./pages/admin/SocialLinksPage";
import NotFound from "./pages/NotFound";
import CheckoutSuccess from "./pages/CheckoutSuccess";   
import CheckoutCancel from "./pages/CheckoutCancel";
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
              {/* Public */}
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/about" element={<Layout><AboutPage /></Layout>} />
              <Route path="/founders" element={<Layout><FoundersPage /></Layout>} />
              <Route path="/activities" element={<Layout><ActivitiesPage /></Layout>} />
              <Route path="/players" element={<Layout><PlayersPage /></Layout>} />
              <Route path="/shop" element={<Layout><ShopPage /></Layout>} />
              <Route path="/cart" element={<Layout><CartPage /></Layout>} />
              <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
              <Route path="/wishlist" element={<Layout><WishlistPage /></Layout>} />
              <Route path="/addresses" element={<Layout><AddressesPage /></Layout>} />
              <Route path="/my-orders" element={<Layout><MyOrdersPage /></Layout>} />
              <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
              <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
              <Route path="/checkout/success" element={<Layout><CheckoutSuccess /></Layout>} />
              <Route path="/checkout/cancel" element={<Layout><CheckoutCancel /></Layout>} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout><DashboardPage /></AdminLayout>} />
              <Route path="/admin/orders" element={<AdminLayout><OrdersPage /></AdminLayout>} />
              <Route path="/admin/products" element={<AdminLayout><ProductsPage /></AdminLayout>} />
              <Route path="/admin/inventory" element={<AdminLayout><InventoryPage /></AdminLayout>} />
              <Route path="/admin/pos" element={<AdminLayout><POSPage /></AdminLayout>} />
              <Route path="/admin/analytics" element={<AdminLayout><AnalyticsPage /></AdminLayout>} />
              <Route path="/admin/vouchers" element={<AdminLayout><VouchersPage /></AdminLayout>} />
              <Route path="/admin/flash-sales" element={<AdminLayout><FlashSalesPage /></AdminLayout>} />
              <Route path="/admin/suppliers" element={<AdminLayout><SuppliersPage /></AdminLayout>} />
              <Route path="/admin/news" element={<AdminLayout><NewsManagementPage /></AdminLayout>} />
              <Route path="/admin/highlights" element={<AdminLayout><HighlightsPage /></AdminLayout>} />
              <Route path="/admin/founders" element={<AdminLayout><FoundersManagementPage /></AdminLayout>} />
              <Route path="/admin/players" element={<AdminLayout><PlayersManagementPage /></AdminLayout>} />
              <Route path="/admin/activities" element={<AdminLayout><ActivitiesManagementPage /></AdminLayout>} />
              <Route path="/admin/pages" element={<AdminLayout><PageContentPage /></AdminLayout>} />
              <Route path="/admin/pages/about" element={<AdminLayout><AdminAboutPage /></AdminLayout>} />
              <Route path="/admin/pages/contact" element={<AdminLayout><AdminContactPage /></AdminLayout>} />
              <Route path="/admin/social-links" element={<AdminLayout><SocialLinksPage /></AdminLayout>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
