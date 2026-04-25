# CipherFoods

> Farmer-to-consumer eCommerce platform for traditional foods — delivering authentic farmer products from Telangana to your doorstep.

## Architecture

**Modular Monolith** built with NestJS, designed for a startup targeting 10K customers and 30-50 vendors.

```
┌─────────────────────────────────────────────────────┐
│                    API Gateway                       │
│              (NestJS + Keycloak JWT)                 │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────┤
│ Auth │Catalog│ Cart │Order │Pay't │Inven │ Delivery │
│      │      │      │      │      │      │          │
├──────┼──────┼──────┼──────┼──────┼──────┼──────────┤
│Notif │Vendor│Review│Promo │Admin │Media │ Support  │
└──────┴──────┴──────┴──────┴──────┴──────┴──────────┘
         │                │              │
    ┌────▼────┐    ┌─────▼─────┐  ┌────▼────┐
    │PostgreSQL│    │   Redis    │  │Keycloak │
    │  (RDS)   │    │(ElastiCache)│  │ (ECS)  │
    └──────────┘    └───────────┘  └─────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS 10, TypeScript, Node.js 20+ |
| **Database** | PostgreSQL 16 (TypeORM) |
| **Cache/Queue** | Redis 7 (ioredis, BullMQ) |
| **Auth** | Keycloak 24 (OAuth2/OIDC, JWT) |
| **Frontend** | Next.js 14+ (customer web, vendor panel, admin panel) |
| **Mobile** | React Native (Expo) — Phase 3 |
| **Media** | Cloudinary (signed uploads) |
| **Payments** | Razorpay (UPI, cards, COD) |
| **Delivery** | Dunzo/Porter API |
| **Search** | PostgreSQL full-text (tsvector + pg_trgm) |
| **Hosting** | AWS ECS Fargate |
| **IaC** | Terraform |
| **CI/CD** | GitHub Actions |
| **Monorepo** | Nx |

## Project Structure

```
cipherfoods-gpt/
├── apps/
│   ├── api/                 # NestJS modular monolith (backend)
│   ├── web/                 # Next.js customer web app
│   ├── vendor-panel/        # Next.js vendor dashboard
│   └── admin-panel/         # Next.js admin dashboard
├── libs/
│   └── shared/              # Shared types, constants, utilities
├── infra/
│   └── terraform/           # AWS infrastructure as code
├── .github/
│   ├── agents/              # VS Code Copilot agents
│   └── workflows/           # GitHub Actions CI/CD
├── docker-compose.yml       # Local dev stack
└── package.json             # Nx workspace root
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-org/cipherfoods-gpt.git
cd cipherfoods-gpt

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Start local infrastructure (PostgreSQL, Redis, Keycloak)
docker compose up -d

# 5. Start the API in development mode
npm run start:api:dev
```

The API will be running at `http://localhost:3000` with Swagger docs at `http://localhost:3000/docs`.

### Local Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:3000 | — |
| **Swagger** | http://localhost:3000/docs | — |
| **Keycloak** | http://localhost:8080 | admin / admin |
| **PostgreSQL** | localhost:5432 | cipherfoods / cipherfoods_dev |
| **Redis** | localhost:6379 | — |

## API Modules

| Module | Status | Description |
|--------|--------|-------------|
| Auth | ✅ Built | Keycloak integration, JWT, registration, login |
| Catalog | ✅ Built | Products, categories, full-text search, variants |
| Cart | ✅ Built | Multi-vendor cart, vendor grouping |
| Order | ✅ Built | Multi-vendor order splitting, lifecycle tracking |
| Payment | 🔲 Scaffold | Razorpay integration |
| Inventory | 🔲 Scaffold | Stock management, expiry tracking |
| Delivery | 🔲 Scaffold | Dunzo/Porter API integration |
| Notification | 🔲 Scaffold | Email, SMS, push, in-app |
| Vendor | 🔲 Scaffold | Onboarding, KYC, payouts |
| Review | 🔲 Scaffold | Ratings, moderation |
| Promotion | 🔲 Scaffold | Coupons, commissions |
| Admin | 🔲 Scaffold | Dashboard, platform management |
| Media | 🔲 Scaffold | Cloudinary uploads |
| Support | 🔲 Scaffold | Chatbot, Freshdesk tickets |

## Scripts

```bash
npm run start:api:dev   # Start API in watch mode
npm run build:api       # Build API for production
npm run lint            # Lint all projects
npm run test            # Run all tests
npm run docker:up       # Start infrastructure
npm run docker:down     # Stop infrastructure
```

## License


