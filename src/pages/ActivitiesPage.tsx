import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DbActivity {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  image_url: string | null;
  active: boolean;
  display_order: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * Parse a date string without UTC-shift.
 * new Date("2024-06-01") is treated as UTC midnight and renders as May 31
 * for UTC+ timezones. Appending T00:00:00 forces local-time interpretation.
 */
function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes("T") || dateStr.includes(" ")) return new Date(dateStr);
  return new Date(dateStr + "T00:00:00");
}

function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
const ActivitiesPage = () => {
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DbActivity | null>(null);

  useEffect(() => {
    supabase
      .from("activities")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Fetch error:", error);
        setActivities((data as DbActivity[]) || []);
        setLoading(false);
      });
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  return (
    <div>
      <section className="section-padding">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No activities found.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="bg-card rounded-xl border overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  {act.image_url ? (
                    <img
                      src={act.image_url}
                      alt={act.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center text-sm text-muted-foreground">
                      No image
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold mb-2">{act.title}</h3>

                    {act.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {act.description}
                      </p>
                    )}

                    <div className="text-sm text-muted-foreground space-y-1 mt-auto mb-4">
                      {act.event_date && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="shrink-0" />
                          <span>{formatDate(act.event_date)}</span>
                        </div>
                      )}
                      {act.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="shrink-0" />
                          <span>{act.location}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => setSelected(act)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Detail Modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card rounded-xl border w-full max-w-lg overflow-hidden shadow-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.image_url ? (
              <img
                src={selected.image_url}
                alt={selected.title}
                className="w-full h-56 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-56 bg-muted flex items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold">{selected.title}</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-4 shrink-0"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {selected.description && (
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-line">
                  {selected.description}
                </p>
              )}

              <div className="text-sm text-muted-foreground space-y-2">
                {selected.event_date && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="shrink-0" />
                    <span>{formatDate(selected.event_date)}</span>
                  </div>
                )}
                {selected.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="shrink-0" />
                    <span>{selected.location}</span>
                  </div>
                )}
              </div>

              <Button className="mt-6 w-full" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;
