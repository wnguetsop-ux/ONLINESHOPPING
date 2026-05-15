// Dashboard — overview with KPIs, chart, recent activity
const Dashboard = () => {
  return (
    <div className="page-anim" style={{padding:"22px 28px 40px", overflow:"auto", height:"100vh"}}>
      <DashboardHeader/>
      <KPIRow/>
      <div style={{display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:18, marginTop:18}}>
        <RevenueChart/>
        <PaymentMix/>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:18, marginTop:18}}>
        <RecentOrders/>
        <TopProducts/>
      </div>
    </div>
  );
};

const DashboardHeader = () => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  return (
    <div style={{display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:24, gap:18, flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:12, color:"var(--text-3)", marginBottom:6, display:"flex", alignItems:"center", gap:8}}>
          <span style={{width:6, height:6, borderRadius:99, background:"var(--success)", boxShadow:"0 0 8px var(--success)"}}/>
          Boutique en ligne · Dakar
        </div>
        <h1 style={{fontSize:30, fontWeight:600, letterSpacing:-0.5}}>
          {greeting}, <span className="serif" style={{color:"var(--accent)"}}>Aminata</span>
        </h1>
        <p style={{margin:"6px 0 0", color:"var(--text-2)", fontSize:14}}>
          Vous avez <strong style={{color:"var(--text)"}}>3 commandes à préparer</strong> et <strong style={{color:"var(--text)"}}>8 messages</strong> non lus.
        </p>
      </div>
      <div style={{display:"flex", gap:8}}>
        <button className="btn"><Icons.Notes size={14}/>Rapport</button>
        <button className="btn btn-primary"><Icons.Plus size={14}/>Nouvelle commande</button>
      </div>
    </div>
  );
};

const KPI = ({ label, value, delta, suffix, sparkline, accent }) => (
  <div className="card" style={{padding:"18px 18px 14px", position:"relative", overflow:"hidden"}}>
    <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10}}>
      <span style={{fontSize:12, color:"var(--text-3)", fontWeight:500}}>{label}</span>
      <span className={`chip ${delta>=0?"chip-success":"chip-danger"}`} style={{fontSize:10.5, padding:"3px 7px"}}>
        {delta>=0 ? <Icons.ArrowUp size={10}/> : <Icons.ArrowDown size={10}/>}
        {Math.abs(delta)}%
      </span>
    </div>
    <div style={{fontSize:28, fontWeight:600, letterSpacing:-0.5}} className="mono">
      {value}<span style={{fontSize:14, fontWeight:500, color:"var(--text-3)", marginLeft:4}}>{suffix}</span>
    </div>
    <Sparkline data={sparkline} accent={accent}/>
  </div>
);

const Sparkline = ({ data, accent="var(--accent)" }) => {
  const w = 200, h = 38;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v,i)=> [(i/(data.length-1))*w, h - ((v-min)/(max-min||1))*h*0.85 - 4 ]);
  const path = pts.map((p,i)=> (i===0?"M":"L")+p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
  const fill = path + ` L${w},${h} L0,${h} Z`;
  const id = React.useId();
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{width:"100%",height:38, marginTop:8, display:"block"}}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={accent} stopOpacity="0.35"/>
        <stop offset="1" stopColor={accent} stopOpacity="0"/>
      </linearGradient></defs>
      <path d={fill} fill={`url(#${id})`}/>
      <path d={path} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const KPIRow = () => (
  <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14}}>
    <KPI label="Chiffre d'affaires (7 j)" value="2 845 000" suffix="FCFA" delta={18} sparkline={[12,14,11,18,16,22,28]} accent="var(--accent)"/>
    <KPI label="Commandes" value="142" delta={12} sparkline={[8,10,9,12,14,11,15]} accent="#60a5fa"/>
    <KPI label="Panier moyen" value="20 035" suffix="FCFA" delta={-3} sparkline={[18,20,17,16,18,17,16]} accent="#fbbf24"/>
    <KPI label="Nouveaux clients" value="38" delta={24} sparkline={[3,4,5,6,5,7,8]} accent="#34d399"/>
  </div>
);

const RevenueChart = () => {
  const days = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  const data = [380, 510, 420, 680, 590, 820, 720]; // k FCFA
  const max = Math.max(...data);
  return (
    <div className="card" style={{padding:"20px 22px"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18}}>
        <div>
          <h3 style={{fontSize:15, fontWeight:600}}>Revenus de la semaine</h3>
          <p style={{margin:"4px 0 0", fontSize:12, color:"var(--text-3)"}}>4 120 000 FCFA · +18% vs semaine dernière</p>
        </div>
        <div style={{display:"flex", gap:6}}>
          {["7j","30j","12m"].map((p,i)=>(
            <button key={p} className="btn" style={{
              padding:"5px 11px", fontSize:11.5,
              background: i===0 ? "var(--bg-3)" : "transparent",
              borderColor: i===0 ? "var(--line-3)" : "transparent",
              color: i===0 ? "var(--text)" : "var(--text-3)"
            }}>{p}</button>
          ))}
        </div>
      </div>
      <div style={{display:"grid", gridTemplateColumns:`repeat(${days.length}, 1fr)`, gap:14, height:200, alignItems:"end"}}>
        {data.map((v,i)=>(
          <div key={i} style={{display:"flex", flexDirection:"column", alignItems:"center", gap:8, height:"100%", justifyContent:"flex-end"}}>
            <div style={{position:"relative", width:"100%", height:`${(v/max)*100}%`, display:"flex", alignItems:"flex-end"}}>
              <div style={{
                width:"100%", height:"100%",
                background:`linear-gradient(180deg, var(--accent), color-mix(in oklab, var(--accent-2) 70%, transparent))`,
                borderRadius:"6px 6px 2px 2px",
                boxShadow:i===5 ? "0 0 0 1px var(--accent), 0 0 24px var(--accent-glow)" : "inset 0 1px 0 rgba(255,255,255,0.15)",
                animation:`slide-in-up .5s ${i*60}ms cubic-bezier(.2,.8,.2,1) both`
              }}/>
              {i===5 && <div style={{
                position:"absolute", top:-32, left:"50%", transform:"translateX(-50%)",
                background:"var(--bg-3)", border:"1px solid var(--line-3)",
                padding:"4px 8px", borderRadius:6, fontSize:11, fontWeight:600, whiteSpace:"nowrap",
                boxShadow:"var(--shadow-2)"
              }} className="mono">{v}k FCFA</div>}
            </div>
            <span style={{fontSize:11, color:"var(--text-3)"}}>{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PaymentMix = () => {
  const items = [
    { name:"Wave", value:42, color:"#22d3ee" },
    { name:"Orange Money", value:31, color:"#f97316" },
    { name:"MTN MoMo", value:18, color:"#facc15" },
    { name:"Espèces", value:9, color:"#a8a8b3" },
  ];
  let acc = 0;
  return (
    <div className="card" style={{padding:"20px 22px"}}>
      <h3 style={{fontSize:15, fontWeight:600, marginBottom:4}}>Moyens de paiement</h3>
      <p style={{margin:"0 0 18px", fontSize:12, color:"var(--text-3)"}}>Sur 142 commandes</p>

      <div style={{display:"flex", gap:18, alignItems:"center"}}>
        <svg viewBox="-22 -22 44 44" style={{width:120, height:120, transform:"rotate(-90deg)"}}>
          <circle r="18" fill="none" stroke="var(--bg-3)" strokeWidth="6"/>
          {items.map((it, i) => {
            const r = 18, c = 2 * Math.PI * r;
            const len = (it.value/100) * c;
            const off = -acc;
            acc += len;
            return <circle key={i} r={r} fill="none" stroke={it.color} strokeWidth="6"
              strokeDasharray={`${len} ${c}`} strokeDashoffset={off}
              style={{transition:"all .4s"}}/>;
          })}
          <text x="0" y="0" fill="var(--text)" fontSize="6" fontWeight="600" textAnchor="middle" dominantBaseline="central" transform="rotate(90)">
            142
          </text>
        </svg>
        <div style={{flex:1, display:"flex", flexDirection:"column", gap:9}}>
          {items.map((it,i)=>(
            <div key={i} style={{display:"flex", alignItems:"center", gap:10}}>
              <span style={{width:8, height:8, borderRadius:2, background:it.color, flexShrink:0}}/>
              <span style={{fontSize:12.5, color:"var(--text-2)", flex:1}}>{it.name}</span>
              <span className="mono" style={{fontSize:12.5, fontWeight:600}}>{it.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RecentOrders = () => {
  const recent = ORDERS.slice(0, 5);
  return (
    <div className="card" style={{padding:"20px 22px"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
        <h3 style={{fontSize:15, fontWeight:600}}>Commandes récentes</h3>
        <button className="btn btn-ghost" style={{fontSize:11.5, padding:"4px 8px"}}>Voir tout <Icons.ArrowRight size={12}/></button>
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:2}}>
        {recent.map(o => (
          <div key={o.id} style={{
            display:"grid", gridTemplateColumns:"auto 1fr auto auto", gap:12, alignItems:"center",
            padding:"10px 6px", borderRadius:8, transition:"background .15s",
          }}
          onMouseEnter={e=>e.currentTarget.style.background="var(--bg-2)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
          >
            <Avatar name={o.customer} initials={o.initials} color={o.color} size={32}/>
            <div style={{minWidth:0}}>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <span style={{fontSize:13, fontWeight:600}}>{o.customer}</span>
                <span className="mono" style={{fontSize:11, color:"var(--text-3)"}}>{o.id}</span>
              </div>
              <div style={{fontSize:11.5, color:"var(--text-3)", marginTop:2}}>
                {o.items} article{o.items>1?"s":""} · {o.city} · {o.time}
              </div>
            </div>
            <span className={`chip ${STATUS_LABEL[o.status].chip}`}>
              <span className="dot"/>{STATUS_LABEL[o.status].fr}
            </span>
            <Money value={o.total}/>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopProducts = () => {
  const top = PRODUCTS.slice(0,4);
  return (
    <div className="card" style={{padding:"20px 22px"}}>
      <h3 style={{fontSize:15, fontWeight:600, marginBottom:14}}>Top produits</h3>
      <div style={{display:"flex", flexDirection:"column", gap:12}}>
        {top.map((p,i)=>(
          <div key={p.id} style={{display:"flex", alignItems:"center", gap:12}}>
            <span className="mono" style={{fontSize:11, color:"var(--text-3)", width:18}}>0{i+1}</span>
            <div style={{width:42, height:52, borderRadius:8, overflow:"hidden", flexShrink:0}}>
              <ProductImage kind={p.img} colors={p.colors} radius={8}/>
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{p.name}</div>
              <div style={{fontSize:11.5, color:"var(--text-3)", marginTop:2}}>
                <Money value={p.price}/>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div className="mono" style={{fontSize:13, fontWeight:600}}>{(28-i*4)}</div>
              <div style={{fontSize:10.5, color:"var(--text-3)"}}>vendus</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
