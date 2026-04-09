import { Link } from "react-router-dom";
import { ShoppingCart, Ticket, ChevronRight, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { motion } from "framer-motion";

const fadeUp = {
  hidden:{opacity:0,y:40},
  show:{
    opacity:1,
    y:0,
    transition:{duration:.6}
  }
};

const stagger = {
  hidden:{},
  show:{
    transition:{
      staggerChildren:.12
    }
  }
};

const HomePage = () => {

const [news,setNews]=useState<any[]>([]);
const [highlights,setHighlights]=useState<any[]>([]);
const [featuredProducts,setFeaturedProducts]=useState<any[]>([]);
const [founders,setFounders]=useState<any[]>([]);
const [players,setPlayers]=useState<any[]>([]);
const [activities,setActivities]=useState<any[]>([]);
const [socialLinks,setSocialLinks]=useState<any[]>([]);
const [loading,setLoading]=useState(true);

useEffect(()=>{

Promise.all([

supabase.from("news")
.select("*")
.eq("published",true)
.order("created_at",{ascending:false})
.limit(3),

supabase.from("highlights")
.select("*")
.eq("active",true)
.order("display_order")
.limit(6),

supabase.from("products")
.select("*")
.eq("in_stock",true)
.order("sold_count",{ascending:false})
.limit(4),

supabase.from("founder_profiles")
.select("*")
.eq("active",true)
.order("display_order")
.limit(3),

supabase.from("player_profiles")
.select("*")
.eq("active",true)
.order("display_order")
.limit(3),

supabase.from("activities")
.select("*")
.eq("active",true)
.order("display_order")
.limit(3),

supabase.from("social_links")
.select("*")
.eq("active",true)
.order("display_order"),

]).then(([n,h,p,f,pl,a,s])=>{

setNews(n.data||[]);
setHighlights(h.data||[]);
setFeaturedProducts(p.data||[]);
setFounders(f.data||[]);
setPlayers(pl.data||[]);
setActivities(a.data||[]);
setSocialLinks(s.data||[]);

setLoading(false);

});

},[]);

return(

<div>

{/* HERO */}

<section className="relative h-[90vh] flex items-center justify-center overflow-hidden">

<motion.img
initial={{scale:1.2}}
animate={{scale:1}}
transition={{duration:2}}
src={heroBanner}
className="absolute inset-0 w-full h-full object-cover"
/>

<div className="absolute inset-0 bg-black/60"/>

<motion.div
initial="hidden"
animate="show"
variants={stagger}
className="relative container mx-auto px-4 z-10"
>

<motion.h1
variants={fadeUp}
className="font-heading text-7xl uppercase text-white mb-6"
>

RaidKhalid

<span className="text-primary block">

& Co.

</span>

</motion.h1>

<motion.p
variants={fadeUp}
className="text-xl text-white/80 mb-10 max-w-xl"
>

Elevating basketball culture through passion, excellence, and community.

</motion.p>

<motion.div
variants={fadeUp}
className="flex gap-4"
>

<Link to="/shop">

<Button
size="lg"
className="gap-2 hover:scale-105 transition"
>

<ShoppingCart size={18}/>

Shop

</Button>

</Link>

<Link to="/activities">

<Button
variant="outline"
size="lg"
className="hover:scale-105 transition"
>

<Ticket size={18}/>

Tickets

</Button>

</Link>

</motion.div>

</motion.div>

</section>

{/* NEWS */}

{news.length>0 &&(

<section className="section-padding bg-muted">

<motion.div
initial="hidden"
whileInView="show"
viewport={{once:true}}
variants={stagger}
className="container mx-auto"
>

<motion.h2
variants={fadeUp}
className="font-heading text-4xl text-center mb-12"
>

Latest News

</motion.h2>

<motion.div
variants={stagger}
className="grid md:grid-cols-3 gap-6"
>

{news.map(item=>(

<motion.div
key={item.id}
variants={fadeUp}
whileHover={{
y:-10,
scale:1.02
}}
className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition"
>

{item.image_url &&(

<motion.img
whileHover={{scale:1.08}}
transition={{duration:.5}}
src={item.image_url}
className="w-full h-44 object-cover"
/>

)}

<div className="p-6">

<h3 className="font-heading text-lg mb-2">

{item.title}

</h3>

<p className="text-muted-foreground text-sm">

{item.excerpt}

</p>

</div>

</motion.div>

))}

</motion.div>

</motion.div>

</section>

)}

{/* HIGHLIGHTS */}

{highlights.length>0 &&(

<section className="section-padding">

<motion.div
initial="hidden"
whileInView="show"
viewport={{once:true}}
variants={stagger}
className="container mx-auto"
>

<motion.h2
variants={fadeUp}
className="font-heading text-4xl text-center mb-12"
>

Player Highlights

</motion.h2>

<div className="grid md:grid-cols-3 gap-6">

{highlights.map(h=>(

<motion.div
key={h.id}
variants={fadeUp}
whileHover={{
scale:1.03
}}
className="bg-card rounded-xl overflow-hidden shadow-lg group"
>

<div className="relative">

<motion.img
whileHover={{scale:1.1}}
src={h.image_url}
className="w-full h-48 object-cover"
/>

<div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">

<Play size={50} className="text-white"/>

</div>

</div>

<div className="p-5">

<h3 className="font-heading">

{h.title}

</h3>

</div>

</motion.div>

))}

</div>

</motion.div>

</section>

)}

{/* PLAYERS */}

{players.length>0 &&(

<section className="section-padding bg-muted">

<motion.div
initial="hidden"
whileInView="show"
viewport={{once:true}}
variants={stagger}
className="container mx-auto"
>

<motion.h2
variants={fadeUp}
className="font-heading text-4xl text-center mb-12"
>

Top Players

</motion.h2>

<div className="grid md:grid-cols-3 gap-6">

{players.map(player=>(

<motion.div
key={player.id}
variants={fadeUp}
whileHover={{
y:-10
}}
className="bg-card rounded-xl overflow-hidden shadow-lg"
>

<motion.img
whileHover={{scale:1.07}}
src={player.image_url}
className="w-full h-80 object-contain"
/>

<div className="p-6">

<h3 className="font-heading text-xl">

{player.name}

</h3>

<p className="text-muted-foreground">

{player.position}

</p>

</div>

</motion.div>

))}

</div>

</motion.div>

</section>

)}

{/* LOADING */}

{loading &&(

<div className="py-32 flex justify-center">

<motion.div
animate={{
rotate:360
}}
transition={{
repeat:Infinity,
duration:1,
ease:"linear"
}}
className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full"
/>

</div>

)}

</div>

);

};

export default HomePage;