# Frontend-Backend Integration Guide

## Overview

The IGRS Frontend (`igrs_front`) has been integrated with the Fabric Backend (`Fabric_backend`) to use real-time data from the Hyperledger Fabric blockchain and PostgreSQL database.

## Architecture

```
igrs_front (Next.js)  <--->  Fabric_backend (Go)  <--->  Hyperledger Fabric + PostgreSQL
    Port 3000                    Port 5000
```

## Files Changed

### 1. API Layer - `src/lib/api.ts` (NEW)
- Complete API client for all backend endpoints
- Type-safe interfaces for all data types
- Methods for:
  - Dashboard stats
  - Land records (CRUD)
  - Mutations (Sale, Gift, Inheritance, Court)
  - Private Data (Owner, Legal, Financial)
  - Jantri Rates
  - Batches & Anchors
  - Audit Trail
  - System Health

### 2. Data Context - `src/context/DataContext.tsx` (NEW)
- Centralized state management for all API data
- Automatic caching with localStorage
- Auto-refresh on role change
- Loading states and error handling
- Methods:
  - `refreshStats()` - Dashboard metrics
  - `fetchRecords()` - Land records list
  - `refreshMutations()` - Active mutations
  - `refreshBatches()` - Batch operations
  - `refreshAnchor()` - Latest anchor
  - `fetchAudit()` - Audit trail
  - `refreshJantri()` - Jantri rates
  - `refreshAll()` - Refresh all data

### 3. Layout - `src/app/layout.tsx`
- Added `DataProvider` wrapper
- Provides data context to all pages

### 4. Dashboard - `src/app/page.tsx`
**Before:** Hardcoded stats (37 records, 5 mutations, etc.)
**After:** Dynamic data from `useData()` hook
- Real-time stats from backend
- Last updated timestamp
- Refresh button with loading state
- System info from health check

### 5. Land Records - `src/app/land/records/page.tsx`
**Before:** `MOCK_RECORDS` array with 20 fake entries
**After:** Live data from `/api/records` endpoint
- Real record IDs (REC-2026-XX, ANCHOR-TEST-LAND-XX)
- Actual owner names from blockchain
- Real status (verified, pending, frozen)
- Live filtering and search
- Refresh functionality

### 6. Audit Trail - `src/app/audit/page.tsx`
**Before:** Hardcoded `ENTRIES` array with 7 sample events
**After:** Live data from `/api/audit` endpoint
- All 65+ audit events from blockchain
- Real timestamps
- Actual user roles
- Transaction hash status
- Search and filtering

## Configuration

### Backend URL
The API base URL is configurable via environment variable:

```bash
# .env.local (create this file)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Default is `http://localhost:5000` if not set.

### Running the System

1. **Start Backend** (Port 5000):
   ```bash
   cd d:\blockchain\practice\JadeQuest\igrs\Fabric_backend
   go run main.go
   ```

2. **Start Frontend** (Port 3000):
   ```bash
   cd d:\blockchain\practice\JadeQuest\igrs\igrs_front
   npm run dev
   ```

3. **Access Application**:
   - Open http://localhost:3000
   - Select a role (e.g., Revenue Admin)
   - Data will auto-fetch from backend

## Data Flow

```
User opens app
    ↓
Role selected
    ↓
DataContext triggers refreshAll()
    ↓
Parallel API calls:
      ├─ GET /api/dashboard → Stats
      ├─ GET /api/records → Land records
      ├─ GET /api/mutations → Active mutations
      ├─ GET /api/batches → Batch status
      ├─ GET /api/anchors/latest → Latest anchor
      ├─ GET /api/audit → Audit entries
      ├─ GET /api/jantri/integration-status → Jantri
      └─ GET /api/health → System info
    ↓
Data cached to localStorage
    ↓
Components render with real data
```

## Caching Strategy

- Data cached in localStorage for 5 minutes
- Cache key: `jade_data_cache`
- Auto-invalidation on role change
- Manual refresh available via Refresh buttons

## Real-Time Statistics

| Metric | Source | Endpoint |
|--------|--------|----------|
| Total Records | Database | `/api/dashboard` |
| Verified Records | Database | `/api/analytics` |
| Pending Mutations | Database | `/api/dashboard` |
| Batches Anchored | Database | `/api/batches` |
| Digitization % | Calculated | `(verified / total) * 100` |
| Audit Events | Database | `/api/audit` |
| Fabric Status | Health Check | `/api/health` |

## Hardcoded Values Removed

### Dashboard (page.tsx)
- ❌ `const stats = [{ value: 37, ... }]` - Hardcoded
- ✅ `const { stats } = useData()` - From API

### Land Records (land/records/page.tsx)
- ❌ `const MOCK_RECORDS = Array.from({ length: 20 })` - Fake data
- ✅ `const { records } = useData()` - Real blockchain data

### Audit Trail (audit/page.tsx)
- ❌ `const ENTRIES = [{ id: '65', ... }]` - Sample events
- ✅ `const { auditEntries } = useData()` - Full audit log

### Landing Page (page.tsx)
- ❌ `const features = [{ label: '37 Records On-Chain' }]`
- ✅ Features use `stats?.total_records` dynamically

### Footer (page.tsx)
- ❌ Hardcoded: `landrecord-channel`, `landrecord v1.0`
- ✅ Dynamic: `systemInfo?.channel`, `systemInfo?.version`

## Error Handling

All components now handle:
- Loading states (spinners)
- Error messages (API failures)
- Empty states (no data)
- Retry functionality (refresh buttons)

## Role-Based Data

Data is automatically filtered and displayed based on the selected role:
- **Revenue Admin**: Full dashboard, all mutations
- **Auditor**: Read-only access, audit trails, private data
- **Bank**: Financial private data only
- etc.

## Testing the Integration

1. Start both services (backend + frontend)
2. Open browser at http://localhost:3000
3. Select "Revenue Admin" role
4. Check dashboard shows real stats (37 records, etc.)
5. Navigate to Land Records - should show real record IDs
6. Check Audit Trail - should show 65+ entries
7. Click Refresh buttons - data should update

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Loading..." forever | Check backend is running on port 5000 |
| CORS errors | Backend CORS is configured, check `NEXT_PUBLIC_API_URL` |
| Empty data | Backend may not have data - run backend tests first |
| Stale data | Click Refresh button or clear localStorage |

## API Reference

See `src/lib/api.ts` for all available methods:
- `api.getRecords()` - List land records
- `api.getMutations()` - List mutations
- `api.createMutation()` - Create new mutation
- `api.getBatches()` - List batches
- `api.getAuditTrail()` - Get audit log
- etc.

## Future Enhancements

- WebSocket for real-time updates
- Pagination for large datasets
- Search API (currently client-side filtering)
- Mutations form submission
- Private data write operations
