import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { UserSlice } from "./slice/user.slice";
import { SidebarSlice } from "./slice/Sidebar.slice";
import { AuthApi } from "./queries/Auth.query";
import { UserApi } from "./queries/Users.query";
import { OrdersApi } from "./queries/Orders.query";
import userReducer from "../../src/provider/slice/user.slice"; // ✅ correctly imported

export const store = configureStore({
  reducer: {
    user: userReducer, // ✅ Yeh ADD karo!
    [UserSlice.name]: UserSlice.reducer,
    [SidebarSlice.name]: SidebarSlice.reducer,
    [AuthApi.reducerPath]: AuthApi.reducer,
    [UserApi.reducerPath]: UserApi.reducer,
    [OrdersApi.reducerPath]: OrdersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      AuthApi.middleware,
      UserApi.middleware,
      OrdersApi.middleware
    ),
});

setupListeners(store.dispatch);
