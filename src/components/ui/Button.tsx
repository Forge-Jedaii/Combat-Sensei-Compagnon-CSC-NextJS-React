"use client";

import React, { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ children, className = "", ...props }, ref) {
  return (
    <button
      ref={ref}
      {...props}
      className={`px-4 py-2 rounded-xl font-semibold bg-cyber-blue/80 border border-cyber-blue/40 text-white shadow-md hover:scale-105 hover:shadow-lg transition-transform duration-200 ${className}`}
    >
      {children}
    </button>
  );
});

export default Button;
