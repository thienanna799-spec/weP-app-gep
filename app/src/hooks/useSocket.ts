/**
 * useSocket – Global Socket.IO hook for real-time synchronization.
 * 
 * Listens for server events and triggers refetch callbacks.
 * Use this in any tab/module that needs to react to changes made in other tabs.
 */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket) {
    const meta = import.meta as any;
    const apiBase = meta.env?.VITE_API_URL
      ? (meta.env.VITE_API_URL as string).replace('/api', '')
      : window.location.origin;

    globalSocket = io(apiBase, {
      // Start with polling (works through Cloudflare/Nginx), then upgrade
      transports: ['polling', 'websocket'],
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    // Debug logging for connection issues
    globalSocket.on('connect', () => {
      console.log('🔌 Socket.IO connected:', globalSocket?.id);
    });
    globalSocket.on('connect_error', (err) => {
      console.warn('⚠️ Socket.IO connection error:', err.message);
    });
    globalSocket.on('reconnect', (attempt) => {
      console.log('🔄 Socket.IO reconnected after', attempt, 'attempts');
    });
  }
  return globalSocket;
}

interface UseSocketOptions {
  /** Called when any order is created, updated, approved, etc. */
  onOrderUpdate?: (data: any) => void;
  /** Called when inventory/rolls change */
  onInventoryUpdate?: (data: any) => void;
  /** Called when shipping orders change */
  onShippingUpdate?: (data: any) => void;
  /** Called when a user registers, logs in, or is updated */
  onUserUpdate?: (data: any) => void;
  /** Called when a driver checks in/out a vehicle (plate change) */
  onDriverVehicleUpdate?: (data: any) => void;
}

export function useSocket(options: UseSocketOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const socket = getSocket();

    const handleOrderUpdate = (data: any) => {
      optionsRef.current.onOrderUpdate?.(data);
    };
    const handleInventoryUpdate = (data: any) => {
      optionsRef.current.onInventoryUpdate?.(data);
    };
    const handleShippingUpdate = (data: any) => {
      optionsRef.current.onShippingUpdate?.(data);
    };
    const handleUserUpdate = (data: any) => {
      optionsRef.current.onUserUpdate?.(data);
    };
    const handleDriverVehicleUpdate = (data: any) => {
      optionsRef.current.onDriverVehicleUpdate?.(data);
    };

    socket.on('order_updated', handleOrderUpdate);
    socket.on('inventory_updated', handleInventoryUpdate);
    socket.on('shipping_updated', handleShippingUpdate);
    socket.on('user_updated', handleUserUpdate);
    socket.on('driver_vehicle_updated', handleDriverVehicleUpdate);

    return () => {
      socket.off('order_updated', handleOrderUpdate);
      socket.off('inventory_updated', handleInventoryUpdate);
      socket.off('shipping_updated', handleShippingUpdate);
      socket.off('user_updated', handleUserUpdate);
      socket.off('driver_vehicle_updated', handleDriverVehicleUpdate);
    };
  }, []);
}
