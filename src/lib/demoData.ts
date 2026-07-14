// Design-showcase DEMO mode. Enabled at build time with VITE_DEMO_MODE=true.
//
// The whole app reads through the api client, so we short-circuit it here with
// realistic sample data: no login, no backend, no consent — a visitor lands
// straight on the app and can click through the screens. This is for SHOWING the
// UI to someone, not a real user experience (writes are no-ops).

export const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

// A cat is already "selected" so the app doesn't route to onboarding.
if (DEMO) {
  try { localStorage.setItem('lunacat-cat-id', 'demo-cat') } catch { /* ignore */ }
}

const PASSPORT = {
  cat: {
    id: 'demo-cat', name: 'Luna', dob: '2019-04-12', sex: 'female', is_neutered: true,
    weight_kg: 4.6, microchip_id: '981000012345678', created_at: '2026-01-10T09:00:00Z',
    breed_name: 'Domestic Shorthair', breed_origin: 'United States',
  },
  owner: { display_name: 'Showcase Guardian', email: 'demo@lunacat.app' },
  vaccinations: [
    { vaccine_name: 'Rabies', vaccine_type: 'core', administered_date: '2025-11-02', valid_until: '2028-11-02', vet_name: 'Dr. Amara Okafor', clinic_name: 'Riverside Feline Clinic', is_official: true },
    { vaccine_name: 'FVRCP', vaccine_type: 'core', administered_date: '2025-11-02', valid_until: '2026-11-02', vet_name: 'Dr. Amara Okafor', clinic_name: 'Riverside Feline Clinic', is_official: true },
  ],
  vet_visits: [
    { visit_date: '2025-11-02', vet_name: 'Dr. Amara Okafor', clinic_name: 'Riverside Feline Clinic', reason: 'Annual wellness exam', diagnosis_given: 'Healthy', procedure_performed: false, notes: 'Weight stable, dental grade 1.' },
  ],
  weight_logs: [
    { weight_kg: 4.9, body_condition_score: 6, logged_at: '2026-04-15T09:00:00Z' },
    { weight_kg: 4.8, logged_at: '2026-05-15T09:00:00Z' },
    { weight_kg: 4.7, logged_at: '2026-06-15T09:00:00Z' },
    { weight_kg: 4.6, body_condition_score: 5, logged_at: '2026-07-08T09:00:00Z' },
  ],
  medications: [
    { id: 'demo-med1', medication_name: 'Methimazole', condition_being_treated: 'Hyperthyroidism (managed)', dose_amount: 2.5, dose_unit: 'mg', frequency: 'Twice daily', route: 'oral', start_date: '2026-03-01', active: true },
  ],
  feeding: [
    { logged_at: '2026-07-11T07:30:00Z', amount_grams: 55, meal_type: 'main', product_name: 'Complete Health Chicken Pâté', brand: 'Wellness', texture: 'wet' },
    { logged_at: '2026-07-10T18:00:00Z', amount_grams: 50, meal_type: 'main', product_name: 'Complete Health Chicken Pâté', brand: 'Wellness', texture: 'wet' },
  ],
  checkins: [
    { logged_at: '2026-07-11T08:00:00Z', water: 'normal', ate_pct: 100, mood: 'settled' },
    { logged_at: '2026-07-10T08:00:00Z', water: 'normal', ate_pct: 90, mood: 'settled' },
  ],
  current_food: { product_id: 'demo-food1', product_name: 'Complete Health Chicken Pâté', brand: 'Wellness', image_url: '' },
  reports: [
    {
      id: 'demo-rep1', kind: 'bloodwork', filename: 'luna_bloodwork_jul.pdf', uploaded_at: '2026-07-05T10:00:00Z',
      analysis_status: 'done', analysis_method: 'pdf', analysis_values: [],
      analysis_summary: 'Bloodwork is broadly within normal limits. Kidney values (BUN, creatinine) sit at the upper-normal end — worth a recheck at the next visit. Thyroid (T4) is well-controlled on the current dose.',
    },
  ],
  lab_findings: [
    { marker: 'Creatinine', result: '1.9', unit: 'mg/dL', reference: '0.8–1.8', flag: 'high', area: 'renal', area_label: 'Kidney', caveat: false, date: '2026-07-05' },
  ],
  lab_nudge: { count: 1, areas: ['Kidney'], message: 'One lab value is slightly outside the usual range — worth mentioning at your next visit.' },
  narrative_state: 'STABLE',
  patterns: [
    { cluster_key: 'CKD_EARLY', activation_level: 'partial', urgency_level: 'watch', signals_active: ['weight_decline'], owner_label: 'Kidney watch', owner_note: 'A gentle weight easing alongside an upper-normal kidney value — nothing urgent, just worth keeping an eye on.', area: 'renal', vet_label: 'Early renal — monitor', clinically_validated: false },
  ],
  owner_summary: { tone: 'calm', headline: 'Mostly herself', body: 'Luna is settled and eating well. One small thing on the radar — a slight weight easing — otherwise her usual rhythm.', pattern_count: 1, areas: ['renal'], emergency: false, not_a_diagnosis: true, lead_cluster: 'CKD_EARLY' },
  vet_summary: [
    { cluster_key: 'CKD_EARLY', vet_label: 'Early renal — monitor', area: 'renal', urgency_level: 'watch', activation_level: 'partial', signals_active: ['weight_decline'], clinically_validated: false },
  ],
}

const MY_CATS = [
  { id: 'demo-cat', name: 'Luna', sex: 'female', dob: '2019-04-12', breed_name: 'Domestic Shorthair', narrative_state: 'STABLE' },
  { id: 'demo-cat2', name: 'Cleo', sex: 'female', dob: '2021-06-01', breed_name: 'British Shorthair', narrative_state: 'DEVELOPING' },
]

const STATS = { food_products: 4670, food_with_nutrients: 2539, breeds: 68, research_conditions: 89 }

const FOODS = [
  { id: 'demo-food1', product_name: 'Complete Health Chicken Pâté', brand: 'Wellness', texture: 'wet', calories_per_100g: 108, moisture_pct: 78 },
  { id: 'demo-food2', product_name: 'Pro Plan Kidney Care', brand: 'Purina', texture: 'dry', calories_per_100g: 398, moisture_pct: 8 },
  { id: 'demo-food3', product_name: 'Renal Support Morsels in Gravy', brand: 'Royal Canin', texture: 'wet', calories_per_100g: 92, moisture_pct: 82 },
  { id: 'demo-food4', product_name: 'Indoor Adult Salmon Recipe', brand: 'Wellness', texture: 'dry', calories_per_100g: 360, moisture_pct: 10 },
]

const CATALOG = [
  {
    id: 'demo-prod1', name: 'FortiFlora Probiotic Supplement', brand: 'Purina Pro Plan', safety_class: 'recommendable',
    description: 'Often used to support digestive health and a balanced gut. A daily probiotic powder sprinkled over food.',
    vet_note: null, explain_only_wording: null, image_url: '',
    offers: [{ offer_id: 'demo-o1', merchant: 'chewy', label: 'View at Chewy' }, { offer_id: 'demo-o2', merchant: 'amazon', label: 'View at Amazon' }],
    disclosure: 'LunaCat may earn a commission from purchases made through these links. This never affects what we recommend.',
  },
  {
    id: 'demo-prod2', name: 'Renal Support Therapeutic Diet', brand: 'Royal Canin', safety_class: 'explain_only',
    description: 'A therapeutic diet formulated to support kidney function.',
    vet_note: 'This is a therapeutic diet commonly used under veterinary guidance. It may require your vet’s authorization at the retailer.',
    explain_only_wording: 'This is a therapeutic diet commonly used under veterinary guidance. It may require your vet’s authorization at the retailer.',
    image_url: '',
    offers: [{ offer_id: 'demo-o3', merchant: 'chewy', label: 'View at Chewy' }],
    disclosure: 'LunaCat may earn a commission from purchases made through these links. This never affects what we recommend.',
  },
]

const NOTIFICATIONS = [
  { id: 'demo-n1', title: 'Luna: mild weight change', body: 'Luna’s weight shows a small easing versus her established baseline. This is informational; consult your veterinarian for medical concerns.', severity: 'mild', metric: 'weight_kg', normalisation_text: 'Small weight shifts are common and often settle on their own.', read: false, created_at: '2026-07-09T08:00:00Z' },
]

// Resolve a GET to sample data. Unknown paths fall back to [] (safe: .map works,
// .foo is undefined rather than a crash).
export function demoGet(path: string): any {
  const p = path.split('?')[0]
  if (p.startsWith('/passport')) return PASSPORT
  if (p === '/consent') return { accepted: true, accepted_at: '2026-01-10T09:00:00Z' }
  if (p === '/cats') return MY_CATS
  if (p === '/stats/overview') return STATS
  if (p.startsWith('/food/products/barcode')) return FOODS[0]
  if (p.startsWith('/food/products')) return FOODS
  if (p.startsWith('/notifications/unread')) return { unread: NOTIFICATIONS.length }
  if (p.startsWith('/notifications')) return NOTIFICATIONS
  if (p === '/products') return CATALOG
  if (p.startsWith('/products/')) return CATALOG.find((c) => p.includes(c.id)) || CATALOG[0]
  return []
}

// Writes are no-ops in the showcase. A product click "opens" a demo link.
export function demoWrite(path: string): any {
  if (path.includes('/click')) return { url: 'https://www.chewy.com', result: 'opened_affiliate', merchant: 'chewy' }
  if (path === '/consent/accept') return { ok: true, accepted_at: '2026-01-10T09:00:00Z' }
  return { ok: true, id: 'demo' }
}
