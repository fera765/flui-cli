import React from 'react';
import Button from '@/components/ui/Button';

export default function PlanCard({ name, price, features }: any) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className="text-4xl font-bold mb-4">R$ {price}<span className="text-sm">/mês</span></p>
      <ul className="space-y-2 mb-6">
        {features?.map((f: string) => <li key={f}>✓ {f}</li>)}
      </ul>
      <Button className="w-full">Escolher Plano</Button>
    </div>
  );
}