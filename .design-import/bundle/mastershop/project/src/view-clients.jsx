// Clients — customer list with tier filter
const Clients = () => {
  const [tier, setTier] = React.useState("Tous");
  const [search, setSearch] = React.useState("");
  const tiers = ["Tous","VIP","Régulier","Nouveau"];
  const list = CUSTOMERS.filter(c => (tier==="Tous" || c.tier===tier) && c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-anim" style={{padding:"22px 28px 40px", overflow:"auto", height:"100vh"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, gap:18, flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:12, color:"var(--text-3)", marginBottom:6}}>Base de données · {CUSTOMERS.length} clients</div>
          <h1 style={{fontSize:26, fontWeight:600, letterSpacing:-0.4}}>Clients</h1>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button className="btn"><Icons.Send size={14}/>Campagne SMS</button>
          <button className="btn btn-primary"><Icons.Plus size={14}/>Nouveau client</button>
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14, marginBottom:18}}>
        <StatCard icon="Customers" label="Clients actifs" value="248" accent="var(--accent)"/>
        <StatCard icon="Star" label="VIP" value="32" accent="#fbbf24"/>
        <StatCard icon="TrendUp" label="Récurrents" value="68%" accent="#34d399"/>
        <StatCard icon="Wallet" label="Panier moyen" value="20 035" accent="#60a5fa" small/>
      </div>

      <div style={{display:"flex", gap:12, marginBottom:18, flexWrap:"wrap"}}>
        <div style={{position:"relative", flex:1, minWidth:240, maxWidth:400}}>
          <Icons.Search size={14} style={{position:"absolute", left:11, top:11, color:"var(--text-3)"}}/>
          <input className="input" placeholder="Rechercher par nom, téléphone…"
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{paddingLeft:34, fontSize:13}}/>
        </div>
        <div style={{display:"flex", gap:6}}>
          {tiers.map(t => (
            <button key={t} onClick={()=>setTier(t)} style={{
              all:"unset", cursor:"pointer", padding:"7px 14px", borderRadius:99, fontSize:12.5,
              whiteSpace:"nowrap",
              background: tier===t ? "color-mix(in oklab, var(--accent) 18%, transparent)" : "var(--bg-1)",
              color: tier===t ? "var(--accent)" : "var(--text-2)",
              border: tier===t ? "1px solid color-mix(in oklab, var(--accent) 30%, transparent)" : "1px solid var(--line-2)",
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:14}}>
        {list.map((c, i) => (
          <div key={c.id} className="card" style={{
            padding:18, animation:`fadein .35s ${i*30}ms both`, cursor:"pointer",
            transition:"transform .2s, border-color .2s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.borderColor="var(--line-3)"}}
          onMouseLeave={e=>{e.currentTarget.style.transform="none"; e.currentTarget.style.borderColor="var(--line)"}}
          >
            <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:14}}>
              <Avatar name={c.name} initials={c.initials} color={c.color} size={44}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:14, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{c.name}</div>
                <div style={{fontSize:11.5, color:"var(--text-3)", marginTop:2}}>{c.phone}</div>
              </div>
              <span className={`chip ${c.tier==="VIP"?"chip-warn":c.tier==="Nouveau"?"chip-info":"chip-accent"}`}>
                {c.tier}
              </span>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, background:"var(--line)", borderRadius:10, overflow:"hidden", border:"1px solid var(--line)"}}>
              <div style={{padding:"10px 12px", background:"var(--bg-2)"}}>
                <div className="mono" style={{fontSize:14, fontWeight:600}}>{c.orders}</div>
                <div style={{fontSize:10, color:"var(--text-3)", marginTop:2}}>cmd</div>
              </div>
              <div style={{padding:"10px 12px", background:"var(--bg-2)"}}>
                <div style={{fontSize:13, fontWeight:600, whiteSpace:"nowrap"}} className="mono">{(c.spent/1000).toFixed(0)}k</div>
                <div style={{fontSize:10, color:"var(--text-3)", marginTop:2}}>FCFA</div>
              </div>
              <div style={{padding:"10px 12px", background:"var(--bg-2)"}}>
                <div style={{fontSize:11, color:"var(--text)", whiteSpace:"nowrap"}}>{c.lastOrder}</div>
                <div style={{fontSize:10, color:"var(--text-3)", marginTop:2}}>dernière</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.Clients = Clients;
