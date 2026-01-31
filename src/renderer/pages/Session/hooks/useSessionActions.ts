// components/Session/hooks/useSessionActions.ts

import type { SessionListData } from "../../../apis/session";
import sessionAPI from "../../../apis/session";
import { dialogs, showConfirm } from "../../../utils/dialogs";
import { showError, showSuccess, showToast } from "../../../utils/notification";

export const useSessionActions = (
    sessions: SessionListData[],
    fetchSessions: () => Promise<void>,
    selectedSessions: number[] = []
) => {
    const handleDeleteSession = async (id: number) => {
        const session = sessions.find(s => s.id === id);
        const confirmed = await showConfirm({
            title: 'Delete Session',
            message: `Are you sure you want to delete "${session?.name}"? This will also delete all associated bukids and assignments.`,
            icon: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting session...', 'info');
            const response = await sessionAPI.delete(id);

            if (response.status) {
                showSuccess('Session deleted successfully');
                fetchSessions();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to delete session');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedSessions.length === 0) return;

        const confirmed = await showConfirm({
            title: 'Bulk Delete Confirmation',
            message: `Are you sure you want to delete ${selectedSessions.length} selected session(s)? This action cannot be undone.`,
            icon: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Deleting selected sessions...', 'info');
            const results = await Promise.allSettled(
                selectedSessions.map(id => sessionAPI.delete(id, true))
            );

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
            const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

            if (failed.length === 0) {
                showSuccess(`Successfully deleted ${successful.length} session(s)`);
            } else {
                showError(`Deleted ${successful.length} session(s), failed to delete ${failed.length} session(s)`);
            }

            fetchSessions();
        } catch (err: any) {
            showError(err.message || 'Failed to delete sessions');
        }
    };

    const handleExportCSV = async () => {
        if(!await dialogs.confirm({title: "Export Data", message: "Are you sure do you want to export data as csv?"}))return;
        try {
            showToast('Exporting to CSV...', 'info');
            // Add export functionality when available
            showSuccess('Export functionality to be implemented');
        } catch (err: any) {
            showError(err.message || 'Failed to export CSV');
        }
    };

    const handleCloseSession = async (id: number) => {
        const session = sessions.find(s => s.id === id);
        const confirmed = await showConfirm({
            title: 'Close Session',
            message: `Are you sure you want to close "${session?.name}"? Closed sessions cannot be modified but can be viewed.`,
            icon: 'warning',
            confirmText: 'Close Session',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Closing session...', 'info');
            const response = await sessionAPI.close(id);

            if (response.status) {
                showSuccess('Session closed successfully');
                fetchSessions();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to close session');
        }
    };

    const handleArchiveSession = async (id: number) => {
        const session = sessions.find(s => s.id === id);
        const confirmed = await showConfirm({
            title: 'Archive Session',
            message: `Are you sure you want to archive "${session?.name}"? Archived sessions cannot be modified.`,
            icon: 'warning',
            confirmText: 'Archive',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Archiving session...', 'info');
            const response = await sessionAPI.archive(id);

            if (response.status) {
                showSuccess('Session archived successfully');
                fetchSessions();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to archive session');
        }
    };

    const handleDuplicateSession = async (id: number) => {
        const session = sessions.find(s => s.id === id);
        const confirmed = await showConfirm({
            title: 'Duplicate Session',
            message: `Are you sure you want to duplicate "${session?.name}"? This will create a new session with the same bukids and pitaks.`,
            icon: 'info',
            confirmText: 'Duplicate',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Duplicating session...', 'info');
            const newName = prompt(`Enter name for duplicated session (${session?.name} - Copy):`, `${session?.name} - Copy`);
            
            if (!newName || newName.trim() === '') {
                showError('Session name is required');
                return;
            }

            const response = await sessionAPI.duplicate(id, newName.trim());

            if (response.status) {
                showSuccess('Session duplicated successfully');
                fetchSessions();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to duplicate session');
        }
    };

    const handleActivateSession = async (id: number) => {
        const session = sessions.find(s => s.id === id);
        const confirmed = await showConfirm({
            title: 'Activate Session',
            message: `Are you sure you want to activate "${session?.name}"?`,
            icon: 'info',
            confirmText: 'Activate',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            showToast('Activating session...', 'info');
            const response = await sessionAPI.activate(id);

            if (response.status) {
                showSuccess('Session activated successfully');
                fetchSessions();
            } else {
                throw new Error(response.message);
            }
        } catch (err: any) {
            showError(err.message || 'Failed to activate session');
        }
    };

    return {
        handleDeleteSession,
        handleBulkDelete,
        handleExportCSV,
        handleCloseSession,
        handleArchiveSession,
        handleDuplicateSession,
        handleActivateSession
    };
};