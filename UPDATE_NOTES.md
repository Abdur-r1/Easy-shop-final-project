# Easy Shop - New Feature Update

Added features:

1. Product report CSV download fixed
   - Admin report now downloads with login token.
   - Daily, monthly, yearly CSV report includes sales, buying cost, profit, customer message.

2. JPG and PNG product image upload
   - Admin product form accepts JPG, JPEG and PNG files.

3. Stock quantity and stock alarm
   - Admin can set stock quantity.
   - Admin can set low stock alarm quantity.
   - Admin dashboard shows warning when stock is low or product is sold out.
   - Customer cannot add/order more than available stock.
   - Order placement automatically reduces product stock.

4. Selling price and buying price
   - Admin can enter customer selling price.
   - Admin can enter buying/cost price.
   - Admin can see profit per item and profit in sales reports.

5. Customer message system
   - Customer can write a message during checkout.
   - Admin can see customer messages inside Orders & Messages.

6. Full product edit option
   - Admin can edit title, sell price, buying price, stock, low stock alarm, category, rating, description and image.

Run commands:

Backend:
```bash
cd server
npm install
npm run dev
```

Frontend:
```bash
cd client
npm install
npm run dev
```
