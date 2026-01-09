# X402 + ERC-8004 Micro-Betting PoC

A comprehensive demo showcasing hybrid payment architecture with:
- **Smartphone-frame UI** (390×844 mockup)
- **3 Language Support**: English | 中文 | Português
- **Privy Auth** (social login + embedded wallets)
- **Google Gemini TTS** for voice narration
- **X402 Payment Tracing** (fiat with blockchain trace)
- **ERC-8004 Trust Layer** (TEE dispute resolution)

## Quick Start

### 1. Start Backend (Port 3001)
```bash
cd micro-betting-POC
npm install
npm run dev
```

### 2. Start Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

### 3. Open in Browser
```
http://localhost:5173
```

## Features

| Feature | Description |
|---------|-------------|
| 🌐 **3 Languages** | EN, 中文, PT - switch in UI |
| 📱 **Phone Frame** | iPhone-style mockup (390×844) |
| 🔐 **Privy Auth** | Social login + wallet |
| 📺 **HLS Video** | Low-latency streaming simulation |
| 🎰 **Micro-Betting** | Real-time odds, ms latency |
| 💳 **X402 Trace** | Payment intent → blockchain |
| ⚖️ **TEE Disputes** | ERC-8004 validation |
| 🎙️ **Voice Narration** | Google Gemini TTS |

## Project Structure

```
micro-betting-POC/
├── frontend/                 # React + TypeScript
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── i18n/            # Translations (en, zh, pt)
│   │   ├── App.tsx          # Main app
│   │   └── main.tsx         # Privy provider
│   └── package.json
├── src/                      # Node.js backend
│   ├── services/            # Business logic
│   └── routes/              # API endpoints
└── README.md
```

## Configuration

### Frontend (.env)
```env
VITE_PRIVY_APP_ID=your-privy-app-id
VITE_API_URL=http://localhost:3001/api
VITE_GEMINI_API_KEY=your-gemini-key
```

### Backend (.env)
```env
PORT=3001
JWT_SECRET=your-secret
DATABASE_PATH=./data/micro-betting.db
```

## Demo Flow

1. **Login** via Privy (email/Google/wallet)
2. **Watch** live video stream with latency display
3. **Select** a market (next_goal, next_corner, etc.)
4. **Place bet** - see ms-level latency + X402 trace
5. **Dispute** rejected bets → TEE verdict
6. **Switch language** anytime (EN/中/PT)

## License

MIT
