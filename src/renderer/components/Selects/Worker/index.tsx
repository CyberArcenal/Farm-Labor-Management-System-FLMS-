// components/WorkerSelect.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Loader, User } from 'lucide-react';
import type { WorkerData } from '../../../apis/worker';
import workerAPI from '../../../apis/worker';

interface WorkerSelectProps {
    value: number | null;
    onChange: (workerId: number | null) => void;
    disabled?: boolean;
    placeholder?: string;
    inModal?: boolean; // New prop for modal context
}

const WorkerSelect: React.FC<WorkerSelectProps> = ({
    value,
    onChange,
    disabled = false,
    placeholder = 'Select a worker',
    inModal = false
}) => {
    const [workers, setWorkers] = useState<WorkerData[]>([]);
    const [filteredWorkers, setFilteredWorkers] = useState<WorkerData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchWorkers = async () => {
            try {
                setLoading(true);
                const response = await workerAPI.getAllWorkers({ limit: 1000 });

                if (response.status && response.data?.workers) {
                    const filtered = response.data.workers.filter(worker =>
                        worker.status === 'active' || worker.status === 'on-leave'
                    );
                    setWorkers(filtered);
                    setFilteredWorkers(filtered);
                }
            } catch (err) {
                console.error('Error fetching workers:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredWorkers(workers);
        } else {
            const filtered = workers.filter(worker =>
                worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (worker.contact && worker.contact.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredWorkers(filtered);
        }
    }, [searchTerm, workers]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSelect = (workerId: number) => {
        onChange(workerId);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = () => {
        onChange(null);
    };

    const selectedWorker = workers.find(w => w.id === value);

    // Adjust z-index for modal context
    const dropdownZIndex = inModal ? 'z-[10000]' : 'z-50';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full p-3 rounded-lg text-left flex justify-between items-center text-sm transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-300'
                    }`}
                style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    color: '#1f2937',
                    minHeight: '44px'
                }}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedWorker ? (
                        <>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center">
                                    <User className="w-3 h-3" style={{ color: '#10b981' }} />
                                </div>
                                <span className="truncate font-medium">{selectedWorker.name}</span>
                            </div>
                        </>
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {selectedWorker && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                            style={{ color: '#dc2626' }}
                            title="Clear selection"
                        >
                            ×
                        </button>
                    )}
                    <ChevronDown
                        className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        style={{ color: '#6b7280' }}
                    />
                </div>
            </button>

            {isOpen && (
                <div
                    className={`absolute ${dropdownZIndex} w-full mt-1 rounded-lg shadow-xl`}
                    style={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        maxHeight: '320px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    <div className="p-3 border-b" style={{ borderColor: '#f3f4f6' }}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                                style={{ color: '#9ca3af' }} />
                            <input
                                type="text"
                                placeholder="Search workers by name or contact..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    color: '#1f2937'
                                }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {loading && (
                        <div className="p-4 text-center">
                            <Loader className="w-5 h-5 animate-spin mx-auto" style={{ color: '#10b981' }} />
                            <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
                                Loading workers...
                            </p>
                        </div>
                    )}

                    {!loading && (
                        <div className="max-h-64 overflow-y-auto thin-scrollbar">
                            {filteredWorkers.length === 0 ? (
                                <div className="p-6 text-center">
                                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>
                                        {searchTerm ? 'No workers found' : 'No workers available'}
                                    </p>
                                    <p className="text-xs" style={{ color: '#6b7280' }}>
                                        {searchTerm ? 'Try a different search term' : 'Add workers in the Workers section'}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {filteredWorkers.map((worker) => (
                                        <button
                                            key={worker.id}
                                            type="button"
                                            onClick={() => handleSelect(worker.id)}
                                            className={`w-full p-3 text-left transition-colors flex items-center gap-3 hover:bg-green-50 ${worker.id === value ? 'bg-green-50' : ''
                                                }`}
                                            style={{
                                                color: '#1f2937'
                                            }}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${worker.id === value
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-gray-300'
                                                }`}>
                                                {worker.id === value && (
                                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                    <User className="w-4 h-4" style={{ color: '#059669' }} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="font-medium text-sm">{worker.name}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                                            style={{
                                                                backgroundColor: worker.status === 'active' ? '#d1fae5' : '#fef3c7',
                                                                color: worker.status === 'active' ? '#065f46' : '#92400e'
                                                            }}
                                                        >
                                                            {worker.status}
                                                        </span>
                                                        {worker.contact && (
                                                            <span className="text-xs text-gray-500">
                                                                {worker.contact}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkerSelect;