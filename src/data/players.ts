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

export const players: Player[] = [
  { id: "1", name: "Marcus Rivera", position: "Point Guard", number: 7, stats: { ppg: 22.5, rpg: 4.2, apg: 8.1 }, bio: "A dynamic playmaker with exceptional court vision and leadership.", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=500&fit=crop", achievements: ["MVP 2025", "All-Star 3x"] },
  { id: "2", name: "Jaylen Cruz", position: "Shooting Guard", number: 23, stats: { ppg: 19.8, rpg: 3.5, apg: 4.2 }, bio: "Sharpshooter with ice in his veins during clutch moments.", image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=500&fit=crop", achievements: ["3PT Champion 2024", "Rookie of the Year"] },
  { id: "3", name: "Andre Santos", position: "Small Forward", number: 11, stats: { ppg: 17.3, rpg: 6.8, apg: 3.1 }, bio: "Versatile two-way player who dominates on both ends of the court.", image: "https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?w=400&h=500&fit=crop", achievements: ["Defensive Player of the Year", "All-Star 2x"] },
  { id: "4", name: "Khalid Reyes", position: "Power Forward", number: 34, stats: { ppg: 15.6, rpg: 9.4, apg: 2.8 }, bio: "A powerful presence in the paint with an unmatched work ethic.", image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=400&h=500&fit=crop", achievements: ["Rebounding Leader 2025", "Finals MVP"] },
  { id: "5", name: "Darius Lim", position: "Center", number: 5, stats: { ppg: 13.2, rpg: 11.1, apg: 1.9 }, bio: "Towering defender and rim protector who anchors the defense.", image: "https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=400&h=500&fit=crop", achievements: ["Blocks Leader 2024", "All-Defensive Team"] },
  { id: "6", name: "Rafael Tan", position: "Sixth Man", number: 14, stats: { ppg: 14.1, rpg: 3.9, apg: 5.3 }, bio: "Spark plug off the bench who changes the game's momentum.", image: "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=400&h=500&fit=crop", achievements: ["Sixth Man of the Year 2025"] },
];
