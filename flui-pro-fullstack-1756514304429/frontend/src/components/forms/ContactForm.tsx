import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ContactForm() {
  return (
    <form className="space-y-4">
      <Input type="text" placeholder="Nome" required />
      <Input type="email" placeholder="Email" required />
      <Input type="tel" placeholder="Telefone" required />
      <textarea className="w-full border rounded px-3 py-2" rows={4} placeholder="Mensagem" required />
      <Button type="submit">Enviar</Button>
    </form>
  );
}