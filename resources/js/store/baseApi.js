import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
        const token = localStorage.getItem('token');
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // Try to get a new token
        const refreshResult = await baseQuery(
            { url: '/auth/refresh', method: 'POST' },
            api,
            extraOptions
        );

        if (refreshResult.data) {
            const newToken = refreshResult.data.access_token;
            if (newToken) {
                // Store the new token
                localStorage.setItem('token', newToken);
                
                // Retry the initial query
                result = await baseQuery(args, api, extraOptions);
            }
        } else {
            // Refresh failed - clean up and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to local login
            window.location.href = '/login';
        }
    }
    return result;
};

export const baseApi = createApi({
    reducerPath: 'baseApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['TransactionType', 'TransactionItem', 'Account', 'Transaction', 'Product', 'COA', 'Dashboard', 'PaymentPackage', 'User'],
    endpoints: () => ({}),
});
