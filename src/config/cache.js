const NodeCache = require('node-cache');

// In-memory cache with TTL (acts as Redis alternative)
// stdTTL: default time-to-live in seconds
// checkperiod: interval in seconds to check for expired keys
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 600,
  checkperiod: 120,
  useClones: false,
});

cache.on('expired', (key) => {
  console.log(`Cache key expired: ${key}`);
});

module.exports = cache;
