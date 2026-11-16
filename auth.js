(async () => {
  "use strict";

  const SUPABASE_URL = "https://lbyobelugnlrkwwmnske.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tC_VrNT8t2KkWyfIhVJUkA_kwzygUoK";
  const statusEl = document.getElementById("account-status");

  async function ensureSupabaseSdk() {
    if (window.supabase?.createClient) return window.supabase;
    const sources = [
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
      "https://unpkg.com/@supabase/supabase-js@2"
    ];
    let lastError = null;
    for (const src of sources) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.onload = () => window.supabase?.createClient
            ? resolve()
            : reject(new Error("Supabase SDK 加载后未提供 createClient"));
          script.onerror = () => reject(new Error("无法加载 " + src));
          document.head.appendChild(script);
        });
        if (window.supabase?.createClient) return window.supabase;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Supabase SDK 不可用");
  }

  try {
    await ensureSupabaseSdk();
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = "账号模块加载失败：无法连接账号服务组件。请检查网络后重试（" + (error?.message || String(error)) + "）。";
      statusEl.className = "status bad";
    }
    return;
  }

  const { createClient } = window.supabase || {};
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
  window.dispatchEvent(new Event("acg-supabase-ready"));

  function showStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  function validUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  }

  let sessionRenderVersion = 0;
  async function renderSession(session) {
    const renderVersion = ++sessionRenderVersion;
    if (!session) {
      formsEl.classList.remove("hidden");
      profileEl.classList.add("hidden");
      window.acgHomeUpdatePlayerHUD?.(null);
      showStatus("尚未登录。可以注册新账号，或登录已有账号。", "");
      return;
    }

    window.acgHomeUpdatePlayerHUD?.(session.user.id);
    formsEl.classList.add("hidden");
    profileEl.classList.remove("hidden");
    document.getElementById("account-username").textContent =
      session.user.user_metadata?.username || "已登录玩家";

    const { data: profile, error } = await client
      .from("profiles")
      .select("username, created_at, player_number")
      .eq("id", session.user.id)
      .maybeSingle();

    if (renderVersion !== sessionRenderVersion) return;
    if (error) {
      showStatus("已登录，但暂时无法读取玩家资料：" + error.message, "bad");
      return;
    }

    if (profile) {
      document.getElementById("account-username").textContent = profile.username;
      const created = new Date(profile.created_at).toLocaleDateString("zh-CN");
      document.getElementById("account-created").textContent = "注册时间：" + created + (profile.player_number ? " · 玩家编号：" + profile.player_number : " · 玩家编号待管理员分配");
      showStatus(profile.player_number ? "登录成功，已绑定玩家编号 " + profile.player_number + "。" : "登录成功。请等待管理员为你分配玩家编号后再构筑卡组。", "good");
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
      } else if (data.user) {
        showStatus("注册请求已提交。当前账号需要先完成邮箱验证；请检查注册邮箱中的验证邮件，验证后再回来登录。", "good");
      } else {
        showStatus("注册请求已提交，但暂时无法确认账号状态。请稍后尝试登录；如果仍无法登录，请联系管理员检查 Supabase Auth 日志。", "bad");
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
      const message = error?.message || String(error);
      if (/email not confirmed/i.test(message)) {
        showStatus("登录失败：这个邮箱尚未完成验证。请检查邮箱，或联系管理员确认 Supabase 邮箱验证设置。", "bad");
      } else if (/invalid login credentials/i.test(message)) {
        showStatus("登录失败：邮箱或密码不正确。请确认使用注册时的邮箱和密码。", "bad");
      } else {
        showStatus("登录失败：" + message, "bad");
      }
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

  // Supabase Auth callbacks must stay synchronous. Defer database reads until
  // after the callback returns, and let the latest session render win.
  client.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => { void renderSession(session); }, 0);
  });

  client.auth.getSession().then(({ data, error }) => {
    if (error) showStatus("读取登录状态失败：" + error.message, "bad");
    setTimeout(() => { void renderSession(data?.session || null); }, 0);
  });

  const playerCenterScript = document.createElement("script");
  playerCenterScript.src = "./player-center.js?v=88";
  playerCenterScript.defer = true;
  playerCenterScript.onload = () => {
    const itemMailScript = document.createElement("script");
    itemMailScript.src = "./item-mail.js?v=23";
    itemMailScript.defer = true;
    document.body.appendChild(itemMailScript);
  };
  document.body.appendChild(playerCenterScript);
})();
