import React from 'react';

const Footer = () => (
    <footer className="bg-gray-800 text-white mt-12">
        <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="font-bold mb-4">Get to Know Us</h3>
                    <ul>
                        <li className="mb-2"><a href="#" className="hover:underline">About ShopNext</a></li>
                        <li className="mb-2"><a href="#" className="hover:underline">Careers</a></li>
                        <li className="mb-2"><a href="#" className="hover:underline">Our Brands</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold mb-4">Customer Service</h3>
                    <ul>
                        <li className="mb-2"><a href="#" className="hover:underline">Help Center</a></li>
                        <li className="mb-2"><a href="#" className="hover:underline">Returns</a></li>
                        <li className="mb-2"><a href="#" className="hover:underline">Contact Us</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold mb-4">In The Spotlight</h3>
                    <ul>
                        <li className="mb-2"><a href="#" className="hover:underline">Electronics</a></li>
                        <li className="mb-2"><a href="#" className="hover:underline">Home Goods</a></li>
                        <li className="mb-2"><a href="#" className="hover:underline">Grocery</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold mb-4">ShopNext for Business</h3>
                    <ul>
                        <li className="mb-2"><a href="#" className="hover:underline">Sell on ShopNext</a></li>
                        <li className="mb-2"><a href="#" className="hover:underline">Affiliate Program</a></li>
                    </ul>
                </div>
            </div>
            <div className="mt-10 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
                &copy; {new Date().getFullYear()} ShopNext, Inc. All Rights Reserved.
            </div>
        </div>
    </footer>
);

export default Footer;