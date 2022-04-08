const cacheItems = [
    'index.html',
    'index.js',
    'styles.css',
    'icon/basket_large.png',
    'icon/basket.png',
    'lib/jquery.min.js'
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