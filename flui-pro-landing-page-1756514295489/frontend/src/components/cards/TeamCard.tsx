import React from 'react';
export default function TeamCard({ name, role, image }: any) {
  return (
    <div className="text-center">
      <img src={image} alt={name} className="w-32 h-32 rounded-full mx-auto mb-4" />
      <h3 className="font-bold">{name}</h3>
      <p className="text-gray-600">{role}</p>
    </div>
  );
}