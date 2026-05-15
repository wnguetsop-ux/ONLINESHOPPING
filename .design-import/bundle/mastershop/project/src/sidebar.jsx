// Sidebar — animated active indicator that slides between items
const NAV = [
  { id:"dashboard", label:"Tableau de bord", icon:"Dashboard" },
  { id:"inbox", label:"Messagerie", icon:"Inbox", badge:8 },
  { id:"commandes", label:"Commandes", icon:"Orders", badge:3 },
  { id:"produits", label:"Produits", icon:"Products" },
  { id:"clients", label:"Clients", icon:"Customers" },
];
const NAV_BOTTOM = [
  { id:"boutique", label:"Voir la boutique", icon:"Storefront", external:true },
];

const Sidebar = ({ view, setView }) => {
  const refs = React.useRef({});
  const [indicator, setIndicator] = React.useState({ y: 0, h: 0, ready: false });

  React.useLayoutEffect(() => {
    const el = refs.current[view];
    if (el) {
      const parent = el.offsetParent;
      setIndicator({ y: el.offsetTop, h: el.offsetHeight, ready: true });
    }
  }, [view]);

  const NavItem = ({ item, active, onClick }) => {
    const Icon = Icons[item.icon];
    return (
      <button
        ref={el => refs.current[item.id] = el}
        onClick={onClick}
        style={{
          all:"unset", cursor:"pointer", position:"relative",
          display:"flex", alignItems:"center", gap:12,
          padding:"10px 14px", borderRadius:10,
          color: active ? "var(--text)" : "var(--text-2)",
          fontSize:13.5, fontWeight: active ? 600 : 500,
          transition:"color .2s ease",
        }}
        onMouseEnter={e=>{ if(!active) e.currentTarget.style.color="var(--text)"}}
        onMouseLeave={e=>{ if(!active) e.currentTarget.style.color="var(--text-2)"}}
      >
        <Icon size={17}/>
        <span>{item.label}</span>
        {item.badge && (
          <span style={{
            marginLeft:"auto", padding:"1px 7px", borderRadius:99, fontSize:10.5, fontWeight:600,
            background: active ? "color-mix(in oklab, var(--accent) 22%, transparent)" : "var(--bg-3)",
            color: active ? "var(--accent)" : "var(--text-2)",
            border:"1px solid var(--line-2)"
          }}>{item.badge}</span>
        )}
      </button>
    );
  };

  return (
    <aside style={{
      width:248, flexShrink:0, height:"100vh",
      background:"linear-gradient(180deg, var(--bg-1), var(--bg-0))",
      borderRight:"1px solid var(--line)",
      display:"flex", flexDirection:"column",
      padding:"18px 14px", gap:18, position:"relative", zIndex:2
    }}>
      {/* Brand */}
      <div style={{display:"flex", alignItems:"center", gap:10, padding:"6px 8px"}}>
        <Icons.Logo size={26}/>
        <div style={{display:"flex", flexDirection:"column", lineHeight:1.1}}>
          <span style={{fontSize:14, fontWeight:700, letterSpacing:-0.2}}>MasterShop</span>
          <span style={{fontSize:10.5, color:"var(--text-3)"}}>v 2.4 • Sénégal</span>
        </div>
      </div>

      {/* Shop selector */}
      <button style={{
        all:"unset", cursor:"pointer", display:"flex", alignItems:"center", gap:10,
        padding:"10px 12px", borderRadius:12, background:"var(--bg-2)",
        border:"1px solid var(--line-2)", transition:"background .15s, border-color .15s"
      }}
      onMouseEnter={e=>e.currentTarget.style.borderColor="var(--line-3)"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="var(--line-2)"}
      >
        <div style={{
          width:32, height:32, borderRadius:9,
          background:"linear-gradient(135deg, #fbbf24, #f97316, #dc2626)",
          display:"grid", placeItems:"center", color:"#0b0612", fontWeight:700, fontSize:13,
          flexShrink:0
        }}>SA</div>
        <div style={{display:"flex", flexDirection:"column", lineHeight:1.2, minWidth:0, flex:1}}>
          <span style={{fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
            {MERCHANT.shopName}
          </span>
          <span style={{fontSize:10.5, color:"var(--text-3)"}}>Boutique active</span>
        </div>
        <Icons.ChevronDown size={14}/>
      </button>

      {/* Nav */}
      <nav style={{position:"relative", display:"flex", flexDirection:"column", gap:2}}>
        {/* Sliding active indicator */}
        {indicator.ready && (
          <div style={{
            position:"absolute", left:0, right:0,
            top: indicator.y, height: indicator.h,
            borderRadius:10,
            background:"linear-gradient(90deg, color-mix(in oklab, var(--accent) 18%, transparent), color-mix(in oklab, var(--accent) 6%, transparent))",
            border:"1px solid color-mix(in oklab, var(--accent) 28%, transparent)",
            transition:"top .35s cubic-bezier(.2,.8,.2,1), height .35s cubic-bezier(.2,.8,.2,1)",
            pointerEvents:"none",
            boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)"
          }}>
            <span style={{
              position:"absolute", left:-1, top:8, bottom:8, width:2, borderRadius:2,
              background:"var(--accent)", boxShadow:"0 0 12px var(--accent)"
            }}/>
          </div>
        )}
        {NAV.map(item => (
          <NavItem key={item.id} item={item} active={view===item.id} onClick={()=>setView(item.id)}/>
        ))}
      </nav>

      <div style={{flex:1}}/>

      <div style={{padding:"0 6px"}}>
        <div style={{height:1, background:"var(--line)", margin:"4px 0 12px"}}/>
        {NAV_BOTTOM.map(item => {
          const Icon = Icons[item.icon];
          const active = view===item.id;
          return (
            <button key={item.id}
              onClick={()=>setView(item.id)}
              style={{
                all:"unset", cursor:"pointer", display:"flex", alignItems:"center", gap:12, width:"100%",
                padding:"10px 8px", borderRadius:10,
                color: active ? "var(--accent)" : "var(--text-2)",
                fontSize:13, fontWeight:500,
              }}
              onMouseEnter={e=>{ if(!active) e.currentTarget.style.color="var(--text)"}}
              onMouseLeave={e=>{ if(!active) e.currentTarget.style.color="var(--text-2)"}}
            >
              <Icon size={17}/><span>{item.label}</span>
              <Icons.ArrowRight size={13} style={{marginLeft:"auto", opacity:0.5}}/>
            </button>
          );
        })}
      </div>

      {/* User card */}
      <div style={{
        display:"flex", alignItems:"center", gap:10, padding:"10px 8px", borderRadius:12,
        border:"1px solid var(--line)"
      }}>
        <Avatar name={MERCHANT.ownerName} initials={MERCHANT.ownerInitials} color="#a78bfa" size={32}/>
        <div style={{display:"flex", flexDirection:"column", lineHeight:1.2, minWidth:0, flex:1}}>
          <span style={{fontSize:12.5, fontWeight:600}}>{MERCHANT.ownerName}</span>
          <span style={{fontSize:10.5, color:"var(--text-3)"}}>Propriétaire</span>
        </div>
        <button className="btn btn-ghost btn-icon" title="Réglages">
          <Icons.Settings size={15}/>
        </button>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
