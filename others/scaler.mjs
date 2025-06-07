import { LRUCache } from 'lru-cache';

let maxKeys = 10_000;
let cache   = makeCache(maxKeys);

function makeCache(maxEntries) {
  return new LRUCache({
    maxSize: maxEntries,
    ttl:     60_000,
    allowStale:     false,
    updateAgeOnGet: false,
    updateAgeOnHas: false,
  });
}

function scaleCache() {
  const { heapUsed, heapTotal } = process.memoryUsage();
  const freeHeapRatio = (heapTotal - heapUsed) / heapTotal;

  const newMax = freeHeapRatio > 0.5
    ? 20_000
    : freeHeapRatio < 0.2
      ? 5_000
      : 10_000;

  if (newMax !== maxKeys) {
    maxKeys = newMax;
    cache = makeCache(maxKeys);
    console.log(`[SCALER] freeHeap ${( (heapTotal - heapUsed)/1e6 ).toFixed(1)}MB → maxKeys: ${maxKeys}`);
  }
}

setInterval(scaleCache, 60_000);
scaleCache();

export { cache };