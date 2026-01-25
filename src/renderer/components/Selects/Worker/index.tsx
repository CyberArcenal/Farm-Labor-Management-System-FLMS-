// components/WorkerSelect.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, Loader, User, Phone, Mail, MapPin, Building } from 'lucide-react';
import type { WorkerData } from '../../../apis/worker';
import workerAPI from '../../../apis/worker';

interface WorkerSelectProps {
    value: number | null;
    onChange: (workerId: number, workerName: string, workerData?: WorkerData) => void;
    disabled?: boolean;
    showDetails?: boolean;
    placeholder?: string;
    statusFilter?: 'active' | 'inactive' | 'on-leave' | 'terminated' | 'all';
    kabisilyaFilter?: number;
    includeInactive?: boolean;
}

const WorkerSelect: React.FC<WorkerSelectProps> = ({
    value,
    onChange,
    disabled = false,
    showDetails = true,
    placeholder = 'Select a worker',
    statusFilter = 'all',
    kabisilyaFilter,
    includeInactive = false
}) => {
    const [workers, setWorkers] = useState<WorkerData[]>([]);
    const [filteredWorkers, setFilteredWorkers] = useState<WorkerData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch workers based on filters
    const fetchWorkers = async () => {
        try {
            setLoading(true);
            setError(null);

            let response;

            if (kabisilyaFilter) {
                // Fetch workers by kabisilya
                response = await workerAPI.getWorkerByKabisilya(
                    kabisilyaFilter,
                    statusFilter !== 'all' ? statusFilter : undefined
                );
            } else if (statusFilter !== 'all') {
                // Fetch workers by status
                response = await workerAPI.getWorkerByStatus(statusFilter, 1, 1000);
            } else {
                // Fetch all workers
                response = await workerAPI.getAllWorkers({ limit: 1000 });
            }

            if (response.status && response.data?.workers) {
                let filtered = response.data.workers;

                // Filter out inactive workers if not included
                if (!includeInactive) {
                    filtered = filtered.filter(worker =>
                        worker.status === 'active' || worker.status === 'on-leave'
                    );
                }

                setWorkers(filtered);
                setFilteredWorkers(filtered);
            } else {
                throw new Error(response.message || 'Failed to fetch workers');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch workers');
            console.error('Error fetching workers:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch workers on component mount and when filters change
    useEffect(() => {
        fetchWorkers();
    }, [statusFilter, kabisilyaFilter, includeInactive]);

    // Filter workers based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredWorkers(workers);
        } else {
            const filtered = workers.filter(worker =>
                worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (worker.contact && worker.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (worker.email && worker.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (worker.address && worker.address.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredWorkers(filtered);
        }
    }, [searchTerm, workers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleWorkerSelect = (worker: WorkerData) => {
        onChange(worker.id, worker.name, worker);
        setIsOpen(false);
        setSearchTerm('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'status-badge-active';
            case 'inactive': return 'status-badge-inactive';
            case 'on-leave': return 'status-badge-on-leave';
            case 'terminated': return 'status-badge-terminated';
            default: return 'status-badge-inactive';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Active';
            case 'inactive': return 'Inactive';
            case 'on-leave': return 'On Leave';
            case 'terminated': return 'Terminated';
            default: return status;
        }
    };

    const formatBalance = (balance: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(balance);
    };

    const selectedWorker = workers.find(w => w.id === value);

    return (
        <div className="relative">
            {/* Selected Worker Display */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`compact-input w-full rounded-md text-left flex justify-between items-center transition-all duration-200 ${disabled
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'text-gray-900 dark:text-[#9ED9EC] hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: isOpen ? 'var(--accent-green)' : 'var(--border-color)',
                    borderWidth: '1px',
                    minHeight: '42px'
                }}
            >
                <div className="flex items-center truncate">
                    {selectedWorker ? (
                        <div className="flex items-center space-x-2">
                            <User className="icon-sm" style={{ color: 'var(--accent-green)' }} />
                            <span className="truncate text-sm" style={{ color: 'var(--sidebar-text)' }}>
                                {selectedWorker.name}
                                {showDetails && selectedWorker.kabisilya && (
                                    <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                                        • {selectedWorker.kabisilya.name}
                                    </span>
                                )}
                            </span>
                        </div>
                    ) : (
                        <span className="truncate text-sm" style={{ color: 'var(--sidebar-text)' }}>
                            {placeholder}
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`icon-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-secondary)' }}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className="absolute z-50 w-full mt-xs rounded-md shadow-lg max-h-80 overflow-hidden transition-all duration-200"
                    style={{
                        backgroundColor: 'var(--card-secondary-bg)',
                        borderColor: 'var(--border-color)',
                        borderWidth: '1px',
                        animation: 'slideDown 0.2s ease-out'
                    }}
                >
                    {/* Search Input */}
                    <div className="compact-card border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 icon-sm" style={{ color: 'var(--text-secondary)' }} />
                            <input
                                type="text"
                                placeholder="Search workers by name, contact, email..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="compact-input w-full pl-8 rounded-md focus:ring-1 focus:ring-blue-500"
                                style={{
                                    backgroundColor: 'var(--card-bg)',
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--sidebar-text)'
                                }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-3">
                            <Loader className="icon-sm animate-spin" style={{ color: 'var(--accent-green)' }} />
                            <span className="ml-xs text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Loading workers...
                            </span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="compact-card text-center">
                            <p className="text-sm mb-xs" style={{ color: 'var(--accent-rust)' }}>{error}</p>
                            <button
                                onClick={fetchWorkers}
                                className="text-sm compact-button"
                                style={{
                                    backgroundColor: 'var(--accent-green)',
                                    color: 'var(--sidebar-text)',
                                    padding: 'var(--size-xs) var(--size-sm)'
                                }}
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Workers List */}
                    {!loading && !error && (
                        <div className="max-h-60 overflow-y-auto kabisilya-scrollbar">
                            {filteredWorkers.length === 0 ? (
                                <div className="compact-card text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {workers.length === 0 ? 'No workers found' : 'No workers match your search'}
                                </div>
                            ) : (
                                filteredWorkers.map((worker) => (
                                    <button
                                        key={worker.id}
                                        type="button"
                                        onClick={() => handleWorkerSelect(worker)}
                                        className={`w-full compact-card text-left transition-all duration-200 hover:scale-[1.02] ${worker.id === value
                                                ? 'border-l-2 border-green-600'
                                                : ''
                                            }`}
                                        style={{
                                            backgroundColor: worker.id === value ? 'var(--card-hover-bg)' : 'transparent',
                                            borderBottom: '1px solid var(--border-light)'
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="icon-sm" style={{ color: 'var(--accent-green)' }} />
                                                    <div className="font-medium text-sm" style={{ color: 'var(--sidebar-text)' }}>
                                                        {worker.name}
                                                    </div>
                                                </div>

                                                {/* Contact Information */}
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-xs">
                                                    {worker.contact && (
                                                        <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                            <Phone className="icon-xs mr-1" />
                                                            {worker.contact}
                                                        </div>
                                                    )}

                                                    {worker.email && (
                                                        <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                            <Mail className="icon-xs mr-1" />
                                                            {worker.email}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Status and Kabisilya */}
                                                <div className="flex items-center gap-2 mt-xs">
                                                    <span className={`px-xs py-xs rounded-full text-xs font-medium ${getStatusColor(worker.status)}`}>
                                                        {getStatusText(worker.status)}
                                                    </span>

                                                    {worker.kabisilya && (
                                                        <div className="flex items-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                            <Building className="icon-xs mr-1" />
                                                            {worker.kabisilya.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Balance Information */}
                                            <div className="text-right ml-xs">
                                                <div className="text-xs font-semibold" style={{
                                                    color: worker.currentBalance > 0
                                                        ? 'var(--accent-rust)'
                                                        : worker.currentBalance < 0
                                                            ? 'var(--accent-green)'
                                                            : 'var(--text-secondary)'
                                                }}>
                                                    {formatBalance(worker.currentBalance)}
                                                </div>
                                                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                    Balance
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address preview */}
                                        {worker.address && showDetails && (
                                            <div className="mt-xs flex items-start text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                <MapPin className="icon-xs mr-1 mt-0.5 flex-shrink-0" />
                                                <span className="truncate">
                                                    {worker.address.length > 80 ? `${worker.address.substring(0, 80)}...` : worker.address}
                                                </span>
                                            </div>
                                        )}

                                        {/* Hire date and employment duration */}
                                        {worker.hireDate && showDetails && (
                                            <div className="mt-xs text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                Hired: {new Date(worker.hireDate).toLocaleDateString()}
                                                {(() => {
                                                    const hireDate = new Date(worker.hireDate);
                                                    const today = new Date();
                                                    const years = today.getFullYear() - hireDate.getFullYear();
                                                    const months = today.getMonth() - hireDate.getMonth();
                                                    const totalMonths = years * 12 + months;

                                                    if (totalMonths >= 12) {
                                                        return ` • ${Math.floor(totalMonths / 12)}y ${totalMonths % 12}m`;
                                                    }
                                                    return ` • ${totalMonths}m`;
                                                })()}
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default WorkerSelect;