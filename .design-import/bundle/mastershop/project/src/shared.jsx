// Shared building blocks
const Avatar = ({ name, initials, color, size = 36, online, ring }) => (
  <div style={{
    position:"relative", width:size, height:size, borderRadius:size,
    background:`linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 60%, #000))`,
    display:"grid", placeItems:"center", fontSize:Math.round(size*0.38), fontWeight:600, color:"#0b0612",
    flexShrink:0, boxShadow: ring ? `0 0 0 2px var(--bg-1), 0 0 0 4px var(--accent)` : "0 1px 2px rgba(0,0,0,0.4)",
    fontFamily:"Geist, sans-serif"
  }}>
    <span style={{textShadow:"0 1px 0 rgba(255,255,255,0.2)"}}>{initials || (name||"").split(" ").map(s=>s[0]).slice(0,2).join("")}</span>
    {online && <span style={{
      position:"absolute", right:-1, bottom:-1, width:Math.max(8,size*0.28), height:Math.max(8,size*0.28),
      borderRadius:99, background:"var(--success)", border:"2px solid var(--bg-1)"
    }}/>}
  </div>
);

const Money = ({ value, mono = true, currency = "FCFA" }) => (
  <span className={mono ? "mono" : ""} style={{whiteSpace:"nowrap"}}>
    {new Intl.NumberFormat('fr-FR').format(value)}
    <span style={{opacity:0.5, marginLeft:5, fontSize:"0.85em"}}>{currency}</span>
  </span>
);

// Channel pill — WhatsApp, Instagram, Messenger
const ChannelDot = ({ channel, size=14 }) => {
  const map = {
    whatsapp: { c:"#25D366", letter:"W" },
    instagram: { c:"#E1306C", letter:"I" },
    messenger: { c:"#0084FF", letter:"M" },
  };
  const cfg = map[channel] || map.whatsapp;
  return <span style={{
    display:"inline-grid", placeItems:"center", width:size, height:size, borderRadius:size,
    background:`linear-gradient(135deg, ${cfg.c}, color-mix(in oklab, ${cfg.c} 60%, #000))`,
    color:"#fff", fontSize:Math.round(size*0.55), fontWeight:700, fontFamily:"Geist, sans-serif",
    border:"2px solid var(--bg-1)"
  }}>{cfg.letter}</span>
};

// Procedural product image — colorful gradient panels with "fabric" SVG pattern
const ProductImage = ({ kind = "linen", colors = ["#a78bfa","#7c3aed"], size = "100%", radius = 12, tag, hover }) => {
  const c1 = colors[0] || "#a78bfa";
  const c2 = colors[1] || colors[0];
  const c3 = colors[2] || c2;
  const palette = { c1, c2, c3 };
  const id = React.useId();
  return (
    <div style={{
      width:size, aspectRatio:"4/5", borderRadius:radius, overflow:"hidden",
      position:"relative", background:`linear-gradient(140deg, ${c1}, ${c2} 60%, ${c3})`,
      transform: hover ? "translateY(-4px) scale(1.02)" : "none",
      transition:"transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s",
      boxShadow: hover ? "0 30px 60px -20px rgba(0,0,0,0.6)" : "0 8px 20px -8px rgba(0,0,0,0.35)"
    }}>
      <ProductPattern kind={kind} palette={palette} idPrefix={id}/>
      {tag && <div style={{
        position:"absolute", top:10, left:10, padding:"4px 9px", borderRadius:99,
        background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:10, fontWeight:600, letterSpacing:0.5, textTransform:"uppercase",
        backdropFilter:"blur(8px)"
      }}>{tag}</div>}
    </div>
  );
};

const ProductPattern = ({ kind, palette, idPrefix }) => {
  const { c1, c2, c3 } = palette;
  // subtle SVG patterns matched to product type
  switch(kind){
    case "leather":
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <defs><filter id={idPrefix+"n"}><feTurbulence baseFrequency="0.7" numOctaves="2" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0"/></filter></defs>
        <rect width="100" height="125" fill={c1}/>
        <rect width="100" height="125" filter={`url(#${idPrefix}n)`} opacity="0.6"/>
        <ellipse cx="50" cy="62" rx="30" ry="38" fill={c2} opacity="0.55"/>
        <path d="M50 24 L70 62 L50 100 L30 62 Z" fill={c3} opacity="0.4"/>
      </svg>;
    case "jewelry":
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <rect width="100" height="125" fill={c1}/>
        <circle cx="50" cy="62" r="22" fill="none" stroke={c2} strokeWidth="1.5" opacity="0.7"/>
        <circle cx="50" cy="62" r="14" fill={c3} opacity="0.5"/>
        <path d="M50 40 L52 56 L50 62 L48 56 Z" fill="#fff" opacity="0.7"/>
        <circle cx="38" cy="50" r="2" fill="#fff" opacity="0.5"/>
        <circle cx="64" cy="76" r="3" fill="#fff" opacity="0.4"/>
      </svg>;
    case "wax":
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <defs>
          <pattern id={idPrefix+"wx"} width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill={c1}/>
            <circle cx="10" cy="10" r="6" fill={c2} opacity="0.6"/>
            <circle cx="10" cy="10" r="2.5" fill={c3}/>
            <path d="M0 10 L10 0 L20 10 L10 20 Z" fill="none" stroke={c3} strokeWidth="0.5" opacity="0.4"/>
          </pattern>
        </defs>
        <rect width="100" height="125" fill={`url(#${idPrefix}wx)`}/>
      </svg>;
    case "bazin":
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <defs>
          <pattern id={idPrefix+"bz"} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill={c1}/>
            <path d="M0 0 L8 8 M0 8 L8 0" stroke={c2} strokeWidth="0.4" opacity="0.4"/>
          </pattern>
        </defs>
        <rect width="100" height="125" fill={`url(#${idPrefix}bz)`}/>
        <ellipse cx="50" cy="55" rx="28" ry="40" fill={c3} opacity="0.4"/>
      </svg>;
    case "sandal":
    case "raffia":
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <rect width="100" height="125" fill={c1}/>
        <defs><pattern id={idPrefix+"rf"} width="6" height="3" patternUnits="userSpaceOnUse">
          <rect width="6" height="3" fill={c2} opacity="0.5"/>
          <line x1="0" y1="1.5" x2="6" y2="1.5" stroke={c3} strokeWidth="0.5"/>
        </pattern></defs>
        <ellipse cx="50" cy="62" rx="28" ry="40" fill={`url(#${idPrefix}rf)`}/>
      </svg>;
    case "silk":
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <rect width="100" height="125" fill={c1}/>
        <path d="M0 30 Q50 50 100 35 L100 60 Q50 80 0 65 Z" fill={c2} opacity="0.55"/>
        <path d="M0 80 Q50 95 100 75 L100 125 L0 125 Z" fill={c3} opacity="0.45"/>
      </svg>;
    case "dress":
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <rect width="100" height="125" fill={c1}/>
        <path d="M40 25 L60 25 L75 100 L25 100 Z" fill={c2} opacity="0.85"/>
        <path d="M40 25 L60 25 L62 50 L38 50 Z" fill={c3} opacity="0.5"/>
        <line x1="50" y1="25" x2="50" y2="100" stroke="#fff" strokeWidth="0.4" opacity="0.4"/>
      </svg>;
    case "mudcloth":
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <rect width="100" height="125" fill={c2}/>
        <defs><pattern id={idPrefix+"mc"} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill={c2}/>
          <path d="M3 3 L11 3 M3 11 L11 11 M7 3 L7 11" stroke={c1} strokeWidth="0.8"/>
          <circle cx="7" cy="7" r="1" fill={c1}/>
        </pattern></defs>
        <rect width="100" height="125" fill={`url(#${idPrefix}mc)`} opacity="0.9"/>
      </svg>;
    case "teapot":
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <rect width="100" height="125" fill={c1}/>
        <ellipse cx="50" cy="70" rx="22" ry="20" fill={c2}/>
        <path d="M68 65 Q80 60 78 70" fill="none" stroke={c2} strokeWidth="4"/>
        <rect x="44" y="46" width="12" height="6" fill={c2}/>
        <ellipse cx="50" cy="46" rx="6" ry="2" fill={c3}/>
      </svg>;
    case "cap":
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <rect width="100" height="125" fill={c1}/>
        <path d="M30 70 Q50 40 70 70 Q72 78 70 80 L30 80 Q28 78 30 70 Z" fill={c2}/>
        <path d="M30 80 L80 80 L80 84 L30 84 Z" fill={c2}/>
        <circle cx="50" cy="65" r="4" fill={c3}/>
      </svg>;
    default: // linen
      return <svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" style={{width:"100%",height:"100%",position:"absolute",inset:0}}>
        <defs>
          <pattern id={idPrefix+"ln"} width="3" height="3" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="3" stroke={c2} strokeWidth="0.4" opacity="0.4"/>
          </pattern>
        </defs>
        <rect width="100" height="125" fill={c1}/>
        <rect width="100" height="125" fill={`url(#${idPrefix}ln)`}/>
        <path d="M30 18 Q50 15 70 18 L72 30 L80 100 L20 100 L28 30 Z" fill={c3} opacity="0.6"/>
      </svg>;
  }
};

// Shimmering loading placeholder
const Skeleton = ({ w="100%", h=14, r=6 }) => (
  <div style={{
    width:w, height:h, borderRadius:r,
    background:"linear-gradient(90deg, var(--bg-2) 0%, var(--bg-3) 50%, var(--bg-2) 100%)",
    backgroundSize:"200% 100%",
    animation:"shimmer 1.6s linear infinite"
  }}/>
);

window.Avatar = Avatar;
window.Money = Money;
window.ChannelDot = ChannelDot;
window.ProductImage = ProductImage;
window.Skeleton = Skeleton;
