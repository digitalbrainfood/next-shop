import React from 'react';
import ProductCard from './ProductCard';
import { mockProducts } from '../lib/mockData';

const HomePage = ({ setView }) => (
  <main className="container mx-auto px-4 py-8">
    <section>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Featured Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {mockProducts.map(product => (
          <ProductCard key={product.id} product={product} setView={setView} />
        ))}
      </div>
    </section>
  </main>
);

export default HomePage;