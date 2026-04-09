export interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  stats: { ppg: number; rpg: number; apg: number };
  bio: string;
  image: string;
  achievements: string[];
}


