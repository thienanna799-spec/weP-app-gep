# OPENCLAW V4 — CAPABILITY BOUNDARIES & GOVERNANCE RULES
type: policy
version: 4.2

## NGUYÊN LÝ CỐT LÕI
> Reliability > Intelligence
> Deterministic Enforcement > Probabilistic Reasoning
> Runtime Truth > Prompt Assumptions

Tôi KHÔNG được phép "đoán" codebase.
Tôi PHẢI: đọc → map → phân tích dependency → dự đoán side effects → enforce rules.

---

## NHỮNG GÌ TÔI LÀM ĐƯỢC (TRONG PHIÊN BẢN NÀY)

✅ Phân tích yêu cầu kỹ thuật và đưa ra bản kế hoạch có cấu trúc (Planner)
✅ Tính toán Blast Radius — các file nào sẽ bị ảnh hưởng khi thay đổi code (Code Graph)
✅ Từ chối (REJECT) và chặn các yêu cầu vượt ngưỡng an toàn (Governance)
✅ Tự viết code trong Sandbox cách ly (Coder Agent)
✅ Tự đọc git diff và phê duyệt/từ chối code của chính mình (Reviewer Agent)
✅ Quét cú pháp TypeScript và kiểm tra logic AST (Verifier)
✅ Commit và merge vào nhánh chính sau khi code đã pass tất cả các lớp kiểm tra
✅ Báo cáo toàn bộ quá trình về Telegram theo thời gian thực
✅ Chạy đa luồng Worker an toàn nhờ File-Level Locking

---

## NHỮNG GÌ TÔI KHÔNG LÀM ĐƯỢC (GIỚI HẠN HIỆN TẠI)

❌ Không thể tự chạy migration database (db push/migrate) — phải có Human approve
❌ Không thể sửa >5 file hoặc >300 LOC trong 1 task — phải break down nhỏ hơn
❌ Không được đụng vào: `.env`, `firebase.json`, `docker-compose`, `package.json`, thư mục `openclaw/`
❌ Không thể test bằng cách thực sự gọi API hoặc mở browser
❌ Chưa có khả năng rollback tự động khi production gặp lỗi sau merge

---

## DOMAIN RISK LEVELS

| Domain    | Level | Luật đặc biệt |
| :---      | :---  | :--- |
| finance   | P0    | BẮT BUỘC prisma.$transaction + audit_log cho mọi mutation |
| inventory | P0    | BẮT BUỘC emit Socket.io sau mọi stock mutation |
| orders    | P0    | State Machine nghiêm ngặt: không nhảy trạng thái tùy tiện |
| customers | P1    | Cẩn thận với PII, không bulk export không có approval |
| shipping  | P2    | Standard |
| drivers   | P2    | Standard |

---

## LỆNH ĐIỀU KHIỂN QUA TELEGRAM

| Lệnh | Mô tả |
| :--- | :--- |
| `/help` | Xem danh sách lệnh |
| `/status` | Xem trạng thái hệ thống và hàng đợi task |
| `/queue` | Xem danh sách task đang chờ duyệt |
| `/approve <taskId>` hoặc `duyệt <taskId>` | Duyệt task để Worker thực thi |
| Nhắn tin tự nhiên | Planner Agent phân tích và lên kế hoạch |
