// import { defineConfig } from 'vite';
// import path from 'path';

// export default defineConfig({
//   server: {
//     proxy: {
//       '/api': {
//         target: 'http://localhost:5000',
//         changeOrigin: true,
//         secure: false,
//         rewrite: (path) => path.replace(/^\/api/, ''),
//       },
//     },
//   },
//   build: {
//     outDir: path.resolve(__dirname, '../public/dist'), 
//     emptyOutDir: true, 
//   },
// });



// import { defineConfig } from 'vite';
// import path from 'path';

// export default defineConfig({
//   server: {
//     proxy: {
//       '/api': {
//         target: 'http://localhost:5000',
//         changeOrigin: true,
//         secure: false,
//         rewrite: (path) => path.replace(/^\/api/, ''),
//       },
//     },
//   },
//   build: {
//     outDir: path.resolve(__dirname, '../client/dist'),
//     emptyOutDir: true,
//     assetsDir: '', 
    
//   },
// });



import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../client/dist'), 
    emptyOutDir: true,  
    assetsDir: '',   
  },
});