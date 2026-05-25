/**
 * GEP ERP - Frontend Security Guard (Cấp Bảo mật Cao nhất)
 * Ngăn chặn người dùng xâm nhập, chọc ngoáy, debug hoặc sửa đổi giao diện.
 */

export function initSecurityGuard() {
  // Chỉ kích hoạt khi chạy trên môi trường Production (Build thực tế) để tránh ảnh hưởng lúc Dev
  if (!(import.meta as any).env.PROD) {
    console.log('🛡️ Security Guard is in standby (Development mode).');
    return;
  }

  console.log('🛡️ Security Guard is active (Max Hardening).');

  // 1. Vô hiệu hóa Click chuột phải (Context Menu)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // 2. Vô hiệu hóa các phím tắt mở DevTools & Phím tắt nhạy cảm
  document.addEventListener('keydown', (e) => {
    // Chặn F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Chặn Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Windows)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
      e.preventDefault();
      return false;
    }

    // Chặn Cmd+Opt+I, Cmd+Opt+J, Cmd+Opt+C (Mac)
    if (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }

    // Chặn Ctrl+U / Cmd+U (Xem mã nguồn - View Source)
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      return false;
    }

    // Chặn Ctrl+S / Cmd+S (Lưu trang web về máy)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      return false;
    }
  });

  // 3. Vô hiệu hóa Console logging trong production để bảo vệ dữ liệu nhạy cảm
  const noop = () => {};
  (window.console as any).log = noop;
  (window.console as any).info = noop;
  (window.console as any).warn = noop;
  (window.console as any).error = noop;
  (window.console as any).debug = noop;
  (window.console as any).clear = noop;



  // 5. Anti-Debugger Loop: Tạo vòng lặp Debug liên tục để đóng băng trình duyệt nếu cố tình Inspect
  const antiDebugger = () => {
    const startTime = performance.now();
    // eslint-disable-next-line no-debugger
    debugger; 
    const endTime = performance.now();
    
    // Nếu mất nhiều hơn 100ms để chạy qua lệnh debugger -> Chứng tỏ DevTools đang mở và bị pause
    if (endTime - startTime > 100) {
      triggerLockout();
    }
  };

  // Chạy kiểm tra debugger lặp lại định kỳ mỗi 500ms
  setInterval(antiDebugger, 500);
}

function triggerLockout() {
  // Chuyển hướng người dùng sang trang trắng để vô hiệu hóa toàn bộ tương tác
  window.location.replace('about:blank');
}
