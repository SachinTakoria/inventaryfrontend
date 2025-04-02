import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/Login";
import Register from "../pages/Register";
import HomePage from "../pages/Home";
import ErrorPage from "../pages/Error";
import Invoice from "../pages/Invoice";
import UserPage from "../pages/Users";
import OrdersPage from "../pages/Orders";
import AddProduct from "../pages/Home/AddProduct"; // ✅ Import Add Product Page
import MyProducts from "../pages/Home/MyProducts";
import InvoiceViewer from "../pages/Home/InvoiceViewer";

import InvoiceBuilder from "../pages/Home/InvoiceBuilder";
import MyBills from "../pages/Home/MyBills"; // ✅ Add this at the top
import Inventory from "../pages/Home/Inventary";
import InvoiceBuilder2 from "../pages/Home/InvoiceBuilder2";
import MyBills2 from "../pages/Home/MyBills2";
import InvoiceViewer2 from "../pages/Home/InvoiceViewer2";

export const Routes = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        path: "/",
        Component: HomePage,
      },
      {
        path: "/invoice",
        Component: Invoice,
      },
      {
        path: "/user",
        Component: UserPage,
      },
      {
        path: "/orders",
        Component: OrdersPage,
      },

      {
        path: "/add-product",
        Component: AddProduct, // ✅ Add Product Route Added
      },
      {
        path: "/my-product",
        Component: MyProducts, // ✅ Add Product Route Added
      },
      {
        path: "/invoice-builder",
        Component: InvoiceBuilder,
      },
      {
        path: "/my-bills",
        Component: MyBills,
      },
      {
        path: "/invoice-view/:id",
        Component: InvoiceViewer,
      },
      {
        path: '/invoice-view-2/:id',
        Component: InvoiceViewer2
      },
      {
        path: "/purchase-items",
        Component: Inventory, // ✅ Inventory route
      },
      {
        path: "/invoice-builder-2",
        Component: InvoiceBuilder2,
      },
      {
        path: '/shreesai-bills',
        Component: MyBills2
      },
      {
        path: "*",
        Component: ErrorPage,
      },
    ],
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
]);
