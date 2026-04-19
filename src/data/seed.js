/**
 * Seed data for the FRWA demo.
 * Generates ~100 records per entity to match the spec's scale requirement.
 *
 * Everything is deterministic (seeded pseudo-random) so the UI behaves
 * predictably across reloads and during demos.
 */
import { ROLES } from '../entity/User.js';
import { FSA_STATUS } from '../entity/FSA.js';
import { NOTIFICATION_TYPE } from '../entity/Notification.js';

/* ---------- Deterministic RNG so reloads are consistent ---------- */
function mulberry32(seed) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260418);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const range = (n) => Array.from({ length: n }, (_, i) => i);
const daysAgoISO = (d) => new Date(Date.now() - d * 86400000).toISOString();
const daysFromNowISO = (d) => new Date(Date.now() + d * 86400000).toISOString();

/* ---------- Categories (10) ---------- */
const CATEGORY_SEEDS = [
  { name: 'Medical', icon: 'LocalHospital', description: 'Healthcare, surgery, treatment costs' },
  { name: 'Education', icon: 'School', description: 'Tuition, learning materials, scholarships' },
  { name: 'Emergency', icon: 'Emergency', description: 'Disaster relief & urgent situations' },
  { name: 'Community', icon: 'Groups', description: 'Community-led initiatives and projects' },
  { name: 'Animals', icon: 'Pets', description: 'Animal welfare and rescue operations' },
  { name: 'Environment', icon: 'Forest', description: 'Environmental protection and sustainability' },
  { name: 'Sports', icon: 'SportsSoccer', description: 'Sporting events, athletes, equipment' },
  { name: 'Creative', icon: 'Palette', description: 'Arts, music, and creative projects' },
  { name: 'Memorial', icon: 'Favorite', description: 'Memorial & tribute fundraisers' },
  { name: 'Technology', icon: 'Computer', description: 'Open-source and tech-for-good projects' },
];

export const categories = CATEGORY_SEEDS.map((c, i) => ({
  id: `cat-${i + 1}`,
  ...c,
  active: true,
  createdAt: daysAgoISO(120 - i * 5),
}));

/* ---------- Users (102) ---------- */
const FIRST = [
  'Aung', 'Bryan', 'Chloe', 'Daniel', 'Elena', 'Farah', 'Gabriel', 'Hana',
  'Ivan', 'Jasmine', 'Kai', 'Lara', 'Marcus', 'Nadia', 'Omar', 'Priya',
  'Quentin', 'Rohan', 'Siti', 'Tara', 'Umar', 'Vera', 'Wei', 'Xin',
  'Yara', 'Zainab', 'Adrian', 'Bella', 'Cyrus', 'Dina',
];
const LAST = [
  'Tan', 'Lim', 'Wong', 'Kumar', 'Singh', 'Patel', 'Nguyen', 'Tran',
  'Chen', 'Lee', 'Park', 'Kim', 'Garcia', 'Silva', 'Khan', 'Ali',
  'Brown', 'Davies', 'Evans', 'Harris',
];

export const users = [
  {
    id: 'u-admin-1',
    username: 'admin',
    email: 'admin@frwa.io',
    password: 'admin123',
    role: ROLES.ADMIN,
    fullName: 'System Admin',
    phone: '+65 9000 0001',
    avatarUrl: '',
    status: 'ACTIVE',
    createdAt: daysAgoISO(365),
  },
  {
    id: 'u-pm-1',
    username: 'pm',
    email: 'pm@frwa.io',
    password: 'pm123',
    role: ROLES.PLATFORM_MANAGER,
    fullName: 'Platform Manager',
    phone: '+65 9000 0002',
    avatarUrl: '',
    status: 'ACTIVE',
    createdAt: daysAgoISO(320),
  },
];

// 50 fundraisers + 50 donees
range(50).forEach((i) => {
  const first = FIRST[(i * 3) % FIRST.length];
  const last = LAST[(i * 7) % LAST.length];
  users.push({
    id: `u-fr-${i + 1}`,
    username: `fr_${first.toLowerCase()}${i + 1}`,
    email: `fr${i + 1}@frwa.io`,
    password: 'password',
    role: ROLES.FUNDRAISER,
    fullName: `${first} ${last}`,
    phone: `+65 8${(1000000 + i).toString().slice(0, 7)}`,
    avatarUrl: '',
    status: 'ACTIVE',
    createdAt: daysAgoISO(300 - i * 3),
  });
});
range(50).forEach((i) => {
  const first = FIRST[(i * 11) % FIRST.length];
  const last = LAST[(i * 5) % LAST.length];
  users.push({
    id: `u-dn-${i + 1}`,
    username: `dn_${first.toLowerCase()}${i + 1}`,
    email: `dn${i + 1}@frwa.io`,
    password: 'password',
    role: ROLES.DONEE,
    fullName: `${first} ${last}`,
    phone: `+65 9${(2000000 + i).toString().slice(0, 7)}`,
    avatarUrl: '',
    status: i % 25 === 0 ? 'SUSPENDED' : 'ACTIVE',
    createdAt: daysAgoISO(280 - i * 3),
  });
});

/* ---------- FSAs (100) ---------- */
const FSA_TITLES = [
  'Help {name} beat cancer',
  'Support {name}\'s university tuition',
  'Rebuild {name}\'s home after the flood',
  'Save the local animal shelter',
  'Clean up the coastline project',
  'Sponsor {name}\'s marathon run',
  'Fund {name}\'s art exhibition',
  'Memorial fund for {name}',
  'Open-source accessibility tool',
  'Emergency surgery for {name}',
  'New computers for {name}\'s school',
  'Community kitchen relaunch',
  'Reforestation initiative',
  'Junior football kit drive',
  'Orchestra scholarship program',
];
const LOCATIONS = [
  'Singapore', 'Kuala Lumpur', 'Jakarta', 'Bangkok', 'Manila',
  'Hanoi', 'Ho Chi Minh City', 'Penang', 'Bali', 'Cebu',
];
const IMAGES = [
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c',
  'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6',
  'https://images.unsplash.com/photo-1497486751825-1233686d5d80',
  'https://images.unsplash.com/photo-1593113598332-cd288d649433',
  'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644',
  'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1',
];

const fundraisers = users.filter((u) => u.role === ROLES.FUNDRAISER);

export const fsas = range(100).map((i) => {
  const fr = fundraisers[i % fundraisers.length];
  const category = categories[i % categories.length];
  const goal = 2000 + Math.floor(rand() * 48000);
  const raised = Math.floor(goal * (rand() * 1.1));
  // Status distribution — mostly ACTIVE with ~25% COMPLETED and a few DRAFT/CANCELLED
  let status;
  if (raised >= goal) status = FSA_STATUS.COMPLETED;
  else if (i % 17 === 0) status = FSA_STATUS.CANCELLED;
  else if (i % 19 === 0) status = FSA_STATUS.DRAFT;
  else status = FSA_STATUS.ACTIVE;

  const titleTpl = FSA_TITLES[i % FSA_TITLES.length];
  const nameForTitle = fr.fullName.split(' ')[0];
  return {
    id: `fsa-${i + 1}`,
    title: titleTpl.replace('{name}', nameForTitle),
    description:
      `This fundraiser supports ${nameForTitle} in the ${category.name.toLowerCase()} category. ` +
      'Every contribution — big or small — gets us closer to the goal. ' +
      'Funds raised here go directly toward the beneficiary with full transparency on how they are used.',
    categoryId: category.id,
    fundraiserId: fr.id,
    goalAmount: goal,
    raisedAmount: Math.min(raised, status === FSA_STATUS.COMPLETED ? goal : raised),
    imageUrl: `${IMAGES[i % IMAGES.length]}?auto=format&fit=crop&w=800&q=60`,
    startDate: daysAgoISO(90 - (i % 60)),
    endDate: status === FSA_STATUS.COMPLETED ? daysAgoISO(i % 30) : daysFromNowISO(30 + (i % 60)),
    status,
    views: Math.floor(rand() * 5000),
    shortlisted: Math.floor(rand() * 300),
    createdAt: daysAgoISO(90 - (i % 60)),
    location: LOCATIONS[i % LOCATIONS.length],
  };
});

/* ---------- Donations (200) ---------- */
const donees = users.filter((u) => u.role === ROLES.DONEE);
export const donations = range(200).map((i) => {
  const fsa = fsas[i % fsas.length];
  const donee = donees[(i * 3) % donees.length];
  return {
    id: `don-${i + 1}`,
    fsaId: fsa.id,
    doneeId: donee.id,
    amount: 10 + Math.floor(rand() * 490),
    message: i % 3 === 0 ? 'Wishing you all the best!' : '',
    anonymous: i % 11 === 0,
    createdAt: daysAgoISO(i % 120),
  };
});

/* ---------- Favorites (120) ---------- */
export const favorites = range(120).map((i) => {
  const donee = donees[i % donees.length];
  const fsa = fsas[(i * 7) % fsas.length];
  return {
    id: `fav-${i + 1}`,
    doneeId: donee.id,
    fsaId: fsa.id,
    createdAt: daysAgoISO(i % 60),
  };
});

/* ---------- Notifications (sample per role) ---------- */
export const notifications = [
  {
    id: 'n-1',
    userId: 'u-fr-1',
    title: 'New donation received',
    message: 'You received a $100 donation on "Help Aung beat cancer".',
    type: NOTIFICATION_TYPE.SUCCESS,
    read: false,
    createdAt: daysAgoISO(0),
    link: '/fundraiser/manage',
  },
  {
    id: 'n-2',
    userId: 'u-fr-1',
    title: 'FSA shortlisted',
    message: 'Your FSA was added to 3 favourites today.',
    type: NOTIFICATION_TYPE.INFO,
    read: false,
    createdAt: daysAgoISO(1),
  },
  {
    id: 'n-3',
    userId: 'u-dn-1',
    title: 'Campaign update',
    message: 'An FSA you donated to just hit 80% of its goal!',
    type: NOTIFICATION_TYPE.INFO,
    read: false,
    createdAt: daysAgoISO(0),
  },
  {
    id: 'n-4',
    userId: 'u-pm-1',
    title: 'Weekly report ready',
    message: 'This week\'s platform report is available to view.',
    type: NOTIFICATION_TYPE.INFO,
    read: false,
    createdAt: daysAgoISO(0),
    link: '/platform/reports',
  },
  {
    id: 'n-5',
    userId: 'u-admin-1',
    title: 'New user registrations',
    message: '12 new users signed up this week.',
    type: NOTIFICATION_TYPE.INFO,
    read: true,
    createdAt: daysAgoISO(2),
  },
];
