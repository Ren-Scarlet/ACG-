(() => {
  "use strict";
  const client = window.acgSupabaseClient;
  const main = document.querySelector("main");
  const nav = document.querySelector("nav.tabs");
  if (!client || !main || !nav || document.getElementById("player-center-view")) return;

  const style = document.createElement("style");
  style.textContent = "#player-center-view .pc-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#player-center-view .pc-tabs button{padding:8px 12px}#player-center-view .pc-tabs button.active{background:#5967a5;border-color:#7181c7}#player-center-view .pc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:12px 0}#player-center-view .pc-stat{padding:14px;background:#222536;border:1px solid #383d50;border-radius:10px}#player-center-view .pc-stat strong{display:block;font-size:22px;margin-top:5px}#player-center-view .pc-row{display:flex;justify-content:space-between;gap:12px;padding:12px 4px;border-bottom:1px solid #383d50}#player-center-view .pc-muted{color:#a6abc0;font-size:13px;line-height:1.6}#player-center-view .pc-positive{color:#8bd5a7}#player-center-view .pc-negative{color:#ff9b9b}#player-center-view .pc-search{display:flex;gap:8px;align-items:end;flex-wrap:wrap}#player-center-view .pc-search .field{flex:1;min-width:190px}#player-center-view .pc-empty{padding:18px;text-align:center;color:#a6abc0;background:#222536;border:1px solid #383d50;border-radius:10px}#player-center-view .pc-draw-card{display:flex;align-items:center;gap:14px;padding:12px;border:1px solid #383d50;border-radius:10px;margin:10px 0}#player-center-view .pc-draw-card img{width:84px;height:116px;object-fit:contain;border-radius:6px}#player-center-view .pc-draw-card .pc-draw-info{flex:1}@media(max-width:600px){#player-center-view .pc-row{align-items:flex-start;flex-direction:column;gap:4px}}";
  document.head.appendChild(style);

  const tab = document.createElement("button");
  tab.id = "tab-player-center"; tab.type = "button"; tab.textContent = "玩家中心";
  nav.appendChild(tab);

  const view = document.createElement("section");
  view.id = "player-center-view"; view.className = "hidden";
  view.innerHTML = [
    '<div class="panel"><h3>玩家中心</h3><p class="hint">查看公开玩家主页，以及自己的对战记录、代币、收藏和成就。</p><p id="pc-status" class="status">正在连接玩家中心……</p></div>',
    '<div class="panel"><h3>公开个人主页</h3><div class="pc-search"><div class="field"><label for="pc-public-name">玩家昵称</label><input id="pc-public-name" maxlength="20" placeholder="输入游戏昵称"></div><button id="pc-public-search" class="primary" type="button">查看主页</button></div><div id="pc-public-result" style="margin-top:14px"><p class="pc-muted">输入昵称即可查看公开主页。登录后也可以直接查看自己的主页。</p></div></div>',
    '<div class="panel"><h3>我的玩家资料</h3><p id="pc-login-hint" class="pc-muted">登录后可查看个人数据。</p><div id="pc-personal" class="hidden"><div class="pc-tabs" role="tablist"><button type="button" data-page="overview" class="active">总览</button><button type="button" data-page="matches">对战记录</button><button type="button" data-page="tokens">代币中心</button><button type="button" data-page="inventory">卡牌收藏</button><button type="button" data-page="draw">抽卡</button><button type="button" data-page="achievements">成就收藏册</button></div><div id="pc-personal-content"></div><div id="pc-display-editor" style="margin-top:20px;border-top:1px solid #383d50;padding-top:16px"><h4>主页展示设置</h4><p class="pc-muted">只能选择已经解锁的成就。称号选择一项，主页徽章最多三项。</p><div class="field"><label for="pc-title-choice">个人称号</label><select id="pc-title-choice"><option value="">不展示称号</option></select></div><div class="field"><label>主页徽章（最多三个）</label><div id="pc-badge-choices" class="pc-grid"></div></div><button id="pc-save-display" type="button">保存主页展示</button><p id="pc-display-status" class="status"></p></div></div></div>',
    '<div id="pc-admin-panel" class="panel hidden"><h3>管理员 · 玩家管理</h3><p class="pc-muted">新玩家先注册账号，再由管理员把账号绑定到现有玩家编号。绑定后会自动导入该编号原有的收藏数据。</p><div class="pc-grid"><div class="field"><label for="pc-bind-number">待分配玩家编号</label><select id="pc-bind-number"></select></div><div class="field"><label for="pc-bind-user">绑定到已注册账号</label><select id="pc-bind-user"></select></div></div><button id="pc-bind-submit" type="button">绑定玩家编号并导入旧收藏</button><p id="pc-bind-status" class="status"></p><div id="pc-bind-list" class="pc-muted"></div><h4 style="margin-top:22px">收藏库存调整</h4><p class="pc-muted">用于发放活动卡牌或修正库存。正数为增加，负数为扣除；系统会阻止扣成负数。</p><form id="pc-inventory-form"><div class="pc-grid"><div class="field"><label for="pc-inventory-user">玩家账号</label><select id="pc-inventory-user" required></select></div><div class="field"><label for="pc-inventory-card">卡牌</label><select id="pc-inventory-card" required></select></div><div class="field"><label for="pc-inventory-delta">调整数量（可为负数）</label><input id="pc-inventory-delta" type="number" step="1" required></div><div class="field"><label for="pc-inventory-reason">调整原因</label><input id="pc-inventory-reason" maxlength="120" required placeholder="例如：活动奖励"></div></div><button type="submit">确认调整库存</button><p id="pc-inventory-status" class="status"></p></form><h3 style="margin-top:24px">管理员 · 比赛管理</h3><p class="pc-muted">登记或更正四人 2v2 比赛。提交后系统会重算四名玩家的场次、胜负和胜率，并检查比赛成就。</p><form id="pc-match-form"><input id="pc-match-id" type="hidden"><div class="field"><label for="pc-match-description">比赛备注（可选）</label><input id="pc-match-description" maxlength="120" placeholder="例如：周末友谊赛"></div><div class="pc-grid"><div class="field"><label for="pc-blue-1">蓝队玩家 1</label><select id="pc-blue-1" required></select></div><div class="field"><label for="pc-blue-2">蓝队玩家 2</label><select id="pc-blue-2" required></select></div><div class="field"><label for="pc-red-1">红队玩家 1</label><select id="pc-red-1" required></select></div><div class="field"><label for="pc-red-2">红队玩家 2</label><select id="pc-red-2" required></select></div></div><div class="field"><label for="pc-winning-team">获胜队伍</label><select id="pc-winning-team"><option value="blue">蓝队胜利</option><option value="red">红队胜利</option></select></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="primary" type="submit" id="pc-match-submit">登记比赛</button><button type="button" id="pc-match-cancel" class="hidden">取消更正</button></div><p id="pc-match-status" class="status" style="margin-top:10px"></p></form><h4 style="margin-top:22px">卡池设置</h4><p class="pc-muted">价格和星级概率由管理员设置。卡池未设置并保存前不会开放。</p><div id="pc-admin-pool-list" class="pc-muted">正在读取卡池状态……</div><form id="pc-pool-form"><div class="pc-grid"><div class="field"><label for="pc-pool-id">卡包</label><select id="pc-pool-id"><option value="pack_001">无限泡影</option><option value="pack_002">梦幻</option></select></div><div class="field"><label for="pc-pool-price">单抽价格（代币）</label><input id="pc-pool-price" type="number" min="1" step="1" required></div><div class="field"><label for="pc-pool-r3">三星概率（%）</label><input id="pc-pool-r3" type="number" min="0" max="100" step="1" required></div><div class="field"><label for="pc-pool-r4">四星概率（%）</label><input id="pc-pool-r4" type="number" min="0" max="100" step="1" required></div><div class="field"><label for="pc-pool-r5">五星概率（%）</label><input id="pc-pool-r5" type="number" min="0" max="100" step="1" required></div></div><button type="submit">保存并开放卡池</button><p id="pc-pool-status" class="status"></p></form><h4 style="margin-top:22px">代币发放</h4><form id="pc-token-form"><div class="pc-grid"><div class="field"><label for="pc-token-player">玩家</label><select id="pc-token-player" required></select></div><div class="field"><label for="pc-token-amount">发放数量</label><input id="pc-token-amount" type="number" min="1" step="1" required></div><div class="field"><label for="pc-token-reason">发放原因</label><input id="pc-token-reason" maxlength="120" placeholder="例如：活动奖励" required></div></div><button type="submit">确认发放代币</button><p id="pc-token-status" class="status"></p></form><h4 style="margin-top:22px">成就管理</h4><p class="pc-muted">创建或编辑成就名称、说明、解锁条件、启用状态和首次解锁奖励。停用成就不会删除已经获得的记录。</p><form id="pc-achievement-form"><div class="pc-grid"><div class="field"><label for="pc-ach-id">成就 ID（创建后不可更改）</label><input id="pc-ach-id" maxlength="50" pattern="[a-z0-9][a-z0-9_-]{1,49}" placeholder="例如：matches_100" required></div><div class="field"><label for="pc-ach-name">成就名称</label><input id="pc-ach-name" maxlength="40" required></div><div class="field"><label for="pc-ach-description">成就描述</label><input id="pc-ach-description" maxlength="160" required></div><div class="field"><label for="pc-ach-reward">首次解锁奖励（代币）</label><input id="pc-ach-reward" type="number" min="0" step="1" value="0" required></div><div class="field"><label for="pc-ach-type">解锁条件</label><select id="pc-ach-type"><option value="matches">完成比赛场次</option><option value="wins">累计胜场</option><option value="win_streak">连续胜场</option><option value="win_rate">比赛胜率</option><option value="collection">拥有不同卡牌</option><option value="draws">累计抽卡次数</option></select></div><div class="field"><label for="pc-ach-threshold">达成目标</label><input id="pc-ach-threshold" type="number" min="1" step="1" value="1" required></div><div class="field" id="pc-ach-min-games-wrap"><label for="pc-ach-min-games">计算胜率至少需要的比赛场次</label><input id="pc-ach-min-games" type="number" min="1" step="1" value="10"></div></div><label style="display:flex;align-items:center;gap:8px;margin:10px 0"><input id="pc-ach-active" type="checkbox" checked> 启用此成就（允许新玩家解锁）</label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" type="submit" id="pc-ach-submit">创建成就</button><button type="button" id="pc-ach-reset">清空表单</button></div><p id="pc-ach-status" class="status"></p></form><h4 style="margin-top:18px">现有成就</h4><div id="pc-admin-achievement-list" class="pc-muted">正在读取……</div><h4 style="margin-top:22px">最近登记的比赛</h4><div id="pc-admin-match-list" class="pc-muted">正在读取……</div></div>'
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
    let titleName="尚未设置称号";
    if(profile?.selected_title){const titleResult=await client.from("achievements").select("name").eq("id",profile.selected_title).maybeSingle();if(titleResult.error)throw titleResult.error;titleName=titleResult.data?.name||"已设置称号";}
    contentEl.replaceChildren(node("h3","",profile?.username||"玩家"));
    contentEl.appendChild(node("p","pc-muted",titleName+" · 加入于 "+(profile?.created_at?new Date(profile.created_at).toLocaleDateString("zh-CN"):"未知")));
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


  async function loadDisplayChoices() {
    const titleSelect=view.querySelector("#pc-title-choice");
    const badgeWrap=view.querySelector("#pc-badge-choices");
    const status=view.querySelector("#pc-display-status");
    const [{data:profile,error:pe},{data:unlocked,error:ue},{data:achievements,error:ae}]=await Promise.all([
      client.from("profiles").select("selected_title,selected_badges").eq("id",currentUser.id).maybeSingle(),
      client.from("player_achievements").select("achievement_id").eq("user_id",currentUser.id),
      client.from("achievements").select("id,name,description").order("name")
    ]);
    if(pe)throw pe;if(ue)throw ue;if(ae)throw ae;
    const unlockedIds=new Set((unlocked||[]).map(row=>row.achievement_id));
    const available=(achievements||[]).filter(item=>unlockedIds.has(item.id));
    titleSelect.replaceChildren(new Option("不展示称号",""));
    available.forEach(item=>titleSelect.add(new Option(item.name,item.id)));
    titleSelect.value=profile?.selected_title||"";
    badgeWrap.replaceChildren();
    const selected=new Set(profile?.selected_badges||[]);
    available.forEach(item=>{
      const label=node("label","pc-stat");
      label.style.display="flex";label.style.alignItems="center";label.style.gap="8px";
      const checkbox=node("input");checkbox.type="checkbox";checkbox.value=item.id;checkbox.checked=selected.has(item.id);
      checkbox.addEventListener("change",()=>{
        const checked=[...badgeWrap.querySelectorAll('input[type="checkbox"]:checked')];
        if(checked.length>3){checkbox.checked=false;status.textContent="主页徽章最多选择三个。";status.className="status bad";}
        else{status.textContent="";status.className="status";}
      });
      label.append(checkbox,node("span","",item.name));
      label.title=item.description||"";
      badgeWrap.appendChild(label);
    });
    if(!available.length)badgeWrap.appendChild(node("p","pc-muted","解锁成就后，就可以选择主页徽章。"));
    status.textContent="";
  }
  view.querySelector("#pc-save-display").addEventListener("click",async()=>{
    const status=view.querySelector("#pc-display-status");
    const button=view.querySelector("#pc-save-display");
    const titleId=view.querySelector("#pc-title-choice").value||null;
    const badgeIds=[...view.querySelectorAll("#pc-badge-choices input:checked")].map(input=>input.value);
    if(badgeIds.length>3){status.textContent="主页徽章最多选择三个。";status.className="status bad";return;}
    button.disabled=true;status.textContent="正在保存……";status.className="status";
    try{
      const {error}=await client.rpc("save_profile_display",{p_title_id:titleId,p_badge_ids:badgeIds});
      if(error)throw error;
      status.textContent="主页展示设置已保存。";status.className="status good";
    }catch(error){status.textContent="保存失败："+error.message;status.className="status bad";}
    finally{button.disabled=false;}
  });


  let drawPools=[];
  let drawBusy=false;
  // Persist uncertain draw request IDs so refreshing the page cannot accidentally charge twice.
  const pendingDrawRequests = new Map();
  function drawRequestStorageKey(packId) {
    return "acg-pending-draw:" + currentUser.id + ":" + packId;
  }
  function getDrawRequestId(packId) {
    let requestId = pendingDrawRequests.get(packId);
    if (requestId) return requestId;
    try { requestId = localStorage.getItem(drawRequestStorageKey(packId)); } catch (_) {}
    if (!requestId) {
      requestId = crypto.randomUUID();
      try { localStorage.setItem(drawRequestStorageKey(packId), requestId); } catch (_) {}
    }
    pendingDrawRequests.set(packId, requestId);
    return requestId;
  }
  function clearDrawRequestId(packId) {
    pendingDrawRequests.delete(packId);
    try { localStorage.removeItem(drawRequestStorageKey(packId)); } catch (_) {}
  }
  async function loadDraw() {
    const {data:pools,error}=await client.from("card_draw_pools").select("pack_id,pack_name,price_tokens,rate_3,rate_4,rate_5,enabled").eq("enabled",true).order("pack_id");
    if(error)throw error;
    drawPools=pools||[];
    const {data:stats,error:statsError}=await client.from("player_stats").select("tokens").eq("user_id",currentUser.id).maybeSingle();
    if(statsError)throw statsError;
    const [{data:history,error:historyError,count:drawCount},{data:packRows,error:packError}]=await Promise.all([
      client.from("card_draw_history").select("id,pack_id,card_id,cost_tokens,created_at",{count:"exact"}).eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(20),
      client.from("card_draw_pools").select("pack_id,pack_name")
    ]);
    if(historyError)throw historyError;
    if(packError)throw packError;
    const packNames=Object.fromEntries((packRows||[]).map(pack=>[pack.pack_id,pack.pack_name]));
    contentEl.replaceChildren();
    const balance=node("div","pc-stat","当前代币："+(stats?.tokens??0));
    contentEl.appendChild(balance);
    if(!drawPools.length){contentEl.appendChild(node("div","pc-empty","目前没有开放的卡池。请等待管理员完成卡池价格和概率设置。"));}
    drawPools.forEach(pool=>{
      const card=node("div","pc-stat");
      card.append(node("h3","",pool.pack_name),node("p","pc-muted","单抽："+pool.price_tokens+" 代币 · 三星 "+pool.rate_3+"% · 四星 "+pool.rate_4+"% · 五星 "+pool.rate_5+"%"));
      const button=node("button","primary","单抽");
      button.type="button";
      button.addEventListener("click",()=>performDraw(pool));
      card.appendChild(button);contentEl.appendChild(card);
    });
    contentEl.appendChild(node("h3","","抽卡记录 · 累计 "+(drawCount??0)+" 抽"));
    if(!history?.length){contentEl.appendChild(node("div","pc-empty","还没有抽卡记录。"));return;}
    history.forEach(item=>{
      const info=cardsById[item.card_id]||{name:item.card_id};
      const row=node("div","pc-row"),left=node("div"),details=node("div","pc-muted");
      left.style.display="flex";left.style.alignItems="center";left.style.gap="12px";
      if(info.image){
        const img=node("img");img.src=info.image;img.alt=info.name;img.loading="lazy";
        img.style.cssText="width:48px;height:66px;object-fit:contain;border-radius:5px";
        left.appendChild(img);
      }
      details.append(node("strong","",info.name),node("div","pc-muted",(info.star||"")+" 星 · "+(packNames[item.pack_id]||item.pack_id)),node("div","pc-muted",new Date(item.created_at).toLocaleString("zh-CN")));
      left.appendChild(details);
      row.append(left,node("span","pc-muted","-"+item.cost_tokens+" 代币"));
      contentEl.appendChild(row);
    });
  }
  async function performDraw(pool) {
    if(drawBusy)return;
    drawBusy=true;
    const buttons=[...contentEl.querySelectorAll("button")];buttons.forEach(button=>button.disabled=true);
    const requestId=getDrawRequestId(pool.pack_id);
    const loading=node("p","pc-muted","正在抽取，请稍候……");
    contentEl.prepend(loading);
    try{
      const {data,error}=await client.rpc("draw_one_card",{p_pack_id:pool.pack_id,p_request_id:requestId});
      if(error)throw error;
      const result=Array.isArray(data)?data[0]:data;
      if(!result?.card_id)throw new Error("服务器没有返回有效的抽卡结果，请重试；系统会使用同一请求编号避免重复扣费。");
      // The server has confirmed this draw. A future deliberate draw must use a fresh request ID.
      clearDrawRequestId(pool.pack_id);
      const info=cardsById[result.card_id]||{name:result.card_id};
      loading.remove();
      const box=node("div","pc-stat");
      box.append(node("h3","","抽卡结果"),node("strong","",info.name),node("p","pc-muted",(info.star||"")+" 星 · 剩余代币："+result.remaining_tokens));
      if(info.image){
        const img=node("img");img.src=info.image;img.alt=info.name;img.loading="lazy";img.style.cssText="display:block;max-width:180px;max-height:250px;object-fit:contain;margin:12px auto";
        box.appendChild(img);
      }
      if(result.duplicate_request)box.appendChild(node("p","pc-muted","本次请求已处理，已返回原抽卡结果，没有重复扣费。"));
      contentEl.prepend(box);
      await loadDraw();
    }catch(error){
      loading.textContent="抽卡失败："+error.message;
      loading.className="pc-empty";
    }finally{
      drawBusy=false;
      contentEl.querySelectorAll("button").forEach(button=>button.disabled=false);
    }
  }
  async function loadAchievements() {
    const [{data:all,error:ae},{data:owned,error:oe}]=await Promise.all([
      client.from("achievements").select("id,name,description,is_active").order("id"),
      client.from("player_achievements").select("achievement_id,unlocked_at").eq("user_id",currentUser.id)
    ]);
    if(ae)throw ae;if(oe)throw oe;
    const map=Object.fromEntries((owned||[]).map(item=>[item.achievement_id,item.unlocked_at]));
    const visible=(all||[]).filter(item=>item.is_active!==false||Object.prototype.hasOwnProperty.call(map,item.id));
    contentEl.replaceChildren(node("p","pc-muted","已解锁 "+Object.keys(map).length+" 项 · 当前可见 "+visible.length+" 项成就"));
    if(!visible.length){contentEl.appendChild(node("div","pc-empty","目前没有启用的成就。"));return;}
    visible.forEach(item=>{
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
      else if(page==="draw")await loadDraw();
      else if(page==="achievements")await loadAchievements();
      await loadDisplayChoices();
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
    const tokenSelect=view.querySelector("#pc-token-player");
    const previousToken=tokenSelect.value;
    tokenSelect.replaceChildren(new Option("请选择玩家",""));
    adminPlayers.forEach(player=>tokenSelect.add(new Option(player.username,player.id)));
    if(adminPlayers.some(player=>player.id===previousToken))tokenSelect.value=previousToken;
  }
  async function checkAdmin() {
    try {
      const {data,error}=await client.from("profiles").select("is_admin").eq("id",currentUser.id).maybeSingle();
      if(error)throw error;
      if(!data?.is_admin){adminPanel.classList.add("hidden");return;}
      adminPanel.classList.remove("hidden");
      const {data:players,error:playersError}=await client.from("profiles").select("id,username,player_number").order("username");
      if(playersError)throw playersError;
      adminPlayers=players||[];
      fillPlayerSelects();
      await loadCardNames();
      fillInventoryAdminSelects();
      await loadAdminBindings();
      await loadAdminMatches();
      await loadAdminAchievements();
      await loadAdminPools();
    } catch(error) {
      adminPanel.classList.add("hidden");
      setStatus("管理员资料读取失败："+error.message,true);
    }
  }
  function fillInventoryAdminSelects(){
    const userSelect=view.querySelector("#pc-inventory-user");
    const cardSelect=view.querySelector("#pc-inventory-card");
    userSelect.replaceChildren(new Option("请选择玩家账号",""));
    adminPlayers.forEach(player=>userSelect.add(new Option(player.username+(player.player_number?" · "+player.player_number:" · 未绑定"),player.id)));
    cardSelect.replaceChildren(new Option("请选择卡牌",""));
    Object.values(cardsById).sort((a,b)=>a.name.localeCompare(b.name,"zh-CN")).forEach(card=>{
      cardSelect.add(new Option(card.name+" · "+card.id,card.id));
    });
  }
  view.querySelector("#pc-inventory-form").addEventListener("submit",async event=>{
    event.preventDefault();
    const form=event.currentTarget,button=form.querySelector("button[type=submit]");
    const status=view.querySelector("#pc-inventory-status");
    const userId=view.querySelector("#pc-inventory-user").value;
    const cardId=view.querySelector("#pc-inventory-card").value;
    const delta=Number(view.querySelector("#pc-inventory-delta").value);
    const reason=view.querySelector("#pc-inventory-reason").value.trim();
    if(!userId||!cardId||!Number.isSafeInteger(delta)||delta===0||!reason){
      status.textContent="请选择玩家和卡牌，填写非零整数数量及原因。";status.className="status bad";return;
    }
    button.disabled=true;status.textContent="正在调整库存……";status.className="status";
    try{
      const {data,error}=await client.rpc("admin_adjust_card_inventory",{
        p_user_id:userId,p_card_id:cardId,p_delta:delta,p_reason:reason
      });
      if(error)throw error;
      status.textContent="库存调整成功，当前数量："+data;status.className="status good";
      view.querySelector("#pc-inventory-delta").value="";
      view.querySelector("#pc-inventory-reason").value="";
    }catch(error){status.textContent="调整失败："+error.message;status.className="status bad";}
    finally{button.disabled=false;}
  });

  async function loadAdminBindings(){
    const numberSelect=view.querySelector("#pc-bind-number");
    const userSelect=view.querySelector("#pc-bind-user");
    const list=view.querySelector("#pc-bind-list");
    const status=view.querySelector("#pc-bind-status");
    const [{data:registry,error:re},{data:accounts,error:ae}]=await Promise.all([
      client.rpc("admin_list_player_registry"),
      client.rpc("admin_list_player_accounts")
    ]);
    if(re)throw re;if(ae)throw ae;
    numberSelect.replaceChildren(new Option("请选择未绑定编号",""));
    (registry||[]).filter(row=>!row.assigned_user_id).forEach(row=>{
      numberSelect.add(new Option(row.player_number+" · "+row.display_name,row.player_number));
    });
    userSelect.replaceChildren(new Option("请选择尚未绑定编号的账号",""));
    (accounts||[]).filter(row=>!row.player_number).forEach(row=>{
      userSelect.add(new Option(row.username+" · "+row.user_id.slice(0,8),row.user_id));
    });
    list.replaceChildren();
    (registry||[]).forEach(row=>{
      const line=node("div","pc-row");
      const account=(accounts||[]).find(item=>item.user_id===row.assigned_user_id);
      line.append(node("span","",row.player_number+" · "+row.display_name),
        node("strong","",account?("已绑定："+account.username):"尚未绑定"));
      list.appendChild(line);
    });
    status.textContent="共 "+(registry||[]).length+" 个玩家编号，"+(accounts||[]).length+" 个注册账号。";
    status.className="status";
  }
  view.querySelector("#pc-bind-submit").addEventListener("click",async()=>{
    const userId=view.querySelector("#pc-bind-user").value;
    const playerNumber=view.querySelector("#pc-bind-number").value;
    const status=view.querySelector("#pc-bind-status");
    const button=view.querySelector("#pc-bind-submit");
    if(!userId||!playerNumber){status.textContent="请选择玩家编号和注册账号。";status.className="status bad";return;}
    if(!confirm("确认将 "+playerNumber+" 绑定到所选账号？绑定后会把旧收藏导入该账号，不能在网页中自行更换。"))return;
    button.disabled=true;status.textContent="正在绑定并导入收藏……";status.className="status";
    try{
      const {data,error}=await client.rpc("admin_assign_player_number",{p_user_id:userId,p_player_number:playerNumber});
      if(error)throw error;
      status.textContent="绑定成功，旧收藏导入 "+data+" 条。";status.className="status good";
      await loadAdminBindings();
      const {data:players,error:playersError}=await client.from("profiles").select("id,username,player_number").order("username");
      if(playersError)throw playersError;
      adminPlayers=players||[];fillPlayerSelects();
    }catch(error){status.textContent="绑定失败："+error.message;status.className="status bad";}
    finally{button.disabled=false;}
  });

  const achievementForm=view.querySelector("#pc-achievement-form");
  const achievementType=view.querySelector("#pc-ach-type");
  const minGamesWrap=view.querySelector("#pc-ach-min-games-wrap");
  function resetAchievementForm(){
    achievementForm.reset();
    view.querySelector("#pc-ach-id").readOnly=false;
    view.querySelector("#pc-ach-submit").textContent="创建成就";
    view.querySelector("#pc-ach-min-games").value="10";
    view.querySelector("#pc-ach-reward").value="0";
    view.querySelector("#pc-ach-active").checked=true;
    view.querySelector("#pc-ach-status").textContent="";
    syncAchievementConditionFields();
  }
  function syncAchievementConditionFields(){
    const isRate=achievementType.value==="win_rate";
    minGamesWrap.classList.toggle("hidden",!isRate);
    view.querySelector("#pc-ach-min-games").required=isRate;
  }
  achievementType.addEventListener("change",syncAchievementConditionFields);
  view.querySelector("#pc-ach-reset").addEventListener("click",resetAchievementForm);
  async function loadAdminAchievements(){
    const list=view.querySelector("#pc-admin-achievement-list");
    list.replaceChildren(node("p","pc-muted","正在读取成就配置……"));
    const {data,error}=await client.from("achievements")
      .select("id,name,description,reward_tokens,is_active,condition_type,threshold,min_games").order("id");
    if(error)throw error;
    list.replaceChildren();
    if(!data?.length){list.appendChild(node("div","pc-empty","暂无成就配置。"));return;}
    const typeNames={matches:"完成比赛场次",wins:"累计胜场",win_streak:"连续胜场",win_rate:"比赛胜率",collection:"拥有不同卡牌",draws:"累计抽卡次数"};
    data.forEach(item=>{
      const row=node("div","pc-row"),info=node("div"),actions=node("div");
      const goal=item.condition_type==="win_rate"
        ? "胜率达到 "+item.threshold+"%，且至少完成 "+item.min_games+" 场比赛"
        : typeNames[item.condition_type]+"达到 "+item.threshold;
      info.append(node("strong","",item.name),node("div","pc-muted",item.description||""));
      info.append(node("div","pc-muted",goal+" · 首次解锁奖励 "+item.reward_tokens+" 代币 · "+(item.is_active?"已启用":"已停用")));
      actions.style.display="flex";actions.style.alignItems="center";
      const edit=node("button","","编辑");edit.type="button";
      edit.addEventListener("click",()=>{
        view.querySelector("#pc-ach-id").value=item.id;
        view.querySelector("#pc-ach-id").readOnly=true;
        view.querySelector("#pc-ach-name").value=item.name;
        view.querySelector("#pc-ach-description").value=item.description||"";
        view.querySelector("#pc-ach-reward").value=String(item.reward_tokens??0);
        achievementType.value=item.condition_type||"matches";
        view.querySelector("#pc-ach-threshold").value=String(item.threshold??1);
        view.querySelector("#pc-ach-min-games").value=String(item.min_games??10);
        view.querySelector("#pc-ach-active").checked=item.is_active!==false;
        view.querySelector("#pc-ach-submit").textContent="保存成就修改";
        view.querySelector("#pc-ach-status").textContent="正在编辑「"+item.name+"」。成就 ID 保持不变。";
        syncAchievementConditionFields();
        achievementForm.scrollIntoView({behavior:"smooth",block:"center"});
      });
      actions.appendChild(edit);
      row.append(info,actions);
      list.appendChild(row);
    });
  }
  achievementForm.addEventListener("submit",async event=>{
    event.preventDefault();
    const status=view.querySelector("#pc-ach-status");
    const button=view.querySelector("#pc-ach-submit");
    const type=achievementType.value;
    const threshold=Number(view.querySelector("#pc-ach-threshold").value);
    const reward=Number(view.querySelector("#pc-ach-reward").value);
    const minGames=type==="win_rate"?Number(view.querySelector("#pc-ach-min-games").value):0;
    const args={
      p_id:view.querySelector("#pc-ach-id").value.trim(),
      p_name:view.querySelector("#pc-ach-name").value.trim(),
      p_description:view.querySelector("#pc-ach-description").value.trim(),
      p_reward_tokens:reward,
      p_is_active:view.querySelector("#pc-ach-active").checked,
      p_condition_type:type,
      p_threshold:threshold,
      p_min_games:minGames
    };
    if(!/^[a-z0-9][a-z0-9_-]{1,49}$/.test(args.p_id)){
      status.textContent="成就 ID 需为 2–50 位小写字母、数字、下划线或短横线。";status.className="status bad";return;
    }
    if(!args.p_name||args.p_name.length>40||!args.p_description||args.p_description.length>160||
       !Number.isSafeInteger(reward)||reward<0||!Number.isFinite(threshold)||threshold<=0||
       (type!=="win_rate"&&!Number.isSafeInteger(threshold))||
       (type==="win_rate"&&(threshold>100||!Number.isSafeInteger(minGames)||minGames<1))){
      status.textContent="请检查名称、描述、奖励和解锁目标是否填写正确。";status.className="status bad";return;
    }
    button.disabled=true;status.textContent="正在保存成就……";status.className="status";
    try{
      const {error}=await client.rpc("admin_save_achievement",args);
      if(error)throw error;
      status.textContent="成就已保存。新解锁的玩家将按当前条件获得奖励；已解锁记录不会重置。";
      status.className="status good";
      resetAchievementForm();
      await loadAdminAchievements();
    }catch(error){status.textContent="保存失败："+error.message;status.className="status bad";}
    finally{button.disabled=false;}
  });
  syncAchievementConditionFields();

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
  async function loadAdminPools(){
    const list=view.querySelector("#pc-admin-pool-list");
    list.replaceChildren(node("p","pc-muted","正在读取卡池状态……"));
    const {data,error}=await client.from("card_draw_pools")
      .select("pack_id,pack_name,price_tokens,rate_3,rate_4,rate_5,enabled").order("pack_id");
    if(error)throw error;
    list.replaceChildren();
    if(!data?.length){list.appendChild(node("div","pc-empty","没有卡池配置。"));return;}
    data.forEach(pool=>{
      const row=node("div","pc-row"),info=node("div"),actions=node("div");
      const ready=pool.price_tokens!==null&&pool.rate_3!==null&&pool.rate_4!==null&&pool.rate_5!==null;
      const config=ready
        ? "单抽 "+pool.price_tokens+" 代币 · 三星 "+pool.rate_3+"% / 四星 "+pool.rate_4+"% / 五星 "+pool.rate_5+"%"
        : "尚未设置价格和概率";
      info.append(node("strong","",pool.pack_name),node("div","pc-muted",config),
        node("div",pool.enabled?"pc-positive":"pc-muted",pool.enabled?"开放中":"未开放"));
      actions.style.display="flex";actions.style.alignItems="center";
      const edit=node("button","","载入设置");edit.type="button";
      edit.addEventListener("click",()=>{
        view.querySelector("#pc-pool-id").value=pool.pack_id;
        view.querySelector("#pc-pool-price").value=pool.price_tokens??"";
        view.querySelector("#pc-pool-r3").value=pool.rate_3??"";
        view.querySelector("#pc-pool-r4").value=pool.rate_4??"";
        view.querySelector("#pc-pool-r5").value=pool.rate_5??"";
        view.querySelector("#pc-pool-status").textContent="已载入 "+pool.pack_name+" 的现有设置；点击保存才会开放或重新开放卡池。";
        view.querySelector("#pc-pool-status").className="status";
      });
      actions.appendChild(edit);
      if(pool.enabled){
        const pause=node("button","","暂停卡池");pause.type="button";
        pause.addEventListener("click",async()=>{
          if(!confirm("确定暂停「"+pool.pack_name+"」？玩家将无法继续抽取，历史记录和收藏不会受影响。"))return;
          pause.disabled=true;
          try{
            const {error:pauseError}=await client.rpc("admin_disable_draw_pool",{p_pack_id:pool.pack_id});
            if(pauseError)throw pauseError;
            await loadAdminPools();
          }catch(error){
            view.querySelector("#pc-pool-status").textContent="暂停失败："+error.message;
            view.querySelector("#pc-pool-status").className="status bad";
            pause.disabled=false;
          }
        });
        actions.appendChild(pause);
      }
      row.append(info,actions);list.appendChild(row);
    });
  }

  view.querySelector("#pc-pool-form").addEventListener("submit",async event=>{
    event.preventDefault();
    const form=event.currentTarget,button=form.querySelector("button[type=submit]"),status=view.querySelector("#pc-pool-status");
    const values={
      p_pack_id:view.querySelector("#pc-pool-id").value,
      p_price_tokens:Number(view.querySelector("#pc-pool-price").value),
      p_rate_3:Number(view.querySelector("#pc-pool-r3").value),
      p_rate_4:Number(view.querySelector("#pc-pool-r4").value),
      p_rate_5:Number(view.querySelector("#pc-pool-r5").value)
    };
    if(!Number.isSafeInteger(values.p_price_tokens)||values.p_price_tokens<=0||
       [values.p_rate_3,values.p_rate_4,values.p_rate_5].some(x=>!Number.isInteger(x)||x<0||x>100)||
       values.p_rate_3+values.p_rate_4+values.p_rate_5!==100){
      status.textContent="价格必须为正整数，三种星级概率必须为 0–100 的整数且总和为 100。";status.className="status bad";return;
    }
    button.disabled=true;status.textContent="正在保存卡池……";status.className="status";
    try{
      const {error}=await client.rpc("admin_set_draw_pool",values);
      if(error)throw error;
      status.textContent="卡池设置成功，玩家现在可以抽取。";status.className="status good";
      await loadAdminPools();
    }catch(error){status.textContent="保存失败："+error.message;status.className="status bad";}
    finally{button.disabled=false;}
  });

  view.querySelector("#pc-token-form").addEventListener("submit",async event=>{
    event.preventDefault();
    const status=view.querySelector("#pc-token-status");
    const button=event.currentTarget.querySelector("button[type=submit]");
    const userId=view.querySelector("#pc-token-player").value;
    const amount=Number(view.querySelector("#pc-token-amount").value);
    const reason=view.querySelector("#pc-token-reason").value.trim();
    if(!userId||!Number.isSafeInteger(amount)||amount<=0||!reason){status.textContent="请填写有效的玩家、数量和原因。";status.className="status bad";return;}
    button.disabled=true;status.textContent="正在发放……";status.className="status";
    try{
      const {data,error}=await client.rpc("admin_grant_tokens",{p_user_id:userId,p_amount:amount,p_reason:reason});
      if(error)throw error;
      status.textContent="发放成功。玩家当前余额："+data;
      status.className="status good";
      view.querySelector("#pc-token-amount").value="";
      view.querySelector("#pc-token-reason").value="";
    }catch(error){status.textContent="发放失败："+error.message;status.className="status bad";}
    finally{button.disabled=false;}
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