(() => {
  "use strict";
  const boot = () => {
  const client = window.acgSupabaseClient;
  if (!client || window.acgFishingInitialized) return;
  window.acgFishingInitialized = true;

  const root = document.getElementById("fishing-view");
  if (!root) { window.addEventListener("DOMContentLoaded", () => { if (!window.acgFishingInitialized) boot(); }, { once: true }); return; }
  const $ = (id) => root.querySelector("#" + id);
  const state = { dashboard:null, baits:[], fish:[], berries:[], currentSession:null, raf:0, phase:"idle" };
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
    const [baitRes,fishRes,berryRes]=await Promise.all([
      client.from("fishing_bait_catalog").select("*").eq("is_active",true).order("sort_order"),
      client.from("fishing_fish_catalog").select("*").eq("is_active",true).order("sort_order"),
      client.from("card_inventory").select("card_id,quantity").gt("quantity",0)
    ]);
    if(baitRes.error)throw baitRes.error;
    if(fishRes.error)throw fishRes.error;
    if(berryRes.error)throw berryRes.error;
    state.baits=baitRes.data||[];
    state.fish=fishRes.data||[];
    const [cardsRes]=await Promise.all([fetch("./data/cards.json",{cache:"no-store"})]);
    const cards=cardsRes.ok?await cardsRes.json():[];
    const names=Object.fromEntries(cards.map(c=>[c.id,c.name]));
    state.berries=(berryRes.data||[]).filter(r=>cards.some(c=>c.id===r.card_id&&c.pack_id==="pack_010"))
      .map(r=>({id:r.card_id,name:names[r.card_id]||r.card_id,quantity:r.quantity}));
    renderHeader();
  }
  function renderHeader(){
    const s=state.dashboard.stats||{};
    $("fish-points").textContent=Number(s.points||0).toLocaleString("zh-CN");
    $("fish-catches").textContent=Number(s.total_catches||0).toLocaleString("zh-CN");
    $("fish-species").textContent=Number(s.distinct_fish||0)+"/10";
  }
  function renderOverview(){
    const host=$("fish-overview");host.replaceChildren();
    const intro=panel("钓场","带上鱼饵，等待鱼咬钩。鱼种与尺寸由服务器在抛竿时决定，操作只影响是否成功收获。");
    const grid=el("div","fish-stat-grid");
    [["钓鱼积分",$("fish-points").textContent],["累计钓获",$("fish-catches").textContent],["已发现鱼种",$("fish-species").textContent]].forEach(([k,v])=>{
      const c=el("div","fish-stat");c.append(el("small","",k),el("strong","",v));grid.append(c);
    });
    intro.append(grid);
    const baitList=el("div","fish-bait-grid");
    state.baits.forEach(b=>{
      const qty=(state.dashboard.baits||[]).find(x=>x.bait_id===b.bait_id)?.quantity||0;
      const c=el("article","fish-bait-card");
      c.append(el("strong","",b.icon+" "+b.bait_name),el("p","hint",b.description),el("div","fish-bait-qty","持有：×"+qty));
      const choose=el("button","", "选择并抛竿");choose.type="button";choose.disabled=qty<1||!b.is_active;
      choose.addEventListener("click",()=>startCast(b.bait_id));c.append(choose);baitList.append(c);
    });
    intro.append(baitList);
    host.append(intro);
  }
  function renderCraft(){
    const host=$("fish-craft");host.replaceChildren();
    const box=panel("鱼饵工坊","树果取自玩家仓库中的树果库存。合成成功后扣除树果并增加鱼饵，操作由数据库事务完成。");
    const form=el("div","fish-craft-grid");
    state.baits.forEach(b=>{
      const card=el("article","fish-bait-card");
      card.append(el("h4","",b.icon+" "+b.bait_name),el("p","hint",b.description));
      if(!b.craftable){card.append(el("p","hint","配方尚未开放"));form.append(card);return;}
      const selects=[];
      for(let i=0;i<b.ingredient_count;i++){
        const wrap=el("label","fish-field","树果 "+(i+1));
        const sel=el("select");sel.append(new Option("选择树果",""));
        state.berries.forEach(berry=>{const opt=new Option(berry.name+"（持有 ×"+berry.quantity+"）",berry.id);sel.append(opt);});
        wrap.append(sel);card.append(wrap);selects.push(sel);
      }
      const qty=el("input");qty.type="number";qty.min="1";qty.max="1";qty.value="1";
      const qtyWrap=el("label","fish-field","合成数量");qtyWrap.append(qty);card.append(qtyWrap);
      const button=el("button","primary","制作鱼饵");button.type="button";
      button.disabled=state.berries.length<b.ingredient_count;
      button.addEventListener("click",async()=>{
        const ids=selects.map(x=>x.value);
        if(ids.some(x=>!x)){status("请先选择完整的树果配方。",true);return;}
        if(new Set(ids).size!==b.distinct_ingredients){status("所选树果种类不符合配方要求。",true);return;}
        const count=1;
        button.disabled=true;
        try{
          let last;
          for(let n=0;n<count;n++)last=await rpc("fishing_craft_bait",{p_bait_id:b.bait_id,p_berry_ids:ids,p_request_id:uuid()});
          status("制作完成，获得 "+count+" 个"+b.bait_name+"。");
          await loadDashboard();renderCraft();renderOverview();
        }catch(e){status("制作失败："+e.message,true);button.disabled=false;}
      });
      card.append(button);form.append(card);
    });
    box.append(form);host.append(box);
  }
  async function startCast(baitId){
    if(state.phase!=="idle"){status("当前还有一轮钓鱼没有结束。",true);return;}
    state.phase="waiting";renderOverview();
    try{
      const result=await rpc("fishing_start_cast",{p_bait_id:baitId,p_request_id:uuid()});
      state.currentSession=result.session_id;
      const box=$("fish-action");box.classList.remove("hidden");box.replaceChildren();
      box.append(el("h3","","鱼线已经抛出"),el("p","hint","耐心等待鱼咬钩……"));
      const wait=Math.max(1000,Math.min(10000,Number(result.bite_after_ms)||3000));
      window.setTimeout(()=>{
        if(state.phase!=="waiting")return;
        box.replaceChildren(el("h3","","！鱼咬钩了！"),el("p","hint","看到提示后立刻提竿。"));
        const btn=el("button","primary","提竿！");btn.type="button";
        btn.addEventListener("click",beginReel);box.append(btn);
      },wait);
      status("抛竿成功，已消耗 1 个鱼饵。");
      await loadDashboard();
    }catch(e){state.phase="idle";state.currentSession=null;status("抛竿失败："+e.message,true);await loadDashboard();}
  }
  function beginReel(){
    if(state.phase!=="waiting")return;
    state.phase="reeling";
    const box=$("fish-action");box.replaceChildren(el("h3","","收线！"),el("p","hint","指针移动到蓝色成功区域时点击按钮。"));
    const rail=el("div","fish-reel-rail"),zone=el("div","fish-reel-zone"),needle=el("div","fish-reel-needle");
    zone.style.left="40%";zone.style.width="20%";rail.append(zone,needle);box.append(rail);
    const hit=el("button","primary","收线");hit.type="button";box.append(hit);
    const start=performance.now(),duration=1700;
    const animate=now=>{
      if(state.phase!=="reeling")return;
      const t=((now-start)%duration)/duration;
      const x=(t<.5?t*2:(1-t)*2)*100;
      needle.style.left=x+"%";state.needleX=x;
      state.raf=requestAnimationFrame(animate);
    };
    state.raf=requestAnimationFrame(animate);
    hit.addEventListener("click",()=>finishReel());
  }
  async function finishReel(){
    if(state.phase!=="reeling")return;
    cancelAnimationFrame(state.raf);
    const score=Math.max(0,Math.round(100-Math.abs((state.needleX||0)-50)*2));
    const caught=(state.needleX||0)>=40&&(state.needleX||0)<=60;
    state.phase="resolving";
    $("fish-action").replaceChildren(el("p","hint",caught?"收线成功，正在确认鱼获……":"鱼挣脱了！"));
    try{
      const result=await rpc("fishing_resolve_cast",{p_session_id:state.currentSession,p_caught:caught,p_action_score:score});
      if(result.status==="caught"){
        const label=result.size_label||"尺寸待定";
        $("fish-action").replaceChildren(el("h3","","🎣 "+result.fish_name),el("p","",label+" · 获得 "+result.points_awarded+" 钓鱼积分"),el("p","hint","操作评分："+score+"。鱼种与积分由服务器决定。"));
        status("成功钓获 "+result.fish_name+"！");
      }else{
        $("fish-action").replaceChildren(el("h3","","鱼逃走了"),el("p","hint","这次没有收获，鱼饵不会返还。"));
        status("鱼逃走了，下次再试试。",true);
      }
      state.phase="idle";state.currentSession=null;
      const again=el("button","","返回钓场");again.type="button";again.addEventListener("click",()=>{$("fish-action").classList.add("hidden");renderOverview();});
      $("fish-action").append(again);
      await loadDashboard();renderOverview();
    }catch(e){state.phase="idle";status("结算失败："+e.message,true);}
  }
  function renderFishbook(){
    const host=$("fish-book");host.replaceChildren();
    const owned=new Map((state.dashboard.fishbook||[]).map(x=>[x.fish_id,x]));
    const grid=el("div","fish-bait-grid");
    state.fish.forEach(f=>{
      const item=owned.get(f.fish_id),c=el("article","fish-bait-card");
      c.append(el("strong","",item?f.fish_name:"？？？"),el("p","hint",item?"已发现 · 钓获 "+item.catch_count+" 次":"尚未发现"));
      c.append(el("p","",item?"最高积分："+item.best_points:"鱼类资料尚未解锁"));
      grid.append(c);
    });host.append(grid);
  }
  function renderAchievements(){
    const host=$("fish-achievements");host.replaceChildren();
    (state.dashboard.achievements||[]).forEach(a=>{
      const c=el("article","fish-bait-card");
      c.append(el("strong","",a.name),el("p","hint",a.description),el("p","",a.unlocked?"已达成":"尚未达成"));
      host.append(c);
    });
    if(!host.children.length)host.append(el("p","hint","钓鱼成就目录尚未配置。"));
  }
  function renderShop(){
    const host=$("fish-shop");host.replaceChildren();
    (state.dashboard.shop||[]).forEach(p=>{
      const c=el("article","fish-bait-card");
      c.append(el("strong","",p.icon+" "+p.product_name),el("p","hint",p.description),el("p","","兑换需要 "+p.price_points+" 钓鱼积分"));
      c.append(el("p","hint","商店商品将在商品配置完成后开放兑换。"));host.append(c);
    });
    if(!host.children.length)host.append(el("p","hint","钓场商店商品尚未上架。"));
  }
  async function renderLeaderboard(){
    const host=$("fish-leaderboard");host.replaceChildren(el("p","hint","正在读取排行榜……"));
    try{
      const rows=await rpc("fishing_get_leaderboard",{p_limit:50});
      const table=el("table","fish-table"),head=el("tr");
      ["排名","玩家","钓鱼积分","钓获","鱼种"].forEach(x=>head.append(el("th","",x)));
      table.append(head);
      rows.forEach(r=>{const tr=el("tr");[r.rank,r.username,r.points,r.total_catches,r.distinct_fish].forEach(v=>tr.append(el("td","",String(v))));table.append(tr);});
      host.replaceChildren(table);
      if(!rows.length)host.append(el("p","hint","还没有钓鱼记录。"));
    }catch(e){host.replaceChildren(el("p","hint","排行榜读取失败："+e.message));}
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
