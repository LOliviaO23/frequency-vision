import { Link, useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Play, ArrowRight, Crown, Star, Calendar } from "lucide-react";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function CheckoutSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const kitId = params.get("kitId") || "";
  const sessionId = params.get("session_id") || "";
  const isSubscription = params.get("subscription") === "true";
  const isLifetime = params.get("lifetime") === "true";

  const isPaidSubscription = isSubscription || isLifetime;
  const planType = isLifetime ? "lifetime" : isSubscription ? "annual" : null;

  const { isLoading: orderLoading } = useQuery({
    queryKey: ["/api/orders/verify", `?session_id=${sessionId}`],
    enabled: !!sessionId && !isPaidSubscription,
  });

  const recordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/subscription/record", {
        sessionId,
        planType,
      });
      return res.json();
    },
    onSuccess: () => {
      localStorage.setItem("fv_subscription_session", sessionId);
      localStorage.setItem("fv_subscription_plan", planType!);
    },
  });

  useEffect(() => {
    if (sessionId && isPaidSubscription && !recordMutation.isSuccess && !recordMutation.isPending) {
      recordMutation.mutate();
    }
  }, [sessionId, isPaidSubscription]);

  const isLoading = isPaidSubscription ? recordMutation.isPending : orderLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <Card className="p-8 text-center space-y-6">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </Card>
      </div>
    );
  }

  if (isLifetime) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <Card className="p-8 text-center space-y-6 border-violet-500/30">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
              <Crown className="h-8 w-8 text-violet-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold" data-testid="text-success-title">
              Lifetime Access Unlocked!
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              You now have unlimited access to every FrequencyVision kit — forever. 
              Build as many vision movies as you want, whenever you want.
            </p>
          </div>
          <div className="bg-violet-500/5 border border-violet-500/10 rounded-lg p-3 text-center">
            <p className="text-xs text-violet-400 font-semibold">Your access never expires</p>
          </div>
          <div className="space-y-3">
            <Link href="/kits">
              <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 border-0" size="lg" data-testid="button-browse-kits">
                <Play className="mr-2 h-4 w-4" />
                Start Building Your Kits
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (isSubscription) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <Card className="p-8 text-center space-y-6 border-amber-500/30">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
              <Star className="h-8 w-8 text-amber-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold" data-testid="text-success-title">
              Annual Pass Activated!
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Your year of transformation starts now. Pick any 4 kits over the next 
              12 months and build your personalized vision movies.
            </p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-amber-400 font-semibold">4 kits available · Access stored on this device</p>
          </div>
          <div className="space-y-3">
            <Link href="/kits">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-black font-semibold" size="lg" data-testid="button-browse-kits">
                <Play className="mr-2 h-4 w-4" />
                Choose Your First Kit
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <Card className="p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold" data-testid="text-success-title">
            Purchase Complete!
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Your digital movie kit is ready. Start recording your affirmations 
            and create your personalized vision movie.
          </p>
        </div>
        <div className="space-y-3">
          {kitId && (
            <Link href={`/player/${kitId}`}>
              <Button className="w-full" size="lg" data-testid="button-go-to-player">
                <Play className="mr-2 h-4 w-4" />
                Start Creating Your Movie
              </Button>
            </Link>
          )}
          <Link href="/kits">
            <Button variant="outline" className="w-full" data-testid="button-browse-more">
              Browse More Kits
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
