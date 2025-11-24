'use client';

import React from 'react';

interface IvyGradientProps {
  className?: string;
  children?: React.ReactNode;
}

export default function IvyGradient({ className = '', children }: IvyGradientProps) {
  return (
    <div className={`bg-ivy-gradient ${className}`}>
      {children}
    </div>
  );
}
