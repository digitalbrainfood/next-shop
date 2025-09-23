import React from 'react';
import { ImageIcon, Video } from 'lucide-react';

const CreateProductForm = ({ setVendorView }) => (
    <div className="bg-white p-8 rounded-lg shadow-md border">
        <h3 className="text-xl font-bold mb-6 text-gray-800">Add New Product</h3>
        <form className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input type="text" placeholder="e.g., Quantum-Core Laptop Pro" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Subtitle</label>
                <input type="text" placeholder="e.g., 16-Core Powerhouse for Professionals" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Short Description</label>
                <textarea rows="2" placeholder="A brief, catchy summary of the product." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Long Description</label>
                <textarea rows="5" placeholder="Detailed information about the product's features, benefits, and specifications." className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input type="number" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                     <input type="text" placeholder="e.g., Electronics" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Tags</label>
                <input type="text" placeholder="e.g., laptop, pro, 4k display" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                <p className="mt-2 text-xs text-gray-500">Enter tags separated by commas.</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Media</label>
                <div className="flex space-x-4">
                     <button type="button" className="flex items-center justify-center w-1/2 py-3 px-4 border-2 border-dashed rounded-md text-gray-500 hover:bg-gray-50">
                        <ImageIcon className="h-5 w-5 mr-2" /> Upload Photos
                    </button>
                    <button type="button" className="flex items-center justify-center w-1/2 py-3 px-4 border-2 border-dashed rounded-md text-gray-500 hover:bg-gray-50">
                        <Video className="h-5 w-5 mr-2" /> Upload Video
                    </button>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setVendorView('dashboard')} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" className="py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Save Product
                </button>
            </div>
        </form>
    </div>
);

export default CreateProductForm;