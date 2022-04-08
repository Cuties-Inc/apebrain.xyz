const cacheItems = [
    '*.js',
    '*.html',
    '*.png',
    'fonts',
    '_app,'
]
  
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('sw-cache').then(function(cache) {
            return cache.addAll(cacheItems)
            // return cache.add('index.html');
        })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});