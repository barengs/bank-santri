import { baseApi } from './baseApi';

export const topUpApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getTopUpRequests: builder.query({
            query: (params) => ({
                url: '/main/top-up',
                params,
            }),
            providesTags: ['TopUp'],
        }),
        getTopUpByAccount: builder.query({
            query: (accountNumber) => `/main/top-up/account/${accountNumber}`,
            providesTags: (result, error, arg) => [{ type: 'TopUp', id: `ACCOUNT-${arg}` }],
        }),
        cashTopUp: builder.mutation({
            query: (data) => ({
                url: '/main/top-up/cash',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['TopUp', 'Account', 'Dashboard'],
        }),
        bankTransferTopUp: builder.mutation({
            query: (data) => {
                const formData = new FormData();
                Object.keys(data).forEach(key => {
                    formData.append(key, data[key]);
                });
                return {
                    url: '/main/top-up/bank-transfer',
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: ['TopUp'],
        }),
        verifyTopUp: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/main/top-up/${id}/verify`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['TopUp', 'Account', 'Dashboard'],
        }),
        rejectTopUp: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/main/top-up/${id}/reject`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['TopUp'],
        }),
    }),
});

export const { 
    useGetTopUpRequestsQuery,
    useGetTopUpByAccountQuery,
    useCashTopUpMutation,
    useBankTransferTopUpMutation,
    useVerifyTopUpMutation,
    useRejectTopUpMutation
} = topUpApi;
