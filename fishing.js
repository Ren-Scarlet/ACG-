(() => {
  "use strict";
  const boot = () => {
  const client = window.acgSupabaseClient;
  if (!client || window.acgFishingInitialized) return;
  window.acgFishingInitialized = true;

  const root = document.getElementById("fishing-view");
  if (!root) { window.addEventListener("DOMContentLoaded", () => { if (!window.acgFishingInitialized) boot(); }, { once: true }); return; }
  const $ = (id) => root.querySelector("#" + id);
  const state = { dashboard:null, world:null, globalRecords:[], currentLocation:"qinglan_lake", baits:[], fish:[], berries:[], specialMaterials:[], shopCards:[], shopItems:[], currentSession:null, raf:0, phase:"idle" };
  const el = (tag, cls, text) => {
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!==undefined)n.textContent=text;
    return n;
  };
  const status=(message,bad=false)=>{ const node=$("fish-status"); if(node){node.textContent=message;node.className="status"+(bad?" bad":" good");} };
  const uuid=()=>crypto.randomUUID();
  const rpc=async(name,args)=>{
    const {data,error}=await client.rpc(name,args);
    if(error)throw error;
    return data;
  };
  const panel=(title,desc)=>{
    const box=el("section","panel");
    box.append(el("h3","",title));
    if(desc)box.append(el("p","hint",desc));
    return box;
  };
  function setSubpage(page){
    root.querySelectorAll("[data-fishing-page]").forEach(b=>b.classList.toggle("active",b.dataset.fishingPage===page));
    root.querySelectorAll(".fish-page").forEach(p=>p.classList.toggle("hidden",p.id!=="fish-page-"+page));
    if(page==="overview")renderOverview();
    if(page==="craft")renderCraft();
    if(page==="book")renderFishbook();
    if(page==="shop")renderShop();
    if(page==="leaderboard")renderLeaderboard();
    if(page==="achievements")renderAchievements();
  }
  async function loadDashboard(){
    const d=await rpc("fishing_get_dashboard",{});
    state.dashboard=d;
    state.world=await rpc("fishing_get_world_state_v2",{});
    state.globalRecords=await rpc("fishing_get_records_v2",{});
    const {data:userData,error:userError}=await client.auth.getUser();
    if(userError)throw userError;
    if(!userData?.user)throw new Error("无法确认当前登录账号");
    const [baitRes,fishRes,berryRes]=await Promise.all([
      client.from("fishing_bait_catalog").select("*").eq("is_active",true).order("sort_order"),
      client.from("fishing_fish_catalog").select("*").eq("v2_available",true).order("sort_order"),
      client.from("card_inventory").select("card_id,quantity").eq("user_id",userData.user.id).gt("quantity",0)
    ]);
    if(baitRes.error)throw baitRes.error;
    if(fishRes.error)throw fishRes.error;
    if(berryRes.error)throw berryRes.error;
    state.baits=baitRes.data||[];
    state.fish=fishRes.data||[];
    const [cardsRes]=await Promise.all([fetch("./data/cards.json",{cache:"no-store"})]);
    const cards=cardsRes.ok?await cardsRes.json():[];
    const names=Object.fromEntries(cards.map(c=>[c.id,c.name]));
    state.shopCards=[];state.shopItems=[];
    if(d.is_admin){
      const [drawRes,itemRes]=await Promise.all([
        rpc("fishing_admin_list_shop_cards",{}).then(data=>({data,error:null})).catch(error=>({data:[],error})),
        client.from("item_catalog").select("item_id,name").eq("is_active",true).order("name")
      ]);
      if(!drawRes.error)state.shopCards=(drawRes.data||[]).map(x=>({card_id:x.card_id,card_name:names[x.card_id]||x.card_id}));
      if(!itemRes.error)state.shopItems=itemRes.data||[];
    }
    state.berries=(berryRes.data||[]).filter(r=>cards.some(c=>c.id===r.card_id&&c.pack_id==="pack_010"))
      .map(r=>({id:r.card_id,name:names[r.card_id]||r.card_id,quantity:r.quantity}));
    const rareMaterials=[["fishing_ancient_scale","古代鱼鳞"],["fishing_moon_pearl","月光珍珠"],["fishing_storm_core","风暴核心"]];
    state.specialMaterials=rareMaterials.map(([id,name])=>({id,name,quantity:Number((berryRes.data||[]).find(r=>r.card_id===id)?.quantity||0)}));
    renderHeader();
  }
  function renderHeader(){
    const s=state.dashboard.stats||{};
    $("fish-points").textContent=Number(s.points||0).toLocaleString("zh-CN");
    $("fish-catches").textContent=Number(s.total_catches||0).toLocaleString("zh-CN");
    $("fish-species").textContent=Number(s.distinct_fish||0)+"/"+Number(state.world?.species_total||state.fish.length||36);
  }
  function createWaterScene(mode="waiting"){
    const scene=el("div","fish-water-stage "+mode);
    scene.setAttribute("aria-label","湖面钓鱼场景");
    const sky=el("div","fish-stage-sky");
    const sun=el("div","fish-stage-sun");
    const hills=el("div","fish-stage-hills");
    const far=el("div","fish-stage-hill far"),near=el("div","fish-stage-hill near");
    hills.append(far,near);
    const shore=el("div","fish-stage-shore");
    const water=el("div","fish-stage-water");
    for(let i=0;i<4;i++)water.append(el("i","fish-stage-ripple ripple-"+i));
    const line=el("div","fish-stage-line");
    const float=el("div","fish-stage-float");
    const bob=el("span","fish-stage-bob");
    const floatTop=el("span","fish-stage-float-top");
    float.append(floatTop,bob);
    const dock=el("div","fish-stage-dock");
    for(let i=0;i<6;i++)dock.append(el("i",""));
    const caption=el("div","fish-stage-caption",mode==="reeling"?"湖面泛起阵阵涟漪……":"鱼漂轻轻浮在水面上");
    scene.append(sky,sun,hills,shore,water,line,float,dock,caption);
    return scene;
  }
  function syncFishingScene(){
    const scene=root.querySelector(".fish-world-scene");
    if(!scene)return;
    const locations=state.world?.locations||[];
    const selected=locations.find(x=>x.location_id===state.currentLocation)||locations[0];
    if(!selected)return;
    const index=Math.max(0,locations.findIndex(x=>x.location_id===selected.location_id));
    scene.dataset.sceneIndex=String(index);
    const title=$("fish-scene-title"),description=$("fish-scene-description"),weatherTag=$("fish-scene-weather");
    if(title)title.textContent=selected.location_name||"钓场";
    if(description)description.textContent=selected.description||"一处等待探索的垂钓胜地。";
    const weatherNames={sunny:"晴天",cloudy:"阴天",rain:"雨天",fog:"浓雾",storm:"雷雨",windy:"大风"};
    if(weatherTag)weatherTag.textContent=(weatherNames[state.world?.weather_id]||"天气未知")+" · 今日垂钓";
    let nav=scene.querySelector(".fish-scene-locations");
    if(!nav){nav=el("nav","fish-scene-locations");nav.setAttribute("aria-label","切换钓点");scene.append(nav);}
    nav.replaceChildren();
    locations.forEach((location,i)=>{
      const button=el("button","fish-scene-location",((location.icon||"✦")+" "+location.location_name));
      button.type="button";button.setAttribute("aria-pressed",String(location.location_id===selected.location_id));
      button.addEventListener("click",()=>{
        if(state.phase!=="idle"){status("本轮垂钓结束后才能更换钓点。",true);return;}
        state.currentLocation=location.location_id;
        syncFishingScene();
        renderOverview();
      });
      nav.append(button);
    });
  }
  function renderOverview(){
    const host=$("fish-overview");host.replaceChildren();
    const shell=el("section","fish-game-panel"),head=el("header","fish-page-heading");
    head.append(el("p","fish-kicker","ANGLER'S FIELD GUIDE"),el("h2","","今日的湖面，正等待新的相遇"),el("p","","观察天气、选择钓点与鱼饵。鱼种、尺寸和收藏奖励均由服务器结算。"));
    const weatherNames={sunny:"晴天",cloudy:"阴天",rain:"雨天",fog:"浓雾",storm:"雷雨",windy:"大风"};
    const weather=state.world||{};
    const weatherPanel=el("section","fish-game-stat");weatherPanel.style.cssText="grid-column:1/-1;padding:16px;text-align:left";
    const weatherTop=el("div","");weatherTop.style.cssText="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap";
    weatherTop.append(el("strong","","当前天气　"+({sunny:"☀️",cloudy:"☁️",rain:"🌧️",fog:"🌫️",storm:"⛈️",windy:"🌬️"}[weather.weather_id]||"🌤️")+" "+(weatherNames[weather.weather_id]||"未知")));
    const next=weather.forecast?.find(x=>!x.is_current);
    weatherTop.append(el("span","hint",next?"下一时段："+(weatherNames[next.weather_id]||next.weather_id):"天气预报更新中"));
    const forecast=el("div","hint");forecast.style.marginTop="8px";
    forecast.textContent="未来天气："+(weather.forecast||[]).map(x=>(x.is_current?"现在 ":"")+ (weatherNames[x.weather_id]||x.weather_id)).join("　→　");
    const weatherNote=el("p","hint","天气会改变部分鱼类的出现机会与尺寸分布，前序天气也可能开启隐藏鱼的鱼讯。");weatherNote.style.margin="8px 0 0";
    weatherPanel.append(weatherTop,forecast,weatherNote);
    syncFishingScene();
    const stats=el("div","fish-game-stats");
    [["钓鱼积分",$("fish-points").textContent],["累计钓获",$("fish-catches").textContent],["已发现鱼种",$("fish-species").textContent]].forEach(([k,v])=>{const c=el("article","fish-game-stat");c.append(el("span","",k),el("strong","",v));stats.append(c);});
    const title=el("div","fish-subtitle-row");title.append(el("h3","","选择你的鱼饵"),el("small","","SELECT BAIT"));
    const grid=el("div","fish-game-grid");
    state.baits.forEach((b,i)=>{const qty=(state.dashboard.baits||[]).find(x=>x.bait_id===b.bait_id)?.quantity||0,c=el("article","fish-bait-tile"),art=el("div","fish-bait-tile-art");art.append(el("span","","✦  BAIT 0"+(i+1)),el("b","",b.icon||"🪱"));const body=el("div","fish-bait-tile-body");body.append(el("h4","",b.bait_name),el("p","",b.description),el("strong","","持有 ×"+qty));const btn=el("button","fish-ui-button",qty?"抛竿垂钓":"前往工坊");btn.type="button";btn.disabled=!b.is_active||(qty<1&&!b.craftable);btn.addEventListener("click",()=>qty?startCast(b.bait_id):setSubpage("craft"));c.append(art,body,btn);grid.append(c);});
    stats.append(weatherPanel);
    shell.append(head,stats,title,grid);host.append(shell);
  }
  function renderCraft(){
    const host=$("fish-craft");host.replaceChildren();
    const shell=el("section","fish-game-panel"),head=el("header","fish-page-heading");
    head.append(el("p","fish-kicker","BERRY WORKSHOP · CRAFTING"),el("h2","","鱼饵工坊"),el("p","","收集树果，调配适合不同鱼种的鱼饵。制作成功后会从仓库扣除材料。"));
    const inv=el("div","fish-berry-stock");inv.append(el("strong","","树果库存"),el("span","",state.berries.length+" 种可用"));state.berries.forEach(b=>inv.append(el("small","","🌳 "+b.name+" ×"+b.quantity)));
    const grid=el("div","fish-game-grid");
    state.baits.forEach((b,i)=>{const c=el("article","fish-recipe-card"),art=el("div","fish-recipe-art");art.append(el("small","","RECIPE 0"+(i+1)),el("b","",b.icon||"🪱"));const body=el("div","fish-recipe-body");body.append(el("h3","",b.bait_name),el("p","",b.description));if(!b.craftable)body.append(el("div","fish-locked-note","配方尚未开放"));else{const selects=[];for(let n=0;n<b.ingredient_count;n++){const label=el("label","fish-field","树果 "+(n+1)),sel=el("select");sel.append(new Option("选择树果",""));state.berries.forEach(x=>sel.append(new Option(x.name+"（×"+x.quantity+"）",x.id)));label.append(sel);body.append(label);selects.push(sel);}const btn=el("button","fish-ui-button","制作鱼饵");btn.type="button";btn.disabled=state.berries.length<b.ingredient_count;btn.addEventListener("click",async()=>{const ids=selects.map(x=>x.value);if(ids.some(x=>!x)){status("请先选择完整的树果配方。",true);return;}if(new Set(ids).size!==b.distinct_ingredients){status("所选树果种类不符合配方要求。",true);return;}btn.disabled=true;try{await rpc("fishing_craft_bait",{p_bait_id:b.bait_id,p_berry_ids:ids,p_request_id:uuid()});status("制作完成，获得 1 个"+b.bait_name+"。");await loadDashboard();renderCraft();renderOverview();}catch(e){status("制作失败："+e.message,true);btn.disabled=false;}});body.append(btn);}c.append(art,body);grid.append(c);});
    const special=panel("特殊鱼饵配方","使用三种稀有材料制作成分不明的混合饵；也可通过隐藏鱼成就或活动获得。");
    const materialLine=el("div","fish-berry-stock");state.specialMaterials.forEach(m=>materialLine.append(el("small","",m.name+" ×"+m.quantity)));
    const specialBtn=el("button","fish-ui-button","制作 1 个特殊鱼饵");specialBtn.type="button";
    specialBtn.disabled=state.specialMaterials.some(m=>m.quantity<1);
    specialBtn.addEventListener("click",async()=>{specialBtn.disabled=true;try{await rpc("fishing_craft_special_bait",{p_request_id:uuid()});status("特殊鱼饵制作完成。");await loadDashboard();renderCraft();renderOverview();}catch(e){status("特殊鱼饵制作失败："+e.message,true);specialBtn.disabled=false;}});
    special.append(materialLine,specialBtn);
    shell.append(head,inv,grid,special);host.append(shell);
  }
  async function startCast(baitId){
    if(state.phase!=="idle"){status("当前还有一轮钓鱼没有结束。",true);return;}
    state.phase="waiting";renderOverview();
    try{
      const result=await rpc("fishing_start_cast_v2",{p_bait_id:baitId,p_request_id:uuid(),p_location_id:state.currentLocation});
      state.world=result.weather||state.world;renderHeader();
      state.currentSession=result.session_id;
      const box=$("fish-action");box.classList.remove("hidden");box.replaceChildren();
      const scene=createWaterScene("waiting");
      box.append(el("h3","","鱼线已经抛出"),el("p","hint","湖面很平静……留意水面上的鱼漂。"),scene);
      if(result.fish_hint)box.append(el("p","hint",result.fish_hint));
      const wait=Math.max(1000,Math.min(10000,Number(result.bite_after_ms)||3000));
      window.setTimeout(()=>{
        if(state.phase!=="waiting")return;
        scene.classList.remove("waiting");scene.classList.add("bite");
        const caption=scene.querySelector(".fish-stage-caption");
        if(caption)caption.textContent="咬钩了！鱼漂沉下去了！";
        const title=el("h3","","！鱼咬钩了！");
        const hint=el("p","hint","鱼漂下沉，抓紧时机提竿！");
        const btn=el("button","primary","提竿！");btn.type="button";
        btn.addEventListener("click",beginReel);
        box.replaceChildren(title,hint,scene,btn);
      },wait);
      status("抛竿成功，已消耗 1 个鱼饵。");
      await loadDashboard();
    }catch(e){state.phase="idle";state.currentSession=null;status("抛竿失败："+e.message,true);await loadDashboard();}
  }
  async function beginReel(){
    if(state.phase!=="waiting")return;
    state.phase="hooking";
    const box=$("fish-action");
    box.replaceChildren(el("p","hint","正在确认提竿时机……"));
    try{
      const hookRequestStarted=performance.now();
      const result=await rpc("fishing_hook_cast_v2",{p_session_id:state.currentSession});
      const hookRoundTripMs=performance.now()-hookRequestStarted;
      if(result.status==="escaped"){
        state.phase="idle";state.currentSession=null;
        box.replaceChildren(el("h3","","鱼逃走了"),el("p","hint","提竿太晚，这次没有收获，鱼饵不会返还。"));
        status("提竿太晚，鱼逃走了。",true);
        const again=el("button","","返回钓场");again.type="button";again.addEventListener("click",()=>{$("fish-action").classList.add("hidden");renderOverview();});
        box.append(again);await loadDashboard();renderOverview();return;
      }
      state.phase="reeling";
      const scene=createWaterScene("reeling");
      const rail=el("div","fish-reel-rail"),zone=el("div","fish-reel-zone"),needle=el("div","fish-reel-needle");
      const zoneStart=Number(result.zone_start_pct??15),zoneWidth=Number(result.zone_width_pct??70);
      zone.style.left=zoneStart+"%";zone.style.width=zoneWidth+"%";rail.append(zone,needle);
      box.replaceChildren(el("h3","","鱼上钩了，开始收线！"),el("p","hint","盯住指针，在绿色区域内点击收线。"),scene,rail);
      const hit=el("button","primary","收线");hit.type="button";box.append(hit);
      const duration=Number(result.reel_duration_ms)||3000;
      // 补偿提竿 RPC 的往返延迟，使画面指针尽量对齐服务器收到收线请求时的位置。
      const start=performance.now()-((Number(result.reel_elapsed_ms)||0)+hookRoundTripMs/2);
      const animate=now=>{
        if(state.phase!=="reeling")return;
        const phase=((((now-start)/duration+(Number(result.phase_offset)||0))%1)+1)%1;
        const x=(phase<.5?phase*2:(1-phase)*2)*100;
        needle.style.left=x+"%";
        state.raf=requestAnimationFrame(animate);
      };
      state.raf=requestAnimationFrame(animate);
      hit.addEventListener("click",finishReel);
    }catch(e){
      state.phase="idle";state.currentSession=null;
      box.replaceChildren(el("p","hint","提竿判定失败："+e.message));
      status("提竿判定失败："+e.message,true);
    }
  }
  async function finishReel(){
    if(state.phase!=="reeling")return;
    cancelAnimationFrame(state.raf);
    state.phase="resolving";
    $("fish-action").replaceChildren(el("p","hint","正在由服务器判定收线结果……"));
    try{
      const result=await rpc("fishing_finish_reel_v2",{p_session_id:state.currentSession});
      if(result.status==="caught"){
        const label=result.size_label||"尺寸待定";
        const caughtScene=createWaterScene("caught");
        const catchMark=el("div","fish-catch-spark","🎣");
        caughtScene.append(catchMark);
        const catchTitle=el("h3","fish-catch-title","🎉 成功钓获："+result.fish_name);
        const rewardLabel=result.is_first_discovery?"首次发现奖励 ×3":result.is_size_record?"尺寸纪录奖励 ×2":"重复钓获奖励 ×0.2";
        $("fish-action").replaceChildren(caughtScene,catchTitle,el("p","",label+" · 获得 "+result.points_awarded+" 钓鱼积分"),el("p","hint",rewardLabel+" · 收线评分 "+result.action_score+" · 天气 "+({sunny:"晴天",cloudy:"阴天",rain:"雨天",fog:"浓雾",storm:"雷雨",windy:"大风"}[result.weather_id]||"未知")));
        status("成功钓获 "+result.fish_name+"！");
      }else{
        $("fish-action").replaceChildren(el("h3","","鱼逃走了"),el("p","hint","收线时机不合适，这次没有收获，鱼饵不会返还。"));
        status("鱼逃走了，下次再试试。",true);
      }
      state.phase="idle";state.currentSession=null;
      const again=el("button","","返回钓场");again.type="button";again.addEventListener("click",()=>{$("fish-action").classList.add("hidden");renderOverview();});
      $("fish-action").append(again);
      await loadDashboard();renderOverview();
    }catch(e){state.phase="idle";status("收线结算失败："+e.message,true);}
  }
  function renderFishbook(){
    const host=$("fish-book");host.replaceChildren();
    const owned=new Map((state.dashboard.fishbook||[]).map(x=>[x.fish_id,x]));
    const discovered=Number(state.dashboard.stats?.distinct_fish||state.dashboard.fishbook?.length||0);
    const hiddenKnown=state.fish.filter(f=>f.is_hidden).length;
    const hiddenUnknown=Math.max(0,Number(state.world?.hidden_total||4)-hiddenKnown);
    let filter="all";
    const shell=el("section","fishbook-shell");
    const head=el("div","fishbook-heading");
    const eyebrow=el("p","fishbook-eyebrow","QINGLAN LAKE · FIELD GUIDE");
    const title=el("h2","fishbook-title","湖畔鱼类图鉴");
    const subtitle=el("p","fishbook-subtitle","每一次相遇，都是湖泊收藏的一页。继续垂钓，发现这里的全部鱼类。");
    head.append(eyebrow,title,subtitle);
    const progress=el("div","fishbook-progress");
    const progressText=el("div","fishbook-progress-copy");
    progressText.append(el("span","","探索进度"),el("strong","",discovered+" / "+Number(state.world?.species_total||36)+" 种"));
    const track=el("div","fishbook-progress-track");
    const fill=el("span","");fill.style.width=(Number(state.world?.species_total||36)?discovered/Number(state.world?.species_total||36)*100:0)+"%";track.append(fill);
    progress.append(progressText,track);
    const filters=el("div","fishbook-filters");
    const grid=el("div","fishbook-grid");
    const renderCards=()=>{
      filters.replaceChildren();
      const choices=[["all","全部鱼类"],["found","已发现"],["unknown","未发现"]];
      choices.forEach(([key,label])=>{
        const b=el("button",filter===key?"active":"",label);
        b.type="button";b.setAttribute("aria-pressed",filter===key?"true":"false");
        b.addEventListener("click",()=>{filter=key;renderCards();});
        filters.append(b);
      });
      grid.replaceChildren();
      const visible=state.fish.filter(f=>filter==="all"||(filter==="found"?owned.has(f.fish_id):!owned.has(f.fish_id)));
      if(!visible.length&&!(hiddenUnknown>0&&(filter==="all"||filter==="unknown"))){grid.append(el("p","fishbook-empty","这里暂时没有符合条件的鱼类。"));return;}
      visible.forEach((f,index)=>{
        const item=owned.get(f.fish_id);
        const card=el("article","fishbook-card"+(item?" is-discovered":" is-unknown"));
        const art=el("div","fishbook-art");
        const seal=el("span","fishbook-seal",item?"已收录":"未发现");
        const fishMark=el("span","fishbook-fish-mark",item?"🐟":"?");
        const number=el("span","fishbook-number","NO. "+String(state.fish.indexOf(f)+1).padStart(2,"0"));
        art.append(number,fishMark,seal);
        const info=el("div","fishbook-card-info");
        info.append(el("p","fishbook-category",item?"湖泊记录":"待探索"),el("h3","fishbook-fish-name",item?f.fish_name:"神秘鱼类"));
        if(item){
          info.append(el("p","fishbook-catch-count","钓获 "+Number(item.catch_count||0).toLocaleString("zh-CN")+" 次"));
          const facts=el("div","fishbook-facts");
          const size=item.best_size_cm==null?"暂未记录":Number(item.best_size_cm).toLocaleString("zh-CN")+" cm";
          const globalRecord=state.globalRecords.find(x=>x.fish_id===f.fish_id)?.global_best_size_cm;
          facts.append(el("span","","个人最佳尺寸"),el("strong","",size),el("span","","全服纪录"),el("strong","",globalRecord==null?"暂无":Number(globalRecord).toLocaleString("zh-CN")+" cm"),el("span","","最高积分"),el("strong","",Number(item.best_points||0).toLocaleString("zh-CN")));
          info.append(facts);
        }else{
          info.append(el("p","fishbook-locked-copy","尚未与它相遇。前往湖边继续抛竿吧。"));
        }
        if(f.description)info.append(el("p","fishbook-locked-copy",f.description));
        info.append(el("small","fishbook-category","稀有度："+({common:"普通",uncommon:"优秀",rare:"稀有",epic:"史诗",legendary:"传说",mythic:"神话"}[f.rarity]||"未知")));
        card.append(art,info);grid.append(card);
      });
      if(hiddenUnknown>0&&(filter==="all"||filter==="unknown")){
        for(let n=0;n<hiddenUnknown;n++){
          const mystery=el("article","fishbook-card is-unknown"),art=el("div","fishbook-art");
          art.append(el("span","fishbook-number","HIDDEN "+String(n+1).padStart(2,"0")),el("span","fishbook-fish-mark","?"),el("span","fishbook-seal","隐藏鱼种"));
          const info=el("div","fishbook-card-info");info.append(el("p","fishbook-category","尚未发现"),el("h3","fishbook-fish-name","未知的水域传说"),el("p","fishbook-locked-copy","天气、时段与钓点可能藏着线索。"));
          mystery.append(art,info);grid.append(mystery);
        }
      }
    };
    shell.append(head,progress,filters,grid);host.append(shell);renderCards();
  }
  function renderAchievements(){
    const host=$("fish-achievements");host.replaceChildren();const rows=state.dashboard.achievements||[],stats=state.dashboard.stats||{},book=state.dashboard.fishbook||[];
    const shell=el("section","fish-game-panel"),head=el("header","fish-page-heading");head.append(el("p","fish-kicker","ANGLER'S RECORD · TROPHIES"),el("h2","","钓鱼成就"),el("p","","完成湖畔挑战，领取专属钓鱼积分奖励。每项成就只能领取一次。"));
    const done=rows.filter(a=>a.unlocked).length,summary=el("div","fish-achievement-total");summary.append(el("strong","",done+" / "+rows.length),el("span","","项成就已解锁 · 已累计获得奖励"));
    const grid=el("div","fish-achievement-grid");rows.forEach((a,i)=>{let current=null;if(a.condition_type==="catches")current=Number(stats.total_catches||0);if(a.condition_type==="points")current=Number(stats.points||0);if(a.condition_type==="distinct_fish")current=Number(stats.distinct_fish||book.length);const card=el("article","fish-achievement-tile"+(a.unlocked?" unlocked":"")),icon=el("span","fish-achievement-icon",a.unlocked?"✦":(["🎣","🐟","🏅"][i%3])),info=el("div","");info.append(el("small","",a.unlocked?"已解锁":"挑战中"),el("h3","",a.name),el("p","",a.description));if(current!==null){const bar=el("div","fish-achievement-track"),fill=el("i","");fill.style.width=Math.min(100,current/Math.max(1,Number(a.threshold))*100)+"%";bar.append(fill);info.append(bar,el("small","",Math.min(current,Number(a.threshold))+" / "+a.threshold));}else if(!a.unlocked)info.append(el("small","","完成对应挑战即可解锁"));const rewardParts=[];if(Number(a.reward_points||0)>0)rewardParts.push("+"+Number(a.reward_points).toLocaleString("zh-CN")+" P");if(a.reward_bait_id&&Number(a.reward_bait_quantity||0)>0)rewardParts.push("特殊鱼饵 ×"+Number(a.reward_bait_quantity));const reward=el("b","fish-achievement-reward","奖励　"+(rewardParts.join(" · ")||"成就解锁"));info.append(reward);card.append(icon,info);grid.append(card);});
    if(!rows.length)grid.append(el("div","fish-empty-state","成就目录正在准备中。"));
    shell.append(head,summary,grid);host.append(shell);
  }
  function renderShop(){
    const host=$("fish-shop");host.replaceChildren();
    const shell=el("section","fish-game-panel"),head=el("header","fish-page-heading");
    head.append(el("p","fish-kicker","LAKESIDE TRADING POST · EXCHANGE"),el("h2","","钓场商店"),el("p","","使用钓鱼积分兑换鱼饵、网站代币、卡牌与收藏道具。兑换奖励会直接进入对应仓库。"));
    const balance=el("div","fish-shop-balance");balance.append(el("span","","当前钓鱼积分"),el("strong","",Number(state.dashboard.stats?.points||0).toLocaleString("zh-CN")+" P"));
    const grid=el("div","fish-game-grid"),products=state.dashboard.shop||[];
    const rewardLabel=(p)=>{
      const cfg=p.reward_config||{};
      if(p.reward_type==="bait"){const bait=state.baits.find(x=>x.bait_id===cfg.bait_id);return "鱼饵："+(bait?.bait_name||cfg.bait_id||"未知")+" ×"+(cfg.quantity||0);}
      if(p.reward_type==="tokens")return "网站代币 ×"+(cfg.amount||0);
      if(p.reward_type==="card")return "卡牌："+(cardsByIdForShop[cfg.card_id]||cfg.card_id||"未知")+" ×"+(cfg.amount||0);
      if(p.reward_type==="item")return "道具："+(cfg.item_id||"未知")+" ×"+(cfg.amount||0);
      return "奖励配置待确认";
    };
    const cardsByIdForShop=Object.fromEntries((state.shopCards||[]).map(c=>[c.card_id,c.card_name||c.card_id]));
    products.forEach((p,i)=>{
      const c=el("article","fish-recipe-card"),art=el("div","fish-recipe-art");
      art.append(el("small","","SPECIAL ITEM 0"+(i+1)),el("b","",p.icon||"🎁"));
      const body=el("div","fish-recipe-body");
      body.append(el("h3","",p.product_name),el("p","",p.description),el("strong","","价格 "+Number(p.price_points).toLocaleString("zh-CN")+" P"));
      body.append(el("small","fish-shop-stock","兑换内容："+rewardLabel(p)));
      body.append(el("small","fish-shop-stock",p.stock_limit==null?"库存充足":"剩余库存 "+Math.max(0,p.stock_limit-p.stock_sold)));
      if(p.per_player_limit!=null)body.append(el("small","fish-shop-stock","每人限购 "+p.per_player_limit+" 次"));
      const btn=el("button","fish-ui-button","兑换商品");btn.type="button";
      btn.disabled=Number(state.dashboard.stats?.points||0)<Number(p.price_points)||(p.stock_limit!==null&&p.stock_limit!==undefined&&p.stock_sold>=p.stock_limit);
      btn.addEventListener("click",async()=>{
        if(!confirm("确定花费 "+Number(p.price_points).toLocaleString("zh-CN")+" 钓鱼积分兑换「"+p.product_name+"」吗？"))return;
        btn.disabled=true;btn.textContent="兑换中…";
        try{
          const result=await rpc("fishing_redeem_shop",{p_product_id:p.product_id,p_request_id:uuid()});
          const r=result.reward||{};
          const detail=r.granted_tokens?"获得网站代币 ×"+r.granted_tokens:
            r.granted_card_id?"获得卡牌 "+(cardsByIdForShop[r.granted_card_id]||r.granted_card_id)+" ×"+r.granted_amount:
            r.granted_item_id?"获得道具 "+r.granted_item_id+" ×"+r.granted_amount:
            r.granted_bait_id?"获得鱼饵 "+r.granted_bait_id+" ×"+r.granted_amount:"奖励已发放";
          status("兑换成功！"+detail+"。剩余钓鱼积分 "+Number(result.remaining_points??0).toLocaleString("zh-CN")+"。");
          await loadDashboard();renderShop();renderOverview();
        }catch(e){status("兑换失败："+e.message,true);btn.disabled=false;btn.textContent="兑换商品";}
      });
      body.append(btn);c.append(art,body);grid.append(c);
    });
    if(!products.length)grid.append(el("div","fish-empty-state","商店货架暂时空着。"));
    shell.append(head,balance,grid);host.append(shell);

    if(state.dashboard.is_admin){
      const admin=panel("商店管理","管理员可在这里新增、编辑、上下架商品。奖励类型会在保存时由服务器验证。");
      const form=el("form","admin-form-grid");
      const field=(label,node,wide=false)=>{const wrap=el("div","field"+(wide?" wide":""));wrap.append(el("label","",label),node);form.append(wrap);return node;};
      const productId=field("商品编号（新增时填写；编辑时不可修改）",el("input"));
      productId.placeholder="例如 fishing_exclusive_card";productId.maxLength=80;productId.required=true;
      const name=field("商品名称",el("input"));name.maxLength=80;name.required=true;
      const icon=field("图标",el("input"));icon.value="🎁";icon.maxLength=12;
      const price=field("兑换价格（钓鱼积分）",el("input"));price.type="number";price.min="1";price.step="1";price.required=true;
      const type=field("奖励类型",el("select"));
      [["鱼饵","bait"],["网站代币","tokens"],["指定卡牌","card"],["现有道具","item"]].forEach(([t,v])=>type.add(new Option(t,v)));
      const desc=field("商品说明",el("textarea"),true);desc.rows=2;desc.maxLength=500;
      const configBox=el("div","admin-form-grid");configBox.className="admin-form-grid wide";form.append(configBox);
      const stock=field("总库存（留空为不限量）",el("input"));stock.type="number";stock.min="0";stock.placeholder="不限量";
      const limit=field("每人限购（留空为不限购）",el("input"));limit.type="number";limit.min="1";limit.placeholder="不限购";
      const order=field("排序",el("input"));order.type="number";order.step="1";order.value="0";
      const activeWrap=el("label","");activeWrap.style.display="flex";activeWrap.style.alignItems="center";activeWrap.style.gap="8px";
      const active=el("input");active.type="checkbox";active.checked=true;activeWrap.append(active,el("span","","上架 / 启用"));form.append(activeWrap);
      const save=el("button","primary","保存商品");save.type="submit";form.append(save);
      const configFields={};
      function buildRewardConfig(existing={}){
        configBox.replaceChildren();Object.keys(configFields).forEach(k=>delete configFields[k]);
        const add=(key,label,kind="text",options=null)=>{
          const wrap=el("div","field");wrap.append(el("label","",label));
          let input=kind==="select"?el("select"):el("input");
          if(kind!=="select")input.type=kind;
          if(options)options.forEach(([t,v])=>input.add(new Option(t,v)));
          if(kind==="number"){input.min="1";input.step="1";}
          input.value=existing[key]==null?"":String(existing[key]);
          wrap.append(input);configBox.append(wrap);configFields[key]=input;
        };
        const t=type.value;
        if(t==="bait")add("bait_id","选择鱼饵","select",state.baits.map(b=>[b.bait_name,b.bait_id]));
        if(t==="tokens")add("amount","网站代币数量","number");
        if(t==="card")add("card_id","选择卡牌","select",(state.shopCards||[]).map(c=>[(c.card_name||c.card_id)+" · "+c.card_id,c.card_id]));
        if(t==="item")add("item_id","选择道具","select",(state.shopItems||[]).map(x=>[x.name+" · "+x.item_id,x.item_id]));
        if(t==="bait")add("quantity","鱼饵数量","number");
        if(t==="card"||t==="item")add("amount","发放数量","number");
      }
      type.addEventListener("change",()=>buildRewardConfig());
      buildRewardConfig();
      let editing=false;
      form.addEventListener("submit",async event=>{
        event.preventDefault();
        let cfg={};
        if(type.value==="bait")cfg={bait_id:configFields.bait_id.value,quantity:Number(configFields.quantity.value)};
        if(type.value==="tokens")cfg={amount:Number(configFields.amount.value)};
        if(type.value==="card")cfg={card_id:configFields.card_id.value,amount:Number(configFields.amount.value)};
        if(type.value==="item")cfg={item_id:configFields.item_id.value,amount:Number(configFields.amount.value)};
        if(!productId.value.trim()||!name.value.trim()||!Number(price.value)){status("请填写商品编号、名称和有效价格。",true);return;}
        save.disabled=true;
        try{
          await rpc("fishing_admin_save_shop_product",{
            p_product_id:productId.value.trim(),p_product_name:name.value.trim(),
            p_description:desc.value,p_icon:icon.value||"🎁",p_price_points:Number(price.value),
            p_reward_type:type.value,p_reward_config:cfg,
            p_stock_limit:stock.value===""?null:Number(stock.value),
            p_per_player_limit:limit.value===""?null:Number(limit.value),
            p_is_active:active.checked,p_sort_order:Number(order.value)||0
          });
          status("商品已保存。");await loadDashboard();renderShop();
        }catch(e){status("保存商品失败："+e.message,true);save.disabled=false;}
      });
      const list=el("div","");
      const reload=async()=>{
        try{
          const rows=await rpc("fishing_admin_list_shop",{});
          list.replaceChildren();
          rows.forEach(p=>{
            const row=el("div","admin-record"),main=el("div","admin-record-main");
            main.append(el("strong","",(p.icon||"🎁")+" "+p.product_name),
              el("div","hint",p.product_id+" · "+p.reward_type+" · "+p.price_points+" P · "+(p.is_active?"上架":"已下架")));
            const actions=el("div","admin-record-actions"),edit=el("button","","编辑");
            edit.type="button";edit.addEventListener("click",()=>{
              editing=true;productId.value=p.product_id;productId.readOnly=true;
              name.value=p.product_name;desc.value=p.description||"";icon.value=p.icon||"🎁";
              price.value=p.price_points;type.value=p.reward_type;active.checked=p.is_active;
              stock.value=p.stock_limit==null?"":p.stock_limit;limit.value=p.per_player_limit==null?"":p.per_player_limit;
              order.value=p.sort_order||0;buildRewardConfig(p.reward_config||{});
              save.textContent="保存修改";form.scrollIntoView({behavior:"smooth",block:"center"});
            });
            const toggle=el("button","","下架/上架");toggle.type="button";
            toggle.addEventListener("click",async()=>{
              try{await rpc("fishing_admin_save_shop_product",{
                p_product_id:p.product_id,p_product_name:p.product_name,p_description:p.description||"",
                p_icon:p.icon||"🎁",p_price_points:p.price_points,p_reward_type:p.reward_type,
                p_reward_config:p.reward_config||{},p_stock_limit:p.stock_limit,
                p_per_player_limit:p.per_player_limit,p_is_active:!p.is_active,p_sort_order:p.sort_order||0
              });await loadDashboard();renderShop();}catch(e){status("更新商品状态失败："+e.message,true);}
            });
            actions.append(edit,toggle);row.append(main,actions);list.append(row);
          });
        }catch(e){list.append(el("p","hint","商品目录读取失败："+e.message));}
      };
      admin.append(form,el("h4","","已登记商品"),list);shell.append(admin);void reload();
    }
  }
  async function renderLeaderboard(){
    const host=$("fish-leaderboard");host.replaceChildren();const shell=el("section","fish-game-panel"),head=el("header","fish-page-heading");
    head.append(el("p","fish-kicker","ANGLER RANKINGS · ALL PLAYERS"),el("h2","","钓场排行榜"),el("p","","与所有钓手比较垂钓积分、收获数量和鱼种发现记录。"));
    shell.append(head,el("div","fish-empty-state","正在读取排行榜……"));host.append(shell);
    try{const rows=await rpc("fishing_get_leaderboard",{p_limit:50}),content=el("div","fish-ranking-content");if(!rows.length)content.append(el("div","fish-empty-state","还没有钓鱼记录。成为第一个登上榜单的钓手吧！"));else{const podium=el("div","fish-ranking-podium");rows.slice(0,3).forEach(r=>{const rank=Number(r.rank),c=el("article","fish-podium-card rank-"+rank);c.append(el("span","fish-podium-medal",["","冠","亚","季"][rank]||rank),el("strong","",r.username||"钓手"),el("b","",Number(r.points||0).toLocaleString("zh-CN")+" P"),el("small","","钓获 "+Number(r.total_catches||0)));podium.append(c);});const table=el("table","fish-ranking-table"),tr=el("tr");["排名","钓手","积分","钓获","鱼种"].forEach(x=>tr.append(el("th","",x)));table.append(tr);rows.forEach(r=>{const row=el("tr");[r.rank,r.username,Number(r.points||0).toLocaleString("zh-CN"),r.total_catches,r.distinct_fish].forEach(v=>row.append(el("td","",String(v))));table.append(row);});content.append(podium,table);}shell.replaceChildren(head,content);}catch(e){shell.replaceChildren(head,el("div","fish-empty-state","排行榜读取失败："+e.message));}
  }
  client.auth.onAuthStateChange((_event,session)=>{
    if(session?.user){
      setTimeout(()=>{void loadDashboard().then(()=>{if(!root.classList.contains("hidden"))setSubpage("overview");}).catch(e=>status("钓场初始化失败："+e.message,true));},0);
    }else{
      state.dashboard=null;
      status("请先登录账号，再进入钓场。",true);
    }
  });
  root.querySelectorAll("[data-fishing-page]").forEach(b=>b.addEventListener("click",()=>setSubpage(b.dataset.fishingPage)));
  window.acgOpenFishing=async()=>{document.getElementById("tab-fishing")?.click();};
  (async()=>{try{status("正在读取钓场资料……");const {data,error}=await client.auth.getSession();if(error)throw error;if(data?.session){await loadDashboard();setSubpage("overview");status("钓场已连接。");}else status("请先登录账号，再进入钓场。",true);}catch(e){console.error("[ACG Fishing] 初始化失败",e);status("钓场初始化失败："+(e?.message||String(e)),true);}})();
  };
  if (window.acgSupabaseClient) boot();
  else window.addEventListener("acg-supabase-ready", boot, { once: true });
})();
