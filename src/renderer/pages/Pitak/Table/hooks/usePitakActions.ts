import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { dialogs, showAlert, showConfirm } from "../../../../utils/dialogs";
import {
  showError,
  showSuccess,
  showToast,
} from "../../../../utils/notification";
import pitakAPI, { type PitakWithDetails } from "../../../../apis/pitak";
import assignmentAPI from "../../../../apis/assignment";
import { formatNumber } from "../../../../utils/formatters";

export interface AssignmentDialogData {
  pitakId: number;
  workers: any[]; // Changed from workerId to workers array
  assignmentDate: string;
  notes?: string;
}

export interface BulkOperationData {
  workerIds: number[];
  assignmentDate: string;
  luwangCount: number;
  notes?: string;
}

export interface LuWangUpdateData {
  pitakId: number;
  totalLuwang: number;
  adjustmentType: "add" | "subtract" | "set";
  notes?: string;
}

export const usePitakActions = (
  pitaks: PitakWithDetails[],
  fetchPitaks: () => Promise<void>,
) => {
  const navigate = useNavigate();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectPitakId, setSelectPitakId] = useState<number | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showLuWangUpdateDialog, setShowLuWangUpdateDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const [showSingleAssignmentDialog, setShowSingleAssignmentDialog] =
    useState(false);
  const [showMultipleAssignmentsDialog, setShowMultipleAssignmentsDialog] =
    useState(false);
  const [showAssignmentHistoryDialog, setShowAssignmentHistoryDialog] =
    useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [selectedPitakId, setSelectedPitakId] = useState<number>(0);
  // View Dialog States
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedViewPitakId, setSelectedViewPitakId] = useState<number | null>(
    null,
  );

  const [assignmentData, setAssignmentData] = useState<AssignmentDialogData>({
    pitakId: 0,
    workers: [], // Changed from workerId: null
    assignmentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [bulkOperationData, setBulkOperationData] = useState<BulkOperationData>(
    {
      workerIds: [],
      assignmentDate: new Date().toISOString().split("T")[0],
      luwangCount: 0,
      notes: "",
    },
  );

  const [luwangUpdateData, setLuWangUpdateData] = useState<LuWangUpdateData>({
    pitakId: 0,
    totalLuwang: 0,
    adjustmentType: "set",
    notes: "",
  });

  // Handler functions:
  const openCreateDialog = () => {
    setDialogMode("add");
    setSelectPitakId(null);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (id: number) => {
    setDialogMode("edit");
    setSelectPitakId(id);
    setIsFormDialogOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormDialogOpen(false);
    setSelectPitakId(null);
  };

  const handleCreatePitak = () => {
    openCreateDialog();
  };

  const handleViewPitak = (id: number) => {
    setSelectedViewPitakId(id);
    setShowViewDialog(true);
  };

  const handleEditPitak = (id: number) => {
    // navigate(`/farms/pitak/form/${id}`);
    openEditDialog(id);
  };

  const handleViewAssignmentDialog = (assignmentId: number) => {
    setSelectedAssignmentId(assignmentId);
    setShowSingleAssignmentDialog(true);
  };

  const handleViewPitakAssignmentsDialog = (pitakId: number) => {
    setSelectedPitakId(pitakId);
    setShowMultipleAssignmentsDialog(true);
  };

  const handleViewAssignmentHistoryDialog = (assignmentId: number) => {
    console.log("Viewing history for assignment ID:", assignmentId);
    setSelectedAssignmentId(assignmentId);
    setShowAssignmentHistoryDialog(true);
  };

  const handleDeletePitak = async (id: number, location?: string) => {
    const confirmed = await showConfirm({
      title: "Delete Pitak",
      message: `Are you sure you want to delete this pitak ${location ? `at ${location}` : ""}?`,
      icon: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      showToast("Deleting pitak...", "info");
      const response = await pitakAPI.deletePitak(id);

      if (response.status) {
        showSuccess(`Pitak deleted successfully`);
        fetchPitaks();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to delete pitak");
    }
  };

  const handleAssignWorker = (pitakId: number, pitakData?: any) => {
    setAssignmentData({
      pitakId,
      workers: [], // Start with empty workers array
      assignmentDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowAssignmentDialog(true);
  };

  const handleSubmitAssignment = async () => {
    if (!assignmentData.workers || assignmentData.workers.length === 0) {
      showError("Please select at least one worker");
      return;
    }

    try {
      showToast(
        `Creating assignments for ${assignmentData.workers.length} workers...`,
        "info",
      );

      // ✅ Use workerIds (array) to match backend
      const result = await assignmentAPI.createAssignment({
        workerIds: assignmentData.workers.map((w) => w.id), // or just the IDs if workers is array of numbers
        pitakId: assignmentData.pitakId,
        luwangCount: 0, // Set to 0 since we removed the input
        assignmentDate: assignmentData.assignmentDate,
        notes: assignmentData.notes,
      });

      if (result.status) {
        const count = result.data?.assignments?.length || 0;
        showSuccess(`Successfully created ${count} assignment(s)`);
      } else {
        showError(result.message || "Failed to create assignments");
      }

      setShowAssignmentDialog(false);
      fetchPitaks();
    } catch (err: any) {
      showError(err.message || "Failed to create assignments");
    }
  };

  const handleUpdateLuWang = (pitakId: number, totalLuwang: number) => {
    setLuWangUpdateData({
      pitakId,
      totalLuwang,
      adjustmentType: "set",
      notes: "",
    });
    setShowLuWangUpdateDialog(true);
  };

  const handleSubmitLuWangUpdate = async () => {
    try {
      showToast("Updating luwang capacity...", "info");

      const response = await pitakAPI.updatePitakLuWang(
        luwangUpdateData.pitakId,
        luwangUpdateData.totalLuwang,
        luwangUpdateData.adjustmentType,
        luwangUpdateData.notes,
      );

      if (response.status) {
        showSuccess("LuWang capacity updated successfully");
        setShowLuWangUpdateDialog(false);
        fetchPitaks();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to update luwang capacity");
    }
  };

  const handleBulkAssign = (selectedPitaks: number[]) => {
    if (selectedPitaks.length === 0) {
      showError("Please select at least one pitak");
      return;
    }

    setBulkOperationData({
      workerIds: [],
      assignmentDate: new Date().toISOString().split("T")[0],
      luwangCount: 0,
      notes: "",
    });
    setShowBulkAssignDialog(true);
  };

  const handleSubmitBulkAssign = async (
    selectedPitaks: number[],
    data: BulkOperationData,
  ) => {
    if (!data.workerIds || data.workerIds.length === 0) {
      showError("Please select at least one worker");
      return;
    }

    if (data.luwangCount <= 0) {
      showError("Please enter a valid luwang count");
      return;
    }

    try {
      showToast(
        `Creating assignments for ${selectedPitaks.length} pitaks...`,
        "info",
      );

      const assignments = selectedPitaks.map((pitakId) => ({
        workerIds: data.workerIds || [],
        pitakId,
        luwangCount: data.luwangCount,
        assignmentDate: data.assignmentDate,
        notes: data.notes,
      }));

      const response = await assignmentAPI.bulkCreateAssignments(assignments);

      if (response.status) {
        showSuccess(
          `Created ${response.data.created?.length || 0} assignments successfully`,
        );
        if (response.data.skipped?.length > 0) {
          showError(
            `Skipped ${response.data.skipped.length} assignments due to errors`,
          );
        }
        setShowBulkAssignDialog(false);
        fetchPitaks();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to create bulk assignments");
    }
  };

  // Update this function in usePitakActions.ts
  const handleBulkStatusChange = async (
    status: "active" | "inactive" | "harvested",
    selectedPitaks: number[],
  ) => {
    if (selectedPitaks.length === 0) {
      showError("Please select at least one pitak");
      return;
    }

    const action =
      status === "active"
        ? "activate"
        : status === "inactive"
          ? "deactivate"
          : "mark as harvested";

    const confirmed = await showConfirm({
      title: `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Are you sure you want to ${action} ${selectedPitaks.length} selected pitak(s)?`,
      icon: "warning",
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      showToast(
        `${action.charAt(0).toUpperCase() + action.slice(1)}ing ${selectedPitaks.length} pitaks...`,
        "info",
      );

      // Bulk update status
      const results = await Promise.allSettled(
        selectedPitaks.map((id) => pitakAPI.updatePitakStatus(id, status)),
      );

      const successful = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length === 0) {
        showSuccess(`Successfully ${action}ed ${successful.length} pitak(s)`);
      } else {
        showError(
          `${action.charAt(0).toUpperCase() + action.slice(1)}ed ${successful.length} pitak(s), failed to ${action} ${failed.length} pitak(s)`,
        );
      }

      fetchPitaks();
    } catch (err: any) {
      showError(err.message || `Failed to ${action} pitaks`);
    }
  };

  const handleBulkDelete = async (selectedPitaks: number[]) => {
    if (selectedPitaks.length === 0) {
      showError("Please select at least one pitak to delete");
      return;
    }

    const selectedPitakDetails = pitaks
      .filter((p) => selectedPitaks.includes(p.id))
      .map((p) => p.location || `Pitak #${p.id}`);

    const confirmed = await showConfirm({
      title: "Bulk Delete Confirmation",
      message: `Are you sure you want to delete ${selectedPitaks.length} selected pitak(s)?\n\nSelected: ${selectedPitakDetails.join(", ")}`,
      icon: "danger",
      confirmText: "Delete All",
      cancelText: "Cancel",
      persistent: true,
    });

    if (!confirmed) return;

    try {
      showToast(`Deleting ${selectedPitaks.length} pitaks...`, "info");

      // Delete pitaks
      const results = await Promise.allSettled(
        selectedPitaks.map((id) => pitakAPI.deletePitak(id, true)),
      );

      const successful = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length === 0) {
        showSuccess(`Successfully deleted ${successful.length} pitak(s)`);
      } else {
        showError(
          `Deleted ${successful.length} pitak(s), failed to delete ${failed.length} pitak(s)`,
        );
      }

      fetchPitaks();
    } catch (err: any) {
      showError(err.message || "Failed to delete pitaks");
    }
  };

  const handleExport = async (format: "csv" | "pdf" = "csv") => {
    try {
      showToast(`Exporting pitak data...`, "info");

      if (format === "csv") {
        const response = await pitakAPI.exportPitaksToCSV({});

        if (response.status) {
          const link = document.createElement("a");
          const blob = new Blob([response.data.csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.download = response.data.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          showSuccess(`Exported ${response.data.count} records`);
        } else {
          throw new Error(response.message);
        }
      } else {
        showError("PDF export not yet implemented");
      }
    } catch (err: any) {
      showError(err.message || "Failed to export data");
    }
  };

  const handleViewAssignments = async (pitakId: number) => {
    navigate(`/assignments?pitakId=${pitakId}`);
  };

  const handleViewReport = async (pitakId: number) => {
    navigate(`/reports/pitak/${pitakId}`);
  };
  const handleViewAssignedWorkers = async (pitakId: number) => {
    try {
      showToast("Fetching assigned workers...", "info");

      // Fetch assignments for this pitak using the updated API
      const response = await assignmentAPI.getAssignmentsByPitak(pitakId);

      if (
        response.status &&
        response.data &&
        response.data.assignments &&
        response.data.assignments.length > 0
      ) {
        const { pitak, assignments, statistics } = response.data;

        // Build HTML message with proper formatting
        let message = `<strong>Assigned Workers for ${pitak.location} (ID: ${pitak.id})</strong><br><br>`;

        // Group assignments by worker
        const workersMap = new Map();
        assignments.forEach((assignment: any, index: number) => {
          if (assignment.worker && assignment.worker.id) {
            const workerId = assignment.worker.id;
            if (!workersMap.has(workerId)) {
              workersMap.set(workerId, {
                id: workerId,
                name: assignment.worker.name,
                contact: assignment.worker.contactNumber || "N/A",
                assignments: [],
              });
            }
            workersMap.get(workerId).assignments.push({
              id: assignment.id,
              luwangCount: parseFloat(assignment.luwangCount) || 0,
              assignmentDate: new Date(
                assignment.assignmentDate,
              ).toLocaleDateString(),
              status: assignment.status,
              notes: assignment.notes || "None",
            });
          }
        });

        const workers = Array.from(workersMap.values());

        // Add each worker's information
        workers.forEach((worker, index) => {
          const totalLuwang = worker.assignments.reduce(
            (sum: number, a: any) => sum + (a.luwangCount || 0),
            0,
          );
          const activeAssignments = worker.assignments.filter(
            (a: any) => a.status === "active",
          ).length;

          message += `<strong>${index + 1}. ${worker.name}</strong><br>`;
          message += `&nbsp;&nbsp;Contact: ${worker.contact}<br>`;
          message += `&nbsp;&nbsp;Total Luwang Assigned: ${totalLuwang}<br>`;
          message += `&nbsp;&nbsp;Active Assignments: ${activeAssignments}<br>`;
          message += `&nbsp;&nbsp;Total Assignments: ${worker.assignments.length}<br><br>`;
        });

        // Add statistics summary
        message += `<strong>Summary:</strong><br>`;
        message += `Total Workers: ${statistics.uniqueWorkers}<br>`;
        message += `Total Assignments: ${statistics.totalAssignments}<br>`;
        message += `Total Luwang: ${statistics.totalLuWang}<br>`;
        message += `Average Luwang per Assignment: ${statistics.averageLuWang}<br><br>`;

        message += `<strong>Assignments by Status:</strong><br>`;
        message += `&nbsp;&nbsp;Active: ${statistics.byStatus.active}<br>`;
        message += `&nbsp;&nbsp;Completed: ${statistics.byStatus.completed}<br>`;
        message += `&nbsp;&nbsp;Cancelled: ${statistics.byStatus.cancelled}<br>`;

        // Use showAlert directly
        await showAlert({
          title: "Assigned Workers",
          message: message,
          icon: "info",
          buttonText: "Close",
        });
      } else {
        // Use dialogs.info for simple text messages
        await dialogs.info(
          "No workers are currently assigned to this pitak.",
          "Assigned Workers",
        );
      }
    } catch (err: any) {
      showError(err.message || "Failed to fetch assigned workers");
    }
  };

  const handleMarkAsHarvested = async (id: number, location?: string) => {
    const confirmed = await showConfirm({
      title: "Mark as Harvested",
      message: `Are you sure you want to mark "${location || "this pitak"}" as harvested?`,
      icon: "warning",
      confirmText: "Mark as Harvested",
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      showToast("Marking pitak as harvested...", "info");
      const response = await pitakAPI.markPitakAsHarvested(id);

      if (response.status) {
        showSuccess("Pitak marked as harvested successfully");
        fetchPitaks();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || "Failed to mark pitak as harvested");
    }
  };

  const handleUpdatePitakStatus = async (
    id: number,
    currentStatus: string,
    location?: string,
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    const confirmed = await showConfirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Pitak`,
      message: `Are you sure you want to ${action} "${location || "this pitak"}"?`,
      icon: "warning",
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Cancel",
    });

    if (!confirmed) return;

    try {
      showToast(
        `${action.charAt(0).toUpperCase() + action.slice(1)}ing pitak...`,
        "info",
      );
      const response = await pitakAPI.updatePitakStatus(id, newStatus);

      if (response.status) {
        showSuccess(
          `Pitak ${action === "activate" ? "activated" : "deactivated"} successfully`,
        );
        fetchPitaks();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError(err.message || `Failed to ${action} pitak`);
    }
  };

  return {
    showAssignmentDialog,
    setShowAssignmentDialog,
    showBulkAssignDialog,
    setShowBulkAssignDialog,
    showLuWangUpdateDialog,
    setShowLuWangUpdateDialog,
    showExportDialog,
    setShowExportDialog,
    assignmentData,
    setAssignmentData,
    bulkOperationData,
    setBulkOperationData,
    luwangUpdateData,
    setLuWangUpdateData,
    handleCreatePitak,
    handleViewPitak,
    handleEditPitak,
    handleDeletePitak,
    handleAssignWorker,
    handleSubmitAssignment,
    handleUpdateLuWang,
    handleSubmitLuWangUpdate,
    handleBulkAssign,
    handleSubmitBulkAssign,
    handleBulkStatusChange,
    handleBulkDelete,
    handleExport,
    handleViewAssignments,
    handleViewReport,
    handleViewAssignedWorkers,
    handleMarkAsHarvested,
    handleUpdatePitakStatus,

    handleViewAssignmentDialog,
    handleViewPitakAssignmentsDialog,
    handleViewAssignmentHistoryDialog,
    showSingleAssignmentDialog,
    setShowSingleAssignmentDialog,
    showMultipleAssignmentsDialog,
    setShowMultipleAssignmentsDialog,
    showAssignmentHistoryDialog,
    setShowAssignmentHistoryDialog,
    selectedAssignmentId,
    setSelectedAssignmentId,
    selectedPitakId,
    setSelectedPitakId,

    isFormDialogOpen,
    openCreateDialog,
    openEditDialog,
    closeFormDialog,
    selectPitakId,
    dialogMode,
    setIsFormDialogOpen,
    setSelectPitakId,
    setDialogMode,

    showViewDialog,
    setShowViewDialog,
    selectedViewPitakId,
    setSelectedViewPitakId,
  };
};
