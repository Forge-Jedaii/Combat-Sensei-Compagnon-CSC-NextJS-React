"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export default function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-xl font-semibold bg-cyber-blue/80 border border-cyber-blue/40 text-white shadow-md hover:scale-105 hover:shadow-lg transition-transform duration-200 ${className}`}
    >
      {children}
    </button>
  );
}
