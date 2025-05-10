import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, User, Menu, X, Sparkles, LogOut } from 'lucide-react';
import { supabase } from '../services/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

interface HeaderProps {
  showAuthModal: boolean;
  onCloseAuthModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ showAuthModal, onCloseAuthModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        onCloseAuthModal();
      }
    });

    return () => subscription.unsubscribe();
  }, [onCloseAuthModal]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-sm' 
          : 'bg-white'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            <span className="text-4xl font-medium tracking-tight text-blue-600">A</span>
            <span className="text-[9px] font-light tracking-[0.2em] text-blue-400">DHIKAR</span>
            <span className="text-4xl font-medium tracking-tight text-blue-600">I</span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-black transition-colors text-sm">
              Men
            </a>
            <a href="#" className="text-gray-600 hover:text-black transition-colors text-sm">
              Women
            </a>
            <a href="#" className="text-gray-600 hover:text-black transition-colors text-sm">
              Collections
            </a>
            <a href="#" className="text-gray-600 hover:text-black transition-colors text-sm">
              Sale
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-black transition-colors">
              <Search size={20} />
            </button>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-light">{user.email}</span>
                <button 
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-black transition-colors"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onCloseAuthModal()}
                className="p-2 text-gray-600 hover:text-black transition-colors"
              >
                <User size={20} />
              </button>
            )}
            <div className="flex items-center gap-2 bg-gray-100 py-1 px-3 rounded-full text-sm shadow">
              <Sparkles className="h-4 w-4 text-green-600" />
              <span className="font-light text-gray-700">AI-Powered</span>
            </div>
            <button 
              className="md:hidden p-2 text-gray-600 hover:text-black transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 px-4">
          <nav className="flex flex-col space-y-4">
            <a 
              href="#" 
              className="text-gray-600 hover:text-black transition-colors py-2 px-4 text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Men
            </a>
            <a 
              href="#" 
              className="text-gray-600 hover:text-black transition-colors py-2 px-4 text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Women
            </a>
            <a 
              href="#" 
              className="text-gray-600 hover:text-black transition-colors py-2 px-4 text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Collections
            </a>
            <a 
              href="#" 
              className="text-gray-600 hover:text-black transition-colors py-2 px-4 text-sm"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sale
            </a>
          </nav>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] max-w-md w-full mx-4 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-1">
                <span className="text-3xl font-medium tracking-tight text-blue-600">A</span>
                <span className="text-[8px] font-light tracking-[0.2em] text-blue-400 mt-2">DHIKAR</span>
                <span className="text-3xl font-medium tracking-tight text-blue-600">I</span>
              </div>
              <button 
                onClick={onCloseAuthModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    background: 'linear-gradient(to right, #818cf8, #6366f1)',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    height: 'auto',
                    fontWeight: '400',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    '&:hover': {
                      background: 'linear-gradient(to right, #6366f1, #4f46e5)',
                    },
                  },
                  input: {
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '12px 16px',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
                    '&:focus': {
                      border: '1px solid #818cf8',
                      boxShadow: '0 0 0 2px rgba(129, 140, 248, 0.2)',
                    },
                  },
                  label: {
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '400',
                  },
                  container: {
                    background: 'transparent',
                  },
                  message: {
                    borderRadius: '8px',
                    padding: '12px',
                  },
                  divider: {
                    background: 'rgba(0, 0, 0, 0.1)',
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-button',
                  input: 'auth-input',
                  label: 'auth-label',
                  message: 'auth-message',
                },
              }}
              providers={['google']}
              view="sign_in"
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;