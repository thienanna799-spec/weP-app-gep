# Shipping Domain – Workflow

## Primary Delivery Workflow

```
Step 1: CREATE SHIPPING ORDER
  Order is approved + rolls picked (Order status: cho_xuat_kho)
  Admin creates shipment:
  POST /shipping {
    orderId,
    customerName, customerPhone, customerAddress,
    deliveryDeadline
  }
  → ShippingOrder.status: cho_xuat_kho

Step 2: SCAN ROLLS INTO SHIPMENT
  Warehouse staff scans each roll QR:
  POST /shipping/:id/scan { qrCode }
  → ShippingOrderItem created
  → ProductRoll.status: da_giu_cho_don → da_xuat_kho
  → ShippingOrder.totalRolls incremented
  → status: dang_chuan_bi (auto on first scan)

Step 3: GENERATE PICKING SLIP
  Print document for driver:
  GET /shipping/:id/picking-slip/pdf
  → PDF with: customer info, roll list, QR codes, driver signature field

Step 4: ASSIGN DRIVER
  Admin assigns driver + vehicle:
  PUT /shipping/:id/assign-driver {
    driverId, driverName, vehicleId, plateNumber
  }
  → status: da_ban_giao_tai_xe
  → io.emit('shipping_updated', { shippingOrderId, status })
  → io.emit('driver_vehicle_updated', { action: 'assigned' })

Step 5: DRIVER PICKUP
  Driver confirms pickup at warehouse:
  POST /shipping/:id/delivery-log {
    action: "picked_up",
    note: "Đã nhận hàng tại kho",
    latitude, longitude
  }
  → status: dang_giao
  → shippedAt = now()
  → io.emit('shipping_updated', ...)

Step 6A: SUCCESSFUL DELIVERY ✅
  Driver delivers and gets customer signature:
  POST /shipping/:id/delivery-log {
    action: "delivered",
    imageUrl: base64_photo,
    signatureUrl: base64_signature,
    latitude, longitude
  }
  → status: giao_thanh_cong
  → deliveredAt = now()
  → Order.status: hoan_thanh
  → io.emit('shipping_updated', ...)
  → io.emit('order_updated', ...)

Step 6B: FAILED DELIVERY ❌
  Driver cannot deliver:
  POST /shipping/:id/delivery-log { action: "failed", note: reason }
  PUT /shipping/:id/return
  → status: giao_that_bai → hoan_tra
  → ReturnRequest created automatically
  → Resolution: reship | refund | exchange | cancel
```

## Contact Log Workflow (During Delivery)

```
Driver tries to reach customer:
POST /orders/:id/contact-logs {
  type: "call",
  phoneNumber: "0901234567",
  result: "no_answer",
  duration: 45
}
→ ContactLog created (append-only)
→ Driver can try multiple times
```

## Re-ship Workflow

```
ReturnRequest resolved as 'reship':
→ New ShippingOrder created
→ ReturnRequest.reshipOrderId = new shipping order id
→ Workflow restarts from Step 4 (assign driver)
```

## GPS Tracking During Delivery

```
Driver app sends location every N minutes:
PUT /drivers/:id/location { lat, lng }
→ GpsLog entry created
→ io.emit('driver_vehicle_updated', { action: 'gps_update', lat, lng })
→ Admin web map updates
```
