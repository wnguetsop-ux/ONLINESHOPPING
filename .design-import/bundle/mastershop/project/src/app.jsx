// Main app entry — view router + Tweaks panel
const App = () => {
  const [view, setView] = React.useState("dashboard");

  const [t, setTweak] = window.useTweaks({
    theme: "violet",
    density: "default",
  });

  React.useEffect(() => {
    document.body.dataset.theme = t.theme;
    document.body.dataset.density = t.density;
  }, [t]);

  React.useEffect(() => {
    const t = setTimeout(() => document.getElementById("loader")?.classList.add("hide"), 600);
    return () => clearTimeout(t);
  }, []);

  const renderView = () => {
    switch(view){
      case "dashboard": return <Dashboard/>;
      case "inbox": return <Inbox/>;
      case "commandes": return <Commandes/>;
      case "produits": return <Produits/>;
      case "clients": return <Clients/>;
      case "boutique": return <Boutique goAdmin={()=>setView("dashboard")}/>;
      default: return <Dashboard/>;
    }
  };

  // Boutique = full-bleed, no sidebar
  const tweaksUI = (
    <window.TweaksPanel title="Tweaks">
      <window.TweakSection label="Apparence"/>
      <window.TweakRadio label="Thème" value={t.theme}
        options={[{value:"violet",label:"Violet"},{value:"emerald",label:"Émeraude"},{value:"sunset",label:"Sunset"}]}
        onChange={v=>setTweak("theme", v)}/>
      <window.TweakRadio label="Densité" value={t.density}
        options={[{value:"compact",label:"Compact"},{value:"default",label:"Normal"},{value:"comfortable",label:"Large"}]}
        onChange={v=>setTweak("density", v)}/>
    </window.TweaksPanel>
  );

  if (view === "boutique") {
    return (
      <React.Fragment>
        {renderView()}
        {tweaksUI}
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Sidebar view={view} setView={setView}/>
      <main key={view} style={{flex:1, minWidth:0, height:"100vh", overflow:"hidden", position:"relative"}}>
        {renderView()}
      </main>
      {tweaksUI}
    </React.Fragment>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
