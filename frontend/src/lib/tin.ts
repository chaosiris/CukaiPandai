// LHDN Malaysian TIN (Nombor Pengenalan Cukai) validation — shared by the entity forms.
// A TIN is an LHDN prefix code + digits (post-2023 a trailing 0 was appended, so digit count varies).
// Mirrors the backend validator in core/models.py — keep the two in sync.

const TIN_PREFIXES = [
  'C', // company (Sdn Bhd / Bhd)
  'CS', // co-operative society
  'D', // partnership
  'E', // employer
  'F', // association
  'FA', // non-resident public entertainer
  'PT', // LLP
  'TA', // trust body
  'TC', // unit / property trust
  'TN', // business trust
  'TR', // REIT / property trust fund
  'TP', // deceased estate
  'J', // Hindu joint family
  'LE', // Labuan entity
  'IG', // individual (since 2023)
  'SG',
  'OG' // individual (legacy)
]

// entity_type -> the TIN prefix LHDN issues for it (only the constrained types).
const ENTITY_TYPE_PREFIX: Record<string, string> = {
  sdn_bhd: 'C',
  bhd: 'C',
  plc: 'C',
  company: 'C',
  partnership: 'D',
  llp: 'PT',
  sole_proprietor: 'IG'
}

const TIN_RE = /^([A-Z]{1,2})(\d{8,12})$/

/** Validate a Malaysian TIN. Returns an error string, or null when valid.
 * If `entityType` maps to a specific LHDN prefix (e.g. sdn_bhd -> C), the prefix must match. */
export function validateTin(v: string, entityType?: string): string | null {
  const s = v.trim().toUpperCase()
  if (!s) return 'Required'
  const m = TIN_RE.exec(s)
  if (!m || !TIN_PREFIXES.includes(m[1])) {
    return 'TIN format: an LHDN prefix + 8–12 digits, e.g. C2581234509 (C=Sdn Bhd, D=partnership, PT=LLP)'
  }
  const expected = entityType ? ENTITY_TYPE_PREFIX[entityType.trim().toLowerCase()] : undefined
  if (expected && entityType && m[1] !== expected) {
    return `A ${entityType.replace('_', ' ')} TIN must start with "${expected}" (e.g. ${expected}1234567890)`
  }
  return null
}
