# PENDING ISSUE: Nút "Mời Người Dùng" Không Hoạt Động
**Trạng thái (Task State):** `DRAFT (PENDING)`
**Ngày ghi nhận:** 2026-05-12
**Domain Ảnh hưởng:** Auth, Admin
**Mức độ (Severity):** Medium

## 1. Phân tích Nguyên nhân (Mechanism)
Nút "Mời người dùng" (`t('admin.invite_user')`) tại file `app/src/modules/admin/page.tsx` hiện chỉ là một UI rỗng.
Hệ thống chưa có:
- Backend API gọi `firebase-admin` để tạo user.
- Frontend Modal nhập liệu (Tên, Email, Phân quyền, Phòng ban).

## 2. Kế hoạch Thực thi (Đã vạch sẵn)
Khi được chuyển sang `IN_PROGRESS`, AI cần thực thi các bước sau:
1. **Backend:** Tạo hàm `inviteUser` trong `users.controller.ts`. Gọi `firebaseAdmin.auth().createUser()` sau đó tạo bản ghi Prisma `User`. Đăng ký vào `users.routes.ts`.
2. **Frontend Service:** Khai báo hàm `adminService.inviteUser(...)`.
3. **Frontend UI:** Tạo component `InviteUserModal.tsx`.
4. **Tích hợp:** Gắn Modal vào nút bấm tại `page.tsx`.

## 3. Câu hỏi Cốt lõi Chưa giải quyết (Blockers)
Tại sao Task bị Pending? Vì chưa có Quyết định Kiến trúc (ADR) cho luồng khởi tạo mật khẩu:
- **Câu hỏi 1:** Khi tạo tài khoản qua Firebase Auth, có gán một mật khẩu mặc định (vd: `DriverGo@123`) không, hay tạo mật khẩu ngẫu nhiên?
- **Câu hỏi 2:** Cơ chế trao mật khẩu cho nhân viên là gì? Admin tự báo tin nhắn hay hệ thống tự động bắn Email?

*(AI nào nhận lại task này phải yêu cầu người dùng trả lời 2 câu hỏi trên trước khi chuyển sang CODE_COMPLETE).*
