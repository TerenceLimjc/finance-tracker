# Personal Finance Tracker - System Architecture Document

**Project**: Personal Finance Tracker  
**Version**: 1.0  
**Architect**: System Architecture Team  
**Date**: March 15, 2026  
**Status**: Architecture Design  

## Executive Summary

This document defines the technical architecture for a **local web application** that processes financial statements, categorizes transactions using AI, and provides analytics through a React + Ant Design 6.x interface. The application runs entirely on the user's machine with no cloud dependencies.

## Architectural Decisions & Rationale

### ADR-001: Local Web Application Architecture
**Decision**: Build as a local web application with backend server + frontend SPA
**Rationale**: 
- Simpler deployment than desktop app packaging
- Better separation of concerns (frontend/backend)
- Easier development and debugging
- Standard web technologies throughout
- No Electron overhead or security concerns
- Better performance than hybrid desktop apps

### ADR-002: Technology Stack Selection

#### Frontend Stack
- **Framework**: React 18.2+ with TypeScript 5.0+
- **UI Library**: Ant Design 6.x (primary component library)
- **State Management**: Zustand (lightweight, TypeScript-first)
- **Build Tool**: Vite 5.x (fast builds, HMR, optimized bundling)
- **Charts**: @ant-design/charts v2.x (built on G2Plot)
- **HTTP Client**: TanStack Query v5 + Axios
- **Routing**: React Router v6.x

**Rationale**: Modern, performant stack with excellent TypeScript support and Ant Design 6.x integration.

#### Backend Stack
- **Runtime**: Node.js 20+ LTS
- **Framework**: Fastify 4.x (performance-focused, TypeScript support)
- **Database**: Better-SQLite3 with SQLCipher (encrypted local storage)
- **Vector Store**: Chroma DB (embedded mode for local vector operations)
- **File Processing**: 
  - PDF: pdf-parse + Tesseract.js (OCR)
  - CSV/Excel: Papa Parse + XLSX
- **AI Integration**: OpenAI SDK (with local LLM fallback option)

**Rationale**: Fast, secure, local-first architecture with encrypted data storage.

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL WEB APPLICATION                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Ant Design 6.x)     Backend (Node.js)    │
│  ┌─────────────────────────────────┐   ┌─────────────────── │
│  │  Presentation Layer             │   │  Application Layer │
│  │  ├── Dashboard                  │   │  ├── File Upload   │
│  │  ├── Transaction List           │   │  ├── AI Processing │
│  │  ├── Upload Management          │   │  └── Security      │
│  │  └── Analytics Dashboard        │   │                    │
│  └─────────────────────────────────┘   └─────────────────── │
│                    │                             │          │
│              HTTP/REST API                       │          │
│                    │                             │          │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   SQLite DB     │  │   Vector Store  │  │  File Store  │ │
│  │   (Encrypted)   │  │   (Chroma)      │  │   (Local)    │ │
│  │                 │  │                 │  │              │ │
│  │ • Transactions  │  │ • Embeddings    │  │ • Uploads    │ │
│  │ • Categories    │  │ • Descriptions  │  │ • Temp Files │ │
│  │ • Upload Meta   │  │ • ML Features   │  │ • Logs       │ │
│  │ • User Settings │  │                 │  │              │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Architecture

### Database Schema Design

```sql
-- Core Tables
CREATE TABLE uploads (
    id INTEGER PRIMARY KEY,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    processing_status TEXT DEFAULT 'pending',
    transaction_count INTEGER DEFAULT 0,
    date_range_start DATE,
    date_range_end DATE,
    bank_info TEXT,
    file_hash TEXT UNIQUE,
    metadata JSON
);

CREATE TABLE transactions (
    id INTEGER PRIMARY KEY,
    upload_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    merchant TEXT,
    account_info TEXT,
    payment_method TEXT,
    category_id INTEGER,
    category_confidence DECIMAL(3,2),
    user_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    parent_id INTEGER,
    color TEXT,
    icon TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE transaction_embeddings (
    transaction_id INTEGER PRIMARY KEY,
    embedding BLOB NOT NULL,
    model_version TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_upload ON transactions(upload_id);
CREATE INDEX idx_transactions_amount ON transactions(amount);
```

### Data Flow Architecture

```
File Upload Flow:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │───▶│   Parse     │───▶│  Vectorize  │───▶│   Store     │
│   Files     │    │   Content   │    │   & AI      │    │   Results   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                  │                  │
       │                   │                  │                  │
   • Validation        • PDF OCR          • OpenAI API       • SQLite
   • Duplicate         • CSV Parse        • Embeddings       • Vector DB
   • File Hash         • Excel Parse      • Categories       • File System
   • Metadata          • Data Clean       • Confidence       • Status Update
```

## Component Architecture

### Frontend Architecture (React + Ant Design 6.x)

```typescript
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   │   ├── Layout/     # App layout with Ant Design
│   │   ├── Loading/    # Loading states
│   │   └── ErrorBoundary/
│   ├── upload/         # File upload components
│   │   ├── UploadZone/ # Drag-drop using Ant Upload
│   │   ├── UploadList/ # File list with Ant Table
│   │   └── UploadProgress/
│   ├── transactions/   # Transaction components
│   │   ├── TransactionTable/ # Ant Table with filters
│   │   ├── TransactionFilters/ # Date/Category filters
│   │   └── TransactionDetails/
│   ├── analytics/      # Charts and insights
│   │   ├── SpendingCharts/ # @ant-design/charts
│   │   ├── CategoryPieChart/
│   │   └── TrendAnalysis/
│   └── settings/       # Configuration
├── hooks/              # Custom React hooks
│   ├── useTransactions.ts
│   ├── useUpload.ts
│   ├── useAnalytics.ts
│   └── useFilters.ts
├── services/           # API layer
│   ├── api.ts         # HTTP client setup
│   ├── uploadService.ts
│   ├── transactionService.ts
│   └── analyticsService.ts
├── store/             # Zustand stores
│   ├── transactionStore.ts
│   ├── uploadStore.ts
│   ├── filterStore.ts
│   └── settingsStore.ts
├── types/             # TypeScript definitions
│   ├── transaction.ts
│   ├── upload.ts
│   └── api.ts
├── utils/             # Utility functions
│   ├── formatters.ts  # Date/currency formatting
│   ├── validation.ts  # Form validation
│   └── constants.ts   # App constants
└── App.tsx            # Main app component
```

### Backend Architecture (Node.js + Fastify)

```typescript
src/
├── routes/            # API endpoints
│   ├── uploads.ts     # File upload routes
│   ├── transactions.ts # Transaction CRUD
│   ├── categories.ts  # Category management
│   └── analytics.ts   # Analytics endpoints
├── services/          # Business logic
│   ├── uploadService.ts    # File processing
│   ├── aiService.ts        # AI categorization
│   ├── vectorService.ts    # Vector operations
│   └── securityService.ts  # Encryption/security
├── processors/        # File processing
│   ├── pdfProcessor.ts     # PDF parsing + OCR
│   ├── csvProcessor.ts     # CSV parsing
│   ├── excelProcessor.ts   # Excel parsing
│   └── baseProcessor.ts    # Common interface
├── database/          # Database layer
│   ├── connection.ts  # SQLite connection
│   ├── migrations/    # Database migrations
│   └── models/        # Data models
├── middleware/        # Fastify middleware
│   ├── auth.ts        # Security headers
│   ├── validation.ts  # Request validation
│   ├── errorHandler.ts
│   └── logging.ts
├── utils/             # Utilities
│   ├── encryption.ts  # Data encryption
│   ├── fileUtils.ts   # File operations
│   └── validation.ts  # Data validation
├── config/            # Configuration
│   ├── database.ts    # DB config
│   ├── ai.ts          # AI service config
│   └── app.ts         # App configuration
└── server.ts          # Application entry point
```

## Security Architecture

### Local Data Security

```typescript
// Encryption Strategy
interface SecurityConfig {
  database: {
    encryption: 'AES-256-GCM';
    keyDerivation: 'PBKDF2';
    saltLength: 32;
    iterations: 100000;
  };
  files: {
    encryption: 'AES-256-CBC';
    secureDelete: true;
    tempCleanup: true;
  };
  memory: {
    sensitiveDataWipe: true;
    heapDumpProtection: true;
  };
}
```

### Security Measures
1. **Database Encryption**: SQLCipher with AES-256 encryption
2. **File Encryption**: Uploaded files encrypted at rest
3. **Memory Security**: Sensitive data wiped from memory
4. **Secure Deletion**: Cryptographic wiping of deleted data
5. **Network Security**: HTTPS for local server (self-signed cert)
6. **Input Validation**: Comprehensive validation and sanitization

## Performance Architecture

### Performance Optimizations

1. **Frontend Performance**:
   - Ant Design 6.x tree-shaking for smaller bundles
   - Virtual scrolling for large transaction lists
   - React.memo and useMemo for expensive operations
   - Code splitting with lazy loading
   - Service worker for caching

2. **Backend Performance**:
   - SQLite WAL mode for better concurrency
   - Connection pooling for database
   - Streaming for large file processing
   - Background processing for AI categorization
   - Caching for frequently accessed data

3. **Data Processing Performance**:
   - Batch processing for transactions
   - Worker threads for CPU-intensive tasks
   - Incremental vector indexing
   - Compressed storage for embeddings

### Performance Targets
- **App Startup**: <2 seconds
- **File Upload**: <5 seconds for 10MB PDF
- **Transaction Search**: <500ms for 10K records
- **Analytics Generation**: <3 seconds
- **Memory Usage**: <500MB for 100K transactions

## Deployment Architecture

### Local Development Setup
```bash
# Single command setup
npm run dev          # Starts both frontend and backend
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
# - Auto-reload on changes
```

### Production Build
```bash
# Build for local production use
npm run build        # Builds optimized frontend
npm run start        # Starts production server
# - Serves static files + API
# - Single port for simplicity
```

### Application Structure
```
finance-tracker/
├── frontend/        # React application
├── backend/         # Node.js API server  
├── database/        # SQLite database files (encrypted)
├── uploads/         # User uploaded files (encrypted)
├── logs/           # Application logs
└── config/         # Configuration files
```

## API Design

### REST API Specification

```typescript
// Core API Endpoints
interface APIEndpoints {
  // File Upload Management
  'POST /api/uploads': UploadFileRequest;
  'GET /api/uploads': GetUploadsResponse;
  'DELETE /api/uploads/:id': DeleteUploadRequest;
  
  // Transaction Operations  
  'GET /api/transactions': GetTransactionsRequest;
  'PUT /api/transactions/:id': UpdateTransactionRequest;
  'POST /api/transactions/categorize': CategorizeRequest;
  
  // Analytics
  'GET /api/analytics/spending': SpendingAnalyticsResponse;
  'GET /api/analytics/categories': CategoryAnalyticsResponse;
  'GET /api/analytics/trends': TrendAnalyticsResponse;
  
  // Categories
  'GET /api/categories': GetCategoriesResponse;
  'POST /api/categories': CreateCategoryRequest;
  'PUT /api/categories/:id': UpdateCategoryRequest;
}
```

## Next Steps

### Implementation Plan

1. **Phase 1: Foundation (Weeks 1-2)**
   - Set up development environment
   - Initialize React + Vite + TypeScript project
   - Set up Fastify backend with SQLite
   - Basic project structure and tooling

2. **Phase 2: Core Features (Weeks 3-8)**
   - File upload system with encryption
   - PDF/CSV processing pipeline
   - Basic transaction display with Ant Design 6.x
   - AI categorization integration

3. **Phase 3: Advanced Features (Weeks 9-12)**
   - Analytics dashboard with charts
   - Upload management interface
   - Security hardening

3. **Phase 3: Final Polish & Testing (Weeks 13-14)**
   - Performance optimization
   - Error handling and edge cases
   - User experience refinement
   - Documentation

**Total Timeline**: 14 weeks for complete Version 1.0

### Technology Proof of Concepts Needed

1. **SQLCipher Integration**: Verify encrypted SQLite works with Better-SQLite3
2. **Chroma DB Embedded**: Test local vector storage performance
3. **PDF OCR Accuracy**: Test Tesseract.js accuracy on bank statements
4. **Ant Design 6.x Charts**: Verify @ant-design/charts integration
5. **File Encryption**: Test AES-256 file encryption performance

Would you like me to proceed with creating the detailed implementation plan or would you prefer to start with any specific proof of concepts first?

## Architecture Validation

This architecture addresses all your requirements:
- ✅ **Local Web App**: No desktop app complexity, pure web technologies
- ✅ **File Upload**: Multi-format support with encryption
- ✅ **AI Categorization**: OpenAI integration with local fallback
- ✅ **React + Ant Design 6.x**: Modern UI with consistent design
- ✅ **Transaction Management**: Full CRUD with filtering and search
- ✅ **Upload Management**: Complete lifecycle with cascade deletion
- ✅ **Analytics**: Rich visualizations and insights
- ✅ **Local Storage**: Encrypted database and file storage
- ✅ **Security**: Bank-level protection for local data

The architecture is designed for a single-user, local-first application that provides enterprise-grade functionality while maintaining simplicity and security.