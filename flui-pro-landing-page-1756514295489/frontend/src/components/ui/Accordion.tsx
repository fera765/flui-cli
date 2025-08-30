import React from 'react';
export default function Accordion({ items }: any) { return <div>{items?.map((item: any) => <div key={item.question}>{item.question}</div>)}</div>; }