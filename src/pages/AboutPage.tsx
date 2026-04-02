import { Target, Eye, Heart, Trophy } from "lucide-react";

const values = [
  { icon: Target, title: "Mission", desc: "To build a world-class basketball organization that inspires greatness on and off the court." },
  { icon: Eye, title: "Vision", desc: "To become the most respected basketball franchise in the region, known for excellence and integrity." },
  { icon: Heart, title: "Community", desc: "We believe in giving back — developing youth talent and strengthening our community through sport." },
  { icon: Trophy, title: "Excellence", desc: "Every game, every practice, every interaction — we pursue excellence in everything we do." },
];

const AboutPage = () => (
  <div>
    {/* Hero */}
    <section className="gradient-navy section-padding pt-24 md:pt-32">
      <div className="container mx-auto text-center">
        <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">About Us</h1>
        <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
          The story behind RaidKhalid & Co. — a franchise built on passion, discipline, and the love of basketball.
        </p>
      </div>
    </section>

    {/* History */}
    <section className="section-padding">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-heading text-3xl uppercase tracking-wider text-foreground mb-6 text-center">Our Story</h2>
        <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed space-y-4">
          <p>
            Founded in 2020, RaidKhalid & Co. began as a dream shared by a group of basketball enthusiasts who wanted to create more than just a team — they wanted to build a movement. What started as pickup games in local courts quickly grew into an organized franchise with a dedicated fanbase.
          </p>
          <p>
            Today, RaidKhalid & Co. stands as a symbol of perseverance, teamwork, and community. With a roster of elite players, a thriving merchandise line, and community programs reaching hundreds of young athletes, we continue to push boundaries and redefine what a basketball organization can be.
          </p>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="section-padding bg-muted">
      <div className="container mx-auto">
        <h2 className="font-heading text-3xl uppercase tracking-wider text-foreground mb-10 text-center">Our Values</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card rounded-xl p-6 text-center hover-lift border border-border/50">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon size={24} className="text-primary" />
              </div>
              <h3 className="font-heading text-lg uppercase mb-2 text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default AboutPage;
