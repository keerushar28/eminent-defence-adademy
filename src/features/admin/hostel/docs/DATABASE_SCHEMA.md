# Hostel Management Database Schema

## Overview

The Hostel Management module uses four main tables to manage hostel operations: `HostelRoom`, `HostelBed`, `HostelAllocation`, and `HostelPayment`. These tables are designed to maintain referential integrity and support complete historical tracking.

---

## Entity Relationship Diagram

```
┌─────────────────┐
│   HostelRoom    │
│─────────────────│
│ id (PK)         │
│ roomNumber      │◄──┐
│ capacity        │   │
│ defaultBedPrice │   │
│ description     │   │
│ isActive        │   │
│ createdAt       │   │
│ updatedAt       │   │
└─────────────────┘   │
                      │ 1:N
                      │
┌─────────────────┐   │
│   HostelBed     │   │
│─────────────────│   │
│ id (PK)         │   │
│ roomId (FK)     │───┘
│ bedNumber       │◄──┐
│ pricePerDay     │   │
│ status          │   │
│ isActive        │   │
│ createdAt       │   │
│ updatedAt       │   │
└─────────────────┘   │
                      │ 1:N
                      │
┌──────────────────┐  │
│ HostelAllocation │  │
│──────────────────│  │
│ id (PK)          │  │
│ studentId (FK)   │──┼──► Student (existing table)
│ roomId           │  │
│ bedId (FK)       │──┘
│ allocationDate   │
│ deallocationDate │
│ paidUntil        │◄──┐
│ isActive         │   │
│ notes            │   │
│ createdAt        │   │
│ updatedAt        │   │
└──────────────────┘   │
                       │ 1:N
                       │
┌──────────────────┐   │
│  HostelPayment   │   │
│──────────────────│   │
│ id (PK)          │   │
│ allocationId (FK)│───┘
│ amount           │
│ paymentDate      │
│ daysPurchased    │
│ updatedPaidUntil │
│ paymentMethod    │
│ referenceNumber  │
│ notes            │
│ createdBy        │
│ createdAt        │
└──────────────────┘
```

---

## Table Definitions

### HostelRoom

Stores information about hostel rooms.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (UUID) | PRIMARY KEY | Unique room identifier |
| roomNumber | String | UNIQUE, NOT NULL | Room number (e.g., "101", "A-201") |
| capacity | Integer | NOT NULL | Maximum number of beds allowed |
| defaultBedPrice | Decimal(10,2) | NOT NULL | Default daily rate for beds in this room |
| description | String | NULLABLE | Optional room description |
| isActive | Boolean | DEFAULT true | Whether room is active |
| createdAt | DateTime | DEFAULT now() | Record creation timestamp |
| updatedAt | DateTime | AUTO UPDATE | Record update timestamp |

**Indexes**:
- `roomNumber` (unique index for fast lookups)

**Relationships**:
- One-to-Many with `HostelBed`

**Business Rules**:
- Room number must be unique
- Capacity must be positive
- Default bed price must be positive
- Cannot delete room if beds exist

---

### HostelBed

Stores information about individual beds within rooms.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (UUID) | PRIMARY KEY | Unique bed ide