import { baseApi } from './baseApi';

export const koperasiApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        checkKoperasiAccount: builder.query({
            query: (nis) => `/koperasi/check/${nis}`,
            providesTags: (result, error, arg) => [{ type: 'Account', id: `KOP-CHECK-${arg}` }],
        }),
        processKoperasiDebit: builder.mutation({
            query: (data) => ({
                url: '/koperasi/debit',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Account', 'Dashboard', 'Transaksi'],
        }),
        getKoperasiTransactions: builder.query({
            query: (params) => ({
                url: '/koperasi/transactions',
                params,
            }),
            providesTags: ['Transaksi'],
        }),
    }),
});

export const { 
    useCheckKoperasiAccountQuery,
    useLazyCheckKoperasiAccountQuery,
    useProcessKoperasiDebitMutation,
    useGetKoperasiTransactionsQuery
} = koperasiApi;
