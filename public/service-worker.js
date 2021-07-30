const CACHE_NAME = "static-cache";
const DATA_CACHE_NAME = "data-cache";
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/assets/css/styles.css",
    "/assets/js/db.js",
    "/assets/js/index.js",
    "/assets/icons/icon-192x192.png",
    "/assets/icons/icon-512x512.png"
];

// install
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(DATA_CACHE_NAME).then((cache) => 
            cache.add("api/transaction"))
    );

    // pre cache all static assests
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => 
            cache.addAll(FILES_TO_CACHE))
    );

    // tell the browser to activate this service worker immediately once it has finished installing
    self.skipWaiting();
});

// activate

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache (money) data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// fetch
self.addEventListener("fetch", function (event) {
    if (event.request.url.inclues("/api/")) {
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(event.request).then(response => {
                        // if response was good, clone it and store it in the cache (money).
                        if (response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }
                        return response;
                    })
                    .catch(err => {
                        // Network request failed, try to get it from the cache(drawer).
                        return cache.match(event.request);
                    });
            }).catch(err => console.log(err))
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch(event.request);
            });
        })
    );
});