(() => {
  "use strict";
  const client = window.acgSupabaseClient;
  const main = document.querySelector("main");
  const nav = document.querySelector("nav.tabs");
  if (!client || !main || !nav || document.getElementById("player-center-view")) return;

  const style = document.createElement("style");
  style.textContent = "#player-center-view .pc-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#player-center-view .pc-tabs button{padding:8px 12px}#player-center-view .pc-tabs button.active{background:#5967a5;border-color:#7181c7}#player-center-view .pc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:12px 0}#player-center-view .pc-stat{padding:14px;background:#222536;border:1px solid #383d50;border-radius:10px}#player-center-view .pc-stat strong{display:block;font-size:22px;margin-top:5px}#player-center-view .pc-row{display:flex;justify-content:space-between;gap:12px;padding:12px 4px;border-bottom:1px solid #383d50}#player-center-view .pc-muted{color:#a6abc0;font-size:13px;line-height:1.6}#player-center-view .pc-positive{color:#8bd5a7}#player-center-view .pc-negative{color:#ff9b9b}#player-center-view .pc-search{display:flex;gap:8px;align-items:end;flex-wrap:wrap}#player-center-view .pc-search .field{flex:1;min-width:190px}#player-center-view .pc-empty{padding:18px;text-align:center;color:#a6abc0;background:#222536;border:1px solid #383d50;border-radius:10px}@media(max-width:600px){#player-center-view .pc-row{align-items:flex-start;flex-direction:column;gap:4px}}";
  document.head.appendChild(style);

  const tab = document.createElement("button");
  tab.id = "tab-player-center"; tab.type = "button"; tab.textContent = "玩家中心";
  nav.appendChild(tab);

  const view = document.createElement("section");
  view.id = "player-center-view"; view.className = "hidden";
  view.innerHTML = [
    '<div class="panel"><h3>玩家中心</h3><p class="hint">查看公开玩家主页，以及自己的对战记录、代币、收藏和成就。</p><p id="pc-status" class="status">正在连接玩家中心……</p></div>',
    '<div class="panel"><h3>公开个人主页</h3><div class="pc-search"><div class="field"><label for="pc-public-name">玩家昵称</label><input id="pc-public-name" maxlength="20" placeholder="输入游戏昵称"></div><button id="pc-public-search" class="primary" type="button">查看主页</button></div><div id="pc-public-result" style="margin-top:14px"><p class="pc-muted">输入昵称即可查看公开主页。登录后也可以直接查看自己的主页。</p></div></div>',
    '<div class="panel"><h3>我的玩家资料</h3><p id="pc-login-hint" class="pc-muted">登录后可查看个人数据。</p><div id="pc-personal" class="hidden"><div class="pc-tabs" role="tablist"><button type="button" data-page="overview" class="active">总览</button><button type="button" data-page="matches">对战记录</button><button type="button" data-page="tokens">代币中心</button><button type="button" data-page="inventory">卡牌收藏</button><button type="button" data-page="achievements">成就收藏册</button></div><div id="pc-personal-content"></div></div></div>'
  ].join("");
  main.appendChild(view);

  const knownViews = ["library-view","player-view","builder-view","admin-view","account-view","shared-deck-view"];
  const knownTabs = ["tab-library","tab-player","tab-builder","tab-admin","tab-account"];
  const statusEl = view.querySelector("#pc-status");
  const personalEl = view.querySelector("#pc-personal");
  const loginHint = view.querySelector("#pc-login-hint");
  const contentEl = view.querySelector("#pc-personal-content");
  let currentUser = null, currentPage = "overview", cardsById = {};

  function node(tag, cls, text) {
    const item = document.createElement(tag);
    if (cls) item.className = cls;
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function setStatus(message, bad) {
    statusEl.textContent = message;
    statusEl.className = "status" + (bad ? " bad" : " good");
  }
  function showCenter() {
    knownViews.forEach(id => document.getElementById(id)?.classList.add("hidden"));
    view.classList.remove("hidden");
    [...knownTabs,"tab-player-center"].forEach(id => document.getElementById(id)?.classList.remove("active"));
    tab.classList.add("active");
    const title = document.getElementById("page-title");
    if (title) title.textContent = "玩家中心";
  }
  tab.addEventListener("click",showCenter);

  async function loadCardNames() {
    try {
      const response = await fetch("./data/cards.json",{cache:"no-store"});
      if (response.ok) cardsById = Object.fromEntries((await response.json()).map(card=>[card.id,card]));
    } catch (_) {}
  }

  async function showPublicProfile(username) {
    const result = view.querySelector("#pc-public-result");
    result.replaceChildren(node("p","pc-muted","正在查询……"));
    const {data,error} = await client.from("public_profiles")
      .select("username,created_at,selected_title,selected_badges,games_played,wins,losses,win_rate")
      .ilike("username",username).maybeSingle();
    result.replaceChildren();
    if (error) { result.appendChild(node("p","pc-empty","查询失败："+error.message)); return; }
    if (!data) { result.appendChild(node("p","pc-empty","没有找到这个玩家。请确认昵称是否正确。")); return; }
    result.appendChild(node("h3","",data.username));
    result.appendChild(node("p","pc-muted",(data.selected_title||"尚未设置称号")+" · 加入于 "+new Date(data.created_at).toLocaleDateString("zh-CN")));
    const grid=node("div","pc-grid");
    [["总场次",data.games_played],["胜场",data.wins],["败场",data.losses],["胜率",Number(data.win_rate).toFixed(1)+"%"]].forEach(([label,value])=>{
      const item=node("div","pc-stat"); item.append(node("span","pc-muted",label),node("strong","",String(value))); grid.appendChild(item);
    });
    result.appendChild(grid);
    const badges=Array.isArray(data.selected_badges)?data.selected_badges:[];
    result.appendChild(node("p","pc-muted",badges.length?"展示徽章："+badges.join(" · "):"尚未选择展示徽章"));
  }
  view.querySelector("#pc-public-search").addEventListener("click",()=>{
    const name=view.querySelector("#pc-public-name").value.trim();
    if (!name) { setStatus("请先输入玩家昵称。",true); return; }
    showPublicProfile(name);
  });
  view.querySelector("#pc-public-name").addEventListener("keydown",event=>{
    if(event.key==="Enter") view.querySelector("#pc-public-search").click();
  });

  async function loadOverview() {
    const [{data:profile,error:pe},{data:stats,error:se}]=await Promise.all([
      client.from("profiles").select("username,created_at,selected_title,selected_badges").eq("id",currentUser.id).maybeSingle(),
      client.from("player_stats").select("tokens,games_played,wins,losses").eq("user_id",currentUser.id).maybeSingle()
    ]);
    if(pe) throw pe; if(se) throw se;
    const s=stats||{tokens:0,games_played:0,wins:0,losses:0};
    contentEl.replaceChildren(node("h3","",profile?.username||"玩家"));
    contentEl.appendChild(node("p","pc-muted",(profile?.selected_title||"尚未设置称号")+" · 加入于 "+(profile?.created_at?new Date(profile.created_at).toLocaleDateString("zh-CN"):"未知")));
    const rate=s.games_played?(s.wins*100/s.games_played).toFixed(1)+"%":"0.0%";
    const grid=node("div","pc-grid");
    [["代币",s.tokens],["总场次",s.games_played],["胜场",s.wins],["败场",s.losses],["胜率",rate]].forEach(([label,value])=>{
      const item=node("div","pc-stat"); item.append(node("span","pc-muted",label),node("strong","",String(value))); grid.appendChild(item);
    });
    contentEl.append(grid,node("p","pc-muted","公开主页不会展示代币余额和卡牌收藏。"));
  }

  async function loadMatches() {
    const {data:rows,error}=await client.from("match_results").select("match_id,result").eq("user_id",currentUser.id);
    if(error) throw error;
    const ids=[...new Set((rows||[]).map(row=>row.match_id))];
    let matches=[];
    if(ids.length){const response=await client.from("matches").select("id,description,created_at").in("id",ids);if(response.error)throw response.error;matches=response.data||[];}
    const byId=Object.fromEntries(matches.map(m=>[m.id,m]));
    const ordered=(rows||[]).map(row=>({...row,match:byId[row.match_id]})).sort((a,b)=>new Date(b.match?.created_at||0)-new Date(a.match?.created_at||0));
    contentEl.replaceChildren(node("p","pc-muted","共参加 "+ordered.length+" 场比赛"));
    if(!ordered.length){contentEl.appendChild(node("div","pc-empty","还没有比赛记录。"));return;}
    ordered.forEach(row=>{
      const m=row.match||{},line=node("div","pc-row"),left=node("div");
      left.append(node("strong","",m.description||"2v2 对战"),node("div","pc-muted",m.created_at?new Date(m.created_at).toLocaleString("zh-CN"):""));
      line.append(left,node("strong",row.result==="win"?"pc-positive":"pc-negative",row.result==="win"?"胜利":"失败"));contentEl.appendChild(line);
    });
  }

  async function loadTokens() {
    const [{data:stats,error:se},{data:transactions,error:te}]=await Promise.all([
      client.from("player_stats").select("tokens").eq("user_id",currentUser.id).maybeSingle(),
      client.from("token_transactions").select("amount,reason,created_at").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(50)
    ]);
    if(se)throw se;if(te)throw te;
    contentEl.replaceChildren(node("div","pc-stat","当前余额："+String(stats?.tokens??0)),node("p","pc-muted","最近 50 笔代币流水"));
    if(!transactions?.length){contentEl.appendChild(node("div","pc-empty","暂时代币流水为空。"));return;}
    transactions.forEach(tx=>{
      const line=node("div","pc-row");
      line.append(node("div","",tx.reason||"代币变动"),node("div",Number(tx.amount)>0?"pc-positive":"pc-negative",(Number(tx.amount)>0?"+":"")+tx.amount+" · "+new Date(tx.created_at).toLocaleDateString("zh-CN")));
      contentEl.appendChild(line);
    });
  }

  async function loadInventory() {
    const {data,error}=await client.from("card_inventory").select("card_id,quantity").eq("user_id",currentUser.id).gt("quantity",0).order("card_id");
    if(error)throw error;
    const rows=data||[],total=rows.reduce((sum,row)=>sum+Number(row.quantity),0);
    contentEl.replaceChildren(node("p","pc-muted","拥有 "+rows.length+" 种卡牌，共 "+total+" 张"));
    if(!rows.length){contentEl.appendChild(node("div","pc-empty","还没有卡牌收藏记录。"));return;}
    rows.forEach(row=>{const line=node("div","pc-row");line.append(node("span","",cardsById[row.card_id]?.name||row.card_id),node("strong","","× "+row.quantity));contentEl.appendChild(line);});
  }

  async function loadAchievements() {
    const [{data:all,error:ae},{data:owned,error:oe}]=await Promise.all([
      client.from("achievements").select("id,name,description").order("id"),
      client.from("player_achievements").select("achievement_id,unlocked_at").eq("user_id",currentUser.id)
    ]);
    if(ae)throw ae;if(oe)throw oe;
    const map=Object.fromEntries((owned||[]).map(item=>[item.achievement_id,item.unlocked_at]));
    contentEl.replaceChildren(node("p","pc-muted","已解锁 "+Object.keys(map).length+" / "+(all||[]).length+" 项成就"));
    if(!all?.length){contentEl.appendChild(node("div","pc-empty","成就列表尚未配置。"));return;}
    all.forEach(item=>{
      const line=node("div","pc-row"),left=node("div");
      left.append(node("strong","",item.name),node("div","pc-muted",item.description||""));
      const date=map[item.id];
      line.append(left,node("span",date?"pc-positive":"pc-muted",date?"已解锁 · "+new Date(date).toLocaleDateString("zh-CN"):"未解锁"));
      contentEl.appendChild(line);
    });
  }

  async function loadPage(page) {
    currentPage=page;
    view.querySelectorAll("[data-page]").forEach(button=>button.classList.toggle("active",button.dataset.page===page));
    contentEl.replaceChildren(node("p","pc-muted","正在读取……"));
    try {
      if(page==="overview")await loadOverview();
      else if(page==="matches")await loadMatches();
      else if(page==="tokens")await loadTokens();
      else if(page==="inventory")await loadInventory();
      else if(page==="achievements")await loadAchievements();
      setStatus("玩家中心已连接。",false);
    } catch(error) {
      contentEl.replaceChildren(node("div","pc-empty","读取失败："+error.message));
      setStatus("部分数据暂时无法读取，请稍后重试。",true);
    }
  }
  view.querySelectorAll("[data-page]").forEach(button=>button.addEventListener("click",()=>loadPage(button.dataset.page)));

  async function onSession(session) {
    currentUser=session?.user||null;
    if(!currentUser){
      personalEl.classList.add("hidden");
      loginHint.textContent="登录后可查看自己的对战记录、代币、收藏和成就。公开主页仍可供访客查询。";
      setStatus("尚未登录。公开主页可以正常查询。",false);
      return;
    }
    personalEl.classList.remove("hidden");
    loginHint.textContent="已登录。以下内容仅本人可查看。";
    view.querySelector("#pc-public-name").value=currentUser.user_metadata?.username||"";
    await loadPage(currentPage);
  }

  loadCardNames();
  client.auth.onAuthStateChange((_event,session)=>{onSession(session);});
  client.auth.getSession().then(({data,error})=>{
    if(error){setStatus("无法读取登录状态："+error.message,true);return;}
    onSession(data?.session||null);
  });
})();