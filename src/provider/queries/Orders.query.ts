import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const OrdersApi = createApi({
  reducerPath: 'OrdersApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_BACKEND_URL }),
  tagTypes: ['getAllOrders'],
  endpoints: (builder) => ({
    CreateOrder: builder.mutation<any, any>({
      query: (obj) => ({
        url: '/orders/create-order',
        method: 'POST',
        body: obj,
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
      }),
      invalidatesTags: ['getAllOrders'],
    }),

    // ✅✅ ✅ ✅ NEWLY ADDED: UPDATE ORDER
    updateOrder: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/orders/update-order/${id}`,
        method: 'PUT',
        body: data,
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
      }),
      invalidatesTags: ['getAllOrders'],
    }),

    getAllOrders: builder.query<any, any>({
      query: (obj) => ({
        url: `/orders/get-orders?query=${obj.query}&page=${obj.page}`,
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
      }),
      providesTags: ['getAllOrders'],
    }),

    DeleteOrder: builder.mutation<any, any>({
      query: (obj) => ({
        url: `/orders/delete/${obj}`,
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
      }),
      invalidatesTags: ['getAllOrders'],
    }),

    getInvoiceById: builder.query<any, any>({
      query: (obj) => ({
        url: `/orders/get-invoice/${obj}`,
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token'),
        },
      }),
    }),
  }),
})

// ✅✅ ✅ ✅ EXPORT HOOKS
export const {
  useCreateOrderMutation,
  useUpdateOrderMutation, // ✅ ✅ added
  useGetAllOrdersQuery,
  useDeleteOrderMutation,
  useGetInvoiceByIdQuery,
} = OrdersApi;
