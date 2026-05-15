// Produits — admin product management
const Produits = () => {
  const [view, setView] = React.useState("grid");
  const [search, setSearch] = React.useState("");
  const [cat, setCat] = React.useState("Toutes");
  const cats = ["Toutes", ...new Set(PRODUCTS.map(p=>p.category))];
  const list = PRODUCTS.filter(p => (cat==="Toutes" || p.category===cat) && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-anim" style={{padding:"22px 28px 40px", overflow:"auto", height:"100vh"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, gap:18, flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:12, color:"var(--text-3)", marginBottom:6}}>Catalogue · {PRODUCTS.length} produits</div>
          <h1 style={{fontSize:26, fontWeight:600, letterSpacing:-0.4}}>Produits</h1>
        </div>
        <div style={{display:"flex", gap:8}}>
          <button className="btn"><Icons.Notes size={14}/>Importer CSV</button>
          <button className="btn btn-primary"><Icons.Plus size={14}/>Nouveau produit</button>
        </div>
      </div>

      <div style={{display:"flex", gap:12, alignItems:"center", marginBottom:18, flexWrap:"wrap"}}>
        <div style={{position:"relative", flex:1, minWidth:240, maxWidth:400}}>
          <Icons.Search size={14} style={{position:"absolute", left:11, top:11, color:"var(--text-3)"}}/>
          <input className="input" placeholder="Rechercher un produit"
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{paddingLeft:34, fontSize:13}}/>
        </div>
        <div style={{display:"flex", gap:6, overflowX:"auto"}}>
          {cats.map(c => (
            <button key={c} onClick={()=>setCat(c)} style={{
              all:"unset", cursor:"pointer", padding:"7px 14px", borderRadius:99, fontSize:12.5,
              whiteSpace:"nowrap",
              background: cat===c ? "color-mix(in oklab, var(--accent) 18%, transparent)" : "var(--bg-1)",
              color: cat===c ? "var(--accent)" : "var(--text-2)",
              border: cat===c ? "1px solid color-mix(in oklab, var(--accent) 30%, transparent)" : "1px solid var(--line-2)",
            }}>{c}</button>
          ))}
        </div>
        <div style={{marginLeft:"auto", display:"flex", gap:4, padding:3, background:"var(--bg-2)", border:"1px solid var(--line-2)", borderRadius:10}}>
          <button onClick={()=>setView("grid")} className="btn-icon" style={{
            background: view==="grid" ? "var(--bg-3)" : "transparent",
            border:"none", borderRadius:7, color:view==="grid"?"var(--text)":"var(--text-3)", cursor:"pointer", padding:0
          }}><Icons.Tabler size={15}/></button>
          <button onClick={()=>setView("list")} className="btn-icon" style={{
            background: view==="list" ? "var(--bg-3)" : "transparent",
            border:"none", borderRadius:7, color:view==="list"?"var(--text)":"var(--text-3)", cursor:"pointer", padding:0
          }}><Icons.Layers size={15}/></button>
        </div>
      </div>

      {view==="grid" ? <ProductGrid products={list}/> : <ProductList products={list}/>}
    </div>
  );
};

const ProductGrid = ({ products }) => (
  <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))", gap:14}}>
    {products.map((p,i)=> <ProductGridCard key={p.id} p={p} idx={i}/>)}
  </div>
);

const ProductGridCard = ({ p, idx }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div className="card" style={{
      padding:10, animation:`fadein .35s ${idx*40}ms both`, cursor:"pointer",
      transition:"transform .25s, border-color .25s, box-shadow .25s",
      transform: hover ? "translateY(-3px)" : "none",
      borderColor: hover ? "var(--line-3)" : "var(--line)",
      boxShadow: hover ? "0 24px 50px -20px rgba(0,0,0,0.6)" : "var(--shadow-1)"
    }}
    onMouseEnter={()=>setHover(true)}
    onMouseLeave={()=>setHover(false)}
    >
      <div style={{position:"relative"}}>
        <ProductImage kind={p.img} colors={p.colors} radius={10} tag={p.tag}/>
        {p.status==="rupture" && <div style={{
          position:"absolute", inset:0, borderRadius:10, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(2px)",
          display:"grid", placeItems:"center"
        }}>
          <span className="chip chip-danger" style={{padding:"5px 12px"}}><Icons.X size={11}/>Rupture de stock</span>
        </div>}
      </div>
      <div style={{padding:"12px 6px 4px"}}>
        <div style={{fontSize:10.5, color:"var(--text-3)", marginBottom:4}}>{p.category}</div>
        <div style={{fontSize:13.5, fontWeight:600, marginBottom:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{p.name}</div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span style={{fontSize:13, fontWeight:600}}><Money value={p.price}/></span>
          <span style={{fontSize:11, color: p.stock<5 ? "var(--warn)" : "var(--text-3)"}} className="mono">{p.stock} en stock</span>
        </div>
      </div>
    </div>
  );
};

const ProductList = ({ products }) => (
  <div className="card" style={{padding:0, overflow:"hidden"}}>
    <div style={{
      display:"grid", gridTemplateColumns:"60px 1.6fr 1fr 100px 100px 100px 30px",
      padding:"12px 18px", borderBottom:"1px solid var(--line)",
      fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:0.6, fontWeight:500
    }}>
      <span/>
      <span>Produit</span>
      <span>Catégorie</span>
      <span>Prix</span>
      <span>Stock</span>
      <span>Statut</span>
      <span/>
    </div>
    {products.map((p,i)=>(
      <div key={p.id} style={{
        display:"grid", gridTemplateColumns:"60px 1.6fr 1fr 100px 100px 100px 30px",
        padding:"12px 18px", borderBottom:"1px solid var(--line)",
        alignItems:"center", cursor:"pointer", transition:"background .15s",
        animation:`fadein .3s ${i*25}ms both`
      }}
      onMouseEnter={e=>e.currentTarget.style.background="var(--bg-2)"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
      >
        <div style={{width:40, height:50, borderRadius:7, overflow:"hidden"}}>
          <ProductImage kind={p.img} colors={p.colors} radius={7}/>
        </div>
        <div>
          <div style={{fontSize:13, fontWeight:600}}>{p.name}</div>
          <div style={{display:"flex", gap:4, marginTop:5}}>
            {p.colors.slice(0,3).map((c,j) => <span key={j} style={{width:10, height:10, borderRadius:99, background:c, border:"1px solid var(--line-2)"}}/>)}
          </div>
        </div>
        <span style={{fontSize:12.5, color:"var(--text-2)"}}>{p.category}</span>
        <span style={{fontSize:13, fontWeight:600}}><Money value={p.price}/></span>
        <span className="mono" style={{fontSize:13, color: p.stock<5?"var(--warn)":"var(--text)"}}>{p.stock}</span>
        <span className={`chip ${p.status==="actif"?"chip-success":"chip-danger"}`}>
          <span className="dot"/>{p.status==="actif"?"Actif":"Rupture"}
        </span>
        <Icons.MoreV size={14} style={{color:"var(--text-3)"}}/>
      </div>
    ))}
  </div>
);

window.Produits = Produits;
