import { baseApi } from './baseApi';

export const transactionItemApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTransactionItems: builder.query({
            query: (params) => ({
                url: '/master/transaction-item',
                params,
            }),
            providesTags: ['TransactionItem'],
        }),
        getTransactionItem: builder.query({
            query: (id) => `/master/transaction-item/${id}`,
            providesTags: (result, error, id) => [{ type: 'TransactionItem', id }],
        }),
        createTransactionItem: builder.mutation({
            query: (data) => ({
                url: '/master/transaction-item',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['TransactionItem'],
        }),
        updateTransactionItem: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/master/transaction-item/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'TransactionItem', id }, 'TransactionItem'],
        }),
        deleteTransactionItem: builder.mutation({
            query: (id) => ({
                url: `/master/transaction-item/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['TransactionItem'],
        }),
        getUnclaimedItemTransactions: builder.query({
            query: (id) => `/master/transaction-item/${id}/unclaimed`,
            providesTags: (result, error, id) => [{ type: 'TransactionItem', id: `unclaimed-${id}` }],
        }),
        claimUnclaimedItemTransactions: builder.mutation({
            query: ({ id, destination_account }) => ({
                url: `/master/transaction-item/${id}/claim`,
                method: 'POST',
                body: { destination_account },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'TransactionItem', id },
                { type: 'TransactionItem', id: `unclaimed-${id}` },
                'TransactionItem',
                'Account',
                'Transaction',
            ],
        }),
    }),
});

export const {
    useGetTransactionItemsQuery,
    useGetTransactionItemQuery,
    useCreateTransactionItemMutation,
    useUpdateTransactionItemMutation,
    useDeleteTransactionItemMutation,
    useLazyGetUnclaimedItemTransactionsQuery,
    useClaimUnclaimedItemTransactionsMutation,
} = transactionItemApi;
