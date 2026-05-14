import { baseApi } from './baseApi';

export const coaApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getCoaTree: builder.query({
            query: () => '/master/chart-of-account',
            providesTags: ['COA'],
        }),
        getHeaderAccounts: builder.query({
            query: () => '/master/chart-of-account/header-accounts',
            providesTags: ['COA'],
        }),
        getDetailAccounts: builder.query({
            query: () => '/master/chart-of-account/detail-accounts',
            providesTags: ['COA'],
        }),
        getCoa: builder.query({
            query: (code) => `/master/chart-of-account/${code}`,
            providesTags: (result, error, code) => [{ type: 'COA', id: code }],
        }),
        createCoa: builder.mutation({
            query: (data) => ({
                url: '/master/chart-of-account',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['COA'],
        }),
        updateCoa: builder.mutation({
            query: ({ coa_code, ...data }) => ({
                url: `/master/chart-of-account/${coa_code}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { coa_code }) => [{ type: 'COA', id: coa_code }, 'COA'],
        }),
        deleteCoa: builder.mutation({
            query: (code) => ({
                url: `/master/chart-of-account/${code}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['COA'],
        }),
    }),
});

export const {
    useGetCoaTreeQuery,
    useGetHeaderAccountsQuery,
    useGetDetailAccountsQuery,
    useGetCoaQuery,
    useCreateCoaMutation,
    useUpdateCoaMutation,
    useDeleteCoaMutation,
} = coaApi;
