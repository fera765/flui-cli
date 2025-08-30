import React from 'react';
export default function FeatureCard({ title, description, icon }: any) {
  return (
    <div className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}