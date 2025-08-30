import React from 'react';
export default function SocialLinks({ className }: any) {
  return (
    <div className={`flex gap-4 ${className}`}>
      <a href="#">Facebook</a>
      <a href="#">Twitter</a>
      <a href="#">LinkedIn</a>
    </div>
  );
}