import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSummary: builder.query({
            query: () => '/main/dashboard/summary',
            providesTags: ['Dashboard', 'Transaction', 'Account'],
        }),
    }),
});

export const { useGetSummaryQuery } = dashboardApi;
