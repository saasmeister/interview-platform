/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: "/Users/roelofotten/Desktop/app",
  },
  experimental: {
    optimizePackageImports: [
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-avatar",
      "@radix-ui/react-separator",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "lucide-react",
    ],
  },
};

export default nextConfig;
