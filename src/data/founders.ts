export interface Founder {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
}

export const founders: Founder[] = [
  { id: "1", name: "Raid Khalid", role: "Founder & CEO", bio: "Visionary leader who built RaidKhalid & Co. from the ground up with a passion for basketball and community.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" },
  { id: "2", name: "Sofia Reyes", role: "Co-Founder & COO", bio: "Operations mastermind ensuring every game, event, and product launch runs like clockwork.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" },
  { id: "3", name: "James Torres", role: "Co-Founder & Head Coach", bio: "Former pro player turned coach, shaping the next generation of basketball excellence.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop" },
];
