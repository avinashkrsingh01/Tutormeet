# TutorMeet — Database Schema v2.0

## Execution order (fresh install)

Run these files in order in the Supabase SQL editor:

| File | Purpose |
|------|---------|
| `010_complete_schema.sql` | All tables, enums, functions, triggers |
| `011_rls.sql` | Row Level Security policies |
| `012_indexes.sql` | All performance indexes |
| `013_storage.sql` | Storage buckets + policies |
| `014_seed_demo.sql` | **Dev/staging only** — demo data |

## Table overview

### User tables
| Table | Description |
|-------|-------------|
| `profiles` | One row per auth.users — role + contact |
| `parent_profiles` | Parent location + preferences |
| `student_profiles` | Children of parents |

### Tutor tables (normalised)
| Table | Description |
|-------|-------------|
| `tutor_profiles` | Core tutor record + verification state |
| `tutor_qualifications` | Education degrees (one per row) |
| `tutor_experience` | Teaching history (one per role) |
| `tutor_subjects` | Subject × grade × board combinations |
| `tutor_documents` | **PRIVATE** — identity + education docs |
| `tutor_assessments` | Knowledge test results |
| `tutor_interviews` | Teaching ability interview |
| `tutor_verifications` | Immutable status change audit log |

### Matching tables
| Table | Description |
|-------|-------------|
| `tuition_requirements` | Parent's tutor request |
| `tutor_matches` | Admin shortlist per requirement |
| `demo_classes` | Free demo session |
| `enrollments` | Active tuition engagement |

### Operational tables
| Table | Description |
|-------|-------------|
| `attendance` | Per-session presence log |
| `reviews` | Parent ratings (published after admin approval) |
| `payments` | Fee payment records |
| `notifications` | In-app + out-of-band notification log |
| `support_tickets` | Support requests + replies |
| `admin_actions` | Immutable admin audit trail |

## Security model

### Data never exposed publicly
- `profiles.phone`
- `parent_profiles.address_line1`, `address_line2`, `pincode`
- `student_profiles.special_needs`
- `tutor_profiles.date_of_birth`, `pincode`, `admin_notes`, `rejection_reason`
- `tutor_documents.file_url`, `admin_notes`
- `tutor_assessments.assessment_notes`
- `tutor_interviews.interviewer_notes`
- `tutor_verifications.internal_notes`
- `tuition_requirements.pincode`, `admin_notes`
- `enrollments.home_address`
- `support_ticket_replies.is_internal = TRUE`
- `admin_actions.notes`

### RLS principals
| Role | Access |
|------|--------|
| **Parent** | Own profile, students, requirements, matches (view), demos, attendance, reviews, payments, notifications, support tickets |
| **Tutor** | Own profile + onboarding data, own documents, own assessments/interviews, matched requirements (no pincode), own demos, own enrollments, own attendance, own published reviews |
| **Admin** | All tables (operational access). Cannot bypass audit log immutability. |
| **Public/Unauthenticated** | Verified tutor public profiles only (safe columns enforced at API layer) |

### Document security (tutor-documents bucket)
- Bucket is **not public**
- Tutors upload to `tutor-documents/{tutor_profile_id}/...`
- Tutors read only their own folder
- Admins can read all
- Parents have **zero access**
- `file_url` is never returned via any public API route

## Verification pipeline

```
draft → pending → profile_submitted → [documents_pending] →
under_review → assessment_pending → interview_pending →
verified | rejected | suspended
```

Every status transition is logged to `tutor_verifications` (immutable).

## Demo accounts (dev/staging only)

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@demo.tutormeet.in | Demo@12345 |
| Parent | parent@demo.tutormeet.in | Demo@12345 |
| Tutor (verified) | tutor1@demo.tutormeet.in | Demo@12345 |
| Tutor (pending) | tutor2@demo.tutormeet.in | Demo@12345 |

> Auth users must be created separately in Supabase Dashboard. The seed SQL inserts profile rows — auth rows must exist first.
