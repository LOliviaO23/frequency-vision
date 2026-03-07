import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { type Kit, type Affirmation, categoryLabels, type Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Waves,
  Clock,
  Mic,
  Play,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Volume2,
  ShoppingCart,
  Brain,
  Zap,
  Images,
} from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function KitDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [purchasing, setPurchasing] = useState(false);

  const { data: kit, isLoading: kitLoading } = useQuery<Kit>({
    queryKey: ["/api/kits", id],
  });

  const { data: kitAffirmations, isLoading: affirmationsLoading } = useQuery<Affirmation[]>({
    queryKey: ["/api/kits", id, "affirmations"],
  });

  const handlePurchase = async () => {
    if (!kit) return;
    setPurchasing(true);
    try {
      const res = await apiRequest("POST", "/api/checkout", {
        kitId: kit.id,
        email: "",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        window.location.href = `/player/${kit.id}`;
      }
    } catch (err: any) {
      toast({
        title: "Purchase Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (kitLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-md" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div>
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="font-semibold text-xl mb-2">Kit Not Found</h2>
        <p className="text-muted-foreground mb-4">This kit doesn't exist or has been removed.</p>
        <Link href="/kits">
          <Button data-testid="button-back-to-kits">Back to Kits</Button>
        </Link>
      </div>
    );
  }

  const categoryLabel = categoryLabels[kit.category as Category] || kit.category;

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={kit.thumbnailUrl}
            alt={kit.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pt-8 pb-16 sm:pb-24">
          <Link href="/kits">
            <Button variant="ghost" className="mb-8 gap-2 text-white hover:bg-white/10" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
              Back to Kits
            </Button>
          </Link>

          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="backdrop-blur-sm bg-purple-500/20 text-purple-200 border-purple-500/30 no-default-hover-elevate no-default-active-elevate">
                {categoryLabel}
              </Badge>
              <Badge variant="secondary" className="backdrop-blur-sm bg-white/10 text-white border-white/20 no-default-hover-elevate no-default-active-elevate">
                <Waves className="mr-1 h-3 w-3" />
                {kit.frequencyHz} Hz - {kit.frequencyType}
              </Badge>
              <Badge variant="secondary" className="backdrop-blur-sm bg-white/10 text-white border-white/20 no-default-hover-elevate no-default-active-elevate">
                <Clock className="mr-1 h-3 w-3" />
                {kit.duration} min
              </Badge>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight" data-testid="text-kit-detail-title">
              {kit.title}
            </h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-3">
              <h2 className="font-serif font-bold text-xl">About This Kit</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">{kit.description}</p>
            </div>

            <div className="space-y-3">
              <h2 className="font-serif font-bold text-xl">Frequency Details</h2>
              <Card className="relative overflow-hidden p-0">
                <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/10">
                      <Volume2 className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-purple-300">{kit.frequencyHz} Hz</span>
                        <span className="text-sm text-muted-foreground">{kit.frequencyType}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {kit.frequencyDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="relative overflow-hidden rounded-xl">
              <img src="/images/brain-rewire-1.png" alt="" className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-purple-900/60 to-pink-900/80 flex items-center justify-center">
                <div className="text-center space-y-2 px-4">
                  <Brain className="h-8 w-8 text-purple-300 mx-auto" />
                  <p className="font-serif text-white text-lg font-bold">Your subconscious is ready to receive new programming</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-xl">
                  Affirmations ({kitAffirmations?.length || 0})
                </h2>
                <span className="text-xs text-muted-foreground">
                  Select and record these in your own voice
                </span>
              </div>
              {affirmationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {kitAffirmations?.map((aff, i) => (
                    <div
                      key={aff.id}
                      className="flex items-start gap-3 rounded-lg border border-purple-500/10 bg-purple-500/5 p-4 hover:border-purple-500/20 transition-colors"
                      data-testid={`text-affirmation-${aff.id}`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 font-mono text-xs font-bold text-purple-400">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed pt-0.5">{aff.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="relative overflow-hidden p-0 sticky top-20">
              <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500" />
              <div className="p-6 space-y-5">
                <div className="space-y-1">
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" data-testid="text-kit-price">
                    ${(kit.price / 100).toFixed(2)}
                  </span>
                  <p className="text-sm text-muted-foreground">One-time purchase, unlimited use</p>
                </div>

                <div className="space-y-3">
                  {[
                    "Personalized 5-7 min vision movie",
                    "40 affirmations to choose from",
                    "Record in your own voice",
                    "Theta binaural beats for subconscious access",
                    "Solfeggio healing frequency layered in",
                    "10 stunning visual backgrounds",
                    "Upload your favorite background song",
                    "Use with headphones for full effect",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0 text-purple-400 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 shadow-lg shadow-purple-500/20"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={purchasing}
                  data-testid="button-purchase-kit"
                >
                  {purchasing ? (
                    "Processing..."
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Purchase Kit
                    </>
                  )}
                </Button>

                <Link href={`/player/${kit.id}`}>
                  <Button variant="outline" className="w-full gap-2" data-testid="button-try-preview">
                    <Play className="h-4 w-4" />
                    Try Free Preview
                  </Button>
                </Link>

                <Link href={`/vision-board/${kit.id}`}>
                  <Button variant="outline" className="w-full gap-2" data-testid="button-vision-board">
                    <Images className="h-4 w-4" />
                    Vision Board (50 Images)
                  </Button>
                </Link>

                <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3 text-center" data-testid="badge-neural-reprogramming">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400">NEURAL REPROGRAMMING</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Daily use recommended for maximum brain rewiring</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
