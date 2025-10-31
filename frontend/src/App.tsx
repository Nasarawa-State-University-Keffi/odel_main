import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Application from "./pages/Application";
import NotFound from "./pages/NotFound";
import OdelHistory from "./pages/OdelHistory";
import ViceChancellorMessage from "./pages/ViceChancellorMessage";
import DirectorMessage from "./pages/DirectorMessage";
import OurStaff from "./pages/OurStaff";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/application" element={<Application />} />
          <Route path="/odel-history" element={<OdelHistory />} />
          <Route path="/vice-chancellor-message" element={<ViceChancellorMessage />} />
          <Route path="/director-message" element={<DirectorMessage />} />
          <Route path="/our-staff" element={<OurStaff />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
