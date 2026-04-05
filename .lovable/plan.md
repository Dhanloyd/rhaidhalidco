## Phase 1: Database Foundation (this message)
- Migrate schema: add product_variants, categories, suppliers, inventory_logs, order_items, wishlist, vouchers, flash_sales, notifications, pos_transactions
- Extend products table with SKU, barcode, cost_price, discount_price, brand, supplier_id, sold_count, low_stock_threshold
- Extend orders table with shipping_address, phone, shipping_fee, discount, tax, subtotal

## Phase 2: Core Features (next messages)
- Advanced product system with variants
- Multi-step checkout flow
- Enhanced cart with discount/shipping calculations
- Order status workflow (pending → confirmed → packed → shipped → delivered → completed)
- Inventory management dashboard
- Enhanced POS with barcode, receipt, daily sales

## Phase 3: Elite Features (following messages)
- Voucher/promotion system
- Flash sales
- Analytics dashboard with charts
- Customer wishlist, reviews, address management
- Notification system
- Global search, activity logs, CSV export
- Staff role with limited access