import type { Server as SocketIOServer, Socket } from 'socket.io';

/**
 * Socket.IO Room Management — Phase 8: Scalability
 * 
 * Tự động phân phối Socket events vào các phòng (rooms) theo vai trò
 * thay vì broadcast toàn bộ cho mọi client đang kết nối.
 * 
 * Lợi ích:
 * - Giảm bandwidth truyền tải
 * - Ngăn chặn rò rỉ thông tin (information leak) giữa các vai trò
 * - Hỗ trợ mở rộng quy mô khi số lượng client tăng lên
 */

// Map event names → target rooms
const EVENT_ROOM_MAP: Record<string, string[]> = {
  order_updated:           ['role:admin', 'role:staff'],
  order_created:           ['role:admin', 'role:staff'],
  inventory_updated:       ['role:admin', 'role:staff'],
  stock_sync:              ['role:admin', 'role:staff'],
  import_batch_updated:    ['role:admin', 'role:staff'],
  shipping_updated:        ['role:admin', 'role:staff', 'role:driver'],
  driver_vehicle_updated:  ['role:admin', 'role:driver'],
  delivery_assigned:       ['role:driver'],
  delivery_updated:        ['role:admin', 'role:staff', 'role:driver'],
  production_updated:      ['role:admin', 'role:staff'],
  customer_updated:        ['role:admin', 'role:staff'],
  finance_updated:         ['role:admin'],
  return_updated:          ['role:admin', 'role:staff'],
};

/**
 * Tự động gán socket vào room dựa trên vai trò người dùng.
 * Gọi hàm này trong sự kiện `io.on('connection', ...)`.
 */
export function handleSocketRoomJoin(socket: Socket): void {
  // Client gửi vai trò của mình khi kết nối
  socket.on('join_role', (role: string) => {
    if (role && typeof role === 'string') {
      const roomName = `role:${role}`;
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room: ${roomName}`);
    }
  });

  // Client gửi user ID để join room cá nhân
  socket.on('join_user', (userId: string) => {
    if (userId && typeof userId === 'string') {
      socket.join(`user:${userId}`);
    }
  });

  // Khi ngắt kết nối, socket tự động rời tất cả rooms
  socket.on('disconnect', () => {
    // Socket.IO tự xử lý leave rooms khi disconnect
  });
}

/**
 * Tạo hàm emit có nhận biết phòng (room-aware emit).
 * Thay vì `io.emit(event, data)` (broadcast toàn bộ),
 * hàm này sẽ emit đến các phòng được cấu hình trong EVENT_ROOM_MAP.
 * Nếu event không nằm trong danh sách, mặc định broadcast cho tất cả.
 */
export function createRoomAwareEmit(io: SocketIOServer) {
  return function roomAwareEmit(event: string, ...args: any[]): boolean {
    const targetRooms = EVENT_ROOM_MAP[event];

    if (targetRooms && targetRooms.length > 0) {
      // Emit tới các phòng mục tiêu cụ thể
      let target = io.to(targetRooms[0]);
      for (let i = 1; i < targetRooms.length; i++) {
        target = target.to(targetRooms[i]);
      }
      target.emit(event, ...args);
      return true;
    }

    // Fallback: broadcast cho tất cả nếu event không có trong danh sách
    return io.emit(event, ...args);
  };
}
