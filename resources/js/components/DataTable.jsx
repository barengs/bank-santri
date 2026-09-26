import React, { useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from '@tanstack/react-table';
import { 
    ChevronLeft, 
    ChevronRight, 
    Search, 
    ChevronUp, 
    ChevronDown, 
    MoreHorizontal,
    Loader2,
    Inbox
} from 'lucide-react';

const DataTable = ({ 
    columns, 
    data = [], 
    isLoading = false,
    onSearchChange,
    placeholder = "Cari data...",
    meta = null, // Backend pagination meta
    onPageChange,
    onRowClick,
    hideSearch = false,
    perPage = null,
    onPerPageChange = null,
    pageSizeOptions = [10, 20, 50, 100],
}) => {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const isInternalPagination = !meta;

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter: isInternalPagination ? globalFilter : '',
            ...(meta ? {
                pagination: {
                    pageIndex: (meta.current_page || 1) - 1,
                    pageSize: meta.per_page || perPage || (data.length > 0 ? data.length : 10),
                }
            } : {})
        },
        manualPagination: Boolean(meta),
        manualFiltering: Boolean(meta),
        pageCount: meta ? (meta.last_page || 1) : undefined,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: isInternalPagination ? getFilteredRowModel() : undefined,
    });

    return (
        <div className="space-y-3">
            {/* Table Search & Controls */}
            {!hideSearch && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input 
                            type="text"
                            value={globalFilter ?? ''}
                            onChange={(e) => {
                                setGlobalFilter(e.target.value);
                                onSearchChange?.(e.target.value);
                            }}
                            placeholder={placeholder}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-xs text-gray-700 placeholder-gray-400"
                        />
                    </div>
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-none">
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-gray-200">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th 
                                            key={header.id}
                                            className="px-3.5 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-gray-900 transition-colors"
                                            onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {header.column.getCanSort() && (
                                                    <div className="flex flex-col text-gray-400">
                                                        {header.column.getIsSorted() === 'asc' ? (
                                                            <ChevronUp className="w-3 h-3 text-blue-600" />
                                                        ) : header.column.getIsSorted() === 'desc' ? (
                                                            <ChevronDown className="w-3 h-3 text-blue-600" />
                                                        ) : (
                                                            <MoreHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                            <p className="text-xs font-medium text-gray-500">Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map(row => (
                                    <tr 
                                        key={row.id}
                                        className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-slate-50/70'}`}
                                        onClick={() => onRowClick?.(row.original)}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-3.5 py-2 text-xs text-gray-700">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Inbox className="w-8 h-8 text-gray-300" />
                                            <p className="text-xs font-medium">Tidak ada data ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-3.5 py-2 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="text-xs text-gray-500">
                            Menampilkan {isInternalPagination 
                                ? `${data.length > 0 ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 : 0} - ${Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} dari ${data.length}`
                                : `${meta?.from || 0} - ${meta?.to || 0} dari ${meta?.total || 0}`
                            } entri
                        </div>

                        {onPerPageChange && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <span>Tampilkan:</span>
                                <select 
                                    value={perPage || meta?.per_page || 10}
                                    onChange={(e) => onPerPageChange(Number(e.target.value))}
                                    className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    {pageSizeOptions.map((size) => (
                                        <option key={size} value={size}>{size} / hal</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => isInternalPagination ? table.previousPage() : onPageChange?.(meta.current_page - 1)}
                            disabled={isInternalPagination ? !table.getCanPreviousPage() : (meta?.current_page || 1) <= 1}
                            className="p-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1 mx-1.5 text-xs">
                             <span className="font-semibold text-blue-600 px-2 py-0.5 bg-blue-50 rounded border border-blue-200">
                                {isInternalPagination ? table.getState().pagination.pageIndex + 1 : meta?.current_page || 1}
                             </span>
                             <span className="text-gray-400">/</span>
                             <span className="text-gray-600">
                                {isInternalPagination ? table.getPageCount() : meta?.last_page || 1}
                             </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => isInternalPagination ? table.nextPage() : onPageChange?.(meta.current_page + 1)}
                            disabled={isInternalPagination ? !table.getCanNextPage() : (meta?.current_page || 1) >= (meta?.last_page || 1)}
                            className="p-1 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataTable;
