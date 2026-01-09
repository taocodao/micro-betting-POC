# Micro-Betting Demo Deployment

## Vercel Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Root Directory**: Set to `frontend`
4. **Framework Preset**: Vite (auto-detected)

### 3. Environment Variables
Add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_PRIVY_APP_ID` | `cmk609lsi00lwl70clht7wx8w` |
| `VITE_API_URL` | (optional - for backend API) |

### 4. Deploy
Click "Deploy" - Vercel will build and deploy automatically.

## Features Working on Vercel
- ✅ Horse racing video (4K, served from CDN)
- ✅ Voice Guide (Web Speech API - browser-side)
- ✅ Privy Authentication
- ✅ Multi-language (EN/中文/PT)
- ✅ Animated horse racing simulation

## Notes
- Static frontend only - no backend API endpoints
- Video files are large (~80MB) - first load may take time
- All functionality runs client-side
