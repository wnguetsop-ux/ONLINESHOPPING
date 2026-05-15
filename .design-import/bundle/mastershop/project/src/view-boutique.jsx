// Boutique — public-facing storefront the merchant's customers see
const Boutique = ({ goAdmin }) => {
  const [cartCount, setCartCount] = React.useState(2);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [detail, setDetail] = React.useState(null);

  return (
    <div className="page-anim" style={{height:"100vh", overflow:"auto", background:"var(--bg-0)", position:"relative"}}>
      <BoutiqueTop goAdmin={goAdmin} cartCount={cartCount} onCart={()=>setCartOpen(true)}/>
      <BoutiqueHero/>
      <BoutiqueCategories/>
      <BoutiqueGrid onProduct={setDetail}/>
      <BoutiqueValueProps/>
      <BoutiqueFooter/>

      {detail && <ProductDetailModal product={detail} onClose={()=>setDetail(null)} onAdd={()=>{setCartCount(n=>n+1); setDetail(null);}}/>}
      {cartOpen && <CartDrawer onClose={()=>setCartOpen(false)} count={cartCount}/>}
    </div>
  );
};

const BoutiqueTop = ({ goAdmin, cartCount, onCart }) => (
  <div style={{
    position:"sticky", top:0, zIndex:20,
    backdropFilter:"blur(20px) saturate(140%)", WebkitBackdropFilter:"blur(20px) saturate(140%)",
    background:"color-mix(in oklab, var(--bg-0) 78%, transparent)",
    borderBottom:"1px solid var(--line)"
  }}>
    {/* Admin banner */}
    <div style={{
      padding:"7px 28px", display:"flex", alignItems:"center", justifyContent:"space-between",
      background:"linear-gradient(90deg, color-mix(in oklab, var(--accent) 20%, transparent), color-mix(in oklab, var(--accent-2) 12%, transparent))",
      borderBottom:"1px solid var(--line)", fontSize:11.5
    }}>
      <span style={{color:"var(--text-2)", display:"flex", alignItems:"center", gap:8}}>
        <Icons.Eye size={12}/> Vous voyez la boutique comme un client. <strong style={{color:"var(--text)"}}>Aperçu Live</strong>
      </span>
      <button onClick={goAdmin} className="btn btn-ghost" style={{fontSize:11, padding:"3px 10px"}}>
        <Icons.ArrowRight size={12} style={{transform:"rotate(180deg)"}}/> Retour à l'admin
      </button>
    </div>
    {/* Nav */}
    <div style={{padding:"16px 32px", display:"flex", alignItems:"center", gap:24}}>
      <div style={{display:"flex", alignItems:"center", gap:10}}>
        <div style={{
          width:34, height:34, borderRadius:10,
          background:"linear-gradient(135deg, #fbbf24, #f97316, #dc2626)",
          display:"grid", placeItems:"center", color:"#0b0612", fontWeight:700, fontSize:14
        }}>SA</div>
        <div>
          <div style={{fontSize:15, fontWeight:700, letterSpacing:-0.2, fontFamily:"'Instrument Serif', serif", fontStyle:"italic"}}>Sankofa Atelier</div>
          <div style={{fontSize:10, color:"var(--text-3)"}}>Mode & artisanat · Sénégal</div>
        </div>
      </div>
      <nav style={{display:"flex", gap:18, marginLeft:24}}>
        {["Boutique","Nouveautés","Bestsellers","Lookbook","À propos"].map((l,i)=>(
          <a key={i} style={{fontSize:13, color: i===0?"var(--text)":"var(--text-2)", fontWeight: i===0?600:500, cursor:"pointer", position:"relative"}}>
            {l}
            {i===0 && <span style={{position:"absolute", left:0, right:0, bottom:-19, height:2, background:"var(--accent)", borderRadius:2}}/>}
          </a>
        ))}
      </nav>
      <div style={{flex:1}}/>
      <div style={{position:"relative"}}>
        <Icons.Search size={14} style={{position:"absolute", left:12, top:11, color:"var(--text-3)"}}/>
        <input className="input" placeholder="Rechercher…" style={{paddingLeft:34, fontSize:12.5, width:240}}/>
      </div>
      <button className="btn btn-icon"><Icons.Heart size={15}/></button>
      <button className="btn btn-icon" onClick={onCart} style={{position:"relative"}}>
        <Icons.Cart size={15}/>
        {cartCount > 0 && <span style={{
          position:"absolute", top:-4, right:-4, minWidth:16, height:16, padding:"0 4px",
          background:"var(--accent)", color:"#0b0612", fontSize:10, fontWeight:700,
          borderRadius:99, display:"grid", placeItems:"center", border:"2px solid var(--bg-0)"
        }}>{cartCount}</span>}
      </button>
    </div>
  </div>
);

const BoutiqueHero = () => (
  <div style={{
    padding:"60px 32px 50px", position:"relative", overflow:"hidden",
    borderBottom:"1px solid var(--line)"
  }}>
    {/* Animated gradient orb */}
    <div style={{
      position:"absolute", top:-200, right:-100, width:600, height:600,
      background:"radial-gradient(circle, color-mix(in oklab, var(--accent) 25%, transparent) 0%, transparent 70%)",
      filter:"blur(40px)", pointerEvents:"none"
    }}/>
    <div style={{
      position:"absolute", bottom:-150, left:200, width:400, height:400,
      background:"radial-gradient(circle, color-mix(in oklab, #f97316 20%, transparent) 0%, transparent 70%)",
      filter:"blur(40px)", pointerEvents:"none"
    }}/>

    <div style={{display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:40, alignItems:"center", position:"relative", zIndex:1, maxWidth:1280, margin:"0 auto"}}>
      <div>
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:18}}>
          <span className="chip chip-accent">
            <Icons.Sparkle size={11}/> Nouvelle collection
          </span>
          <span style={{fontSize:11.5, color:"var(--text-3)"}}>Automne 2024</span>
        </div>
        <h1 style={{fontSize:62, fontWeight:600, lineHeight:1.02, letterSpacing:-1.5, marginBottom:20}}>
          L'élégance <span className="serif" style={{color:"var(--accent)"}}>cousue main</span>,<br/>
          livrée chez vous.
        </h1>
        <p style={{fontSize:16, color:"var(--text-2)", lineHeight:1.6, maxWidth:520, marginBottom:30}}>
          Boubous, sacs en cuir tressé, bijoux en bronze — chaque pièce est imaginée à Dakar par des artisans passionnés. Livraison Sénégal & sous-région.
        </p>
        <div style={{display:"flex", gap:10, marginBottom:30}}>
          <button className="btn btn-primary" style={{padding:"12px 20px", fontSize:14}}>
            Découvrir la collection <Icons.ArrowRight size={14}/>
          </button>
          <button className="btn" style={{padding:"12px 20px", fontSize:14}}>
            <Icons.Eye size={14}/>Lookbook 2024
          </button>
        </div>
        <div style={{display:"flex", gap:24, fontSize:11.5, color:"var(--text-3)"}}>
          <span style={{display:"flex", alignItems:"center", gap:6}}>
            <Icons.Truck size={14} style={{color:"var(--accent)"}}/> Livraison Dakar 24h
          </span>
          <span style={{display:"flex", alignItems:"center", gap:6}}>
            <Icons.Lock size={14} style={{color:"var(--accent)"}}/> Paiement Mobile Money
          </span>
          <span style={{display:"flex", alignItems:"center", gap:6}}>
            <Icons.Heart size={14} style={{color:"var(--accent)"}}/> Fait main
          </span>
        </div>
      </div>

      <HeroProductStack/>
    </div>
  </div>
);

const HeroProductStack = () => {
  const items = [
    { kind:"bazin", colors:["#fcd34d","#fbbf24","#1e3a8a"], name:"Bazin riche", price:78000 },
    { kind:"leather", colors:["#78350f","#451a03","#1c1917"], name:"Sac Tressé", price:32500 },
    { kind:"jewelry", colors:["#a78bfa","#7c3aed","#1e1b4b"], name:"Boucles Baobab", price:9500 },
  ];
  return (
    <div style={{position:"relative", height:480, perspective:"1200px"}}>
      {items.map((it, i) => (
        <div key={i} style={{
          position:"absolute",
          top: 30 + i*30,
          left: i*80,
          width:240, height:300,
          transform: `rotateY(${-12 + i*4}deg) rotateX(2deg)`,
          transformStyle:"preserve-3d",
          animation:`slide-in-right .8s ${i*120}ms cubic-bezier(.2,.8,.2,1) both`,
          zIndex: items.length - i,
        }}>
          <div style={{
            width:"100%", height:"100%", borderRadius:18, overflow:"hidden",
            boxShadow:"0 40px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px var(--line-3)",
            position:"relative"
          }}>
            <ProductImage kind={it.kind} colors={it.colors} radius={18}/>
            <div style={{
              position:"absolute", bottom:0, left:0, right:0,
              padding:"30px 14px 14px",
              background:"linear-gradient(180deg, transparent, rgba(0,0,0,0.85))",
              color:"#fff"
            }}>
              <div style={{fontSize:12, opacity:0.7, marginBottom:3}}>{it.name}</div>
              <div style={{fontSize:14, fontWeight:600}} className="mono"><Money value={it.price}/></div>
            </div>
          </div>
        </div>
      ))}
      {/* Floating badge */}
      <div style={{
        position:"absolute", top:0, right:0,
        padding:"10px 14px", borderRadius:14,
        background:"var(--bg-1)", border:"1px solid var(--line-3)",
        boxShadow:"var(--shadow-2)",
        animation:"slide-in-right 1s 0.6s cubic-bezier(.2,.8,.2,1) both",
        display:"flex", alignItems:"center", gap:10
      }}>
        <div style={{
          width:34, height:34, borderRadius:10, display:"grid", placeItems:"center",
          background:"color-mix(in oklab, var(--accent) 20%, transparent)", color:"var(--accent)"
        }}><Icons.Bolt size={16}/></div>
        <div>
          <div style={{fontSize:12, fontWeight:600}}>3 commandes</div>
          <div style={{fontSize:10.5, color:"var(--text-3)"}}>cette dernière heure</div>
        </div>
      </div>
    </div>
  );
};

const BoutiqueCategories = () => {
  const cats = [
    { name:"Mode femme", count:48, kind:"bazin", colors:["#fbbf24","#f97316","#dc2626"] },
    { name:"Mode homme", count:32, kind:"wax", colors:["#0ea5e9","#1e40af","#0c4a6e"] },
    { name:"Maroquinerie", count:24, kind:"leather", colors:["#78350f","#451a03"] },
    { name:"Bijoux", count:67, kind:"jewelry", colors:["#fbbf24","#a78bfa","#1e1b4b"] },
    { name:"Maison", count:18, kind:"mudcloth", colors:["#fef3c7","#451a03"] },
    { name:"Accessoires", count:41, kind:"silk", colors:["#fb7185","#f97316","#fbbf24"] },
  ];
  return (
    <div style={{padding:"40px 32px 30px", maxWidth:1280, margin:"0 auto"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:18}}>
        <h2 style={{fontSize:24, fontWeight:600, letterSpacing:-0.4}}>Catégories</h2>
        <a style={{fontSize:12.5, color:"var(--text-2)", cursor:"pointer", display:"flex", alignItems:"center", gap:5}}>
          Toutes les catégories <Icons.ArrowRight size={12}/>
        </a>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:12}}>
        {cats.map((c,i)=>(
          <button key={i} style={{
            all:"unset", cursor:"pointer", borderRadius:14, overflow:"hidden",
            position:"relative", aspectRatio:"4/5",
            transition:"transform .25s",
            animation:`fadein .4s ${i*50}ms both`
          }}
          onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px)"}
          onMouseLeave={e=>e.currentTarget.style.transform="none"}
          >
            <ProductImage kind={c.kind} colors={c.colors} radius={14}/>
            <div style={{
              position:"absolute", inset:0,
              background:"linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85))",
              display:"flex", flexDirection:"column", justifyContent:"flex-end",
              padding:"12px 14px"
            }}>
              <div style={{fontSize:13, fontWeight:600, color:"#fff"}}>{c.name}</div>
              <div style={{fontSize:10.5, color:"rgba(255,255,255,0.7)", marginTop:2}}>{c.count} articles</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const BoutiqueGrid = ({ onProduct }) => {
  const [filter, setFilter] = React.useState("Tous");
  const filters = ["Tous","Bestsellers","Nouveautés","En promo"];

  return (
    <div style={{padding:"30px 32px 50px", maxWidth:1280, margin:"0 auto"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20}}>
        <h2 style={{fontSize:24, fontWeight:600, letterSpacing:-0.4}}>Coups de cœur</h2>
        <div style={{display:"flex", gap:6}}>
          {filters.map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{
              all:"unset", cursor:"pointer", padding:"6px 12px", borderRadius:99, fontSize:12,
              background: filter===f ? "color-mix(in oklab, var(--accent) 18%, transparent)" : "transparent",
              color: filter===f ? "var(--accent)" : "var(--text-2)",
              border: filter===f ? "1px solid color-mix(in oklab, var(--accent) 30%, transparent)" : "1px solid var(--line-2)",
            }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:18}}>
        {PRODUCTS.slice(0, 8).map((p, i) => <ProductCardTilt key={p.id} p={p} idx={i} onClick={()=>onProduct(p)}/>)}
      </div>
    </div>
  );
};

const ProductCardTilt = ({ p, idx, onClick }) => {
  const ref = React.useRef();
  const [tilt, setTilt] = React.useState({ x:0, y:0, hover:false });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py*6, y: px*6, hover:true });
  };
  const onLeave = () => setTilt({x:0,y:0,hover:false});

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}
      style={{
        cursor:"pointer", animation:`fadein .4s ${idx*50}ms both`,
        transform:`perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
        transition:"transform .15s ease-out",
        transformStyle:"preserve-3d"
      }}>
      <div style={{position:"relative"}}>
        <ProductImage kind={p.img} colors={p.colors} radius={14} tag={p.tag} hover={tilt.hover}/>
        <div style={{
          position:"absolute", top:10, right:10,
          width:32, height:32, borderRadius:99, display:"grid", placeItems:"center",
          background:"rgba(0,0,0,0.4)", backdropFilter:"blur(8px)", color:"#fff",
          opacity: tilt.hover ? 1 : 0, transition:"opacity .25s",
          transform: tilt.hover ? "translateZ(20px)" : "none",
        }}><Icons.Heart size={14}/></div>
        {tilt.hover && (
          <button style={{
            position:"absolute", bottom:14, left:14, right:14,
            padding:"10px 12px", borderRadius:10, fontSize:12, fontWeight:600,
            background:"rgba(0,0,0,0.85)", backdropFilter:"blur(10px)", color:"#fff",
            border:"1px solid rgba(255,255,255,0.15)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            cursor:"pointer", transform:"translateZ(30px)",
            animation:"fadein .25s both"
          }}>
            <Icons.Cart size={14}/>Ajouter au panier
          </button>
        )}
      </div>
      <div style={{padding:"12px 4px 0"}}>
        <div style={{fontSize:10.5, color:"var(--text-3)", marginBottom:3}}>{p.category}</div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10}}>
          <div style={{fontSize:13.5, fontWeight:600}}>{p.name}</div>
          <div style={{fontSize:13, fontWeight:600, whiteSpace:"nowrap"}}><Money value={p.price}/></div>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:8, marginTop:8}}>
          <div style={{display:"flex", gap:4}}>
            {p.colors.slice(0,3).map((c,i)=>(
              <span key={i} style={{width:11, height:11, borderRadius:99, background:c, border:"1px solid var(--line-2)"}}/>
            ))}
          </div>
          <span style={{fontSize:10.5, color:"var(--text-3)", display:"flex", alignItems:"center", gap:3}}>
            <Icons.Star size={10} style={{color:"#fbbf24", fill:"#fbbf24"}}/> 4.8 · 124 avis
          </span>
        </div>
      </div>
    </div>
  );
};

const BoutiqueValueProps = () => {
  const items = [
    { icon:"Truck", title:"Livraison rapide", desc:"Dakar 24h, Sénégal 48-72h, sous-région 5-7 jours" },
    { icon:"Lock", title:"Paiement sécurisé", desc:"Wave, Orange Money, MTN MoMo ou paiement à la livraison" },
    { icon:"Heart", title:"Fait main au Sénégal", desc:"Chaque pièce est confectionnée par nos artisans à Dakar" },
    { icon:"Phone", title:"Support 7j/7", desc:"WhatsApp à +221 77 412 88 09 ou chat en direct" },
  ];
  return (
    <div style={{padding:"40px 32px", borderTop:"1px solid var(--line)", borderBottom:"1px solid var(--line)", background:"var(--bg-1)"}}>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:24, maxWidth:1280, margin:"0 auto"}}>
        {items.map((it, i) => {
          const Icon = Icons[it.icon];
          return (
            <div key={i} style={{display:"flex", gap:14, alignItems:"flex-start"}}>
              <div style={{
                width:42, height:42, borderRadius:11, display:"grid", placeItems:"center",
                background:"color-mix(in oklab, var(--accent) 14%, transparent)",
                color:"var(--accent)", flexShrink:0
              }}><Icon size={18}/></div>
              <div>
                <div style={{fontSize:13.5, fontWeight:600, marginBottom:4}}>{it.title}</div>
                <div style={{fontSize:11.5, color:"var(--text-3)", lineHeight:1.5}}>{it.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BoutiqueFooter = () => (
  <div style={{padding:"36px 32px 22px", maxWidth:1280, margin:"0 auto"}}>
    <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr 1fr 1fr", gap:30, marginBottom:30}}>
      <div>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:14}}>
          <div style={{
            width:32, height:32, borderRadius:9,
            background:"linear-gradient(135deg, #fbbf24, #f97316, #dc2626)",
            display:"grid", placeItems:"center", color:"#0b0612", fontWeight:700, fontSize:13
          }}>SA</div>
          <span style={{fontSize:16, fontWeight:700, fontFamily:"'Instrument Serif', serif", fontStyle:"italic"}}>Sankofa Atelier</span>
        </div>
        <p style={{fontSize:12, color:"var(--text-3)", lineHeight:1.6, maxWidth:280}}>
          Mode et artisanat sénégalais, expédié dans toute l'Afrique de l'Ouest.
        </p>
        <div style={{display:"flex", gap:8, marginTop:14}}>
          <button className="btn btn-icon"><span style={{fontSize:11, fontWeight:700}}>W</span></button>
          <button className="btn btn-icon"><span style={{fontSize:11, fontWeight:700}}>I</span></button>
          <button className="btn btn-icon"><span style={{fontSize:11, fontWeight:700}}>F</span></button>
          <button className="btn btn-icon"><span style={{fontSize:11, fontWeight:700}}>T</span></button>
        </div>
      </div>
      {[
        { title:"Boutique", links:["Toutes les pièces","Nouveautés","Bestsellers","Collections","Cartes cadeaux"] },
        { title:"Aide", links:["Livraison","Retours","Tailles","Entretien","FAQ"] },
        { title:"L'Atelier", links:["Notre histoire","Nos artisans","Lookbook","Presse","Contact"] },
      ].map((col,i)=>(
        <div key={i}>
          <div style={{fontSize:12, fontWeight:600, marginBottom:14, color:"var(--text)"}}>{col.title}</div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {col.links.map((l,j)=>(
              <a key={j} style={{fontSize:12, color:"var(--text-3)", cursor:"pointer"}}>{l}</a>
            ))}
          </div>
        </div>
      ))}
    </div>
    <div style={{borderTop:"1px solid var(--line)", paddingTop:18, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10}}>
      <div style={{fontSize:11, color:"var(--text-3)"}}>© 2024 Sankofa Atelier · Propulsé par <strong style={{color:"var(--accent)"}}>MasterShop</strong></div>
      <div style={{display:"flex", gap:8, alignItems:"center"}}>
        <span style={{fontSize:10.5, color:"var(--text-3)"}}>Paiement accepté:</span>
        {["Wave","O.Money","MoMo","Visa"].map(p => (
          <span key={p} style={{padding:"3px 8px", border:"1px solid var(--line-2)", borderRadius:6, fontSize:10, color:"var(--text-2)"}}>{p}</span>
        ))}
      </div>
    </div>
  </div>
);

const ProductDetailModal = ({ product, onClose, onAdd }) => {
  const [color, setColor] = React.useState(0);
  const [size, setSize] = React.useState("M");
  const [qty, setQty] = React.useState(1);

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:60,
      background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)",
      display:"grid", placeItems:"center", padding:24,
      animation:"fadein .25s"
    }}>
      <div onClick={e=>e.stopPropagation()} className="card" style={{
        width:"min(960px, 100%)", maxHeight:"90vh", overflow:"auto",
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, padding:0,
        animation:"slide-in-up .35s cubic-bezier(.2,.8,.2,1)",
        background:"var(--bg-1)", border:"1px solid var(--line-3)"
      }}>
        <div style={{padding:24, background:"var(--bg-2)"}}>
          <ProductImage kind={product.img} colors={product.colors} radius={14}/>
          <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginTop:12}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{aspectRatio:"1", borderRadius:8, overflow:"hidden", border: i===0 ? "2px solid var(--accent)" : "1px solid var(--line-2)", cursor:"pointer"}}>
                <ProductImage kind={product.img} colors={[product.colors[i%product.colors.length], product.colors[(i+1)%product.colors.length]]} radius={6}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:"28px 28px", display:"flex", flexDirection:"column"}}>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{alignSelf:"flex-end"}}><Icons.X size={16}/></button>
          <div style={{fontSize:11.5, color:"var(--text-3)", marginBottom:6}}>{product.category}</div>
          <h2 style={{fontSize:26, fontWeight:600, letterSpacing:-0.4, marginBottom:8}}>{product.name}</h2>
          <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16}}>
            <div style={{display:"flex", gap:2}}>
              {[1,2,3,4,5].map(i=>(<Icons.Star key={i} size={13} style={{color:"#fbbf24", fill: i<=4 ? "#fbbf24" : "transparent"}}/>))}
            </div>
            <span style={{fontSize:11.5, color:"var(--text-3)"}}>4.8 · 124 avis</span>
          </div>
          <div style={{fontSize:24, fontWeight:600, marginBottom:18}}><Money value={product.price}/></div>
          <p style={{fontSize:13, color:"var(--text-2)", lineHeight:1.6, marginBottom:22}}>
            Pièce confectionnée à la main dans notre atelier de Dakar par nos artisans. Tissu certifié, coupe ajustée, finitions soignées.
          </p>

          <div style={{marginBottom:18}}>
            <div style={{fontSize:11.5, color:"var(--text-3)", marginBottom:8}}>Couleur · <strong style={{color:"var(--text)"}}>{["Indigo","Or","Corail"][color] || "Indigo"}</strong></div>
            <div style={{display:"flex", gap:8}}>
              {product.colors.map((c,i)=>(
                <button key={i} onClick={()=>setColor(i)} style={{
                  all:"unset", cursor:"pointer", width:28, height:28, borderRadius:99,
                  background:c, border: i===color ? "2px solid var(--accent)" : "1px solid var(--line-2)",
                  outline: i===color ? "2px solid var(--bg-1)" : "none", outlineOffset:-3
                }}/>
              ))}
            </div>
          </div>

          <div style={{marginBottom:18}}>
            <div style={{fontSize:11.5, color:"var(--text-3)", marginBottom:8}}>Taille</div>
            <div style={{display:"flex", gap:6}}>
              {["XS","S","M","L","XL"].map(s => (
                <button key={s} onClick={()=>setSize(s)} style={{
                  all:"unset", cursor:"pointer", padding:"8px 14px", borderRadius:9, fontSize:12.5,
                  background: size===s ? "var(--text)" : "var(--bg-2)",
                  color: size===s ? "var(--bg-0)" : "var(--text)",
                  border: "1px solid " + (size===s ? "var(--text)" : "var(--line-2)"),
                  fontWeight: size===s ? 600 : 500
                }}>{s}</button>
              ))}
            </div>
          </div>

          <div style={{display:"flex", gap:10, marginTop:"auto"}}>
            <div style={{display:"flex", alignItems:"center", border:"1px solid var(--line-2)", borderRadius:10, background:"var(--bg-2)"}}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{all:"unset", cursor:"pointer", width:36, height:42, display:"grid", placeItems:"center", color:"var(--text-2)"}}>−</button>
              <span style={{width:30, textAlign:"center", fontWeight:600}} className="mono">{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{all:"unset", cursor:"pointer", width:36, height:42, display:"grid", placeItems:"center", color:"var(--text-2)"}}>+</button>
            </div>
            <button onClick={onAdd} className="btn btn-primary" style={{flex:1, padding:"12px 20px", fontSize:14, justifyContent:"center"}}>
              <Icons.Cart size={14}/>Ajouter — <Money value={product.price * qty}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartDrawer = ({ onClose, count }) => {
  const items = PRODUCTS.slice(0, count);
  const total = items.reduce((a,b)=>a+b.price,0);
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:50,
      background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)",
      animation:"fadein .2s"
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"absolute", right:0, top:0, bottom:0, width:440,
        background:"var(--bg-1)", borderLeft:"1px solid var(--line-2)",
        animation:"slide-in-right .35s cubic-bezier(.2,.8,.2,1)",
        display:"flex", flexDirection:"column",
        boxShadow:"-30px 0 80px rgba(0,0,0,0.4)"
      }}>
        <div style={{padding:"22px 24px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <h2 style={{fontSize:17, fontWeight:600}}>Panier · {count}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icons.X size={16}/></button>
        </div>
        <div style={{flex:1, overflowY:"auto", padding:"18px 24px"}}>
          {items.map(p => (
            <div key={p.id} style={{display:"flex", gap:14, padding:"14px 0", borderBottom:"1px solid var(--line)"}}>
              <div style={{width:64, height:80, borderRadius:9, overflow:"hidden", flexShrink:0}}>
                <ProductImage kind={p.img} colors={p.colors} radius={9}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13.5, fontWeight:600}}>{p.name}</div>
                <div style={{fontSize:11, color:"var(--text-3)", marginTop:3}}>Taille M · Indigo</div>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10}}>
                  <div style={{display:"flex", alignItems:"center", border:"1px solid var(--line-2)", borderRadius:8}}>
                    <button style={{all:"unset", cursor:"pointer", width:26, height:28, display:"grid", placeItems:"center"}}>−</button>
                    <span style={{width:22, textAlign:"center", fontSize:12}} className="mono">1</span>
                    <button style={{all:"unset", cursor:"pointer", width:26, height:28, display:"grid", placeItems:"center"}}>+</button>
                  </div>
                  <span style={{fontSize:13, fontWeight:600}}><Money value={p.price}/></span>
                </div>
              </div>
            </div>
          ))}
          <div style={{padding:"16px 14px", background:"var(--bg-2)", borderRadius:12, marginTop:18, display:"flex", alignItems:"center", gap:10}}>
            <Icons.Tag size={16} style={{color:"var(--accent)"}}/>
            <span style={{fontSize:12.5, color:"var(--text-2)"}}>Code promo ?</span>
            <input className="input" placeholder="WELCOME10" style={{flex:1, padding:"6px 10px", fontSize:12}}/>
            <button className="btn" style={{padding:"6px 12px", fontSize:11.5}}>OK</button>
          </div>
        </div>
        <div style={{padding:"18px 24px 24px", borderTop:"1px solid var(--line)", background:"var(--bg-2)"}}>
          <div style={{display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:13, color:"var(--text-2)"}}>
            <span>Sous-total</span><Money value={total}/>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:13, color:"var(--text-2)"}}>
            <span>Livraison Dakar</span><span style={{color:"var(--success)"}}>Offerte</span>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", padding:"10px 0 16px", fontSize:16, fontWeight:600, borderTop:"1px solid var(--line)", marginTop:8}}>
            <span>Total</span><Money value={total}/>
          </div>
          <button className="btn btn-primary" style={{width:"100%", padding:"13px", fontSize:14, justifyContent:"center"}}>
            Commander avec Wave <Icons.ArrowRight size={14}/>
          </button>
          <div style={{textAlign:"center", fontSize:10.5, color:"var(--text-3)", marginTop:10}}>
            <Icons.Lock size={10}/> Paiement sécurisé · Wave, O.Money, MoMo
          </div>
        </div>
      </div>
    </div>
  );
};

window.Boutique = Boutique;
