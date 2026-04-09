import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DbActivity {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string | null;
  active: boolean;
}

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
        console.log("DATA:", data);
        console.log("ERROR:", error);
        setActivities(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <section className="section-padding">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-10">No activities found</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((act) => (
                <div key={act.id} className="bg-card rounded-xl border overflow-hidden">
                  {act.image_url && (
                    <img
                      src={act.image_url}
                      alt={act.title}
                      className="w-full h-48 object-contain bg-gray-100"
                    />
                  )}

                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2">{act.title}</h3>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {act.description}
                    </p>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {act.event_date}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} />
                        {act.location}
                      </div>
                    </div>

                    <Button
                      className="mt-4 w-full"
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

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card rounded-xl border w-full max-w-lg overflow-hidden shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.image_url && (
              <img
                src={selected.image_url}
                alt={selected.title}
                className="w-full h-56 object-contain bg-gray-100"
              />
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold">{selected.title}</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-4"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {selected.description}
              </p>

              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  {selected.event_date}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  {selected.location}
                </div>
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