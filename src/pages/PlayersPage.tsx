import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const StatBox = ({ label, value, pct = false }: { label: string; value: any; pct?: boolean }) => (
  <div className="text-center">
    <p className="font-heading text-xl text-foreground">
      {value != null && value !== "" ? `${value}${pct ? "%" : ""}` : "—"}
    </p>
    <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
  </div>
);

const PlayersPage = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("player_profiles")
      .select("*")
      .eq("active", true)
      .order("display_order")
      .then(({ data }) => {
        setPlayers(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <section className="gradient-navy section-padding pt-24 md:pt-32">
        <div className="container mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">
            Franchise Players
          </h1>
          <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
            Meet the athletes who represent RaidKhalid &amp; Co.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="font-heading text-xl uppercase tracking-wider">No players found</p>
              <p className="text-sm mt-2">Make sure players have <code>active = true</code> in the database.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {players.map((player) => {
                const s = player.stats || {};
                return (
                  <button
                    key={player.id}
                    onClick={() => setSelected(player)}
                    className="group text-left rounded-xl overflow-hidden hover-lift bg-card border border-border/50"
                  >
                    {/* Card image */}
                    <div className="relative h-72 overflow-hidden">
                      {player.image_url ? (
                        <img
                          src={player.image_url}
                          alt={player.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          width={400}
                          height={500}
                        />
                      ) : (
                        <div className="w-full h-full bg-primary/10 flex flex-col items-center justify-center gap-2">
                          <span className="font-heading text-7xl text-primary/30">#{player.jersey_number ?? "—"}</span>
                          <span className="font-heading text-sm uppercase text-primary/40 tracking-widest">{player.position}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(218_65%_10%/0.85)] via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <p className="text-primary-light text-sm font-medium">
                          {player.jersey_number && `#${player.jersey_number}`}
                          {player.jersey_number && player.position && " · "}
                          {player.position}
                        </p>
                        <h3 className="font-heading text-xl uppercase text-primary-foreground">{player.name}</h3>
                      </div>
                    </div>

                    {/* Card stats — PPG / RPG / APG */}
                    <div className="p-5 flex justify-between text-center">
                      <StatBox label="PPG" value={s.ppg} />
                      <StatBox label="RPG" value={s.rpg} />
                      <StatBox label="APG" value={s.apg} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {selected && (() => {
        const s = selected.stats || {};
        return (
          <div
            className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header image */}
              <div className="relative h-64">
                {selected.image_url ? (
                  <img
                    src={selected.image_url}
                    alt={selected.name}
                    className="w-full h-full object-cover rounded-t-2xl"
                    width={400}
                    height={500}
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center rounded-t-2xl">
                    <span className="font-heading text-8xl text-primary/30">#{selected.jersey_number ?? "—"}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(218_65%_10%/0.9)] to-transparent rounded-t-2xl" />
                <button
                  onClick={() => setSelected(null)}
                  className="absolute top-4 right-4 bg-foreground/30 backdrop-blur-sm rounded-full p-2 text-primary-foreground hover:bg-foreground/50 transition-colors"
                >
                  <X size={18} />
                </button>
                <div className="absolute bottom-4 left-6">
                  <p className="text-primary-light text-sm font-medium">
                    {selected.jersey_number && `#${selected.jersey_number}`}
                    {selected.jersey_number && selected.position && " · "}
                    {selected.position}
                  </p>
                  <h3 className="font-heading text-3xl uppercase text-primary-foreground">{selected.name}</h3>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Per game averages */}
                <div>
                  <p className="text-xs font-heading uppercase tracking-widest text-muted-foreground mb-3 text-center">Per Game Averages</p>
                  <div className="grid grid-cols-5 gap-2 py-4 bg-muted rounded-xl">
                    <StatBox label="PPG" value={s.ppg} />
                    <StatBox label="RPG" value={s.rpg} />
                    <StatBox label="APG" value={s.apg} />
                    <StatBox label="SPG" value={s.spg} />
                    <StatBox label="BPG" value={s.bpg} />
                  </div>
                </div>

                {/* Shooting percentages */}
                <div>
                  <p className="text-xs font-heading uppercase tracking-widest text-muted-foreground mb-3 text-center">Shooting</p>
                  <div className="grid grid-cols-3 gap-2 py-4 bg-muted rounded-xl">
                    <StatBox label="FG%" value={s.fgp} pct />
                    <StatBox label="3P%" value={s.tpp} pct />
                    <StatBox label="FT%" value={s.ftp} pct />
                  </div>
                </div>

                {/* Bio */}
                {selected.bio && (
                  <p className="text-muted-foreground leading-relaxed">{selected.bio}</p>
                )}

                {/* Achievements */}
                {selected.achievements && (selected.achievements as string[]).length > 0 && (
                  <div>
                    <h4 className="font-heading text-sm uppercase tracking-wider text-foreground mb-2">Achievements</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selected.achievements as string[]).map((a: string) => (
                        <span key={a} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PlayersPage;
