# LumaChart — Enterprise Integration & Nationwide Exchange Plan

**One longitudinal record across the whole health system (inpatient, outpatient, ED, pharmacy, lab, imaging), one patient portal, one billing & scheduling backbone — and query/retrieve to virtually any site in the country.**
Prepared 2026-07-10 · branch `new-feature` · companion to `ONC-CERTIFICATION-ROADMAP.md` and `INTEROPERABILITY-PLAN.md`.

> **Honest framing.** LumaChart is a front-end prototype today. This plan is the target architecture — how the ambulatory prototype becomes an enterprise platform. Standard names (HL7 v2, FHIR, X12, IHE, TEFCA) are factual references; nothing here is certified yet.

---

## 1. Architecture in one picture

```
 Care settings                 Core platform                 The nation
 ─────────────                 ─────────────                 ──────────
 Outpatient  ┐                                              ┌ TEFCA / QHIN
 Inpatient   │   HL7 v2 / FHIR / X12    ┌──────────────┐    │ Carequality
 ED          ├── Integration engine  →  │ FHIR core +  │ ←→ │ CommonWell
 Pharmacy    │   (interface engine)     │ EMPI + terms │    │ eHealth Exchange
 Lab         │                          └──────────────┘    │ Direct
 Imaging     ┘                                 ↑            └
                                     Patient portal + SMART apps
```

Every setting writes to **one FHIR-native record** (Medplum/Aidbox) reconciled by an **Enterprise Master Patient Index (EMPI)**. That record is exposed to patients through one portal and to the country through TEFCA.

## 2. Layers

1. **Core data platform** — FHIR R4 store (Medplum/Aidbox), EMPI/patient matching, terminology services (SNOMED/LOINC/RxNorm/ICD-10), Provenance & audit from the first write.
2. **Integration engine** — an interface engine (Mirth/Rhapsody-class) mediating **HL7 v2 ↔ FHIR**, plus **X12** for billing and **IHE** profiles for document exchange. This is what makes "any site" possible without ripping out existing hospital systems.
3. **Care-setting modules** — inpatient (ADT, CPOE, flowsheets, eMAR), outpatient (built), ED, pharmacy 🧩, lab 🧩, imaging. Build the differentiated workflow; buy the commoditized rails.
4. **Patient engagement** — one portal across settings: VDT, secure messaging, patient-reported data, SMART-on-FHIR patient apps (incl. Apple/Google Health).
5. **Nationwide exchange** — TEFCA/QHIN participation; Carequality/CommonWell/eHealth Exchange; Direct.
6. **Cross-cutting** — identity (OIDC/SMART), the full §170.315(d) security series, consent & data segmentation, and an immutable audit trail.

## 3. One record, every setting

| Setting | Standard / interface | Build vs. buy |
|---|---|---|
| Outpatient / ambulatory | FHIR R4 + US Core | ✅ prototype |
| Inpatient (ADT, orders, results, flowsheets, eMAR) | HL7 v2 (ADT, ORM/OMG, ORU) + FHIR | Build on core + interface engine |
| Emergency department | HL7 v2 + FHIR Encounter | Build |
| Pharmacy | NCPDP SCRIPT + eMAR | 🧩 DrFirst / MDToolbox |
| Laboratory | HL7 v2 ORU / FHIR Observation | 🧩 Health Gorilla |
| Imaging | DICOM + FHIR ImagingStudy | Build/partner |

Admit-discharge-transfer (ADT) events are the spine: they drive census, orders, results routing, and — critically — **encounter context** so an inpatient note, an ED visit, and a clinic follow-up are all the *same patient's* one record.

## 4. Billing & scheduling (already modeled)

- **Revenue cycle (X12 EDI):** 837 professional/institutional claims, 835 remittance, 270/271 eligibility, 276/277 claim status, 278 prior authorization. LumaChart's **billing agent + clearinghouse + Puerto Rico ICD-9 bridge** are the front end of this (see `BILLING-AND-CLEARINGHOUSE-PLAN.md`).
- **Enterprise scheduling:** FHIR `Appointment`/`Schedule`/`Slot` + HL7 v2 **SIU** across settings; the waiting-room **iPad check-in** is the patient-facing edge of it.

## 5. Nationwide record exchange

The goal — "virtually any site nationwide" — is achieved by joining the national network rather than integrating point-to-point with thousands of systems.

| Network | Role |
|---|---|
| **TEFCA / QHIN** | The national floor. Connect once to a Qualified Health Information Network and reach every other participant. LumaChart participates via a QHIN. |
| **Carequality** | Query-based document exchange framework (converging under TEFCA). |
| **CommonWell** | Record locator service + retrieval across members. |
| **eHealth Exchange** | Large federal + private query network. |
| **Direct** | Point-to-point push for transitions of care (§170.315(h)(1)). |

Mechanics: **XCPD** (cross-community patient discovery) finds where a patient has records; **XCA/XDS.b** retrieves the documents (C-CDA today, **FHIR** increasingly under TEFCA's facilitated-FHIR track); **patient matching** (demographics + Project US@ addresses) ties them to the one record.

## 6. Deployment & scale

Multi-tenant SaaS, one tenant per health system, with tenant isolation, per-tenant EMPI, and a shared terminology/exchange layer. Horizontal scale on the FHIR core; the interface engine scales per-facility volume (ADT/results are the high-throughput feeds).

## 7. Maps to the ONC roadmap

This plan is the enterprise expression of criteria already tracked in `ONC-CERTIFICATION-ROADMAP.md`: **b(1)** transitions of care (C-CDA), **b(2)** reconciliation, **b(3)** e-Rx, **g(7)/g(9)/g(10)** FHIR API, **h(1)/h(2)** Direct, and the **f-series** public-health transmissions. Enterprise ≠ new certification criteria — it's the same criteria, wired across every setting and out to the network.

## 8. Honest gates

TEFCA onboarding through a QHIN (legal + technical) · EMPI/patient-matching accuracy validation · HL7 v2 conformance per facility · the full §170.315(d) security program (SOC 2, pen-test, HIPAA risk analysis) · and load/resilience testing before any live ADT feed. None of this is a shortcut around ONC-ACB certification.
