import { baseApi } from './baseApi';

export const transactionTypeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTransactionTypes: builder.query({
            query: (params) => ({
                url: '/main/transaction-type',
                params,
            }),
            providesTags: ['TransactionType'],
        }),
        getTransactionType: builder.query({
            query: (id) => `/main/transaction-type/${id}`,
            providesTags: (result, error, id) => [{ type: 'TransactionType', id }],
        }),
        createTransactionType: builder.mutation({
            query: (data) => ({
                url: '/main/transaction-type',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['TransactionType'],
        }),
        updateTransactionType: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/main/transaction-type/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'TransactionType', id }, 'TransactionType'],
        }),
        deleteTransactionType: builder.mutation({
            query: (id) => ({
                url: `/main/transaction-type/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['TransactionType'],
        }),
    }),
});

export const {
    useGetTransactionTypesQuery,
    useGetTransactionTypeQuery,
    useCreateTransactionTypeMutation,
    useUpdateTransactionTypeMutation,
    useDeleteTransactionTypeMutation,
} = transactionTypeApi;
