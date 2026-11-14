(() => {
  "use strict";
  const client = window.acgSupabaseClient;
  const main = document.querySelector("main");
  const nav = document.querySelector("nav.tabs");
  if (!client || !main || !nav || document.getElementById("player-center-view")) return;

  const style = document.createElement("style");
  style.textContent = "#player-center-view .pc-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#player-center-view .pc-tabs button{padding:8px 12px}#player-center-view .pc-tabs button.active{background:#5967a5;border-color:#7181c7}#player-center-view .pc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:12px 0}#player-center-view .pc-stat{padding:14px;background:#222536;border:1px solid #383d50;border-radius:10px}#player-center-view .pc-stat strong{display:block;font-size:22px;margin-top:5px}#player-center-view .pc-row{display:flex;justify-content:space-between;gap:12px;padding:12px 4px;border-bottom:1px solid #383d50}#player-center-view .pc-muted{color:#a6abc0;font-size:13px;line-height:1.6}#player-center-view .pc-positive{color:#8bd5a7}#player-center-view .pc-negative{color:#ff9b9b}#player-center-view .pc-search{display:flex;gap:8px;align-items:end;flex-wrap:wrap}#player-center-view .pc-search .field{flex:1;min-width:190px}#player-center-view .pc-empty{padding:18px;text-align:center;color:#a6abc0;background:#222536;border:1px solid #383d50;border-radius:10px}#player-center-view .pc-draw-card{display:flex;align-items:center;gap:14px;padding:12px;border:1px solid #383d50;border-radius:10px;margin:10px 0}#player-center-view .pc-draw-card img{width:84px;height:116px;object-fit:contain;border-radius:6px}#player-center-view .pc-draw-card .pc-draw-info{flex:1}#player-center-view .pc-inventory-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin-top:12px}#player-center-view .pc-inventory-card{display:flex;gap:10px;align-items:center;min-width:0;padding:9px;background:#222536;border:1px solid #383d50;border-radius:10px}#player-center-view .pc-inventory-card img{width:58px;height:82px;object-fit:contain;flex:0 0 auto;border-radius:5px;background:#151824}#player-center-view .pc-inventory-card .pc-card-info{flex:1;min-width:0}#player-center-view .pc-inventory-card .pc-card-info strong{display:block;overflow-wrap:anywhere;font-size:13px}#player-center-view .pc-inventory-card .pc-card-info small{display:block;color:#a6abc0;font-size:11px;margin-top:4px}#player-center-view .pc-quantity-controls{display:flex;align-items:center;gap:6px;margin-top:7px}#player-center-view .pc-quantity-controls button{min-width:30px;width:30px;height:30px;padding:0;font-size:18px}#player-center-view .pc-quantity-controls strong{min-width:22px;text-align:center;font-variant-numeric:tabular-nums}#player-center-view .pc-quantity-controls button:disabled{opacity:.35;cursor:not-allowed}@media(max-width:600px){#player-center-view .pc-row{align-items:flex-start;flex-direction:column;gap:4px}}";
  style.textContent += "#acg-ten-draw{position:fixed;inset:0;z-index:99999;background:radial-gradient(ellipse at 50% 0%,#38465b 0,#111827 55%,#050811 100%);color:#edf4ff;display:flex;flex-direction:column;overflow:auto;font-family:Inter,\"Microsoft YaHei\",sans-serif}#acg-ten-draw *{box-sizing:border-box}#acg-ten-draw .acg-td-top{padding:14px 22px;border-bottom:1px solid #ffffff22;background:#070b13d9;display:flex;justify-content:space-between;align-items:center;gap:12px}#acg-ten-draw .acg-td-brand{font-weight:1000;letter-spacing:3px}#acg-ten-draw .acg-td-brand b{color:#f3d36f}#acg-ten-draw .acg-td-balance{font-size:11px;color:#f5d98c;border:1px solid #8e7948;padding:7px 10px}#acg-ten-draw .acg-td-main{width:min(1120px,100%);margin:auto;padding:22px 18px 45px}#acg-ten-draw .acg-td-title{text-align:center;margin:0 0 20px}#acg-ten-draw .acg-td-title small{color:#8dddf5;letter-spacing:4px;font-weight:800}#acg-ten-draw .acg-td-title h2{font-size:clamp(24px,4vw,36px);letter-spacing:3px;margin:7px 0}#acg-ten-draw .acg-td-title p{font-size:12px;color:#aab8ca;margin:0}#acg-ten-draw .acg-td-stage{position:relative;border:1px solid #56637a;background:radial-gradient(ellipse at 50% 42%,#414b5d 0,#222b3d 40%,#111827 78%);padding:22px 16px;box-shadow:0 20px 55px #0009,inset 0 0 55px #0008}#acg-ten-draw .acg-td-stage:before{content:\"\";position:absolute;inset:8px;border:1px solid #c2a65b55;pointer-events:none}#acg-ten-draw .acg-td-stagehead{text-align:center;position:relative;z-index:1}#acg-ten-draw .acg-td-stagehead b{color:#f5d77f;letter-spacing:3px;font-size:14px}#acg-ten-draw .acg-td-stagehead p{font-size:11px;color:#aab8ca;margin:6px 0 0}#acg-ten-draw .acg-td-packs{position:relative;z-index:1;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px 15px;max-width:800px;margin:24px auto 0;perspective:900px}#acg-ten-draw .acg-td-pack{position:relative;aspect-ratio:.69;min-width:0;max-height:220px;border:2px solid #d8bd69;background:radial-gradient(ellipse at 50% 42%,#e2c66b55,transparent 55%),linear-gradient(140deg,#334f71,#17243a 58%,#080d17);box-shadow:0 9px 18px #0009,inset 0 0 22px #7aa4d333;overflow:hidden;animation:acgPackIn .6s both;animation-delay:calc(var(--i)*55ms);transition:.3s}#acg-ten-draw .acg-td-pack:nth-child(n+6){transform:translateY(14px)}#acg-ten-draw .acg-td-pack:before{content:\"\";position:absolute;inset:6px;border:1px solid #e8d28b77}#acg-ten-draw .acg-td-pack:after{content:\"ACG\";position:absolute;left:0;right:0;top:43%;text-align:center;font-size:clamp(17px,2.4vw,27px);font-weight:1000;letter-spacing:4px;color:#f2d989;text-shadow:0 2px 8px #000,0 0 16px #e7be5b}#acg-ten-draw .acg-td-pack.r4{border-color:#9bc5ff;box-shadow:0 0 13px #7ab8ff88,0 9px 18px #0009}#acg-ten-draw .acg-td-pack.r5{border-color:#ffdc69;box-shadow:0 0 22px #ffdb65dd,0 0 5px #fff,0 9px 18px #0009}#acg-ten-draw .acg-td-pack.alt{border-color:#ed9dff;box-shadow:0 0 26px #db80ff,0 0 7px #fff,0 9px 18px #0009}#acg-ten-draw .acg-td-pack.opened{opacity:.28;filter:grayscale(.8)}#acg-ten-draw .acg-td-pack.opened:after{content:\"✓\";font-size:40px;top:36%;color:white}#acg-ten-draw .acg-td-pack span{position:absolute;bottom:10px;left:0;right:0;text-align:center;font-size:9px;letter-spacing:2px;z-index:1;text-shadow:0 2px 5px #000}#acg-ten-draw .acg-td-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:26px auto 0;position:relative;z-index:2}#acg-ten-draw button{cursor:pointer;color:inherit;font:inherit}#acg-ten-draw .acg-td-btn{min-width:145px;padding:12px 20px;border:1px solid #66758b;background:linear-gradient(#25344b,#121d2e);font-weight:900;font-size:12px;letter-spacing:2px}#acg-ten-draw .acg-td-btn.primary{color:#191711;border-color:#fff0b0;background:linear-gradient(110deg,#c59c42,#ffe99b 48%,#d4a34c);box-shadow:0 0 24px #eac65a55}#acg-ten-draw .acg-td-btn:disabled{opacity:.35;cursor:not-allowed}#acg-ten-draw .acg-td-reveal{display:none;margin-top:22px;padding:18px;border:1px solid #53637a;background:#0c1422ed;position:relative;z-index:2}#acg-ten-draw .acg-td-reveal.show{display:block;animation:acgFade .35s}#acg-ten-draw .acg-td-rhead{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:14px}#acg-ten-draw .acg-td-rhead b{font-size:14px;letter-spacing:2px}#acg-ten-draw .acg-td-rhead span{font-size:11px;color:#aab8ca}#acg-ten-draw .acg-td-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}#acg-ten-draw .acg-td-card{min-width:0;perspective:900px;cursor:pointer}#acg-ten-draw .acg-td-inner{position:relative;aspect-ratio:2/2.9;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.2,.75,.2,1)}#acg-ten-draw .acg-td-card.flip .acg-td-inner{transform:rotateY(180deg)}#acg-ten-draw .acg-td-face{position:absolute;inset:0;backface-visibility:hidden;overflow:hidden;border:1px solid #697b92;background:#16243a}#acg-ten-draw .acg-td-back{display:grid;place-items:center;background:repeating-linear-gradient(135deg,#172b45 0 7px,#263d5c 7px 14px)}#acg-ten-draw .acg-td-back:after{content:\"ACG\";font-size:clamp(15px,2vw,24px);font-weight:1000;letter-spacing:3px;color:#d9c17c;text-shadow:0 0 12px #e5c65e}#acg-ten-draw .acg-td-front{transform:rotateY(180deg)}#acg-ten-draw .acg-td-front img{width:100%;height:100%;object-fit:cover;display:block}#acg-ten-draw .acg-td-front strong{position:absolute;bottom:0;left:0;right:0;text-align:center;padding:22px 4px 6px;background:linear-gradient(transparent,#050912);font-size:clamp(9px,1vw,12px)}#acg-ten-draw .acg-td-card.r5 .acg-td-front{border:2px solid #ffdb72;box-shadow:0 0 16px #ffd65b}#acg-ten-draw .acg-td-card.r4 .acg-td-front{border:2px solid #9ec8ff;box-shadow:0 0 13px #8bbaff}#acg-ten-draw .acg-td-card.alt .acg-td-front{border:2px solid #e9a0ff;box-shadow:0 0 20px #e69aff}#acg-ten-draw .acg-td-cardname{text-align:center;font-size:10px;color:#aab6c8;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#acg-ten-draw .acg-td-card:not(.flip) .acg-td-cardname{color:#5f6e84}#acg-ten-draw .acg-td-summary{text-align:center;color:#aab8ca;font-size:12px;margin-top:14px}#acg-ten-draw .acg-td-summary b{color:#f3d77e}#acg-ten-draw .acg-td-close{position:fixed;top:10px;right:14px;z-index:5;background:#121b2a;border:1px solid #68758a;padding:8px 12px;font-size:12px}@keyframes acgPackIn{from{opacity:0;transform:translateY(38px) rotateX(20deg) scale(.82)}to{opacity:1;transform:none}}@keyframes acgFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@media(max-width:650px){#acg-ten-draw .acg-td-main{padding:16px 9px 32px}#acg-ten-draw .acg-td-stage{padding:17px 8px}#acg-ten-draw .acg-td-packs{gap:8px 5px}#acg-ten-draw .acg-td-pack:before{inset:3px}#acg-ten-draw .acg-td-pack span{font-size:7px;letter-spacing:1px}#acg-ten-draw .acg-td-cards{gap:7px}#acg-ten-draw .acg-td-reveal{padding:12px}#acg-ten-draw .acg-td-btn{min-width:120px;padding:10px 12px}}@media(max-width:420px){#acg-ten-draw .acg-td-cards{grid-template-columns:repeat(3,minmax(0,1fr))}#acg-ten-draw .acg-td-title p{font-size:10px}}";
  document.head.appendChild(style);

  const tab = document.createElement("button");
  tab.id = "tab-player-center"; tab.type = "button"; tab.textContent = "玩家中心";
  nav.appendChild(tab);

  const view = document.createElement("section");
  view.id = "player-center-view"; view.className = "hidden";
  view.innerHTML = [
    '<div class="panel"><h3>玩家中心</h3><p class="hint">查看公开玩家主页，以及自己的对战记录、代币、收藏和成就。</p><p id="pc-status" class="status">正在连接玩家中心……</p></div>',
    '<div class="panel"><h3>公开个人主页</h3><div class="pc-search"><div class="field"><label for="pc-public-name">玩家昵称</label><input id="pc-public-name" maxlength="20" placeholder="输入游戏昵称"></div><button id="pc-public-search" class="primary" type="button">查看主页</button></div><div id="pc-public-result" style="margin-top:14px"><p class="pc-muted">输入昵称即可查看公开主页。登录后也可以直接查看自己的主页。</p></div></div>',
    '<div class="panel"><h3>我的玩家资料</h3><p id="pc-login-hint" class="pc-muted">登录后可查看个人数据。</p><div id="pc-personal" class="hidden"><div class="pc-tabs" role="tablist"><button type="button" data-page="overview" class="active">总览</button><button type="button" data-page="matches">对战记录</button><button type="button" data-page="tokens">代币中心</button><button type="button" data-page="inventory">卡牌收藏</button><button type="button" data-page="draw">抽卡</button><button type="button" data-page="dismantle">卡牌分解</button><button type="button" data-page="achievements">成就收藏册</button></div><div id="pc-personal-content"></div><div id="pc-display-editor" style="margin-top:20px;border-top:1px solid #383d50;padding-top:16px"><h4>主页展示设置</h4><p class="pc-muted">只能选择已经解锁的成就。称号选择一项，主页徽章最多三项。</p><div class="field"><label for="pc-title-choice">个人称号</label><select id="pc-title-choice"><option value="">不展示称号</option></select></div><div class="field"><label>主页徽章（最多三个）</label><div id="pc-badge-choices" class="pc-grid"></div></div><button id="pc-save-display" type="button">保存主页展示</button><p id="pc-display-status" class="status"></p></div></div></div>',
    '<div id="pc-admin-panel" class="panel hidden"><h3>管理员 · 玩家管理</h3><p class="pc-muted">新玩家先注册账号，再由管理员把账号绑定到现有玩家编号。绑定后会自动导入该编号原有的收藏数据。</p><div class="pc-grid"><div class="field"><label for="pc-bind-number">待分配玩家编号</label><select id="pc-bind-number"></select></div><div class="field"><label for="pc-bind-user">绑定到已注册账号</label><select id="pc-bind-user"></select></div></div><button id="pc-bind-submit" type="button">绑定玩家编号并导入旧收藏</button><p id="pc-bind-status" class="status"></p><div id="pc-bind-list" class="pc-muted"></div><h4 style="margin-top:22px">玩家收藏管理</h4><p class="pc-muted">选择玩家后会显示全部卡牌。点击「+」「−」即可直接调整数量，变更会立即保存。扣除数量不会低于 0。</p><div class="pc-grid"><div class="field"><label for="pc-inventory-user">选择玩家账号</label><select id="pc-inventory-user"><option value="">请选择玩家</option></select></div><div class="field"><label for="pc-inventory-reason">调整记录备注</label><input id="pc-inventory-reason" maxlength="120" value="管理员库存调整" placeholder="例如：活动奖励"></div></div><div class="pc-search"><div class="field"><label for="pc-inventory-search">搜索卡牌</label><input id="pc-inventory-search" placeholder="输入卡牌名称或编号"></div><div class="field"><label for="pc-inventory-pack">卡包</label><select id="pc-inventory-pack"><option value="">全部卡包</option></select></div><div class="field"><label for="pc-inventory-type">卡牌类型</label><select id="pc-inventory-type"><option value="">全部类型</option></select></div></div><p id="pc-inventory-status" class="status"></p><div id="pc-inventory-summary" class="pc-muted"></div><div id="pc-inventory-cards" class="pc-inventory-grid"><div class="pc-empty">请先选择玩家。</div></div><h3 style="margin-top:24px">管理员 · 比赛管理</h3><p class="pc-muted">登记或更正四人 2v2 比赛。提交后系统会重算四名玩家的场次、胜负和胜率，并检查比赛成就。</p><form id="pc-match-form"><input id="pc-match-id" type="hidden"><div class="field"><label for="pc-match-description">比赛备注（可选）</label><input id="pc-match-description" maxlength="120" placeholder="例如：周末友谊赛"></div><div class="pc-grid"><div class="field"><label for="pc-blue-1">蓝队玩家 1</label><select id="pc-blue-1" required></select></div><div class="field"><label for="pc-blue-2">蓝队玩家 2</label><select id="pc-blue-2" required></select></div><div class="field"><label for="pc-red-1">红队玩家 1</label><select id="pc-red-1" required></select></div><div class="field"><label for="pc-red-2">红队玩家 2</label><select id="pc-red-2" required></select></div></div><div class="field"><label for="pc-winning-team">获胜队伍</label><select id="pc-winning-team"><option value="blue">蓝队胜利</option><option value="red">红队胜利</option></select></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="primary" type="submit" id="pc-match-submit">登记比赛</button><button type="button" id="pc-match-cancel" class="hidden">取消更正</button></div><p id="pc-match-status" class="status" style="margin-top:10px"></p></form><h4 style="margin-top:22px">卡池设置</h4><p class="pc-muted">设置每包价格及每张卡的稀有度概率。每包 5 张；十连为 10 包共 50 张。异画概率独立设置。</p><div id="pc-admin-pool-list" class="pc-muted">正在读取卡池状态……</div><form id="pc-pool-form"><div class="pc-grid"><div class="field"><label for="pc-pool-id">卡包</label><select id="pc-pool-id"><option value="pack_001">无限泡影</option><option value="pack_002">梦幻</option><option value="pack_003">固拉多</option><option value="pack_004">盖欧卡</option></select></div><div class="field"><label for="pc-pool-price">单包价格（代币）</label><input id="pc-pool-price" type="number" min="1" step="1" required></div><div class="field"><label for="pc-pool-alt">异画概率（%）</label><input id="pc-pool-alt" type="number" min="0" max="100" step="0.01" value="0.1" required></div><div class="field"><label for="pc-pool-r5">五星概率（%）</label><input id="pc-pool-r5" type="number" min="0" max="100" step="0.01" value="1.2" required></div><div class="field"><label for="pc-pool-r4">四星概率（%）</label><input id="pc-pool-r4" type="number" min="0" max="100" step="0.01" value="5" required></div><div class="field"><label for="pc-pool-r3">三星概率（%）</label><input id="pc-pool-r3" type="number" min="0" max="100" step="0.01" value="93.7" required></div></div><button type="submit">保存并开放卡池</button><p id="pc-pool-status" class="status"></p></form><h4 style="margin-top:22px">代币发放</h4><form id="pc-token-form"><div class="pc-grid"><div class="field"><label for="pc-token-player">玩家</label><select id="pc-token-player" required></select></div><div class="field"><label for="pc-token-amount">发放数量</label><input id="pc-token-amount" type="number" min="1" step="1" required></div><div class="field"><label for="pc-token-reason">发放原因</label><input id="pc-token-reason" maxlength="120" placeholder="例如：活动奖励" required></div></div><button type="submit">确认发放代币</button><p id="pc-token-status" class="status"></p></form><h4 style="margin-top:22px">成就管理</h4><p class="pc-muted">创建或编辑成就名称、说明、解锁条件、启用状态和首次解锁奖励。停用成就不会删除已经获得的记录。</p><form id="pc-achievement-form"><div class="pc-grid"><div class="field"><label for="pc-ach-id">成就 ID（创建后不可更改）</label><input id="pc-ach-id" maxlength="50" pattern="[a-z0-9][a-z0-9_-]{1,49}" placeholder="例如：matches_100" required></div><div class="field"><label for="pc-ach-name">成就名称</label><input id="pc-ach-name" maxlength="40" required></div><div class="field"><label for="pc-ach-description">成就描述</label><input id="pc-ach-description" maxlength="160" required></div><div class="field"><label for="pc-ach-reward">首次解锁奖励（代币）</label><input id="pc-ach-reward" type="number" min="0" step="1" value="0" required></div><div class="field"><label for="pc-ach-type">解锁条件</label><select id="pc-ach-type"><option value="matches">完成比赛场次</option><option value="wins">累计胜场</option><option value="win_streak">连续胜场</option><option value="win_rate">比赛胜率</option><option value="collection">拥有不同卡牌</option><option value="draws">累计抽卡次数</option></select></div><div class="field"><label for="pc-ach-threshold">达成目标</label><input id="pc-ach-threshold" type="number" min="1" step="1" value="1" required></div><div class="field" id="pc-ach-min-games-wrap"><label for="pc-ach-min-games">计算胜率至少需要的比赛场次</label><input id="pc-ach-min-games" type="number" min="1" step="1" value="10"></div></div><label style="display:flex;align-items:center;gap:8px;margin:10px 0"><input id="pc-ach-active" type="checkbox" checked> 启用此成就（允许新玩家解锁）</label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" type="submit" id="pc-ach-submit">创建成就</button><button type="button" id="pc-ach-reset">清空表单</button></div><p id="pc-ach-status" class="status"></p></form><h4 style="margin-top:18px">现有成就</h4><div id="pc-admin-achievement-list" class="pc-muted">正在读取……</div><h4 style="margin-top:22px">最近登记的比赛</h4><div id="pc-admin-match-list" class="pc-muted">正在读取……</div></div>'
  ].join("");
  main.appendChild(view);

  const knownViews = ["library-view","player-view","builder-view","admin-view","account-view","shared-deck-view"];
  const knownTabs = ["tab-library","tab-player","tab-builder","tab-admin","tab-account"];
  const statusEl = view.querySelector("#pc-status");
  const personalEl = view.querySelector("#pc-personal");
  const loginHint = view.querySelector("#pc-login-hint");
  const contentEl = view.querySelector("#pc-personal-content");
  let currentUser = null, currentPage = "overview", cardsById = {};
  function compareCardsByStar(a,b) {
    return Number(b.star||0)-Number(a.star||0) || String(a.name||"").localeCompare(String(b.name||""),"zh-CN");
  }
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
      client.from("profiles").select("username,created_at,selected_title,selected_badges,player_number").eq("id",currentUser.id).maybeSingle(),
      client.from("player_stats").select("tokens,games_played,wins,losses").eq("user_id",currentUser.id).maybeSingle()
    ]);
    if(pe) throw pe; if(se) throw se;
    const s=stats||{tokens:0,games_played:0,wins:0,losses:0};
    let titleName="尚未设置称号";
    if(profile?.selected_title){const titleResult=await client.from("achievements").select("name").eq("id",profile.selected_title).maybeSingle();if(titleResult.error)throw titleResult.error;titleName=titleResult.data?.name||"已设置称号";}
    contentEl.replaceChildren(node("h3","",(profile?.player_number?profile.player_number+" · ":"")+(profile?.username||"玩家")));
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
    const rows=(data||[]).slice().sort((a,b)=>compareCardsByStar(
      cardsById[a.card_id]||{name:a.card_id,star:0},
      cardsById[b.card_id]||{name:b.card_id,star:0}
    )),total=rows.reduce((sum,row)=>sum+Number(row.quantity),0);
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
  const pendingDrawRequests = new Map();
  function drawRequestStorageKey(packId,packCount) { return "acg-pending-draw:"+currentUser.id+":"+packId+":"+packCount; }
  function getDrawRequestId(packId,packCount) {
    const key=packId+":"+packCount;let requestId=pendingDrawRequests.get(key);if(requestId)return requestId;
    try{requestId=localStorage.getItem(drawRequestStorageKey(packId,packCount));}catch(_){}
    if(!requestId){requestId=crypto.randomUUID();try{localStorage.setItem(drawRequestStorageKey(packId,packCount),requestId);}catch(_){}}
    pendingDrawRequests.set(key,requestId);return requestId;
  }
  function clearDrawRequestId(packId,packCount) {
    pendingDrawRequests.delete(packId+":"+packCount);try{localStorage.removeItem(drawRequestStorageKey(packId,packCount));}catch(_){}
  }
  async function loadDraw() {
    const {data:pools,error}=await client.from("card_draw_pools").select("pack_id,pack_name,price_tokens,rate_alt,rate_3,rate_4,rate_5,enabled").eq("enabled",true).order("pack_id");
    if(error)throw error;drawPools=pools||[];
    const {data:stats,error:statsError}=await client.from("player_stats").select("tokens").eq("user_id",currentUser.id).maybeSingle();
    if(statsError)throw statsError;
    const [{data:history,error:historyError,count:drawCount},{data:packRows,error:packError}]=await Promise.all([
      client.from("card_draw_history").select("id,pack_id,card_id,cost_tokens,draw_index,created_at",{count:"exact"}).eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(30),
      client.from("card_draw_pools").select("pack_id,pack_name")
    ]);
    if(historyError)throw historyError;if(packError)throw packError;
    const packNames=Object.fromEntries((packRows||[]).map(pack=>[pack.pack_id,pack.pack_name]));
    contentEl.replaceChildren();contentEl.appendChild(node("div","pc-stat","当前代币："+(stats?.tokens??0)));
    if(!drawPools.length)contentEl.appendChild(node("div","pc-empty","目前没有开放的卡池。请等待管理员完成卡池设置。"));
    drawPools.forEach(pool=>{
      const card=node("div","pc-stat");
      card.append(node("h3","",pool.pack_name),node("p","pc-muted","每包 5 张 · 单包 "+pool.price_tokens+" 代币"),
        node("p","pc-muted","异画 "+Number(pool.rate_alt||0)+"% · 五星 "+pool.rate_5+"% · 四星 "+pool.rate_4+"% · 三星 "+pool.rate_3+"%"));
      const actions=node("div");actions.style.cssText="display:flex;gap:8px;flex-wrap:wrap";
      [[1,"单抽（1包·5张）"],[10,"十连（10包·50张）"]].forEach(([count,label])=>{
        const button=node("button",count===1?"primary":"",""+label);button.type="button";
        button.addEventListener("click",()=>performDraw(pool,count));actions.appendChild(button);
      });
      card.appendChild(actions);contentEl.appendChild(card);
    });
    contentEl.appendChild(node("h3","","抽卡记录 · 累计 "+(drawCount??0)+" 张卡"));
    if(!history?.length){contentEl.appendChild(node("div","pc-empty","还没有抽卡记录。"));return;}
    history.forEach(item=>{
      const info=cardsById[item.card_id]||{name:item.card_id};const line=node("div","pc-row"),left=node("div"),details=node("div","pc-muted");
      left.style.display="flex";left.style.alignItems="center";left.style.gap="12px";
      if(info.image){const img=node("img");img.src=info.image;img.alt=info.name;img.loading="lazy";img.style.cssText="width:48px;height:66px;object-fit:contain;border-radius:5px";left.appendChild(img);}
      details.append(node("strong","",info.name),node("div","pc-muted",(info.star||"")+" 星 · "+(packNames[item.pack_id]||item.pack_id)),
        node("div","pc-muted",new Date(item.created_at).toLocaleString("zh-CN")));
      left.appendChild(details);line.append(left,node("span","pc-muted","已加入收藏"));contentEl.appendChild(line);
    });
  }
  function showTenPackOpening(pool,result) {
    const cards=result.cards.slice().sort((a,b)=>a.draw_index-b.draw_index);
    const packs=Array.from({length:10},(_,i)=>cards.slice(i*5,(i+1)*5));
    const rarityOf=card=>card.is_alt?"alt":Number(card.rarity||cardsById[card.card_id]?.star||3)>=5?"r5":Number(card.rarity||cardsById[card.card_id]?.star||3)>=4?"r4":"r3";
    const overlay=node("div");overlay.id="acg-ten-draw";
    const top=node("div","acg-td-top"),brand=node("div","acg-td-brand");brand.innerHTML='ACG <b>PACK OPENING</b>';
    const balance=node("div","acg-td-balance","本次消耗 "+(result.charged_tokens??pool.price_tokens*10)+" 代币 · 剩余 "+result.remaining_tokens+" 代币");top.append(brand,balance);
    const close=node("button","acg-td-close","关闭 ×");close.type="button";close.addEventListener("click",()=>overlay.remove());overlay.append(top,close);
    const main=node("div","acg-td-main"),title=node("div","acg-td-title");
    title.innerHTML='<small>MASTER DUEL INSPIRED · TEN PACK OPENING</small><h2>十连召唤</h2><p>十个卡包同时登场 · 共 50 张卡牌 · 结果已由服务器确定</p>';
    const stage=node("section","acg-td-stage"),head=node("div","acg-td-stagehead");
    const headTitle=node("b","","TEN PACK OPENING"),sub=node("p","","十个卡包已准备就绪，点击 OPEN 开启");
    head.append(headTitle,sub);
    const packGrid=node("div","acg-td-packs");
    packs.forEach((pack,i)=>{
      const grades=pack.map(rarityOf),rank=grades.includes("alt")?"alt":grades.includes("r5")?"r5":grades.includes("r4")?"r4":"r3";
      const el=node("div","acg-td-pack"+(rank==="r3"?"":" "+rank));el.style.setProperty("--i",i);
      const label=node("span","",""+(pool.pack_name||pool.pack_id).toUpperCase()+" · PACK "+String(i+1).padStart(2,"0"));
      el.appendChild(label);packGrid.appendChild(el);
    });
    const actions=node("div","acg-td-actions"),openBtn=node("button","acg-td-btn primary","OPEN · 开启卡包"),skipBtn=node("button","acg-td-btn","SKIP · 全部揭晓");
    openBtn.type=skipBtn.type="button";actions.append(openBtn,skipBtn);
    const reveal=node("section","acg-td-reveal"),rhead=node("div","acg-td-rhead"),rtitle=node("b","","第 1 包 · 卡牌揭晓"),progress=node("span","","0 / 5 已揭晓");
    rhead.append(rtitle,progress);const cardGrid=node("div","acg-td-cards"),summary=node("div","acg-td-summary","点击卡牌翻开");
    const revealActions=node("div","acg-td-actions"),nextBtn=node("button","acg-td-btn primary","翻开下一张"),allBtn=node("button","acg-td-btn","翻开本包全部卡牌");
    nextBtn.type=allBtn.type="button";revealActions.append(nextBtn,allBtn);reveal.append(rhead,cardGrid,summary,revealActions);
    stage.append(head,packGrid,actions);main.append(title,stage,reveal);overlay.appendChild(main);document.body.appendChild(overlay);
    let current=-1,flipped=0,finished=false;
    function revealOne(index){
      const el=cardGrid.children[index];if(!el||el.classList.contains("flip"))return;
      el.classList.add("flip");el.querySelector(".acg-td-cardname").textContent=cardsById[packs[current][index].card_id]?.name||packs[current][index].card_id;
      flipped++;progress.textContent=flipped+" / 5 已揭晓";
      const pack=packs[current],count={alt:0,r5:0,r4:0,r3:0};pack.forEach(c=>count[rarityOf(c)]++);
      summary.innerHTML="异画 <b>"+count.alt+"</b>　五星 <b>"+count.r5+"</b>　四星 <b>"+count.r4+"</b>　三星 <b>"+count.r3+"</b>";
      const grade=rarityOf(pack[index]);if(grade==="alt")sub.textContent="✦ 异画卡降临！";else if(grade==="r5")sub.textContent="★★★★★ 五星卡牌登场！";
      if(flipped===5){nextBtn.textContent=current===9?"查看完整结果":"OPEN · 开启下一包";allBtn.disabled=true;}
    }
    function revealAllCurrent(){for(let i=0;i<5;i++)setTimeout(()=>revealOne(i),i*95)}
    function openPackage(){
      if(current>=0&&flipped<5){sub.textContent="请先揭晓当前卡包的 5 张卡，或使用 SKIP。";return;}
      if(current>=0)packGrid.children[current].classList.add("opened");
      current++;
      if(current>=10){showComplete();return;}
      flipped=0;sub.textContent="正在开启第 "+(current+1)+" / 10 包";
      rtitle.textContent="第 "+(current+1)+" 包 · 卡牌揭晓";progress.textContent="0 / 5 已揭晓";
      summary.textContent="点击卡牌翻开";cardGrid.replaceChildren();reveal.classList.add("show");
      packs[current].forEach((card,i)=>{
        const info=cardsById[card.card_id]||{name:card.card_id},grade=rarityOf(card),el=node("div","acg-td-card"+(grade==="r3"?"":" "+grade));
        const inner=node("div","acg-td-inner"),back=node("div","acg-td-face acg-td-back"),front=node("div","acg-td-face acg-td-front"),img=node("img");
        img.src=info.image||"";img.alt=info.name;img.loading="lazy";const name=node("strong","",info.name);
        front.append(img,name);inner.append(back,front);const label=node("div","acg-td-cardname","未揭晓");el.append(inner,label);el.addEventListener("click",()=>revealOne(i));cardGrid.appendChild(el);
      });
      nextBtn.textContent="翻开下一张";allBtn.disabled=false;
      reveal.scrollIntoView({behavior:"smooth",block:"center"});
    }
    function showComplete(){
      finished=true;packs.forEach((_,i)=>packGrid.children[i].classList.add("opened"));
      headTitle.textContent="TEN PACKS COMPLETE";sub.textContent="十连完成 · 50 张卡牌全部揭晓";
      rtitle.textContent="十连召唤结果";progress.textContent="50 / 50 已揭晓";
      cardGrid.replaceChildren();const counts={alt:0,r5:0,r4:0,r3:0};
      cards.forEach(card=>{
        const grade=rarityOf(card);counts[grade]++;
        const info=cardsById[card.card_id]||{name:card.card_id},el=node("div","acg-td-card flip"+(grade==="r3"?"":" "+grade));
        const inner=node("div","acg-td-inner"),back=node("div","acg-td-face acg-td-back"),front=node("div","acg-td-face acg-td-front"),img=node("img");
        img.src=info.image||"";img.alt=info.name;const name=node("strong","",info.name);front.append(img,name);inner.append(back,front);
        el.append(inner,node("div","acg-td-cardname",info.name));cardGrid.appendChild(el);
      });
      summary.innerHTML="十连结果：异画 <b>"+counts.alt+"</b>　五星 <b>"+counts.r5+"</b>　四星 <b>"+counts.r4+"</b>　三星 <b>"+counts.r3+"</b>";
      revealActions.replaceChildren();const done=node("button","acg-td-btn primary","完成 · 返回玩家中心");done.type="button";done.addEventListener("click",()=>overlay.remove());revealActions.appendChild(done);
      reveal.scrollIntoView({behavior:"smooth",block:"start"});
    }
    openBtn.addEventListener("click",()=>{if(finished)return;if(current===-1||flipped===5)openPackage();else{revealOne([...cardGrid.children].findIndex(el=>!el.classList.contains("flip")));}});
    nextBtn.addEventListener("click",()=>{if(flipped===5){openPackage();return;}const i=[...cardGrid.children].findIndex(el=>!el.classList.contains("flip"));if(i>=0)revealOne(i);});
    allBtn.addEventListener("click",revealAllCurrent);
    skipBtn.addEventListener("click",()=>{if(finished)return;showComplete();});
  }
  async function performDraw(pool,packCount) {
    if(drawBusy)return;drawBusy=true;contentEl.querySelectorAll("button").forEach(button=>button.disabled=true);
    const requestId=getDrawRequestId(pool.pack_id,packCount);const loading=node("p","pc-muted","正在抽取 "+(packCount*5)+" 张卡，请稍候……");contentEl.prepend(loading);
    try{
      const {data,error}=await client.rpc("draw_packages",{p_pack_id:pool.pack_id,p_request_id:requestId,p_pack_count:packCount});
      if(error)throw error;const result=Array.isArray(data)?data[0]:data;
      if(!result?.cards||result.cards.length!==packCount*5)throw new Error("服务器没有返回完整抽卡结果；请重试，系统会沿用同一请求编号避免重复扣费。");
      clearDrawRequestId(pool.pack_id,packCount);loading.remove();
      await loadDraw();
      if(packCount===10){showTenPackOpening(pool,result);}
      else{
        const box=node("div","pc-stat");box.append(node("h3","","抽卡结果 · 1 包 / 5 张"),
          node("p","pc-muted","本次消耗 "+(result.charged_tokens??pool.price_tokens)+" 代币 · 剩余 "+result.remaining_tokens+" 代币"));
        const grid=node("div","pc-inventory-grid");
        result.cards.forEach(card=>{
          const info=cardsById[card.card_id]||{name:card.card_id};const tile=node("div","pc-inventory-card");
          if(info.image){const img=node("img");img.src=info.image;img.alt=info.name;img.loading="lazy";tile.appendChild(img);}
          const meta=node("div","pc-card-info");meta.append(node("strong","",info.name),node("small","",card.is_alt?"异画":(card.rarity||info.star)+" 星"));
          tile.appendChild(meta);grid.appendChild(tile);
        });
        box.appendChild(grid);if(result.duplicate_request)box.appendChild(node("p","pc-muted","本次请求已处理，已返回原结果，没有重复扣费。"));
        contentEl.prepend(box);
      }
    }catch(error){loading.textContent="抽卡失败："+error.message;loading.className="pc-empty";}
    finally{drawBusy=false;contentEl.querySelectorAll("button").forEach(button=>button.disabled=false);}
  }
  async function loadDismantle() {
    const [{data:inventory,error:ie},{data:stats,error:se}]=await Promise.all([
      client.from("card_inventory").select("card_id,quantity").eq("user_id",currentUser.id).gt("quantity",0).order("card_id"),
      client.from("player_stats").select("tokens").eq("user_id",currentUser.id).maybeSingle()
    ]);
    if(ie)throw ie;if(se)throw se;
    contentEl.replaceChildren(node("div","pc-stat","当前代币："+(stats?.tokens??0)),
      node("p","pc-muted","选择不需要的卡牌并填写分解数量。分解后卡牌会从收藏中扣除，代币立即到账。"),
      node("p","pc-muted","三星 10 · 四星 15 · 五星 20 · 异画 30 代币 / 张"));
    const selected=new Map(),rows=[];
    (inventory||[]).forEach(item=>{
      const info=cardsById[item.card_id]||{name:item.card_id,star:3};const alt=/异画/.test(info.name||"");
      const reward=alt?30:(Number(info.star)===5?20:Number(info.star)===4?15:10);const row=node("div","pc-inventory-card");
      if(info.image){const img=node("img");img.src=info.image;img.alt=info.name;img.loading="lazy";row.appendChild(img);}
      const meta=node("div","pc-card-info");meta.append(node("strong","",info.name),
        node("small","", "库存 "+item.quantity+" 张 · "+(alt?"异画":info.star+"星")+" · 分解返还 "+reward+" 代币/张"));
      const controls=node("div","pc-quantity-controls"),input=node("input");input.type="number";input.min="0";input.max=String(item.quantity);input.step="1";input.value="0";input.style.width="76px";
      input.addEventListener("input",()=>{
        const q=Math.max(0,Math.min(item.quantity,Math.floor(Number(input.value)||0)));
        if(q)selected.set(item.card_id,q);else selected.delete(item.card_id);input.value=String(q);updateEstimate();
      });
      controls.append(input,node("span","pc-muted","分解数量"));meta.appendChild(controls);row.appendChild(meta);contentEl.appendChild(row);
      rows.push({id:item.card_id,input,quantity:item.quantity,reward});
    });
    if(!rows.length){contentEl.appendChild(node("div","pc-empty","当前没有可分解的卡牌。"));return;}
    const summary=node("div","pc-stat","预计返还：0 代币");contentEl.appendChild(summary);
    function updateEstimate(){
      const total=[...selected.entries()].reduce((sum,[id,q])=>sum+q*(rows.find(r=>r.id===id)?.reward||0),0);
      summary.textContent="已选择 "+[...selected.values()].reduce((a,b)=>a+b,0)+" 张 · 预计返还："+total+" 代币";
    }
    const button=node("button","primary","确认分解所选卡牌");button.type="button";
    button.addEventListener("click",async()=>{
      if(!selected.size){summary.textContent="请先选择要分解的卡牌。";return;}
      if(!confirm("确定分解所选 "+[...selected.values()].reduce((a,b)=>a+b,0)+" 张卡牌吗？此操作不可撤销。"))return;
      button.disabled=true;
      try{
        const key="acg-pending-dismantle:"+currentUser.id;let requestId;
        try{requestId=localStorage.getItem(key);}catch(_){}
        if(!requestId){requestId=crypto.randomUUID();try{localStorage.setItem(key,requestId);}catch(_){}}
        const items=[...selected.entries()].map(([card_id,quantity])=>({card_id,quantity}));
        const {data,error}=await client.rpc("dismantle_cards",{p_items:items,p_request_id:requestId});
        if(error)throw error;const result=Array.isArray(data)?data[0]:data;
        try{localStorage.removeItem(key);}catch(_){}
        await loadDismantle();
        contentEl.prepend(node("div","pc-stat pc-positive","分解成功！获得 "+result.reward_tokens+" 代币，当前余额 "+result.remaining_tokens+"。"));
      }catch(error){summary.textContent="分解失败："+error.message;}
      finally{button.disabled=false;}
    });
    contentEl.appendChild(button);
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
      else if(page==="dismantle")await loadDismantle();
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
  let adminInventory = {};
  let inventoryBusy = new Set();
  function fillInventoryAdminSelects(){
    const userSelect=view.querySelector("#pc-inventory-user");
    const previous=userSelect.value;
    userSelect.replaceChildren(new Option("请选择玩家",""));
    adminPlayers.forEach(player=>userSelect.add(new Option(player.username+(player.player_number?" · "+player.player_number:" · 未绑定"),player.id)));
    if(adminPlayers.some(player=>player.id===previous))userSelect.value=previous;
    const packSelect=view.querySelector("#pc-inventory-pack");
    const packs=[...new Set(Object.values(cardsById).map(card=>card.pack_id).filter(Boolean))];
    packSelect.replaceChildren(new Option("全部卡包",""));
    packs.forEach(id=>packSelect.add(new Option(id,id)));
    const typeSelect=view.querySelector("#pc-inventory-type");
    const types=[...new Set(Object.values(cardsById).map(card=>card.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
    typeSelect.replaceChildren(new Option("全部类型",""));
    types.forEach(type=>typeSelect.add(new Option(type,type)));
    renderAdminInventory();
    if(userSelect.value)loadAdminInventory();
  }
  async function loadAdminInventory(){
    const userId=view.querySelector("#pc-inventory-user").value;
    const list=view.querySelector("#pc-inventory-cards");
    const status=view.querySelector("#pc-inventory-status");
    const summary=view.querySelector("#pc-inventory-summary");
    if(!userId){
      adminInventory={};summary.textContent="";
      list.replaceChildren(node("div","pc-empty","请先选择玩家。"));
      status.textContent="";
      return;
    }
    list.replaceChildren(node("div","pc-empty","正在读取该玩家的收藏……"));
    status.textContent="正在读取库存……";status.className="status";
    try{
      const {data,error}=await client.from("card_inventory").select("card_id,quantity").eq("user_id",userId).gt("quantity",0);
      if(error)throw error;
      adminInventory=Object.fromEntries((data||[]).map(row=>[row.card_id,Number(row.quantity)]));
      renderAdminInventory();
      status.textContent="已读取玩家收藏。点击卡牌旁的 + / − 即可即时调整。";status.className="status good";
    }catch(error){
      list.replaceChildren(node("div","pc-empty","读取库存失败："+error.message));
      status.textContent="读取失败："+error.message;status.className="status bad";
    }
  }
  function renderAdminInventory(){
    const list=view.querySelector("#pc-inventory-cards");
    const summary=view.querySelector("#pc-inventory-summary");
    if(!list)return;
    const userId=view.querySelector("#pc-inventory-user").value;
    if(!userId){list.replaceChildren(node("div","pc-empty","请先选择玩家。"));summary.textContent="";return;}
    const query=view.querySelector("#pc-inventory-search").value.trim().toLowerCase();
    const pack=view.querySelector("#pc-inventory-pack").value;
    const type=view.querySelector("#pc-inventory-type").value;
    const cards=Object.values(cardsById).filter(card=>
      (!query||card.name.toLowerCase().includes(query)||card.id.toLowerCase().includes(query))&&
      (!pack||card.pack_id===pack)&&(!type||card.type===type)
    ).sort(compareCardsByStar);
    const owned=Object.values(adminInventory).reduce((sum,value)=>sum+value,0);
    const kinds=Object.values(adminInventory).filter(value=>value>0).length;
    summary.textContent="拥有 "+kinds+" 种卡牌，共 "+owned+" 张 · 当前显示 "+cards.length+" 张卡牌";
    list.replaceChildren();
    if(!cards.length){list.appendChild(node("div","pc-empty","没有符合筛选条件的卡牌。"));return;}
    cards.forEach(card=>{
      const quantity=adminInventory[card.id]||0;
      const item=node("article","pc-inventory-card");
      const img=node("img");img.src=card.image||"";img.alt=card.name;img.loading="lazy";
      img.onerror=()=>{img.style.visibility="hidden";};
      const info=node("div","pc-card-info");
      info.append(node("strong","",card.name),node("small","",(card.star?card.star+" 星 · ":"")+(card.type||"")+" · "+card.id));
      const controls=node("div","pc-quantity-controls");
      const minus=node("button","","−");minus.type="button";minus.title="扣除一张";minus.disabled=quantity<=0||inventoryBusy.has(card.id);
      const count=node("strong","",String(quantity));
      const plus=node("button","","+");plus.type="button";plus.title="增加一张";plus.disabled=inventoryBusy.has(card.id);
      minus.addEventListener("click",()=>adjustAdminInventory(card,-1));
      plus.addEventListener("click",()=>adjustAdminInventory(card,1));
      controls.append(minus,count,plus);info.appendChild(controls);item.append(img,info);list.appendChild(item);
    });
  }
  async function adjustAdminInventory(card,delta){
    const userId=view.querySelector("#pc-inventory-user").value;
    const status=view.querySelector("#pc-inventory-status");
    if(!userId||inventoryBusy.has(card.id))return;
    const current=adminInventory[card.id]||0;
    if(delta<0&&current<=0)return;
    const reason=view.querySelector("#pc-inventory-reason").value.trim()||"管理员库存调整";
    inventoryBusy.add(card.id);renderAdminInventory();
    status.textContent=(delta>0?"正在增加":"正在扣除")+"「"+card.name+"」……";status.className="status";
    try{
      const {data,error}=await client.rpc("admin_adjust_card_inventory",{
        p_user_id:userId,p_card_id:card.id,p_delta:delta,p_reason:reason
      });
      if(error)throw error;
      const next=Number(data);
      if(!Number.isSafeInteger(next)||next<0)throw new Error("服务器返回的库存数量异常，请重新读取库存确认。");
      if(next===0)delete adminInventory[card.id];else adminInventory[card.id]=next;
      status.textContent="已"+(delta>0?"增加":"扣除")+"「"+card.name+"」1 张，当前拥有 "+next+" 张。";status.className="status good";
    }catch(error){
      status.textContent="调整失败："+error.message;status.className="status bad";
      await loadAdminInventory();
    }finally{
      inventoryBusy.delete(card.id);renderAdminInventory();
    }
  }
  view.querySelector("#pc-inventory-user").addEventListener("change",loadAdminInventory);
  view.querySelector("#pc-inventory-search").addEventListener("input",renderAdminInventory);
  view.querySelector("#pc-inventory-pack").addEventListener("change",renderAdminInventory);
  view.querySelector("#pc-inventory-type").addEventListener("change",renderAdminInventory);

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
      .select("pack_id,pack_name,price_tokens,rate_alt,rate_3,rate_4,rate_5,enabled").order("pack_id");
    if(error)throw error;
    list.replaceChildren();
    if(!data?.length){list.appendChild(node("div","pc-empty","没有卡池配置。"));return;}
    data.forEach(pool=>{
      const row=node("div","pc-row"),info=node("div"),actions=node("div");
      const ready=pool.price_tokens!==null&&pool.rate_alt!==null&&pool.rate_3!==null&&pool.rate_4!==null&&pool.rate_5!==null;
      const config=ready
        ? "每包 "+pool.price_tokens+" 代币 · 异画 "+pool.rate_alt+"% / 五星 "+pool.rate_5+"% / 四星 "+pool.rate_4+"% / 三星 "+pool.rate_3+"%"
        : "尚未设置价格和概率";
      info.append(node("strong","",pool.pack_name),node("div","pc-muted",config),
        node("div",pool.enabled?"pc-positive":"pc-muted",pool.enabled?"开放中":"未开放"));
      actions.style.display="flex";actions.style.alignItems="center";
      const edit=node("button","","载入设置");edit.type="button";
      edit.addEventListener("click",()=>{
        view.querySelector("#pc-pool-id").value=pool.pack_id;
        view.querySelector("#pc-pool-price").value=pool.price_tokens??"";
        view.querySelector("#pc-pool-alt").value=pool.rate_alt??0;
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
      p_rate_alt:Number(view.querySelector("#pc-pool-alt").value),
      p_rate_3:Number(view.querySelector("#pc-pool-r3").value),
      p_rate_4:Number(view.querySelector("#pc-pool-r4").value),
      p_rate_5:Number(view.querySelector("#pc-pool-r5").value)
    };
    if(!Number.isSafeInteger(values.p_price_tokens)||values.p_price_tokens<=0||
       [values.p_rate_alt,values.p_rate_3,values.p_rate_4,values.p_rate_5].some(x=>!Number.isFinite(x)||x<0||x>100||Math.round(x*100)!==x*100)||
       Math.round((values.p_rate_alt+values.p_rate_3+values.p_rate_4+values.p_rate_5)*100)!==10000){
      status.textContent="每包价格必须为正整数；异画、五星、四星、三星概率须为 0–100 的数字（最多两位小数），总和必须为 100%。";status.className="status bad";return;
    }
    button.disabled=true;status.textContent="正在保存卡池……";status.className="status";
    try{
      const {error}=await client.rpc("admin_set_draw_pool_v2",values);
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