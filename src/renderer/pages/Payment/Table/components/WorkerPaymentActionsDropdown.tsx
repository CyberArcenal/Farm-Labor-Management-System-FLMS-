// components/Payment/components/WorkerPaymentActionsDropdown.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  Eye,
  CheckCircle,
  Wallet,
  Download,
  FileText,
  MoreVertical,
  CreditCard,
  BarChart3,
  Percent,
  User,
  TrendingUp,
} from "lucide-react";
import type { WorkerPaymentSummary } from "../hooks/useWorkerPaymentData";

interface WorkerPaymentActionsDropdownProps {
  summary: WorkerPaymentSummary;
  onViewWorkerDetails: (workerId: number) => void;
  onProcessAllPayments: (workerId: number) => void;
  onPayWorkerDebt: (workerId: number) => void;
  onExportWorkerReport: (workerId: number) => void;
  onGenerateWorkerSlips: (workerId: number) => void;
}

const WorkerPaymentActionsDropdown: React.FC<WorkerPaymentActionsDropdownProps> = ({
  summary,
  onViewWorkerDetails,
  onProcessAllPayments,
  onPayWorkerDebt,
  onExportWorkerReport,
  onGenerateWorkerSlips,
}) => {
   const [isOpen, setIsOpen] = useState(false);
   const dropdownRef = useRef<HTMLDivElement>(null);
   const buttonRef = useRef<HTMLButtonElement>(null);
 
   const handleToggle = (e: React.MouseEvent) => {
     e.stopPropagation();
     setIsOpen(!isOpen);
   };
 
   const handleAction = (e: React.MouseEvent, action: () => void) => {
     e.stopPropagation();
     action();
     setIsOpen(false);
   };
 
   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       if (
         dropdownRef.current &&
         !dropdownRef.current.contains(event.target as Node) &&
         buttonRef.current &&
         !buttonRef.current.contains(event.target as Node)
       ) {
         setIsOpen(false);
       }
     };
     document.addEventListener("mousedown", handleClickOutside);
     return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);
 
   const getDropdownPosition = () => {
     if (!buttonRef.current) return {};
     const rect = buttonRef.current.getBoundingClientRect();
     const dropdownHeight = 400;
     const windowHeight = window.innerHeight;
 
     if (rect.bottom + dropdownHeight > windowHeight) {
       return {
         bottom: `${windowHeight - rect.top + 5}px`,
         right: `${window.innerWidth - rect.right}px`,
       };
     }
     return {
       top: `${rect.bottom + 5}px`,
       right: `${window.innerWidth - rect.right}px`,
     };
   };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle(e);
        }}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors relative cursor-pointer"
        title="More Actions"
        style={{ background: "var(--card-secondary-bg)" }}
      >
        <MoreVertical
          className="w-4 h-4"
          style={{ color: "var(--text-secondary)" }}
        />
      </button>

      {isOpen && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-64 z-50 max-h-80 overflow-y-auto"
          style={getDropdownPosition()}
        >
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Worker Actions
            </div>

            <button
              onClick={(e) =>
                handleAction(e, () => onViewWorkerDetails(summary.worker.id))
              }
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Eye className="w-4 h-4 text-blue-500" />
              <span>View Worker Details</span>
            </button>

            {summary.pendingPayments > 0 && (
              <button
                onClick={(e) =>
                  handleAction(e, () => onProcessAllPayments(summary.worker.id))
                }
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Process All Payments ({summary.pendingPayments})</span>
              </button>
            )}

            {summary.totalDebt > 0 && (
              <button
                onClick={(e) =>
                  handleAction(e, () => onPayWorkerDebt(summary.worker.id))
                }
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Wallet className="w-4 h-4 text-red-600" />
                <span>Pay Worker Debt</span>
              </button>
            )}

            <div className="border-t border-gray-100 my-1"></div>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Reports & Export
            </div>

            <button
              onClick={(e) =>
                handleAction(e, () => onExportWorkerReport(summary.worker.id))
              }
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 text-purple-600" />
              <span>Export Worker Report</span>
            </button>

            <button
              onClick={(e) =>
                handleAction(e, () => onGenerateWorkerSlips(summary.worker.id))
              }
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FileText className="w-4 h-4 text-cyan-600" />
              <span>Generate Payment Slips</span>
            </button>

            <div className="border-t border-gray-100 my-1"></div>
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Financial Management
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log(`Adjust deductions for worker ${summary.worker.id}`);
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Percent className="w-4 h-4 text-orange-600" />
              <span>Adjust Deductions</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log(`View debt history for worker ${summary.worker.id}`);
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>View Debt History</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerPaymentActionsDropdown;