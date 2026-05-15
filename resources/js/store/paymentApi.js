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
        updatePaymentPackage: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/master/payment-package/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['PaymentPackage'],
        }),
        deletePaymentPackage: builder.mutation({
            query: (id) => ({
                url: `/master/payment-package/${id}`,
                method: 'DELETE',
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
    useUpdatePaymentPackageMutation,
    useDeletePaymentPackageMutation,
    useGetPaymentsQuery,
    useProcessPaymentMutation
} = paymentApi;
