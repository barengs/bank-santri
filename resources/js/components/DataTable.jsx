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
    placeholder = "Pencarian data...",
    meta = null, // Backend pagination meta
    onPageChange,
    onRowClick
}) => {
    const [sorting, setSorting] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    const isInternalPagination = !meta;

    return (
        <div className="space-y-4">
            {/* Table Search & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative group flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        type="text"
                        value={globalFilter ?? ''}
                        onChange={(e) => {
                            setGlobalFilter(e.target.value);
                            onSearchChange?.(e.target.value);
                        }}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm font-medium"
                    />
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Additional Filter Buttons could go here */}
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto no-scrollbar max-h-[60vh]">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm border-b border-gray-100">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th 
                                            key={header.id}
                                            className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors"
                                            onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                                        >
                                            <div className="flex items-center gap-2">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {header.column.getCanSort() && (
                                                    <div className="flex flex-col text-gray-300">
                                                        {header.column.getIsSorted() === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : header.column.getIsSorted() === 'desc' ? <ChevronDown className="w-3 h-3 text-indigo-600" /> : <MoreHorizontal className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                                                    </div>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                            <p className="text-sm font-bold text-gray-400">Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map(row => (
                                    <tr 
                                        key={row.id}
                                        className={`transition-colors group ${onRowClick ? 'cursor-pointer hover:bg-indigo-50' : 'hover:bg-gray-50/50'}`}
                                        onClick={() => onRowClick?.(row.original)}
                                    >
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-2.5 text-sm font-medium text-gray-700">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-300">
                                            <Inbox className="w-12 h-12" />
                                            <p className="text-sm font-bold">Tidak ada data ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Menampilkan {isInternalPagination 
                            ? `${table.getPaginationRowModel?.().rows.length || 0} dari ${data.length}`
                            : `${meta?.from || 0} - ${meta?.to || 0} dari ${meta?.total || 0}`
                        } entri
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => isInternalPagination ? table.previousPage() : onPageChange?.(meta.current_page - 1)}
                            disabled={isInternalPagination ? !table.getCanPreviousPage() : meta?.current_page === 1}
                            className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-500 transition-all font-bold"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-1 mx-2">
                             <span className="text-sm font-black text-indigo-600 px-3 py-1 bg-indigo-50 rounded-md">
                                {isInternalPagination ? table.getState().pagination.pageIndex + 1 : meta?.current_page || 1}
                             </span>
                             <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">dari</span>
                             <span className="text-sm font-bold text-gray-400">
                                {isInternalPagination ? table.getPageCount() : meta?.last_page || 1}
                             </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => isInternalPagination ? table.nextPage() : onPageChange?.(meta.current_page + 1)}
                            disabled={isInternalPagination ? !table.getCanNextPage() : meta?.current_page === meta?.last_page}
                            className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-500 transition-all font-bold"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataTable;
