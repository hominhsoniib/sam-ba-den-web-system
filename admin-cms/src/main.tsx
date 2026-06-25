import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Users from "./pages/Users";
import PostList from "./pages/PostList";
import PostEditor from "./pages/PostEditor";
import ProductList from "./pages/ProductList";
import ProductEditor from "./pages/ProductEditor";
import Leads from "./pages/Leads";
import Customers from "./pages/Customers";
import Customer360 from "./pages/Customer360";
import Dealers from "./pages/Dealers";
import Orders from "./pages/Orders";
import OrderCreate from "./pages/OrderCreate";
import QRTraceability from "./pages/QRTraceability";

import "./styles/tokens.css";
import "./styles/components.css";
import "./styles/login.css";
import "./styles/shell.css";
import "./styles/blog.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "posts", element: <PostList /> },
      { path: "posts/new", element: <PostEditor /> },
      { path: "posts/:id", element: <PostEditor /> },
      { path: "products-catalog", element: <ProductList /> },
      { path: "products-catalog/new", element: <ProductEditor /> },
      { path: "products-catalog/:id", element: <ProductEditor /> },
      { path: "leads", element: <Leads /> },
      { path: "customers", element: <Customers /> },
      { path: "customers/:id/journey", element: <Customer360 /> },
      { path: "dealers", element: <Dealers /> },
      { path: "orders", element: <Orders /> },
      { path: "orders/new", element: <OrderCreate /> },
      { path: "qrcode", element: <QRTraceability /> },
      { path: "users", element: <Users /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
