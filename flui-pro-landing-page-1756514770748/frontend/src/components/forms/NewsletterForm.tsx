import React from 'react';
export default function NewsletterForm() {
  return (
    <form className="flex gap-2">
      <input type="email" placeholder="Seu email" className="px-3 py-2 border rounded" />
      <button className="px-4 py-2 bg-primary-600 text-white rounded">Inscrever</button>
    </form>
  );
}