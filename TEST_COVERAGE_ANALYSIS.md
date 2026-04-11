# Test Coverage Analysis

**Date:** 2026-03-25
**Branch:** test-gap

## Executive Summary

The ehr-wallet project has **significant test coverage gaps**. Only **4 test files** exist covering a small fraction of the codebase. Most critical API routes and lib utilities have zero test coverage.

---

## Current Test Coverage (4 files)

| Test File | Coverage |
|-----------|----------|
| `__tests__/lib/fhir/converters.test.ts` | lib/fhir/converters.ts |
| `__tests__/api/fhir/patient.test.ts` | pages/api/fhir/Patient (partial) |
| `__tests__/api/ipfs/index.test.ts` | pages/api/ipfs/index.ts |
| `__tests__/api/ipfs/pinata-diagnostic/index.test.ts` | pages/api/ipfs/pinata-diagnostic/index.ts |

---

## API Routes Coverage (16 total)

### ✅ Tested (2)
- `pages/api/ipfs/index.ts`
- `pages/api/ipfs/pinata-diagnostic/index.ts`

### ❌ Not Tested (14)

| Route | Priority |
|-------|----------|
| `pages/api/auth/[...nextauth].ts` | **HIGH** |
| `pages/api/auth/register.ts` | **HIGH** |
| `pages/api/health.ts` | **HIGH** |
| `pages/api/shared-data/index.ts` | **HIGH** |
| `pages/api/shared-data/[id].ts` | **HIGH** |
| `pages/api/shared-data/find-by-cid.ts` | **HIGH** |
| `pages/api/shared-data/record-access.ts` | **HIGH** |
| `pages/api/access-logs/index.ts` | **MEDIUM** |
| `pages/api/access-logs/pinata.ts` | **MEDIUM** |
| `pages/api/fhir/Patient/index.ts` | **MEDIUM** |
| `pages/api/fhir/Patient/[id].ts` | **MEDIUM** |
| `pages/api/fhir/Patient/[id]/[operation].ts` | **MEDIUM** |
| `pages/api/fhir/Encounter/index.ts` | **MEDIUM** |
| `pages/api/fhir/metadata.ts` | **LOW** |

---

## Lib Files Coverage (19 total)

### ✅ Tested (1)
- `lib/fhir/converters.ts`

### ❌ Not Tested (18)

| File | Priority |
|------|----------|
| `lib/auth.ts` | **HIGH** |
| `lib/auth-compatibility.ts` | **HIGH** |
| `lib/utils.ts` | **HIGH** |
| `lib/db.ts` | **HIGH** |
| `lib/db-utils.ts` | **HIGH** |
| `lib/web3/ipfs.ts` | **HIGH** |
| `lib/web3/pinata.ts` | **HIGH** |
| `lib/web3/contract.ts` | **MEDIUM** |
| `lib/sync-users.ts` | **MEDIUM** |
| `lib/export-utils.ts` | **MEDIUM** |
| `lib/offline-auth.ts` | **MEDIUM** |
| `lib/seed-offline-db.ts` | **LOW** |
| `lib/pwa-utils.ts` | **LOW** |
| `lib/fhir/validation.ts` | **LOW** |
| `lib/theme.ts` | **LOW** (likely static config) |
| `lib/prisma.ts` | **LOW** |
| `lib/fhir/types.ts` | **LOW** (types only) |
| `lib/web3/mock-contract.ts` | **LOW** (mock/test utility) |

---

## Priority Recommendations

### P0 - Critical (Auth & Data Access)
1. **Auth API** - `pages/api/auth/[...nextauth].ts`, `pages/api/auth/register.ts`
   - Security-critical endpoints handling user authentication
   - Test: registration, login, session management, error handling

2. **Shared Data API** - All `pages/api/shared-data/*` routes
   - Core functionality for record sharing
   - Test: CRUD operations, CID lookup, access grants

3. **Health API** - `pages/api/health.ts`
   - Simple but important for monitoring
   - Test: health check returns 200

### P1 - High Value (Core Utilities)
1. **lib/auth.ts** - Authentication utilities
2. **lib/utils.ts** - Common utilities
3. **lib/db.ts** / **lib/db-utils.ts** - Database operations

### P2 - Medium Priority
- FHIR endpoints (Patient, Encounter, metadata)
- Access logs APIs
- Web3 utilities

---

## Coverage Metrics

| Category | Total | Tested | Coverage |
|----------|-------|--------|----------|
| API Routes | 16 | 2 | 12.5% |
| Lib Files | 19 | 1 | 5.3% |
| **Overall** | **35** | **3** | **8.6%** |

---

## Next Steps

1. Add tests for P0 critical endpoints (auth, shared-data, health)
2. Add tests for P1 utility files (auth, utils, db)
3. Add tests for P2 remaining endpoints
4. Consider adding integration tests with a test database

---

## Notes

- This analysis was generated programmatically
- Test patterns follow the existing structure in `__tests__/api/fhir/patient.test.ts`
- Mock-based unit testing approach is used for API routes
