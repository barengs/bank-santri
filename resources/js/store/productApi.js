import { baseApi } from './baseApi';

export const productApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getProducts: builder.query({
            query: (params) => ({
                url: '/master/product',
                params,
            }),
            providesTags: ['Product'],
        }),
        getProduct: builder.query({
            query: (id) => `/master/product/${id}`,
            providesTags: (result, error, id) => [{ type: 'Product', id }],
        }),
        createProduct: builder.mutation({
            query: (data) => ({
                url: '/master/product',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Product'],
        }),
        updateProduct: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/master/product/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }, 'Product'],
        }),
        deleteProduct: builder.mutation({
            query: (id) => ({
                url: `/master/product/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Product'],
        }),
    }),
});

export const {
    useGetProductsQuery,
    useGetProductQuery,
    useCreateProductMutation,
    useUpdateProductMutation,
    useDeleteProductMutation,
} = productApi;
