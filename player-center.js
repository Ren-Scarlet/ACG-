(() => {
  "use strict";
  const URL = "https://lbyobelugnlrkwwmnske.supabase.co";
  const KEY = "sb_publishable_tC_VrNT8t2KkWyfIhVJUkA_kwzygUoK";
  const db = window.supabase.createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const $ = id => document.getElementById(id);
  const status = (id, message, kind = "") => {
    const el = $(id);
    if (!el) return;
    el.textContent = message;
    el.className = "status" + (kind ? " " + kind : "");
  };
  const el = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const fmtDate = value => value ? new Date(value).toLocaleDateString("zh-CN") : "—";
  let session = null;
  let players = [];

  async function currentSession() {
    const { data } = await db.auth.getSession();
    session = data.session;
    return session;
  }

  function showCenter() {
    ["library-view","player-view","builder-view","admin-view","account-view","shared-deck-view"]
      .forEach(id => $(id)?.classList.add("hidden"));
    $("player-center-view").classList.remove("hidden");
    ["tab-library","tab-player","tab-builder","tab-admin","tab-account"]
      .forEach(id => $(id)?.classList.remove("active"));
    $("tab-player-center").classList.add("active");
    $("page-title").textContent = "玩家中心";
  }

  async function loadPublicProfile() {
    const name = $("public-profile-name").value.trim();
    if (!name) { status("public-profile-status", "请输入玩家昵称。", "bad"); return; }
    status("public-profile-status", "正在查询……");
    $("public-profile-result").replaceChildren();
    const { data, error } = await db.from("public_profiles")
      .select("username,created_at,selected_title,selected_badges,games_played,wins,losses,win_rate")
      .ilike("username", name).maybeSingle();
    if (error) { status("public-profile-status", "查询失败：" + error.message, "bad"); return; }
    if (!data) { status("public-profile-status", "没有找到这个玩家。"); return; }
    const box = el("div", "panel");
    box.append(el("h3", "", data.username));
    if (data.selected_title) box.append(el("p", "hint", "称号：" + data.selected_title));
    box.append(el("p", "hint", "加入时间：" + fmtDate(data.created_at)));
    box.append(el("p", "hint", "比赛：" + data.games_played + " 场 · 胜 " + data.wins + " · 负 " + data.losses + " · 胜率 " + data.win_rate + "%"));
    const badges = Array.isArray(data.selected_badges) ? data.selected_badges : [];
    if (badges.length) box.append(el("p", "hint", "徽章：" + badges.slice(0,3).join(" · ")));
    $("public-profile-result").append(box);
    status("public-profile-status", "查询成功。", "good");
  }

  async function loadPrivateDashboard() {
    await currentSession();
    if (!session) {
      $("private-center").classList.add("hidden");
      $("center-login-hint").classList.remove("hidden");
      $("admin-center").classList.add("hidden");
      return;
    }
    $("center-login-hint").classList.add("hidden");
    $("private-center").classList.remove("hidden");
    const uid = session.user.id;
    const [profile, stats, matches, ledger, achievements, unlocked, inventory] = await Promise.all([
      db.from("profiles").select("username,is_admin").eq("id", uid).maybeSingle(),
      db.from("player_stats").select("tokens,games_played,wins,losses").eq("user_id", uid).maybeSingle(),
      db.from("match_results").select("id,result,team,match_id,matches(id,description,created_at)").eq("user_id", uid).order("id", {ascending:false}).limit(10),
      db.from("token_transactions").select("amount,reason,created_at").eq("user_id", uid).order("created_at", {ascending:false}).limit(20),
      db.from("achievements").select("id,name,description").order("name"),
      db.from("player_achievements").select("achievement_id,unlocked_at").eq("user_id", uid),
      db.from("card_inventory").select("card_id,quantity").eq("user_id", uid).gt("quantity", 0)
    ]);
    const firstError = [profile,stats,matches,ledger,achievements,unlocked,inventory].find(x => x.error);
    if (firstError) {
      status("private-center-status", "读取玩家中心失败：" + firstError.error.message, "bad");
      return;
    }
    const p = profile.data || {};
    const s = stats.data || {tokens:0,games_played:0,wins:0,losses:0};
    $("private-center-name").textContent = p.username || "玩家";
    $("private-center-stats").replaceChildren(
      el("p", "hint", "代币余额：" + (s.tokens || 0)),
      el("p", "hint", "比赛：" + (s.games_played || 0) + " 场 · 胜 " + (s.wins || 0) + " · 负 " + (s.losses || 0)),
      el("p", "hint", "胜率：" + (s.games_played ? (100*s.wins/s.games_played).toFixed(1) : "0.0") + "%"),
      el("p", "hint", "不同卡牌：" + (inventory.data || []).length + " 种")
    );
    const matchList = $("center-match-list");
    matchList.replaceChildren();
    (matches.data || []).forEach(row => {
      const m = row.matches || {};
      matchList.append(el("p", "hint", fmtDate(m.created_at) + " · " + (row.team === "blue" ? "蓝队" : row.team === "red" ? "红队" : "队伍未知") + " · " + (row.result === "win" ? "胜利" : "失败") + (m.description ? " · " + m.description : "")));
    });
    if (!matchList.children.length) matchList.append(el("p", "hint", "还没有比赛记录。"));
    const ledgerList = $("center-token-list");
    ledgerList.replaceChildren();
    (ledger.data || []).forEach(row => ledgerList.append(el("p", "hint", fmtDate(row.created_at) + " · " + (row.amount > 0 ? "+" : "") + row.amount + " · " + row.reason)));
    if (!ledgerList.children.length) ledgerList.append(el("p", "hint", "还没有代币流水。"));
    const unlockedIds = new Set((unlocked.data || []).map(x => x.achievement_id));
    const achievementList = $("center-achievement-list");
    achievementList.replaceChildren();
    (achievements.data || []).forEach(a => {
      const done = unlockedIds.has(a.id);
      const row = el("div", "admin-record");
      row.append(el("strong", "admin-record-main", (done ? "✓ " : "○ ") + a.name + " — " + a.description));
      achievementList.append(row);
    });
    const inventoryList = $("center-inventory-list");
    inventoryList.replaceChildren();
    (inventory.data || []).forEach(row => inventoryList.append(el("p", "hint", row.card_id + " × " + row.quantity)));
    if (!inventoryList.children.length) inventoryList.append(el("p", "hint", "收藏暂时为空。"));
    const admin = !!p.is_admin;
    $("admin-center").classList.toggle("hidden", !admin);
    status("private-center-status", "玩家中心已更新。", "good");
    if (admin) await loadAdminPlayers();
  }

  async function loadAdminPlayers() {
    const { data, error } = await db.from("profiles").select("id,username").order("username");
    if (error) { status("admin-center-status", "读取玩家列表失败：" + error.message, "bad"); return; }
    players = data || [];
    ["match-blue-1","match-blue-2","match-red-1","match-red-2","token-player"].forEach(id => {
      const select = $(id);
      if (!select) return;
      const previous = select.value;
      select.replaceChildren(el("option", "", "请选择玩家"));
      select.firstChild.value = "";
      players.forEach(p => {
        const option = el("option", "", p.username);
        option.value = p.id;
        select.append(option);
      });
      if (players.some(p => p.id === previous)) select.value = previous;
    });
    await loadAdminMatchList();
  }

  async function loadAdminMatchList() {
    const { data, error } = await db.from("matches")
      .select("id,description,created_at,blue_players,red_players,winning_team")
      .order("created_at", {ascending:false}).limit(30);
    if (error) { status("admin-center-status", "读取比赛列表失败：" + error.message, "bad"); return; }
    const list = $("admin-match-list");
    list.replaceChildren();
    (data || []).forEach(match => {
      const blue = (match.blue_players || []).map(id => players.find(p => p.id === id)?.username || "未知玩家").join("、");
      const red = (match.red_players || []).map(id => players.find(p => p.id === id)?.username || "未知玩家").join("、");
      const row = el("div", "admin-record");
      const info = el("div", "admin-record-main");
      info.append(el("strong", "", "#" + match.id + " · " + fmtDate(match.created_at)));
      info.append(el("small", "", "蓝队：" + blue + "；红队：" + red + "；胜方：" + (match.winning_team === "blue" ? "蓝队" : match.winning_team === "red" ? "红队" : "未登记")));
      if (match.description) info.append(el("small", "", match.description));
      const edit = el("button", "", "载入更正");
      edit.type = "button";
      edit.addEventListener("click", () => {
        $("edit-match-id").value = match.id;
        $("match-blue-1").value = (match.blue_players || [])[0] || "";
        $("match-blue-2").value = (match.blue_players || [])[1] || "";
        $("match-red-1").value = (match.red_players || [])[0] || "";
        $("match-red-2").value = (match.red_players || [])[1] || "";
        $("match-winning-team").value = match.winning_team || "blue";
        $("match-description").value = match.description || "";
        $("record-match-button").textContent = "保存比赛更正";
      });
      const del = el("button", "danger-button", "删除");
      del.type = "button";
      del.addEventListener("click", async () => {
        if (!confirm("确定删除比赛 #" + match.id + "？系统会重新计算玩家胜负数据。")) return;
        const { error } = await db.rpc("admin_delete_match", {p_match_id:match.id});
        if (error) status("admin-center-status", "删除失败：" + error.message, "bad");
        else { status("admin-center-status", "比赛已删除，统计已重算。", "good"); await loadPrivateDashboard(); }
      });
      row.append(info, edit, del);
      list.append(row);
    });
    if (!list.children.length) list.append(el("p", "hint", "还没有登记比赛。"));
  }

  async function saveMatch() {
    const blue = [$("match-blue-1").value,$("match-blue-2").value];
    const red = [$("match-red-1").value,$("match-red-2").value];
    if ([...blue,...red].some(x => !x) || new Set([...blue,...red]).size !== 4) {
      status("admin-center-status", "请选择四名不同的玩家。", "bad"); return;
    }
    const args = {
      p_blue_players: blue,
      p_red_players: red,
      p_winning_team: $("match-winning-team").value,
      p_description: $("match-description").value.trim() || null
    };
    const editId = $("edit-match-id").value;
    const result = editId
      ? await db.rpc("admin_update_match", {p_match_id:Number(editId), ...args})
      : await db.rpc("admin_record_match", args);
    if (result.error) { status("admin-center-status", "保存比赛失败：" + result.error.message, "bad"); return; }
    $("edit-match-id").value = "";
    $("match-description").value = "";
    $("record-match-button").textContent = "登记比赛";
    status("admin-center-status", editId ? "比赛更正成功，相关统计已重算。" : "比赛登记成功，四名玩家统计已更新。", "good");
    await loadPrivateDashboard();
  }

  async function grantTokens() {
    const user = $("token-player").value;
    const amount = Number($("token-amount").value);
    const reason = $("token-reason").value.trim();
    if (!user || !Number.isSafeInteger(amount) || amount <= 0 || !reason) {
      status("admin-center-status", "请选择玩家，填写正整数代币和发放原因。", "bad"); return;
    }
    const { error } = await db.rpc("admin_grant_tokens", {p_user_id:user,p_amount:amount,p_reason:reason});
    if (error) status("admin-center-status", "发放失败：" + error.message, "bad");
    else {
      $("token-amount").value = "";
      $("token-reason").value = "";
      status("admin-center-status", "代币发放成功，流水已记录。", "good");
      await loadPrivateDashboard();
    }
  }

  $("tab-player-center").addEventListener("click", async () => {
    showCenter();
    await loadPrivateDashboard();
  });
  ["tab-library","tab-player","tab-builder","tab-admin","tab-account"].forEach(id => {
    $(id).addEventListener("click", () => $("player-center-view").classList.add("hidden"));
  });
  $("public-profile-search").addEventListener("click", loadPublicProfile);
  $("public-profile-name").addEventListener("keydown", e => { if (e.key === "Enter") loadPublicProfile(); });
  $("record-match-button").addEventListener("click", saveMatch);
  $("grant-token-button").addEventListener("click", grantTokens);
  db.auth.onAuthStateChange(() => {
    currentSession().then(() => {
      if (!$("player-center-view").classList.contains("hidden")) loadPrivateDashboard();
    });
  });
})();