import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  active = false,
  className = '', 
  ...props 
}) => {
  const baseStyle = "inline-flex items-center justify-center rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 active:scale-95",
    secondary: "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 shadow-sm backdrop-blur-sm active:scale-95",
    ghost: "text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100",
    icon: "p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-gray-100 transition-transform active:scale-90",
    glass: "bg-white/40 dark:bg-black/40 text-gray-800 dark:text-gray-200 border border-white/20 hover:bg-white/60 dark:hover:bg-black/60 backdrop-blur-md shadow-sm"
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
    icon: "p-2"
  };

  const activeStyle = active 
    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800" 
    : "";

  // Override for icon variant size
  const sizeClass = variant === 'icon' ? '' : sizes[size];

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizeClass} ${activeStyle} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};