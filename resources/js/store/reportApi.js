import { baseApi } from './baseApi';

export const reportApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getJournal: builder.query({
            query: (params) => ({
                url: '/reports/journal',
                params,
            }),
            providesTags: ['Journal'],
        }),
        getGeneralLedger: builder.query({
            query: (params) => ({
                url: '/reports/general-ledger',
                params,
            }),
            providesTags: ['GeneralLedger'],
        }),
        getTrialBalance: builder.query({
            query: (params) => ({
                url: '/reports/trial-balance',
                params,
            }),
            providesTags: ['TrialBalance'],
        }),
        getProfitLoss: builder.query({
            query: (params) => ({
                url: '/reports/profit-loss',
                params,
            }),
            providesTags: ['ProfitLoss'],
        }),
        getBalanceSheet: builder.query({
            query: (params) => ({
                url: '/reports/balance-sheet',
                params,
            }),
            providesTags: ['BalanceSheet'],
        }),
        getReconciliation: builder.query({
            query: () => '/reports/reconciliation',
            providesTags: ['Reconciliation'],
        }),
        getRekapitulasi: builder.query({
            query: (params) => ({
                url: '/reports/rekapitulasi',
                params,
            }),
            providesTags: ['Rekapitulasi'],
        }),
    }),
});

export const {
    useGetJournalQuery,
    useGetGeneralLedgerQuery,
    useGetTrialBalanceQuery,
    useGetProfitLossQuery,
    useGetBalanceSheetQuery,
    useGetReconciliationQuery,
    useGetRekapitulasiQuery,
} = reportApi;
