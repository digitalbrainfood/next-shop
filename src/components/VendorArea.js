import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import VendorLogin from './VendorLogin';
import VendorDashboard from './VendorDashboard';
import CreateProductForm from './CreateProductForm';

const VendorArea = ({setView}) => {
    const [isVendorLoggedIn, setIsVendorLoggedIn] = useState(false);
    const [vendorView, setVendorView] = useState('dashboard'); // 'dashboard' or 'create_product'

    return (
        <div className="container mx-auto px-4 py-8">
            <button onClick={() => setView({ page: 'home' })} className="flex items-center text-blue-600 hover:underline mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Homepage
            </button>
            {!isVendorLoggedIn ? (
                <VendorLogin setIsVendorLoggedIn={setIsVendorLoggedIn} />
            ) : (
                <>
                    {vendorView === 'dashboard' && <VendorDashboard setIsVendorLoggedIn={setIsVendorLoggedIn} setVendorView={setVendorView} />}
                    {vendorView === 'create_product' && <CreateProductForm setVendorView={setVendorView} />}
                </>
            )}
        </div>
    )
}

export default VendorArea;