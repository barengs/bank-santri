import { baseApi } from './baseApi';

export const accountApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAccounts: builder.query({
            query: (params) => ({
                url: '/main/account',
                params,
            }),
            providesTags: (result) => 
                result 
                    ? [...result.data.data.map(({ account_number }) => ({ type: 'Account', id: account_number })), 'Account']
                    : ['Account'],
        }),
        getAccountDetail: builder.query({
            query: (accountNumber) => `/main/account/${accountNumber}`,
            providesTags: (result, error, arg) => [{ type: 'Account', id: arg }],
        }),
        createAccount: builder.mutation({
            query: (data) => ({
                url: '/main/account',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Account', 'Dashboard'],
        }),
        // Special endpoint to search students from SMPT (Backend Proxy)
        searchSmptStudents: builder.query({
            query: (search) => ({
                url: '/main/account/smpt-search', // We will create this proxy route in Laravel
                params: { search },
            }),
        }),
        updateAccount: builder.mutation({
            query: ({ accountNumber, ...data }) => ({
                url: `/main/account/${accountNumber}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { accountNumber }) => [
                { type: 'Account', id: accountNumber },
                'Account'
            ],
        }),
    }),
});

export const { 
    useGetAccountsQuery, 
    useGetAccountDetailQuery,
    useLazyGetAccountDetailQuery,
    useCreateAccountMutation,
    useUpdateAccountMutation,
    useLazySearchSmptStudentsQuery 
} = accountApi;
