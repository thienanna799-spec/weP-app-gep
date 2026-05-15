import React from 'react';

const Input = ({ label, className, ...props }: any) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input 
      {...props} 
      className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${className || ''}`}
    />
  </div>
);

export default Input;
