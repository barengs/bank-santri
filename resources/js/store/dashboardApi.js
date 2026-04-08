import { baseApi } from './baseApi';

export const dashboardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDashboardSummary: builder.query({
            query: () => '/main/dashboard/summary',
            providesTags: ['Dashboard', 'Transaction', 'Account'],
        }),
    }),
});

export const { useGetDashboardSummaryQuery } = dashboardApi;
