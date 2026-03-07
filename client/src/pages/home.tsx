import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Play, Mic, Headphones, ArrowRight, Waves, Eye, Volume2, Brain, Zap, Star, ImageIcon, FileText, Music, CheckCircle, Package, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Kit, categoryLabels, type Category } from "@shared/schema";
import { KitCard } from "@/components/kit-card";
import { Skeleton } from "@/components/ui/skeleton";

const testimonials = [
  {
    name: "Marcus T.",
    age: 34,
    location: "Miami, FL",
    rating: 5,
    kit: "Abundance",
    review: "I've been using the Abundance kit every morning for 6 weeks and the shift is undeniable. Hearing my own voice speak those affirmations over the theta beats while watching those stunning visuals — it's like my brain just accepts it as truth. I landed a promotion I wasn't even actively pursuing. My whole relationship with money has changed.",
  },
  {
    name: "Jessica Morales",
    age: 28,
    location: "Austin, TX",
    rating: 5,
    kit: "Weight Loss",
    review: "I was skeptical about a 'subliminal movie' helping me lose weight, but after recording my affirmations and watching my vision movie every night before bed with headphones, something clicked. The cravings just... quieted. I've lost 23 pounds in 3 months without feeling like I'm fighting myself. The Solfeggio frequency is so calming.",
  },
  {
    name: "David Chen",
    age: 41,
    location: "Napa, CA",
    rating: 5,
    kit: "Confidence",
    review: "As someone who struggled with imposter syndrome for years, this kit rewired something deep inside me. Playing my recorded affirmations over the 6 Hz theta binaural beats during my morning routine has completely transformed how I show up at work and in relationships. I actually believe the words now because they're in my own voice.",
  },
  {
    name: "Tamara Williams",
    age: 52,
    location: "Brooklyn, NY",
    rating: 5,
    kit: "Health & Healing",
    review: "After my diagnosis, I needed something beyond traditional medicine to keep my mind right. This kit gave me that. Every morning I put on my headphones, watch my personalized movie with the healing frequency, and I feel my entire nervous system calm down. My doctor even noticed my stress markers improving. This is part of my healing now.",
  },
  {
    name: "Ryan Kowalski",
    age: 29,
    location: "Scottsdale, AZ",
    rating: 5,
    kit: "Quit Smoking",
    review: "Two packs a day for 8 years. Tried patches, gum, cold turkey — nothing stuck. Then I found this kit. Recording myself saying those anti-craving affirmations and hearing them back over the theta beats twice a day made the urge dissolve. 90 days smoke-free and I don't even think about it anymore. Genuinely life-changing.",
  },
  {
    name: "Aisha Johnson",
    age: 37,
    location: "Atlanta, GA",
    rating: 5,
    kit: "Manifestation",
    review: "I use my Manifestation kit every single night before sleep. The combination of seeing my chosen vision images cycling on screen with my own voice speaking my deepest desires over those frequencies — it puts me in a trance-like state. Within two months, three things on my vision board materialized. I can't explain it, but it works.",
  },
  {
    name: "Carlos Rivera",
    age: 45,
    location: "Denver, CO",
    rating: 5,
    kit: "Dream Home",
    review: "My wife and I watched our Dream Home vision movie together every night for 4 months. We selected images of exactly the kind of home we wanted, recorded our affirmations about deserving our dream space. Last month we closed on a house that looks almost identical to the images we chose. The theta beats and our voices made it feel inevitable.",
  },
  {
    name: "Lauren Mitchell",
    age: 31,
    location: "Nashville, TN",
    rating: 5,
    kit: "Love & Relationships",
    review: "After a painful divorce, I didn't think I could open my heart again. This kit helped me reprogram years of hurt. Hearing my own voice affirm that I deserve deep, healthy love while the Solfeggio 639 Hz connection frequency played — it melted walls I didn't know I had. I'm in the most beautiful relationship of my life now.",
  },
  {
    name: "Michael Okafor",
    age: 58,
    location: "Charlotte, NC",
    rating: 5,
    kit: "Public Speaking",
    review: "I've avoided public speaking my entire career. After using this kit daily for just three weeks — watching those powerful visuals of confident speakers while hearing my own voice tell me I command any room — I delivered a keynote to 400 people. My hands didn't even shake. The binaural beats genuinely rewired my fear response.",
  },
  {
    name: "Sophie Andersson",
    age: 26,
    location: "Portland, OR",
    rating: 5,
    kit: "Freedom & Peace",
    review: "I deal with severe anxiety and this kit has become my daily sanctuary. The combination of the theta binaural beats with my own voice telling me I am safe and free — it reaches somewhere medication never could. I use it every morning and before bed. My therapist has noticed a dramatic shift. I feel like myself again for the first time in years.",
  },
];

const lifestyleImages = [
  { src: "/images/luxury-pool.png", label: "Luxury Living" },
  { src: "/images/travel-amalfi.png", label: "World Travel" },
  { src: "/images/luxury-yacht.png", label: "Freedom" },
  { src: "/images/dream-mansion.png", label: "Dream Home" },
  { src: "/images/mountain-sunrise.png", label: "Limitless Potential" },
  { src: "/images/abundance-flow.png", label: "Abundance" },
];

export default function Home() {
  const { data: kits, isLoading } = useQuery<Kit[]>({
    queryKey: ["/api/kits"],
  });

  const featuredKits = kits?.filter((k) => k.featured) || [];

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0">
          <img
            src="/images/brain-cosmos.png"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-transparent to-pink-900/20" />
        </div>

        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-purple-500/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-pink-500/10 blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32 lg:py-40 w-full">
          <div className="max-w-2xl space-y-8">
            <Badge variant="secondary" className="gap-1.5 bg-purple-500/20 text-purple-200 border-purple-500/30 backdrop-blur-sm">
              <Waves className="h-3 w-3" />
              Frequency-Powered Vision Videos
            </Badge>
            <h1 className="font-serif text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
              Rewire Your Mind.
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                Manifest Your Reality.
              </span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-xl">
              Personalized digital movie kits using theta binaural beats to
              access your subconscious mind. Speak powerful affirmations
              in your own voice while stunning visuals reprogram your deepest beliefs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/kits">
                <Button size="lg" className="text-base px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/25" data-testid="button-hero-browse">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Browse Kits
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-6 backdrop-blur-sm bg-white/5 border-white/20 text-white hover:bg-white/10"
                  data-testid="button-hero-learn"
                >
                  <Play className="mr-2 h-5 w-5" />
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/20 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 py-24">
          <div className="text-center space-y-4 mb-16">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <img src="/images/brain-rewire-1.png" alt="" className="w-24 h-24 rounded-full object-cover border-2 border-purple-500/30 shadow-lg shadow-purple-500/20" />
                <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" style={{ animationDuration: "3s" }} />
              </div>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <Brain className="h-3 w-3" />
              Neural Reprogramming
            </Badge>
            <h2 className="font-serif text-4xl font-bold" data-testid="text-how-it-works-title">
              Your Brain Is Ready to Be
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Rewired</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Three simple steps to reprogram your subconscious mind and unlock your true potential
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: Eye,
                title: "Choose Your Vision",
                description:
                  "Browse our collection of kits covering abundance, health, weight loss, confidence, public speaking, freedom from addiction, dream car, dream home, and more. Each kit is built around a specific life transformation goal and comes loaded with everything you need to create your personalized vision movie.",
                step: "01",
                image: "/images/abundance-flow.png",
              },
              {
                icon: Mic,
                title: "Select & Record",
                description:
                  "Each kit contains 20-40 affirmations written specifically for your goal. You choose the 10 that resonate most deeply with you, then record yourself speaking each one aloud. Your own voice is the most powerful frequency for reprogramming your subconscious mind — it bypasses all resistance.",
                step: "02",
                image: "/images/meditation-golden.png",
              },
              {
                icon: Headphones,
                title: "Watch & Transform",
                description:
                  "Put on headphones and play your personalized vision movie. Your chosen images cycle on screen while your recorded affirmations play over the kit's Solfeggio healing frequency and theta binaural beats. Use daily — ideally upon waking or before sleep — and watch your beliefs, habits, and reality begin to shift.",
                step: "03",
                image: "/images/neural-pattern.png",
              },
            ].map((item, i) => (
              <Card key={i} className="relative overflow-hidden group">
                <div className="relative h-48 overflow-hidden">
                  <img src={item.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <span className="font-mono text-3xl font-bold text-white/20">{item.step}</span>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                      <item.icon className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="font-serif font-bold text-xl">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0">
          <img src="/images/neural-pattern.png" alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="text-center space-y-4 mb-12">
            <Badge variant="secondary" className="gap-1.5">
              <Star className="h-3 w-3" />
              Desire. Visualize. Manifest.
            </Badge>
            <h2 className="font-serif text-4xl font-bold">
              See the Life You're
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent"> Destined For</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Your vision movie fills your subconscious with images of the life you desire
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {lifestyleImages.map((img, i) => (
              <div key={i} className="group relative overflow-hidden rounded-lg aspect-[4/3]">
                <img
                  src={img.src}
                  alt={img.label}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <span className="font-serif text-white text-lg font-bold">{img.label}</span>
                </div>
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-400/30 rounded-lg transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 py-24">
          <div className="text-center space-y-4 mb-14">
            <Badge variant="secondary" className="gap-1.5">
              <Star className="h-3 w-3" />
              Real Results
            </Badge>
            <h2 className="font-serif text-4xl font-bold" data-testid="text-testimonials-title">
              Lives Changed,
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Minds Rewired</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Hear from real people who transformed their reality with our frequency-powered vision kits
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="relative p-6 space-y-4" data-testid={`card-testimonial-${i}`}>
                <Quote className="h-8 w-8 text-purple-500/20" />
                <div className="flex gap-0.5" data-testid={`rating-testimonial-${i}`}>
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Badge variant="secondary" className="gap-1 text-xs">
                  {t.kit}
                </Badge>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.review}</p>
                <div className="pt-2 border-t border-border">
                  <p className="font-semibold text-sm" data-testid={`text-testimonial-name-${i}`}>{t.name}</p>
                  <p className="text-xs text-muted-foreground">Age {t.age} · {t.location}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/15 to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-24">
          <div className="text-center space-y-4 mb-14">
            <Badge variant="secondary" className="gap-1.5">
              <Package className="h-3 w-3" />
              What You Get
            </Badge>
            <h2 className="font-serif text-4xl font-bold" data-testid="text-whats-inside-title">
              What's Inside
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Every Kit</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Each kit is a complete digital vision movie system designed around a specific life transformation goal.
              Here's exactly what you receive when you purchase a kit:
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="relative overflow-hidden p-0">
              <div className="h-2 bg-gradient-to-r from-purple-500/30 to-violet-500/30" />
              <div className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/10">
                  <ImageIcon className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="font-serif font-bold text-xl">20-40 Vision Images</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each kit includes a curated collection of 20-40 high-quality images that directly
                  correspond with the topic and goal of your kit. These are aspirational, emotionally-charged
                  visuals designed to imprint your desired reality into your subconscious mind.
                </p>
                <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">You choose the <strong className="text-foreground">10 images</strong> that resonate most deeply with your personal vision</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">Your selected images cycle as the visual backdrop of your personalized vision movie</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden p-0">
              <div className="h-2 bg-gradient-to-r from-pink-500/30 to-rose-500/30" />
              <div className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/10">
                  <FileText className="h-6 w-6 text-pink-400" />
                </div>
                <h3 className="font-serif font-bold text-xl">20-40 Affirmations</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every kit comes with 20-40 powerful affirmations written specifically for your
                  transformation goal. These are carefully crafted statements designed to reprogram
                  the specific limiting beliefs and subconscious patterns that hold you back.
                </p>
                <div className="bg-pink-500/5 border border-pink-500/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-pink-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">You select the <strong className="text-foreground">10 affirmations</strong> that speak most powerfully to your goals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-pink-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">You <strong className="text-foreground">record each one in your own voice</strong> — the most powerful frequency for your subconscious</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden p-0">
              <div className="h-2 bg-gradient-to-r from-amber-500/30 to-yellow-500/30" />
              <div className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/10">
                  <Music className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="font-serif font-bold text-xl">Solfeggio Frequency Track</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each kit includes a prerecorded Solfeggio healing frequency specifically chosen to
                  match your kit's transformation goal — from the 396 Hz Liberation frequency for
                  releasing fear to the 852 Hz Intuition frequency for manifestation.
                </p>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">Layered with <strong className="text-foreground">6 Hz theta binaural beats</strong> that guide your brain into the subconscious-receptive state</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-muted-foreground"><strong className="text-foreground">Headphones required</strong> — each ear receives a slightly different frequency to create the brainwave entrainment effect</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-10 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-amber-500/5 border border-purple-500/10 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                <Brain className="h-6 w-6 text-purple-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-lg">How It All Comes Together</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When you play your vision movie, all three elements combine into a powerful subconscious reprogramming experience:
                  your 10 chosen images cycle as stunning visual backgrounds, your voice recordings of 10 personally-selected affirmations
                  play intermittently with on-screen captions, and the Solfeggio frequency with theta binaural beats plays underneath —
                  guiding your brain into the 4-8 Hz theta state where the conscious mind's critical filter is relaxed and your
                  subconscious absorbs every word, image, and feeling without resistance. You can also upload your favorite song
                  to play softly in the background, which gently ducks whenever an affirmation plays.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-card border-y">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-[80px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div className="space-y-2">
              <Badge variant="secondary" className="gap-1.5 mb-2">
                <Sparkles className="h-3 w-3" />
                Popular Choices
              </Badge>
              <h2 className="font-serif text-4xl font-bold" data-testid="text-featured-title">
                Featured Kits
              </h2>
              <p className="text-muted-foreground text-lg">
                Our most powerful frequency vision experiences
              </p>
            </div>
            <Link href="/kits">
              <Button variant="outline" data-testid="link-view-all-kits" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredKits.map((kit) => (
                <KitCard key={kit.id} kit={kit} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/brain-rewire-1.png" alt="" className="w-full h-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="gap-1.5">
                <Brain className="h-3 w-3" />
                The Science
              </Badge>
              <h2 className="font-serif text-4xl font-bold">
                Subconscious
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Reprogramming</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Solfeggio frequencies layered with 6 Hz theta binaural beats bypass the conscious mind's
                critical filter, delivering affirmations directly to where lasting change happens.
              </p>
              <div className="space-y-4 pt-2">
                {[
                  { hz: "396 Hz", name: "Liberation", desc: "Releases guilt and fear, grounds you in safety" },
                  { hz: "417 Hz", name: "Change", desc: "Facilitates change and undoing negative situations" },
                  { hz: "528 Hz", name: "Transformation", desc: "Known as the 'Love Frequency' for DNA repair" },
                  { hz: "639 Hz", name: "Connection", desc: "Enhances relationships and harmonious connections" },
                  { hz: "741 Hz", name: "Expression", desc: "Awakens intuition and promotes self-expression" },
                  { hz: "852 Hz", name: "Intuition", desc: "Returns to spiritual order and inner strength" },
                ].map((freq, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-lg border border-purple-500/10 bg-purple-500/5 p-4 hover:border-purple-500/20 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Volume2 className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-purple-300">{freq.hz}</span>
                        <span className="text-sm text-muted-foreground">{freq.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{freq.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10">
                <img src="/images/brain-cosmos.png" alt="Neural transformation" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="font-serif text-white text-xl font-bold">Your neural pathways are being rewritten</p>
                  <p className="text-purple-200 text-sm mt-1">Every session strengthens new belief patterns</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t">
        <div className="absolute inset-0">
          <img src="/images/meditation-golden.png" alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-purple-950/40 to-background/90" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 text-center">
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="flex justify-center gap-3">
              {[Zap, Brain, Sparkles].map((Icon, i) => (
                <div key={i} className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                  <Icon className="h-6 w-6 text-purple-400" />
                </div>
              ))}
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white">
              Ready to Transform
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                Your Reality?
              </span>
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Choose your kit, record your affirmations, and begin rewiring your mind
              for the life you were born to live. Every session brings you closer.
            </p>
            <Link href="/kits">
              <Button size="lg" className="text-base px-10 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/25" data-testid="button-cta-browse">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Your Transformation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
