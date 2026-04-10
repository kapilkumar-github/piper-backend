# 📘 Job Status Enum Documentation

## 🔹 Enum: `job_status`

This enum represents the lifecycle state of a job within the system.

---

## ✅ Values & Meanings

### 📝 `draft`

- Job is being created or edited
- Not visible to team members or candidates
- Can be safely modified or deleted

---

### 🟢 `open`

- Job is active and accepting candidates
- Visible to team members
- Default active hiring state

---

### ⏸️ `paused`

- Hiring is temporarily stopped
- Job is not actively accepting candidates
- Can be resumed later without losing data

---

### ✅ `closed`

- Hiring is completed
- No further candidates should be added
- Final state for completed hiring

---

### 📦 `archived`

- Job is no longer relevant
- Hidden from active views
- Used for historical/reference purposes

---

## 🧠 Lifecycle Flow (Recommended)

```text
draft → open → paused → open → closed → archived
```

---

## ⚠️ Notes

- `draft` should not be visible in normal job listings
- `closed` jobs should be read-only (recommended)
- `archived` jobs should be excluded from default queries
- Avoid deleting jobs — prefer `archived` for audit/history

---

## 🚀 Future Extensions

If needed, additional states can be added:

- `on_hold` → waiting for approval
- `cancelled` → job removed before completion

---

## 💡 Usage Guidelines

- Use `status` only for lifecycle
- Do NOT overload with pipeline stages (e.g. interview, offer)
- For candidate stages, create a separate `candidate_stage` enum

---

## 🔧 SQL Definition

```sql
CREATE TYPE job_status AS ENUM (
  'draft',
  'open',
  'paused',
  'closed',
  'archived'
);
```
