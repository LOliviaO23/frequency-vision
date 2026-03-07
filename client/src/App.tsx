import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HelpBot } from "@/components/help-bot";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Kits from "@/pages/kits";
import KitDetail from "@/pages/kit-detail";
import Player from "@/pages/player";
import HowItWorks from "@/pages/how-it-works";
import CheckoutSuccess from "@/pages/checkout-success";
import VisionBoard from "@/pages/vision-board";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/kits" component={Kits} />
      <Route path="/kits/:id" component={KitDetail} />
      <Route path="/player/:id" component={Player} />
      <Route path="/vision-board/:id" component={VisionBoard} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Router />
            </main>
            <Footer />
          </div>
          <Toaster />
          <HelpBot />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
