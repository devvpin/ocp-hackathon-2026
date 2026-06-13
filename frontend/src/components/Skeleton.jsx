import React from 'react';

const Skeleton = ({ className = '', type = 'text' }) => {
  const baseClass = 'animate-pulse bg-gray-200';
  
  const types = {
    text: 'h-4 w-full rounded',
    circle: 'rounded-full',
    rect: 'rounded-md',
  };

  return <div className={`${baseClass} ${types[type]} ${className}`}></div>;
};

export default Skeleton;
