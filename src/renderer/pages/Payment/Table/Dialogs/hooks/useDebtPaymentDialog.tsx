// components/Payment/hooks/useDebtPaymentDialog.tsx
import { useState, useCallback } from "react";
import DebtPaymentDialog from "../DebtPaymentDialog";

interface UseDebtPaymentDialogProps {
  onSuccess?: () => void;
}

export const useDebtPaymentDialog = ({
  onSuccess,
}: UseDebtPaymentDialogProps = {}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

  const openDialog = useCallback((workerId: number) => {
    setSelectedWorkerId(workerId);
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedWorkerId(null);
  }, []);

  const handleDialogSuccess = useCallback(() => {
    closeDialog();
    if (onSuccess) {
      onSuccess();
    }
  }, [closeDialog, onSuccess]);

  const renderDialog = () => {
    if (!isDialogOpen || !selectedWorkerId) return null;

    return (
      <DebtPaymentDialog
        workerId={selectedWorkerId}
        onClose={closeDialog}
        onSuccess={handleDialogSuccess}
      />
    );
  };

  return {
    openDebtPaymentDialog: openDialog,
    closeDebtPaymentDialog: closeDialog,
    isDebtPaymentDialogOpen: isDialogOpen,
    DebtPaymentDialogComponent: renderDialog,
  };
};

// Alternative version: Hook na pwedeng gamitin sa component
export const useDebtPaymentDialogState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

  const open = useCallback((workerId: number) => {
    setSelectedWorkerId(workerId);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedWorkerId(null);
  }, []);

  return {
    isOpen,
    selectedWorkerId,
    openDialog: open,
    closeDialog: close,
  };
};