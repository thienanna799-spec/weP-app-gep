# Drivers Domain – Workflow

## Workflow 1: Daily Shift (Check-in / Check-out)

```
Morning – Driver starts shift:

1. Driver opens app → selects vehicle
2. Driver takes odometer photo:
   POST /daily-logs/check-in {
     vehicleId,
     startKm,
     startKmPhoto: base64,
     checkInTime: now()
   }
   → DailyVehicleLog created: status='active'
   → Vehicle.status → in_use
   → Driver.status → available
   → io.emit('driver_vehicle_updated', { action: 'check_in', driverId, plateNumber })

Evening – Driver ends shift:
   POST /daily-logs/check-out {
     dailyLogId,
     endKm,
     endKmPhoto: base64
   }
   → DailyVehicleLog.status: active → completed
   → totalKm = endKm - startKm
   → Vehicle.status → available
   → Driver.status → leave
   → io.emit('driver_vehicle_updated', { action: 'check_out' })
```

## Workflow 2: Fuel Logging (with OCR)

```
Driver refuels vehicle:

1. Driver fills fuel, gets receipt
2. Driver opens app → Fuel Log tab
3. POST /fuel-logs {
     amount: 500000,    ← VND declared
     volume: 25,        ← liters
     mileage: 12500,    ← current odometer
     receiptUrl: base64_photo,
     date: today
   }
   → FuelLog created in DB

4. OCR pipeline triggered automatically:
   OcrQueue.addJob('fuel_receipt_audit', { driverId, referenceId: log.id, imageUrl, declaredValue: amount })
   → Runs in background
   → Compares OCR extracted amount vs declared amount
   → If mismatch > 1,000 VND:
     → OcrAuditLog { riskLevel: 'high', reviewStatus: 'pending' }
     → NotificationLog created (admin alert)
   → If match:
     → OcrAuditLog { riskLevel: 'low', reviewStatus: 'approved' }
```

## Workflow 3: Repair / Maintenance Logging

```
Driver has vehicle repaired:

POST /repair-logs {
  plateNumber: "51A-12345",
  repairType: "Thay lốp",
  description: "Lốp phải trước bị xịt",
  amount: 800000,
  mileage: 12600,
  shopName: "Tiệm Minh Phát",
  damagePhotos: [base64],
  receiptPhoto: base64,
  date: today
}
→ VehicleMaintenance created: status='pending'
→ Auto-creates Vehicle if plate not found
→ OCR NOT triggered for repair logs (gap)
```

## Workflow 4: GPS Location Update

```
Driver app sends location every few minutes during delivery:

PUT /drivers/:id/location { lat, lng }
→ GpsLog entry: { driverId, lat, lng, timestamp }
→ io.emit('driver_vehicle_updated', { action: 'gps_update', driverId, lat, lng })
→ Admin web: driver position updates on map
```

## Workflow 5: OCR Audit Review (Admin)

```
Admin reviews flagged OCR audit:

GET /ocr-audit?riskLevel=high&reviewStatus=pending
→ List of unreviewed mismatch cases

For each case:
  Admin views: driver name, document type, declared vs OCR value, image
  PATCH /ocr-audit/:id/review { reviewStatus: 'approved' | 'rejected' | 'escalated' }
  → OcrAuditLog.reviewStatus updated
  → If rejected: trustScore impacted at next calculation
```

## Workflow 6: Driver Profile Setup (APK)

```
New driver downloads APK, logs in with Google:
→ User.role must be 'driver'
→ GET /drivers/me → auto-creates Driver record if missing
→ Driver updates profile:
  PUT /drivers/me { name, phone, address, licenseNo, ... }
  POST /drivers/me/documents { idCardPhoto, licensePhoto, ... }
→ Admin verifies documents on web
→ Admin activates driver: PUT /drivers/:id { status: 'available' }
```
