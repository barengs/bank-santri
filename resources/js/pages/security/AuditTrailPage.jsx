import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import { useGetActivityLogsQuery } from '../../store/securityApi';
import { History, User, Box, Activity as ActivityIcon, Clock } from 'lucide-react';

const AuditTrailPage = () => {
    const [page, setPage] = useState(1);
    const { data: logsRes, isLoading, isFetching } = useGetActivityLogsQuery({ page });

    const columns = [
        {
            header: 'WAKTU',
            accessorKey: 'created_at',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">
                        {new Date(row.original.created_at).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] text-slate-400">
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
                    <div className="p-1.5 bg-slate-100 rounded-md">
                        <User size={14} className="text-slate-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{row.original.causer?.name || 'System'}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{row.original.causer?.email || '-'}</span>
                    </div>
                </div>
            )
        },
        {
            header: 'MODUL',
            accessorKey: 'log_name',
            cell: ({ row }) => (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200">
                    {row.original.log_name.replace('_', ' ')}
                </span>
            )
        },
        {
            header: 'AKTIVITAS',
            accessorKey: 'description',
            cell: ({ row }) => {
                const colors = {
                    created: 'text-emerald-600',
                    updated: 'text-amber-600',
                    deleted: 'text-rose-600'
                };
                return (
                    <span className={`text-xs font-black uppercase tracking-tighter ${colors[row.original.description] || 'text-slate-600'}`}>
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
                if (!props || (!props.attributes && !props.old)) return <span className="text-[10px] text-slate-300">-</span>;
                
                return (
                    <div className="max-w-xs overflow-hidden">
                        {props.attributes && (
                            <div className="text-[10px] text-slate-600 truncate">
                                <strong>New:</strong> {JSON.stringify(props.attributes)}
                            </div>
                        )}
                        {props.old && (
                            <div className="text-[10px] text-slate-400 truncate">
                                <strong>Old:</strong> {JSON.stringify(props.old)}
                            </div>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Audit Trail</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-600" />
                        Sistem Log & Jejak Audit
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-md">
                        <ActivityIcon size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Logs</p>
                        <p className="text-xl font-black text-slate-800">{logsRes?.data?.total || 0}</p>
                    </div>
                </div>
                {/* Additional stats could go here */}
            </div>

            <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
                <DataTable 
                    columns={columns}
                    data={logsRes?.data?.data || []}
                    isLoading={isLoading || isFetching}
                    meta={logsRes?.data}
                    onPageChange={setPage}
                    placeholder="Cari log audit..."
                />
            </div>
        </div>
    );
};

export default AuditTrailPage;
