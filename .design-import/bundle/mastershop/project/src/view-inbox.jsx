// Inbox — WhatsApp-style messagerie unifiée
const Inbox = () => {
  const [activeId, setActiveId] = React.useState("c1");
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const filtered = CONVERSATIONS.filter(c => {
    if (filter === "unread" && !c.unread) return false;
    if (filter === "whatsapp" && c.channel !== "whatsapp") return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const active = CONVERSATIONS.find(c => c.id === activeId);

  return (
    <div className="page-anim" style={{display:"grid", gridTemplateColumns:"340px 1fr 300px", height:"100vh", overflow:"hidden"}}>
      {/* List */}
      <div style={{borderRight:"1px solid var(--line)", display:"flex", flexDirection:"column", background:"var(--bg-1)"}}>
        <div style={{padding:"18px 18px 12px"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
            <h2 style={{fontSize:18, fontWeight:600}}>Messagerie</h2>
            <button className="btn btn-icon" title="Nouveau"><Icons.Edit size={14}/></button>
          </div>
          <div style={{position:"relative"}}>
            <Icons.Search size={14} style={{position:"absolute", left:11, top:11, color:"var(--text-3)"}}/>
            <input className="input" placeholder="Rechercher une conversation"
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{paddingLeft:34, fontSize:13}}/>
          </div>
          <div style={{display:"flex", gap:6, marginTop:12, overflowX:"auto"}}>
            {[
              {id:"all", label:"Toutes"},
              {id:"unread", label:"Non lues", count:8},
              {id:"whatsapp", label:"WhatsApp"},
              {id:"insta", label:"Instagram"},
            ].map(f => (
              <button key={f.id} onClick={()=>setFilter(f.id)} style={{
                all:"unset", cursor:"pointer", padding:"4px 10px", borderRadius:99, fontSize:11.5,
                fontWeight:500, whiteSpace:"nowrap",
                background: filter===f.id ? "color-mix(in oklab, var(--accent) 18%, transparent)" : "var(--bg-2)",
                color: filter===f.id ? "var(--accent)" : "var(--text-2)",
                border: filter===f.id ? "1px solid color-mix(in oklab, var(--accent) 30%, transparent)" : "1px solid var(--line-2)",
              }}>
                {f.label} {f.count && <span style={{opacity:0.7}}>· {f.count}</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{flex:1, overflowY:"auto", padding:"4px 8px 12px"}}>
          {filtered.map(c => (
            <ConversationItem key={c.id} c={c} active={c.id===activeId} onClick={()=>setActiveId(c.id)}/>
          ))}
        </div>
      </div>

      {/* Chat */}
      <ChatPane conversation={active}/>

      {/* Right info pane */}
      <CustomerPane conversation={active}/>
    </div>
  );
};

const ConversationItem = ({ c, active, onClick }) => (
  <button onClick={onClick} style={{
    all:"unset", cursor:"pointer", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:11,
    padding:"10px 10px", borderRadius:10, width:"100%", boxSizing:"border-box",
    background: active ? "var(--bg-2)" : "transparent",
    border: active ? "1px solid var(--line-2)" : "1px solid transparent",
    transition:"background .15s",
    marginBottom:2
  }}
  onMouseEnter={e=>{if(!active) e.currentTarget.style.background="var(--bg-2)"}}
  onMouseLeave={e=>{if(!active) e.currentTarget.style.background="transparent"}}
  >
    <div style={{position:"relative"}}>
      <Avatar name={c.name} initials={c.initials} color={c.avatar} size={40} online={c.online}/>
      <div style={{position:"absolute", left:-4, bottom:-2}}><ChannelDot channel={c.channel} size={14}/></div>
    </div>
    <div style={{minWidth:0}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:8}}>
        <span style={{fontSize:13.5, fontWeight: c.unread ? 600 : 500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{c.name}</span>
        <span style={{fontSize:10.5, color:"var(--text-3)", flexShrink:0}}>{c.time}</span>
      </div>
      <div style={{
        fontSize:12, color: c.unread ? "var(--text)" : "var(--text-3)",
        marginTop:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        display:"flex", alignItems:"center", gap:6
      }}>
        {c.typing ? (
          <span style={{color:"var(--accent)", display:"inline-flex", alignItems:"center", gap:3}}>
            <span style={{display:"inline-flex", gap:2}}>
              <span style={{width:4,height:4,borderRadius:99,background:"currentColor",animation:"typing 1s infinite"}}/>
              <span style={{width:4,height:4,borderRadius:99,background:"currentColor",animation:"typing 1s 0.15s infinite"}}/>
              <span style={{width:4,height:4,borderRadius:99,background:"currentColor",animation:"typing 1s 0.3s infinite"}}/>
            </span>
            écrit…
          </span>
        ) : c.last}
      </div>
    </div>
    <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", justifyContent:"center", gap:4, alignSelf:"center"}}>
      {c.unread > 0 ? (
        <span style={{
          minWidth:18, height:18, padding:"0 5px", borderRadius:99,
          background:"var(--accent)", color:"#0b0612", fontSize:10.5, fontWeight:700,
          display:"grid", placeItems:"center"
        }}>{c.unread}</span>
      ) : <Icons.CheckCheck size={13} style={{color:"var(--text-3)"}}/>}
    </div>
  </button>
);

const ChatPane = ({ conversation }) => {
  const c = conversation;
  const msgs = MESSAGES[c.id] || [
    { from:"them", text:c.last, time:"10:42", date:"Aujourd'hui" }
  ];
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef();

  React.useEffect(()=>{
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [c.id]);

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:"var(--bg-0)"}}>
      {/* Header */}
      <div style={{
        padding:"14px 22px", borderBottom:"1px solid var(--line)",
        display:"flex", alignItems:"center", gap:14
      }}>
        <Avatar name={c.name} initials={c.initials} color={c.avatar} size={42} online={c.online}/>
        <div style={{flex:1}}>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <span style={{fontSize:14, fontWeight:600}}>{c.name}</span>
            <ChannelDot channel={c.channel} size={13}/>
          </div>
          <div style={{fontSize:11.5, color: c.online?"var(--success)":"var(--text-3)", marginTop:2}}>
            {c.online ? "En ligne" : "Vu il y a 1 h"} · {c.phone}
          </div>
        </div>
        <button className="btn btn-icon" title="Appel"><Icons.Phone size={15}/></button>
        <button className="btn btn-icon" title="Vidéo"><Icons.Video size={15}/></button>
        <button className="btn btn-icon" title="Plus"><Icons.MoreV size={15}/></button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex:1, overflowY:"auto", padding:"24px 22px",
        background:`
          radial-gradient(800px 400px at 30% 10%, color-mix(in oklab, var(--accent) 5%, transparent), transparent 60%),
          radial-gradient(600px 300px at 80% 80%, color-mix(in oklab, var(--accent-3) 4%, transparent), transparent 60%),
          var(--bg-0)
        `
      }}>
        {msgs.map((m, i) => <Message key={i} m={m} idx={i}/>)}
        <TypingBubble visible={c.typing}/>
      </div>

      {/* Composer */}
      <div style={{padding:"14px 22px", borderTop:"1px solid var(--line)", background:"var(--bg-1)"}}>
        <QuickReplies/>
        <div style={{
          display:"flex", alignItems:"center", gap:8,
          background:"var(--bg-2)", border:"1px solid var(--line-2)", borderRadius:14, padding:"6px 6px 6px 14px"
        }}>
          <button className="btn btn-ghost btn-icon"><Icons.Paperclip size={16}/></button>
          <input
            value={input} onChange={e=>setInput(e.target.value)}
            placeholder="Tapez un message…"
            style={{
              flex:1, background:"transparent", border:"none", outline:"none", color:"var(--text)",
              fontSize:13.5, fontFamily:"Geist, sans-serif", padding:"8px 0"
            }}/>
          <button className="btn btn-ghost btn-icon"><Icons.Smile size={16}/></button>
          <button className="btn btn-ghost btn-icon"><Icons.Mic size={16}/></button>
          <button className="btn btn-primary btn-icon" style={{width:36, height:36}}>
            <Icons.Send size={15}/>
          </button>
        </div>
      </div>
    </div>
  );
};

const QuickReplies = () => {
  const replies = ["Bonjour 👋", "Disponible en stock ✓", "Livraison Dakar offerte", "Voir le catalogue"];
  return (
    <div style={{display:"flex", gap:6, marginBottom:10, flexWrap:"wrap"}}>
      <span className="chip chip-accent" style={{fontSize:10.5}}>
        <Icons.Sparkle size={10}/> Suggestions IA
      </span>
      {replies.map((r,i)=>(
        <button key={i} className="chip" style={{cursor:"pointer", fontSize:11}}>
          {r}
        </button>
      ))}
    </div>
  );
};

const Message = ({ m, idx }) => {
  const mine = m.from === "me";
  return (
    <div style={{display:"flex", flexDirection:"column", marginBottom:14, animation:`fadein-msg .35s ${idx*40}ms cubic-bezier(.2,.8,.2,1) both`}}>
      {m.date && idx === 0 && (
        <div style={{textAlign:"center", margin:"4px 0 18px"}}>
          <span style={{
            fontSize:10.5, color:"var(--text-3)", padding:"3px 10px", borderRadius:99,
            background:"var(--bg-2)", border:"1px solid var(--line-2)"
          }}>{m.date}</span>
        </div>
      )}
      <div style={{display:"flex", justifyContent: mine ? "flex-end" : "flex-start"}}>
        <div style={{maxWidth:"68%"}}>
          {m.type === "image" ? (
            <div style={{
              borderRadius:14, overflow:"hidden", width:200,
              border:"1px solid var(--line-2)"
            }}>
              <ProductImage kind="linen" colors={["#a78bfa","#7c3aed","#1e1b4b"]} radius={14}/>
            </div>
          ) : (
            <div style={{
              padding:"10px 14px", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: mine
                ? "linear-gradient(135deg, color-mix(in oklab, var(--accent) 40%, transparent), color-mix(in oklab, var(--accent-2) 30%, transparent))"
                : "var(--bg-2)",
              border: mine ? "1px solid color-mix(in oklab, var(--accent) 35%, transparent)" : "1px solid var(--line-2)",
              fontSize:13.5, lineHeight:1.45, color:"var(--text)",
              boxShadow: mine ? "0 4px 18px -8px var(--accent-glow)" : "none"
            }}>
              {m.text}
            </div>
          )}
          <div style={{
            fontSize:10, color:"var(--text-3)", marginTop:4, display:"flex", gap:4, alignItems:"center",
            justifyContent: mine ? "flex-end" : "flex-start"
          }}>
            {m.time}
            {mine && (m.read ? <Icons.CheckCheck size={11} style={{color:"var(--info)"}}/> : <Icons.Check size={11}/>)}
          </div>
        </div>
      </div>
    </div>
  );
};

const TypingBubble = ({ visible }) => {
  if (!visible) return null;
  return (
    <div style={{display:"flex", justifyContent:"flex-start", marginTop:8}}>
      <div style={{
        padding:"10px 14px", borderRadius:"16px 16px 16px 4px",
        background:"var(--bg-2)", border:"1px solid var(--line-2)",
        display:"flex", gap:4
      }}>
        <span style={{width:6,height:6,borderRadius:99,background:"var(--text-3)",animation:"typing 1s infinite"}}/>
        <span style={{width:6,height:6,borderRadius:99,background:"var(--text-3)",animation:"typing 1s 0.15s infinite"}}/>
        <span style={{width:6,height:6,borderRadius:99,background:"var(--text-3)",animation:"typing 1s 0.3s infinite"}}/>
      </div>
    </div>
  );
};

const CustomerPane = ({ conversation }) => {
  const c = conversation;
  const customer = CUSTOMERS.find(u => u.name === c.name) || CUSTOMERS[0];
  return (
    <div style={{borderLeft:"1px solid var(--line)", padding:"22px 20px", overflowY:"auto", height:"100vh", background:"var(--bg-1)"}}>
      <div style={{display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", paddingBottom:18, borderBottom:"1px solid var(--line)"}}>
        <Avatar name={c.name} initials={c.initials} color={c.avatar} size={64} ring/>
        <div style={{fontSize:15, fontWeight:600, marginTop:12}}>{c.name}</div>
        <div style={{fontSize:11.5, color:"var(--text-3)", marginTop:2}}>{c.phone}</div>
        <span className="chip chip-accent" style={{marginTop:10}}>
          <Icons.Star size={10}/> Cliente {customer.tier}
        </span>
      </div>

      <div style={{padding:"18px 0 14px", borderBottom:"1px solid var(--line)"}}>
        <div style={{fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10}}>Statistiques</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
          <div style={{padding:"10px 12px", background:"var(--bg-2)", borderRadius:10, border:"1px solid var(--line)"}}>
            <div className="mono" style={{fontSize:18, fontWeight:600}}>{customer.orders}</div>
            <div style={{fontSize:10.5, color:"var(--text-3)", marginTop:2}}>commandes</div>
          </div>
          <div style={{padding:"10px 12px", background:"var(--bg-2)", borderRadius:10, border:"1px solid var(--line)"}}>
            <div style={{fontSize:14, fontWeight:600}} className="mono"><Money value={customer.spent}/></div>
            <div style={{fontSize:10.5, color:"var(--text-3)", marginTop:2}}>dépensés</div>
          </div>
        </div>
      </div>

      <div style={{padding:"18px 0 14px", borderBottom:"1px solid var(--line)"}}>
        <div style={{fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10}}>Dernières commandes</div>
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          {ORDERS.filter(o=>o.customer===c.name).slice(0,3).map(o=>(
            <div key={o.id} style={{
              display:"flex", alignItems:"center", gap:10, padding:"8px 10px",
              borderRadius:8, background:"var(--bg-2)", border:"1px solid var(--line)"
            }}>
              <span className={`chip ${STATUS_LABEL[o.status].chip}`} style={{padding:"2px 6px", fontSize:10}}>
                <span className="dot"/>
              </span>
              <div style={{flex:1, minWidth:0}}>
                <div className="mono" style={{fontSize:11.5, color:"var(--text-3)"}}>{o.id}</div>
                <div style={{fontSize:11.5, fontWeight:600, marginTop:2}}><Money value={o.total}/></div>
              </div>
              <span style={{fontSize:10.5, color:"var(--text-3)"}}>{o.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"18px 0"}}>
        <div style={{fontSize:11, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10}}>Actions rapides</div>
        <div style={{display:"flex", flexDirection:"column", gap:6}}>
          <button className="btn" style={{justifyContent:"flex-start"}}>
            <Icons.Cart size={14}/> Créer une commande
          </button>
          <button className="btn" style={{justifyContent:"flex-start"}}>
            <Icons.Tag size={14}/> Envoyer un coupon
          </button>
          <button className="btn" style={{justifyContent:"flex-start"}}>
            <Icons.Notes size={14}/> Ajouter une note
          </button>
        </div>
      </div>
    </div>
  );
};

window.Inbox = Inbox;
