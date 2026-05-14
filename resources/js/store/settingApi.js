import { baseApi } from './baseApi';

export const settingApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSettings: builder.query({
            query: () => '/master/setting',
            providesTags: ['Setting'],
        }),
        updateSettings: builder.mutation({
            query: (settings) => ({
                url: '/master/setting',
                method: 'PUT',
                body: { settings },
            }),
            invalidatesTags: ['Setting'],
        }),
    }),
});

export const {
    useGetSettingsQuery,
    useUpdateSettingsMutation,
} = settingApi;
