# Drivers Domain – Skill Map

## What This Domain Does
Manages GEP's delivery fleet: drivers, vehicles, daily operations, GPS tracking, fuel logging, and OCR-based fraud detection. This is the most operationally complex domain.

## Core Models

### Driver
```prisma
Driver {
  code, name, phone, email, address
  dob, idCard, licenseNo, licenseType, licenseExpiry
  joinedDate, notes
  status          // available | delivering | leave | inactive | blocked
  
  // Photos (base64 @db.LongText)
  avatar, idCardPhoto, idCardPhotoBack
  licensePhoto, licensePhotoBack
  
  userId          // Links to Firebase User (for APK login)
  vehicleId       // Currently assigned vehicle
  
  // Relations
  vehicle, fuelLogs, dailyLogs, gpsLogs
}
```

### Vehicle
```prisma
Vehicle {
  plateNumber (unique), type, capacity
  year, condition, currentMileage
  registrationDate, insuranceExpiry
  status    // available | in_use | maintenance | broken | inactive
  activeLogId  // Current DailyVehicleLog
  
  // Relations
  driver, maintenances, dailyLogs
}
```

### DailyVehicleLog – Shift Tracking
```prisma
DailyVehicleLog {
  logDate           // YYYY-MM-DD (unique per vehicle per day)
  vehicleId, driverId
  plateNumber, driverName   // Snapshot at check-in time
  
  // Check-in
  startKm, startKmPhoto, checkInTime
  
  // Check-out
  endKm, endKmPhoto, checkOutTime
  totalKm           // Computed: endKm - startKm
  
  status: "active" | "completed"
  fuelEntries: DailyFuelEntry[]
}
```

### FuelLog – Old Fuel Tracking
```prisma
FuelLog {
  driverId, vehicleId, userId
  amount          // VND cost
  volume          // Liters
  mileage         // KM at time of refuel
  receiptUrl      // base64 photo → triggers OCR
  date
}
```

### GpsLog – Location Tracking
```prisma
GpsLog { driverId, lat, lng, timestamp }
```

## APIs

| Method | Endpoint | Purpose |
|--------|---------|---------|
| GET | /drivers | All drivers with trust scores + today status |
| GET | /drivers/me | Current driver (from JWT) – auto-creates if missing |
| GET | /drivers/locations | All recent GPS pings |
| GET | /drivers/leaderboard | Top/bottom drivers by trust score |
| GET | /drivers/:id | Single driver |
| GET | /drivers/:id/locations | GPS history |
| GET | /drivers/:id/stats | Delivery KPIs |
| POST | /drivers | Create driver |
| PUT | /drivers/:id | Update driver |
| PUT | /drivers/me | Driver self-update (from APK) |
| DELETE | /drivers/:id | Delete driver (admin+) |
| PUT | /drivers/:id/location | Update GPS (from APK) |
| POST | /drivers/me/documents | Upload ID/license photos |
| GET | /vehicles | All vehicles |
| POST | /vehicles | Create vehicle |
| PUT | /vehicles/:id | Update vehicle |
| GET | /vehicles/:id/maintenances | Maintenance history |
| POST | /vehicles/:id/maintenances | Add maintenance |
| GET | /maintenances | All maintenances |
| GET | /fuel-logs | Fuel log history |
| POST | /fuel-logs | Add fuel log (triggers OCR) |
| POST | /repair-logs | Add repair log |
| GET | /daily-logs/* | Daily check-in/out logs |

## Trust Score Algorithm

Computed on-demand from `OcrAuditLog`:
```
start: 100
- 20 per duplicate_receipt
- 10 per rejected review
-  5 per medium risk (unreviewed)
min: 0
```

## Key Business Rules

1. Drivers **auto-created** when user with driver role calls `/drivers/me`
2. Vehicle status **auto-fixed** during `GET /vehicles` (currently a bug – should be job)
3. Driver status **auto-synced** during `GET /drivers` based on active orders + daily log
4. Fuel receipt upload → OCR queue triggered automatically
5. Daily log is unique per vehicle per day (`@@unique([vehicleId, logDate])`)

## Realtime Events

| Event | Trigger |
|-------|---------|
| `driver_vehicle_updated` action: `gps_update` | GPS log created |
| `driver_vehicle_updated` action: `driver_created` | New driver registered |
| `driver_vehicle_updated` action: `driver_updated` | Driver profile updated |
| `driver_vehicle_updated` action: `vehicle_created/updated` | Vehicle change |
| `user_updated` type: `driver_profile_update` | Driver self-updates from APK |

## Cross-Domain Connections

```
Driver ──→ ShippingOrder (assigned driver for delivery)
Driver ──→ DailyVehicleLog (daily shift tracking)
Driver ──→ FuelLog (fuel expenses)
Driver ──→ GpsLog (location history)
Driver ──→ OcrAuditLog (document fraud detection)
Driver ──→ User (linked by userId for APK login)
Vehicle ──→ DailyVehicleLog (which vehicle on which day)
Vehicle ──→ VehicleMaintenance (repair history)
```
