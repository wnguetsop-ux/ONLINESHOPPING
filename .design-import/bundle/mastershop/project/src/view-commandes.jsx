// Commandes — orders list with filter chips, table, drawer detail
const Commandes = () => {
  const [filter, setFilter] = React.useState("all");
  const [selected, setSelected] = React.useState(null);

  const counts = {
    all: ORDERS.length,
    "en-attente": ORDERS.filter(o=>o.status==="en-attente").length,
    "a-preparer": ORDERS.filter(o=>o.status==="a-preparer").length,
    "expediee": ORDERS.filter(o=>o.status==="expediee").length,
    "livree": ORDERS.filter(o=>o.status==="livree").length,
  };

  const list = ORDERS.filter(o => filter==="all" ? true : o.status===filter);

  return (
    <div className="page-anim" style={{padding:"22px 28px 40px", overflow:"auto", height:"100vh"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, gap:18, flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:12, color:"var(--text-3)", marginBottom:6}}>Toutes les commandes</div>
          <h1 style={{fontSize:26, fontWeight:600, letterSpacing:-0.4}}>Commandes</h1>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button className="btn"><Icons.Filter size={14}/>Filtres</button>
          <button className="btn"><Icons.Notes size={14}/>Exporter</button>
          <button className="btn btn-primary"><Icons.Plus size={14}/>Nouvelle commande</button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14, marginBottom:18}}>
        <StatCard icon="Clock" label="À préparer" value={counts["a-preparer"]} accent="var(--accent)"/>
        <StatCard icon="Truck" label="En livraison" value={counts.expediee} accent="#60a5fa"/>
        <StatCard icon="Check" label="Livrées (semaine)" value="42" accent="#34d399"/>
        <StatCard icon="Coins" label="CA non encaissé" value="125 500 FCFA" accent="#fbbf24" small/>
      </div>

      {/* Filter chips */}
      <div style={{display:"flex", gap:6, marginBottom:14, overflowX:"auto"}}>
        {[
          {id:"all", label:"Toutes"},
          {id:"en-attente", label:"En attente"},
          {id:"a-preparer", label:"À préparer"},
          {id:"expediee", label:"Expédiées"},
          {id:"livree", label:"Livrées"},
        ].map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{
            all:"unset", cursor:"pointer", padding:"7px 14px", borderRadius:99, fontSize:12.5,
            fontWeight:500, whiteSpace:"nowrap",
            background: filter===f.id ? "color-mix(in oklab, var(--accent) 18%, transparent)" : "var(--bg-1)",
            color: filter===f.id ? "var(--accent)" : "var(--text-2)",
            border: filter===f.id ? "1px solid color-mix(in oklab, var(--accent) 30%, transparent)" : "1px solid var(--line-2)",
          }}>
            {f.label}
            <span style={{marginLeft:6, opacity:0.7, fontSize:11}} className="mono">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{padding:0, overflow:"hidden"}}>
        <div style={{
          display:"grid", gridTemplateColumns:"110px 1.6fr 100px 1fr 1fr 130px 30px",
          padding:"12px 18px", borderBottom:"1px solid var(--line)",
          fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:0.6, fontWeight:500
        }}>
          <span>N° Commande</span>
          <span>Client</span>
          <span>Articles</span>
          <span>Paiement</span>
          <span>Statut</span>
          <span style={{textAlign:"right"}}>Total</span>
          <span/>
        </div>
        {list.map((o, i) => (
          <OrderRow key={o.id} o={o} idx={i} onClick={()=>setSelected(o)}/>
        ))}
      </div>

      {selected && <OrderDrawer order={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
};

const StatCard = ({ icon, label, value, accent, small }) => {
  const Icon = Icons[icon];
  return (
    <div className="card" style={{padding:"16px 18px", display:"flex", alignItems:"center", gap:14}}>
      <div style={{
        width:40, height:40, borderRadius:11, display:"grid", placeItems:"center",
        background:`color-mix(in oklab, ${accent} 14%, transparent)`,
        color:accent, border:`1px solid color-mix(in oklab, ${accent} 30%, transparent)`
      }}><Icon size={18}/></div>
      <div>
        <div style={{fontSize:11, color:"var(--text-3)", marginBottom:2}}>{label}</div>
        <div className={small?"mono":"mono"} style={{fontSize:small?15:20, fontWeight:600, letterSpacing:-0.3}}>{value}</div>
      </div>
    </div>
  );
};

const OrderRow = ({ o, idx, onClick }) => (
  <div onClick={onClick} style={{
    display:"grid", gridTemplateColumns:"110px 1.6fr 100px 1fr 1fr 130px 30px",
    padding:"14px 18px", borderBottom:"1px solid var(--line)",
    alignItems:"center", cursor:"pointer", transition:"background .15s",
    animation:`fadein .35s ${idx*30}ms both`
  }}
  onMouseEnter={e=>e.currentTarget.style.background="var(--bg-2)"}
  onMouseLeave={e=>e.currentTarget.style.background="transparent"}
  >
    <span className="mono" style={{fontSize:12, color:"var(--text-2)"}}>{o.id}</span>
    <div style={{display:"flex", alignItems:"center", gap:11}}>
      <Avatar name={o.customer} initials={o.initials} color={o.color} size={32}/>
      <div>
        <div style={{fontSize:13, fontWeight:600}}>{o.customer}</div>
        <div style={{fontSize:11, color:"var(--text-3)", marginTop:1, display:"flex", alignItems:"center", gap:5}}>
          <Icons.MapPin size={10}/>{o.city} · {o.time}
        </div>
      </div>
    </div>
    <span style={{fontSize:13}} className="mono">{o.items}</span>
    <PaymentBadge type={o.payment}/>
    <span className={`chip ${STATUS_LABEL[o.status].chip}`} style={{width:"fit-content"}}>
      <span className="dot"/>{STATUS_LABEL[o.status].fr}
    </span>
    <span style={{textAlign:"right", fontSize:13.5, fontWeight:600}}><Money value={o.total}/></span>
    <Icons.ChevronRight size={14} style={{color:"var(--text-3)"}}/>
  </div>
);

const PaymentBadge = ({ type }) => {
  const cfg = PAYMENT_LABEL[type];
  return (
    <div style={{display:"flex", alignItems:"center", gap:7, fontSize:12}}>
      <span style={{
        width:22, height:22, borderRadius:6,
        background:`linear-gradient(135deg, ${cfg.color}, color-mix(in oklab, ${cfg.color} 50%, #000))`,
        display:"grid", placeItems:"center", color:"#0b0612", fontSize:9, fontWeight:700
      }}>{cfg.fr.split(" ").map(w=>w[0]).join("").slice(0,2)}</span>
      <span style={{color:"var(--text-2)"}}>{cfg.fr}</span>
    </div>
  );
};

const OrderDrawer = ({ order, onClose }) => {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:50,
      background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)",
      animation:"fadein .2s",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"absolute", right:0, top:0, bottom:0, width:520,
        background:"var(--bg-1)", borderLeft:"1px solid var(--line-2)",
        animation:"slide-in-right .35s cubic-bezier(.2,.8,.2,1)",
        overflowY:"auto", boxShadow:"-30px 0 80px rgba(0,0,0,0.4)"
      }}>
        <div style={{padding:"22px 24px", borderBottom:"1px solid var(--line)", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div>
            <div className="mono" style={{fontSize:11.5, color:"var(--text-3)"}}>{order.id}</div>
            <h2 style={{fontSize:18, fontWeight:600, marginTop:2}}>Détails commande</h2>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icons.X size={16}/></button>
        </div>
        <div style={{padding:"22px 24px", display:"flex", flexDirection:"column", gap:18}}>
          {/* Customer */}
          <div style={{display:"flex", alignItems:"center", gap:14, padding:"14px", background:"var(--bg-2)", borderRadius:12, border:"1px solid var(--line)"}}>
            <Avatar name={order.customer} initials={order.initials} color={order.color} size={44}/>
            <div style={{flex:1}}>
              <div style={{fontSize:14, fontWeight:600}}>{order.customer}</div>
              <div style={{fontSize:11.5, color:"var(--text-3)", marginTop:2}}>{order.city} · WhatsApp</div>
            </div>
            <button className="btn"><Icons.Phone size={13}/>Appeler</button>
          </div>

          <div>
            <div style={{fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10}}>Articles</div>
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {PRODUCTS.slice(0, order.items).map(p => (
                <div key={p.id} style={{display:"flex", alignItems:"center", gap:12, padding:"10px 12px", background:"var(--bg-2)", borderRadius:10, border:"1px solid var(--line)"}}>
                  <div style={{width:40, height:50, borderRadius:7, overflow:"hidden", flexShrink:0}}>
                    <ProductImage kind={p.img} colors={p.colors} radius={7}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13, fontWeight:600}}>{p.name}</div>
                    <div style={{fontSize:11.5, color:"var(--text-3)", marginTop:2}}>Qté: 1</div>
                  </div>
                  <span style={{fontSize:13, fontWeight:600}}><Money value={p.price}/></span>
                </div>
              ))}
            </div>
          </div>

          <div style={{padding:"14px 16px", background:"var(--bg-2)", borderRadius:12, border:"1px solid var(--line)"}}>
            <div style={{display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:13, color:"var(--text-2)"}}>
              <span>Sous-total</span><Money value={order.total - 2000}/>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:13, color:"var(--text-2)"}}>
              <span>Livraison</span><Money value={2000}/>
            </div>
            <div style={{height:1, background:"var(--line)", margin:"8px 0"}}/>
            <div style={{display:"flex", justifyContent:"space-between", padding:"4px 0", fontSize:15, fontWeight:600}}>
              <span>Total</span><Money value={order.total}/>
            </div>
          </div>

          <div>
            <div style={{fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10}}>Suivi de livraison</div>
            <Timeline status={order.status}/>
          </div>

          <div style={{display:"flex", gap:8}}>
            <button className="btn" style={{flex:1}}><Icons.Notes size={13}/>Imprimer le bon</button>
            <button className="btn btn-primary" style={{flex:1}}><Icons.Truck size={13}/>Marquer comme expédiée</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Timeline = ({ status }) => {
  const steps = [
    { id:"en-attente", label:"Confirmée" },
    { id:"a-preparer", label:"Préparation" },
    { id:"expediee", label:"Expédiée" },
    { id:"livree", label:"Livrée" },
  ];
  const order = ["en-attente","a-preparer","expediee","livree"];
  const currentIdx = order.indexOf(status);
  return (
    <div style={{display:"flex", flexDirection:"column", gap:0}}>
      {steps.map((s, i) => {
        const done = i <= currentIdx;
        const current = i === currentIdx;
        return (
          <div key={s.id} style={{display:"flex", gap:14, alignItems:"flex-start", padding:"6px 0"}}>
            <div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
              <div style={{
                width:18, height:18, borderRadius:99,
                background: done ? "var(--accent)" : "var(--bg-3)",
                border: current ? "3px solid color-mix(in oklab, var(--accent) 30%, transparent)" : "1px solid var(--line-2)",
                display:"grid", placeItems:"center"
              }}>
                {done && <Icons.Check size={10} style={{color:"#0b0612"}}/>}
              </div>
              {i<steps.length-1 && <div style={{width:2, flex:1, minHeight:18, background: i<currentIdx ? "var(--accent)" : "var(--line-2)"}}/>}
            </div>
            <div style={{paddingTop:1, paddingBottom:14}}>
              <div style={{fontSize:13, fontWeight: current?600:500, color: done?"var(--text)":"var(--text-3)"}}>{s.label}</div>
              {done && <div style={{fontSize:11, color:"var(--text-3)", marginTop:2}}>il y a {(currentIdx-i+1)*2} h</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

window.Commandes = Commandes;
