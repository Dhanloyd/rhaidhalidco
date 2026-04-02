import { founders } from "@/data/founders";

const FoundersPage = () => (
  <div>
    <section className="gradient-navy section-padding pt-24 md:pt-32">
      <div className="container mx-auto text-center">
        <h1 className="font-heading text-4xl md:text-6xl uppercase tracking-wider text-primary-foreground mb-4">Our Founders</h1>
        <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">The visionaries behind RaidKhalid & Co.</p>
      </div>
    </section>

    <section className="section-padding">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {founders.map((founder) => (
            <div key={founder.id} className="group text-center">
              <div className="relative w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden border-4 border-primary/20 group-hover:border-primary/60 transition-all duration-300">
                <img
                  src={founder.image}
                  alt={founder.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  width={400}
                  height={400}
                />
              </div>
              <h3 className="font-heading text-xl uppercase text-foreground mb-1">{founder.name}</h3>
              <p className="text-sm text-primary font-medium mb-3 uppercase tracking-wider">{founder.role}</p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{founder.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default FoundersPage;
