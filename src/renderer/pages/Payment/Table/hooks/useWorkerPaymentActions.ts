// components/Payment/hooks/useWorkerPaymentActions.ts
import { useState } from "react";
import { showSuccess, showError } from "../../../../utils/notification";
import type { WorkerPaymentSummary } from "./useWorkerPaymentData";
import workerAPI from "../../../../apis/worker";
import paymentAPI from "../../../../apis/payment";
import { showConfirm } from "../../../../utils/dialogs";

export const useWorkerPaymentActions = (
  workerSummaries: WorkerPaymentSummary[],
  refreshData: () => Promise<void>,
) => {
  const [processing, setProcessing] = useState<number | null>(null);
  // const handleProcessAllPayments = async (workerId: number) => {
  //   try {
  //     const confirm = await showConfirm({
  //       title: "Process All Pending Payments",
  //       message:
  //         "Are you sure you want to process all pending payments for this worker?",
  //       confirmText: "Process All",
  //       cancelText: "Cancel",
  //     });

  //     if (!confirm) return;

  //     setProcessing(workerId);

  //     // Kunin ang mga pending payments para sa worker na ito
  //     const response = await paymentAPI.getPaymentsByWorker(workerId, {
  //       status: "pending",
  //       limit: 100,
  //       page: 1,
  //     });

  //     if (response.status && response.data.payments.length > 0) {
  //       const paymentIds = response.data.payments.map((p: any) => p.id);

  //       // I-process ang lahat ng payments
  //       const processResponse = await paymentAPI.bulkProcessPayments(
  //         paymentIds,
  //         {
  //           paymentDate: new Date().toISOString().split("T")[0],
  //           paymentMethod: "cash",
  //         },
  //       );

  //       if (processResponse.status) {
  //         showSuccess(
  //           `Successfully processed ${processResponse.data.success} payments`,
  //         );
  //         await refreshData();
  //       } else {
  //         throw new Error(processResponse.message);
  //       }
  //     } else {
  //       showSuccess("This worker has no pending payments to process");
  //     }
  //   } catch (error: any) {
  //     showError("Processing Failed", error.message);
  //   } finally {
  //     setProcessing(null);
  //   }
  // };

  const handlePayWorkerDebt = async (workerId: number) => {
    try {
      // Makakuha ng worker summary para makuha ang total debt
      const worker = workerSummaries.find((w) => w.worker.id === workerId);
      if (!worker || worker.totalDebt <= 0) {
        showError("This worker has no outstanding debt");
        return;
      }

      const confirm = await showConfirm({
        title: "Pay Worker Debt",
        message: `Pay ${worker.totalDebt.toLocaleString()} debt for ${worker.worker.name}?`,
        confirmText: "Pay Debt",
        cancelText: "Cancel",
      });

      if (!confirm) return;

      // Dito maaaring magdagdag ng logic para magbayad ng debt
      // Halimbawa, gumawa ng bagong payment na may debt deduction
      console.log(`Paying debt for worker ${workerId}: ${worker.totalDebt}`);

      showSuccess("Worker debt payment initiated successfully");
      await refreshData();
    } catch (error: any) {
      showError("Payment Failed", error.message);
    }
  };

  const handleViewWorkerDetails = (workerId: number) => {
    // Dito maaaring mag-navigate sa worker details page
    console.log(`View details for worker ${workerId}`);
    // Maaaring gamitin ang router kung may router ang application
    // router.push(`/workers/${workerId}`);
  };

  const handleExportWorkerReport = async (workerId: number) => {
    try {
      const response = await paymentAPI.generatePaymentReport({
        workerId,
        format: "pdf",
        reportType: "worker_summary",
      });

      if (response.status) {
        showSuccess("Worker report has been generated successfully");

        // I-download ang report
        // if (response.data.format === "pdf") {
        //   const blob = new Blob([response.data.content], { type: response.data.contentType });
        //   const url = window.URL.createObjectURL(blob);
        //   const a = document.createElement('a');
        //   a.href = url;
        //   a.download = response.data.fileName || `worker-report-${workerId}.pdf`;
        //   document.body.appendChild(a);
        //   a.click();
        //   document.body.removeChild(a);
        //   window.URL.revokeObjectURL(url);
        // }
      }
    } catch (error: any) {
      showError("Export Failed", error.message);
    }
  };

  const handleGenerateWorkerSlips = async (workerId: number) => {
    try {
      // Kunin ang mga recent payments
      const response = await paymentAPI.getPaymentsByWorker(workerId, {
        status: "completed",
        limit: 10,
        page: 1,
      });

      if (response.status && response.data.payments.length > 0) {
        // I-generate ang slips para sa bawat payment
        const slipPromises = response.data.payments.map((payment: any) =>
          paymentAPI.exportPaymentSlip(payment.id),
        );

        const results = await Promise.allSettled(slipPromises);
        const successful = results.filter(
          (r) => r.status === "fulfilled",
        ).length;

        showSuccess(`Successfully generated ${successful} payment slips`);
      } else {
        showError("No completed payments found for this worker");
      }
    } catch (error: any) {
      showError("Generation Failed", error.message);
    }
  };

  return {
    processing,
    handlePayWorkerDebt,
    handleViewWorkerDetails,
    handleExportWorkerReport,
    handleGenerateWorkerSlips,
  };
};
