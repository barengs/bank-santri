import { baseApi } from './baseApi';

export const securityApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSidebar: builder.query({
            query: () => '/sidebar',
            providesTags: ['Sidebar'],
        }),
        getMenus: builder.query({
            query: () => '/security/menus',
            providesTags: ['Menu'],
        }),
        getRoles: builder.query({
            query: () => '/security/roles',
            providesTags: ['Role'],
        }),
        syncRoleMenus: builder.mutation({
            query: ({ id, roleId, menu_ids }) => ({
                url: `/security/roles/${id || roleId}/sync-menus`,
                method: 'POST',
                body: { menu_ids },
            }),
            invalidatesTags: ['Role', 'Sidebar'],
        }),
        syncRolePermissions: builder.mutation({
            query: ({ id, roleId, permission_ids }) => ({
                url: `/security/roles/${id || roleId}/sync-permissions`,
                method: 'POST',
                body: { permission_ids },
            }),
            invalidatesTags: ['Role'],
        }),
        getPermissions: builder.query({
            query: () => '/security/permissions',
            providesTags: ['Permission'],
        }),
        createRole: builder.mutation({
            query: (body) => ({
                url: '/security/roles',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Role'],
        }),
        updateRole: builder.mutation({
            query: ({ id, ...body }) => ({
                url: `/security/roles/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Role', 'Sidebar'],
        }),
        destroyRole: builder.mutation({
            query: (id) => ({
                url: `/security/roles/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Role', 'Sidebar'],
        }),
        getActivityLogs: builder.query({
            query: ({ page = 1 }) => `/security/activity-logs?page=${page}`,
            providesTags: ['ActivityLog'],
        }),
    }),
});

export const {
    useGetSidebarQuery,
    useGetMenusQuery,
    useGetRolesQuery,
    useSyncRoleMenusMutation,
    useSyncRolePermissionsMutation,
    useGetPermissionsQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDestroyRoleMutation,
    useGetActivityLogsQuery,
} = securityApi;
