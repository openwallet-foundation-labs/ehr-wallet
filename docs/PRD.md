# EHR Wallet - Product Roadmap

## Project Overview

EHR Wallet is a decentralized application that empowers patients to securely own, manage, and share their health data using blockchain technology and FHIR standards.

**Vision:** To create the most advanced, standards-compliant blockchain health wallet that enables true patient data ownership while maintaining interoperability with existing healthcare systems (Epic, Cerner, etc.).

## Current Status

### Implemented Features

- **Patient Authentication** - Dual-mode (traditional + Web3/Polygon wallet)
- **Patient Dashboard** - Central hub with tabs for Shared Data, Health Data, Appointments, Medical Records
- **Data Sharing** - Multi-step wizard with time-limited access and optional password protection
- **Access Logs** - Comprehensive record of who accessed data, when, and IPFS pin status
- **Blockchain Integration** - Polygon Amoy smart contracts for access control with IPFS storage
- **MetaMask Wallet** - Integration for blockchain interactions
- **PWA Support** - Installable progressive web app with offline capabilities
- **FHIR R4 Support** - Full HL7 FHIR R4 implementation with Patient, Encounter resources
- **Mantine UI** - Complete migration from shadcn/ui to Mantine UI components

---

## Roadmap

### Phase 1: Compliance & Safety (Current Priority)

| Feature | Status | Priority |
|---------|--------|----------|
| HIPAA Compliance Framework | Not Started | 🔴 Critical |
| Emergency Access Protocols | Not Started | 🔴 Critical |
| Provider Verification System | Not Started | 🔴 High |
| PostgreSQL Migration | Not Started | 🔴 High |

**Timeline:** Q2-Q3 2025

#### Emergency Access Protocols
- Emergency bracelet/NFC tag integration
- Break-glass access for EMTs (4-hour default)
- Family doctor delegation
- Emergency contact multi-signature

#### Provider Verification System
- NPI (National Provider Identifier) verification
- Institutional affiliation verification
- Real-time license status checking
- On-chain reputation system

---

### Phase 2: Privacy & Security

| Feature | Status | Priority |
|---------|--------|----------|
| Zero-Knowledge Proofs (ZKPs) | Not Started | 🟠 High |
| Decentralized Identity (DID/SSI) | Not Started | 🟠 High |
| Enhanced Encryption (Argon2id) | Basic | 🟠 High |
| Comprehensive Audit Logging | Basic | 🟠 High |

**Timeline:** Q3-Q4 2025

#### Zero-Knowledge Proofs
- Age verification without revealing birthdate
- Eligibility checks without exposing full medical history
- Insurance verification without sharing policy details

#### Decentralized Identity
- W3C DIDs for patients and providers
- Verifiable Credentials (VCs) for licenses, insurance, vaccinations
- Selective disclosure and revocable credentials
- Soul-bound patient tokens (NFTs)

---

### Phase 3: Interoperability & Standards

| Feature | Status | Priority |
|---------|--------|----------|
| FHIR Expansion (Observation, Condition, MedicationRequest) | Not Started | 🟡 Medium |
| EHR System Integration (Epic, Cerner) | Not Started | 🟡 Medium |
| Multi-Chain Support | Not Started | 🟡 Medium |

**Timeline:** Q4 2025

#### FHIR Resources to Add
- Observation (Lab results, vitals)
- Condition (Diagnoses with SNOMED CT, ICD-10)
- MedicationRequest (Prescriptions with RxNorm)
- AllergyIntolerance
- Immunization records
- DocumentReference
- Appointment (FHIR-based appointment management)

#### EHR Integrations
- Epic FHIR API integration
- Cerner/Oracle Health integration
- SMART on FHIR OAuth authentication

---

### Phase 4: Scalability & Performance

| Feature | Status | Priority |
|---------|--------|----------|
| IPFS Caching & CDN | Not Started | 🟢 Low |
| ZK-Rollups for Batching | Not Started | 🟢 Low |
| GraphQL API | Not Started | 🟢 Low |

**Timeline:** Q1 2026

---

### Phase 5: User Experience & Features

| Feature | Status | Priority |
|---------|--------|----------|
| Telemedicine Integration | Not Started | 🟢 Low |
| Consent Management Dashboard | Basic | 🟢 Low |
| Health Data Marketplace | Not Started | 🟢 Low |
| Mobile Native Apps | Not Started | 🟢 Low |

**Timeline:** Q2-Q3 2026

---

## Completed Items

- ✅ FHIR R4 Support (Patient, Encounter)
- ✅ Polygon Network Integration (migrated from Ethereum)
- ✅ Polygon Amoy Testnet Deployment
- ✅ PWA with offline support
- ✅ MetaMask wallet integration
- ✅ IPFS storage with Pinata/Helia
- ✅ Basic access control with time-limited grants
- ✅ Mantine UI Migration (complete)
- ✅ Inter Font Typography
- ✅ Dashboard Tabs with Icons
- ✅ Wallet Address Show/Hide Toggle

---

## Technical Milestones

| Milestone | Target Date |
|-----------|-------------|
| HIPAA Compliance Complete | Q3 2025 |
| Emergency Access Live | Q3 2025 |
| ZKP Integration | Q4 2025 |
| Epic Integration | Q4 2025 |
| 10,000 Active Users | 2026 |

---

## Resources

- [FHIR Implementation Guide](./FHIR_IMPLEMENTATION.md)
- [Cost Optimization Architecture](./COST_OPTIMIZATION_ARCHITECTURE.md)
- [Security Policy](../SECURITY.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Walkthrough Screenshots](./WALKTHROUGH.md)

---

**Last Updated:** March 2026
**Version:** 1.1
