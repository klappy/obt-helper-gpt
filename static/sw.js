import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst } from "workbox-strategies";

// Clean up old caches
cleanupOutdatedCaches();

// Precache build files
precacheAndRoute(self.__WB_MANIFEST);

// Cache chat sessions for offline access
registerRoute(
  ({ url }) => url.pathname.startsWith("/chat/"),
  new StaleWhileRevalidate({
    cacheName: "chat-pages",
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          // Cache chat pages but not API calls
          return request.url.includes("/.netlify/functions/") ? null : request.url;
        },
      },
    ],
  })
);

// Cache static assets
registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images",
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Basic offline fallback
registerRoute(
  ({ request }) => request.mode === "navigate",
  async ({ event }) => {
    try {
      const response = await fetch(event.request);
      return response;
    } catch (error) {
      // Return cached page or offline fallback
      const cache = await caches.open("chat-pages");
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        return cachedResponse;
      }

      // Basic offline page
      return new Response(
        `
        <html>
          <head>
            <title>OBT Helper GPT - Offline</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                text-align: center; 
                padding: 50px 20px;
                background: #f8fafc;
                color: #1f2937;
              }
              .container {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
              h1 { color: #dc2626; margin-bottom: 16px; }
              button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                margin-top: 20px;
              }
              button:hover { background: #2563eb; }
              .status { 
                margin: 20px 0; 
                padding: 12px; 
                background: #fef3c7; 
                border-radius: 6px; 
                color: #92400e;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🔌 You're Offline</h1>
              <p>It looks like you've lost your internet connection. Don't worry - some features may still work!</p>
              <div class="status" id="status">
                Checking connection...
              </div>
              <button onclick="location.reload()">🔄 Try Again</button>
              <button onclick="goHome()">🏠 Go Home</button>
            </div>
            
            <script>
              // Check online status
              function updateStatus() {
                const status = document.getElementById('status');
                if (navigator.onLine) {
                  status.innerHTML = '✅ Connection restored! Click "Try Again" to continue.';
                  status.style.background = '#d1fae5';
                  status.style.color = '#065f46';
                } else {
                  status.innerHTML = '❌ Still offline. Check your network connection.';
                  status.style.background = '#fee2e2';
                  status.style.color = '#991b1b';
                }
              }
              
              function goHome() {
                window.location.href = '/';
              }
              
              // Update status immediately and on connection change
              updateStatus();
              window.addEventListener('online', updateStatus);
              window.addEventListener('offline', updateStatus);
              
              // Auto-retry when connection is restored
              window.addEventListener('online', () => {
                setTimeout(() => {
                  if (navigator.onLine) {
                    location.reload();
                  }
                }, 1000);
              });
            </script>
          </body>
        </html>
        `,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }
  }
);

// Handle chat session persistence offline
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SAVE_CHAT_SESSION") {
    // Store chat session in IndexedDB for offline access
    const { sessionId, messages } = event.data.payload;

    // Open IndexedDB
    const request = indexedDB.open("ChatSessions", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "sessionId" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["sessions"], "readwrite");
      const store = transaction.objectStore("sessions");
      store.put({
        sessionId,
        messages,
        timestamp: Date.now(),
      });
    };
  }
});

// Notify main thread when service worker is ready
self.addEventListener("install", () => {
  console.log("🔧 Service Worker installed - offline support ready!");
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("✅ Service Worker activated - app can now work offline!");
  self.clients.claim();
});
