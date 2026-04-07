import { baseApi } from './baseApi';

export const transactionApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTransactions: builder.query({
            query: (params) => ({
                url: '/main/transaction',
                params,
            }),
            providesTags: ['Transaction'],
        }),
        getAccountTransactions: builder.query({
            query: (accountNumber) => `/main/account/${accountNumber}/transactions`,
            providesTags: (result, error, arg) => [{ type: 'Transaction', id: `account-${arg}` }],
        }),
        cashDeposit: builder.mutation({
            query: (data) => ({
                url: '/main/transaction/cash-deposit',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Transaction', 'Account', 'Dashboard'],
        }),
        cashWithdrawal: builder.mutation({
            query: (data) => ({
                url: '/main/transaction/cash-withdrawal',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Transaction', 'Account', 'Dashboard'],
        }),
        fundTransfer: builder.mutation({
            query: (data) => ({
                url: '/main/transaction/fund-transfer',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Transaction', 'Account', 'Dashboard'],
        }),
    }),
});

export const { 
    useGetTransactionsQuery, 
    useGetAccountTransactionsQuery,
    useCashDepositMutation, 
    useCashWithdrawalMutation, 
    useFundTransferMutation 
} = transactionApi;
