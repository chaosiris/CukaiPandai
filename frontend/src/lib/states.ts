// Malaysian states + federal territories. The `code` is the ISO subdivision code accepted by the
// backend's `holidays` package (drives state-specific public-holiday shifting in the obligation
// calendar). Keep in sync with _MY_STATES in backend/core/models.py.

export interface MyState {
  code: string
  label: string
}

export const MY_STATES: MyState[] = [
  { code: 'JHR', label: 'Johor' },
  { code: 'KDH', label: 'Kedah' },
  { code: 'KTN', label: 'Kelantan' },
  { code: 'MLK', label: 'Melaka' },
  { code: 'NSN', label: 'Negeri Sembilan' },
  { code: 'PHG', label: 'Pahang' },
  { code: 'PNG', label: 'Pulau Pinang (Penang)' },
  { code: 'PRK', label: 'Perak' },
  { code: 'PLS', label: 'Perlis' },
  { code: 'SGR', label: 'Selangor' },
  { code: 'TRG', label: 'Terengganu' },
  { code: 'SBH', label: 'Sabah' },
  { code: 'SWK', label: 'Sarawak' },
  { code: 'KUL', label: 'W.P. Kuala Lumpur' },
  { code: 'LBN', label: 'W.P. Labuan' },
  { code: 'PJY', label: 'W.P. Putrajaya' }
]
