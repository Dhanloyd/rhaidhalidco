import { Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const activities = [
  { type: "Game", title: "RaidKhalid vs. Thunder Hawks", date: "Apr 12, 2026", time: "7:00 PM", location: "RK Arena, Manila", desc: "Regular season matchup against our city rivals." },
  { type: "Tournament", title: "Metro Invitational Cup", date: "Apr 20-25, 2026", time: "All Day", location: "SM Mall of Asia Arena", desc: "Annual invitational tournament featuring top franchises." },
  { type: "Community", title: "Youth Basketball Camp", date: "May 3-5, 2026", time: "9:00 AM", location: "RK Training Facility", desc: "Free 3-day camp for aspiring young players aged 10-16." },
  { type: "Training", title: "Off-Season Conditioning Program", date: "Jun 1 - Jul 31, 2026", time: "6:00 AM", location: "RK Training Facility", desc: "Intensive strength and agility program for registered athletes." },
  { type: "Game", title: "RaidKhalid vs. Blue Stallions", date: "Apr 18, 2026", time: "6:30 PM", location: "RK Arena, Manila", desc: "A must-win game for playoff positioning." },
  { type: "Community", title: "Fan Meet & Greet", date: "May 10, 2026", time: "2:00 PM", location: "RK Headquarters", desc: "Meet your favorite players, get autographs and exclusive merch." },
];

const typeColors: Record<string, string> = {
  Game: "bg-primary text-primary-foreground",
  Tournament: "bg-[hsl(var(--badge-hot))] text-primary-foreground",
  Community: "bg-accent text-accent-foreground",
  Training: "bg-secondary text-secondary-foreground",
};

const ActivitiesPage = () => (
  <div>
    <section className="gradient-navy section-padding pt-24 md:pt-32">
      <div className="container mx-auto text-center">
        <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">Activities</h1>
        <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">Games, events, and programs happening with RaidKhalid & Co.</p>
      </div>
    </section>

    <section className="section-padding">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((act, i) => (
            <div key={i} className="bg-card rounded-xl border border-border/50 overflow-hidden hover-lift">
              <div className="p-6">
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 ${typeColors[act.type]}`}>
                  {act.type}
                </span>
                <h3 className="font-heading text-lg uppercase text-foreground mb-3">{act.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{act.desc}</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-primary" /> {act.date}</div>
                  <div className="flex items-center gap-2"><Clock size={14} className="text-primary" /> {act.time}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-primary" /> {act.location}</div>
                </div>
                <Button className="mt-5 w-full font-heading uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary-light" size="sm">
                  {act.type === "Game" ? "Get Tickets" : "Register"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default ActivitiesPage;
