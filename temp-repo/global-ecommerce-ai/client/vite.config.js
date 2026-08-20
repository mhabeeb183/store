import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const pathTraversalShield = () => ({
  name: "path-traversal-shield",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      try {
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        
        // 1. Validate the 'v' query parameter (dependency version hash)
        const v = url.searchParams.get("v");
        if (v) {
          const decodedV = decodeURIComponent(v);
          // Only allow alphanumeric characters, hyphens, and underscores
          if (!/^[a-zA-Z0-9-_]+$/.test(decodedV)) {
            res.statusCode = 400;
            res.end("Bad Request: Invalid parameter format.");
            return;
          }
        }

        // 2. Generic query parameter safety check for command injection characters
        for (const [key, value] of url.searchParams.entries()) {
          const decodedValue = decodeURIComponent(value);
          if (/[;&|`$"']/g.test(decodedValue)) {
            res.statusCode = 400;
            res.end("Bad Request: Invalid parameter format.");
            return;
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
      next();
    });
  }
});

let currentNonce = "";

const securityHeadersMiddleware = () => ({
  name: "security-headers-middleware",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      try {
        const host = req.headers.host || "localhost:5173";
        const hostname = host.split(":")[0];
        const backendUrl = `http://${hostname}:5001`;
        const wsBackendUrl = `ws://${hostname}:5001`;

        // Generate a random nonce and store in module scope
        currentNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const csp = `default-src 'self' ${backendUrl} https://checkout.razorpay.com; script-src 'self' blob: 'nonce-${currentNonce}' 'wasm-unsafe-eval' https://checkout.razorpay.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://res.cloudinary.com https://images.unsplash.com https://placehold.co https://via.placeholder.com https://modelviewer.dev https://api.qrserver.com; connect-src 'self' blob: ${backendUrl} ${wsBackendUrl} https://api.razorpay.com https://modelviewer.dev https://res.cloudinary.com; frame-src 'self' https://api.razorpay.com; font-src 'self' data:; frame-ancestors 'self'; form-action 'self';`;

        res.setHeader("Content-Security-Policy", csp);
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      } catch (e) {
        // Ignore header errors
      }
      next();
    });
  },
  transformIndexHtml(html) {
    if (!currentNonce) return html;

    // Inject meta tag for Vite runtime CSS/JS injection
    let transformed = html.replace(
      /<head>/i,
      `<head>\n    <meta property="csp-nonce" content="${currentNonce}" nonce="${currentNonce}" />`
    );

    // Add the nonce to all script tags (unless they already have one)
    transformed = transformed.replace(/<script([^>]*)>/gi, (match, p1) => {
      if (p1.includes("nonce=")) return match;
      return `<script${p1} nonce="${currentNonce}">`;
    });

    // Add the nonce to all style tags (unless they already have one)
    transformed = transformed.replace(/<style([^>]*)>/gi, (match, p1) => {
      if (p1.includes("nonce=")) return match;
      return `<style${p1} nonce="${currentNonce}">`;
    });

    // Add the nonce to link tags that are stylesheets
    transformed = transformed.replace(/<link([^>]*)>/gi, (match, p1) => {
      if (p1.includes("nonce=")) return match;
      if (p1.includes('rel="stylesheet"') || p1.includes("rel='stylesheet'")) {
        return `<link${p1} nonce="${currentNonce}">`;
      }
      return match;
    });

    return transformed;
  }
});

export default defineConfig({
  plugins: [react(), tailwindcss(), pathTraversalShield(), securityHeadersMiddleware()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  preview: {
    port: 4173,
    headers: {
      "Content-Security-Policy": "default-src 'self' http://localhost:5001 https://checkout.razorpay.com; script-src 'self' 'wasm-unsafe-eval' https://checkout.razorpay.com; worker-src 'self' blob:; style-src 'self'; img-src 'self' blob: data: https://res.cloudinary.com https://images.unsplash.com https://placehold.co https://via.placeholder.com https://modelviewer.dev https://api.qrserver.com; connect-src 'self' blob: http://localhost:5001 ws://localhost:5001 https://api.razorpay.com https://modelviewer.dev https://res.cloudinary.com; frame-src 'self' https://api.razorpay.com; font-src 'self' data:; frame-ancestors 'self'; form-action 'self';",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    }
  }
});