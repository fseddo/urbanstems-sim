import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const usePortal = (isOpen: boolean) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (children: ReactNode) => createPortal(children, document.body);
};
