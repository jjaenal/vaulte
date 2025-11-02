// Placeholder untuk komponen toast
// Dalam implementasi nyata, ini akan menggunakan library seperti react-hot-toast atau shadcn/ui

import { useState } from 'react';

type ToastVariant = 'default' | 'destructive';

interface ToastProps {
  title: string;
  description: string;
  variant?: ToastVariant;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, props]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter((_, i) => i !== 0));
    }, 3000);

    console.log(`Toast: ${props.title} - ${props.description}`);
    return id;
  };

  return { toast, toasts };
}
