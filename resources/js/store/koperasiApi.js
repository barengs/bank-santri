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
                url: '/main/koperasi/transactions',
                params,
            }),
            providesTags: ['Transaksi'],
        }),
        getKoperasiMerchants: builder.query({
            query: () => '/main/koperasi/merchants',
            providesTags: ['KoperasiMerchant'],
        }),
        createKoperasiMerchant: builder.mutation({
            query: (data) => ({
                url: '/main/koperasi/merchants',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['KoperasiMerchant'],
        }),
        updateKoperasiMerchant: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/main/koperasi/merchants/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['KoperasiMerchant'],
        }),
        deleteKoperasiMerchant: builder.mutation({
            query: (id) => ({
                url: `/main/koperasi/merchants/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['KoperasiMerchant'],
        }),
        rotateKoperasiMerchantKey: builder.mutation({
            query: (id) => ({
                url: `/main/koperasi/merchants/${id}/rotate`,
                method: 'POST',
            }),
            invalidatesTags: ['KoperasiMerchant'],
        }),
    }),
});

export const { 
    useCheckKoperasiAccountQuery,
    useLazyCheckKoperasiAccountQuery,
    useProcessKoperasiDebitMutation,
    useGetKoperasiTransactionsQuery,
    useGetKoperasiMerchantsQuery,
    useCreateKoperasiMerchantMutation,
    useUpdateKoperasiMerchantMutation,
    useDeleteKoperasiMerchantMutation,
    useRotateKoperasiMerchantKeyMutation,
} = koperasiApi;
