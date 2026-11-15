(() => {
  "use strict";
  const client=window.acgSupabaseClient,view=document.getElementById("player-center-view");
  if(!client||!view||view.dataset.itemMailReady==="1")return;
  view.dataset.itemMailReady="1";
  const $=(s,r=view)=>r.querySelector(s);
  const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n;};
  const input=(type,placeholder)=>{const n=el("input");n.type=type||"text";n.placeholder=placeholder||"";return n;};
  const select=opts=>{const n=el("select");opts.forEach(x=>n.add(new Option(x[0],x[1])));return n;};
  const field=(label,control)=>{const n=el("div","field");n.append(el("label","",label),control);return n;};
  const button=(label,cls)=>{const n=el("button",cls||"",label);n.type="button";return n;};
  const status=(n,msg,bad)=>{n.textContent=msg;n.className="status"+(bad?" bad":" good");};
  let cardsById={},packs=[],items=[],players=[];
  const cardName=id=>cardsById[id]?.name||id||"未知卡牌";
  const itemName=id=>items.find(x=>x.item_id===id)?.name||id||"未知道具";
  const playerLabel=p=>p.username+(p.player_number?" · "+p.player_number:" · 未绑定");
  async function loadStatic(){
    try{const [c,p]=await Promise.all([fetch("./data/cards.json",{cache:"no-store"}),fetch("./data/packs.json",{cache:"no-store"})]);if(c.ok)cardsById=Object.fromEntries((await c.json()).map(x=>[x.id,x]));if(p.ok)packs=await p.json();}catch(_){}
  }
  async function loadItems(){const {data,error}=await client.from("item_catalog").select("item_id,name,icon,description,category,effect_type,effect_config,is_active,created_at").order("created_at",{ascending:false});if(error)throw error;items=data||[];return items;}
  async function loadPlayers(){const {data,error}=await client.from("profiles").select("id,username,player_number").order("username");if(error)throw error;players=data||[];}

  const playerTabs=$(".pc-sidebar .pc-tabs")||$(".pc-tabs");
  function activate(tab){view.querySelectorAll(".pc-sidebar .pc-tabs [data-page],.pc-tabs [data-page]").forEach(x=>x.classList.toggle("active",x===tab));}
  if(playerTabs&&!playerTabs.querySelector('[data-page="item-box"]')){const tab=button("道具箱");tab.dataset.page="item-box";tab.addEventListener("click",()=>{activate(tab);void loadItemBox();});playerTabs.appendChild(tab);}
  if(playerTabs&&!playerTabs.querySelector('[data-page="mail"]')){const tab=button("邮件箱");tab.dataset.page="mail";tab.addEventListener("click",()=>{activate(tab);void loadMailbox();});playerTabs.appendChild(tab);}
  async function loadItemBox(){
    const host=$("#pc-personal-content");host.replaceChildren(el("h3","","我的道具箱"),el("p","pc-muted","活动奖励、消耗品和重要道具统一存放在这里。"));
    const list=el("div","pc-inventory-grid");host.appendChild(list);list.appendChild(el("div","pc-empty","正在读取道具……"));
    try{
      const inv=await client.from("card_inventory").select("card_id,quantity").gt("quantity",0);if(inv.error)throw inv.error;await loadItems();
      const owned=new Map((inv.data||[]).map(x=>[x.card_id,Number(x.quantity)])),rows=items.filter(x=>owned.has(x.item_id)&&x.item_id!=="consumable_tree_fruit_ticket");list.replaceChildren();
      if(!rows.length){list.appendChild(el("div","pc-empty","你还没有获得其他道具。树果卷仍可在「玩家仓库 → 消耗品」中使用；活动奖励可以通过邮件领取。"));return;}
      rows.forEach(item=>{
        const row=el("article","pc-inventory-card"),icon=el("div","pc-consumable-icon",item.icon||"🎁");
        icon.style.cssText="width:58px;height:82px;display:grid;place-items:center;flex:0 0 58px;border-radius:6px;background:#263d55;font-size:30px";
        const info=el("div","pc-card-info");info.append(el("strong","",item.name),el("small","",item.description||"暂无说明"),el("small","",(item.category==="consumable"?"消耗品":"重要道具")+" · 持有 × "+owned.get(item.item_id)));
        row.append(icon,info);
        if(item.category==="consumable"&&item.effect_type!=="none"&&item.is_active){const use=button("使用","primary");use.addEventListener("click",()=>useItem(item,use));row.appendChild(use);}
        list.appendChild(row);
      });
    }catch(error){list.replaceChildren(el("div","pc-empty","读取道具失败："+error.message));}
  }
  async function useItem(item,btn){
    if(btn.disabled)return;let request,key;try{const session=await client.auth.getSession();const uid=session.data?.session?.user?.id||"unknown";key="acg-item-use:"+uid+":"+item.item_id;request=localStorage.getItem(key);if(!request){request=crypto.randomUUID();localStorage.setItem(key,request);}}catch(_){request=crypto.randomUUID();}
    btn.disabled=true;const msg=el("p","status","正在使用「"+item.name+"」……");$("#pc-personal-content").prepend(msg);
    try{
      const {data,error}=await client.rpc("use_inventory_item",{p_item_id:item.item_id,p_request_id:request});if(error)throw error;try{if(key)localStorage.removeItem(key);}catch(_){}
      const result=Array.isArray(data)?data[0]:data;
      if(result?.cards?.length){const pack=packs.find(x=>x.id===result.result?.pack_id)||{id:result.result?.pack_id||"pack_010",name:result.result?.pack_name||"奖励卡包"};msg.textContent="使用成功，获得："+result.cards.map(x=>cardName(x.card_id)).join("、");window.acgShowItemPackOpening?.({...pack,pack_name:pack.name,draw_mode:pack.category==="berry"?"uniform":"rarity",price_tokens:0},result);}
      else if(result?.result?.kind==="tokens")msg.textContent="使用成功，获得 "+result.result.amount+" 代币。";
      else msg.textContent="使用成功，奖励已放入仓库。";
      status(msg,msg.textContent);await loadItemBox();
    }catch(error){status(msg,"使用失败："+error.message,true);btn.disabled=false;}
  }
  async function loadMailbox(){
    const host=$("#pc-personal-content");host.replaceChildren(el("h3","","邮件箱"),el("p","pc-muted","活动公告、补偿和奖励都会送到这里。奖励需要手动领取，每封邮件只能领取一次。"));
    const list=el("div","");host.appendChild(list);list.appendChild(el("div","pc-empty","正在读取邮件……"));
    try{
      const {data,error}=await client.rpc("player_list_mail");if(error)throw error;await loadItems();
      const mails=data||[];list.replaceChildren();const unread=mails.filter(x=>!x.read_at).length,tab=view.querySelector('[data-page="mail"]');
      if(tab)tab.textContent=unread?"邮件箱 ("+unread+")":"邮件箱";
      if(!mails.length){list.appendChild(el("div","pc-empty","暂时没有邮件。"));return;}
      for(const mail of mails){
        const card=el("article","pc-stat");card.style.margin="12px 0";
        const head=el("div","pc-row");head.append(el("strong","",mail.title),el("span","pc-muted",new Date(mail.created_at).toLocaleString("zh-CN")));card.appendChild(head);
        if(mail.body)card.appendChild(el("p","",mail.body));
        const attachments=Array.isArray(mail.attachments)?mail.attachments:[];
        card.appendChild(el("p","pc-muted","奖励内容："+attachments.map(a=>a.reward_type==="tokens"?a.amount+" 代币":a.reward_type==="card"?cardName(a.reward_id)+" × "+a.amount:itemName(a.reward_id)+" × "+a.amount).join("、")));
        const expired=mail.expires_at&&new Date(mail.expires_at).getTime()<=Date.now();
        card.appendChild(el("p",mail.claimed_at?"pc-positive":expired?"pc-negative":"pc-muted",mail.claimed_at?"已领取":expired?"已过期":"待领取"));
        if(!mail.read_at)await client.rpc("player_mark_mail_read",{p_mail_id:mail.mail_id});
        if(!mail.claimed_at&&!expired){const claim=button("领取奖励","primary");claim.addEventListener("click",async()=>{
          claim.disabled=true;claim.textContent="领取中……";
          try{const {data:r,error:e}=await client.rpc("player_claim_mail",{p_mail_id:mail.mail_id});if(e)throw e;if(r?.already_claimed)throw new Error("这封邮件已经领取过了。");await loadMailbox();alert("领取成功，奖励已发放到你的账户。");}
          catch(error){claim.disabled=false;claim.textContent="领取奖励";alert("领取失败："+error.message);}
        });card.appendChild(claim);}
        list.appendChild(card);
      }
    }catch(error){list.replaceChildren(el("div","pc-empty","邮件读取失败："+error.message));}
  }

  const admin=$("#pc-admin-panel"),nav=admin?.querySelector(".pc-admin-category-nav");
  if(admin&&nav){
    const addArea=(id,label)=>{
      if(admin.querySelector('[data-admin-category="'+id+'"]'))return;
      const pane=el("section","pc-admin-category-pane hidden");pane.dataset.adminCategory=id;
      const tab=button(label);tab.dataset.adminCategory=id;tab.setAttribute("role","tab");tab.setAttribute("aria-selected","false");
      tab.addEventListener("click",()=>{nav.querySelectorAll("button").forEach(x=>{const on=x.dataset.adminCategory===id;x.classList.toggle("active",on);x.setAttribute("aria-selected",String(on));});admin.querySelectorAll(".pc-admin-category-pane").forEach(x=>x.classList.toggle("hidden",x.dataset.adminCategory!==id));});
      nav.appendChild(tab);admin.appendChild(pane);
    };
    addArea("items","道具工坊");addArea("mail","邮件管理");
    nav.addEventListener("click",()=>setTimeout(()=>{const active=nav.querySelector("button.active")?.dataset.adminCategory;admin.querySelectorAll(".pc-admin-category-pane").forEach(x=>x.classList.toggle("hidden",x.dataset.adminCategory!==active));},0));
    buildItemWorkshop(admin.querySelector('[data-admin-category="items"]'));buildMailManager(admin.querySelector('[data-admin-category="mail"]'));
  }

  function buildItemWorkshop(pane){
    if(!pane)return;
    pane.append(el("h3","","道具工坊"),el("p","pc-muted","创建可重复使用的道具。说明文字只用于展示；实际效果由效果模板执行。新效果类型需要扩展系统，不会执行任意文字或脚本。"));
    const form=el("form",""),id=input("text","留空将自动生成编号，例如：item_...");id.maxLength=80;id.pattern="[a-z0-9][a-z0-9_-]{1,79}";id.required=false;
    const name=input("text","道具名称");name.maxLength=60;name.required=true;
    const icon=input("text","例如：🎟️");icon.maxLength=12;
    const desc=el("textarea");desc.rows=2;desc.maxLength=500;desc.placeholder="玩家可见说明";
    const category=select([["消耗品","consumable"],["重要道具","important"]]);
    const effect=select([["无效果（仅收藏）","none"],["抽取指定卡包","draw_pack"],["增加代币","grant_tokens"],["发放指定卡牌","grant_card"],["发放指定道具","grant_item"],["随机奖励（高级配置）","random_reward"]]);
    const config=el("div",""),cf={};
    function buildConfig(){
      config.replaceChildren();
      const add=(k,l,c)=>{cf[k]=c;config.appendChild(field(l,c));};
      if(effect.value==="draw_pack"){add("pack_id","目标卡包",select(packs.map(x=>[x.name+" · "+x.id,x.id])));const n=input("number");n.min="1";n.max="10";n.step="1";n.value="1";add("pack_count","抽取包数（每包 5 张）",n);}
      else if(effect.value==="grant_tokens"){const n=input("number");n.min="1";n.step="1";n.value="100";add("amount","代币数量",n);}
      else if(effect.value==="grant_card"){add("card_id","指定卡牌",select(Object.values(cardsById).map(x=>[x.name+" · "+x.id,x.id])));const n=input("number");n.min="1";n.step="1";n.value="1";add("amount","发放数量",n);}
      else if(effect.value==="grant_item"){add("item_id","指定道具",select(items.map(x=>[x.name+" · "+x.item_id,x.item_id])));const n=input("number");n.min="1";n.step="1";n.value="1";add("amount","发放数量",n);}
      else if(effect.value==="random_reward"){const j=el("textarea");j.rows=7;j.value=JSON.stringify({options:[{reward_type:"tokens",amount:100,weight:1},{reward_type:"card",reward_id:"card_001",amount:1,weight:1}]},null,2);add("json","随机奖励 JSON",j);config.appendChild(el("p","pc-muted",'格式：{"options":[{"reward_type":"tokens","amount":100,"weight":1},{"reward_type":"card","reward_id":"card_001","amount":1,"weight":1}]}。weight 为相对权重。'));}
      else config.appendChild(el("p","pc-muted","该道具不会执行自动效果。"));
    }
    effect.addEventListener("change",buildConfig);category.addEventListener("change",()=>{const important=category.value==="important";effect.disabled=important;if(important)effect.value="none";buildConfig();});buildConfig();
    const active=el("input");active.type="checkbox";active.checked=true;const activeLabel=el("label","");activeLabel.style.display="flex";activeLabel.style.gap="8px";activeLabel.append(active,el("span","","启用道具"));
    const save=button("保存道具","primary");save.type="submit";const reset=button("新建道具");reset.addEventListener("click",()=>{form.reset();id.readOnly=false;active.checked=true;buildConfig();});
    const msg=el("p","status","");
    form.append(field("道具编号（创建后建议保持不变）",id),field("道具名称",name),field("图标 / Emoji",icon),field("玩家可见说明",desc),field("道具类别",category),field("效果模板",effect),config,activeLabel,save,reset,msg);
    form.addEventListener("submit",async e=>{
      e.preventDefault();if(!id.value.trim())id.value="item_"+Date.now();if(!/^[a-z0-9][a-z0-9_-]{1,79}$/.test(id.value.trim())){status(msg,"道具编号格式不正确。",true);return;}
      let cfg={};try{
        if(effect.value==="draw_pack")cfg={pack_id:cf.pack_id.value,pack_count:Number(cf.pack_count.value)};
        else if(effect.value==="grant_tokens")cfg={amount:Number(cf.amount.value)};
        else if(effect.value==="grant_card")cfg={card_id:cf.card_id.value,amount:Number(cf.amount.value)};
        else if(effect.value==="grant_item")cfg={item_id:cf.item_id.value,amount:Number(cf.amount.value)};
        else if(effect.value==="random_reward")cfg=JSON.parse(cf.json.value);
      }catch(error){status(msg,"效果配置格式错误："+error.message,true);return;}
      save.disabled=true;status(msg,"正在保存道具……");
      try{const {error}=await client.rpc("admin_save_item",{p_item_id:id.value.trim(),p_name:name.value.trim(),p_icon:icon.value.trim()||"🎁",p_description:desc.value.trim(),p_category:category.value,p_effect_type:effect.value,p_effect_config:cfg,p_is_active:active.checked});if(error)throw error;status(msg,"道具已保存。玩家道具箱和邮件附件目录会使用这份资料。");await loadItems();renderItems();const mailPane=admin.querySelector('[data-admin-category="mail"]');if(mailPane?._refresh)await mailPane._refresh();}
      catch(error){status(msg,"保存失败："+error.message,true);}finally{save.disabled=false;}
    });
    pane.appendChild(form);
    const list=el("div","");pane.append(el("h4","","已登记道具"),list);
    function renderItems(){
      list.replaceChildren();if(!items.length){list.appendChild(el("div","pc-empty","还没有道具。"));return;}
      items.forEach(item=>{
        const row=el("div","pc-row"),info=el("div","");info.append(el("strong","",(item.icon||"🎁")+" "+item.name),el("div","pc-muted",item.item_id+" · "+item.category+" · "+item.effect_type+" · "+(item.is_active?"启用":"停用")),el("div","pc-muted",item.description||""));
        const edit=button("编辑");edit.addEventListener("click",()=>{id.value=item.item_id;id.readOnly=true;name.value=item.name;icon.value=item.icon||"🎁";desc.value=item.description||"";category.value=item.category;effect.value=item.effect_type;active.checked=item.is_active!==false;buildConfig();Object.entries(item.effect_config||{}).forEach(([k,v])=>{if(cf[k])cf[k].value=String(v);});if(cf.json)cf.json.value=JSON.stringify(item.effect_config,null,2);form.scrollIntoView({behavior:"smooth",block:"center"});});
        row.append(info,edit);list.appendChild(row);
      });
    }
    const adjustForm=el("form",""),player=select([["请选择玩家",""]]);players.forEach(p=>player.add(new Option(playerLabel(p),p.id)));
    const item=select([["请选择道具",""]]),delta=input("number");delta.step="1";delta.value="1";delta.required=true;
    const reason=input("text","活动奖励");reason.value="管理员道具库存调整";
    const adjust=button("调整库存","primary");adjust.type="submit";const adjustMsg=el("p","status","");
    adjustForm.append(field("玩家",player),field("道具",item),field("数量变化（正数增加，负数扣除）",delta),field("备注",reason),adjust,adjustMsg);
    adjustForm.addEventListener("submit",async e=>{e.preventDefault();const n=Number(delta.value);if(!player.value||!item.value||!Number.isSafeInteger(n)||n===0||!reason.value.trim()){status(adjustMsg,"请填写有效的玩家、道具、数量和备注。",true);return;}adjust.disabled=true;status(adjustMsg,"正在调整库存……");try{const {data,error}=await client.rpc("admin_adjust_card_inventory",{p_user_id:player.value,p_card_id:item.value,p_delta:n,p_reason:reason.value.trim()});if(error)throw error;status(adjustMsg,"调整成功，当前数量："+data);}catch(error){status(adjustMsg,"调整失败："+error.message,true);}finally{adjust.disabled=false;}});
    pane.append(el("h4","","道具库存调整"),adjustForm);
    function refreshOptions(){item.replaceChildren(new Option("请选择道具",""));items.forEach(x=>item.add(new Option(x.name+" · "+x.item_id,x.item_id)));}
    pane._refresh=async()=>{await loadStatic();await loadPlayers();await loadItems();player.replaceChildren(new Option("请选择玩家",""));players.forEach(p=>player.add(new Option(playerLabel(p),p.id)));refreshOptions();buildConfig();renderItems();};
    loadItems().then(()=>{refreshOptions();renderItems();}).catch(error=>list.appendChild(el("div","pc-empty","读取道具失败："+error.message)));
  }

  function buildMailManager(pane){
    if(!pane)return;
    pane.append(el("h3","","邮件管理"),el("p","pc-muted","奖励只有在玩家点击领取后才会入账。发送时固定收件人名单；全体邮件只发送给当前已注册账号。"));
    const form=el("form",""),title=input("text","例如：活动奖励");title.maxLength=100;title.required=true;
    const body=el("textarea");body.rows=4;body.maxLength=3000;body.placeholder="邮件正文（可选）";
    const target=select([["全体玩家","all"],["指定玩家","selected"]]),recipient=select([]);recipient.multiple=true;recipient.size=6;players.forEach(p=>recipient.add(new Option(playerLabel(p),p.id)));
    const recipientWrap=field("指定收件人（按住 Ctrl / Command 多选）",recipient);recipientWrap.hidden=true;target.addEventListener("change",()=>recipientWrap.hidden=target.value!=="selected");
    const expires=input("datetime-local"),attachments=el("div",""),add=button("＋ 添加奖励附件");
    function addRow(){
      const row=el("div","pc-grid"),type=select([["代币","tokens"],["卡牌","card"],["道具","item"]]),reward=select([["无需选择",""]]),amount=input("number");
      amount.min="1";amount.step="1";amount.value="1";const remove=button("移除");
      function fill(){reward.replaceChildren(new Option(type.value==="tokens"?"无需选择":"选择奖励",""));reward.disabled=type.value==="tokens";if(type.value==="card")Object.values(cardsById).forEach(x=>reward.add(new Option(x.name+" · "+x.id,x.id)));if(type.value==="item")items.filter(x=>x.is_active).forEach(x=>reward.add(new Option(x.name+" · "+x.item_id,x.item_id)));}
      type.addEventListener("change",fill);fill();remove.addEventListener("click",()=>row.remove());
      row.append(field("奖励类型",type),field("奖励内容",reward),field("数量",amount),remove);attachments.appendChild(row);
    }
    add.addEventListener("click",addRow);addRow();
    const send=button("发送邮件","primary");send.type="submit";const msg=el("p","status","");
    form.append(field("邮件标题",title),field("邮件正文",body),field("发送范围",target),recipientWrap,field("过期时间（可选）",expires),el("h4","","奖励附件"),attachments,add,send,msg);
    form.addEventListener("submit",async e=>{
      e.preventDefault();const data=[...attachments.children].map(row=>{const c=row.querySelectorAll("select,input");return {reward_type:c[0].value,reward_id:c[0].value==="tokens"?null:c[1].value,amount:Number(c[2].value)};});
      if(!title.value.trim()||!data.length||data.some(x=>!Number.isSafeInteger(x.amount)||x.amount<=0||(x.reward_type!=="tokens"&&!x.reward_id))){status(msg,"请检查邮件标题和奖励附件。",true);return;}
      const ids=[...recipient.selectedOptions].map(x=>x.value);if(target.value==="selected"&&!ids.length){status(msg,"请至少选择一名收件人。",true);return;}
      const args={p_title:title.value.trim(),p_body:body.value.trim(),p_target_type:target.value,p_user_ids:target.value==="selected"?ids:null,p_attachments:data,p_expires_at:expires.value?new Date(expires.value).toISOString():null};
      send.disabled=true;status(msg,"正在发送邮件……");
      try{const {data:r,error}=await client.rpc("admin_send_mail",args);if(error)throw error;status(msg,"发送成功："+r.recipient_count+" 名收件人，"+r.attachment_count+" 项奖励。");form.reset();target.value="all";recipientWrap.hidden=true;attachments.replaceChildren();addRow();await loadHistory();}
      catch(error){status(msg,"发送失败："+error.message,true);}finally{send.disabled=false;}
    });
    pane.appendChild(form);
    const history=el("div","");pane.append(el("h4","","最近发送记录"),history);
    async function loadHistory(){
      history.replaceChildren(el("p","pc-muted","正在读取邮件记录……"));
      try{const {data,error}=await client.rpc("admin_list_mail");if(error)throw error;history.replaceChildren();if(!data?.length){history.appendChild(el("div","pc-empty","还没有发送过邮件。"));return;}data.forEach(m=>{const row=el("div","pc-row"),info=el("div","");info.append(el("strong","",m.title),el("div","pc-muted",new Date(m.created_at).toLocaleString("zh-CN")),el("div","pc-muted","收件人 "+m.recipient_count+" 人 · 已领取 "+m.claimed_count+" 人"));row.appendChild(info);history.appendChild(row);});}
      catch(error){history.replaceChildren(el("div","pc-empty","读取邮件记录失败："+error.message));}
    }
    function refreshAttachmentOptions(){[...attachments.children].forEach(row=>{const selects=row.querySelectorAll("select");const type=selects[0]?.value,reward=selects[1];if(!reward)return;reward.replaceChildren(new Option(type==="tokens"?"无需选择":"选择奖励",""));if(type==="card")Object.values(cardsById).forEach(x=>reward.add(new Option(x.name+" · "+x.id,x.id)));if(type==="item")items.filter(x=>x.is_active).forEach(x=>reward.add(new Option(x.name+" · "+x.item_id,x.item_id)));});}
    pane._loadHistory=loadHistory;
    pane._refresh=async()=>{await loadStatic();await loadPlayers();await loadItems();recipient.replaceChildren();players.forEach(p=>recipient.add(new Option(playerLabel(p),p.id)));refreshAttachmentOptions();await loadHistory();};
    loadHistory();
  }
  async function refreshAdmin(){
    if(!admin)return;
    try{await Promise.all([loadStatic(),loadPlayers(),loadItems()]);const ip=admin.querySelector('[data-admin-category="items"]'),mp=admin.querySelector('[data-admin-category="mail"]');if(ip?._refresh)await ip._refresh();if(mp?._refresh)await mp._refresh();}catch(_){}
  }
  client.auth.onAuthStateChange((_event,session)=>{if(session?.user)setTimeout(()=>{void refreshAdmin();},0);});
  void refreshAdmin();void loadStatic();void loadItems().catch(()=>{});
})();