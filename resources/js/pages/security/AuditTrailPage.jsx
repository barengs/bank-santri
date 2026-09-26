import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import { useGetActivityLogsQuery } from '../../store/securityApi';
import { History, User, Activity as ActivityIcon } from 'lucide-react';

const AuditTrailPage = () => {
    const [page, setPage] = useState(1);
    const { data: logsRes, isLoading, isFetching } = useGetActivityLogsQuery({ page });

    const columns = [
        {
            header: 'WAKTU',
            accessorKey: 'created_at',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-800">
                        {new Date(row.original.created_at).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {new Date(row.original.created_at).toLocaleDateString('id-ID', { weekday: 'long' })}
                    </span>
                </div>
            )
        },
        {
            header: 'ADMIN / PELAKU',
            accessorKey: 'causer.name',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                        {row.original.causer?.name?.[0] || 'S'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-800">{row.original.causer?.name || 'System'}</span>
                        <span className="text-[10px] text-gray-400">{row.original.causer?.email || '-'}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'MODUL',
            accessorKey: 'log_name',
            cell: ({ row }) => (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-semibold uppercase border border-gray-200">
                    {row.original.log_name.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'AKTIVITAS',
            accessorKey: 'description',
            cell: ({ row }) => {
                const colors = {
                    created: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                    updated: 'text-amber-700 bg-amber-50 border-amber-200',
                    deleted: 'text-rose-700 bg-rose-50 border-rose-200'
                };
                return (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${colors[row.original.description] || 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                        {row.original.description}
                    </span>
                );
            }
        },
        {
            header: 'DETAIL PERUBAHAN',
            id: 'properties',
            cell: ({ row }) => {
                const props = row.original.properties;
                if (!props || (!props.attributes && !props.old)) return <span className="text-xs text-gray-300">-</span>;
                
                return (
                    <div className="max-w-xs overflow-hidden text-[11px]">
                        {props.attributes && (
                            <div className="text-gray-700 truncate">
                                <strong>New:</strong> {JSON.stringify(props.attributes)}
                            </div>
                        )}
                        {props.old && (
                            <div className="text-gray-400 truncate">
                                <strong>Old:</strong> {JSON.stringify(props.old)}
                            </div>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4 shadow-none">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                    <h2 className="text-base font-bold text-gray-800">Audit Trail & Log Aktivitas</h2>
                    <p className="text-xs text-gray-500">Rekam jejak setiap aksi, perubahan data, dan transaksi di dalam sistem</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-semibold text-gray-700">
                        Total Log: {logsRes?.data?.total || 0}
                    </span>
                </div>
            </div>

            <DataTable 
                columns={columns}
                data={logsRes?.data?.data || []}
                isLoading={isLoading || isFetching}
                meta={logsRes?.data}
                onPageChange={setPage}
                placeholder="Cari log audit..."
            />
        </div>
    );
};

export default AuditTrailPage;
