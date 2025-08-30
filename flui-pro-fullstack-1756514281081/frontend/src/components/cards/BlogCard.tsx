import React from 'react';
export default function BlogCard({ title, excerpt, date }: any) {
  return (
    <article className="p-6 bg-white rounded-lg shadow">
      <time className="text-sm text-gray-500">{date}</time>
      <h3 className="text-xl font-bold mt-2 mb-2">{title}</h3>
      <p className="text-gray-600">{excerpt}</p>
    </article>
  );
}