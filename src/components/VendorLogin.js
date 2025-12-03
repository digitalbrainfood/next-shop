import React from 'react';
import { LogIn } from 'lucide-react';

const VendorLogin = ({ setIsVendorLoggedIn }) => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border">
            <h2 className="text-2xl font-bold text-center text-gray-800">Vendor Login</h2>
            <div>
                <label className="text-sm font-medium text-gray-700">Username</label>
                <input type="text" placeholder="e.g., ElectroGadgets" className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
             <p className="text-xs text-center text-gray-500">Note: Vendor accounts are created by admins only.</p>
            <button onClick={() => setIsVendorLoggedIn(true)} className="w-full py-3 font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                <div className="flex items-center justify-center">
                    <LogIn className="h-5 w-5 mr-2"/>
                    Sign In
                </div>
            </button>
        </div>
    </div>
);

export default VendorLogin;