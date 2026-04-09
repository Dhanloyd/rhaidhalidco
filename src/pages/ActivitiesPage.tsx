import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin } from "lucide-react";
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

  useEffect(() => {
    supabase
      .from("activities")
      .select("*")
      .eq("active", true) // 👈 only show active
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
                      className="w-full h-48 object-cover"
                    />
                  )}

                  <div className="p-5">
                    <h3 className="text-lg font-bold mb-2">{act.title}</h3>

                    <p className="text-sm text-muted-foreground mb-3">
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

                    <Button className="mt-4 w-full" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ActivitiesPage;