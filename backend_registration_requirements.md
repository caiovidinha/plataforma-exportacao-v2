# Backend Requirements — Registration & Auth Module

> Generated: 2026-03-03  
> Scope: New endpoints required to support the landing page, onboarding flow, and per-entity registration.

---

## 1. Auth Endpoints

### `POST /auth/register`

Create a new user account. The `entity_type` field drives downstream profile creation.

> **Multi-User Note:** The first user to register for a given CNPJ/entity automatically becomes the entity **ADMIN**. The entity record (company) is created in parallel. Subsequent users belonging to the same entity must be invited by an existing ADMIN via `POST /entity/members/invite` rather than going through the standard registration flow.

**Request body:**
```json
{
  "entity_type": "EXPORTADOR | IMPORTADOR | TRANSPORTADORA | COMPANHIA_NAVEGACAO | DESPACHANTE | CORRETORA | TERMINAL_ALFANDEGARIO | SEGURADORA | CERTIFICADORA | LABORATORIO",
  "email": "user@company.com",
  "password": "min 8 chars",
  "company": {
    "company_name": "string (required)",
    "cnpj": "string — CNPJ for BR entities, VAT/Tax ID for foreign",
    "contact_phone": "string",
    "website": "string | null"
  },
  "specifics": {
    "...": "entity-type specific key/value pairs (see Section 3)"
  }
}
```

**Response `201`:**
```json
{
  "user_id": "uuid",
  "entity_type": "EXPORTADOR",
  "access_token": "JWT",
  "refresh_token": "JWT",
  "onboarding_complete": false
}
```

**Error responses:**
| Code | Reason |
|------|--------|
| `400 VALIDATION_ERROR` | Missing required fields |
| `409 EMAIL_ALREADY_EXISTS` | Duplicate e-mail |
| `409 CNPJ_ALREADY_EXISTS` | Duplicate CNPJ/VAT |
| `422 INVALID_ENTITY_TYPE` | Unrecognized `entity_type` value |

---

### `POST /auth/login`

```json
// Request
{ "email": "string", "password": "string" }

// Response 200
{
  "access_token": "JWT",
  "refresh_token": "JWT",
  "user": { "...UserProfile" },
  "entity_type": "EXPORTADOR",
  "entity_id": "uuid"
}
```

**Error:** `401 INVALID_CREDENTIALS`

---

### `POST /auth/govbr`  *(Gov.br OIDC callback)*

```json
// Request
{ "code": "govbr_oidc_auth_code", "state": "csrf_token" }

// Response 200 — same shape as /auth/login
```

- Fetch user CPF + name from Gov.br `/userinfo`
- Upsert user, generate tokens
- If first-time Gov.br login → set `onboarding_complete: false`, redirect frontend to `/registro`

---

### `POST /auth/refresh`

```json
{ "refresh_token": "JWT" }
// Response: { "access_token": "JWT" }
```

---

### `POST /auth/logout`

Invalidates the refresh token. Requires `Authorization: Bearer <token>`.

---

## 2. User Profile Endpoints

### `GET /me`

Returns the current authenticated user with entity data merged.

```typescript
interface MeResponse extends UserProfile {
  entity_type: EntityType
  entity_id: string
  entity_profile: ExporterProfile | ImporterProfile | ServiceProviderProfile
  onboarding_complete: boolean
}
```

---

### `PATCH /me`

Update base profile fields (name, phone, website). Does **not** update entity-specific data.

---

### `PATCH /me/entity`

Update entity-specific fields (e.g., a transportadora updating coverage area).

```json
{
  "specifics": { "key": "value" }
}
```

Returns the merged entity profile.

---

### `PATCH /me/password`

```json
{ "current_password": "string", "new_password": "string" }
```

---

## 3. Entity-Specific Profile Tables

One table per entity type extending the base `users` table. All linked by `user_id` FK.

### `exporter_profiles`
| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid FK | |
| `origem_uf` | varchar(2) | |
| `cidade` | varchar | |
| `siscomex_code` | varchar | nullable |
| `mapa_registered` | enum(SIM, NAO, EM_ANDAMENTO) | |
| `mapa_code` | varchar | nullable |
| `ncm_codes` | text[] | |
| `capacidade_anual_ton` | decimal | nullable |

### `importer_profiles`
| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid FK | |
| `country_code` | char(2) | ISO 3166-1 |
| `target_port` | varchar | |
| `preferred_incoterm` | enum(FOB, CIF, …) | |
| `annual_volume_ton` | decimal | nullable |
| `certifications_required` | text | nullable |
| `ministry_registration` | varchar | nullable |

### `service_provider_profiles`

Shared table for all 8 service provider entity types, with nullable columns per type.

| Column | Type | Used by |
|--------|------|---------|
| `user_id` | uuid FK | all |
| `type` | ServiceProviderType enum | all |
| `rntrc` | varchar | TRANSPORTADORA |
| `ufs_cobertas` | text | TRANSPORTADORA |
| `tipos_veiculo` | text | TRANSPORTADORA |
| `valor_km` | decimal | TRANSPORTADORA |
| `ports_covered` | text[] | COMPANHIA_NAVEGACAO |
| `routes` | text | COMPANHIA_NAVEGACAO |
| `transit_time_days` | int | COMPANHIA_NAVEGACAO |
| `bl_draft_fee_usd` | decimal | COMPANHIA_NAVEGACAO |
| `habilitacao_siscomex` | bool | DESPACHANTE |
| `habilitacao_redex` | bool | DESPACHANTE |
| `fee_fixed_brl` | decimal | DESPACHANTE |
| `fee_variable_pct` | decimal | DESPACHANTE |
| `portos_atuacao` | text | DESPACHANTE |
| `bacen_authorization` | varchar | CORRETORA |
| `currency_pairs` | text[] | CORRETORA |
| `spread_pct` | decimal | CORRETORA |
| `liquidation_days` | int | CORRETORA |
| `swift_code` | varchar | CORRETORA |
| `porto_nome` | varchar | TERMINAL_ALFANDEGARIO |
| `capacidade_m3` | int | TERMINAL_ALFANDEGARIO |
| `fee_estufagem_usd` | decimal | TERMINAL_ALFANDEGARIO |
| `fee_armazem_dia_brl` | decimal | TERMINAL_ALFANDEGARIO |
| `susep_code` | varchar | SEGURADORA |
| `tipos_seguro` | text | SEGURADORA |
| `cobertura_minima_usd` | decimal | SEGURADORA |
| `cobertura_maxima_usd` | decimal | SEGURADORA |
| `premio_pct` | decimal | SEGURADORA |
| `certificacoes` | text[] | CERTIFICADORA |
| `acreditacao_inmetro` | bool | CERTIFICADORA |
| `acreditacao_mapa` | bool | CERTIFICADORA |
| `cod_autorizado` | bool | CERTIFICADORA |
| `fee_certificado_brl` | decimal | CERTIFICADORA |
| `mapa_accredited` | bool | LABORATORIO |
| `inmetro_accredited` | bool | LABORATORIO |
| `id_mapa` | varchar | LABORATORIO |
| `analises` | text[] | LABORATORIO |
| `prazo_laudo_horas` | int | LABORATORIO |
| `fee_aflatoxina_brl` | decimal | LABORATORIO |

---

## 4. Onboarding Status Endpoint

### `GET /me/onboarding`

Returns checklist of required steps for the entity type.

```json
{
  "entity_type": "EXPORTADOR",
  "steps": [
    { "key": "profile_complete",   "label": "Perfil completo",           "done": true },
    { "key": "mapa_registered",    "label": "Cadastro MAPA",             "done": false },
    { "key": "siscomex_linked",    "label": "SISCOMEX vinculado",        "done": false },
    { "key": "first_product",      "label": "Primeiro produto cadastrado","done": false },
    { "key": "first_offer",        "label": "Primeira oferta publicada", "done": false }
  ],
  "completion_pct": 20
}
```

Steps vary by entity type (see table below):

| Entity | Steps |
|--------|-------|
| EXPORTADOR | profile_complete, mapa_registered, siscomex_linked, first_product, first_offer |
| IMPORTADOR | profile_complete, first_interest |
| TRANSPORTADORA / COMPANHIA_NAVEGACAO / DESPACHANTE / CORRETORA / TERMINAL_ALFANDEGARIO / SEGURADORA / CERTIFICADORA / LABORATORIO | profile_complete, first_service_contract |

---

## 5. Public Entity Directory (for Marketplace)

### `GET /providers`

```
Query params:
  type=DESPACHANTE|LABORATORIO|...
  city=string
  mapa_accredited=true
  page=1&limit=20
```

**Returns** `PaginatedResponse<ServiceProvider>` — public profile only (no private fields like CNPJ).

---

### `GET /providers/:id`

Full public profile of a service provider.

---

## 6. MAPA Registration Webhook *(future integration)*

### `POST /webhooks/mapa`

Receives notification from MAPA system when a registration is approved.

```json
{
  "cnpj": "string",
  "mapa_code": "string",
  "status": "APROVADO | REPROVADO | PENDENTE",
  "issued_at": "ISO8601"
}
```

- Finds user by CNPJ
- Updates `exporter_profiles.mapa_registered` and `mapa_code`
- Sends email notification to user
- Creates a `MapaNotice` entry for the user's dashboard

---

## 7. Email Notifications Required

| Trigger | Template |
|---------|----------|
| Registration complete | `welcome_<entity_type>` |
| MAPA status changed | `mapa_status_update` |
| New match found | `new_match` |
| Negotiation message received | `negotiation_message` |
| Workflow step updated | `workflow_step_update` |

---

## 8. Auth Middleware Notes

- All `/dashboard/*` routes require `Authorization: Bearer <access_token>`
- Entity-gated routes (e.g., only EXPORTADOR can create offers): add `role` check middleware with `entity_type`
- EXPORTADOR with `mapa_registered = 'NAO'` should still have full access but receive MAPA notices

---

## 9. Role × Permission Matrix

### Entity-Type Permissions (what each company type can do)

| Action | EXPORTADOR | IMPORTADOR | Service Providers | ADMIN |
|--------|:---:|:---:|:---:|:---:|
| Create product | ✅ | ❌ | ❌ | ✅ |
| Create offer | ✅ | ❌ | ❌ | ✅ |
| Send interest (match) | ❌ | ✅ | ❌ | ✅ |
| Create negotiation | ✅ | ✅ | ❌ | ✅ |
| Create workflow | ✅ | ❌ | ❌ | ✅ |
| Accept service contract | ✅ | ❌ | ✅ | ✅ |
| Sign document (Gov.br) | ✅ | ✅ | ✅ | ✅ |
| View market intelligence | ✅ | ✅ | ❌ | ✅ |
| Register service providers via `/registro` | ❌ | ❌ | ✅ (self) | ✅ |

> **Access Control Note:** EXPORTADOR and IMPORTADOR cannot register service provider entities. Service providers (TRANSPORTADORA, COMPANHIA\_NAVEGACAO, DESPACHANTE, etc.) onboard exclusively through the `/registro/[tipo]` flow. Trading parties (exportador/importador) hire them through the Service Marketplace.

### Entity-Member Roles (what users within an entity can do)

| Action | ADMIN | OPERATOR | VIEWER |
|--------|:---:|:---:|:---:|
| Edit company profile | ✅ | ❌ | ❌ |
| Invite / remove members | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ❌ | ❌ |
| Create / edit products & offers | ✅ | ✅ | ❌ |
| Manage negotiations & workflows | ✅ | ✅ | ❌ |
| Accept / reject service contracts | ✅ | ✅ | ❌ |
| View all data (read-only) | ✅ | ✅ | ✅ |

---

## 10. Breaking Changes vs v1

| Change | Impact |
|--------|---------|
| `role` field on `users` now supports 10 entity types (was only EXPORTADOR/IMPORTADOR/ADMIN) | Requires DB migration + token re-issue |
| `/auth/register` now requires `entity_type` | Frontend registration form must send it |
| `/auth/register` body now includes `specifics` map | Backend must route to correct profile table |
| `/me` response now includes `entity_profile` | Frontend types updated accordingly |
| First registrant for an entity is assigned `entity_member_role: ADMIN` | New `entity_members` join table required |

---

## 11. Multi-User Entity Accounts

An **entity** (company) is the primary account unit. Multiple users can belong to the same entity, each with a distinct `EntityMemberRole`.

### Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full control — edit profile, manage members, perform all operations |
| `OPERATOR` | Day-to-day operations — products, offers, negotiations, contracts |
| `VIEWER` | Read-only access across all entity data |

### Data Model

```sql
-- entities table (one row per company)
CREATE TABLE entities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,  -- one of the 10 EntityRole values
  company_name TEXT NOT NULL,
  cnpj        TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- entity_members join table
CREATE TABLE entity_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id   UUID REFERENCES entities(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_role TEXT NOT NULL CHECK (entity_role IN ('ADMIN','OPERATOR','VIEWER')),
  joined_at   TIMESTAMPTZ DEFAULT now(),
  active      BOOLEAN DEFAULT true,
  UNIQUE (entity_id, user_id)
);
```

### Endpoints

#### `GET /entity/members`
List all members of the authenticated user\'s entity.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "entity_role": "ADMIN | OPERATOR | VIEWER",
    "joined_at": "ISO 8601",
    "active": true
  }
]
```
**Auth:** Required. Returns only members of the caller\'s entity.

---

#### `POST /entity/members/invite`
Invite a user to the entity by e-mail.

**Request body:**
```json
{
  "email": "invitee@company.com",
  "entity_role": "OPERATOR | VIEWER"
}
```

**Response `201`:**
```json
{ "invite_id": "uuid", "status": "PENDING", "email": "invitee@company.com" }
```

**Error responses:**
| Code | Reason |
|------|--------|
| `400 VALIDATION_ERROR` | Missing fields or invalid role |
| `403 FORBIDDEN` | Caller is not ADMIN |
| `409 ALREADY_MEMBER` | User already belongs to this entity |

---

#### `PATCH /entity/members/:id`
Update a member\'s role (ADMIN only).

**Request body:**
```json
{ "entity_role": "ADMIN | OPERATOR | VIEWER", "active": true }
```

**Response `200`:** Updated member object.

**Error:** `403 FORBIDDEN` if caller is not ADMIN.

---

#### `DELETE /entity/members/:id`
Remove a member from the entity (ADMIN only).

**Response `204`:** No content.

**Error:** `403 FORBIDDEN` if caller is not ADMIN; `400 CANNOT_REMOVE_LAST_ADMIN` if attempting to remove the only ADMIN.

---

## 12. Registration Flow Architecture

The platform has two distinct registration entry points that must not be conflated.

### `/registro` — New Entity Onboarding

- Accessible to **unauthenticated users**
- Shows a card grid of all 10 entity types
- Clicking a card navigates to `/registro/[tipo]` for that entity
- This is the **only** way for new entities to join the platform
- EXPORTADOR and IMPORTADOR use this flow to create their company accounts
- Service providers (TRANSPORTADORA, DESPACHANTE, etc.) also use this flow — they cannot be registered by a trading entity

### `/registro/[tipo]` — Entity-Type Specific Form

A 4-step wizard for each entity type:
1. **Basic Info** — company name, CNPJ, contact
2. **Entity-specific fields** — lanes, accreditations, capabilities (see Section 3)
3. **Account credentials** — admin user email + password
4. **Review & Submit**

On submit:
- Creates `entity` record
- Creates `user` record linked to entity
- Assigns `entity_member_role: ADMIN` to the first user
- Returns JWT pair for immediate login

### `/cadastro` — In-Dashboard Profile Management (post-login)

- Accessible only to **authenticated users**
- EXPORTADOR: manage Products, MAPA registration, Exporter Profile
- IMPORTADOR: manage Products, Importer Profile
- Service Providers: manage their full service catalogue, accreditations, etc.
- **Does NOT allow creating new entity types** — that is only via `/registro`

### Route Access Summary

| Route | Auth Required | Who Can Use |
|-------|:---:|-------------|
| `/registro` | No | Anyone (new entity signup) |
| `/registro/[tipo]` | No | Anyone (fills form for that entity type) |
| `/entrar` | No | Existing users |
| `/dashboard` | Yes | All logged-in users |
| `/cadastro` | Yes | Logged-in users (entity-aware filtering) |
| `/cadastro/mapa` | Yes | EXPORTADOR only |
| `/minha-conta` | Yes | All entity types |
| `/contratos-servico` | Yes | All entity types |
