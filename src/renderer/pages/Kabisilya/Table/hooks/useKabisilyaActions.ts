// // components/Kabisilya/hooks/useKabisilyaActions.ts
// import { showError, showSuccess, showToast } from '../../../../utils/notification';
// import { dialogs, showConfirm } from '../../../../utils/dialogs';
// import kabisilyaAPI from '../../../../apis/kabisilya';
// import type { KabisilyaListData } from '../../../../apis/kabisilya';
// import { useNavigate } from 'react-router-dom';

// export const useKabisilyaActions = (
//     kabisilyas: KabisilyaListData[],
//     fetchKabisilyas: () => Promise<void>,
//     selectedKabisilyas: number[] = []
// ) => {
//     const navigate = useNavigate();

//     const handleDeleteKabisilya = async (id: number) => {
//         const kabisilya = kabisilyas.find(k => k.id === id);
//         const confirmed = await showConfirm({
//             title: 'Delete Kabisilya',
//             message: `Are you sure you want to delete "${kabisilya?.name}"? This action cannot be undone.`,
//             icon: 'danger',
//             confirmText: 'Delete',
//             cancelText: 'Cancel'
//         });

//         if (!confirmed) return;

//         try {
//             showToast('Deleting kabisilya...', 'info');
//             const response = await kabisilyaAPI.delete(id);

//             if (response.status) {
//                 showSuccess('Kabisilya deleted successfully');
//                 fetchKabisilyas();
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (err: any) {
//             showError(err.message || 'Failed to delete kabisilya');
//         }
//     };

//     const handleBulkDelete = async () => {
//         if (selectedKabisilyas.length === 0) return;

//         const confirmed = await showConfirm({
//             title: 'Bulk Delete Confirmation',
//             message: `Are you sure you want to delete ${selectedKabisilyas.length} selected kabisilya(s)? This action cannot be undone.`,
//             icon: 'danger',
//             confirmText: 'Delete All',
//             cancelText: 'Cancel'
//         });

//         if (!confirmed) return;

//         try {
//             showToast('Deleting selected kabisilyas...', 'info');
//             const results = await Promise.allSettled(
//                 selectedKabisilyas.map(id => kabisilyaAPI.delete(id))
//             );

//             const successful = results.filter(r => r.status === 'fulfilled' && r.value.status);
//             const failed = results.filter(r => r.status === 'rejected' || !r.value?.status);

//             if (failed.length === 0) {
//                 showSuccess(`Successfully deleted ${successful.length} kabisilya(s)`);
//             } else {
//                 showError(`Deleted ${successful.length} kabisilya(s), failed to delete ${failed.length} kabisilya(s)`);
//             }

//             fetchKabisilyas();
//         } catch (err: any) {
//             showError(err.message || 'Failed to delete kabisilyas');
//         }
//     };

//     const handleExportCSV = async () => {
//         if(!await dialogs.confirm({title: "Export Data", message: "Are you sure do you want to export data as csv?"}))return;
//         try {
//             showToast('Exporting to CSV...', 'info');
//             // Add export functionality when available
//             showSuccess('Export functionality to be implemented');
//         } catch (err: any) {
//             showError(err.message || 'Failed to export CSV');
//         }
//     };

//     const handleAssignWorkers = (id: number) => {
//         navigate(`/kabisilya/${id}/assign-workers`);
//     };

//     const handleAssignBukids = (id: number) => {
//         navigate(`/kabisilya/${id}/assign-bukids`);
//     };

//     return {
//         handleDeleteKabisilya,
//         handleBulkDelete,
//         handleExportCSV,
//         handleAssignWorkers,
//         handleAssignBukids
//     };
// };