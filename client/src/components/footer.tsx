import { Link } from "wouter";
import { Sparkles, Brain, Waves } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t">
      <div className="absolute inset-0">
        <img src="/images/neural-pattern.png" alt="" className="w-full h-full object-cover opacity-5" />
        <div className="absolute inset-0 bg-card" style={{ opacity: 0.95 }} />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-serif text-lg font-bold">FrequencyVision</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rewire your mind and transform your reality with personalized frequency-powered vision videos.
            </p>
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <Brain className="h-3 w-3" />
              <span>Neural reprogramming technology</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Shop</h4>
            <div className="flex flex-col gap-2">
              <Link href="/kits" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                Browse All Kits
              </Link>
              <Link href="/kits?category=abundance" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                Wealth & Abundance
              </Link>
              <Link href="/kits?category=health" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                Health & Vitality
              </Link>
              <Link href="/kits?category=love" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                Love & Relationships
              </Link>
              <Link href="/kits?category=freedom" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                Freedom & Recovery
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Learn</h4>
            <div className="flex flex-col gap-2">
              <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                How It Works
              </Link>
              <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                About Frequencies
              </Link>
              <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                Brain Rewiring Science
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Support</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">
                support@frequencyvision.com
              </span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Waves className="h-4 w-4 text-purple-500/40" />
              <span className="text-xs text-muted-foreground italic">Tune in. Transform. Transcend.</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-purple-500/10 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            FrequencyVision. All rights reserved. Digital products for personal use only.
          </p>
        </div>
      </div>
    </footer>
  );
}
