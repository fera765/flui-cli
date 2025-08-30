import React from 'react';
export default function ScrollToTop() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-4 right-4 p-3 bg-primary-600 text-white rounded-full shadow-lg"
    >
      ↑
    </button>
  );
}