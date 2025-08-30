import React from 'react';
export default function TestimonialCard({ name, text, rating }: any) {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex mb-2">{'⭐'.repeat(rating)}</div>
      <p className="mb-4">"{text}"</p>
      <p className="font-semibold">{name}</p>
    </div>
  );
}