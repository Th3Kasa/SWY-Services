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
  verse: { text: string; ref: string };
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
    cardBgColor: '#dbeafe',
    iconEmoji: '🌍',
    verse: { text: 'Not forsaking the assembling of ourselves together, as is the manner of some, but exhorting one another, and so much the more as you see the Day approaching.', ref: 'Hebrews 10:25' },
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
    cardBgColor: '#ede9fe',
    iconEmoji: '🌙',
    verse: { text: 'Two are better than one, because they have a good reward for their labor.', ref: 'Ecclesiastes 4:9' },
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
    cardBgColor: '#dcfce7',
    iconEmoji: '💝',
    verse: { text: 'So let each one give as he purposes in his heart, not grudgingly or of necessity; for God loves a cheerful giver.', ref: '2 Corinthians 9:7' },
  },
  {
    id: 'friday-cooking-birthdays',
    name: 'Friday Night Cooking & Birthdays',
    leader: 'Joey & Ibby',
    leaderEmail: 'josephsaad2165@gmail.com',
    frequency: 'Monthly',
    colorClass: 'bg-orange-500',
    textColorClass: 'text-orange-700',
    badgeBgClass: 'bg-orange-100',
    borderColorClass: 'border-orange-200',
    cardBgColor: '#fce7f3',
    iconEmoji: '🎂',
    verse: { text: 'Therefore, whether you eat or drink, or whatever you do, do all to the glory of God.', ref: '1 Corinthians 10:31' },
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
    cardBgColor: '#fef9c3',
    iconEmoji: '🍞',
    verse: { text: 'And Jesus said to them, "I am the bread of life. He who comes to Me shall never hunger, and he who believes in Me shall never thirst."', ref: 'John 6:35' },
  },
  {
    id: 'cleaning',
    name: 'Church Cleaning',
    leader: 'Daniel & Manuela',
    leaderEmail: 'manuela.gobran@gmail.com',
    frequency: 'Every 2 months',
    colorClass: 'bg-teal-500',
    textColorClass: 'text-teal-700',
    badgeBgClass: 'bg-teal-100',
    borderColorClass: 'border-teal-200',
    cardBgColor: '#cffafe',
    iconEmoji: '✨',
    verse: { text: 'How lovely is Your tabernacle, O Lord of hosts! I would rather be a doorkeeper in the house of my God than dwell in the tents of wickedness.', ref: 'Psalm 84:1,10' },
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
    cardBgColor: '#ffedd5',
    iconEmoji: '🍹',
    verse: { text: 'Oh, taste and see that the Lord is good; blessed is the man who trusts in Him!', ref: 'Psalm 34:8' },
  },
];

export function getServiceById(id: string): ServiceConfig | undefined {
  return SERVICES.find((s) => s.id === id);
}
