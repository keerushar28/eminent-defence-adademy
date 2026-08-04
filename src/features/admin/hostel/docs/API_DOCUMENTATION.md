# Hostel Management API Documentation

## Overview

The Hostel Management API provides endpoints for managing hostel rooms, beds, student allocations, payments, and billing. All endpoints require authentication and admin authorization.

**Base URL**: `/api/hostel`

---

## Room Management

### Create Room

**Endpoint**: `POST /api/hostel/rooms`

**Description**: Create a new hostel room

**Request Body**:
```json
{
  "roomNumber": "101",
  "capacity": 4,
  "defaultBedPrice": 150.00,
  "description": "Ground floor room with attached bathroom"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "roomNumber": "101",
  "capacity": 4,
  "defaultBedPrice": 150.00,
  "description": "Ground floor room with attached bathroom",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data
- `422 Unprocessable Entity`: Duplicate room number

---

### List Rooms

**Endpoint**: `GET /api/hostel/rooms`

**Description**: Retrieve a list of all rooms with pagination

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by room number
- `isActive` (optional): Filter by active status

**Response** (200 OK):
```json
{
  "rooms": [
    {
      "id": "uuid",
      "roomNumber": "101",
      "capacity": 4,
      "defaultBedPrice": 150.00,
      "description": "Ground floor room",
      "isActive": true,
      "beds": []
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### Get Room by ID

**Endpoint**: `GET /api/hostel/rooms/:roomId`

**Description**: Retrieve a single room with optional bed details

**Query Parameters**:
- `includeBeds` (optional): Include bed details (default: false)

**Response** (200 OK):
```json
{
  "id": "uuid",
  "roomNumber": "101",
  "capacity": 4,
  "defaultBedPrice": 150.00,
  "description": "Ground floor room",
  "isActive": true,
  "beds": [
    {
      "id": "uuid",
      "bedNumber": "A",
      "pricePerDay": 150.00,
      "status": "AVAILABLE"
    }
  ]
}
```

**Error Responses**:
- `404 Not Found`: Room not found

---

### Update Room

**Endpoint**: `PUT /api/hostel/rooms/:roomId`

**Description**: Update an existing room

**Request Body**:
```json
{
  "roomNumber": "101A",
  "capacity": 5,
  "defaultBedPrice": 175.00,
  "description": "Updated description"
}
```

**Response** (200 OK): Returns updated room object

**Error Responses**:
- `404 Not Found`: Room not found
- `422 Unprocessable Entity`: Duplicate room number

---

### Delete Room

**Endpoint**: `DELETE /api/hostel/rooms/:roomId`

**Description**: Delete a room (only if no beds exist)

**Response** (204 No Content)

**Error Responses**:
- `404 Not Found`: Room not found
- `422 Unprocessable Entity`: Room has beds

---

### Get Room Beds

**Endpoint**: `GET /api/hostel/rooms/:roomId/beds`

**Description**: Retrieve all beds in a specific room

**Response** (200 OK):
```json
[
  {
    "id": "uuid",
    "roomId": "uuid",
    "bedNumber": "A",
    "pricePerDay": 150.00,
    "status": "AVAILABLE",
    "isActive": true
  }
]
```

---

## Bed Management

### Create Bed

**Endpoint**: `POST /api/hostel/beds`

**Description**: Create a new bed in a room

**Request Body**:
```json
{
  "roomId": "uuid",
  "bedNumber": "A",
  "pricePerDay": 150.00
}
```

**Note**: `pricePerDay` is optional. If not provided, room's default price is used.

**Response** (201 Created):
```json
{
  "id": "uuid",
  "roomId": "uuid",
  "bedNumber": "A",
  "pricePerDay": 150.00,
  "status": "AVAILABLE",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Room not found
- `422 Unprocessable Entity`: Duplicate bed number in room or capacity exceeded

---

### Get Bed by ID

**Endpoint**: `GET /api/hostel/beds/:bedId`

**Description**: Retrieve a single bed

**Response** (200 OK): Returns bed object with room details

---

### Update Bed

**Endpoint**: `PUT /api/hostel/beds/:bedId`

**Description**: Update bed details

**Request Body**:
```json
{
  "bedNumber": "B",
  "pricePerDay": 175.00,
  "status": "INACTIVE"
}
```

**Note**: Cannot change status to ALLOCATED directly. Use allocation endpoints.

**Response** (200 OK): Returns updated bed object

**Error Responses**:
- `404 Not Found`: Bed not found
- `422 Unprocessable Entity`: Invalid status change

---

### Delete Bed

**Endpoint**: `DELETE /api/hostel/beds/:bedId`

**Description**: Delete a bed (only if not allocated)

**Response** (204 No Content)

**Error Responses**:
- `404 Not Found`: Bed not found
- `422 Unprocessable Entity`: Bed is allocated

---

## Allocation Management

### Create Allocation

**Endpoint**: `POST /api/hostel/allocations`

**Description**: Allocate a student to a bed

**Request Body**:
```json
{
  "studentId": "uuid",
  "bedId": "uuid",
  "allocationDate": "2024-01-01T00:00:00.000Z",
  "paidUntil": "2024-01-31T00:00:00.000Z",
  "notes": "Optional notes"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "studentId": "uuid",
  "roomId": "uuid",
  "bedId": "uuid",
  "allocationDate": "2024-01-01T00:00:00.000Z",
  "paidUntil": "2024-01-31T00:00:00.000Z",
  "isActive": true,
  "notes": "Optional notes",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Student or bed not found
- `422 Unprocessable Entity`: Student already has active allocation or bed not available

---

### List Allocations

**Endpoint**: `GET /api/hostel/allocations`

**Description**: Retrieve allocations with filters

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `studentId` (optional): Filter by student
- `roomId` (optional): Filter by room
- `isActive` (optional): Filter by active status

**Response** (200 OK): Returns paginated allocations

---

### Get Active Allocations

**Endpoint**: `GET /api/hostel/allocations/active`

**Description**: Retrieve all currently active allocations

**Response** (200 OK): Returns array of active allocations

---

### Get Allocation History

**Endpoint**: `GET /api/hostel/allocations/history`

**Description**: Retrieve allocation history including inactive allocations

**Query Parameters**:
- `studentId` (optional): Filter by student

**Response** (200 OK): Returns array of all allocations

---

### Get Allocation by ID

**Endpoint**: `GET /api/hostel/allocations/:allocationId`

**Description**: Retrieve a single allocation with full details

**Response** (200 OK): Returns allocation with student, bed, and room details

---

### Deallocate Student

**Endpoint**: `POST /api/hostel/allocations/:allocationId/deallocate`

**Description**: End a student's allocation

**Response** (200 OK):
```json
{
  "allocation": {
    "id": "uuid",
    "isActive": false,
    "deallocationDate": "2024-02-01T00:00:00.000Z"
  },
  "warning": {
    "hasWarning": true,
    "pendingAmount": 450.00,
    "message": "Student has pending fees of ₹450.00"
  }
}
```

**Note**: Returns warning if pending fees exist, but deallocation proceeds

---

## Payment Management

### Create Payment

**Endpoint**: `POST /api/hostel/allocations/:allocationId/payments`

**Description**: Record a payment for an allocation

**Request Body**:
```json
{
  "amount": 3000.00,
  "paymentDate": "2024-01-15T00:00:00.000Z",
  "paymentMethod": "CASH",
  "referenceNumber": "REF123",
  "notes": "Payment for January",
  "createdBy": "admin-user-id"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "allocationId": "uuid",
  "amount": 3000.00,
  "paymentDate": "2024-01-15T00:00:00.000Z",
  "daysPurchased": 20,
  "updatedPaidUntil": "2024-02-20T00:00:00.000Z",
  "paymentMethod": "CASH",
  "referenceNumber": "REF123",
  "notes": "Payment for January",
  "createdBy": "admin-user-id",
  "createdAt": "2024-01-15T00:00:00.000Z"
}
```

**Error Responses**:
- `404 Not Found`: Allocation not found
- `422 Unprocessable Entity`: Invalid amount (must be positive)

---

### Get Payment History

**Endpoint**: `GET /api/hostel/allocations/:allocationId/payments`

**Description**: Retrieve all payments for an allocation

**Response** (200 OK): Returns array of payments

---

### List All Payments

**Endpoint**: `GET /api/hostel/payments`

**Description**: Retrieve all payments with filters

**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `studentId` (optional): Filter by student
- `allocationId` (optional): Filter by allocation
- `startDate` (optional): Filter by date range
- `endDate` (optional): Filter by date range

**Response** (200 OK): Returns paginated payments

---

### Get Payment by ID

**Endpoint**: `GET /api/hostel/payments/:paymentId`

**Description**: Retrieve a single payment

**Response** (200 OK): Returns payment with allocation details

---

## Billing

### Get Pending Fees

**Endpoint**: `GET /api/hostel/billing/pending-fees`

**Description**: Retrieve all allocations with pending fees

**Query Parameters**:
- `includeInactive` (optional): Include deallocated allocations (default: true)

**Response** (200 OK):
```json
[
  {
    "allocationId": "uuid",
    "studentId": "uuid",
    "studentName": "John Doe",
    "roomNumber": "101",
    "bedNumber": "A",
    "allocationDate": "2024-01-01T00:00:00.000Z",
    "paidUntil": "2024-01-31T00:00:00.000Z",
    "pricePerDay": 150.00,
    "totalPayableDays": 45,
    "pendingDays": 15,
    "pendingAmount": 2250.00,
    "overpaidDays": 0,
    "creditAmount": 0,
    "isActive": true
  }
]
```

---

### Get Student Financial View

**Endpoint**: `GET /api/hostel/billing/student/:studentId`

**Description**: Retrieve complete financial summary for a student

**Response** (200 OK):
```json
{
  "allocations": [
    {
      "allocationId": "uuid",
      "roomNumber": "101",
      "bedNumber": "A",
      "allocationDate": "2024-01-01T00:00:00.000Z",
      "deallocationDate": null,
      "paidUntil": "2024-01-31T00:00:00.000Z",
      "pricePerDay": 150.00,
      "totalPayableDays": 45,
      "pendingDays": 15,
      "pendingAmount": 2250.00,
      "overpaidDays": 0,
      "creditAmount": 0,
      "isActive": true
    }
  ],
  "totalPending": 2250.00,
  "totalCredit": 0,
  "finalBalance": 2250.00
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": {}
}
```

### HTTP Status Codes

- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Business logic validation failed
- `500 Internal Server Error`: Server error

---

## Authentication

All endpoints require authentication. Include the authentication token in the request headers:

```
Authorization: Bearer <token>
```

---

## Rate Limiting

API requests are subject to rate limiting. Current limits:
- 100 requests per minute per user
- 1000 requests per hour per user

---

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (starts at 1)
- `limit`: Items per page (max 100)

Pagination response format:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

## Date Formats

All dates use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

Example: `2024-01-15T10:30:00.000Z`

---

## Decimal Precision

All monetary values use 2 decimal places.

Example: `150.00`, `2250.50`
