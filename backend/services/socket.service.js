const cron = require('node-cron');
const { getSimplePrices } = require('./cryptoApi.service');

// Default coins to broadcast
const DEFAULT_COINS = [
  'bitcoin',
  'ethereum',
  'binancecoin',
  'solana',
  'ripple',
  'cardano',
  'dogecoin',
  'polkadot',
];

let io;

const initSocketService = (socketIO) => {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client can subscribe to specific coin IDs
    socket.on('subscribe-prices', (coinIds) => {
      if (Array.isArray(coinIds) && coinIds.length) {
        const room = `prices:${coinIds.sort().join(',')}`;
        socket.join(room);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Broadcast live prices every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const prices = await getSimplePrices(DEFAULT_COINS);
      io.emit('price-update', prices);
    } catch (err) {
      console.error('⚠️  Price broadcast error:', err.message);
    }
  });

  console.log('✅ Socket.IO service initialized');
};

module.exports = { initSocketService };
