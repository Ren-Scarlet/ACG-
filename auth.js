(() => {
  "use strict";

  const SUPABASE_URL = "https://lbyobelugnlrkwwmnske.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tC_VrNT8t2KkWyfIhVJUkA_kwzygUoK";
  const { createClient } = window.supabase || {};

  const statusEl = document.getElementById("account-status");
  const formsEl = document.getElementById("account-forms");
  const profileEl = document.getElementById("account-profile");
  const signupForm = document.getElementById("account-signup-form");
  const loginForm = document.getElementById("account-login-form");
  const logoutButton = document.getElementById("account-logout");

  if (!createClient) {
    statusEl.textContent = "账号模块加载失败，请刷新网页后重试。";
    statusEl.className = "status bad";
    return;
  }

  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.acgSupabaseClient = client;

  function showStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  function validUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  }

  async function renderSession(session) {
    if (!session) {
      formsEl.classList.remove("hidden");
      profileEl.classList.add("hidden");
      showStatus("尚未登录。可以注册新账号，或登录已有账号。", "");
      return;
    }

    formsEl.classList.add("hidden");
    profileEl.classList.remove("hidden");
    document.getElementById("account-username").textContent =
      session.user.user_metadata?.username || "已登录玩家";

    const { data: profile, error } = await client
      .from("profiles")
      .select("username, created_at")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      showStatus("已登录，但暂时无法读取玩家资料：" + error.message, "bad");
      return;
    }

    if (profile) {
      document.getElementById("account-username").textContent = profile.username;
      const created = new Date(profile.created_at).toLocaleDateString("zh-CN");
      document.getElementById("account-created").textContent = "注册时间：" + created;
      showStatus("登录成功，账号已连接。", "good");
    } else {
      showStatus("已登录，但玩家资料尚未建立。请联系管理员检查注册触发器。", "bad");
    }
  }

  signupForm.addEventListener("submit", async event => {
    event.preventDefault();
    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-password-confirm").value;
    const button = signupForm.querySelector("button[type=submit]");

    if (!validUsername(username)) {
      showStatus("用户名须为 3～20 位，只能使用英文字母、数字和下划线。", "bad");
      return;
    }
    if (password.length < 8) {
      showStatus("密码至少需要 8 位。", "bad");
      return;
    }
    if (password !== confirm) {
      showStatus("两次输入的密码不一致。", "bad");
      return;
    }

    button.disabled = true;
    showStatus("正在创建账号……", "");
    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { username: username.toLowerCase() } }
      });
      if (error) throw error;
      if (data.session) {
        await renderSession(data.session);
        signupForm.reset();
      } else {
        showStatus("注册请求已提交，但当前没有建立登录会话。请检查 Supabase 的邮箱确认设置是否已关闭。", "bad");
      }
    } catch (error) {
      showStatus("注册失败：" + error.message, "bad");
    } finally {
      button.disabled = false;
    }
  });

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const button = loginForm.querySelector("button[type=submit]");


    button.disabled = true;
    showStatus("正在登录……", "");
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      await renderSession(data.session);
      loginForm.reset();
    } catch (error) {
      showStatus("登录失败：请检查邮箱和密码。", "bad");
    } finally {
      button.disabled = false;
    }
  });

  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    const { error } = await client.auth.signOut();
    logoutButton.disabled = false;
    if (error) {
      showStatus("退出失败：" + error.message, "bad");
      return;
    }
    await renderSession(null);
  });

  client.auth.onAuthStateChange((_event, session) => {
    renderSession(session);
  });

  client.auth.getSession().then(({ data, error }) => {
    if (error) showStatus("读取登录状态失败：" + error.message, "bad");
    renderSession(data?.session || null);
  });

  const playerCenterScript = document.createElement("script");
  playerCenterScript.src = "./player-center.js?v=6";
  playerCenterScript.defer = true;
  document.body.appendChild(playerCenterScript);
})();
