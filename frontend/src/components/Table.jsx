import { useState } from 'react';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
export default function Table({
    columns,
    data,
    loading = false,
    emptyMessage = 'No data found',
    emptyAction,
    onRowClick,
    className = '',
}) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };
    const sortedData = [...(data || [])].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const comparison = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    if (loading) {
        return (
            <div className={`bg-white rounded-2xl border border-surface-200 overflow-hidden ${className}`}>
                <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} variant="rect" height={48} />
                    ))}
                </div>
            </div>
        );
    }
    if (!data || data.length === 0) {
        return (
            <div className={`bg-white rounded-2xl border border-surface-200 p-8 ${className}`}>
                <EmptyState message={emptyMessage} action={emptyAction} />
            </div>
        );
    }
    return (
        <div className={`bg-white rounded-2xl border border-surface-200 overflow-hidden ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-surface-50 border-b border-surface-200">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left text-xs font-bold text-surface-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:text-surface-700' : ''} ${col.className || ''}`}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        {col.sortable && sortConfig.key === col.key && (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d={sortConfig.direction === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                                            </svg>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                        {sortedData.map((row, idx) => (
                            <tr
                                key={row.id || idx}
                                className={`transition-colors hover:bg-surface-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className={`px-4 py-3.5 text-sm text-surface-700 ${col.cellClassName || ''}`}>
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
