const buckets = new Map();

const getBucketKey = (timestamp) => Math.floor(timestamp / 1000) * 1000;

const createBucket = (key) => ({
  startTime: key,
  endTime: key + 1000,
  trades: [],
  lastOrderbook: null
});

const getOrCreateBucket = (key) => {
  if (!buckets.has(key)) {
    buckets.set(key, createBucket(key));
  }

  return buckets.get(key);
};

const addTradeToBucket = (trade) => {
  const key = getBucketKey(trade.exchangeTimestamp);
  const bucket = getOrCreateBucket(key);

  bucket.trades.push(trade);
};

const addOrderbookToBucket = (orderbook) => {
  const key = getBucketKey(orderbook.exchangeTimestamp);
  const bucket = getOrCreateBucket(key);

  bucket.lastOrderbook = orderbook;
};

const getCompletedBuckets = () => {
  const now = Date.now();
  const completed = [];

  for (const [key, bucket] of buckets.entries()) {
    if (now - key > 2000) {
      completed.push(bucket);
      buckets.delete(key);
    }
  }

  return completed;
};

module.exports = {
  addTradeToBucket,
  addOrderbookToBucket,
  getCompletedBuckets
};