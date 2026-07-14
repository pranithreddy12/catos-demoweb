// Thin client over the LunaCat FastAPI backend (via the /api vite proxy).
// Spine endpoints require the Firebase ID token; the auth layer registers hooks
// here so every request carries `Authorization: Bearer <token>` and a 401 bounces
// the user back to sign-in.

import { DEMO, demoGet, demoWrite } from './lib/demoData'

const BASE = '/api'

interface AuthHooks {
  getToken: () => Promise<string | null>
  onUnauthorized: () => void
}
let _hooks: AuthHooks | null = null

// Called once by the AuthProvider on mount.
export function setAuthHooks(h: AuthHooks) {
  _hooks = h
}

async function authHeader(): Promise<Record<string, string>> {
  const t = _hooks ? await _hooks.getToken().catch(() => null) : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function check(r: Response, path: string) {
  if (r.status === 401) _hooks?.onUnauthorized()
  if (!r.ok) throw new Error(`${r.status} ${path}`)
}

// Transient failures right after login (cold backend, DB pool / proxy warmup,
// token minting) shouldn't surface as a hard error — retry a few times before
// giving up. Only network errors and 5xx are retried; 401/403/404 fail fast so
// auth bounces and not-found handling stay immediate. Writes are never retried.
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (e: any) {
      // check() throws `${status} ${path}`; a network failure throws a TypeError
      // with no leading status, so parseInt -> NaN. Both mean "try again".
      const status = parseInt(String(e?.message ?? '').slice(0, 3), 10)
      const transient = Number.isNaN(status) || status >= 500
      if (!transient || attempt >= tries) throw e
      await new Promise((r) => setTimeout(r, 250 * attempt))
    }
  }
}

async function get<T>(path: string): Promise<T> {
  if (DEMO) return demoGet(path) as T
  return withRetry(async () => {
    const r = await fetch(`${BASE}${path}`, { headers: { ...(await authHeader()) } })
    check(r, path)
    return r.json() as Promise<T>
  })
}
async function post<T>(path: string, body: unknown): Promise<T> {
  if (DEMO) return demoWrite(path) as T
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(body),
  })
  check(r, path)
  return r.json()
}
async function del<T>(path: string): Promise<T> {
  if (DEMO) return demoWrite(path) as T
  const r = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: { ...(await authHeader()) } })
  check(r, path)
  return r.json()
}
async function patch<T>(path: string, body: unknown): Promise<T> {
  if (DEMO) return demoWrite(path) as T
  const r = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(body),
  })
  check(r, path)
  return r.json()
}

export interface Breed {
  id: string
  name: string
  temperament?: string[]
  lifespan_years?: number
  origin?: string
  description?: string
}
export interface BreedRisk {
  condition_name: string
  risk_multiplier?: number
  risk_level?: string
  evidence_level?: string
  notes?: string
}
export interface VaccineRef {
  name: string
  full_name: string
  category: 'core' | 'non-core'
  protects_against: string
  aliases: string[]
}
export interface MedicationRef {
  name: string
  treats: string
  typical_route: string
  aliases: string[]
}
export interface AdminOverview {
  generated_at: string
  totals: Record<string, number>
  growth_7d: Record<string, number>
  clusters: { active_cats: number; by_type: { cluster_key: string; n: number }[]; by_urgency: { urgency: string; n: number }[]; validated: number }
  reports_by_kind: { kind: string; n: number }[]
  reference: Record<string, number>
  cats: { id: string; name: string; breed?: string; sex?: string; since?: string; owner?: string; active_clusters: number }[]
  system: { environment: string; threshold_version: string; ollama_healthy: boolean; ollama_model: string }
}
export interface AdminCatDetail {
  cat: { id: string; name: string; dob?: string; sex?: string; is_neutered?: boolean; created_at?: string; breed?: string; owner?: string }
  counts: Record<string, number>
  active_clusters: { cluster_key: string; activation_level: string; urgency_level?: string; signals_count: number }[]
  latest_weight?: { weight_kg: number; on: string } | null
}
export interface AppNotification {
  id: string
  cat_id?: string
  notification_type: string
  title: string
  body?: string | null
  severity?: 'mild' | 'moderate' | 'significant' | null
  metric?: string | null
  normalisation_text?: string | null
  read: boolean
  read_at?: string | null
  created_at: string
}
export interface ReportValue { name: string; result: string; unit: string; reference: string; flag: string }
export interface ReportAnalysis {
  status: string
  summary?: string | null
  values?: ReportValue[]
  note?: string | null
  method?: string | null
}
export interface FoodProduct {
  id: string
  product_name: string
  brand?: string
  category?: string
  texture?: string
  life_stage?: string
  ingredient_list?: string
  phosphorus_mg_per_100g?: number
  fat_g_per_100g?: number
  fibre_g_per_100g?: number
  moisture_pct?: number
  calories_per_100g?: number
  image_url?: string
}
export interface DmbResult {
  dry_matter_pct: number | null
  computable: boolean
  carb_estimated?: boolean
  dmb: Record<string, number | null>
  warnings: string[]
}
export interface FlagResult {
  flags: { level: string; scope: string; message_key: string; message: string }[]
  has_danger: boolean
}

export interface Passport {
  cat: {
    id: string
    name: string
    dob?: string
    sex?: string
    is_neutered?: boolean
    weight_kg?: number
    microchip_id?: string
    profile_photo_url?: string
    created_at?: string
    breed_name?: string
    breed_origin?: string
  }
  owner?: { display_name?: string; email?: string }
  vaccinations: {
    vaccine_name: string
    vaccine_type?: string
    administered_date: string
    valid_until?: string
    vet_name?: string
    clinic_name?: string
    lot_number?: string
    is_official?: boolean
  }[]
  vet_visits: {
    visit_date: string
    vet_name?: string
    clinic_name?: string
    reason?: string
    diagnosis_given?: string
    procedure_performed?: boolean
    procedure_type?: string
    notes?: string
  }[]
  weight_logs: { weight_kg: number; body_condition_score?: number; logged_at: string }[]
  medications: {
    id?: string
    medication_name: string
    condition_being_treated?: string
    dose_amount?: number
    dose_unit?: string
    frequency?: string
    route?: string
    start_date: string
    end_date?: string
    active?: boolean
  }[]
  feeding: {
    logged_at: string
    amount_grams?: number
    meal_type?: string
    notes?: string
    product_name?: string
    brand?: string
    texture?: string
  }[]
  reports?: {
    id: string
    kind: string
    filename?: string
    mime?: string
    notes?: string
    uploaded_at: string
    analysis_status?: string
    analysis_summary?: string | null
    analysis_values?: ReportValue[] | null
    analysis_method?: string | null
  }[]
  checkins?: { logged_at: string; water?: string; ate_pct?: number; mood?: string }[]
  current_food?: { product_id: string; product_name?: string; brand?: string; image_url?: string; logged_at?: string } | null
  current_food_assessment?: {
    product_id: string; product_name?: string; conditions_checked: string[]
    dmb: Record<string, number | null>
    checks: { condition: string; nutrient: string; food_dmb: number; target_min: number | null; target_max: number | null; unit: string; importance?: string; status: 'ok' | 'above' | 'below' }[]
    toxin_flags: { level: string; message: string }[]
    has_concerns: boolean; note: string
  } | null
  vet_forecast?: Record<string, { trajectory: string; projected: number | null; projected_deviation_pct: number | null; days_to_threshold: number | null; horizon_days: number }>
  // Lab values from analysed reports — clinician-facing facts, never a diagnosis.
  lab_findings?: { marker: string; result: string; unit: string; reference: string; flag: 'high' | 'low'; area: string; area_label: string; caveat: boolean; date?: string | null }[]
  lab_nudge?: { count: number; areas: string[]; message: string } | null

  narrative_state?: string  // STABLE | EMERGING | DEVELOPING | ACUTE | RESOLVING
  patterns?: Pattern[]
  owner_summary?: OwnerSummary
  vet_summary?: VetSummaryItem[]
}

// A "pattern worth mentioning" — a cluster of changes the engine noticed. NOT a
// diagnosis: owner_label/owner_note are calm, area names the body system a vet
// might check, vet_label is the (preliminary) clinician-facing phrasing, and
// clinically_validated stays false until a vet signs off the thresholds.
export interface Pattern {
  cluster_key: string
  activation_level: 'partial' | 'active' | 'high'
  urgency_level: 'watch' | 'urgent'
  signals_active?: string[]
  owner_label: string
  owner_note: string
  area: string
  vet_label: string
  clinically_validated: boolean
}

// The SINGLE consolidated owner narrative when clusters co-fire (backend
// cluster_service.consolidate_owner_narrative). Names no disease and asserts no
// relationship between patterns — it routes to ONE vet visit. `tone` mirrors
// narrative_state; `areas` are the body systems involved (owner-safe labels);
// `emergency` / tone ACUTE lead with the urgent wording.
export interface OwnerSummary {
  tone: string
  headline: string
  body: string
  pattern_count: number
  areas: string[]
  emergency: boolean
  not_a_diagnosis?: boolean
  lead_cluster?: string | null
}

// Per-cluster clinical detail for the clinician-facing vet summary — kept
// separate and NAMED (vet_label), never collapsed into the owner narrative.
export interface VetSummaryItem {
  cluster_key: string
  vet_label: string
  area: string
  urgency_level: 'watch' | 'urgent'
  activation_level: 'partial' | 'active' | 'high'
  signals_active?: string[]
  clinically_validated: boolean
  emergency?: boolean
}

// Lightweight cat row for the login cat-loader + Profile switcher (GET /onboarding/cats).
export interface CatSummary {
  id: string
  name: string
  sex?: string
  dob?: string
  breed_name?: string
  narrative_state?: string
  profile_photo_url?: string
}

export interface NewCat {
  name: string
  breed_id?: string
  breed_name?: string
  dob?: string
  sex?: string
  is_neutered?: boolean
  weight_kg?: number
  microchip_id?: string
  photo_url?: string
}

// --- Commerce V1: the "signpost" catalogue. No prices, no stock, no checkout. ---
export type SafetyClass = 'recommendable' | 'explain_only' | 'blocked'

export interface CatalogOfferButton { offer_id: string; merchant: string; label: string }

export interface CatalogProduct {
  id: string
  name: string
  brand?: string | null
  category?: string | null
  safety_class: SafetyClass
  description?: string | null
  /** explain_only only — MUST render above the buy buttons. */
  vet_note?: string | null
  explain_only_wording?: string | null
  image_url?: string | null
  offers: CatalogOfferButton[]
  /** Present whenever buy buttons are shown. */
  disclosure?: string | null
}

export interface AdminOffer {
  id: string
  product_id: string
  merchant: string
  affiliate_url?: string | null
  merchant_product_url?: string | null
  display_priority: number
  is_active: boolean
  notes_internal?: string | null
}

export interface AdminCatalogProduct {
  id: string
  name: string
  brand?: string | null
  category?: string | null
  safety_class: SafetyClass
  description?: string | null
  vet_note?: string | null
  image_url?: string | null
  is_active: boolean
  offers: AdminOffer[]
}

export interface AffiliateClickRow {
  id: string
  product_id: string
  product_name?: string | null
  merchant_offer_id?: string | null
  merchant?: string | null
  surface?: string | null
  result: string
  platform?: string | null
  clicked_at: string
}

export const api = {
  passportFor: (catId: string) => get<Passport>(`/passport/${catId}`),
  myCats: () => get<CatSummary[]>('/onboarding/cats'),
  consent: () => get<{ accepted: boolean; accepted_at?: string; policy_version?: string; current_version: string }>('/consent'),
  acceptConsent: () => post<{ ok: boolean; accepted_at: string }>('/consent/accept', {}),
  createCat: (body: NewCat) => post<{ cat_id: string }>('/onboarding/cats', body),
  onboardingAudit: (
    catId: string,
    body: { known_conditions?: string[]; drinks_from_fountain?: boolean; diet_wet_pct?: number; litter_box_count?: number; indoor_only?: boolean },
  ) => post<{ home_health_score?: number; insights?: unknown[]; risk_flags?: string[] }>(`/cats/${catId}/onboarding-audit`, body),
  logWeight: (catId: string, weight_kg: number, body_condition_score?: number) =>
    post<{ ok: boolean; total_weigh_ins: number }>(`/onboarding/cats/${catId}/log/weight`, { weight_kg, body_condition_score }),
  logFood: (catId: string, consumed_pct: number, notes?: string) =>
    post<{ ok: boolean }>(`/onboarding/cats/${catId}/log/food`, { consumed_pct, notes }),
  // Set the cat's current food by logging the chosen product (latest wins).
  setCurrentFood: (catId: string, productId: string) =>
    post<{ ok: boolean }>(`/onboarding/cats/${catId}/log/food`, { product_id: productId }),
  checkin: (catId: string, body: { mood?: string; ate_pct?: number; water?: string; note?: string }) =>
    post<{ ok: boolean }>(`/onboarding/cats/${catId}/checkin`, body),
  logMed: (catId: string, medication_id: string, given = true) =>
    post<{ ok: boolean }>(`/onboarding/cats/${catId}/log/med`, { medication_id, given }),
  logSymptom: (catId: string, symptom_id: string, notes?: string) =>
    post<{ ok: boolean; tier: string }>(`/onboarding/cats/${catId}/log/symptom`, { symptom_id, notes }),
  logLitter: (
    catId: string,
    body: { event_type?: string; frequency_feel?: string; straining?: boolean; blood_present?: boolean; volume_estimate?: string; notes?: string },
  ) => post<{ ok: boolean }>(`/onboarding/cats/${catId}/log/litter`, body),
  addVaccination: (catId: string, body: { vaccine_name: string; administered_date?: string; valid_until?: string }) =>
    post<{ ok: boolean; total: number }>(`/onboarding/cats/${catId}/vaccination`, body),
  uploadReport: async (catId: string, file: File, kind = 'other', notes = '') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    if (notes) fd.append('notes', notes)
    const r = await fetch(`${BASE}/onboarding/cats/${catId}/reports`, {
      method: 'POST', body: fd, headers: { ...(await authHeader()) },
    })
    if (r.status === 401) _hooks?.onUnauthorized()
    if (!r.ok) throw new Error(`${r.status} upload`)
    return r.json() as Promise<{ id: string; kind: string; filename: string }>
  },
  reportFileUrl: (id: string) => `${BASE}/onboarding/reports/${id}/file`,
  analyzeReport: (catId: string, reportId: string) =>
    post<ReportAnalysis>(`/onboarding/cats/${catId}/reports/${reportId}/analyze`, {}),
  // The file endpoint is authenticated, so a plain <a href> navigation 401s (no
  // Authorization header). Fetch it WITH the bearer token as a blob and open that.
  // window.open is called synchronously first to keep the user gesture (popup-safe).
  openReport: async (id: string, filename?: string) => {
    const w = window.open('', '_blank')
    try {
      const r = await fetch(`${BASE}/onboarding/reports/${id}/file`, { headers: { ...(await authHeader()) } })
      if (r.status === 401) _hooks?.onUnauthorized()
      if (!r.ok) throw new Error(`${r.status} report`)
      const url = URL.createObjectURL(await r.blob())
      if (w) w.location.href = url; else window.location.href = url
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      if (w) w.close()
      throw e
    }
  },
  breeds: () => get<Breed[]>('/cats/breeds'),
  breedRisks: (breedId: string) =>
    get<{ breed: string; risks: BreedRisk[] }>(`/cats/breeds/${breedId}/risks`),
  vaccineRefs: (q = '') =>
    get<VaccineRef[]>(`/cats/vaccines${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  medicationRefs: (q = '') =>
    get<MedicationRef[]>(`/cats/medication-reference${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  addMedication: (catId: string, body: {
    medication_name: string; condition_being_treated?: string; dose_amount?: number | null
    dose_unit?: string; frequency?: string; route?: string; start_date: string
  }) => post<{ id: string; medication_name: string; start_date: string }>(`/cats/${catId}/medications/`, body),
  symptoms: () => get<any[]>('/cats/symptoms'),
  foods: (q = '', limit = 40) =>
    get<FoodProduct[]>(`/food/products?limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  productByBarcode: (code: string) =>
    get<FoodProduct>(`/food/products/barcode/${encodeURIComponent(code)}`),
  foodRecallCheck: (brand: string, name = '') =>
    get<{ recalled: boolean; count: number; matches: { reason_for_recall?: string; recalling_firm?: string; classification?: string; product_description?: string }[] }>(
      `/food/recalls/check?brand=${encodeURIComponent(brand)}&name=${encodeURIComponent(name)}`),
  foodRecalls: (daysBack = 365) =>
    get<{ recalls: { recalling_firm?: string; brand_name?: string; reason_for_recall?: string; classification?: string; report_date?: string; product_description?: string }[]; count: number }>(
      `/food/recalls?days_back=${daysBack}`),
  felineDrugSafety: (drug: string) =>
    get<{ drug_name: string; total_reports: number; reactions: { reaction: string; count: number }[] }>(
      `/vet-drug/drug/${encodeURIComponent(drug)}/feline-safety?limit=50`),
  dmb: (panel: Record<string, number | null>) => post<DmbResult>('/nutrition/dmb', panel),
  ingredientFlags: (ingredient_list: string, conditions: string[] = []) =>
    post<FlagResult>('/nutrition/ingredient-flags', { ingredient_list, conditions }),
  conditions: (q: string) => get<any[]>(`/research/conditions?q=${encodeURIComponent(q)}&vet_reviewed=false`),
  stats: () => get<any>('/stats/overview'),
  notifications: (unreadOnly = false) => get<AppNotification[]>(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),
  notificationsUnread: () => get<{ unread: number }>('/notifications/unread-count'),
  markNotificationRead: (id: string) => post<{ read: boolean }>(`/notifications/${id}/read`, {}),
  markAllNotificationsRead: () => post<{ marked_read: number }>('/notifications/read-all', {}),
  // --- Commerce V1 ---
  catalogProducts: () => get<CatalogProduct[]>('/products'),
  catalogProduct: (id: string) => get<CatalogProduct>(`/products/${encodeURIComponent(id)}`),
  /** Logs the tap server-side FIRST, then hands back the URL to open. */
  productClick: (
    productId: string,
    body: { merchant_offer_id: string; surface?: string; cat_id?: string; platform?: string },
  ) => post<{ url: string; result: string; merchant: string }>(
    `/products/${encodeURIComponent(productId)}/click`, body),
  adminCatalog: () => get<AdminCatalogProduct[]>('/admin/catalog/products'),
  adminCreateProduct: (body: Record<string, unknown>) =>
    post<{ id: string; created: boolean }>('/admin/catalog/products', body),
  adminUpdateProduct: (id: string, body: Record<string, unknown>) =>
    patch<{ id: string; updated: boolean }>(`/admin/catalog/products/${encodeURIComponent(id)}`, body),
  adminCreateOffer: (body: Record<string, unknown>) =>
    post<{ id: string; created: boolean }>('/admin/catalog/offers', body),
  adminUpdateOffer: (id: string, body: Record<string, unknown>) =>
    patch<{ id: string; updated: boolean }>(`/admin/catalog/offers/${encodeURIComponent(id)}`, body),
  adminDeleteOffer: (id: string) =>
    del<{ id: string; deleted: boolean }>(`/admin/catalog/offers/${encodeURIComponent(id)}`),
  adminClicks: (limit = 100) => get<AffiliateClickRow[]>(`/admin/catalog/clicks?limit=${limit}`),

  adminOverview: () => get<AdminOverview>('/admin/overview'),
  adminCatDetail: (id: string) => get<AdminCatDetail>(`/admin/cats/${id}`),
  adminRefreshCat: (id: string) =>
    post<{ ok: boolean; cat: string; narrative_state: string; active_clusters: string[] }>(`/admin/cats/${id}/refresh`, {}),
  adminDeleteCat: (id: string) => del<{ ok: boolean; deleted: string }>(`/admin/cats/${id}`),
}
