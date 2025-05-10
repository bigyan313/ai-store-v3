import React, { useState, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import ResultsPanel from './components/ResultsPanel';
import Header from './components/Header';
import Footer from './components/Footer';
import { TravelPlan } from './types';
import { extractTravelInfo, generateOutfitSuggestions } from './services/openai';
import { getWeatherForecast } from './services/weather';
import { searchProducts } from './services/shopping';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './services/supabase';

function App() {
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Handle OAuth redirect
    const handleAuthRedirect = async () => {
      const { hash, pathname } = window.location;
      if (pathname === '/auth/callback' || hash.includes('access_token')) {
        const { data, error } = await supabase.auth.getSession();
        if (error) console.error('Auth redirect error:', error);
        if (data?.session) {
          setIsAuthenticated(true);
          // Clean up URL
          window.history.replaceState({}, document.title, '/');
        }
      }
    };

    handleAuthRedirect();

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthed = !!session?.user;
      setIsAuthenticated(isAuthed);
      
      if (isAuthed) {
        setShowAuthModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) {
      setIsChatOpen(false); // Close chat when loading starts
    }
  }, [isLoading]);

  const handleChatSubmit = async (message: string) => {
    if (!hasInteracted) setHasInteracted(true);
    setIsLoading(true);
    
    try {
      const info = await extractTravelInfo(message);
      
      if (info.type === 'travel') {
        const weatherData = await getWeatherForecast(info.destination!, info.date!);
        const warning = weatherData.warning;
        
        const outfitSuggestions = await generateOutfitSuggestions({ weather: weatherData });
        
        const outfitsWithProducts = await Promise.all(
          outfitSuggestions.map(async (outfit: any) => ({
            ...outfit,
            products: await searchProducts(outfit)
          }))
        );
        
        setTravelPlan({
          id: Math.random().toString(36).substring(2, 9),
          destination: info.destination!,
          date: weatherData.date,
          weather: weatherData,
          outfits: outfitsWithProducts,
          status: warning ? 'warning' : 'success',
          warning,
          type: 'travel'
        });
      } else {
        const outfitSuggestions = await generateOutfitSuggestions({ event: info.event });
        
        const outfitsWithProducts = await Promise.all(
          outfitSuggestions.map(async (outfit: any) => ({
            ...outfit,
            products: await searchProducts(outfit)
          }))
        );
        
        setTravelPlan({
          id: Math.random().toString(36).substring(2, 9),
          event: info.event!,
          outfits: outfitsWithProducts,
          status: 'success',
          type: 'event'
        });
      }
    } catch (error: any) {
      console.error('Error processing request:', error);
      setTravelPlan({
        id: Math.random().toString(36).substring(2, 9),
        status: 'error',
        error: error.message || 'Failed to process your request. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setIsChatOpen(false); // Close chat after outfit generation completes
    }
  };

  const toggleChat = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    setIsChatOpen(!isChatOpen);
  };

  const handleAuthRequest = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header showAuthModal={showAuthModal} onCloseAuthModal={() => setShowAuthModal(false)} />
      <main className="container mx-auto px-4 py-6 max-w-[1920px] min-h-[calc(100vh-4rem)] mt-16">
        <div className="w-full h-full">
          <ResultsPanel 
            travelPlan={travelPlan} 
            isLoading={isLoading} 
            onChatOpen={toggleChat}
            hasInteracted={hasInteracted}
          />
        </div>

        {hasInteracted && (
          <button
            onClick={toggleChat}
            className="fixed bottom-0 left-0 w-full z-50 py-4 bg-white shadow-md border-t border-gray-200 flex items-center justify-center gap-2 text-gray-700 font-medium text-base transition hover:bg-gray-50"
          >
            {isChatOpen ? (
              <>
                <X className="h-5 w-5" />
                Close Chat
              </>
            ) : (
              <>
                <MessageCircle className="h-5 w-5" />
                Open Chat
              </>
            )}
          </button>
        )}

        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-24 right-6 z-40 w-full max-w-md"
            >
              <ChatPanel 
                onSubmit={handleChatSubmit} 
                isLoading={isLoading}
                travelPlan={travelPlan}
                onRequestAuth={handleAuthRequest}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default App;