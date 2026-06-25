import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./components/Layout";
import About from "./pages/About";
import BlogList from "./pages/BlogList";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Dealers from "./pages/Dealers";
import FAQ from "./pages/FAQ";
import FarmArea from "./pages/FarmArea";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import QRVerify from "./pages/QRVerify";

import PortalLayout from "./components/PortalLayout";
import PortalLogin from "./pages/portal/PortalLogin";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalProducts from "./pages/portal/PortalProducts";
import PortalOrders from "./pages/portal/PortalOrders";
import PortalLedger from "./pages/portal/PortalLedger";
import PortalPaymentCallback from "./pages/portal/PortalPaymentCallback";

import "./styles/tokens.css";
import "./styles/site.css";
import "./styles/pages.css";
import "./styles/portal-tailwind.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "gioi-thieu", element: <About /> },
      { path: "san-pham", element: <ProductList /> },
      { path: "san-pham/:slug", element: <ProductDetail /> },
      { path: "blog", element: <BlogList /> },
      { path: "blog/:slug", element: <PostDetail /> },
      { path: "dai-ly", element: <Dealers /> },
      { path: "vung-trong", element: <FarmArea /> },
      { path: "lien-he", element: <Contact /> },
      { path: "tuyen-dung", element: <Careers /> },
      { path: "faq", element: <FAQ /> },
      { path: "qr/:token", element: <QRVerify /> },
    ],
  },
  {
    path: "/portal",
    element: <PortalLayout />,
    children: [
      { index: true, element: <PortalDashboard /> },
      { path: "login", element: <PortalLogin /> },
      { path: "products", element: <PortalProducts /> },
      { path: "orders", element: <PortalOrders /> },
      { path: "ledger", element: <PortalLedger /> },
      { path: "payment/callback", element: <PortalPaymentCallback /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </StrictMode>,
);
