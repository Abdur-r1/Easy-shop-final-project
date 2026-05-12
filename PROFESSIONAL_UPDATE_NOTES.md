# Easy Shop Professional Update

## Added features

- Admin dashboard overview cards: today's sales, monthly profit, product count, customers and active orders.
- Order status workflow: pending, processing, shipped, delivered, cancelled.
- Payment status update from admin.
- Invoice / Save as PDF option for admin and customer orders.
- Customer profile page with name, phone and address.
- Checkout auto-fills profile data.
- Product search, category filter, stock filter and sorting.
- Multiple product image collection support, up to 5 JPG/JPEG/PNG images.
- Product gallery on details page.
- Low stock alarm remains visible on admin dashboard.
- Safer customer registration: customers cannot create admin accounts from the frontend register form.
- Admin seed route can be protected with ADMIN_SEED_KEY.
- Sales CSV report includes order status.

## Run locally

### Backend

```bash
cd server
npm install
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Environment examples

server/.env:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/easy_shop
JWT_SECRET=easyshop_secret_123
CLIENT_ORIGIN=http://localhost:5173
ADMIN_SEED_KEY=easyshop_admin_key
```

client/.env:

```env
VITE_API_URL=http://localhost:5000/api
```
