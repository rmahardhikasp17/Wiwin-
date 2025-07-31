import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Transaksi from "./pages/Transaksi";
import Kategori from "./pages/Kategori";
import Laporan from "./pages/Laporan";
import Pengaturan from "./pages/Pengaturan";
import Target from "./pages/Target";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import OfflineIndicator from "./components/OfflineIndicator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <PWAInstallPrompt />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Index />
            </Layout>
          } />
          <Route path="/transaksi" element={
            <Layout>
              <Transaksi />
            </Layout>
          } />
          <Route path="/kategori" element={
            <Layout>
              <Kategori />
            </Layout>
          } />
          <Route path="/laporan" element={
            <Layout>
              <Laporan />
            </Layout>
          } />
          <Route path="/pengaturan" element={
            <Layout>
              <Pengaturan />
            </Layout>
          } />
          <Route path="/target" element={
            <Layout>
              <Target />
            </Layout>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
