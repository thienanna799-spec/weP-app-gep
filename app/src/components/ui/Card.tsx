import React from 'react';

const Card = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
