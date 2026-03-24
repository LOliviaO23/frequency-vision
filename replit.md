# FrequencyVision - Digital Movie Kit Marketplace

## Overview
A web application for selling digital movie kits that combine theta binaural beats, Solfeggio healing frequencies, stunning visuals, and affirmations users record in their own voice. The binaural beats (6 Hz theta) guide the brain into theta state (4-8 Hz) where the subconscious directly absorbs spoken and visual affirmations without resistance. Users can also upload their favorite songs to play in the background during their vision movie.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend:** Express.js + TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Payments:** Stripe (via Replit integration)
- **AI:** OpenAI (via Replit AI Integration) for help bot
- **Routing:** wouter
- **State:** TanStack React Query
- **Audio:** Web Audio API (binaural beats), MediaRecorder API (voice recording), HTMLAudioElement (song playback)

## Project Structure
```
client/src/
  pages/         - Home, Kits, KitDetail, Player, HowItWorks, CheckoutSuccess, VisionBoard
  components/    - Header, Footer, KitCard, HelpBot, ThemeProvider, ThemeToggle
  contexts/      - AudioProvider (centralized Web Audio engine: binaural beats, solfeggio, song ducking, voice crossfade)
  hooks/         - useFrequency (standalone preview only), useVoiceRecorder (MediaRecorder)
  lib/           - queryClient

server/
  index.ts       - Express app, Stripe init, DB push, seeding, helpbot registration
  routes.ts      - API endpoints (/api/kits, /api/checkout, /api/visuals, etc.)
  helpbot.ts     - AI help bot endpoint using OpenAI streaming
  storage.ts     - Database CRUD operations
  db.ts          - Drizzle database connection
  seed.ts        - Seed data for 16 kits with 640 affirmations, 80 visuals, 800 vision board images
  seed-vision-board.ts - Vision board seed data (50 Unsplash images per kit)
  stripeClient.ts - Stripe client & sync setup
  webhookHandlers.ts - Stripe webhook processing

shared/
  schema.ts      - Drizzle schema (kits, affirmations, kit_visuals, vision_board_images, orders, conversations, messages)
  models/chat.ts - Conversations & messages tables for chat
```

## Key Features
1. **Kit Catalog** - 16 kits across 8 categories: abundance, health, love, confidence, peace, success, freedom (addiction recovery), manifestation (dream car/home)
2. **Kit Detail** - Frequency info, affirmation list, pricing, purchase
3. **Build Your Kit** - Users select from 40 affirmations and 10 visuals per category to customize their vision movie
4. **Interactive Player** - 6-phase flow: Build (select) -> Record (voice with inline mic buttons) -> Complete My Movie (assembly) -> Preparation (vagus nerve, breathing, Silva relaxation, trance induction) -> Playback (vision movie) -> Session Complete (daily usage guidance)
5. **Voice Auto-Tuning** - Recordings automatically processed to hypnotic trance pitch (pitch shift, warmth, reverb, compression) via Web Audio API OfflineAudioContext
6. **Song Upload** - Users upload their favorite song to play in background during vision movie; song ducks when affirmations play
7. **Visual Cycling** - During playback, selected visuals cycle as backgrounds with smooth crossfade transitions
7. **Vision Board** - 50 aspirational stock images per kit with lightbox viewing
8. **AI Help Bot** - Floating chat widget powered by OpenAI streaming for customer support
9. **Stripe Checkout** - Payment processing for kit purchases
10. **Dark/Light Mode** - Theme toggle with localStorage persistence

## Player 7-Phase Flow
1. **BUILD** - Browse 40 affirmations and 10 category visuals; select at least 5 affirmations and 3 visuals; upload favorite song
2. **RECORD** - Record selected affirmations in your own voice; inline mic button next to each affirmation; "Complete My Movie" button appears when all recorded
3. **ASSEMBLING** - Cinematic assembly screen with animated rotating gradient border (premium-border CSS), animated progress through 7 steps; auto-transitions to preflight
4. **PREFLIGHT** - Headphone pre-flight check: sends 440 Hz sine pulse to left channel then right channel via Web Audio API ChannelMerger; user confirms each ear heard the tone; "Skip Check" option available; verifies stereo hardware before binaural beat playback
5. **PREPARATION** - Guided 4-step trance induction:
   - Step 0: Vagus Nerve Reset (diaphragmatic breathing, extended exhale, humming)
   - Step 1: 7-4-7 Breathing (animated circle, 3 cycles: inhale 7s, hold 4s, exhale 7s)
   - Step 2: Silva Deep Relaxation (progressive body scan, theta beats start)
   - Step 3: Visualization Trance Induction (staircase countdown 10→1, guided imagery)
   - "Skip to Movie" button available throughout
6. **PLAYBACK** - Vision movie plays with:
   - Cycling selected visuals as backgrounds (20s intervals, crossfade)
   - Recorded affirmations crossfade between each other (300ms fade-in/out, no pops)
   - Uploaded song routed through Web Audio API GainNode for smooth ducking (0.3s ramp)
   - Theta binaural beats subliminal underneath
7. **SESSION COMPLETE** - Post-playback with daily usage guidance; Stripe "Save & Unlock" premium CTA with animated gradient border before replay access; "Continue without saving" bypass link; browse more kits option

## Audio Architecture (Player)
Three simultaneous audio layers during playback with sidechain ducking:
- **Layer 1: Uploaded Song** - User's favorite music, loops continuously; sidechain-ducked by 3.5 dB when voice plays (smooth 0.3s ramp via GainNode)
- **Layer 2: Voice Recordings** - User's recorded affirmations with 'God Voice' processing, play intermittently with 300ms crossfade
- **Layer 3: Theta Binaural Beats** - Left ear: carrier frequency, Right ear: carrier + 6 Hz; subtle LFO pulsing (0.15 Hz, 25% depth) for organic breathing feel; also ducked 3.5 dB during voice playback
- **Layer 4: Solfeggio Tone** - Pure sine wave at kit's Solfeggio frequency, steady 0.05 amplitude (no pulsing), consistent healing presence underneath
- **Sidechain Ducking** - Exponential ramps (not linear) for perceptually natural volume transitions; both song and binaural beats duck 3.5 dB (DUCK_RATIO = 10^(-3.5/20) ≈ 0.668) when voice speaks, restoring on voice end

## Voice Auto-Tuning / 'God Voice' DSP (use-voice-processor.ts)
Three professional DSP layers processed via Web Audio API OfflineAudioContext:

### Layer 1: Voice EQ
- **Pitch Shift** - Playback rate 0.95x (5% tempo reduction) — subtle cadence slowdown that preserves voice identity
- **Sub Rumble Filter** - Highpass at 60 Hz removes mic rumble before processing
- **Warmth Filter** - Low-shelf at 180 Hz, +2.5 dB adds gentle warmth without muddiness
- **Clarity Filter** - Peaking filter at 3.5 kHz, -1.5 dB, Q=1.2 softens harshness for a soothing tone

### Layer 2: Room Spatial Reverb (subtle)
- **Pre-Delay** - 12ms gap before reverb onset for source clarity
- **Early Reflections** - 4 discrete reflections (10-32ms) with stereo offset for natural space
- **Late Diffusion** - Exponential + linear decay (1.2s), modulated noise for organic room character
- **Stereo Decorrelation** - 7ms delay offset on right channel for gentle spatial spread
- **Damping** - Lowpass at 8 kHz on wet signal
- **Wet Mix** - 4% blend — barely perceptible room presence, voice identity preserved

### Layer 3: Output Chain
- **Compressor** - Threshold -18 dB, ratio 3:1, 5ms attack, 200ms release for smooth, even dynamics
- **Output Limiter** - Brick-wall at -1 dB (ratio 20:1) prevents clipping
- Output encoded as stereo WAV blob; both original and processed versions stored per affirmation

## API Routes
- GET /api/kits - List all kits
- GET /api/kits/:id - Get single kit
- GET /api/kits/:id/affirmations - Get affirmations for a kit (40 per kit)
- GET /api/kits/:id/vision-board - Get vision board images for a kit (50 per kit)
- GET /api/visuals/:category - Get visual images for a category (10 per category)
- POST /api/checkout - Create Stripe checkout session for a single kit ($120)
- POST /api/checkout/subscription - Create Stripe subscription checkout ($299/year, 4 kits)
- POST /api/checkout/lifetime - Create Stripe one-time checkout for lifetime access ($599, unlimited kits forever)
- POST /api/checkout/vr-upgrade - Create Stripe one-time checkout for VR upgrade ($29 per kit add-on)
- POST /api/subscription/record - Called after subscription/lifetime checkout success; records subscription in fv_subscriptions table; sessionId stored in localStorage as access token
- GET /api/subscription/check?sessionId=xxx - Validates subscription in real-time against Stripe API; returns { active, plan, expiresAt }; auto-updates DB status on change
- POST /api/helpbot - AI chat endpoint (SSE streaming)
- GET /api/orders/verify - Verify order status
- GET /api/stripe/publishable-key - Get Stripe publishable key

## Database
- Uses PostgreSQL via Drizzle ORM
- Schema pushed via `drizzle-kit push` on startup
- Seeded with 16 kits, 640 affirmations, 80 visuals, 800 vision board images
- Tables: kits, affirmations, kit_visuals, vision_board_images, orders, conversations, messages
- Categories: abundance, health, love, confidence, peace, success, freedom, manifestation

## AI Help Bot
- Uses OpenAI via Replit AI Integration (env vars: AI_INTEGRATIONS_OPENAI_BASE_URL, AI_INTEGRATIONS_OPENAI_API_KEY)
- Model: gpt-5-nano for fast responses
- SSE streaming for real-time chat responses
- System prompt with full product knowledge (kits, frequencies, how-it-works)
- Floating chat widget in bottom-right corner of all pages

## Design
- Dark theme by default with cosmic/spiritual aesthetic
- Purple primary color (270 80% 55%)
- Outfit sans-serif, Playfair Display serif fonts
- Bright white text in dark mode (foreground 0 0% 98%, muted-foreground 260 5% 75%)
- Generated images for each kit category
- 80 stock photos for visual backgrounds organized by category
- 800 Unsplash CDN images for vision boards (50 per kit)
- Customer testimonials on home page (10 diverse reviews with names, ages, locations)
