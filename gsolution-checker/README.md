# 📦 G-Solution Order Status Checker

Script tự động kiểm tra trạng thái đơn hàng trên g-solution.vn, cập nhật Google Sheet và gửi báo cáo qua Telegram.

## 🚀 Hướng dẫn cài đặt

### Bước 1: Cài đặt dependencies
```bash
cd d:\weP-APP-main\gsolution-checker
npm install
```

### Bước 2: Deploy Google Apps Script

1. Mở Google Sheet: [Link Sheet](https://docs.google.com/spreadsheets/d/199Ni378nqbaj5sjqRuD5z5RAcx1goAejHe8Jb7_AMc0/edit?gid=1468560973)
2. Vào menu **Extensions → Apps Script**
3. Xoá toàn bộ code mặc định
4. Copy toàn bộ nội dung file `gas-script.js` và paste vào
5. Click **Deploy → New deployment**
6. Chọn type: **Web app**
7. Cài đặt:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy** → **Authorize access** → Cho phép
9. Copy **Web app URL** (dạng: `https://script.google.com/macros/s/...../exec`)

### Bước 3: Cấu hình .env

Mở file `.env` và paste URL từ bước 2 vào:
```
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

### Bước 4: Chạy script

```bash
# Test Telegram trước
node checker.js --test-telegram

# Chạy kiểm tra đơn hàng
node checker.js
```

## 📊 Cấu trúc Google Sheet

| Cột A | Cột B | Cột C |
|-------|-------|-------|
| Ngày (DD/MM/YYYY) | Mã vận đơn (Waybill) | Trạng thái (tự động cập nhật) |

## 🔔 Telegram Bot
- Bot: @GIPTHbot
- Báo cáo tự động gửi sau khi kiểm tra xong

## ⚙️ Cấu hình nâng cao

Trong `checker.js`, có thể chỉnh:
- `searchDelay`: Thời gian chờ sau mỗi lần tìm kiếm (ms)
- `batchSize`: Số đơn cập nhật 1 lần vào Sheet
- `headless`: `true` = chạy ẩn, `false` = hiện trình duyệt
