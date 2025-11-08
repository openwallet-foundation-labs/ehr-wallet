# EHR Wallet PRD (Updated with Industry Best Practices)

## 1. Introduction

EHR Wallet is a decentralized application that empowers patients to securely own, manage, and share their health data. By leveraging blockchain technology and FHIR standards, we provide a transparent, tamper-proof, and **interoperable** platform for patients to control who can access their sensitive medical information.

**Vision:** To create the most advanced, standards-compliant blockchain health wallet that enables true patient data ownership while maintaining interoperability with existing healthcare systems (Epic, Cerner, etc.).

## 2. Current Features (Implemented)

Based on the current codebase, the application includes:

### Core Features
*   **Patient Authentication:** Dual-mode authentication (traditional + Web3/Ethereum wallet)
*   **Patient Dashboard:** Central hub with tabs for Shared Data, Health Data, Appointments, and Medical Records
*   **Data Sharing:** Multi-step wizard for sharing health data with time-limited access and optional password protection
*   **Access Logs:** Comprehensive record showing who accessed data, when, view counts, and IPFS pin status
*   **Blockchain Integration:** Ethereum smart contracts for access control with IPFS storage
*   **Wallet:** MetaMask integration for blockchain interactions
*   **Settings:** Account management and preferences
*   **PWA Support:** Installable progressive web app with offline capabilities
*   **Offline Authentication:** Works without internet connection using IndexedDB

### Technical Features (Recently Added)
*   **✅ FHIR R4 Support:** Full HL7 FHIR R4 implementation for healthcare interoperability
    *   FHIR REST API endpoints (`/api/fhir/*`)
    *   Patient, Encounter, Appointment resources
    *   Bidirectional converters (internal models ⟷ FHIR)
    *   FHIR Bundle support for aggregated records
    *   Enhanced smart contract (`FHIRAccessControl.sol`) with FHIR metadata
    *   Validation utilities for FHIR resources
    *   Comprehensive test coverage
*   **Appointment Scheduling:** Full scheduling system with providers, time slots, and appointment types
*   **Visit Tracking:** Record and manage patient visits with notes
*   **Document Upload:** Support for multiple file types (PDFs, images, Office docs) with IPFS storage
*   **QR Code Sharing:** Generate QR codes for easy data sharing
*   **Toast Notifications:** User feedback for all actions
*   **Real-time Progress Tracking:** Detailed upload progress with technical logs

## 3. Competitive Analysis & Improvement Opportunities

Based on research of leading blockchain health projects (MedRec, Patientory, Medicalchain, and 2024 academic research), we've identified key areas for improvement:

### Comparison Matrix

| Feature | EHR Wallet | MedRec (MIT) | Patientory | Medicalchain | Priority |
|---------|-----------|--------------|------------|--------------|----------|
| **FHIR/HL7 Support** | ✅ Full R4 | ❌ None | ⚠️ Limited | ⚠️ Limited | ✅ DONE |
| **Emergency Access** | ❌ None | ⚠️ Basic | ❌ None | ✅ Bracelet | 🔴 CRITICAL |
| **Provider Verification** | ❌ None | ⚠️ Basic | ⚠️ Basic | ✅ Full | 🔴 HIGH |
| **HIPAA Compliance** | ⚠️ Partial | ⚠️ Limited | ✅ Full | ✅ Full | 🔴 CRITICAL |
| **Zero-Knowledge Proofs** | ❌ None | ❌ None | ❌ None | ❌ None | 🟡 MEDIUM |
| **DID/SSI** | ❌ None | ❌ None | ⚠️ Tokens | ⚠️ Limited | 🟡 MEDIUM |
| **Telemedicine** | ❌ None | ❌ None | ⚠️ Limited | ✅ Full | 🟡 MEDIUM |
| **Data Marketplace** | ❌ None | ✅ Mining | ✅ Tokens | ✅ MedTokens | 🟢 LOW |
| **Multi-Chain** | ❌ Ethereum | ⚠️ Limited | ✅ Multiple | ⚠️ Limited | 🟡 MEDIUM |
| **Offline PWA** | ✅ Full | ❌ None | ❌ None | ❌ None | ✅ UNIQUE! |

## 4. Proposed Features & Roadmap

### 🔴 PRIORITY 1: Critical Compliance & Safety (Q2 2025)

#### 4.1. HIPAA Compliance Framework
**Status:** Foundation laid, needs full implementation
**Impact:** Legal requirement for healthcare in the US
**Timeline:** 8-10 weeks

**Features:**
- **Smart Contract-Based Audit Logging**
  - Log all PHI access with timestamp, accessor, reason, and data category
  - Immutable blockchain audit trail
  - Automatic OperationOutcome generation for violations

- **Business Associate Agreements (BAA) Management**
  - Digital BAA signing and tracking
  - Automated compliance checks
  - Provider attestation storage

- **Minimum Necessary Standard Enforcement**
  - Granular data field selection (not just categories)
  - Purpose-based access control (treatment vs. billing vs. research)
  - Automatic data minimization

- **Breach Notification System**
  - Automated alerts for suspicious access patterns
  - Email/SMS notifications to patients
  - Regulatory reporting templates

- **Data Retention Policies**
  - Smart contract-enforced retention periods
  - Automatic archival and deletion
  - Patient-controlled retention preferences

**Success Metrics:**
- HIPAA Security Rule compliance: 100%
- Audit log completeness: 100%
- Breach notification time: < 60 seconds

#### 4.2. Emergency Access Protocols
**Status:** Not implemented
**Impact:** Patient safety - could save lives
**Timeline:** 6-8 weeks

**Features:**
- **Emergency Wearable/Bracelet Integration**
  - QR code on medical bracelet linking to DID
  - NFC tag support for unconscious patients
  - Biometric authentication backup (fingerprint on behalf of patient)

- **Break-Glass Access**
  - EMT/Emergency room override access
  - Automatic audit trail with justification requirement
  - Patient notification when conscious
  - Time-limited (4-hour default)

- **Family Doctor Delegation**
  - Pre-authorized primary physician access
  - Smart contract delegation mechanism
  - Automatic expiry and renewal

- **Emergency Contact Multi-Signature**
  - 2-of-3 family member approval for emergency access
  - SMS/Email verification
  - Time-bound emergency grants

**Technical Implementation:**
```solidity
struct EmergencyAccess {
    address[] emergencyContacts;
    address primaryPhysician;
    uint8 requiredApprovals;
    bool biometricOverride;
    uint256 breakGlassExpiry; // 4 hours default
}

function requestEmergencyAccess(
    uint256 patientId,
    bytes memory biometricProof,
    string memory justification
) external returns (uint256 accessId);
```

**Research Citations:**
- Medicalchain emergency bracelet system
- 2024 paper: "Emergency Medical Access Control System Based on Public Blockchain"
- Blockchain-based secret-data sharing for emergency conditions

**Success Metrics:**
- Emergency access response time: < 30 seconds
- False positive rate: < 0.1%
- Patient satisfaction with emergency features: > 95%

#### 4.3. Provider Verification System
**Status:** Not implemented
**Impact:** Trust and fraud prevention
**Timeline:** 4-6 weeks

**Features:**
- **Medical License Verification**
  - Integration with National Provider Identifier (NPI) database
  - Verifiable Credentials for licenses
  - Real-time license status checking
  - State medical board API integration

- **Institutional Affiliation Verification**
  - Hospital/clinic verification
  - Department and role validation
  - Temporary privileges tracking

- **Reputation System**
  - On-chain provider ratings (privacy-preserving)
  - Patient feedback aggregation
  - Peer endorsements

- **Revocation Lists**
  - Real-time checking of suspended/revoked licenses
  - Automatic access revocation
  - Alert system for status changes

**Technical Implementation:**
```typescript
interface ProviderVerification {
  npi: string; // National Provider Identifier
  licenseNumber: string;
  issuingState: string;
  verifiableCredential: VerifiableCredential;
  institutionalAffiliation: {
    organization: string;
    department: string;
    role: string;
    verified: boolean;
  };
  reputation: {
    rating: number; // 0-5
    reviewCount: number;
    endorsements: string[]; // DIDs of endorsing peers
  };
}
```

**Success Metrics:**
- Provider verification rate: 100%
- Fraud detection: > 99.9%
- Verification time: < 5 minutes

---

### 🟠 PRIORITY 2: Advanced Privacy & Security (Q3 2025)

#### 4.4. Zero-Knowledge Proofs (ZKPs)
**Status:** Not implemented
**Impact:** Privacy-preserving verification - competitive differentiation
**Timeline:** 10-12 weeks

**Use Cases:**
1. **Age Verification** without revealing birthdate
2. **Eligibility Checks** (e.g., "patient has diabetes") without exposing full medical history
3. **Insurance Verification** without sharing policy details
4. **Credential Verification** (e.g., "licensed physician") without revealing identity

**Technical Implementation:**
- Use **zk-SNARKs** via snarkjs/circom libraries
- **Performance Targets:**
  - Proof generation: < 2 seconds
  - Proof verification: < 100ms
  - Proof size: < 2KB
  - Gas cost: ~93,000 units (acceptable for healthcare)

**Example Circuit:**
```javascript
// Age verification circuit
circuit AgeVerifier() {
    signal input birthdate; // Private
    signal input currentDate; // Public
    signal input minimumAge; // Public
    signal output isOldEnough; // Public

    component ageCalculator = CalculateAge();
    ageCalculator.birthdate <== birthdate;
    ageCalculator.currentDate <== currentDate;

    isOldEnough <== ageCalculator.age >= minimumAge;
}
```

**Research Citations:**
- 2024 paper: "Blockchain Based Zero Knowledge Proof Protocol For Privacy Preserving Healthcare Data Sharing"
- "Ensuring EHR Privacy using Zero Knowledge Proofs and Secure Encryption"
- zk-SNARK vs zk-STARK performance comparison for healthcare

**Success Metrics:**
- Privacy score improvement: +80%
- User trust rating: > 90%
- Performance within targets: 100%

#### 4.5. Decentralized Identity (DID/SSI)
**Status:** Not implemented
**Impact:** True patient data ownership, future-proof architecture
**Timeline:** 8-10 weeks

**Features:**
- **W3C Decentralized Identifiers (DIDs)** for patients and providers
  - `did:ethr:0x123...` for Ethereum-based identities
  - `did:web:hospital.com/patients/123` for web-based DIDs

- **Verifiable Credentials (VCs)**
  - Medical licenses (provider VCs)
  - Insurance cards (patient VCs)
  - Vaccination records (health VCs)
  - Lab results (diagnostic VCs)

- **Self-Sovereign Identity (SSI)**
  - Patient controls which credentials to share
  - Selective disclosure (share only necessary fields)
  - Revocable credentials

- **Non-Fungible Patient Tokens (NFTs)**
  - Unique, non-transferable patient identifier
  - Bound to patient's DID
  - Contains only public metadata

**Market Growth:**
- SSI market: $1.30B (2024) → $44.98B (2032) at 84.5% CAGR
- Healthcare SSI adoption: 15% of market ($195M in 2024)

**Technical Implementation:**
```typescript
interface PatientDID {
  did: string; // did:ethr:0x123...
  verifiableCredentials: {
    medicalLicense?: VerifiableCredential;
    insuranceCard?: VerifiableCredential;
    vaccinationRecord?: VerifiableCredential;
    patientID?: VerifiableCredential;
  };
  nftIdentifier: string; // Soul-bound token ID
}

// Issue a verifiable credential
async function issueCredential(
  issuer: DID,
  subject: DID,
  claims: Record<string, any>
): Promise<VerifiableCredential> {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: issuer.did,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: subject.did,
      ...claims,
    },
    proof: await signCredential(issuer, claims),
  };
}
```

**Success Metrics:**
- DID adoption rate: > 70%
- Credential issuance time: < 10 seconds
- Interoperability with other DID systems: 100%

#### 4.6. Enhanced Encryption
**Status:** Basic AES-GCM implemented (marked "demo purposes")
**Impact:** Production-grade security
**Timeline:** 4-6 weeks

**Improvements Needed:**

1. **Key Derivation Function (KDF)**
   - Replace simple SHA-256 with **Argon2id** or PBKDF2
   - Prevents rainbow table attacks
   - Adjustable work factors

```typescript
import { argon2id } from '@noble/hashes/argon2';

async function deriveKey(password: string, salt: Uint8Array) {
  return argon2id(password, salt, {
    t: 3,        // iterations
    m: 65536,    // memory (64 MiB)
    p: 4         // parallelism
  });
}
```

2. **Secure Key Storage**
   - Browser Web Crypto API for key material
   - Hardware wallet integration (Ledger, Trezor)
   - Never expose keys in JavaScript memory long-term

3. **Attribute-Based Encryption (ABE)**
   - Fine-grained access control (e.g., "only cardiologists can access heart data")
   - Policy-based decryption
   - No need to re-encrypt for each recipient

4. **Homomorphic Encryption (Future)**
   - Compute on encrypted data without decrypting
   - Privacy-preserving analytics
   - Research stage, not production-ready yet

**Success Metrics:**
- Key derivation time: 100-500ms (user acceptable)
- Encryption strength: 256-bit minimum
- Key compromise incidents: 0

---

### 🟡 PRIORITY 3: Interoperability & Standards (Q4 2025)

#### 4.7. FHIR Expansion
**Status:** ✅ Foundation complete (Patient, Encounter, Appointment)
**Impact:** Full interoperability with EHR systems
**Timeline:** 6-8 weeks

**Additional Resources to Implement:**

1. **Observation** (Lab results, vitals, measurements)
   - LOINC coding system integration
   - Vital signs (blood pressure, heart rate, temperature)
   - Lab results with reference ranges
   - Imaging results

2. **Condition** (Diagnoses)
   - SNOMED CT coding system
   - ICD-10 diagnosis codes
   - Clinical status (active, recurrence, remission)
   - Verification status (confirmed, provisional)

3. **MedicationRequest** (Prescriptions)
   - RxNorm medication codes
   - Dosage instructions
   - Dispense requests
   - Substitution rules

4. **AllergyIntolerance**
   - Drug allergies
   - Food allergies
   - Environmental allergies
   - Severity and reaction type

5. **Immunization** (Vaccination records)
   - CVX vaccine codes
   - Vaccination dates
   - Lot numbers and manufacturers
   - Reactions

6. **DocumentReference**
   - IPFS integration for document storage
   - Clinical documents (CDA)
   - Imaging reports
   - Consent forms

**FHIR Operations:**
- `$everything` - ✅ Implemented for Patient
- `$validate` - Validate resources against profiles
- `$export` - Bulk data export for portability
- `$match` - Patient matching algorithm

**Success Metrics:**
- FHIR resource coverage: > 90% of common use cases
- FHIR validation pass rate: 100%
- Interoperability test success: > 95%

#### 4.8. EHR System Integration
**Status:** Not implemented
**Impact:** Real-world usability
**Timeline:** 12-16 weeks

**Target Systems:**
- **Epic** (largest US EHR vendor - 31% market share)
- **Cerner/Oracle Health** (25% market share)
- **MEDITECH** (14% market share)
- **Allscripts** (hospital systems)

**Features:**
- **FHIR API Integration**
  - OAuth 2.0 / SMART on FHIR authentication
  - Patient data import from Epic/Cerner
  - Automatic sync of new records
  - Bi-directional data exchange

- **C-CDA Document Exchange**
  - Consolidated Clinical Document Architecture
  - Continuity of Care Documents (CCD)
  - Import/export support

- **HL7 v2 Messaging** (legacy systems)
  - ADT (Admission, Discharge, Transfer) messages
  - ORU (Observation Result) messages
  - ORM (Order) messages

**Technical Implementation:**
```typescript
// Import from Epic
async function importFromEpic(
  patientId: string,
  epicAccessToken: string
) {
  const epicFhirUrl = 'https://fhir.epic.com/interconnect-fhir-oauth';

  // Fetch patient bundle
  const response = await fetch(
    `${epicFhirUrl}/api/FHIR/R4/Patient/${patientId}/$everything`,
    {
      headers: {
        Authorization: `Bearer ${epicAccessToken}`,
        Accept: 'application/fhir+json',
      },
    }
  );

  const bundle = await response.json();

  // Convert and store locally
  for (const entry of bundle.entry) {
    const resource = entry.resource;
    const internal = fhirToInternal(resource);
    await saveToDatabase(internal);
  }
}
```

**Success Metrics:**
- Successful Epic integration: Yes/No
- Data import accuracy: > 99%
- Sync latency: < 5 minutes

---

### 🟢 PRIORITY 4: Scalability & Performance (Q1 2026)

#### 4.9. Multi-Chain Support
**Status:** Ethereum only
**Impact:** Cost reduction, broader adoption
**Timeline:** 8-10 weeks

**Chains to Support:**

1. **Polygon** (Layer 2)
   - Ultra-low gas fees ($0.001 vs $10+ on Ethereum)
   - Fast confirmations (2 seconds)
   - Ethereum compatibility (same tools)

2. **Hyperledger Fabric** (Permissioned)
   - Enterprise healthcare consortiums
   - HIPAA-compliant architecture
   - Fine-grained access control
   - No gas fees

3. **Binance Smart Chain**
   - Cost-effective alternative
   - Large user base
   - Fast transactions

4. **Arbitrum / Optimism** (Ethereum L2)
   - Rollup technology
   - 90% gas savings
   - Ethereum security

**Bridge Contracts:**
```solidity
interface IChainBridge {
    function syncRecord(
        uint256 sourceChain,
        uint256 patientId,
        bytes32 recordHash,
        string memory fhirResourceType
    ) external;
}

// Cross-chain patient record sync
contract MultiChainAccessControl {
    mapping(uint256 => IChainBridge) public bridges;

    function createCrossChainAccess(
        uint256[] memory targetChains,
        string memory ipfsCid
    ) external {
        for (uint i = 0; i < targetChains.length; i++) {
            bridges[targetChains[i]].syncRecord(
                block.chainid,
                msg.sender,
                keccak256(abi.encodePacked(ipfsCid)),
                "Bundle"
            );
        }
    }
}
```

**Success Metrics:**
- Gas cost reduction: > 90%
- Cross-chain sync time: < 1 minute
- Chain failure resilience: 100%

#### 4.10. Performance Optimizations
**Status:** Basic implementation
**Impact:** Scalability to millions of users
**Timeline:** 6-8 weeks

**Optimizations:**

1. **ZK-Rollups for Transaction Batching**
   - Batch 1000s of transactions into one
   - 90%+ gas savings
   - Sub-second confirmations

2. **IPFS Caching & CDN**
   - Redis caching layer for frequently accessed records
   - CloudFlare IPFS gateway CDN
   - Automatic cache invalidation

3. **Database Optimization**
   - Migrate from SQLite to **PostgreSQL** with replication
   - Read replicas for scalability
   - Connection pooling
   - Query optimization and indexing

4. **Pagination & Lazy Loading**
   - Virtual scrolling for large lists
   - Infinite scroll with FHIR Bundle links
   - 10-20 items per page default

5. **GraphQL API** (future)
   - Client-specified fields (no over-fetching)
   - Batched queries
   - Real-time subscriptions

**Technical Implementation:**
```typescript
// ZK-Rollup batch transaction
const rollup = new ZKRollup(contractAddress);

const batch = [
  { type: 'createAccess', data: access1 },
  { type: 'createAccess', data: access2 },
  { type: 'revokeAccess', data: revoke1 },
  // ... 997 more transactions
];

const proof = await rollup.generateProof(batch);
const tx = await rollup.submitBatch(proof);
// Single transaction for 1000 operations!
```

**Success Metrics:**
- Page load time: < 2 seconds
- API response time: < 500ms (p95)
- Concurrent users supported: 100,000+

---

### 🔵 PRIORITY 5: User Experience & Features (Q2 2026)

#### 4.11. Telemedicine Integration
**Status:** Not implemented
**Impact:** Revenue opportunity, patient convenience
**Timeline:** 10-12 weeks

**Features:**

1. **Video Consultations**
   - WebRTC peer-to-peer video
   - Screen sharing for reviewing documents
   - Recording with patient consent
   - Encryption (E2E)

2. **Secure Messaging**
   - HIPAA-compliant chat
   - File attachments (images, PDFs)
   - Read receipts
   - Message expiry

3. **E-Prescribing**
   - Digital prescription signing
   - Direct pharmacy integration
   - Controlled substance protocols (DEA compliance)

4. **Payment Integration**
   - Stripe/PayPal for telemedicine visits
   - Insurance verification
   - Automated billing

**Technical Stack:**
- **Video**: Twilio Video API or Jitsi (open source)
- **Chat**: Stream Chat or XMPP (encrypted)
- **E-Prescribing**: Surescripts API
- **Payments**: Stripe Connect

**Success Metrics:**
- Video call quality: > 720p at 30fps
- Message delivery rate: 99.9%
- Prescription delivery time: < 2 hours

#### 4.12. Consent Management Dashboard
**Status:** Basic sharing exists
**Impact:** Granular patient control, HIPAA compliance
**Timeline:** 4-6 weeks

**Features:**

1. **Purpose-Specific Consent**
   - Treatment vs. Research vs. Billing vs. Marketing
   - Separate consent for each purpose
   - Audit trail of consent changes

2. **Data Category Granularity**
   - Not just "Medical History" but specific fields:
     - ✅ Allergies
     - ❌ Mental health records
     - ✅ Lab results
     - ❌ Genetic information

3. **Revocable Consent**
   - One-click revoke from dashboard
   - On-chain revocation (sets expiry to current time)
   - Cascade revocation to related grants

4. **Consent Receipts** (Kantara Initiative standard)
   - Machine-readable consent records
   - Portable to other systems
   - Verifiable with cryptographic signatures

**UI/UX:**
```
┌─────────────────────────────────────────┐
│ Consent Management                      │
├─────────────────────────────────────────┤
│                                         │
│ 🏥 Dr. Smith (Cardiologist)            │
│ ├─ Purpose: Treatment                  │
│ ├─ Data Categories:                    │
│ │  ✅ Vitals (BP, Heart Rate)          │
│ │  ✅ Cardiac Labs                     │
│ │  ❌ Mental Health                    │
│ │  ❌ Genetic Data                     │
│ ├─ Expires: 2025-06-30                 │
│ └─ [Revoke] [Edit]                     │
│                                         │
│ 🔬 Research Study ABC                  │
│ ├─ Purpose: Research                   │
│ ├─ Data: Anonymized vitals only        │
│ ├─ Compensation: 50 tokens/month       │
│ └─ [Revoke] [View Consent Receipt]    │
└─────────────────────────────────────────┘
```

**Success Metrics:**
- Consent granularity: Field-level (not just category)
- Revocation time: < 10 seconds
- User satisfaction: > 90%

#### 4.13. Health Data Marketplace
**Status:** Not implemented
**Impact:** Patient monetization, research advancement
**Timeline:** 12-16 weeks

**Inspired by:**
- **MedRec**: Mining rewards for data contribution
- **Patientory**: Token rewards for health tracking
- **Medicalchain**: MedTokens for data marketplace

**Features:**

1. **Anonymized Data Contribution**
   - Differential privacy guarantees
   - K-anonymity (minimum group size)
   - Data aggregation and de-identification

2. **Research Data Licensing**
   - Smart contract-based licensing
   - Pay-per-access model
   - Time-limited research grants

3. **Token Economics**
   - ERC-20 token for rewards
   - Earn tokens for:
     - Data contribution
     - Health goal completion (Patientory model)
     - Survey participation
   - Spend tokens on:
     - Premium features
     - IPFS storage upgrades
     - Telemedicine credits

4. **Data Quality Scoring**
   - More complete data = higher rewards
   - Verified data sources (from Epic/Cerner) = bonus
   - Consistency checks

**Privacy Safeguards:**
```typescript
interface AnonymizedDataset {
  id: string;
  category: 'cardiovascular' | 'diabetes' | 'cancer' | ...;
  recordCount: number;
  anonymizationLevel: 'k5' | 'k10' | 'k20'; // k-anonymity
  differentialPrivacy: {
    epsilon: number; // Privacy budget
    delta: number;
  };
  pricePerAccess: number; // In tokens
  contributors: number; // Don't reveal identities
}

// Researcher requests access
async function purchaseDatasetAccess(
  datasetId: string,
  purpose: string
) {
  // Verify researcher credentials
  const verified = await verifyResearcherCredentials();

  // Pay tokens
  await tokenContract.transfer(datasetOwner, price);

  // Grant time-limited access
  const accessId = await createDatasetAccess(
    datasetId,
    researcher,
    purpose,
    30 * 24 * 60 * 60 // 30 days
  );

  return accessId;
}
```

**Success Metrics:**
- Patient participation rate: > 30%
- Research dataset sales: > $100K/year
- Privacy violations: 0

---

### 🔧 PRIORITY 6: Developer Experience & Infrastructure (Ongoing)

#### 4.14. Enhanced Documentation
**Status:** ✅ FHIR docs complete, others need work
**Timeline:** 4 weeks

**Documents Needed:**
- ✅ FHIR Implementation Guide (complete)
- [ ] API Reference (Swagger/OpenAPI)
- [ ] Smart Contract Documentation (NatSpec)
- [ ] Deployment Guide (production hardening)
- [ ] Developer Onboarding (setup in 30 mins)
- [ ] Architecture Decision Records (ADRs)
- [ ] Contribution Guide (beyond CONTRIBUTING.md)
- [ ] Security Hardening Guide

#### 4.15. Observability & Monitoring
**Status:** Basic health check only
**Timeline:** 3-4 weeks

**Tools to Integrate:**
- **Sentry**: Error tracking and performance monitoring
- **Grafana**: Dashboards for metrics
- **Loki**: Log aggregation
- **Prometheus**: Time-series metrics
- **Dune Analytics**: Blockchain analytics
- **Etherscan APIs**: Transaction monitoring

**Metrics to Track:**
```typescript
// Application metrics
const metrics = {
  // Performance
  apiResponseTime: histogram('api_response_time_ms', [50, 100, 500, 1000]),
  pageLoadTime: histogram('page_load_time_ms', [1000, 2000, 5000]),

  // Business
  patientsRegistered: counter('patients_registered_total'),
  dataSharesCreated: counter('data_shares_created_total'),
  accessGrantsVerified: counter('access_grants_verified_total'),

  // Blockchain
  gasUsed: gauge('gas_used_wei'),
  transactionFailures: counter('blockchain_tx_failures_total'),

  // Security
  failedLogins: counter('failed_login_attempts_total'),
  suspiciousAccess: counter('suspicious_access_attempts_total'),
};
```

#### 4.16. Automated Testing
**Status:** ✅ FHIR tests complete, needs expansion
**Timeline:** 6-8 weeks

**Test Coverage Goals:**
- Unit tests: > 80%
- Integration tests: > 70%
- E2E tests: Critical paths 100%
- Smart contract tests: 100%

**Testing Tools:**
- ✅ Jest (unit/integration)
- ✅ Playwright (E2E)
- ✅ Hardhat (smart contracts)
- [ ] K6 (load testing)
- [ ] OWASP ZAP (security testing)
- [ ] Pa11y (accessibility testing)

**Test Scenarios to Add:**
```typescript
describe('Emergency Access Workflow', () => {
  it('should grant EMT access with biometric proof', async () => {
    // Scenario: Unconscious patient, EMT needs medical history
    const patient = await createPatient({ hasEmergencyBracelet: true });
    const emt = await createEMT({ verified: true });

    const biometricProof = await scanPatientFingerprint(patient);
    const access = await requestEmergencyAccess(patient.id, biometricProof);

    expect(access.granted).toBe(true);
    expect(access.expiresIn).toBe(4 * 60 * 60); // 4 hours
    expect(access.auditTrail).toBeDefined();
  });
});
```

---

## 5. Security Considerations (Enhanced)

### Current Security Measures
*   ✅ **Data Encryption:** AES-GCM for IPFS data (needs upgrade to production-grade)
*   ✅ **Smart Contract Access Control:** Time-limited grants with optional passwords
*   ✅ **Input Validation:** Zod schemas on forms
*   ✅ **ESLint Security Plugins:** eslint-plugin-security, eslint-plugin-no-unsanitized
*   ✅ **Secure Cookie Settings:** HTTP-only, secure in production
*   ⚠️ **Audit Logging:** Basic access counts (needs enhancement)

### Critical Enhancements Needed

#### 5.1. Production-Grade Encryption
- **Replace:** Simple SHA-256 key derivation
- **With:** Argon2id (3 iterations, 64 MiB memory, parallelism 4)
- **Add:** Web Crypto API for key storage
- **Add:** Hardware wallet integration (Ledger/Trezor)
- **Timeline:** 2 weeks

#### 5.2. Comprehensive Audit Logging
- **Log:** All PHI access with reason, timestamp, IP, user agent
- **Store:** On-chain for immutability
- **Alert:** Suspicious patterns (ML-based anomaly detection)
- **Retention:** 6 years (HIPAA requirement)
- **Timeline:** 4 weeks

#### 5.3. Rate Limiting & DDoS Protection
- **Add:** express-rate-limit on all API endpoints
- **Configure:** 100 requests/15 minutes per IP
- **Add:** CloudFlare WAF for DDoS protection
- **Add:** CAPTCHA for registration/login
- **Timeline:** 1 week

#### 5.4. Smart Contract Security
- **Current:** Not audited
- **Need:** Professional audit by CertiK, OpenZeppelin, or Trail of Bits
- **Cost:** $20K-$50K
- **Add:** Automated security scanning (Slither, Mythril)
- **Add:** Bug bounty program ($500-$5000 per vulnerability)
- **Timeline:** 6-8 weeks

#### 5.5. Penetration Testing
- **Scope:** Web app, smart contracts, API
- **Frequency:** Annually + before major releases
- **Provider:** Professional security firm
- **Cost:** $15K-$30K
- **Timeline:** 4 weeks

#### 5.6. HIPAA Security Rule Compliance Checklist

| Control | Status | Priority |
|---------|--------|----------|
| Access Control | ⚠️ Partial | 🔴 Critical |
| Audit Controls | ⚠️ Partial | 🔴 Critical |
| Integrity Controls | ✅ Done | - |
| Person/Entity Authentication | ✅ Done | - |
| Transmission Security | ⚠️ Partial | 🟠 High |
| Risk Analysis | ❌ None | 🔴 Critical |
| Risk Management | ❌ None | 🔴 Critical |
| Sanction Policy | ❌ None | 🟡 Medium |
| Information System Activity Review | ❌ None | 🔴 Critical |
| Assigned Security Responsibility | ✅ Done | - |
| Workforce Security | N/A | - |
| Evaluation | ❌ None | 🟠 High |

**Timeline for Full Compliance:** 12-16 weeks

---

## 6. Testing Strategy (Enhanced)

### Current Testing
- ✅ FHIR converter unit tests (comprehensive)
- ✅ FHIR API integration tests (comprehensive)
- ✅ IPFS API tests (basic)
- ⚠️ E2E tests (minimal Playwright tests)
- ❌ Smart contract tests (none)
- ❌ Load/performance tests (none)
- ❌ Security penetration tests (none)

### Enhanced Testing Roadmap

#### 6.1. Smart Contract Testing (4 weeks)
```javascript
describe('FHIRAccessControl', () => {
  it('should create FHIR access grant with metadata', async () => {
    const tx = await contract.createFHIRAccess(
      ipfsCid,
      86400, // 24 hours
      ethers.utils.id('password'),
      'Bundle',
      'Patient/123',
      '4.0.1',
      ['Patient', 'Encounter']
    );

    const receipt = await tx.wait();
    const accessId = receipt.events[0].args.accessId;

    const details = await contract.getFHIRAccessDetails(accessId);
    expect(details.fhirResourceType).to.equal('Bundle');
    expect(details.fhirVersion).to.equal('4.0.1');
  });

  it('should revoke access before expiry', async () => {
    // Test revocation functionality
  });

  it('should prevent access after expiry', async () => {
    // Test time-based access control
  });
});
```

#### 6.2. Load Testing (2 weeks)
```javascript
// k6 load test
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp up to 100 users
    { duration: '10m', target: 1000 }, // Stay at 1000 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // < 1% failure rate
  },
};

export default function() {
  const res = http.get('http://localhost:3000/api/fhir/Patient');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

#### 6.3. Security Testing (6-8 weeks)
- **OWASP ZAP** automated scans
- **Burp Suite** manual testing
- **SQL injection** testing (if applicable)
- **XSS** testing (React generally safe, but check)
- **CSRF** testing (NextAuth provides protection)
- **Smart contract** reentrancy attacks
- **Gas limit** DoS attacks

#### 6.4. Accessibility Testing (2 weeks)
- **Pa11y** automated WCAG 2.1 AA compliance
- **axe DevTools** browser extension
- **Screen reader** testing (NVDA, JAWS)
- **Keyboard navigation** testing
- **Color contrast** validation

**WCAG Compliance Goal:** AA level (required for government healthcare)

---

## 7. Deployment & Infrastructure (Enhanced)

### Current Deployment
- ✅ Docker support (Dockerfile for Dokploy)
- ✅ Next.js optimized build
- ⚠️ SQLite database (not production-ready)
- ⚠️ No monitoring
- ⚠️ No backup/recovery

### Production Infrastructure Recommendations

#### 7.1. Database Migration
**From:** SQLite
**To:** PostgreSQL with replication

```yaml
# docker-compose.yml
services:
  postgres-primary:
    image: postgres:16
    environment:
      POSTGRES_DB: ehr_wallet
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  postgres-replica:
    image: postgres:16
    environment:
      POSTGRES_DB: ehr_wallet
      PGUSER: replicator
    command: |
      postgres
      -c wal_level=replica
      -c hot_standby=on
      -c max_wal_senders=10
```

#### 7.2. IPFS Pinning Services
**Current:** Multiple fallbacks (Pinata, Helia, HTTP gateways)
**Production:** Dedicated pinning service

**Options:**
1. **Pinata** (current) - $20-$100/month
2. **Web3.Storage** - Free tier + paid
3. **IPFS Cluster** - Self-hosted, full control
4. **Filebase** - S3-compatible IPFS storage

**Recommendation:** Pinata Pro ($100/month) + Web3.Storage backup

#### 7.3. Blockchain Node Infrastructure
**Options:**
1. **Infura** - $50-$500/month (100K-10M requests)
2. **Alchemy** - Similar pricing, better analytics
3. **QuickNode** - Dedicated nodes, $9-$299/month
4. **Self-hosted** - Geth/Nethermind node (high maintenance)

**Recommendation:** Alchemy Growth ($49/month) for reliability

#### 7.4. CDN & Edge Caching
- **CloudFlare** for static assets and IPFS gateway caching
- **Vercel Edge Network** for Next.js deployment
- **Geographic distribution:** US, EU, Asia

#### 7.5. Backup & Disaster Recovery
```yaml
# Backup strategy
databases:
  postgres:
    backup_frequency: 6 hours
    retention: 30 days
    offsite_storage: AWS S3 (encrypted)

ipfs:
  pinning_redundancy: 3 providers
  cid_backup: All CIDs logged in database

blockchain:
  private_keys: Hardware wallet + encrypted backup
  contract_deployment: Document addresses in code

recovery_time_objective: 4 hours
recovery_point_objective: 6 hours
```

#### 7.6. Monitoring & Alerting
```yaml
# Alert rules
alerts:
  - name: api_latency_high
    condition: p95_response_time > 1000ms
    duration: 5 minutes
    notify: pagerduty

  - name: blockchain_tx_failing
    condition: tx_failure_rate > 5%
    duration: 2 minutes
    notify: slack

  - name: database_down
    condition: postgres_up == 0
    duration: 30 seconds
    notify: pagerduty

  - name: suspicious_access
    condition: access_from_new_country AND data_sensitivity=high
    duration: immediate
    notify: security_team
```

---

## 8. Success Metrics (Enhanced)

### User Adoption Metrics
| Metric | Current | Target (6 months) | Target (1 year) |
|--------|---------|-------------------|-----------------|
| Active Users | - | 1,000 | 10,000 |
| Patient Registrations | - | 50/week | 200/week |
| Provider Registrations | - | 10/week | 50/week |
| Data Shares Created | - | 100/week | 1,000/week |
| Access Grants Verified | - | 500/week | 5,000/week |

### Feature Engagement Metrics
| Feature | Target Usage | Target Satisfaction |
|---------|-------------|---------------------|
| FHIR Data Import (Epic/Cerner) | 40% of users | > 85% |
| Emergency Access Setup | 60% of users | > 90% |
| Telemedicine Consultations | 20% of users | > 80% |
| Data Marketplace Participation | 30% of users | > 75% |
| Multi-Chain Deployment | 50% on Polygon | > 70% satisfaction |

### Technical Performance Metrics
| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response Time (p95) | < 500ms | < 1000ms |
| Page Load Time | < 2s | < 5s |
| Blockchain TX Success Rate | > 99% | > 95% |
| IPFS Retrieval Success | > 99.9% | > 99% |
| Uptime | 99.9% | 99% |

### Security Metrics
| Metric | Target |
|--------|--------|
| Security Incidents | 0 critical/year |
| Vulnerability Resolution Time | < 48 hours (critical) |
| Penetration Test Pass Rate | 100% |
| Smart Contract Audit Issues | 0 high/critical |
| HIPAA Compliance Score | 100% |

### Business Metrics
| Metric | Target (Year 1) |
|--------|-----------------|
| Research Dataset Sales | $100K |
| Telemedicine Revenue | $50K |
| Token Market Cap | $500K |
| Healthcare Partnerships | 10 hospitals |
| EHR System Integrations | 3 (Epic, Cerner, MEDITECH) |

---

## 9. Implementation Roadmap (MoSCoW Enhanced)

### Must Have (Q2 2025)
- ✅ **FHIR R4 Support** - DONE
- 🔴 **HIPAA Compliance Framework** - 12-16 weeks
- 🔴 **Emergency Access Protocols** - 6-8 weeks
- 🔴 **Provider Verification System** - 4-6 weeks
- 🔴 **Production-Grade Encryption** - 2-4 weeks
- 🔴 **PostgreSQL Migration** - 2 weeks
- 🔴 **Comprehensive Audit Logging** - 4 weeks

### Should Have (Q3 2025)
- 🟠 **Zero-Knowledge Proofs** - 10-12 weeks
- 🟠 **Decentralized Identity (DID)** - 8-10 weeks
- 🟠 **FHIR Expansion** (Observation, Condition, etc.) - 6-8 weeks
- 🟠 **Multi-Chain Support** (Polygon, Hyperledger) - 8-10 weeks
- 🟠 **Consent Management Dashboard** - 4-6 weeks
- 🟠 **Smart Contract Security Audit** - 6-8 weeks
- 🟠 **Performance Optimizations** (ZK-Rollups, caching) - 6-8 weeks

### Could Have (Q4 2025 - Q1 2026)
- 🟡 **EHR System Integration** (Epic, Cerner) - 12-16 weeks
- 🟡 **Telemedicine Integration** - 10-12 weeks
- 🟡 **Health Data Marketplace** - 12-16 weeks
- 🟡 **Advanced Analytics Dashboard** - 6-8 weeks
- 🟡 **Mobile Native Apps** (React Native) - 16-20 weeks
- 🟡 **Multi-Language Support** - 4-6 weeks

### Won't Have (This Phase)
- ❌ **Prescription Fulfillment** (pharmacy integration)
- ❌ **Medical Device Integration** (wearables, IoT)
- ❌ **Claims Processing** (insurance billing)
- ❌ **Clinical Decision Support** (AI/ML recommendations)
- ❌ **Genomic Data Storage** (requires specialized infrastructure)

---

## 10. Competitive Positioning

### Unique Selling Propositions (USPs)

1. **Only FHIR-Compliant Blockchain Health Wallet** ✅
   - Full HL7 FHIR R4 support
   - Interoperates with Epic, Cerner, etc.
   - Standards-based (LOINC, SNOMED CT, ICD-10)

2. **Offline-First PWA** ✅ (Unique!)
   - Works without internet
   - Installable on any device
   - IndexedDB local storage

3. **True Patient Data Ownership**
   - Blockchain access control
   - IPFS decentralized storage
   - No vendor lock-in

4. **Advanced Privacy Technologies** (Planned)
   - Zero-Knowledge Proofs
   - Decentralized Identity
   - Attribute-Based Encryption

5. **Production-Ready Security** (In Progress)
   - HIPAA compliance
   - Smart contract audits
   - Penetration testing

### Market Differentiation

| Feature | EHR Wallet | MedRec | Patientory | Medicalchain |
|---------|-----------|--------|-----------|--------------|
| **FHIR Compliance** | ✅ Full | ❌ None | ⚠️ Partial | ⚠️ Limited |
| **Epic/Cerner Integration** | 🔄 Planned | ❌ No | ❌ No | ❌ No |
| **Zero-Knowledge Proofs** | 🔄 Planned | ❌ No | ❌ No | ❌ No |
| **Decentralized Identity** | 🔄 Planned | ❌ No | ⚠️ Tokens | ⚠️ Limited |
| **Emergency Access** | 🔄 Planned | ⚠️ Basic | ❌ No | ✅ Bracelet |
| **Telemedicine** | 🔄 Planned | ❌ No | ⚠️ Limited | ✅ Full |
| **Offline PWA** | ✅ **Unique!** | ❌ No | ❌ No | ❌ No |
| **Open Source** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Multi-Chain** | 🔄 Planned | ❌ Ethereum | ✅ Multiple | ⚠️ Custom |
| **Data Marketplace** | 🔄 Planned | ✅ Mining | ✅ Tokens | ✅ MedTokens |

**Legend:**
- ✅ Fully implemented
- 🔄 Planned/In progress
- ⚠️ Partial/Limited
- ❌ Not available

### Target Market Segments

1. **Primary Care Patients** (Mass market)
   - Need: Consolidate records from multiple providers
   - Pain point: Fragmented health data across systems
   - Solution: FHIR import from Epic/Cerner + blockchain sharing

2. **Chronic Disease Patients** (High engagement)
   - Need: Share records with specialists frequently
   - Pain point: Repeating medical history, lost records
   - Solution: Emergency access + comprehensive sharing

3. **Healthcare Providers** (B2B)
   - Need: Quick access to patient history
   - Pain point: Incomplete records, phone tag for records
   - Solution: Provider portal + FHIR integration

4. **Research Institutions** (Revenue)
   - Need: Access to real-world health data
   - Pain point: IRB approval, patient recruitment
   - Solution: Data marketplace with anonymization

5. **Health Insurance Companies** (Enterprise)
   - Need: Verify patient medical history
   - Pain point: Fraud, incomplete claims
   - Solution: Verifiable Credentials + ZKPs

---

## 11. Risk Assessment & Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Smart contract vulnerability | Medium | Critical | Professional audit, bug bounty |
| IPFS data loss | Low | High | 3+ pinning services, database backup |
| Blockchain network congestion | High | Medium | Multi-chain support, L2 rollups |
| Database failure | Low | Critical | PostgreSQL replication, hourly backups |
| API rate limiting (Infura/Alchemy) | Medium | Medium | Multiple providers, self-hosted fallback |
| Encryption key loss | Medium | Critical | Key backup protocols, recovery options |

### Regulatory Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| HIPAA non-compliance penalty | Medium | Critical | Full compliance audit, legal review |
| State medical privacy laws | Medium | High | Legal counsel per state, granular controls |
| FDA regulation (if telemedicine) | Low | High | Consult healthcare attorneys |
| International data transfer (GDPR) | Medium | High | Data residency options, consent mechanisms |
| Medical malpractice liability | Low | Critical | Terms of service, liability insurance |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Low user adoption | Medium | High | Marketing, partnerships with hospitals |
| Competitor with more funding | High | Medium | Focus on differentiation (FHIR, ZKPs) |
| Gas fees too expensive | High | Medium | Multi-chain (Polygon), L2 rollups |
| EHR vendors blocking integration | Medium | High | Use public FHIR APIs, legal advocacy |
| Token/marketplace regulatory issues | Medium | High | Legal review, avoid securities classification |

---

## 12. Budget Estimates

### Development Costs (Year 1)

| Category | Item | Cost |
|----------|------|------|
| **Security** | Smart contract audit (CertiK/OpenZeppelin) | $30,000 |
| | Penetration testing | $20,000 |
| | Bug bounty program | $10,000 |
| **Infrastructure** | Cloud hosting (AWS/Vercel) | $6,000 |
| | Blockchain nodes (Alchemy) | $600 |
| | IPFS pinning (Pinata Pro) | $1,200 |
| | Database (PostgreSQL hosting) | $2,400 |
| | Monitoring (Sentry, Grafana Cloud) | $1,800 |
| **Third-Party Services** | Twilio (telemedicine video) | $3,000 |
| | SendGrid (email notifications) | $600 |
| | Surescripts (e-prescribing API) | $5,000 |
| **Legal & Compliance** | HIPAA compliance consulting | $15,000 |
| | Legal counsel (terms, privacy policy) | $10,000 |
| | Professional liability insurance | $3,000 |
| **Development** | Senior blockchain developer (6 months) | $90,000 |
| | Full-stack developer (6 months) | $75,000 |
| | UX/UI designer (3 months) | $25,000 |
| **Total** | | **$297,600** |

### Revenue Projections (Year 1)

| Source | Conservative | Optimistic |
|--------|-------------|------------|
| Telemedicine consultations ($50/visit, 10-30% adoption) | $25,000 | $150,000 |
| Research data marketplace | $50,000 | $200,000 |
| Enterprise licensing (hospitals) | $0 | $100,000 |
| Premium features | $10,000 | $50,000 |
| **Total** | **$85,000** | **$500,000** |

### Break-Even Analysis
- **Conservative:** Year 3-4
- **Optimistic:** Year 2
- **With VC funding:** Year 1-2 (reinvest in growth)

---

## 13. Go-to-Market Strategy

### Phase 1: Beta Launch (Q2 2025)
- **Target:** 100 alpha users
- **Method:** Personal networks, healthcare forums
- **Focus:** Feedback on usability and features
- **Success:** 70% retention after 30 days

### Phase 2: Public Launch (Q3 2025)
- **Target:** 1,000 users in first quarter
- **Channels:**
  - Product Hunt launch
  - Healthcare subreddits (r/healthcare, r/ehrmr)
  - Medical student communities
  - Patient advocacy groups
- **Partnership:** 2-3 small clinics for pilot
- **Success:** 40% user activation (complete profile + share data)

### Phase 3: Growth (Q4 2025)
- **Target:** 10,000 users by end of year
- **Channels:**
  - Content marketing (SEO blog on health data ownership)
  - Healthcare conferences (HIMSS, ViVE)
  - Provider partnerships (referral program)
  - Insurance company pilots
- **Success:** 30% month-over-month growth

### Phase 4: Scale (2026)
- **Target:** 100,000 users
- **Strategy:**
  - Epic/Cerner App Store listings
  - Healthcare system partnerships
  - National patient advocacy campaigns
  - Geographic expansion (EU, Asia)

---

## 14. Conclusion

This updated PRD incorporates industry best practices from leading blockchain health projects (MedRec, Patientory, Medicalchain) and 2024 academic research. With **FHIR R4 support now implemented**, EHR Wallet has a strong foundation for healthcare interoperability.

### Immediate Next Steps (Next 90 Days)

1. **Week 1-4:** HIPAA compliance audit and gap analysis
2. **Week 5-10:** Emergency access protocols implementation
3. **Week 11-16:** Provider verification system
4. **Week 17-20:** Production-grade encryption upgrade
5. **Week 21-24:** PostgreSQL migration and infrastructure hardening
6. **Week 25-30:** Smart contract security audit
7. **Week 31-36:** Zero-knowledge proofs implementation begins

### Long-Term Vision (2-3 Years)

**EHR Wallet will be the first blockchain health platform to achieve:**
1. ✅ Full FHIR R4 compliance
2. 🔄 HIPAA certification
3. 🔄 Integration with major EHR systems (Epic, Cerner)
4. 🔄 Multi-chain deployment (Ethereum, Polygon, Hyperledger)
5. 🔄 100,000+ active users
6. 🔄 10+ hospital partnerships
7. 🔄 $1M+ in research data marketplace revenue

This positions EHR Wallet as the **industry-leading, standards-compliant, patient-centric blockchain health wallet** that combines the best features of all competitors with unique innovations like offline PWA support and zero-knowledge privacy.

---

**Document Version:** 2.0
**Last Updated:** 2025-01-08
**Contributors:** Development Team, Security Audit, Healthcare Compliance Advisors
**Next Review:** 2025-04-08 (Quarterly)
