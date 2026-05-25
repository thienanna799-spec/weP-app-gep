import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const backupsDir = path.resolve(process.cwd(), '../backups');

/**
 * Khởi động tiến trình lập lịch sao lưu cơ sở dữ liệu hàng ngày
 */
export function startBackupScheduler() {
  if (!fs.existsSync(backupsDir)) {
    try {
      fs.mkdirSync(backupsDir, { recursive: true });
    } catch (err) {
      console.error('[Backup Scheduler] Failed to create backups directory:', err);
    }
  }

  // Khởi động backup ngầm sau 5 giây khi server chạy (chỉ chạy một lần để đảm bảo an toàn nếu chưa có bản sao lưu hôm nay)
  setTimeout(() => {
    runBackupIfNeeded().catch(err => console.error('[Backup Scheduler] Startup backup failed:', err));
  }, 5000);

  // Kiểm tra mỗi giờ
  let lastBackupDate = '';
  setInterval(async () => {
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    // Chạy lúc 2:00 sáng hàng ngày
    if (currentHour === 2 && lastBackupDate !== currentDateStr) {
      try {
        await runBackup();
        lastBackupDate = currentDateStr;
      } catch (err) {
        console.error('[Backup Scheduler] Daily backup failed:', err);
      }
    }
  }, 60 * 60 * 1000); // 1 giờ
}

async function runBackupIfNeeded() {
  // Kiểm tra xem hôm nay đã có tệp backup nào chưa
  const currentDateStr = new Date().toISOString().split('T')[0];
  try {
    const files = fs.readdirSync(backupsDir);
    const hasBackupToday = files.some(file => file.includes(currentDateStr) && file.endsWith('.sql'));
    if (!hasBackupToday) {
      await runBackup();
    }
  } catch (err) {
    console.error('[Backup Scheduler] Check backups failed:', err);
  }
}

async function runBackup(): Promise<string> {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
    const fileName = `backup_${timestamp}.sql`;
    const filePath = path.join(backupsDir, fileName);

    // Dọn dẹp các tệp backup cũ hơn 30 ngày (Tránh phình to SSD)
    try {
      const files = fs.readdirSync(backupsDir);
      const cutoffTime = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 ngày
      for (const file of files) {
        if (file.startsWith('backup_') && file.endsWith('.sql')) {
          const filePathToClean = path.join(backupsDir, file);
          const stats = fs.statSync(filePathToClean);
          if (stats.mtimeMs < cutoffTime) {
            fs.unlinkSync(filePathToClean);
            console.log(`[Backup Scheduler] Dọn dẹp tệp sao lưu cũ: ${file}`);
          }
        }
      }
    } catch (cleanErr) {
      console.error('[Backup Scheduler] Dọn dẹp sao lưu cũ thất bại:', cleanErr);
    }

    console.log(`[Backup Scheduler] Đang khởi chạy sao lưu database MySQL vào ${filePath}...`);
    
    // Chạy lệnh mysqldump của Docker Container
    const cmd = `docker exec bocchongsoc_db mysqldump -uroot -pmatkhau bocchongsoc`;
    const writeStream = fs.createWriteStream(filePath);

    const child = exec(cmd);
    if (child.stdout) {
      child.stdout.pipe(writeStream);
    }

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[Backup Scheduler] Sao lưu database thành công: ${fileName}`);
        resolve(filePath);
      } else {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Xóa tệp lỗi dở dang
          }
        } catch (e) {}
        reject(new Error(`mysqldump kết thúc với mã lỗi ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}
