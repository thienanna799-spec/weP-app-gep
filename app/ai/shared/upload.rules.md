# Upload Rules – Files & Images

## Current Storage Strategy

All images/files stored as **base64 data URLs in MySQL** (`@db.LongText`).

### Where Images Are Stored

| Model | Field | Content |
|-------|-------|---------|
| Driver | avatar, idCardPhoto, idCardPhotoBack, licensePhoto, licensePhotoBack | base64 images |
| FuelLog | receiptUrl | base64 photo |
| VehicleMaintenance | receiptUrl, damagePhotoUrl | base64 photos |
| DailyVehicleLog | startKmPhoto, endKmPhoto | base64 photos @db.LongText |
| DailyFuelEntry | fuelKmPhoto, fuelCostPhoto, fuelPricePhoto | base64 photos @db.LongText |
| ProductRoll | (none – QR code is text) | |
| DeliveryLog | imageUrl, signatureUrl | base64 or URL |
| Material | imageUrl | base64 or URL |
| OcrAuditLog | imageUrl | base64 or URL |

### Physical Files

Located at: `<project_root>/uploads/`
Served via: `app.use('/uploads', express.static(...))`
Access URL: `/uploads/filename.ext`

## Upload Size Limits

```typescript
app.use(express.json({ limit: '25mb' }));
```
Maximum request body: **25MB**.
Maximum single base64 image: ~18MB raw (base64 encoding adds ~33% overhead).

## Upload Flow (Mobile APK)

```
Driver opens app → takes photo
  → Photo converted to base64 string on device
  → Sent in JSON body to API
  → Stored in LongText field
  → OCR queue triggered if applicable
```

## Rules for AI When Adding Image Fields

1. **Always use `@db.LongText`** for base64 image fields
2. **Never use `@db.Text`** for photos (max 65KB – too small)
3. **Always mark fields as `String?`** (optional) – users may not upload immediately
4. **Add to upload limit check** – if new image fields increase payload size, update Express limit
5. **Trigger OCR if applicable** – fuel/repair receipts should queue OCR job

## Recommended Future Architecture

Replace base64-in-DB with object storage:

```
Photo taken → Upload to Cloudflare R2 / AWS S3
  → Get public URL
  → Store URL string (not base64) in MySQL field
  → Field type changes from @db.LongText to @db.Text or even String
```

Migration required: Convert existing base64 fields to URLs.

## Picking Slip & Invoice PDFs

Generated server-side via HTML template → PDF:
- `server/src/services/picking-slip.service.ts`
- `server/src/services/invoice.service.ts`

Not stored in DB. Generated on-demand.
Can be sent via Telegram: `POST /invoices/:orderId/send-telegram`
