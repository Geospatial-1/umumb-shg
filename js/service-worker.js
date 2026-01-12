// Service Worker for Offline Support
const CACHE_NAME = 'umburio-resources-v1';
const urlsToCache = [
    './',
    './index.html',
    './resources.html',
    './styles/style.css',
    './styles/resources.css',
    './js/auth.js',
    './js/resources.js',
    './js/payment.js',
    './js/main.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch Resources
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
    );
});

// Update Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background Sync for offline data
self.addEventListener('sync', event => {
    if (event.tag === 'sync-activities') {
        event.waitUntil(syncActivities());
    }
    if (event.tag === 'sync-downloads') {
        event.waitUntil(syncDownloads());
    }
    if (event.tag === 'sync-payments') {
        event.waitUntil(syncPayments());
    }
});

async function syncActivities() {
    const offlineActivities = await getOfflineData('offlineActivities');
    for (const activity of offlineActivities) {
        await sendToServer('activity', activity);
    }
}

async function syncDownloads() {
    const offlineDownloads = await getOfflineData('offlineDownloads');
    for (const download of offlineDownloads) {
        await sendToServer('download', download);
    }
}

async function syncPayments() {
    const offlinePayments = await getOfflineData('offlinePayments');
    for (const payment of offlinePayments) {
        await sendToServer('payment', payment);
    }
}

async function getOfflineData(key) {
    const data = await new Promise(resolve => {
        const request = indexedDB.open('umburio-offline', 1);
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('offlineData')) {
                db.createObjectStore('offlineData');
            }
        };
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['offlineData'], 'readonly');
            const store = transaction.objectStore('offlineData');
            const getRequest = store.get(key);
            
            getRequest.onsuccess = function() {
                resolve(getRequest.result || []);
            };
            
            getRequest.onerror = function() {
                resolve([]);
            };
        };
        
        request.onerror = function() {
            resolve([]);
        };
    });
    
    return data;
}

async function sendToServer(type, data) {
    try {
        await fetch('YOUR_GOOGLE_SCRIPT_URL', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                data: data
            })
        });
        
        // Remove from offline storage if successful
        await removeFromOfflineStorage(type, data);
        
    } catch (error) {
        console.error('Sync error:', error);
    }
}

async function removeFromOfflineStorage(type, data) {
    // Implementation depends on your offline storage strategy
    // This is a simplified version
    const key = `offline${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    const currentData = await getOfflineData(key);
    const updatedData = currentData.filter(item => 
        item.timestamp !== data.timestamp
    );
    
    await saveOfflineData(key, updatedData);
}

async function saveOfflineData(key, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('umburio-offline', 1);
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['offlineData'], 'readwrite');
            const store = transaction.objectStore('offlineData');
            const putRequest = store.put(data, key);
            
            putRequest.onsuccess = function() {
                resolve();
            };
            
            putRequest.onerror = function() {
                reject();
            };
        };
        
        request.onerror = function() {
            reject();
        };
    });
}
