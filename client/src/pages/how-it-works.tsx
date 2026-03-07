import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Eye,
  Mic,
  Headphones,
  Waves,
  Volume2,
  Brain,
  Heart,
  ArrowRight,
  Zap,
  Star,
  ImageIcon,
  FileText,
  Music,
  CheckCircle,
  Package,
} from "lucide-react";

const stepImages = [
  "/images/abundance-flow.png",
  "/images/meditation-golden.png",
  "/images/brain-cosmos.png",
];

export default function HowItWorks() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden min-h-[50vh] flex items-center">
        <div className="absolute inset-0">
          <img src="/images/brain-rewire-1.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-transparent to-pink-900/20" />
        </div>
        <div className="absolute top-20 left-20 w-48 h-48 rounded-full bg-purple-500/10 blur-[80px] animate-pulse" />

        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center space-y-6">
          <Badge variant="secondary" className="gap-1.5 bg-purple-500/20 text-purple-200 border-purple-500/30 backdrop-blur-sm">
            <Brain className="h-3 w-3" />
            The FrequencyVision Method
          </Badge>
          <h1 className="font-serif text-5xl sm:text-6xl font-bold leading-tight text-white" data-testid="text-hiw-title">
            How Your Mind Gets
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              Rewired
            </span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Our digital movie kits use theta binaural beats to bypass the conscious mind's
            critical filter, delivering affirmations spoken in your own voice directly to
            the subconscious for lasting transformation.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-24">
          <div className="space-y-20">
            {[
              {
                step: "01",
                icon: Eye,
                title: "Choose Your Vision Kit",
                description:
                  "Browse our collection of kits covering abundance, health, weight loss, confidence, public speaking, addiction freedom, dream manifestation, and more. Each kit is built around a specific life transformation goal and comes loaded with everything you need: 20-40 curated images matching your kit's theme, 20-40 powerful affirmations written for your specific goal, and a prerecorded Solfeggio healing frequency paired with theta binaural beats.",
                detail:
                  "Every kit is designed around a specific transformation goal. The Solfeggio frequency (ranging from 396 Hz Liberation to 852 Hz Intuition) addresses the energetic aspect while the 6 Hz theta binaural beats guide your brainwaves into the 4-8 Hz subconscious-receptive state where real, lasting change happens. You browse the 20-40 images and 20-40 affirmations, choosing the 10 of each that resonate most deeply with your personal vision.",
                image: stepImages[0],
                reverse: false,
              },
              {
                step: "02",
                icon: Mic,
                title: "Select & Record Your Affirmations",
                description:
                  "From the 20-40 affirmations in your kit, you choose the 10 that resonate most deeply with your personal goals. Then you record yourself speaking each one aloud. This is the critical step — your subconscious mind responds to your own voice more powerfully than any other voice on earth. You are simultaneously speaking and reading the affirmation, engaging multiple neurological channels at once. You also choose 10 images from the kit's visual collection — the ones that stir the deepest emotional response in you.",
                detail:
                  "When you hear yourself speaking these statements while in a theta brainwave state, the subconscious absorbs them as personal truths rather than external suggestions. The conscious mind's critical filter is relaxed by the binaural beats, allowing the affirmations to pass through unchallenged. By choosing the affirmations and images that resonate most with YOU, the entire experience becomes deeply personal and exponentially more effective.",
                image: stepImages[1],
                reverse: true,
              },
              {
                step: "03",
                icon: Headphones,
                title: "Play Your Personalized Vision Movie",
                description:
                  "Put on headphones and play your personalized vision movie. Your 10 chosen images cycle as stunning visual backgrounds while your recorded affirmations play intermittently with on-screen captions. Underneath it all, the kit's Solfeggio healing frequency layered with theta binaural beats plays subliminally — guiding your brain into the receptive state. You can also upload your favorite song to play softly in the background, which automatically ducks when affirmations play.",
                detail:
                  "The theta binaural beats require headphones — they play a slightly different frequency in each ear, and your brain perceives the 6 Hz difference as a gentle pulsing rhythm that synchronizes your brainwaves to theta state. Use your movie daily, ideally upon waking or before sleep when your brain is naturally closer to theta state. With consistent use, you retrain the subconscious mind to adopt new beliefs, release old patterns, and align with your desired reality.",
                image: stepImages[2],
                reverse: false,
              },
            ].map((item, i) => (
              <div key={i} className={`grid grid-cols-1 gap-10 lg:grid-cols-2 items-center ${item.reverse ? "lg:direction-rtl" : ""}`}>
                <div className={`space-y-5 ${item.reverse ? "lg:order-2" : ""}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20">
                      <item.icon className="h-7 w-7 text-purple-400" />
                    </div>
                    <span className="font-mono text-5xl font-bold text-purple-500/20">
                      {item.step}
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl font-bold">{item.title}</h2>
                  <p className="text-muted-foreground leading-relaxed text-lg">{item.description}</p>
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.detail}</p>
                  </div>
                </div>
                <div className={`relative ${item.reverse ? "lg:order-1" : ""}`}>
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 group">
                    <img src={item.image} alt={item.title} className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl" />
                  <div className="absolute -bottom-3 -left-3 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
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
              Each kit is a complete digital vision movie system. Here's exactly what you receive:
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="relative overflow-hidden p-0">
                <div className="h-2 bg-gradient-to-r from-purple-500/30 to-violet-500/30" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/10">
                      <ImageIcon className="h-6 w-6 text-purple-400" />
                    </div>
                    <span className="font-mono text-3xl font-bold text-purple-500/20">01</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl">20-40 Vision Images</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A curated collection of 20-40 high-quality images that directly correspond
                    with the topic and goal of your kit. Aspirational, emotionally-charged visuals
                    designed to imprint your desired reality into your subconscious mind.
                  </p>
                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground">You browse through all images and choose the <strong className="text-foreground">10 that resonate most deeply</strong> with your personal vision</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground">Your selected images cycle as the visual backdrop of your personalized vision movie during playback</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="relative overflow-hidden p-0">
                <div className="h-2 bg-gradient-to-r from-pink-500/30 to-rose-500/30" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/10">
                      <FileText className="h-6 w-6 text-pink-400" />
                    </div>
                    <span className="font-mono text-3xl font-bold text-pink-500/20">02</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl">20-40 Affirmations</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Powerful affirmations written specifically for your transformation goal.
                    Carefully crafted statements designed to reprogram the specific limiting beliefs
                    and subconscious patterns that hold you back from your desired life.
                  </p>
                  <div className="bg-pink-500/5 border border-pink-500/10 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-pink-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground">You select the <strong className="text-foreground">10 affirmations</strong> that speak most powerfully to your personal goals</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-pink-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground">You <strong className="text-foreground">record each one in your own voice</strong> — the most powerful frequency for your subconscious mind</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="relative overflow-hidden p-0">
                <div className="h-2 bg-gradient-to-r from-amber-500/30 to-yellow-500/30" />
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/10">
                      <Music className="h-6 w-6 text-amber-400" />
                    </div>
                    <span className="font-mono text-3xl font-bold text-amber-500/20">03</span>
                  </div>
                  <h3 className="font-serif font-bold text-xl">Solfeggio Frequency Track</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    A prerecorded Solfeggio healing frequency specifically chosen to match your
                    kit's transformation goal — from 396 Hz Liberation for releasing fear and guilt,
                    to 852 Hz Intuition for manifestation and higher consciousness.
                  </p>
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground">Layered with <strong className="text-foreground">6 Hz theta binaural beats</strong> that guide your brain into the subconscious-receptive state (4-8 Hz)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground"><strong className="text-foreground">Headphones required</strong> — each ear receives a slightly different frequency to create the theta brainwave entrainment</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-amber-500/5 border border-purple-500/10 rounded-xl p-6">
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
        </div>
      </section>

      <section className="relative overflow-hidden border-y">
        <div className="absolute inset-0">
          <img src="/images/neural-pattern.png" alt="" className="w-full h-full object-cover opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-card via-card/95 to-card" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-24">
          <div className="text-center space-y-4 mb-14">
            <Badge variant="secondary" className="gap-1.5">
              <Zap className="h-3 w-3" />
              Triple-Channel Reprogramming
            </Badge>
            <h2 className="font-serif text-4xl font-bold">
              The Science Behind
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Brain Rewiring</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-lg">
              Three proven mechanisms work together to reprogram the subconscious mind
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: Waves,
                title: "Theta Binaural Beats",
                description:
                  "Each kit plays two slightly different frequencies — one in each ear. Your brain perceives the 6 Hz difference as a theta rhythm, naturally synchronizing your brainwaves to the 4-8 Hz range where the subconscious mind is directly accessible.",
                gradient: "from-blue-500/20 to-indigo-500/20",
              },
              {
                icon: Brain,
                title: "Subconscious Bypass",
                description:
                  "In theta state, the conscious mind's critical filter relaxes. This is the same state you enter during deep meditation, hypnosis, or just before sleep. Affirmations delivered in this state are absorbed as truth by the subconscious without resistance.",
                gradient: "from-purple-500/20 to-pink-500/20",
              },
              {
                icon: Heart,
                title: "Triple-Channel Absorption",
                description:
                  "You speak the affirmation (vocal), read it on screen (visual), and hear it played back (auditory) — all while in theta state. This multi-sensory approach creates far stronger neural imprinting than any single modality alone.",
                gradient: "from-pink-500/20 to-rose-500/20",
              },
            ].map((item, i) => (
              <Card key={i} className="relative overflow-hidden group p-0">
                <div className={`h-2 bg-gradient-to-r ${item.gradient}`} />
                <div className="p-6 space-y-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} border border-purple-500/10`}>
                    <item.icon className="h-6 w-6 text-purple-400" />
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

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
        <div className="relative mx-auto max-w-5xl px-4 py-24">
          <div className="text-center space-y-4 mb-14">
            <Badge variant="secondary" className="gap-1.5">
              <Volume2 className="h-3 w-3" />
              Healing Frequencies
            </Badge>
            <h2 className="font-serif text-4xl font-bold">
              Solfeggio Frequency
              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent"> Guide</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Each frequency is layered with 6 Hz theta binaural beats for subconscious access
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              {
                hz: "396 Hz",
                name: "Liberation Frequency",
                desc: "Liberates from guilt and fear. Creates emotional security and releases deep-rooted blocks around worthiness and safety.",
                use: "Abundance, Quit Smoking, Gambling Freedom, Shopping Addiction",
                color: "from-red-500/10 to-orange-500/10 border-red-500/10",
              },
              {
                hz: "417 Hz",
                name: "Change Frequency",
                desc: "Facilitates change at a cellular level. Cleanses traumatic experiences and undoes negative patterns stored in the body.",
                use: "Health & Vitality, Weight Loss Transformation",
                color: "from-orange-500/10 to-amber-500/10 border-orange-500/10",
              },
              {
                hz: "528 Hz",
                name: "Love Frequency",
                desc: "Known as the 'Miracle Tone.' Associated with DNA repair, emotional healing, and opening the heart to genuine connection.",
                use: "Love & Relationships, Sexual Addiction Recovery",
                color: "from-green-500/10 to-emerald-500/10 border-green-500/10",
              },
              {
                hz: "639 Hz",
                name: "Connection Frequency",
                desc: "Enhances communication and self-expression. Strengthens your connection to yourself and dissolves social fear patterns.",
                use: "Confidence Building, Public Speaking Mastery",
                color: "from-blue-500/10 to-indigo-500/10 border-blue-500/10",
              },
              {
                hz: "741 Hz",
                name: "Cleansing Frequency",
                desc: "Promotes emotional clarity and cleanses toxins. Awakens intuition and helps solve problems by clearing mental fog.",
                use: "Inner Peace, Drug Addiction Recovery, Alcohol Freedom",
                color: "from-indigo-500/10 to-purple-500/10 border-indigo-500/10",
              },
              {
                hz: "852 Hz",
                name: "Intuition Frequency",
                desc: "Raises awareness to higher consciousness. Enhances manifestation ability and connects you to your deepest purpose.",
                use: "Career Success, Dream Car & Dream Home Manifestation",
                color: "from-purple-500/10 to-pink-500/10 border-purple-500/10",
              },
            ].map((freq, i) => (
              <div key={i} className={`flex items-start gap-4 rounded-xl border bg-gradient-to-br ${freq.color} p-5 hover:scale-[1.02] transition-transform duration-300`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                  <Volume2 className="h-5 w-5 text-purple-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-purple-300">{freq.hz}</span>
                    <span className="text-sm font-medium">{freq.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{freq.desc}</p>
                  <span className="text-xs text-purple-400 font-medium">{freq.use}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/mountain-sunrise.png" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-purple-950/50 to-black/70" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <img src="/images/brain-rewire-1.png" alt="" className="rounded-2xl shadow-2xl shadow-purple-500/20 w-full aspect-[4/3] object-cover" />
            </div>
            <div className="text-center lg:text-left space-y-6">
              <div className="flex justify-center lg:justify-start gap-2">
                {[Brain, Zap, Star].map((Icon, i) => (
                  <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
                    <Icon className="h-5 w-5 text-purple-300" />
                  </div>
                ))}
              </div>
              <h2 className="font-serif text-4xl font-bold text-white">
                Every Session Rewires
                <span className="block bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                  Your Neural Pathways
                </span>
              </h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                Choose a kit that matches your goal, record your affirmations,
                and let theta binaural beats deliver them to your subconscious mind.
                Watch as your beliefs, habits, and reality begin to shift.
              </p>
              <Link href="/kits">
                <Button size="lg" className="text-base px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/25" data-testid="button-hiw-browse">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Browse Kits
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
