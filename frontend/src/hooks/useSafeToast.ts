import { useContext } from 'react';
import { ToastContext } from '../context/ToastContextDefinition';

export const useSafeToast = () => {
  const context = useContext(ToastContext);
  
  // Return no-op functions if context is not available
  const noOp = () => {};
  
  return {
    showToast: context?.showToast || noOp,
    showSuccess: context?.showSuccess || noOp,
    showError: context?.showError || noOp,
    showInfo: context?.showInfo || noOp,
    showWarning: context?.showWarning || noOp,
    removeToast: context?.removeToast || noOp,
  };
};
