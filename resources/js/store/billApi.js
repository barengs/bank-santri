import { baseApi } from './baseApi';

export const billApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getBillsByAccount: builder.query({
            query: (accountNumber) => `/main/bills/account/${accountNumber}`,
            providesTags: ['Bill'],
        }),
    }),
});

export const {
    useGetBillsByAccountQuery,
    useLazyGetBillsByAccountQuery,
} = billApi;
