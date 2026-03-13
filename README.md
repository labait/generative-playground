# Generative AI Playground

A Node.js/TypeScript REST API for exploring generative AI models with role-based access control and wallet-based credit system.

## Features

- **Role-Based Access Control (RBAC)**: Three roles — `admin`, `user`, `viewer`
- **Wallet Credits System**: Users spend credits to run inference
- **Multiple AI Models**: Text and image generation (mocked)
- **JWT Authentication**: Secure token-based auth with bcrypt password hashing

## Roles

| Role    | List Models | Generate | Manage Users/Wallets |
|---------|-------------|----------|----------------------|
| admin   | ✅          | ✅       | ✅                   |
| user    | ✅          | ✅       | ❌                   |
| viewer  | ✅          | ❌       | ❌                   |

## Setup

```bash
npm install
npm run build
npm start
```

For development:
```bash
npm run dev
```

## Testing

```bash
npm test
```

## Linting

```bash
npm run lint
```

## Available Models

| Model ID              | Type  | Cost  |
|-----------------------|-------|-------|
| gpt-text-basic        | text  | 10 cr |
| gpt-text-advanced     | text  | 25 cr |
| dalle-image-basic     | image | 30 cr |
| dalle-image-advanced  | image | 50 cr |

## API Endpoints

### Auth

#### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}'
```

### Models

#### List Models
```bash
curl http://localhost:3000/api/models \
  -H "Authorization: Bearer <token>"
```

#### Generate
```bash
curl -X POST http://localhost:3000/api/models/gpt-text-basic/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Tell me a story"}'
```

### Wallet

#### Check Balance
```bash
curl http://localhost:3000/api/wallet \
  -H "Authorization: Bearer <token>"
```

### Admin

#### List Users
```bash
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <admin-token>"
```

#### Update User Role
```bash
curl -X PUT http://localhost:3000/api/admin/users/<userId>/role \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"viewer"}'
```

#### Top Up Wallet
```bash
curl -X POST http://localhost:3000/api/admin/users/<userId>/wallet/topup \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":100}'
```

## Notes

- The **first registered user** automatically gets the `admin` role
- New users start with **100 credits**
- Admins start with **10,000 credits**
- Credits are deducted **before** generation; if insufficient, returns `402 Payment Required`