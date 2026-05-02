export type ServiceConfig = {
  id: string;
  name: string;
  leader: string;
  leaderEmail: string | null; // null = no leader reminder (Uncle Gamal's Juice)
  frequency: string;
  colorClass: string;
  textColorClass: string;
  badgeBgClass: string;
  borderColorClass: string;
  cardBgColor: string; // hex — used as inline style to avoid Tailwind purging
  iconEmoji: string;
};

export const SERVICES: ServiceConfig[] = [
  {
    id: 'monthly-outings',
    name: 'Monthly Outings',
    leader: 'Michael Malek',
    leaderEmail: 'malekmichael721@gmail.com',
    frequency: 'Monthly',
    colorClass: 'bg-amber-500',
    textColorClass: 'text-amber-700',
    badgeBgClass: 'bg-amber-100',
    borderColorClass: 'border-amber-200',
    cardBgColor: '#fffbeb',
    iconEmoji: '🌍',
  },
  {
    id: 'friday-night-outings',
    name: 'Friday Night Outings',
    leader: 'Andre Shenouda',
    leaderEmail: 'jarboss456@gmail.com',
    frequency: 'Monthly',
    colorClass: 'bg-violet-500',
    textColorClass: 'text-violet-700',
    badgeBgClass: 'bg-violet-100',
    borderColorClass: 'border-violet-200',
    cardBgColor: '#f5f3ff',
    iconEmoji: '🌙',
  },
  {
    id: 'fundraising-events',
    name: 'Fundraising Events',
    leader: 'Angelina Farag',
    leaderEmail: 'angelina.farag@me.com',
    frequency: 'Monthly',
    colorClass: 'bg-rose-500',
    textColorClass: 'text-rose-700',
    badgeBgClass: 'bg-rose-100',
    borderColorClass: 'border-rose-200',
    cardBgColor: '#fff1f2',
    iconEmoji: '💝',
  },
  {
    id: 'friday-cooking-birthdays',
    name: 'Friday Night Cooking & Birthdays',
    leader: 'Joey Saad',
    leaderEmail: 'josephsaad2165@gmail.com',
    frequency: 'Monthly',
    colorClass: 'bg-orange-500',
    textColorClass: 'text-orange-700',
    badgeBgClass: 'bg-orange-100',
    borderColorClass: 'border-orange-200',
    cardBgColor: '#fff7ed',
    iconEmoji: '🎂',
  },
  {
    id: 'orban-making',
    name: 'Orban Making',
    leader: 'David & Anne Hanna',
    leaderEmail: 'goliath@bigbond.net.au',
    frequency: 'Every 3 months',
    colorClass: 'bg-yellow-500',
    textColorClass: 'text-yellow-700',
    badgeBgClass: 'bg-yellow-100',
    borderColorClass: 'border-yellow-200',
    cardBgColor: '#fefce8',
    iconEmoji: '🍞',
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    leader: 'Daniel & Manuela',
    leaderEmail: 'manuela.gobran@gmail.com',
    frequency: 'Every 2 months',
    colorClass: 'bg-teal-500',
    textColorClass: 'text-teal-700',
    badgeBgClass: 'bg-teal-100',
    borderColorClass: 'border-teal-200',
    cardBgColor: '#f0fdfa',
    iconEmoji: '✨',
  },
  {
    id: 'uncle-gamal-juice',
    name: "Uncle Gamal's Juice",
    leader: 'Uncle Gamal',
    leaderEmail: null, // No leader reminder — submitter only
    frequency: 'Weekly (Sundays)',
    colorClass: 'bg-green-500',
    textColorClass: 'text-green-700',
    badgeBgClass: 'bg-green-100',
    borderColorClass: 'border-green-200',
    cardBgColor: '#f0fdf4',
    iconEmoji: '🍹',
  },
];

export function getServiceById(id: string): ServiceConfig | undefined {
  return SERVICES.find((s) => s.id === id);
}
