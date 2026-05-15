# Memory Update Protocol — GEP ERP
type: policy
scope: antigravity + openclaw
version: 1.1

## Luồng đầy đủ sau mỗi tính năng

```
Tính năng xây xong (bởi Antigravity hoặc dev thủ công)
        ↓
[BƯỚC 1] OpenClaw rà soát toàn bộ code
        ↓
Báo cáo kết quả kiểm tra:
  ✅ PASS — Không phát hiện lỗi hoặc lỗi tiềm ẩn
  ⚠️  WARN — Có vấn đề cần xem xét (không block)
  ❌ FAIL — Có lỗi nghiêm trọng, cần sửa trước khi merge
        ↓
[BƯỚC 2] Bạn xem báo cáo và quyết định
        ↓
Nếu PASS/WARN mà bạn chấp nhận:
  → Bạn nói "ok cập nhật" → Antigravity update .md
  → Bạn nói "không cần" → Bỏ qua
```

## OpenClaw kiểm tra những gì (Checklist)

| Hạng mục | Ví dụ câu hỏi cụ thể |
| :--- | :--- |
| **P0 Domain rules** | Finance/Inventory mutation có dùng `$transaction` không? |
| **Audit log** | P0 mutation có ghi `userActivityLog` không? |
| **Socket emit** | Sau khi update stock có emit `inventory_updated` không? |
| **Error handling** | Handler có dùng `asyncHandler` không? Có `sendError` đúng chuẩn không? |
| **Blast radius** | Code mới có ảnh hưởng ngầm đến module khác không? |
| **Lỗi tiềm ẩn** | Có race condition? Có N+1 query? Có missing null check? |
| **Convention** | Có đúng pattern trong `backend-patterns.md` không? |

## Format báo cáo của OpenClaw (gửi về Telegram)

```
🔍 CODE REVIEW REPORT — [Tên tính năng]

✅ PASS / ⚠️ WARN / ❌ FAIL

[Danh sách vấn đề nếu có]
⚠️  orders.controller.ts:L45 — Missing $transaction cho P0 mutation
⚠️  shipping.controller.ts:L12 — Socket emit không gửi đủ payload

[Nếu PASS]
💾 Phát hiện tri thức mới nên ghi vào memory:
- ai/shared/socket-events.md — thêm event `reconciliation.done`
- ai/domains/inventory/workflow.md — thêm bước reconciliation

Bạn muốn update .md không?
```


Sau mỗi tính năng hoàn thành, Antigravity CHỦ ĐỘNG kiểm tra và báo cáo nếu phát hiện:

| Loại thay đổi | Ví dụ | File cần update |
| :--- | :--- | :--- |
| Socket event mới | `inventory.summary.changed` | `ai/shared/socket-events.md` |
| API endpoint mới | `POST /api/inventory/weekly` | `ai/shared/backend-patterns.md` |
| Workflow mới | Reconciliation flow | `ai/domains/{domain}/workflow.md` |
| Convention mới | Pagination format thay đổi | `ai/shared/backend-patterns.md` |
| State mới | Order có trạng thái `partial_return` | `ai/domains/orders/states.md` |
| Governance rule mới | Finance cần thêm loại audit | `ai/agents/openclaw/v4-capabilities.md` |
| Dependency mới | Service A phụ thuộc Service B | `ai/system/topology/` |

## Phân công vai trò

| Vai trò | Người thực hiện |
| :--- | :--- |
| Phát hiện cần update memory | **Antigravity** (chủ động) |
| Quyết định có update không | **Bạn** |
| Viết / update file .md | **Antigravity** |

## Lệnh của bạn

- `ok cập nhật` / `update md đi` → Antigravity viết file .md ngay
- `không cần` / `bỏ qua` → Skip, không cập nhật

## Format báo cáo của Antigravity

Sau mỗi task xong, nếu cần update, tôi sẽ nói:

> 💾 **Memory Update Suggestion**
> Vừa thêm: [mô tả ngắn]
> Nên cập nhật:
> - `ai/shared/socket-events.md` — thêm event X
> - `ai/domains/inventory/workflow.md` — thêm bước Y
>
> Bạn muốn update không?
