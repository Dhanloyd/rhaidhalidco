import { useState } from "react";
import { players, Player } from "@/data/players";
import { X } from "lucide-react";

const PlayersPage = () => {
  const [selected, setSelected] = useState<Player | null>(null);

  return (
    <div>
      <section className="gradient-navy section-padding pt-24 md:pt-32">
        <div className="container mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">Franchise Players</h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">Meet the athletes who represent RaidKhalid & Co.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelected(player)}
                className="group text-left rounded-xl overflow-hidden hover-lift bg-card border border-border/50"
              >
                <div className="relative h-72 overflow-hidden">
                  <img src={player.image} alt={player.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={400} height={500} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(218_65%_10%/0.85)] via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-primary-light text-sm font-medium">#{player.number}</p>
                    <h3 className="font-heading text-xl uppercase text-primary-foreground">{player.name}</h3>
                    <p className="text-primary-foreground/60 text-sm">{player.position}</p>
                  </div>
                </div>
                <div className="p-5 flex justify-between text-center">
                  <div><p className="font-heading text-lg text-foreground">{player.stats.ppg}</p><p className="text-xs text-muted-foreground uppercase">PPG</p></div>
                  <div><p className="font-heading text-lg text-foreground">{player.stats.rpg}</p><p className="text-xs text-muted-foreground uppercase">RPG</p></div>
                  <div><p className="font-heading text-lg text-foreground">{player.stats.apg}</p><p className="text-xs text-muted-foreground uppercase">APG</p></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64">
              <img src={selected.image} alt={selected.name} className="w-full h-full object-cover rounded-t-2xl" width={400} height={500} />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(218_65%_10%/0.9)] to-transparent rounded-t-2xl" />
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 bg-foreground/30 backdrop-blur-sm rounded-full p-2 text-primary-foreground hover:bg-foreground/50 transition-colors">
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-6">
                <p className="text-primary-light text-sm font-medium">#{selected.number} · {selected.position}</p>
                <h3 className="font-heading text-3xl uppercase text-primary-foreground">{selected.name}</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-around mb-6 py-4 bg-muted rounded-xl">
                <div className="text-center"><p className="font-heading text-2xl text-foreground">{selected.stats.ppg}</p><p className="text-xs text-muted-foreground uppercase">PPG</p></div>
                <div className="text-center"><p className="font-heading text-2xl text-foreground">{selected.stats.rpg}</p><p className="text-xs text-muted-foreground uppercase">RPG</p></div>
                <div className="text-center"><p className="font-heading text-2xl text-foreground">{selected.stats.apg}</p><p className="text-xs text-muted-foreground uppercase">APG</p></div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">{selected.bio}</p>
              <h4 className="font-heading text-sm uppercase tracking-wider text-foreground mb-2">Achievements</h4>
              <div className="flex flex-wrap gap-2">
                {selected.achievements.map((a) => (
                  <span key={a} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{a}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersPage;
