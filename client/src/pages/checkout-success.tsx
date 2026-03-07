import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Play, ArrowRight } from "lucide-react";

export default function CheckoutSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const kitId = params.get("kitId") || "";
  const sessionId = params.get("session_id") || "";

  const { isLoading } = useQuery({
    queryKey: ["/api/orders/verify", `?session_id=${sessionId}`],
    enabled: !!sessionId,
  });

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
