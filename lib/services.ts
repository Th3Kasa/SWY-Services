// ============================================================
// lib/services.ts — Service configuration
// Edit leader names and emails here when you have real addresses.
// Each service has a unique id (used in the DB), display name,
// leader, frequency label, email, and a Tailwind color set.
// ============================================================

export type ServiceConfig = {
  id: string;
  name: string;
  leader: string;
  leaderEmail: string;
  frequency: string;
  colorClass: string;       // Tailwind bg class for the card accent
  textColorClass: string;   // Tailwind text class for badge
  badgeBgClass: string;     // Tailwind bg class for badge
  borderColorClass: string; // Tailwind border class
  iconEmoji: string;
};

export const SERVICES: ServiceConfig[] = [
  {
    id: 'monthly-outings',
    name: 'Monthly Outings',
    leader: 'Michael Malek',
    leaderEmail: 'michael.malek@placeholder.com', // TODO: replace with real email
    frequency: 'Monthly',
    colorClass: 'bg-amber-500',
    textColorClass: 'text-amber-700',
    badgeBgClass: 'bg-amber-100',
    borderColorClass: 'border-amber-200',
    iconEmoji: '🌍',
  },
  {
    id: 'friday-night-outings',
    name: 'Friday Night Outings',
    leader: 'Andre Shenouda',
    leaderEmail: 'andre.shenouda@placeholder.com', // TODO: replace with real email
    frequency: 'Monthly',
    colorClass: 'bg-violet-500',
    textColorClass: 'text-violet-700',
    badgeBgClass: 'bg-violet-100',
    borderColorClass: 'border-violet-200',
    iconEmoji: '🌙',
  },
  {
    id: 'fundraising-events',
    name: 'Fundraising Events',
    leader: 'Angelina Farag',
    leaderEmail: 'angelina.farag@placeholder.com', // TODO: replace with real email
    frequency: 'Monthly',
    colorClass: 'bg-rose-500',
    textColorClass: 'text-rose-700',
    badgeBgClass: 'bg-rose-100',
    borderColorClass: 'border-rose-200',
    iconEmoji: '💝',
  },
  {
    id: 'friday-cooking-birthdays',
    name: 'Friday Night Cooking & Birthdays',
    leader: 'Joey Saad',
    leaderEmail: 'joey.saad@placeholder.com', // TODO: replace with real email
    frequency: 'Monthly',
    colorClass: 'bg-orange-500',
    textColorClass: 'text-orange-700',
    badgeBgClass: 'bg-orange-100',
    borderColorClass: 'border-orange-200',
    iconEmoji: '🎂',
  },
  {
    id: 'orban-making',
    name: 'Orban Making',
    leader: 'David & Anne Hanna',
    leaderEmail: 'david.hanna@placeholder.com', // TODO: replace with real email
    frequency: 'Every 3 months',
    colorClass: 'bg-yellow-500',
    textColorClass: 'text-yellow-700',
    badgeBgClass: 'bg-yellow-100',
    borderColorClass: 'border-yellow-200',
    iconEmoji: '🍞',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    leader: 'Daniel & Manuela',
    leaderEmail: 'daniel@placeholder.com', // TODO: replace with real email
    frequency: 'Every 2 months',
    colorClass: 'bg-teal-500',
    textColorClass: 'text-teal-700',
    badgeBgClass: 'bg-teal-100',
    borderColorClass: 'border-teal-200',
    iconEmoji: '✨',
  },
  {
    id: 'uncle-gamal-juice',
    name: "Uncle Gamal's Juice",
    leader: 'Uncle Gamal',
    leaderEmail: 'uncle.gamal@placeholder.com', // TODO: replace with real email
    frequency: 'Weekly (Sundays)',
    colorClass: 'bg-green-500',
    textColorClass: 'text-green-700',
    badgeBgClass: 'bg-green-100',
    borderColorClass: 'border-green-200',
    iconEmoji: '🍹',
  },
];

export function getServiceById(id: string): ServiceConfig | undefined {
  return SERVICES.find((s) => s.id === id);
}
