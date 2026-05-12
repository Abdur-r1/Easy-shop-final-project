# Easy Shop Deployment Guide

This project is a MERN app, so GitHub alone is not enough for the full live app. Use:

- GitHub: source code repository
- MongoDB Atlas: online database
- Render/Railway: backend API hosting
- Vercel/Netlify: frontend hosting

## 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial Easy Shop project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/easy-shop.git
git push -u origin main
```

## 2. MongoDB Atlas

Create a free cluster and copy the connection string. Example:

```env
MONGO_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/easy_shop
```

## 3. Deploy backend on Render

Settings:

```text
Root Directory: server
Build Command: npm install
Start Command: npm start
```

Environment variables:

```env
PORT=10000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_ORIGIN=https://your-frontend-domain.vercel.app
```

After deployment, backend URL will look like:

```text
https://easy-shop-api.onrender.com
```

Health check:

```text
https://easy-shop-api.onrender.com/api/health
```

## 4. Deploy frontend on Vercel

Settings:

```text
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

Environment variable:

```env
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

## 5. Update backend CORS

After you get the Vercel live link, go back to Render and set:

```env
CLIENT_ORIGIN=https://your-frontend-domain.vercel.app
```

Then redeploy backend.

## 6. Run locally

Backend:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```
