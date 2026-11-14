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
    '<div class="panel"><h3>我的玩家资料</h3><p id="pc-login-hint" class="pc-muted">登录后可查看个人数据。</p><div id="pc-personal" class="hidden"><div class="pc-tabs" role="tablist"><button type="button" data-page="overview" class="active">总览</button><button type="button" data-page="matches">对战记录</button><button type="button" data-page="tokens">代币中心</button><button type="button" data-page="inventory">卡牌收藏</button><button type="button" data-page="achievements">成就收藏册</button></div><div id="pc-personal-content"></div></div></div>',
    '<div id="pc-admin-panel" class="panel hidden"><h3>管理员 · 比赛管理</h3><p class="pc-muted">登记或更正四人 2v2 比赛。提交后系统会重算四名玩家的场次、胜负和胜率，并检查比赛成就。</p><form id="pc-match-form"><input id="pc-match-id" type="hidden"><div class="field"><label for="pc-match-description">比赛备注（可选）</label><input id="pc-match-description" maxlength="120" placeholder="例如：周末友谊赛"></div><div class="pc-grid"><div class="field"><label for="pc-blue-1">蓝队玩家 1</label><select id="pc-blue-1" required></select></div><div class="field"><label for="pc-blue-2">蓝队玩家 2</label><select id="pc-blue-2" required></select></div><div class="field"><label for="pc-red-1">红队玩家 1</label><select id="pc-red-1" required></select></div><div class="field"><label for="pc-red-2">红队玩家 2</label><select id="pc-red-2" required></select></div></div><div class="field"><label for="pc-winning-team">获胜队伍</label><select id="pc-winning-team"><option value="blue">蓝队胜利</option><option value="red">红队胜利</option></select></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="primary" type="submit" id="pc-match-submit">登记比赛</button><button type="button" id="pc-match-cancel" class="hidden">取消更正</button></div><p id="pc-match-status" class="status" style="margin-top:10px"></p></form><h4 style="margin-top:22px">最近登记的比赛</h4><div id="pc-admin-match-list" class="pc-muted">正在读取……</div></div>'
  ].join("");
  main.appendChild(view);

  const knownViews = ["library-view","player-view","builder-view","admin-view","account-view","shared-deck-view"];
  const knownTabs = ["tab-library","tab-player","tab-builder","tab-admin","tab-account"];
  const statusEl = view.querySelector("#pc-status");
  const personalEl = view.querySelector("#pc-personal");
  const loginHint = view.querySelector("#pc-login-hint");
  const contentEl = view.querySelector("#pc-personal-content");
  let currentUser = null, currentPage = "overview", cardsById = {};
  let adminPlayers = [];

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
  knownTabs.forEach(id => document.getElementById(id)?.addEventListener("click", () => {
    view.classList.add("hidden");
    tab.classList.remove("active");
  }));

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
      .eq("username",username.toLowerCase()).maybeSingle();
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
    await checkAdmin();
  }


  const adminPanel = view.querySelector("#pc-admin-panel");
  const matchForm = view.querySelector("#pc-match-form");
  const matchStatus = view.querySelector("#pc-match-status");
  const matchList = view.querySelector("#pc-admin-match-list");
  const matchSelectIds = ["pc-blue-1","pc-blue-2","pc-red-1","pc-red-2"];

  function setMatchStatus(message,bad) {
    matchStatus.textContent=message;
    matchStatus.className="status"+(bad?" bad":" good");
  }
  function fillPlayerSelects() {
    matchSelectIds.forEach(id=>{
      const select=view.querySelector("#"+id),previous=select.value;
      select.replaceChildren(new Option("请选择玩家",""));
      adminPlayers.forEach(player=>select.add(new Option(player.username,player.id)));
      if(adminPlayers.some(player=>player.id===previous))select.value=previous;
    });
  }
  async function checkAdmin() {
    try {
      const {data,error}=await client.from("profiles").select("is_admin").eq("id",currentUser.id).maybeSingle();
      if(error)throw error;
      if(!data?.is_admin){adminPanel.classList.add("hidden");return;}
      adminPanel.classList.remove("hidden");
      const {data:players,error:playersError}=await client.from("profiles").select("id,username").order("username");
      if(playersError)throw playersError;
      adminPlayers=players||[];
      fillPlayerSelects();
      await loadAdminMatches();
    } catch(error) {
      adminPanel.classList.add("hidden");
      setStatus("管理员资料读取失败："+error.message,true);
    }
  }
  async function loadAdminMatches() {
    const {data:matches,error}=await client.from("matches").select("id,description,created_at,winning_team").order("created_at",{ascending:false}).limit(50);
    if(error)throw error;
    matchList.replaceChildren();
    if(!matches?.length){matchList.appendChild(node("div","pc-empty","暂时没有登记过比赛。"));return;}
    const ids=matches.map(match=>match.id);
    const {data:results,error:resultsError}=await client.from("match_results").select("match_id,user_id,result,team").in("match_id",ids);
    if(resultsError)throw resultsError;
    const playerNames=Object.fromEntries(adminPlayers.map(player=>[player.id,player.username]));
    const byMatch={};
    (results||[]).forEach(result=>(byMatch[result.match_id]??=[]).push(result));
    matches.forEach(match=>{
      const row=node("div","pc-row"),left=node("div");
      const teamNames=(byMatch[match.id]||[]).map(result=>(result.team==="blue"?"蓝队":"红队")+"："+(playerNames[result.user_id]||"未知玩家")).join("、");
      left.append(node("strong","",match.description||("比赛 #"+match.id)),node("div","pc-muted",new Date(match.created_at).toLocaleString("zh-CN")+" · "+teamNames));
      const edit=node("button","","更正");
      edit.type="button";
      edit.addEventListener("click",()=>{
        const entries=byMatch[match.id]||[];
        const blue=entries.filter(entry=>entry.team==="blue"),red=entries.filter(entry=>entry.team==="red");
        if(blue.length!==2||red.length!==2){setMatchStatus("这场比赛缺少完整的队伍记录，暂时不能更正。",true);return;}
        view.querySelector("#pc-match-id").value=match.id;
        view.querySelector("#pc-match-description").value=match.description||"";
        view.querySelector("#pc-blue-1").value=blue[0].user_id;
        view.querySelector("#pc-blue-2").value=blue[1].user_id;
        view.querySelector("#pc-red-1").value=red[0].user_id;
        view.querySelector("#pc-red-2").value=red[1].user_id;
        view.querySelector("#pc-winning-team").value=match.winning_team|| (blue[0].result==="win"?"blue":"red");
        view.querySelector("#pc-match-submit").textContent="保存更正";
        view.querySelector("#pc-match-cancel").classList.remove("hidden");
        setMatchStatus("正在更正比赛 #"+match.id+"。修改完成后会重新计算统计。",false);
        matchForm.scrollIntoView({behavior:"smooth",block:"center"});
      });
      row.append(left,edit);matchList.appendChild(row);
    });
  }
  matchForm.addEventListener("submit",async event=>{
    event.preventDefault();
    const players=matchSelectIds.map(id=>view.querySelector("#"+id).value);
    if(players.some(value=>!value)||new Set(players).size!==4){setMatchStatus("请选择四名不同的玩家。",true);return;}
    const matchId=view.querySelector("#pc-match-id").value;
    const args={
      p_description:view.querySelector("#pc-match-description").value.trim(),
      p_blue_player_1:players[0],p_blue_player_2:players[1],
      p_red_player_1:players[2],p_red_player_2:players[3],
      p_winning_team:view.querySelector("#pc-winning-team").value
    };
    const submit=view.querySelector("#pc-match-submit");
    submit.disabled=true;
    setMatchStatus(matchId?"正在保存比赛更正……":"正在登记比赛……",false);
    try{
      const response=matchId
        ?await client.rpc("admin_correct_2v2_match",{p_match_id:Number(matchId),...args})
        :await client.rpc("admin_register_2v2_match",args);
      if(response.error)throw response.error;
      matchForm.reset();
      view.querySelector("#pc-match-id").value="";
      submit.textContent="登记比赛";
      view.querySelector("#pc-match-cancel").classList.add("hidden");
      setMatchStatus(matchId?"比赛更正成功，相关玩家统计已重新计算。":"比赛登记成功，四名玩家的统计已更新。",false);
      await loadAdminMatches();
      await loadPage(currentPage);
    }catch(error){setMatchStatus("操作失败："+error.message,true);}
    finally{submit.disabled=false;}
  });
  view.querySelector("#pc-match-cancel").addEventListener("click",()=>{
    matchForm.reset();view.querySelector("#pc-match-id").value="";
    view.querySelector("#pc-match-submit").textContent="登记比赛";
    view.querySelector("#pc-match-cancel").classList.add("hidden");
    setMatchStatus("已取消更正。",false);
  });

    loadCardNames();
  client.auth.onAuthStateChange((_event,session)=>{onSession(session);});
  client.auth.getSession().then(({data,error})=>{
    if(error){setStatus("无法读取登录状态："+error.message,true);return;}
    onSession(data?.session||null);
  });
})();