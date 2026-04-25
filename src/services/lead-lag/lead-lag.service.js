const { logger } = require("../../utils/logger");

const prices = {
  binance: [],
  bybit: []
};

const stats = {};

const MAX_HISTORY = 5000;
const RETURN_WINDOW_MS = 1000;
const LAGS_MS = [1000, 2000, 5000];

// ⬇️ УЖЕ ЖЕСТЧЕ ФИЛЬТР
const MIN_LEADER_RETURN = 0.00005;

const ANALYSIS_DELAY_MS = 6000; // ⬅️ КЛЮЧЕВОЙ ФИКС

const getStatsKey = (leader, follower, lagMs) => {
  return `${leader}_${follower}_${lagMs}`;
};

const addPricePoint = (trade) => {
  const exchange = trade.exchange;

  if (!prices[exchange]) {
    return;
  }

  prices[exchange].push({
    exchange,
    price: Number(trade.price),
    time: Number(trade.receivedAt)
  });

  if (prices[exchange].length > MAX_HISTORY) {
    prices[exchange].shift();
  }

  analyzeLeadLag();
};

const getClosestPoint = (exchange, targetTime) => {
  const arr = prices[exchange];

  if (!arr.length) {
    return null;
  }

  let closest = null;
  let bestDiff = Infinity;

  for (let i = 0; i < arr.length; i++) {
    const diff = Math.abs(arr[i].time - targetTime);

    if (diff < bestDiff) {
      bestDiff = diff;
      closest = arr[i];
    }
  }

  // если слишком далеко — игнорируем
  if (bestDiff > 800) {
    return null;
  }

  return closest;
};

const getReturn = (exchange, endTime, windowMs = RETURN_WINDOW_MS) => {
  const end = getClosestPoint(exchange, endTime);
  const start = getClosestPoint(exchange, endTime - windowMs);

  if (!start || !end) {
    return null;
  }

  return (end.price - start.price) / start.price;
};

const updateStats = (sample) => {
  const key = getStatsKey(sample.leader, sample.follower, sample.lagMs);

  if (!stats[key]) {
    stats[key] = {
      leader: sample.leader,
      follower: sample.follower,
      lagMs: sample.lagMs,
      samples: 0,
      hits: 0,
      followerReturns: []
    };
  }

  const s = stats[key];

  s.samples += 1;

  if (sample.sameDirection) {
    s.hits += 1;
  }

  s.followerReturns.push(sample.followerFutureReturn);

  if (s.followerReturns.length > 5000) {
    s.followerReturns.shift();
  }

  const avgFollowerReturn =
    s.followerReturns.reduce((sum, value) => sum + value, 0) /
    s.followerReturns.length;

  const hitRate = s.hits / s.samples;

  return {
    ...s,
    hitRate,
    avgFollowerReturn
  };
};

const analyzePair = (leader, follower, lagMs) => {
  // ⬇️ КЛЮЧ: СМОТРИМ В ПРОШЛОЕ, ЧТОБЫ БУДУЩЕЕ УЖЕ БЫЛО
  const now = Date.now() - ANALYSIS_DELAY_MS;

  const leaderReturn = getReturn(leader, now);
  const followerFutureReturn = getReturn(follower, now + lagMs);

  if (leaderReturn === null || followerFutureReturn === null) {
    return null;
  }

  // ⬇️ ФИЛЬТР ШУМА
  if (Math.abs(leaderReturn) < MIN_LEADER_RETURN) {
    return null;
  }

  const sameDirection =
    Math.sign(leaderReturn) === Math.sign(followerFutureReturn);

  const sample = {
    leader,
    follower,
    lagMs,
    leaderReturn,
    followerFutureReturn,
    sameDirection
  };

  const updatedStats = updateStats(sample);

  logger.info(
    {
      sample,
      stats: updatedStats
    },
    "Lead-lag sample"
  );

  return sample;
};

const analyzeLeadLag = () => {
  LAGS_MS.forEach((lagMs) => {
    analyzePair("binance", "bybit", lagMs);
    analyzePair("bybit", "binance", lagMs);
  });
};

module.exports = {
  addPricePoint
};