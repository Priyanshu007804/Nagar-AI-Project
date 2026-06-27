export const ISSUE_TYPES = [
  'Pothole',
  'Waterlogging',
  'Broken Streetlight',
  'Garbage Dump',
] as const

export const SEVERITY_LEVELS = ['Low', 'Medium', 'Critical'] as const

export const WARDS = [
  'Ward 1 - Central',
  'Ward 2 - North',
  'Ward 3 - South',
  'Ward 4 - East',
  'Ward 5 - West',
]

export const mockReports = [
  {
    id: 'mock-1',
    issueType: 'Pothole',
    location: 'Main Street, Ward 2',
    severity: 'Critical',
    status: 'In Progress',
    date: '2024-06-24',
  },
  {
    id: 'mock-2',
    issueType: 'Waterlogging',
    location: 'Park Avenue, Ward 3',
    severity: 'Medium',
    status: 'Resolved',
    date: '2024-06-20',
  },
  {
    id: 'mock-3',
    issueType: 'Broken Streetlight',
    location: 'Oak Road, Ward 1',
    severity: 'Low',
    status: 'Pending',
    date: '2024-06-22',
  },
  {
    id: 'mock-4',
    issueType: 'Garbage Dump',
    location: 'Market Square, Ward 4',
    severity: 'Medium',
    status: 'In Progress',
    date: '2024-06-18',
  },
  {
    id: 'mock-5',
    issueType: 'Pothole',
    location: 'Beach Road, Ward 5',
    severity: 'Critical',
    status: 'Pending',
    date: '2024-06-25',
  },
]

export const wardLeaderboard = [
  { name: 'Ward 1 - Central', resolved: 94, total: 156 },
  { name: 'Ward 2 - North', resolved: 87, total: 132 },
  { name: 'Ward 3 - South', resolved: 82, total: 148 },
  { name: 'Ward 4 - East', resolved: 76, total: 121 },
  { name: 'Ward 5 - West', resolved: 71, total: 118 },
]

export const heatmapZones = [
  [
    { zone: 'NW1', risk: 'high' },
    { zone: 'NC1', risk: 'medium' },
    { zone: 'NE1', risk: 'low' },
  ],
  [
    { zone: 'CW1', risk: 'medium' },
    { zone: 'CC1', risk: 'high' },
    { zone: 'CE1', risk: 'high' },
  ],
  [
    { zone: 'SW1', risk: 'low' },
    { zone: 'SC1', risk: 'medium' },
    { zone: 'SE1', risk: 'high' },
  ],
]

export const stats = {
  totalReports: 2847,
  resolved: 1923,
  pending: 654,
  critical: 270,
}
