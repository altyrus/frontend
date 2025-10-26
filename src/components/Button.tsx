import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'secondary';
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  icon,
  fullWidth = false
}: ButtonProps) {
  const baseClasses = "flex items-center justify-center gap-4 px-8 py-8 text-2xl font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg";

  const variantClasses = {
    primary: "bg-blue-600 text-white active:bg-blue-700 hover:bg-blue-700",
    success: "bg-green-600 text-white active:bg-green-700 hover:bg-green-700",
    danger: "bg-red-600 text-white active:bg-red-700 hover:bg-red-700",
    warning: "bg-orange-600 text-white active:bg-orange-700 hover:bg-orange-700",
    secondary: "bg-gray-600 text-white active:bg-gray-700 hover:bg-gray-700"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass}`}
    >
      {icon && <span className="text-3xl">{icon}</span>}
      {children}
    </button>
  );
}
