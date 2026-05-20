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
    }),
});

export const {
    useGetJournalQuery,
    useGetTrialBalanceQuery,
    useGetProfitLossQuery,
    useGetBalanceSheetQuery,
} = reportApi;
