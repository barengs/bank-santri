import { baseApi } from './baseApi';

export const paymentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getPaymentPackages: builder.query({
            query: (params) => ({
                url: '/master/payment-package',
                params,
            }),
            providesTags: ['PaymentPackage'],
        }),
        createPaymentPackage: builder.mutation({
            query: (data) => ({
                url: '/master/payment-package',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['PaymentPackage'],
        }),
        getPayments: builder.query({
            query: (params) => ({
                url: '/main/payment',
                params,
            }),
            providesTags: ['Payment'],
        }),
        processPayment: builder.mutation({
            query: (data) => ({
                url: '/main/payment',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Payment', 'Account', 'Dashboard'],
        }),
    }),
});

export const { 
    useGetPaymentPackagesQuery, 
    useCreatePaymentPackageMutation,
    useGetPaymentsQuery,
    useProcessPaymentMutation
} = paymentApi;
