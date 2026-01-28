// components/Bukid/hooks/useBukidActions.ts
import { useNavigate } from 'react-router-dom';
import { dialogs, showConfirm } from '../../../../utils/dialogs';
import { showError, showSuccess, showToast } from '../../../../utils/notification';
import bukidAPI from '../../../../apis/bukid';
import type { BukidData } from '../../../../apis/bukid';

export const useBukidActions = (
  bukids: BukidData[],
  fetchBukids: () => Promise<void>,
  selectedBukids: number[] = [],
  statusFilter: string = 'all',
  kabisilyaFilter: number | null = null
) => {
  const navigate = useNavigate();

  const handleDeleteBukid = async (id: number, name: string) => {
    const confirmed = await dialogs.delete(name);
    if (!confirmed) return;

    try {
      showToast('Deleting bukid...', 'info');
      const response = await bukidAPI.delete(id);

      if (response.status) {
        showSuccess(`Bukid "${name}" deleted successfully`);
        fetchBukids();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to delete bukid');
    }
  };

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    const confirmed = await showConfirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Bukid`,
      message: `Are you sure you want to ${action} this bukid?`,
      icon: 'warning',
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      showToast(`${action.charAt(0).toUpperCase() + action.slice(1)}ing bukid...`, 'info');
      const response = await bukidAPI.updateStatus(id, newStatus);

      if (response.status) {
        showSuccess(`Bukid ${action}d successfully`);
        fetchBukids();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || `Failed to ${action} bukid`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBukids.length === 0) return;

    const confirmed = await showConfirm({
      title: 'Bulk Delete Confirmation',
      message: `Are you sure you want to delete ${selectedBukids.length} selected bukid(s)? This action cannot be undone.`,
      icon: 'danger',
      confirmText: 'Delete All',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      showToast('Deleting selected bukid...', 'info');
      const results = await Promise.allSettled(
        selectedBukids.map(id => bukidAPI.delete(id))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

      if (failed.length === 0) {
        showSuccess(`Successfully deleted ${successful.length} bukid(s)`);
      } else {
        showError(`Deleted ${successful.length} bukid(s), failed to delete ${failed.length} bukid(s)`);
      }

      fetchBukids();
    } catch (err: any) {
      showError(err.message || 'Failed to delete bukid');
    }
  };

  const handleExportCSV = async () => {
    if(!await dialogs.confirm({title: 'Export Bukid Data', message: 'Do you want to export the bukid data to a CSV file?'}))return;
    try {
      showToast('Exporting to CSV...', 'info');
      const response = await bukidAPI.exportToCSV({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        kabisilyaId: kabisilyaFilter || undefined
      });

      if (response.status) {
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccess(`Exported ${response.data.recordCount} records to CSV`);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to export CSV');
    }
  };

  const handleSort = (field: string, currentSortBy: string, currentSortOrder: 'ASC' | 'DESC') => {
    if (currentSortBy === field) {
      return currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
    }
    return 'ASC';
  };

  const handleStatusFilterChange = (status: string) => {
    return status;
  };

  return {
    handleDeleteBukid,
    handleUpdateStatus,
    handleBulkDelete,
    handleExportCSV,
    handleSort,
    handleStatusFilterChange
  };
};