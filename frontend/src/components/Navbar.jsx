import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-cyber-dark/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
      <Link to="/">
        <BrandLogo size="md" />
      </Link>
      
      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Features</a>
        <a href="#how-it-works" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">How it Works</a>
        <a href="#trust" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Security</a>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Log In</Link>
        <Link 
          to="/dashboard" 
          className="bg-cyber-neon-blue text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-cyber-neon-green transition-all hover:scale-105 shadow-neon-blue hover:shadow-neon-green"
        >
          View Dashboard
        </Link>
      </div>
    </nav>
  );
}
