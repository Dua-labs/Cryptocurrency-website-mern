import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const useSocketStore = create((set, get) => ({
  socket: null,
  prices: {}, // { bitcoin: { usd: 60000, usd_24h_change: 1.5 }, ... }
  connected: false,

  connect: () => {
    if (get().socket) return; // already connected

    const socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('connect', () => {
      set({ connected: true });
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });

    socket.on('price-update', (data) => {
      set({ prices: data });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },

  subscribePrices: (coinIds) => {
    const { socket } = get();
    if (socket) socket.emit('subscribe-prices', coinIds);
  },
}));

export default useSocketStore;
