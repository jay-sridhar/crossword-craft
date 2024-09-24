import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white shadow-md rounded-lg ${className}`}>{children}</div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export const Button = ({ children, className = '', ...props }) => (
  <button className={`px-4 py-2 rounded ${className}`} {...props}>{children}</button>
);

export const Alert = ({ children, className = '', variant = 'default', onDismiss }) => (
  <div className={`p-4 rounded ${className} ${
    variant === 'destructive' ? 'bg-red-100 text-red-700' : 
    variant === 'success' ? 'bg-green-100 text-green-700' : 
    'bg-blue-100 text-blue-700'
  }`}>
    {children}
    {onDismiss && (
      <button 
        onClick={onDismiss} 
        className="float-right font-bold"
        aria-label="Dismiss"
      >
        &times;
      </button>
    )}
  </div>
);

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm [&_p]:leading-relaxed ${className}`}
    {...props}
  />
))

AlertDescription.displayName = "AlertDescription"

export {AlertDescription};
