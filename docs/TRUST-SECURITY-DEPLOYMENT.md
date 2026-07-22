# LumaChart — Trust, Security & Deployment

**How LumaChart protects health information and how a health system stands it up — simplified.**
Prepared 2026-07-10 · branch note: shipped on the trust/security/research branch. In-app: **Security & SAFER**, **Readiness & contracts** (clinician), and the IRB-gated **Research console**.

> Health-information protection is the foundation, not a feature. This document distills the ONC/ASTP guidance a health system must weigh — privacy & security, the SAFER safety practices, cloud-vs-local hosting, implementation readiness, and EHR contracts — into the checklists LumaChart surfaces in-app.

## 1. Privacy & security (HIPAA, by design)

| Safeguard | In LumaChart |
|---|---|
| Encryption | PHI encrypted in transit (TLS) and at rest |
| Access control (RBAC) | Least-privilege roles, unique user IDs |
| Multi-factor authentication | MFA for clinician & admin access |
| Audit trails & Provenance | Every access/change logged and attributable |
| Automatic time-out | Sessions lock on inactivity (Canary already models session awareness) |
| Break-the-glass | Emergency access with heightened logging |
| Business Associate Agreement | Signed BAA with every vendor touching PHI |
| Breach response | Detection, HIPAA Breach-Rule notification, remediation |

Reference: ONC *Guide to Privacy and Security of Electronic Health Information* / API privacy & security guidance (healthit.gov). Formal SOC 2 + ONC certification are on the [ONC roadmap](ONC-CERTIFICATION-ROADMAP.md) (category **(d)** is Phase 1, non-negotiable).

## 2. SAFER Guides (patient-safety practices)

ONC's nine **SAFER Guides** are the recommended self-assessment for safe EHR use. LumaChart surfaces the **high-priority practices** in-app:

- Reliable test-result reporting with **tracked follow-up** (no result falls through the cracks)
- Accurate **patient identification** to prevent wrong-patient errors
- Safe **CPOE** with active drug-drug / drug-allergy decision support
- **Downtime & contingency** plans so care continues if the system is unavailable
- **Feedback/reporting** channels for clinicians to flag EHR safety hazards

The nine guides: High Priority Practices · Organizational Responsibilities · Contingency Planning · System Configuration · System Interfaces · Patient Identification · CPOE with Decision Support · Test Results Reporting & Follow-up · Clinician Communication. Source: <https://www.healthit.gov/topic/safety/safer-guides>.

## 3. Cloud vs. locally hosted

| | ☁️ Cloud-based | 🏢 Locally hosted |
|---|---|---|
| **Benefits** | Lower upfront + ongoing cost; start small and scale; higher availability; fewer run-time failures | Less dependence on high-speed internet; no outside org holds your data |
| **Challenges** | Data-security responsibility **shared** with vendor; less direct data control | You secure servers, run backups, buy/maintain equipment |

**LumaChart is cloud-native** — lower total cost of ownership and higher availability — which means security responsibility is *shared*. Reduce the risk with a signed **BAA**, a written **SLA**, and **ongoing monitoring**.

## 4. Implementation readiness

Before starting, assess your organization's **readiness · personnel eagerness · a day-to-day champion · stakeholder buy-in (EHR seen as useful) · ability to work as a team.** The in-app self-check scores these in 60 seconds. Plan for **both the initial and the ongoing** effects on clinical practice.

## 5. EHR contract checklist (before you sign)

SLA (uptime, support, remedies) · **data ownership & guaranteed export** (EHI/FHIR, at any time and at exit) · BAA covering subcontractors · security & breach obligations + audit rights · all-in pricing (implementation, interfaces, support, per-transaction fees) · standards-based interoperability with **no information blocking** · termination & transition assistance (no hostage data). Reference: ASTP *EHR Contracts Untangled* (2025).

## 6. Research ethics — IRB gate

The **Research console** treats **IRB (Institutional Review Board) approval** as a hard gate: no cohort — even de-identified — is exported without an approved protocol. LumaChart makes IRB submission one click and tracks approval status per study, alongside consent, small-cell suppression, and full query audit logging. The console also carries a **Research directory** of representative equity / precision-medicine projects the consented public-health layer is designed to support.
