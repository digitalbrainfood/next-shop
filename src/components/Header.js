import React from 'react';
import { Search, LayoutDashboard } from 'lucide-react';

const Header = ({ setView }) => (
  <header className="bg-white shadow-md sticky top-0 z-50">
    <div className="container mx-auto px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 onClick={() => setView({ page: 'home' })} className="text-2xl font-bold text-blue-600 cursor-pointer">ShopNext</h1>
          <nav className="hidden md:flex items-center space-x-4">
            <a href="#" className="text-gray-600 hover:text-blue-600">Departments</a>
            <a href="#" className="text-gray-600 hover:text-blue-600">Services</a>
          </nav>
        </div>
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search everything at ShopNext online and in store"
              className="w-full py-2 pl-4 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center space-x-6">
           <button onClick={() => setView({ page: 'vendor' })} className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-sm">Vendor Area</span>
          </button>
        </div>
      </div>
    </div>
  </header>
);

export default Header;