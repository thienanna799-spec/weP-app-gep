# Orders Domain – States

> Reference `ai/shared/status-flows.md` for full state machine diagram.

## Order Status

| Status | Vietnamese | Entry Condition | Exit To |
|--------|-----------|----------------|---------|
| `nhap` | Nháp | Initial creation | cho_duyet |
| `cho_duyet` | Chờ duyệt | Staff submits | da_duyet, tu_choi |
| `da_duyet` | Đã duyệt | Admin approves | dang_chuan_bi, huy |
| `tu_choi` | Từ chối | Admin rejects | nhap (re-edit), huy |
| `dang_chuan_bi` | Đang chuẩn bị | Goods being picked | cho_xuat_kho |
| `cho_xuat_kho` | Chờ xuất kho | Rolls ready at dock | dang_giao |
| `dang_giao` | Đang giao | Driver picked up | hoan_thanh, huy |
| `hoan_thanh` | Hoàn thành | Delivery confirmed | (terminal) |
| `huy` | Huỷ | Cancelled | (terminal) |

## Payment Status

| Status | Vietnamese | Condition |
|--------|-----------|-----------|
| `chua_thanh_toan` | Chưa thanh toán | No payments recorded |
| `thanh_toan_mot_phan` | Thanh toán một phần | totalPaid > 0 but < totalRevenue |
| `da_thanh_toan` | Đã thanh toán | totalPaid >= totalRevenue |

Updated automatically by `createPayment()` controller.

## Priority Levels

| Priority | Vietnamese | Treatment |
|---------|-----------|-----------|
| `thap` | Thấp | Standard queue |
| `trung_binh` | Trung bình | Default |
| `cao` | Cao | High priority |
| `khan_cap` | Khẩn cấp | Urgent – appear at top of all lists |

## OrderLog Actions (Audit Values)

```
submitted        ← Draft submitted for approval
approved         ← Admin approved
rejected         ← Admin rejected
cancelled        ← Order cancelled
status_changed   ← Generic status transition
payment_updated  ← Payment status changed
driver_assigned  ← Driver assigned to delivery
delivery_failed  ← Delivery attempt failed
completed        ← Order completed successfully
```

## DB Enum

```prisma
enum OrderStatus {
  nhap           @map("nháp")
  cho_duyet      @map("chờ duyệt")
  da_duyet       @map("đã duyệt")
  tu_choi        @map("từ chối")
  dang_chuan_bi  @map("đang chuẩn bị")
  cho_xuat_kho   @map("chờ xuất kho")
  dang_giao      @map("đang giao")
  hoan_thanh     @map("hoàn thành")
  huy            @map("huỷ")
}
```
