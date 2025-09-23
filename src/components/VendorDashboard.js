import React from 'react';
import { PlusCircle } from 'lucide-react';
import { mockVendorProducts } from '../lib/mockData';
import StarRating from './StarRating';

const VendorDashboard = ({ setIsVendorLoggedIn, setVendorView }) => (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">My Products</h2>
            <div className="flex space-x-4">
                <button onClick={() => setVendorView('create_product')} className="flex items-center bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add Product
                </button>
                 <button onClick={() => setIsVendorLoggedIn(false)} className="flex items-center bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                    Log Out
                </button>
            </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 font-semibold">Product</th>
                        <th className="p-4 font-semibold">Price</th>
                        <th className="p-4 font-semibold">Rating</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {mockVendorProducts.map(p => (
                        <tr key={p.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 flex items-center space-x-3">
                                <img src={p.imageUrl} className="h-10 w-10 rounded-md object-cover" />
                                <span>{p.name}</span>
                            </td>
                            <td className="p-4">${p.price.toFixed(2)}</td>
                            <td className="p-4"><StarRating rating={p.rating} reviewCount={p.reviewCount} /></td>
                            <td className="p-4">
                                <a href="#" className="font-medium text-blue-600 hover:text-blue-800">Edit</a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default VendorDashboard;