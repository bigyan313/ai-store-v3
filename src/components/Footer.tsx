import React from 'react';
import { Instagram, Twitter, Facebook, Youtube, Github } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-4 md:px-6 bg-gray-100">
      <div className="container mx-auto max-w-[1920px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-1 mb-4">
              <span className="text-4xl font-medium tracking-tight text-black">A</span>
              <span className="text-[9px] font-light tracking-[0.2em] text-gray-600">DHIKAR</span>
              <span className="text-4xl font-medium tracking-tight text-black">I</span>
            </div>
            <p className="text-gray-600 mb-6 font-light">
              AI-powered fashion assistant that suggests outfits based on weather forecasts and personal style.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-black transition">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-black transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-black transition">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-black transition">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-black mb-4">Shop</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Men's Collection</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Women's Collection</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">New Arrivals</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Sale</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Accessories</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-black mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">About Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Careers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Store Locations</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Our Technology</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Contact Us</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-black mb-4">Support</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">FAQs</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Shipping & Returns</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Size Guide</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Track Your Order</a></li>
              <li><a href="#" className="text-gray-600 hover:text-black transition font-light">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-600 mb-4 md:mb-0 font-light">
            © {new Date().getFullYear()} ADHIKARI™. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-black transition font-light">Terms of Service</a>
            <a href="#" className="text-gray-600 hover:text-black transition font-light">Privacy Policy</a>
            <a href="#" className="text-gray-600 hover:text-black transition font-light">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;