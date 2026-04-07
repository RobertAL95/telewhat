import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: false, 
  
  // 👇 AQUÍ ESTÁ LA MAGIA PROFESIONAL PARA SALVAR LA MEMORIA RAM
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  
  async rewrites() {
    return [
      {
        source: '/ws',
        // ✅ Websockets al backend
        destination: 'http://localhost:5001/ws', 
      },
      {
        source: '/api/:path*',
        // ✅ API calls al backend
        destination: 'http://localhost:5001/:path*', 
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);