(() => {
  "use strict";
  const client = window.acgSupabaseClient;
  const main = document.querySelector("main");
  const nav = document.querySelector("nav.tabs");
  if (!client || !main || !nav || document.getElementById("player-center-view")) return;

  const style = document.createElement("style");
  style.textContent += "#player-center-view .pc-pagination{display:flex;justify-content:center;align-items:center;gap:7px;flex-wrap:wrap;margin:16px 0;padding:12px;background:#10233a;border:1px solid #42617e;border-radius:8px}#player-center-view .pc-pagination button{padding:7px 11px;border:1px solid #587795;border-radius:5px;background:#193653;color:#eef7ff;cursor:pointer}#player-center-view .pc-pagination button.active{background:#d6ad58;color:#172033;font-weight:900}#player-center-view .pc-pagination button:disabled{opacity:.4;cursor:not-allowed}";
  style.textContent = "#player-center-view .pc-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}#player-center-view .pc-tabs button{padding:8px 12px}#player-center-view .pc-tabs button.active{background:#5967a5;border-color:#7181c7}#player-center-view .pc-tabs button[data-page=draw]{background:linear-gradient(135deg,#f3d889,#c99a3e);border:1px solid #ffe6a0;color:#211807;font-weight:900;padding:10px 19px;box-shadow:0 3px 14px #d6a84455;position:relative}#player-center-view .pc-tabs button[data-page=draw]:before{content:'🎴';margin-right:6px}#player-center-view .pc-tabs button[data-page=draw].active{background:linear-gradient(135deg,#ffe9a6,#e0ad4c);border-color:#fff0bb;box-shadow:0 0 0 2px #e9bd5944,0 4px 18px #e0ad4c66;transform:translateY(-1px)}#player-center-view .pc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:12px 0}#player-center-view .pc-stat{padding:14px;background:#222536;border:1px solid #383d50;border-radius:10px}#player-center-view .pc-stat strong{display:block;font-size:22px;margin-top:5px}#player-center-view .pc-row{display:flex;justify-content:space-between;gap:12px;padding:12px 4px;border-bottom:1px solid #383d50}#player-center-view .pc-muted{color:#a6abc0;font-size:13px;line-height:1.6}#player-center-view .pc-positive{color:#8bd5a7}#player-center-view .pc-negative{color:#ff9b9b}#player-center-view .pc-search{display:flex;gap:8px;align-items:end;flex-wrap:wrap}#player-center-view .pc-search .field{flex:1;min-width:190px}#player-center-view .pc-empty{padding:18px;text-align:center;color:#a6abc0;background:#222536;border:1px solid #383d50;border-radius:10px}#player-center-view .pc-draw-card{display:flex;align-items:center;gap:14px;padding:12px;border:1px solid #383d50;border-radius:10px;margin:10px 0}#player-center-view .pc-draw-card img{width:84px;height:116px;object-fit:contain;border-radius:6px}#player-center-view .pc-draw-card .pc-draw-info{flex:1}#player-center-view .pc-inventory-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;margin-top:12px}#player-center-view .pc-inventory-card{display:flex;gap:10px;align-items:center;min-width:0;padding:9px;background:#222536;border:1px solid #383d50;border-radius:10px}#player-center-view .pc-inventory-card img{width:58px;height:82px;object-fit:contain;flex:0 0 auto;border-radius:5px;background:#151824}#player-center-view .pc-inventory-card .pc-card-info{flex:1;min-width:0}#player-center-view .pc-inventory-card .pc-card-info strong{display:block;overflow-wrap:anywhere;font-size:13px}#player-center-view .pc-inventory-card .pc-card-info small{display:block;color:#a6abc0;font-size:11px;margin-top:4px}#player-center-view .pc-quantity-controls{display:flex;align-items:center;gap:6px;margin-top:7px}#player-center-view .pc-quantity-controls button{min-width:30px;width:30px;height:30px;padding:0;font-size:18px}#player-center-view .pc-quantity-controls strong{min-width:22px;text-align:center;font-variant-numeric:tabular-nums}#player-center-view .pc-quantity-controls button:disabled{opacity:.35;cursor:not-allowed}@media(max-width:600px){#player-center-view .pc-row{align-items:flex-start;flex-direction:column;gap:4px}}\n/* P3R player-center subpage shell */\n#player-center-view{margin-top:18px!important;padding:clamp(14px,2vw,26px)!important;background:linear-gradient(145deg,#eafaff,#cceaf3)!important;color:#09243d!important;border:1px solid #83bfd2!important;border-top:5px solid #e83c63!important;box-shadow:8px 8px 0 #031226!important}\n#player-center-view>.panel:first-child{background:transparent!important;border:0!important;box-shadow:none!important;padding:0 0 12px!important;border-bottom:1px solid #7eb8ca!important}\n#player-center-view>.panel:first-child h3{font-size:clamp(24px,3vw,36px)!important;letter-spacing:.04em!important;color:#082c4b!important}\n#player-center-view .pc-tabs{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin:0!important;padding:14px 0!important}\n#player-center-view .pc-tabs button{min-height:43px!important;text-align:left!important;padding:10px 12px!important;background:linear-gradient(100deg,#0a2b49,#155477)!important;color:#effcff!important;border:0!important;border-left:5px solid #20c5df!important;border-bottom:1px solid #8bbccc!important;clip-path:polygon(0 0,100% 0,95% 100%,0 100%)!important;border-radius:0!important;font-weight:900!important}\n#player-center-view .pc-tabs button:nth-child(2n){border-left-color:#e83c63!important}\n#player-center-view .pc-tabs button.active{background:linear-gradient(100deg,#f6fdff,#bdeaf4)!important;color:#092b48!important;box-shadow:3px 3px 0 #e83c63!important}\n#player-center-view #pc-personal-content>.pc-grid .pc-stat,#player-center-view .pc-stat,#player-center-view .pc-empty,#player-center-view .pc-inventory-card,#player-center-view .pc-draw-card{background:linear-gradient(145deg,#f8fdff,#d7eff6)!important;color:#0a2a45!important;border:1px solid #8bbdce!important;border-radius:0!important;box-shadow:3px 4px 0 #b4dbe6!important}\n#player-center-view .pc-muted{color:#41677e!important}\n#player-center-view .pc-row{border-bottom:1px solid #a5cbd7!important;color:#143b57!important}\n#player-center-view .pc-positive{color:#147a62!important}\n#player-center-view .pc-negative{color:#bb3152!important}\n#player-center-view .pc-empty{padding:20px!important}\n#player-center-view #pc-display-editor{border-color:#8bbdce!important}\n#player-center-view .pc-tabs button[data-page=draw]{background:linear-gradient(100deg,#f5e7a9,#d5b34d)!important;color:#3b2b08!important;border-left-color:#e8c94c!important}\n@media(max-width:650px){#player-center-view .pc-tabs{grid-template-columns:1fr 1fr!important}}\n";
  style.textContent += "#acg-ten-draw{position:fixed;inset:0;z-index:99999;background:radial-gradient(ellipse at 50% 0%,#38465b 0,#111827 55%,#050811 100%);color:#edf4ff;display:flex;flex-direction:column;overflow:auto;font-family:Inter,\"Microsoft YaHei\",sans-serif}#acg-ten-draw *{box-sizing:border-box}#acg-ten-draw .acg-td-top{padding:14px 22px;border-bottom:1px solid #ffffff22;background:#070b13d9;display:flex;justify-content:space-between;align-items:center;gap:12px}#acg-ten-draw .acg-td-brand{font-weight:1000;letter-spacing:3px}#acg-ten-draw .acg-td-brand b{color:#f3d36f}#acg-ten-draw .acg-td-balance{font-size:11px;color:#f5d98c;border:1px solid #8e7948;padding:7px 10px}#acg-ten-draw .acg-td-main{width:min(1120px,100%);margin:auto;padding:22px 18px 45px}#acg-ten-draw .acg-td-title{text-align:center;margin:0 0 20px}#acg-ten-draw .acg-td-title small{color:#8dddf5;letter-spacing:4px;font-weight:800}#acg-ten-draw .acg-td-title h2{font-size:clamp(24px,4vw,36px);letter-spacing:3px;margin:7px 0}#acg-ten-draw .acg-td-title p{font-size:12px;color:#aab8ca;margin:0}#acg-ten-draw .acg-td-stage{position:relative;border:1px solid #56637a;background:radial-gradient(ellipse at 50% 42%,#414b5d 0,#222b3d 40%,#111827 78%);padding:22px 16px;box-shadow:0 20px 55px #0009,inset 0 0 55px #0008}#acg-ten-draw .acg-td-stage:before{content:\"\";position:absolute;inset:8px;border:1px solid #c2a65b55;pointer-events:none}#acg-ten-draw .acg-td-stagehead{text-align:center;position:relative;z-index:1}#acg-ten-draw .acg-td-stagehead b{color:#f5d77f;letter-spacing:3px;font-size:14px}#acg-ten-draw .acg-td-stagehead p{font-size:11px;color:#aab8ca;margin:6px 0 0}#acg-ten-draw .acg-td-packs{position:relative;z-index:1;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px 15px;max-width:800px;margin:24px auto 0;perspective:900px}#acg-ten-draw .acg-td-pack{position:relative;aspect-ratio:.69;min-width:0;max-height:220px;border:2px solid #d8bd69;background:radial-gradient(ellipse at 50% 42%,#e2c66b55,transparent 55%),linear-gradient(140deg,#334f71,#17243a 58%,#080d17);box-shadow:0 9px 18px #0009,inset 0 0 22px #7aa4d333;overflow:hidden;animation:acgPackIn .6s both;animation-delay:calc(var(--i)*55ms);transition:.3s}#acg-ten-draw .acg-td-pack:nth-child(n+6){transform:translateY(14px)}#acg-ten-draw .acg-td-pack:before{content:\"\";position:absolute;inset:6px;border:1px solid #e8d28b77}#acg-ten-draw .acg-td-pack:after{content:\"ACG\";position:absolute;left:0;right:0;top:43%;text-align:center;font-size:clamp(17px,2.4vw,27px);font-weight:1000;letter-spacing:4px;color:#f2d989;text-shadow:0 2px 8px #000,0 0 16px #e7be5b}#acg-ten-draw .acg-td-pack.r4{border-color:#9bc5ff;box-shadow:0 0 13px #7ab8ff88,0 9px 18px #0009}#acg-ten-draw .acg-td-pack.r5{border-color:#ffdc69;box-shadow:0 0 22px #ffdb65dd,0 0 5px #fff,0 9px 18px #0009}#acg-ten-draw .acg-td-pack.alt{border-color:#ed9dff;box-shadow:0 0 26px #db80ff,0 0 7px #fff,0 9px 18px #0009}#acg-ten-draw .acg-td-pack.opened{opacity:.28;filter:grayscale(.8)}#acg-ten-draw .acg-td-pack.opened:after{content:\"✓\";font-size:40px;top:36%;color:white}#acg-ten-draw .acg-td-pack span{position:absolute;bottom:10px;left:0;right:0;text-align:center;font-size:9px;letter-spacing:2px;z-index:1;text-shadow:0 2px 5px #000}#acg-ten-draw .acg-td-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:26px auto 0;position:relative;z-index:2}#acg-ten-draw button{cursor:pointer;color:inherit;font:inherit}#acg-ten-draw .acg-td-btn{min-width:145px;padding:12px 20px;border:1px solid #66758b;background:linear-gradient(#25344b,#121d2e);font-weight:900;font-size:12px;letter-spacing:2px}#acg-ten-draw .acg-td-btn.primary{color:#191711;border-color:#fff0b0;background:linear-gradient(110deg,#c59c42,#ffe99b 48%,#d4a34c);box-shadow:0 0 24px #eac65a55}#acg-ten-draw .acg-td-btn:disabled{opacity:.35;cursor:not-allowed}#acg-ten-draw .acg-td-reveal{display:none;margin-top:22px;padding:18px;border:1px solid #53637a;background:#0c1422ed;position:relative;z-index:2}#acg-ten-draw .acg-td-reveal.show{display:block;animation:acgFade .35s}#acg-ten-draw .acg-td-rhead{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:14px}#acg-ten-draw .acg-td-rhead b{font-size:14px;letter-spacing:2px}#acg-ten-draw .acg-td-rhead span{font-size:11px;color:#aab8ca}#acg-ten-draw .acg-td-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}#acg-ten-draw .acg-td-card{min-width:0;perspective:900px;cursor:pointer}#acg-ten-draw .acg-td-inner{position:relative;aspect-ratio:2/2.9;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.2,.75,.2,1)}#acg-ten-draw .acg-td-card.flip .acg-td-inner{transform:rotateY(180deg)}#acg-ten-draw .acg-td-face{position:absolute;inset:0;backface-visibility:hidden;overflow:hidden;border:1px solid #697b92;background:#16243a}#acg-ten-draw .acg-td-back{display:grid;place-items:center;background:repeating-linear-gradient(135deg,#172b45 0 7px,#263d5c 7px 14px)}#acg-ten-draw .acg-td-back:after{content:\"ACG\";font-size:clamp(15px,2vw,24px);font-weight:1000;letter-spacing:3px;color:#d9c17c;text-shadow:0 0 12px #e5c65e}#acg-ten-draw .acg-td-front{transform:rotateY(180deg)}#acg-ten-draw .acg-td-front img{width:100%;height:100%;object-fit:cover;display:block}#acg-ten-draw .acg-td-front strong{position:absolute;bottom:0;left:0;right:0;text-align:center;padding:22px 4px 6px;background:linear-gradient(transparent,#050912);font-size:clamp(9px,1vw,12px)}#acg-ten-draw .acg-td-card.r5 .acg-td-front{border:2px solid #ffdb72;box-shadow:0 0 16px #ffd65b}#acg-ten-draw .acg-td-card.r4 .acg-td-front{border:2px solid #9ec8ff;box-shadow:0 0 13px #8bbaff}#acg-ten-draw .acg-td-card.alt .acg-td-front{border:2px solid #e9a0ff;box-shadow:0 0 20px #e69aff}#acg-ten-draw .acg-td-cardname{text-align:center;font-size:10px;color:#aab6c8;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#acg-ten-draw .acg-td-card:not(.flip) .acg-td-cardname{color:#5f6e84}#acg-ten-draw .acg-td-summary{text-align:center;color:#aab8ca;font-size:12px;margin-top:14px}#acg-ten-draw .acg-td-summary b{color:#f3d77e}#acg-ten-draw .acg-td-close{position:fixed;top:10px;right:14px;z-index:5;background:#121b2a;border:1px solid #68758a;padding:8px 12px;font-size:12px}@keyframes acgPackIn{from{opacity:0;transform:translateY(38px) rotateX(20deg) scale(.82)}to{opacity:1;transform:none}}@keyframes acgFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@media(max-width:650px){#acg-ten-draw .acg-td-main{padding:16px 9px 32px}#acg-ten-draw .acg-td-stage{padding:17px 8px}#acg-ten-draw .acg-td-packs{gap:8px 5px}#acg-ten-draw .acg-td-pack:before{inset:3px}#acg-ten-draw .acg-td-pack span{font-size:7px;letter-spacing:1px}#acg-ten-draw .acg-td-cards{gap:7px}#acg-ten-draw .acg-td-reveal{padding:12px}#acg-ten-draw .acg-td-btn{min-width:120px;padding:10px 12px}}@media(max-width:420px){#acg-ten-draw .acg-td-cards{grid-template-columns:repeat(3,minmax(0,1fr))}#acg-ten-draw .acg-td-title p{font-size:10px}}";


  style.textContent += "#acg-draw-lobby{position:fixed;inset:0;z-index:99990;overflow:auto;background:radial-gradient(ellipse at 50% 0%,#1b2940 0,#101827 48%,#090e18 100%);color:#edf4ff;font-family:Inter,\"Microsoft YaHei\",sans-serif}#acg-draw-lobby *{box-sizing:border-box}#acg-draw-lobby .adl-top{height:55px;padding:0 max(18px,calc((100vw - 1120px)/2));display:flex;align-items:center;justify-content:space-between;background:#070b13e8;border-bottom:1px solid #ffffff1c}#acg-draw-lobby .adl-brand{font-weight:1000;letter-spacing:3px}#acg-draw-lobby .adl-brand b{color:#efc45d}#acg-draw-lobby .adl-topright{display:flex;gap:12px;align-items:center}#acg-draw-lobby .adl-token{border:1px solid #34445c;padding:8px 12px;color:#eecb78;font-size:12px}#acg-draw-lobby button{font:inherit;cursor:pointer;color:inherit}#acg-draw-lobby .adl-close{border:1px solid #53637a;background:#172235;padding:8px 13px;font-size:12px}#acg-draw-lobby .adl-main{max-width:1160px;margin:auto;padding:30px 20px 55px}#acg-draw-lobby .adl-eyebrow{text-align:center;color:#78d9f4;font-size:10px;letter-spacing:5px;font-weight:800}#acg-draw-lobby .adl-hero{display:flex;align-items:end;justify-content:space-between;gap:15px;margin:8px 0 24px}#acg-draw-lobby .adl-hero h1{font-size:clamp(28px,4vw,42px);margin:0 0 5px;letter-spacing:2px}#acg-draw-lobby .adl-hero p{font-size:12px;color:#aab8ca;margin:0}#acg-draw-lobby .adl-tokenbox{border:1px solid #34445c;border-radius:5px;padding:12px 18px;white-space:nowrap;color:#aab8ca;font-size:11px}#acg-draw-lobby .adl-tokenbox b{font-size:21px;color:#f1bd56;margin-left:12px}#acg-draw-lobby .adl-section{display:flex;align-items:center;gap:12px;margin:25px 0 12px;font-weight:800;font-size:14px}#acg-draw-lobby .adl-section small{font-size:9px;color:#91a9c7;font-weight:400}#acg-draw-lobby .adl-section:after{content:\"\";height:1px;flex:1;background:#35435a}#acg-draw-lobby .adl-pools{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px}#acg-draw-lobby .adl-pool{border:1px solid #394b64;background:#0d1522;border-radius:8px;overflow:hidden;cursor:pointer;transition:.2s;min-width:0}#acg-draw-lobby .adl-pool.active{border:2px solid #e9bd59;box-shadow:0 0 0 1px #e9bd5944,inset 0 0 20px #e9bd5911}#acg-draw-lobby .adl-cover{height:170px;display:grid;place-items:center;position:relative;overflow:hidden;background:radial-gradient(ellipse,#526a85,#18263a 60%,#0c1421)}#acg-draw-lobby .adl-cover:before{content:\"\";position:absolute;width:75%;aspect-ratio:1;transform:rotate(45deg);background:#07101caa;border:1px solid #ffffff22}#acg-draw-lobby .adl-cover img{height:145px;max-width:78%;object-fit:contain;position:relative;z-index:1;transform:rotate(-7deg);filter:drop-shadow(0 8px 10px #000b)}#acg-draw-lobby .adl-pool:nth-child(2) .adl-cover{background:radial-gradient(ellipse,#65517b,#211b37 60%,#0c1421)}#acg-draw-lobby .adl-pool:nth-child(3) .adl-cover{background:radial-gradient(ellipse,#805339,#30202a 60%,#0c1421)}#acg-draw-lobby .adl-pool:nth-child(4) .adl-cover{background:radial-gradient(ellipse,#285d7b,#142b43 60%,#0c1421)}#acg-draw-lobby .adl-poolinfo{padding:12px 14px 14px}#acg-draw-lobby .adl-poolinfo h3{margin:0 0 5px;font-size:15px}#acg-draw-lobby .adl-poolinfo p{margin:0 0 7px;color:#9eafc7;font-size:11px}#acg-draw-lobby .adl-poolinfo strong{font-size:11px;color:#edc15d}#acg-draw-lobby .adl-config{margin-top:26px;padding:17px 18px;border:1px solid #34445c;background:#111b2a;border-radius:6px;display:flex;align-items:center;justify-content:space-between;gap:15px}#acg-draw-lobby .adl-config h3{font-size:16px;margin:0 0 5px}#acg-draw-lobby .adl-config p{font-size:11px;color:#9eafc7;margin:0}#acg-draw-lobby .adl-actions{display:flex;gap:9px;flex-wrap:wrap}#acg-draw-lobby .adl-btn{border:1px solid #596a81;background:#1c2b40;padding:12px 16px;font-size:12px;font-weight:800;white-space:nowrap}#acg-draw-lobby .adl-btn.primary{background:linear-gradient(110deg,#c59c42,#ffe99b);color:#17130a;border-color:#ffe7a2;box-shadow:0 0 20px #eac65a33}#acg-draw-lobby .adl-rates{font-size:11px;color:#aab8ca;margin:13px 0 0;display:flex;gap:16px;flex-wrap:wrap}#acg-draw-lobby .adl-rates .alt{color:#e99bff}#acg-draw-lobby .adl-rates .r5{color:#ffda73}#acg-draw-lobby .adl-rates .r4{color:#a8caff}#acg-draw-lobby .adl-history{margin-top:28px;border-top:1px solid #34445c;padding-top:16px}#acg-draw-lobby .adl-history h3{font-size:14px}#acg-draw-lobby .adl-historyrow{display:flex;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid #ffffff12;font-size:12px;color:#dbe4f2}#acg-draw-lobby .adl-historyrow img{width:38px;height:52px;object-fit:contain}#acg-draw-lobby .adl-muted{color:#91a1b8;font-size:11px}#acg-draw-lobby .adl-status{margin:12px 0;color:#f2cd77;font-size:12px;min-height:18px}@media(max-width:680px){#acg-draw-lobby .adl-main{padding:20px 11px 35px}#acg-draw-lobby .adl-hero{align-items:flex-start;flex-direction:column}#acg-draw-lobby .adl-config{align-items:flex-start;flex-direction:column}#acg-draw-lobby .adl-actions{width:100%}#acg-draw-lobby .adl-btn{flex:1}#acg-draw-lobby .adl-cover{height:140px}#acg-draw-lobby .adl-cover img{height:120px}}";
  style.textContent += "/* P3R skin: scoped to player center only; draw screens retain their original dedicated theme */#player-center-view{color:#16375e}#player-center-view .panel{background:linear-gradient(145deg,#ffffff,#e8f8ff)!important;border:1px solid #8bdcf0!important;border-radius:3px!important;box-shadow:0 8px 24px #14518a20!important}#player-center-view h2,#player-center-view h3,#player-center-view h4{color:#0756a6!important;font-style:italic;font-weight:1000}#player-center-view .pc-stat,#player-center-view .pc-empty,#player-center-view .pc-inventory-card,#player-center-view .pc-draw-card{background:linear-gradient(145deg,#ffffff,#eaf8ff)!important;border:1px solid #8bdcf0!important;border-radius:3px!important;color:#16375e!important}#player-center-view .pc-row{border-color:#c2e3ef!important}#player-center-view button{border-radius:2px!important}#player-center-view input,#player-center-view select{background:#ffffff!important;color:#16375e!important;border:1px solid #7dcce4!important;border-radius:2px!important}";
  style.textContent += "/* Admin draw-pool controls: high-contrast text on the light P3R panel */#player-center-view #pc-admin-pool-list .pc-row{color:#123f62!important}#player-center-view #pc-admin-pool-list .pc-row strong{display:block;color:#0756a6!important;font-size:15px;font-weight:1000}#player-center-view #pc-admin-pool-list .pc-row .pc-muted{color:#315f7c!important;font-weight:600}#player-center-view #pc-admin-pool-list .pc-row .pc-positive{color:#08765e!important;font-weight:900}#player-center-view #pc-admin-pool-list button{background:linear-gradient(110deg,#07558a,#087eb4)!important;color:#fff!important;border:1px solid #0b5683!important;text-shadow:none!important;font-weight:900!important}#player-center-view #pc-admin-pool-list button:hover{filter:brightness(1.12)}#player-center-view #pc-pool-form label{color:#174767!important;font-weight:800!important}#player-center-view #pc-pool-form select,#player-center-view #pc-pool-form input{color:#092f50!important;background:#fff!important;font-weight:700!important}";
  style.textContent += "#player-center-view .pc-admin-category-nav{grid-template-columns:repeat(5,minmax(0,1fr))!important}#player-center-view .pc-admin-category-nav button{min-width:0;white-space:normal;line-height:1.35;text-align:center}@media(max-width:700px){#player-center-view .pc-admin-category-nav{grid-template-columns:repeat(2,minmax(0,1fr))!important}}#player-center-view .pc-warehouse-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:14px 0}#player-center-view .pc-warehouse-tabs button,#player-center-view .pc-admin-category-nav button{min-height:44px;padding:10px 12px;border:1px solid #79b7ce;background:linear-gradient(135deg,#123c5d,#176184);color:#f4fcff;font-weight:900;cursor:pointer;border-radius:3px}#player-center-view .pc-warehouse-tabs button.active,#player-center-view .pc-admin-category-nav button.active{background:linear-gradient(135deg,#fff1bd,#e3b957);color:#17304a;border-color:#d7a944;box-shadow:0 3px 0 #9d7631}#player-center-view .pc-admin-category-nav{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px;margin:14px 0 18px;padding:12px;background:#d8f1f8;border:1px solid #8bbdce}#player-center-view .pc-admin-category-pane{padding:16px;background:linear-gradient(145deg,#f8fdff,#e1f4fa);border:1px solid #9ac9d8;margin:8px 0 16px}#player-center-view .pc-admin-category-pane>h3:first-child,#player-center-view .pc-admin-category-pane>h4:first-child{margin-top:0}@media(max-width:650px){#player-center-view .pc-warehouse-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}}";
  style.textContent += "/* Player center: real two-column navigation/content layout */#player-center-view{margin-top:18px!important;padding:clamp(14px,2vw,26px)!important;background:linear-gradient(145deg,#eafaff,#cceaf3)!important;color:#09243d!important;border:1px solid #83bfd2!important;border-top:5px solid #e83c63!important;box-shadow:8px 8px 0 #031226!important}#player-center-view>.panel:first-child{background:transparent!important;border:0!important;box-shadow:none!important;padding:0 0 12px!important;border-bottom:1px solid #7eb8ca!important}#player-center-view>.panel:first-child h3{font-size:clamp(24px,3vw,36px)!important;letter-spacing:.04em!important;color:#082c4b!important}#player-center-view #pc-personal{display:grid;grid-template-columns:minmax(190px,230px) minmax(0,1fr);grid-template-rows:auto 1fr auto;gap:0 22px;align-items:start}#player-center-view #pc-personal>#pc-login-hint{grid-column:1/-1}#player-center-view #pc-personal>.pc-tabs{grid-column:1;grid-row:2;display:flex!important;flex-direction:column!important;gap:7px!important;margin:0!important;padding:0!important;position:sticky;top:12px}#player-center-view #pc-personal>.pc-tabs button{width:100%;min-height:46px!important;text-align:left!important;padding:11px 14px!important;background:linear-gradient(100deg,#0a2b49,#155477)!important;color:#effcff!important;border:0!important;border-left:5px solid #20c5df!important;border-bottom:1px solid #8bbccc!important;clip-path:polygon(0 0,100% 0,95% 100%,0 100%)!important;border-radius:0!important;font-weight:900!important}#player-center-view #pc-personal>.pc-tabs button:nth-child(even){border-left-color:#e83c63!important}#player-center-view #pc-personal>.pc-tabs button.active{background:linear-gradient(100deg,#f6fdff,#bdeaf4)!important;color:#092b48!important;box-shadow:3px 3px 0 #e83c63!important}#player-center-view #pc-personal-content,#player-center-view #pc-display-editor{grid-column:2;min-width:0}#player-center-view #pc-personal-content{grid-row:2;background:linear-gradient(145deg,#faffff,#e4f6fb);border:1px solid #8bbdce;padding:clamp(14px,2vw,24px);min-height:360px;box-shadow:3px 4px 0 #b4dbe6}#player-center-view #pc-display-editor{grid-row:3;margin-top:18px!important;background:#e5f5fa;padding:16px!important;border:1px solid #8bbdce!important}#player-center-view .pc-muted{color:#41677e!important}#player-center-view .pc-positive{color:#147a62!important}#player-center-view .pc-negative{color:#bb3152!important}#player-center-view .pc-empty{padding:20px!important}@media(max-width:760px){#player-center-view #pc-personal{grid-template-columns:1fr;gap:12px}#player-center-view #pc-personal>.pc-tabs{grid-column:1;grid-row:auto;position:static;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))}#player-center-view #pc-personal-content,#player-center-view #pc-display-editor{grid-column:1;grid-row:auto}}";



  style.textContent += `
#player-center-view #pc-admin-panel.hidden{display:none!important}
#player-center-view #pc-admin-panel:not(.hidden){display:block!important;width:100%!important;min-width:0!important;box-sizing:border-box!important}
#player-center-view #pc-admin-panel .pc-admin-pane-host{display:block!important;width:100%!important;max-width:none!important;min-width:0!important;box-sizing:border-box!important}
#player-center-view #pc-admin-panel .pc-admin-category-pane.hidden{display:none!important}
#player-center-view #pc-admin-panel .pc-admin-category-pane:not(.hidden){display:block!important;float:none!important;clear:both!important;width:100%!important;max-width:none!important;min-width:0!important;box-sizing:border-box!important}
#player-center-view .pc-pagination{grid-column:1/-1!important;width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;overflow:visible!important}
  `;


  /* ACG electric cyan season theme for player center, draw lobby and ten-draw */
  /* Draw lobby and pack-opening styles above are intentionally isolated from the global page. */
  style.textContent += "/* Player center layout: dedicated category rail and content surface */#player-center-view .pc-layout{display:grid;grid-template-columns:218px minmax(0,1fr);gap:16px;align-items:stretch;margin-top:16px}#player-center-view .pc-sidebar{min-width:0;padding:12px 10px;background:linear-gradient(160deg,#07172c,#0b3155 70%,#06172b);border-left:5px solid #e83c63;box-shadow:5px 5px 0 #09223c;align-self:start;position:sticky;top:14px}#player-center-view .pc-sidebar:before{content:'PLAYER MENU / 玩家菜单';display:block;padding:4px 8px 12px;color:#8cecff;font-size:10px;font-weight:900;letter-spacing:.12em;border-bottom:1px solid #4c7996;margin-bottom:9px}#player-center-view .pc-sidebar .pc-tabs{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;gap:6px!important;margin:0!important;padding:0!important}#player-center-view .pc-sidebar .pc-tabs button{width:100%;min-height:44px;text-align:left!important;padding:11px 12px!important;clip-path:polygon(0 0,100% 0,94% 100%,0 100%)!important}#player-center-view .pc-sidebar .pc-tabs button.active{background:linear-gradient(100deg,#f5ffff,#bdeaf4)!important;color:#082b4c!important;border-left-color:#e83c63!important}#player-center-view .pc-mainpane{min-width:0}#player-center-view .pc-mainpane>.panel{margin:0!important;min-width:0}#player-center-view #pc-personal-content{min-width:0;min-height:150px}#player-center-view #pc-display-editor{margin-top:22px!important;padding-top:18px!important;border-top:1px solid #9bcbd9!important}#player-center-view #pc-display-editor .field{margin:12px 0}#player-center-view #pc-display-editor button{margin-top:8px}@media(max-width:760px){#player-center-view .pc-layout{grid-template-columns:1fr;gap:12px}#player-center-view .pc-sidebar{position:static;padding:10px;border-left-width:4px}#player-center-view .pc-sidebar:before{padding-bottom:8px}#player-center-view .pc-sidebar .pc-tabs{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important}#player-center-view .pc-sidebar .pc-tabs button{min-height:40px;padding:9px!important;font-size:12px}}";
  style.textContent += "#player-center-view #pc-personal{display:block!important;min-width:0;grid-template-columns:none!important;grid-template-rows:none!important}#player-center-view #pc-personal>.pc-tabs{display:none!important}#player-center-view .pc-mainpane>.panel{padding:clamp(14px,2vw,24px)!important;background:linear-gradient(145deg,#faffff,#e4f6fb)!important;color:#123b5a!important;border:1px solid #8bbdce!important;box-shadow:3px 4px 0 #b4dbe6!important}#player-center-view .pc-mainpane>.panel>h3{margin-top:0!important}#player-center-view .pc-mainpane #pc-personal-content{background:transparent!important;border:0!important;box-shadow:none!important;padding:12px 0!important;min-height:240px!important}";
  style.textContent += "/* Isolate the draw lobby from the site's global main/grid and panel theme. */#acg-draw-lobby{position:fixed!important;inset:0!important;z-index:99990!important;display:block!important;overflow-y:auto!important;overflow-x:hidden!important;background:radial-gradient(ellipse at 50% -15%,#263958 0,#101827 34%,#080b12 72%)!important;color:#edf2fa!important}#acg-draw-lobby>.adl-top{display:flex!important;width:100%!important;max-width:none!important;margin:0!important;padding:0 max(20px,calc((100vw - 1180px)/2))!important}#acg-draw-lobby main.adl-main{display:block!important;position:relative!important;isolation:isolate!important;max-width:1180px!important;width:100%!important;min-height:0!important;margin:0 auto!important;padding:34px 22px 70px!important;background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;grid-template-columns:none!important;grid-template-rows:none!important;gap:0!important;align-items:initial!important;justify-content:initial!important;color:#edf2fa!important}#acg-draw-lobby .adl-eyebrow{text-align:left!important;color:#78d9e8!important;font-size:11px!important;letter-spacing:4px!important}#acg-draw-lobby .adl-hero{display:flex!important;align-items:end!important;justify-content:space-between!important;margin:8px 0 25px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}#acg-draw-lobby .adl-pools{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:15px!important;width:100%!important;min-height:0!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}#acg-draw-lobby .adl-pool{display:block!important;position:relative!important;min-width:0!important;min-height:260px!important;background:linear-gradient(150deg,#1b2a40,#0d1420 68%)!important;border:1px solid #35445a!important;border-radius:8px!important;overflow:hidden!important;cursor:pointer!important;box-shadow:0 12px 30px #0005!important}#acg-draw-lobby .adl-pool.active{border:2px solid #e7bd65!important;box-shadow:0 16px 36px #0008,0 0 0 1px #d5a84c55!important}#acg-draw-lobby .adl-cover{height:174px!important;display:grid!important;place-items:center!important;position:relative!important;overflow:hidden!important;background:radial-gradient(circle at 50% 42%,#6f9dc8,transparent 60%)!important}#acg-draw-lobby .adl-cover:before{content:'';position:absolute!important;width:180px!important;height:180px!important;border:1px solid #ffffff30!important;transform:rotate(45deg)!important;box-shadow:0 0 35px #6f9dc8!important;background:#07101caa!important;pointer-events:none!important}#acg-draw-lobby .adl-cover-art{position:relative!important;z-index:1!important;width:100px!important;height:145px!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;transform:rotate(-7deg)!important;filter:drop-shadow(0 12px 12px #000b)!important;border:2px solid #d7bd7b!important;border-radius:5px!important;pointer-events:none!important}#acg-draw-lobby .adl-pool:nth-child(2) .adl-cover{background:radial-gradient(circle at 50% 42%,#b18bdc,transparent 60%)!important}#acg-draw-lobby .adl-pool:nth-child(3) .adl-cover{background:radial-gradient(circle at 50% 42%,#d17a49,transparent 60%)!important}#acg-draw-lobby .adl-pool:nth-child(4) .adl-cover{background:radial-gradient(circle at 50% 42%,#4a9dc9,transparent 60%)!important}#acg-draw-lobby .adl-config{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;margin-top:30px!important;padding:17px 18px!important;background:linear-gradient(100deg,#141e2d,#0e1521)!important;border:1px solid #283449!important;border-radius:7px!important;box-shadow:none!important}#acg-draw-lobby .adl-rates{display:flex!important;gap:18px!important;flex-wrap:wrap!important;margin-top:14px!important;background:transparent!important;border:0!important;box-shadow:none!important}#acg-draw-lobby .adl-history{display:block!important;margin-top:28px!important;background:transparent!important;border:0!important;border-top:1px solid #34445c!important;box-shadow:none!important}#acg-draw-lobby .adl-historyrow{display:flex!important;align-items:center!important;gap:10px!important}#acg-draw-lobby .adl-status{background:transparent!important;border:0!important;box-shadow:none!important;color:#f2cd77!important}@media(max-width:850px){#acg-draw-lobby .adl-pools{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:540px){#acg-draw-lobby main.adl-main{padding:23px 13px 45px!important}#acg-draw-lobby .adl-hero{align-items:flex-start!important;flex-direction:column!important}#acg-draw-lobby .adl-pools{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}#acg-draw-lobby .adl-pool{min-height:220px!important}#acg-draw-lobby .adl-cover{height:140px!important}#acg-draw-lobby .adl-cover-art{height:120px!important;width:82px!important}#acg-draw-lobby .adl-config{align-items:flex-start!important;flex-direction:column!important}#acg-draw-lobby .adl-actions{width:100%!important}#acg-draw-lobby .adl-btn{flex:1!important}}";
  style.textContent += "/* Draw lobby typography contrast: override the global light-page heading color on dark pack surfaces. */#acg-draw-lobby main.adl-main h1,#acg-draw-lobby main.adl-main h2,#acg-draw-lobby main.adl-main h3,#acg-draw-lobby main.adl-main h4{color:#f2f6ff!important;text-shadow:0 1px 5px #0008!important}#acg-draw-lobby .adl-poolinfo h3{color:#fff0bd!important;font-size:17px!important;font-weight:900!important;text-shadow:0 2px 8px #000!important}#acg-draw-lobby .adl-poolinfo p{color:#c1cede!important}#acg-draw-lobby .adl-poolinfo strong{color:#f4d47c!important}#acg-draw-lobby .adl-config h3,#acg-draw-lobby .adl-history h3{color:#f2f6ff!important}#acg-draw-lobby .adl-config p,#acg-draw-lobby .adl-history p{color:#c1cede!important}#acg-draw-lobby .adl-section{color:#f2f6ff!important}#acg-draw-lobby .adl-hero h1{color:#f5f7ff!important}";
  style.textContent += `
#player-center-view #pc-admin-panel .pc-admin-category-nav{
  display:grid!important;
  grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:8px!important;
  align-items:stretch!important;
  width:100%!important;
  max-width:100%!important;
}
#player-center-view #pc-admin-panel .pc-admin-category-nav button{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  width:100%!important;
  min-width:0!important;
  min-height:46px!important;
  padding:8px 6px!important;
  white-space:normal!important;
  overflow-wrap:anywhere!important;
  text-align:center!important;
  line-height:1.25!important;
  font-size:14px!important;
  font-weight:800!important;
  color:#12314b!important;
  background:#f3fbff!important;
  border:1px solid #6d9db5!important;
  border-radius:6px!important;
  text-shadow:none!important;
  box-shadow:0 2px 0 #9bbbc9!important;
}
#player-center-view #pc-admin-panel .pc-admin-category-nav button.active{
  color:#ffffff!important;
  background:#174d70!important;
  border-color:#0b3552!important;
  box-shadow:0 2px 0 #082b43!important;
}
@media(max-width:700px){
  #player-center-view #pc-admin-panel .pc-admin-category-nav{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
  }
}
`;
  style.textContent += "#player-center-view .pc-avatar-editor{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:14px;margin:12px 0;background:#f4fbff;border:1px solid #8bbdce}#player-center-view .pc-avatar-preview{width:78px;height:78px;flex:0 0 78px;object-fit:cover;border-radius:50%;border:1px solid #9bbdcb;background:#173f60}#player-center-view .pc-avatar-editor-copy{flex:1;min-width:180px}#player-center-view .pc-avatar-editor-copy strong{display:block;color:#123d5a}#player-center-view .pc-avatar-editor-copy small{display:block;color:#55768a;margin:4px 0 9px;line-height:1.5}#player-center-view .pc-avatar-crop-modal{position:fixed;inset:0;z-index:99999;background:#071b2bd9;display:flex;align-items:center;justify-content:center;padding:16px}#player-center-view .pc-avatar-crop-dialog{width:min(440px,100%);max-height:90vh;overflow:auto;background:#f2fbff;border:2px solid #69c5dd;box-shadow:8px 8px 0 #e83c63;padding:18px;color:#123d5a}#player-center-view .pc-avatar-crop-window{width:240px;height:240px;max-width:100%;margin:14px auto;border-radius:50%;overflow:hidden;position:relative;background:#173f60;border:3px solid #d6b45b}#player-center-view .pc-avatar-crop-window img{position:absolute;max-width:none;max-height:none;object-fit:fill;display:block}#player-center-view .pc-avatar-crop-dialog label{display:block;font-size:12px;margin:10px 0}#player-center-view .pc-avatar-crop-dialog input[type=range]{display:block;width:100%;margin-top:5px}#player-center-view .pc-avatar-crop-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}#player-center-view .pc-avatar-frame-settings{margin:14px 0;padding:12px;border:1px solid #8bbdce;background:#eaf7fb}#player-center-view .pc-avatar-frame-picker{display:grid;grid-template-columns:repeat(auto-fill,minmax(142px,1fr));gap:10px;margin:12px 0}#player-center-view .pc-avatar-frame-option{display:flex;align-items:center;gap:8px;min-width:0;padding:8px;background:#f3fbff;border:1px solid #9bc9d8;color:#173f60;cursor:pointer;text-align:left}#player-center-view .pc-avatar-frame-option[aria-pressed=true]{border:2px solid #167da4;background:#dff5fc}#player-center-view .pc-avatar-frame-option img{width:72px;height:64px;flex:0 0 72px;object-fit:contain}#player-center-view .pc-avatar-frame-option span{font-size:11px;font-weight:800;line-height:1.35}#player-center-view .pc-profile-hero{display:flex;align-items:center;gap:16px;padding:16px;margin:12px 0;background:linear-gradient(120deg,#f8fdff,#dceff7);border:1px solid #8bbdce}#player-center-view .pc-avatar-frame-slot{position:relative;display:grid;place-items:center;width:140px;height:125px;flex:0 0 140px}#player-center-view .pc-avatar-core{position:absolute;z-index:1;width:70px;height:70px;left:35px;top:27.5px;border-radius:50%;overflow:hidden;background:#173f60;color:white;display:grid;place-items:center;font-size:28px}#player-center-view .pc-avatar-core img{width:100%;height:100%;object-fit:cover;display:block}#player-center-view .pc-avatar-frame-art{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:2;pointer-events:none}#player-center-view .pc-profile-meta{min-width:0}#player-center-view .pc-profile-kicker{font-size:10px;letter-spacing:.14em;color:#28708e;font-weight:900}#player-center-view .pc-profile-name{margin:4px 0;color:#123d5a}#player-center-view .pc-profile-sub{font-size:12px;color:#55768a}#player-center-view .pc-profile-title{display:inline-block;margin-top:7px;padding:4px 9px;background:#f8edc8;border:1px solid #d8b85d;color:#77531d;font-size:12px;font-weight:800}#player-center-view .pc-badge-shelf{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:12px 0}#player-center-view .pc-badge-card{display:flex;align-items:center;gap:10px;padding:10px;background:linear-gradient(135deg,#f8fdff,#d9f1f8);border:1px solid #83bfd2;color:#123d5a}#player-center-view .pc-badge-seal{display:grid;place-items:center;flex:0 0 46px;width:46px;height:46px;background:linear-gradient(145deg,var(--badge-light),var(--badge-main) 55%,var(--badge-dark));clip-path:polygon(50% 0,63% 12%,82% 8%,88% 27%,100% 40%,88% 57%,92% 78%,68% 82%,50% 100%,32% 82%,8% 78%,12% 57%,0 40%,12% 27%,18% 8%,37% 12%)}#player-center-view .pc-badge-glyph{font-size:23px;color:white;text-shadow:0 1px 3px #173f60}#player-center-view .pc-badge-copy strong{display:block;font-size:13px}#player-center-view .pc-badge-copy small{display:block;color:#55768a;font-size:11px;margin-top:3px}#player-center-view .pc-badge-choice{display:flex;align-items:center;gap:10px;padding:10px;background:#f3fbff;border:1px solid #83bfd2;color:#123d5a}#player-center-view .pc-badge-choice .pc-badge-seal{flex:0 0 42px;width:42px;height:42px}@media(max-width:520px){#player-center-view .pc-profile-hero{align-items:flex-start}#player-center-view .pc-avatar-frame-slot{width:94px;height:94px;flex-basis:94px}}";
  document.head.appendChild(style);

  const tab = document.createElement("button");
  tab.id = "tab-player-center"; tab.type = "button"; tab.textContent = "玩家中心";
  nav.appendChild(tab);

  const view = document.createElement("section");
  view.id = "player-center-view"; view.className = "hidden";
  view.innerHTML = [
    '<div class="panel"><h3>玩家中心</h3><p class="hint">查看公开玩家主页，以及自己的对战记录、代币、收藏和成就。</p><p id="pc-status" class="status">正在连接玩家中心……</p></div>',
    '<div class="panel"><h3>公开个人主页</h3><div class="pc-search"><div class="field"><label for="pc-public-name">玩家中文 ID / 登录昵称</label><input id="pc-public-name" maxlength="40" placeholder="输入玩家中文 ID 或登录昵称"></div><button id="pc-public-search" class="primary" type="button">查看主页</button></div><div id="pc-public-result" style="margin-top:14px"><p class="pc-muted">输入昵称即可查看公开主页。登录后也可以直接查看自己的主页。</p></div></div>',
    '<div class="panel"><h3>我的玩家资料</h3><p id="pc-login-hint" class="pc-muted">登录后可查看个人数据。</p><div id="pc-personal" class="hidden"><div class="pc-tabs" role="tablist"><button type="button" data-page="overview" class="active">总览</button><button type="button" data-page="matches">对战记录</button><button type="button" data-page="seasons">月度赛季</button><button type="button" data-page="tokens">代币中心</button><button type="button" data-page="inventory">玩家仓库</button><button type="button" data-page="draw">🎴 抽卡</button><button type="button" data-page="dismantle">卡牌分解</button><button type="button" data-page="achievements">成就收藏册</button></div><div id="pc-personal-content"></div><div id="pc-display-editor" style="margin-top:20px;border-top:1px solid #383d50;padding-top:16px"><h4>个人资料装扮</h4><div class="pc-avatar-editor"><img id="pc-avatar-preview" class="pc-avatar-preview" alt="玩家头像预览"><div class="pc-avatar-editor-copy"><strong>玩家头像</strong><small>上传 JPG、PNG 或 WebP 图片，最大 2MB。选择后可调整圆形裁剪范围。</small><input id="pc-avatar-file" type="file" accept="image/png,image/jpeg,image/webp"><p id="pc-avatar-status" class="status"></p></div></div><div class="pc-avatar-frame-settings"><strong>头像框</strong><p class="pc-muted">选择一个装饰框，保存后会显示在个人主页。</p><div id="pc-avatar-frame-picker" class="pc-avatar-frame-picker"></div><button id="pc-save-avatar-frame" type="button">保存头像框</button><p id="pc-avatar-frame-status" class="status"></p></div><div id="pc-avatar-crop-modal" class="pc-avatar-crop-modal" style="display:none"><div class="pc-avatar-crop-dialog"><h4>调整头像</h4><p>拖动滑块调整取景范围，圆形区域外的部分不会被保留。</p><div class="pc-avatar-crop-window"><img id="pc-avatar-crop-image" alt="头像裁剪预览"></div><label>水平位置 <input id="pc-avatar-crop-x" type="range" min="0" max="100" value="50"></label><label>垂直位置 <input id="pc-avatar-crop-y" type="range" min="0" max="100" value="50"></label><label>缩放 <input id="pc-avatar-crop-zoom" type="range" min="100" max="300" value="100"></label><div class="pc-avatar-crop-actions"><button id="pc-avatar-crop-cancel" type="button">取消</button><button id="pc-upload-avatar" type="button">确认裁剪并上传</button></div></div></div><h4>主页展示设置</h4><p class="pc-muted">只能选择已经解锁的成就。称号选择一项，主页徽章最多三项。</p><div class="field"><label for="pc-title-choice">个人称号</label><select id="pc-title-choice"><option value="">不展示称号</option></select></div><div class="field"><label>主页徽章（最多三个）</label><div id="pc-badge-choices" class="pc-grid"></div></div><button id="pc-save-display" type="button">保存主页展示</button><p id="pc-display-status" class="status"></p></div></div></div>',
    '<div id="pc-admin-panel" class="panel hidden"><h3>管理员 · 玩家管理</h3><p class="pc-muted">新玩家先注册账号，再由管理员把账号绑定到现有玩家编号。绑定后会自动导入该编号原有的收藏数据。</p><div class="pc-grid"><div class="field"><label for="pc-bind-number">待分配玩家编号</label><select id="pc-bind-number"></select></div><div class="field"><label for="pc-bind-user">绑定到已注册账号</label><select id="pc-bind-user"></select></div></div><button id="pc-bind-submit" type="button">绑定玩家编号并导入旧收藏</button><p id="pc-bind-status" class="status"></p><p class="pc-muted">下方中文 ID 会公开显示，所有玩家都能看到；请勿填写隐私信息。</p><div id="pc-bind-list" class="pc-muted"></div><h4 style="margin-top:22px">玩家收藏管理</h4><p class="pc-muted">先选择玩家，再按物品类别管理库存。普通卡牌、对战道具和树果可直接调整；尚未接入的类别会明确标记。</p><div class="pc-grid"><div class="field"><label for="pc-inventory-user">选择玩家账号</label><select id="pc-inventory-user"><option value="">请选择玩家</option></select></div><div class="field"><label for="pc-inventory-reason">调整记录备注</label><input id="pc-inventory-reason" maxlength="120" value="管理员库存调整" placeholder="例如：活动奖励"></div></div><div id="pc-inventory-category-tabs" class="pc-tabs" role="group" aria-label="库存类别"><button type="button" data-inventory-category="cards" class="active">普通卡牌</button><button type="button" data-inventory-category="battle">对战道具</button><button type="button" data-inventory-category="berries">树果</button><button type="button" data-inventory-category="important" disabled>重要道具 · 未接入</button><button type="button" data-inventory-category="consumables">消耗品</button></div><div id="pc-inventory-filters" class="pc-search pc-inventory-filters"><div class="field"><label for="pc-inventory-search">关键词搜索</label><input id="pc-inventory-search" placeholder="输入卡牌名称或编号"></div><div class="field"><label for="pc-inventory-pack-filter">卡包</label><select id="pc-inventory-pack-filter"><option value="">全部卡包</option></select></div><div class="field"><label for="pc-inventory-star-filter">星级</label><select id="pc-inventory-star-filter"><option value="">全部星级</option></select></div><div class="field"><label for="pc-inventory-type-filter">卡牌类型</label><select id="pc-inventory-type-filter"><option value="">全部类型</option></select></div><div class="field"><label for="pc-inventory-owned-filter">库存状态</label><select id="pc-inventory-owned-filter"><option value="all">全部卡牌</option><option value="owned">只看已拥有</option><option value="unowned">只看未拥有</option></select></div></div><p id="pc-inventory-status" class="status"></p><div id="pc-inventory-summary" class="pc-muted"></div><div id="pc-inventory-cards" class="pc-inventory-grid"><div class="pc-empty">请先选择玩家。</div></div><h3 style="margin-top:24px">管理员 · 比赛管理</h3><p class="pc-muted">登记或更正四人 2v2 比赛。提交后系统会重算四名玩家的场次、胜负和胜率，并检查比赛成就。</p><form id="pc-match-form"><input id="pc-match-id" type="hidden"><div class="field"><label for="pc-match-description">比赛备注（可选）</label><input id="pc-match-description" maxlength="120" placeholder="例如：周末友谊赛"></div><div class="pc-grid"><div class="field"><label for="pc-blue-1">蓝队玩家 1</label><select id="pc-blue-1" required></select></div><div class="field"><label for="pc-blue-2">蓝队玩家 2</label><select id="pc-blue-2" required></select></div><div class="field"><label for="pc-red-1">红队玩家 1</label><select id="pc-red-1" required></select></div><div class="field"><label for="pc-red-2">红队玩家 2</label><select id="pc-red-2" required></select></div></div><div class="field"><label for="pc-winning-team">获胜队伍</label><select id="pc-winning-team"><option value="blue">蓝队胜利</option><option value="red">红队胜利</option></select></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="primary" type="submit" id="pc-match-submit">登记比赛</button><button type="button" id="pc-match-cancel" class="hidden">取消更正</button></div><p id="pc-match-status" class="status" style="margin-top:10px"></p></form><section id="pc-legacy-import" style="margin-top:22px;padding:16px;border:1px solid var(--border-color,#9bb);border-radius:12px;background:var(--surface,#fff)"><h4 style="margin-top:0">历史累计战绩导入</h4><p class="pc-muted">只导入过去累计胜场和败场，不会创建虚假的比赛记录。每行格式：玩家编号、胜场、败场。支持从 Excel 直接复制粘贴。</p><div class="field"><label for="pc-legacy-data">批量数据（每行一名玩家）</label><textarea id="pc-legacy-data" rows="7" style="width:100%;box-sizing:border-box" placeholder="玩家编号&#9;胜场&#9;败场&#10;P001&#9;25&#9;12&#10;P002&#9;18&#9;9"></textarea></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="pc-legacy-preview">检查导入数据</button><button type="button" class="primary" id="pc-legacy-submit" disabled>确认导入历史战绩</button></div><p id="pc-legacy-status" class="status"></p><div id="pc-legacy-preview-list" class="pc-muted"></div><h4 style="margin-top:18px">已导入的历史战绩</h4><div id="pc-legacy-list" class="pc-muted">正在读取……</div></section><h4 style="margin-top:22px">卡池设置</h4><p class="pc-muted">设置每包价格及每张卡的稀有度概率。每包 5 张；十连为 10 包共 50 张。异画概率独立设置。</p><div id="pc-admin-pool-list" class="pc-muted">正在读取卡池状态……</div><div class="field" style="margin:12px 0"><button id="pc-sync-pack-catalog" type="button">同步所选卡包到抽卡系统</button><p id="pc-sync-pack-status" class="status">新增卡包或卡牌后，先同步一次抽卡目录；之后无需再执行 SQL。</p></div><form id="pc-pool-form"><div class="pc-grid"><div class="field"><label for="pc-pool-id">卡包</label><select id="pc-pool-id"><option value="">正在读取卡包……</option></select></div><div class="field"><label for="pc-pool-cover">卡包封面（选择本卡包内任意卡牌）</label><select id="pc-pool-cover"><option value="">正在读取卡牌……</option></select><div id="pc-pool-cover-preview" style="display:flex;align-items:center;gap:12px;margin-top:8px"></div></div><div class="field"><label for="pc-pool-price">单包价格（代币）</label><input id="pc-pool-price" type="number" min="1" step="1" required></div><div class="field"><label for="pc-pool-alt">异画概率（%）</label><input id="pc-pool-alt" type="number" min="0" max="100" step="0.01" value="0.1" required></div><div class="field"><label for="pc-pool-r5">五星概率（%）</label><input id="pc-pool-r5" type="number" min="0" max="100" step="0.01" value="1.2" required></div><div class="field"><label for="pc-pool-r4">四星概率（%）</label><input id="pc-pool-r4" type="number" min="0" max="100" step="0.01" value="5" required></div><div class="field"><label for="pc-pool-r3">三星概率（%）</label><input id="pc-pool-r3" type="number" min="0" max="100" step="0.01" value="93.7" required></div></div><button type="submit">保存并开放卡池</button><p id="pc-pool-status" class="status"></p></form><h4 style="margin-top:22px">代币余额修正</h4><p class="pc-muted">此处用于后台纠错或即时补正。活动奖励、补偿和日常发放请使用「邮件管理」，由玩家自行领取。</p><form id="pc-token-form"><div class="pc-grid"><div class="field"><label for="pc-token-player">玩家</label><select id="pc-token-player" required></select></div><div class="field"><label for="pc-token-amount">发放数量</label><input id="pc-token-amount" type="number" min="1" step="1" required></div><div class="field"><label for="pc-token-reason">发放原因</label><input id="pc-token-reason" maxlength="120" placeholder="例如：活动奖励" required></div></div><button type="submit">确认发放代币</button><p id="pc-token-status" class="status"></p></form><h4 style="margin-top:22px">成就管理</h4><p class="pc-muted">创建或编辑成就名称、说明、解锁条件、启用状态和首次解锁奖励。停用成就不会删除已经获得的记录。</p><form id="pc-achievement-form"><div class="pc-grid"><div class="field"><label for="pc-ach-id">成就 ID（创建后不可更改）</label><input id="pc-ach-id" maxlength="50" pattern="[a-z0-9][a-z0-9_-]{1,49}" placeholder="例如：matches_100" required></div><div class="field"><label for="pc-ach-name">成就名称</label><input id="pc-ach-name" maxlength="40" required></div><div class="field"><label for="pc-ach-description">成就描述</label><input id="pc-ach-description" maxlength="160" required></div><div class="field"><label for="pc-ach-reward">首次解锁奖励（代币）</label><input id="pc-ach-reward" type="number" min="0" step="1" value="0" required></div><div class="field"><label for="pc-ach-type">解锁条件</label><select id="pc-ach-type"><option value="matches">完成比赛场次</option><option value="wins">累计胜场</option><option value="win_streak">连续胜场</option><option value="win_rate">比赛胜率</option><option value="collection">拥有不同卡牌</option><option value="draws">累计抽卡次数</option></select></div><div class="field"><label for="pc-ach-threshold">达成目标</label><input id="pc-ach-threshold" type="number" min="1" step="1" value="1" required></div><div class="field" id="pc-ach-min-games-wrap"><label for="pc-ach-min-games">计算胜率至少需要的比赛场次</label><input id="pc-ach-min-games" type="number" min="1" step="1" value="10"></div></div><label style="display:flex;align-items:center;gap:8px;margin:10px 0"><input id="pc-ach-active" type="checkbox" checked> 启用此成就（允许新玩家解锁）</label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" type="submit" id="pc-ach-submit">创建成就</button><button type="button" id="pc-ach-reset">清空表单</button></div><p id="pc-ach-status" class="status"></p></form><h4 style="margin-top:18px">现有成就</h4><div id="pc-admin-achievement-list" class="pc-muted">正在读取……</div><h4 style="margin-top:22px">最近登记的比赛</h4><div id="pc-admin-match-list" class="pc-muted">正在读取……</div></div>'
  ].join("");
  main.appendChild(view);

  // Rebuild the personal area into a real navigation rail + content panel.
  const pcPersonalContainer = view.querySelector("#pc-personal");
  const personalPanel = view.children[2];
  const personalTabs = pcPersonalContainer.querySelector(".pc-tabs");
  const pcLayout = document.createElement("div");
  pcLayout.className = "pc-layout hidden";
  const pcSidebar = document.createElement("aside");
  pcSidebar.className = "pc-sidebar";
  pcSidebar.setAttribute("aria-label","玩家中心分类导航");
  const pcMainpane = document.createElement("div");
  pcMainpane.className = "pc-mainpane";
  personalTabs.setAttribute("aria-label","玩家中心分类");
  pcSidebar.appendChild(personalTabs);
  personalPanel.parentNode.insertBefore(pcLayout,personalPanel);
  pcLayout.append(pcSidebar,pcMainpane);
  pcMainpane.appendChild(personalPanel);

  const knownViews = ["library-view","player-view","builder-view","admin-view","account-view","shared-deck-view","fishing-view"];
  const knownTabs = ["tab-library","tab-player","tab-builder","tab-admin","tab-account","tab-fishing"];
  const statusEl = view.querySelector("#pc-status");
  const personalEl = view.querySelector("#pc-personal");
  const loginHint = view.querySelector("#pc-login-hint");
  const contentEl = view.querySelector("#pc-personal-content");
  let currentUser = null, currentPage = "overview", cardsById = {};
  const PC_CARD_PAGE_SIZE = 20;
  const pcListPages = Object.create(null);
  function renderPcPagination(container,key,total,onChange,pageSize=PC_CARD_PAGE_SIZE){
    let page=Math.max(1,Number(pcListPages[key]||1));
    const pageCount=Math.max(1,Math.ceil(total/pageSize));
    if(page>pageCount)page=pageCount;
    pcListPages[key]=page;
    if(total<=pageSize)return {start:0,end:total,page,pageCount};
    const nav=node("div","pc-pagination");
    nav.style.cssText="display:flex!important;grid-column:1 / -1!important;align-self:stretch!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:flex-start!important;gap:10px!important;width:100%!important;min-width:0!important;max-width:none!important;overflow:visible!important;box-sizing:border-box!important;padding:12px!important;margin:16px 0!important;white-space:nowrap!important;";
    const add=(label,target,disabled=false,active=false)=>{const button=node("button",active?"active":"",label);button.type="button";button.style.cssText="display:inline-flex!important;flex:0 0 auto!important;min-width:40px!important;min-height:36px!important;height:36px!important;align-items:center!important;justify-content:center!important;padding:7px 12px!important;margin:0!important;white-space:nowrap!important;";button.disabled=disabled;button.addEventListener("click",()=>{pcListPages[key]=target;onChange();});nav.appendChild(button);};
    add("上一页",page-1,page===1);
    const first=Math.max(1,page-2),last=Math.min(pageCount,page+2);
    if(first>1){add("1",1,false,page===1);if(first>2)nav.appendChild(node("span","pc-muted","…"));}
    for(let p=first;p<=last;p++)add(String(p),p,false,p===page);
    if(last<pageCount){if(last<pageCount-1)nav.appendChild(node("span","pc-muted","…"));add(String(pageCount),pageCount,false,page===pageCount);}
    const summary=node("span","pc-muted",page+" / "+pageCount+" 页 · "+total+" 项");summary.style.cssText="flex:0 0 auto!important;min-width:max-content!important;margin:0 4px 0 auto!important;white-space:nowrap!important;";nav.appendChild(summary);
    add("下一页",page+1,page===pageCount);
    container.appendChild(nav);
    return {start:(page-1)*pageSize,end:page*pageSize,page,pageCount};
  }
  let resolveInitialSession;
  const initialSessionReady = new Promise(resolve => { resolveInitialSession = resolve; });
  let initialSessionResolved = false;
  let drawSessionGatePending = false;
  function markInitialSessionReady() {
    if (!initialSessionResolved) { initialSessionResolved = true; resolveInitialSession(); }
  }
  function withTimeout(promise, ms, message) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); })
    ]).finally(() => clearTimeout(timer));
  }
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
  function showCenter(page="overview") {
    currentPage = page;
    knownViews.forEach(id => document.getElementById(id)?.classList.add("hidden"));
    [...knownTabs,"tab-player-center"].forEach(id => document.getElementById(id)?.classList.remove("active"));
    tab.classList.add("active");
    const title = document.getElementById("page-title");
    if (title) title.textContent = "玩家中心";
    // Draw is always a standalone page. Never reveal the player-center shell,
    // even while Supabase is still restoring the existing login session.
    if (page==="draw") {
      view.classList.add("hidden");
      drawSessionGatePending = true;
      renderDrawNotice("正在确认玩家登录状态……");
      (async()=>{
        try {
          await withTimeout(initialSessionReady,12000,"登录状态读取超时，请刷新页面后重试。");
          if (currentPage!=="draw") { drawSessionGatePending=false; return; }
          drawSessionGatePending = false;
          if (currentUser) await loadPage("draw");
          else renderDrawNotice("抽卡功能需要先登录当前 ACG 卡牌网站账号。",false);
        } catch(error) {
          drawSessionGatePending = false;
          renderDrawNotice("无法确认登录状态："+error.message,true);
        }
      })();
      return;
    }
    view.classList.remove("hidden");
    if (currentUser) loadPage(page);
    else {
      contentEl.replaceChildren(node("div","pc-empty","请先登录账号，再使用抽卡和个人资料功能。"));
      pcLayout.classList.remove("hidden");
      personalEl.classList.remove("hidden");
    }
  }
  tab.addEventListener("click",()=>showCenter("overview"));
  // Direct entry from the homepage avoids showing the overview before the requested page.
  window.acgOpenPlayerCenterPage = page => showCenter(page==="draw"?"draw":"overview");
  window.acgOpenPlayerAdminPanel = async () => {
    if (!currentUser) {
      setStatus("请先登录玩家账号，再进入玩家管理。",true);
      document.getElementById("tab-account")?.click();
      return;
    }
    showCenter("overview");
    const allowed = await checkAdmin();
    const panel=view.querySelector("#pc-admin-panel");
    if(allowed && panel && !panel.classList.contains("hidden")) {
      panel.scrollIntoView({behavior:"smooth",block:"start"});
    } else if(currentUser) {
      setStatus("当前账号没有玩家管理权限，或管理员资料读取失败。",true);
    }
  };
  if(window.acgPendingPlayerCenterPage){const pendingPage=window.acgPendingPlayerCenterPage;delete window.acgPendingPlayerCenterPage;showCenter(pendingPage);}
  knownTabs.forEach(id => document.getElementById(id)?.addEventListener("click", () => {
    view.classList.add("hidden");
    tab.classList.remove("active");
  }));

  function syncAltProbabilityControl(packId){
    const input=view.querySelector("#pc-pool-alt");
    if(!input)return;
    const hasAlt=Object.values(cardsById).some(card=>card.pack_id===packId&&/（异画）|\\(异画\\)/.test(card.name||""));
    if(!hasAlt)input.value="0";
    input.disabled=!hasAlt;
    input.title=hasAlt?"当前卡包包含异画卡，可以设置异画概率。":"当前卡包没有异画卡，异画概率固定为 0%。";
  }
  function syncPoolModeControls(packId){
    const isUniform=packCatalog.find(item=>item.id===packId)?.category==="berry";
    ["#pc-pool-alt","#pc-pool-r5","#pc-pool-r4","#pc-pool-r3"].forEach(selector=>{
      const input=view.querySelector(selector);
      if(!input)return;
      const field=input.closest(".field");
      if(field)field.hidden=isUniform;
      input.required=!isUniform;
    });
    const priceLabel=view.querySelector('label[for="pc-pool-price"]');
    if(priceLabel)priceLabel.textContent=isUniform?"树果包价格（代币）":"单包价格（代币）";
    const submit=view.querySelector('#pc-pool-form button[type="submit"]');
    if(submit)submit.textContent=isUniform?"保存价格并开放树果包":"保存并开放卡池";
  }
  function fillPoolCoverOptions(packId,selectedId=""){
    const select=view.querySelector("#pc-pool-cover");
    if(!select)return;
    const candidates=Object.values(cardsById).filter(card=>card.pack_id===packId)
      .sort((a,b)=>Number(b.star||0)-Number(a.star||0)||String(a.name||"").localeCompare(String(b.name||""),"zh-CN"));
    select.replaceChildren(new Option("自动选择本卡包最高星卡（默认）",""));
    candidates.forEach(card=>select.add(new Option(card.name+" · "+(card.star||0)+"星"+(card.name.includes("异画")?" · 异画":"")+(card.image?"":" · 缺少卡图"),card.id)));
    select.value=candidates.some(card=>card.id===selectedId)?selectedId:"";
    updatePoolCoverPreview();
  }
  function updatePoolCoverPreview(){
    const select=view.querySelector("#pc-pool-cover"),preview=view.querySelector("#pc-pool-cover-preview");
    if(!select||!preview)return;
    preview.replaceChildren();
    const selectedCard=cardsById[select.value];
    if(selectedCard&&!selectedCard.image){preview.appendChild(node("span","pc-muted","这张卡没有卡图，不能用作卡池封面；仍可用于抽卡。"));return;}
    const card=selectedCard||Object.values(cardsById).filter(c=>c.pack_id===view.querySelector("#pc-pool-id").value&&c.image).sort((a,b)=>Number(b.star||0)-Number(a.star||0))[0];
    if(card?.image){
      const img=node("img");img.src=card.image;img.alt=card.name;img.style.cssText="width:66px;height:92px;object-fit:contain;background:#111827;border:1px solid #52627a;border-radius:4px";
      const label=node("div");label.append(node("strong","",card.name),node("div","pc-muted",(card.star||0)+" 星 · "+(select.value?"自定义封面":"自动推荐封面")));
      preview.append(img,label);
    }else preview.appendChild(node("span","pc-muted","该卡包暂时没有可用卡图"));
  }
  let packCatalog = [];
  async function loadCardNames() {
    if(cardNamesLoadPromise)return cardNamesLoadPromise;
    cardNamesLoadPromise=(async()=>{
      const [cardsResponse,packsResponse]=await Promise.all([fetch("./data/cards.json"),fetch("./data/packs.json")]);
      if(!cardsResponse.ok||!packsResponse.ok)throw new Error("无法读取卡牌或卡包资料");
      const [cards,packs]=await Promise.all([cardsResponse.json(),packsResponse.json()]);
      cardsById=Object.fromEntries(cards.map(card=>[card.id,card]));packCatalog=packs;
    })().catch(error=>{cardNamesLoadPromise=null;throw error;});
    return cardNamesLoadPromise;
  }

  async function showPublicProfile(username) {
    const result = view.querySelector("#pc-public-result");
    result.replaceChildren(node("p","pc-muted","正在查询……"));
    const publicResponse = await client.from("public_profiles")
      .select("username,player_number,player_id,created_at,selected_title,selected_badges,games_played,wins,losses,win_rate,avatar_url,avatar_frame_id")
      .eq("player_id",username).maybeSingle();
    let data=publicResponse?.data??null;
    let error=publicResponse?.error??null;
    if(!error&&!data){
      const fallback=await client.from("public_profiles")
        .select("username,player_number,player_id,created_at,selected_title,selected_badges,games_played,wins,losses,win_rate,avatar_url,avatar_frame_id")
        .eq("username",username.toLowerCase()).maybeSingle();
      data=fallback?.data??null;error=fallback?.error??null;
    }
    result.replaceChildren();
    if (error) { result.appendChild(node("p","pc-empty","查询失败："+error.message)); return; }
    if (!data) { result.appendChild(node("p","pc-empty","没有找到这个玩家。请确认中文 ID 或登录昵称是否正确。")); return; }
    renderProfileHero(result,{name:data.player_id||data.username,number:data.player_number||"",title:data.selected_title||"",joined:new Date(data.created_at).toLocaleDateString("zh-CN"),avatarUrl:data.avatar_url||"",avatarFrameId:data.avatar_frame_id||null});
    const grid=node("div","pc-grid");
    [["总场次",data.games_played],["胜场",data.wins],["败场",data.losses],["胜率",Number(data.win_rate).toFixed(1)+"%"]].forEach(([label,value])=>{
      const item=node("div","pc-stat"); item.append(node("span","pc-muted",label),node("strong","",String(value))); grid.appendChild(item);
    });
    result.appendChild(grid);
    const badges=Array.isArray(data.selected_badges)?data.selected_badges:[];
    const {data:achievementRows,error:achievementError}=await client.from("achievements").select("id,name,description");if(achievementError)throw achievementError;
    renderBadgeShelf(result,badges,achievementRows||[]);
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
      client.from("profiles").select("username,created_at,selected_title,selected_badges,player_number,avatar_url,avatar_frame_id").eq("id",currentUser.id).maybeSingle(),
      client.from("player_stats").select("tokens,games_played,wins,losses").eq("user_id",currentUser.id).maybeSingle()
    ]);
    if(pe) throw pe; if(se) throw se;
    const s=stats||{tokens:0,games_played:0,wins:0,losses:0};
    let titleName="尚未设置称号";
    if(profile?.selected_title){const titleResult=await client.from("achievements").select("name").eq("id",profile.selected_title).maybeSingle();if(titleResult.error)throw titleResult.error;titleName=titleResult.data?.name||"已设置称号";}
    const publicIdResponse=await client.from("public_profiles").select("player_id").eq("username",profile?.username||"").maybeSingle();
    if(publicIdResponse?.error)throw publicIdResponse.error;
    const publicIdData=publicIdResponse?.data??null;
    contentEl.replaceChildren();
    renderProfileHero(contentEl,{name:publicIdData?.player_id||profile?.username||"玩家",number:profile?.player_number||"",title:titleName==="尚未设置称号"?"":titleName,joined:profile?.created_at?new Date(profile.created_at).toLocaleDateString("zh-CN"):"",avatarUrl:profile?.avatar_url||"",avatarFrameId:profile?.avatar_frame_id||null});
    const {data:achievementRows,error:achievementError}=await client.from("achievements").select("id,name,description");if(achievementError)throw achievementError;
    renderBadgeShelf(contentEl,Array.isArray(profile?.selected_badges)?profile.selected_badges:[],achievementRows||[]);
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

  const TREE_FRUIT_TICKET={id:"consumable_tree_fruit_ticket",name:"树果卷",icon:"🎟️",description:"每张可免费抽取 5 颗随机树果，支持批量使用。"};
  let myWarehouseRows = [];
  let myWarehouseItems = [];
  let myWarehouseQuery = "";
  let myWarehousePack = "";
  let myWarehouseCategory = "cards";
  const warehouseCategories = [
    {id:"cards",label:"卡牌",description:"普通卡牌、特殊攻击卡及可用于构筑的卡牌"},
    {id:"key-items",label:"重要道具",description:"长期持有的重要物品"},
    {id:"consumables",label:"消耗品",description:"使用后会消耗数量的物品"},
    {id:"berries",label:"树果",description:"树果及相关收集品"}
  ];
  function renderWarehouseCategoryTabs(host) {
    const tabs=node("div","pc-warehouse-tabs");
    warehouseCategories.forEach(category=>{
      const button=node("button",myWarehouseCategory===category.id?"active":"",category.label);
      button.type="button";
      button.setAttribute("aria-pressed",String(myWarehouseCategory===category.id));
      button.addEventListener("click",()=>{
        myWarehouseCategory=category.id;
        pcListPages["my-inventory"]=1;
        renderMyWarehouse();
      });
      tabs.appendChild(button);
    });
    host.appendChild(tabs);
  }
  function renderMyWarehouse() {
    const tabsHost=contentEl.querySelector("#pc-warehouse-tabs-host");
    const host=contentEl.querySelector("#pc-warehouse-cards");
    const summary=contentEl.querySelector("#pc-warehouse-summary");
    const description=contentEl.querySelector("#pc-warehouse-category-description");
    if(!host||!summary||!tabsHost)return;
    tabsHost.replaceChildren();
    renderWarehouseCategoryTabs(tabsHost);
    const category=warehouseCategories.find(x=>x.id===myWarehouseCategory)||warehouseCategories[0];
    description.textContent=category.description;
    host.replaceChildren();
    if(myWarehouseCategory==="key-items"||myWarehouseCategory==="consumables"){
      const categoryKey=myWarehouseCategory==="consumables"?"consumable":"important";
      const catalog=myWarehouseItems.filter(item=>item.category===categoryKey);
      const owned=catalog.map(item=>({item,quantity:Number(myWarehouseRows.find(row=>row.card_id===item.item_id)?.quantity||0)}))
        .filter(x=>x.item.item_id!==TREE_FRUIT_TICKET.id&&x.quantity>0&&(!myWarehouseQuery||x.item.name.toLowerCase().includes(myWarehouseQuery)||x.item.item_id.toLowerCase().includes(myWarehouseQuery)));
      const ticketRow=myWarehouseRows.find(row=>row.card_id===TREE_FRUIT_TICKET.id);
      const ticketQty=Number(ticketRow?.quantity||0);
      let savedTicketUseCount=0,savedTicketRequest=null;try{savedTicketRequest=localStorage.getItem("acg-tree-fruit-ticket-request");savedTicketUseCount=Number(localStorage.getItem("acg-tree-fruit-ticket-count")||(savedTicketRequest?"1":"0"));}catch(_){}
      const hasPendingTicketUse=Boolean(pendingTicketUseId||savedTicketRequest);
      const pendingCount=Number(pendingTicketUseCount||savedTicketUseCount||0);
      const ticketMatches=!myWarehouseQuery||TREE_FRUIT_TICKET.name.toLowerCase().includes(myWarehouseQuery)||TREE_FRUIT_TICKET.id.includes(myWarehouseQuery);
      const showTicket=myWarehouseCategory==="consumables"&&(ticketQty>0||hasPendingTicketUse)&&ticketMatches;
      const total=owned.length+(showTicket?1:0);
      summary.textContent=category.label+" · 持有 "+total+" 种";
      if(!total){host.appendChild(node("div","pc-empty",myWarehouseCategory==="consumables"?"你还没有获得消耗品。":"你还没有获得重要道具。"));return;}
      if(showTicket){
        const row=node("article","pc-inventory-card pc-tree-fruit-ticket"),icon=node("div","pc-consumable-icon",TREE_FRUIT_TICKET.icon);
        row.style.cssText="grid-column:1/-1!important;display:grid!important;grid-template-columns:58px minmax(0,1fr) auto!important;align-items:center!important;gap:14px!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:14px!important;min-height:112px!important";
        icon.style.cssText="width:58px;height:58px;display:grid;place-items:center;flex:0 0 58px;border-radius:6px;background:#263d55;font-size:30px";
        const info=node("div","pc-card-info");info.style.cssText="min-width:0!important;width:100%!important;overflow-wrap:anywhere!important";
        const ticketName=node("strong","",TREE_FRUIT_TICKET.name);ticketName.style.cssText="display:block!important;font-size:16px!important;line-height:1.4!important;white-space:nowrap!important";
        const ticketDescription=node("small","",TREE_FRUIT_TICKET.description);ticketDescription.style.cssText="display:block!important;font-size:12px!important;line-height:1.6!important;overflow-wrap:anywhere!important;margin-top:5px!important";
        const ticketQuantity=node("small","","持有数量：× "+ticketQty);ticketQuantity.style.cssText="display:block!important;font-size:12px!important;line-height:1.5!important;margin-top:5px!important;font-weight:700!important";
        info.append(ticketName,ticketDescription,ticketQuantity);
        const controls=node("div","pc-ticket-use-controls");controls.style.cssText="display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;flex:0 0 auto!important;white-space:nowrap!important";
        const countInput=node("input");countInput.type="number";countInput.min="1";countInput.max=String(Math.max(Math.min(20,ticketQty),pendingCount));countInput.step="1";countInput.value=hasPendingTicketUse&&pendingCount>0?String(pendingCount):"1";countInput.setAttribute("aria-label","使用树果卷数量");countInput.style.cssText="width:76px!important;min-width:76px!important;max-width:76px!important;padding:9px 6px!important;text-align:center!important;box-sizing:border-box!important;margin:0!important";
        const use=node("button","primary",hasPendingTicketUse?"重试上次使用":"批量使用");use.type="button";use.style.cssText="min-width:112px!important;white-space:nowrap!important;padding:10px 12px!important;margin:0!important;flex:0 0 auto!important";use.addEventListener("click",()=>useTreeFruitTicket(use,countInput.value));controls.append(countInput,use);row.append(icon,info,controls);host.appendChild(row);
      }
      owned.forEach(({item,quantity})=>{
        const row=node("article","pc-inventory-card"),icon=node("div","pc-consumable-icon",item.icon||"🎁");
        icon.style.cssText="width:58px;height:82px;display:grid;place-items:center;flex:0 0 58px;border-radius:6px;background:#263d55;font-size:30px";
        const info=node("div","pc-card-info");info.append(node("strong","",item.name),node("small","",item.description||"暂无说明"),node("small","","持有数量：× "+quantity));
        row.append(icon,info);
        if(item.category==="consumable"&&item.is_active&&item.effect_type!=="none"){const use=node("button","primary","使用");use.type="button";use.addEventListener("click",()=>useWarehouseItem(item,use));row.appendChild(use);}
        host.appendChild(row);
      });
      return;
    }
    const isBerryCard=card=>{
      const pack=packCatalog.find(item=>item.id===card?.pack_id);
      return pack?.category==="berry";
    };
    const filtered=myWarehouseRows.filter(row=>{
      const card=cardsById[row.card_id]||{id:row.card_id,name:row.card_id,pack_id:""};
      const belongsHere=myWarehouseCategory==="berries"?isBerryCard(card):!isBerryCard(card);
      return belongsHere&&(!myWarehouseQuery||String(card.name).toLowerCase().includes(myWarehouseQuery)||String(card.id).toLowerCase().includes(myWarehouseQuery))&&(!myWarehousePack||card.pack_id===myWarehousePack);
    }).sort((a,b)=>compareCardsByStar(cardsById[a.card_id]||{name:a.card_id,star:0},cardsById[b.card_id]||{name:b.card_id,star:0}));
    const total=filtered.reduce((sum,row)=>sum+Number(row.quantity||0),0);
    summary.textContent=category.label+"：拥有 "+filtered.length+" 种，共 "+total+" 张";
    if(!filtered.length){host.appendChild(node("div","pc-empty",myWarehouseRows.length?"没有符合条件的卡牌。":"你的卡牌仓库还是空的，去获取一些卡牌吧。"));return;}
    const page=renderPcPagination(host,"my-inventory",filtered.length,()=>renderMyWarehouse());
    filtered.slice(page.start,page.end).forEach(row=>{
      const card=cardsById[row.card_id]||{id:row.card_id,name:row.card_id};
      const item=node("article","pc-inventory-card");
      let img;
      if(card.icon){img=node("div","pc-consumable-icon",card.icon);img.style.cssText="width:58px;height:82px;display:grid;place-items:center;flex:0 0 58px;border-radius:6px;background:#263d55;font-size:30px";}
      else{img=node("img");img.src=card.image||"";img.alt=card.name;img.loading="lazy";img.style.cursor="zoom-in";img.addEventListener("click",event=>{event.stopPropagation();showCardImagePreview(card);});img.onerror=()=>{img.style.visibility="hidden";};}
      const info=node("div","pc-card-info");
      info.append(node("strong","",card.name),node("small","",(card.star?card.star+" 星 · ":"")+(card.type||"未知类型")+" · "+(card.pack_id||"未分类")+" · "+card.id));
      const quantity=node("div","pc-quantity-controls");
      quantity.append(node("span","pc-muted","持有数量"),node("strong","", "× "+Number(row.quantity)));
      info.appendChild(quantity);item.append(img,info);host.appendChild(item);
    });
    const pager=host.querySelector(".pc-pagination");if(pager)host.appendChild(pager);
  }
  let consumableUseBusy=false;
  let pendingTicketUseId=null;
  let pendingTicketUseCount=null;
  function getTicketUseRequestId(useCount){
    const key="acg-tree-fruit-ticket-request",countKey="acg-tree-fruit-ticket-count";
    let savedId=null,savedCount=1;
    try{savedId=localStorage.getItem(key);savedCount=Number(localStorage.getItem(countKey)||1);}catch(_){}
    if(savedId){if(savedCount!==useCount)throw new Error("上一笔树果卷请求尚未确认，请先使用相同数量重试，避免重复扣除。");pendingTicketUseId=savedId;pendingTicketUseCount=savedCount;return savedId;}
    if(pendingTicketUseId){if(pendingTicketUseCount!==useCount)throw new Error("上一笔树果卷请求尚未确认，请先使用相同数量重试。");return pendingTicketUseId;}
    pendingTicketUseId=crypto.randomUUID();pendingTicketUseCount=useCount;
    try{localStorage.setItem(key,pendingTicketUseId);localStorage.setItem(countKey,String(useCount));}catch(_){}
    return pendingTicketUseId;
  }
  async function useTreeFruitTicket(button,rawCount=1){
    if(consumableUseBusy)return;
    const ticketRow=myWarehouseRows.find(row=>row.card_id===TREE_FRUIT_TICKET.id),available=Number(ticketRow?.quantity||0),useCount=Number(rawCount);
    let storedRequest=null,storedCount=0;try{storedRequest=localStorage.getItem("acg-tree-fruit-ticket-request");storedCount=Number(localStorage.getItem("acg-tree-fruit-ticket-count")||(storedRequest?"1":"0"));}catch(_){}
    const hasPending=Boolean(storedRequest||pendingTicketUseId);
    if(!Number.isSafeInteger(useCount)||useCount<1||useCount>20){setStatus("一次最多使用 20 张树果卷。",true);return;}
    if(hasPending&&(Number(pendingTicketUseCount||storedCount)!==useCount)){setStatus("上一笔树果卷请求尚未确认，请先按原数量重试，避免重复扣除。",true);return;}
    if(!hasPending&&(!ticketRow||available<useCount)){setStatus("树果卷数量不足。",true);return;}
    consumableUseBusy=true;if(button)button.disabled=true;
    setStatus("正在使用 "+useCount+" 张树果卷并抽取 "+(useCount*5)+" 颗树果……",false);
    try{
      const requestId=getTicketUseRequestId(useCount);
      const {data,error}=await withTimeout(client.rpc("use_inventory_item",{p_item_id:TREE_FRUIT_TICKET.id,p_request_id:requestId,p_choice_index:null,p_use_count:useCount}),30000,"使用请求超时。请重试相同数量，系统会沿用同一请求编号，避免重复扣除树果卷。");
      if(error)throw error;const result=Array.isArray(data)?data[0]:data;
      if(!result?.cards||result.cards.length!==useCount*5)throw new Error("服务器未返回完整的树果结果，请使用相同数量重试。");
      pendingTicketUseId=null;pendingTicketUseCount=null;try{localStorage.removeItem("acg-tree-fruit-ticket-request");localStorage.removeItem("acg-tree-fruit-ticket-count");}catch(_){}
      showSinglePackOpening({pack_id:"pack_010",pack_name:"树果包 ×"+useCount,price_tokens:0,draw_mode:"uniform"},result,"inventory");
      try{await loadPage("inventory");setStatus("树果卷使用成功，获得 "+(useCount*5)+" 颗树果。",false);}
      catch(refreshError){setStatus("树果已成功抽取，但仓库刷新失败；重新打开仓库即可看到最新数量。",true);}
    }catch(error){setStatus("树果卷使用失败："+error.message,true);}
    finally{consumableUseBusy=false;if(button)button.disabled=false;}
  }

  async function useSelectCardTicket(item,button){
    if(button.disabled)return;
    const rarity=Number(item.effect_config?.rarity);
    if(![4,5].includes(rarity)){setStatus("自选卷星级配置无效，请联系管理员。",true);return;}
    button.disabled=true;setStatus("正在读取可选卡牌……",false);
    let overlay=null;
    try{
      const {data,error}=await client.rpc("player_list_selectable_ticket_cards",{p_rarity:rarity});
      if(error)throw error;
      const eligible=(data||[]).map(row=>cardsById[row.card_id]||{id:row.card_id,name:row.card_id,star:row.rarity}).filter(card=>Number(card.star||rarity)===rarity);
      if(!eligible.length)throw new Error("目前没有已开放的"+rarity+"星卡牌，请管理员先同步卡包卡牌目录。");
      overlay=node("div","");overlay.style.cssText="position:fixed;inset:0;z-index:100000;background:rgba(8,25,40,.78);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;";
      const dialog=node("section","pc-stat");dialog.style.cssText="width:min(100%,980px);max-height:min(88vh,900px);overflow:auto;background:#f4fbff;border:1px solid #75b6cc;border-radius:12px;padding:20px;box-sizing:border-box;";
      const heading=node("div","pc-row");heading.style.alignItems="center";heading.append(node("h3","",rarity===4?"SR 自选卷":"SSR 自选卷"),node("button","","取消"));const close=heading.lastChild;close.type="button";
      const note=node("p","pc-muted","请选择一张"+rarity+"星卡牌。确认后将消耗一张自选卷，并把卡牌加入你的收藏。");
      const search=node("input");search.type="search";search.placeholder="搜索卡牌名称或编号";search.style.cssText="width:100%;box-sizing:border-box;margin:10px 0;padding:10px;border:1px solid #9bbdcb;border-radius:6px;";
      const count=node("p","pc-muted","可选卡牌："+eligible.length+" 张");
      const grid=node("div","");grid.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:12px;";
      const footer=node("div","pc-row");footer.style.cssText="position:sticky;bottom:-20px;background:#f4fbff;padding:14px 0 0;margin-top:14px;border-top:1px solid #c5dce5;";
      const selectedText=node("span","pc-muted","尚未选择卡牌"),confirm=node("button","primary","确认选择并使用");confirm.type="button";confirm.disabled=true;footer.append(selectedText,confirm);
      dialog.append(heading,note,search,count,grid,footer);overlay.appendChild(dialog);document.body.appendChild(overlay);
      let selected=null;
      const closeDialog=()=>{overlay?.remove();overlay=null;button.disabled=false;};
      close.addEventListener("click",closeDialog);
      overlay.addEventListener("click",event=>{if(event.target===overlay)closeDialog();});
      const render=()=>{
        const q=search.value.trim().toLowerCase();grid.replaceChildren();
        const rows=eligible.filter(card=>String(card.name||"").toLowerCase().includes(q)||String(card.id||"").toLowerCase().includes(q));
        count.textContent="显示 "+rows.length+" / "+eligible.length+" 张卡牌";
        rows.forEach(card=>{
          const tile=node("button","");tile.type="button";tile.style.cssText="display:flex;flex-direction:column;gap:6px;text-align:left;padding:8px;border:2px solid "+(selected?.id===card.id?"#1599bb":"#c4dce5")+";border-radius:8px;background:#fff;cursor:pointer;min-width:0;";
          if(card.image){const img=node("img");img.src=card.image;img.alt=card.name||card.id;img.loading="lazy";img.style.cssText="width:100%;aspect-ratio:3/4;object-fit:contain;background:#e9f2f6;border-radius:4px;";img.onerror=()=>{img.style.display="none";};tile.appendChild(img);}
          tile.append(node("strong","",card.name||card.id),node("small","pc-muted",rarity+" 星 · "+(card.type||"卡牌")+" · "+card.id));
          tile.addEventListener("click",()=>{selected=card;selectedText.textContent="已选择："+(card.name||card.id);confirm.disabled=false;render();});
          grid.appendChild(tile);
        });
        if(!rows.length)grid.appendChild(node("p","pc-empty","没有找到符合条件的卡牌。"));
      };
      search.addEventListener("input",render);render();
      confirm.addEventListener("click",async()=>{
        if(!selected||confirm.disabled)return;
        confirm.disabled=true;close.disabled=true;confirm.textContent="正在确认……";
        const key="acg-select-ticket:"+currentUser.id+":"+item.item_id;
        let requestId;try{requestId=localStorage.getItem(key);if(!requestId){requestId=crypto.randomUUID();localStorage.setItem(key,requestId);}}catch(_){requestId=crypto.randomUUID();}
        try{
          const {data:result,error:useError}=await client.rpc("player_use_select_card_ticket",{p_item_id:item.item_id,p_card_id:selected.id,p_request_id:requestId});
          if(useError)throw useError;
          try{localStorage.removeItem(key);}catch(_){}
          overlay.remove();overlay=null;
          const grantedId=result?.result?.reward_id||selected.id;
          const grantedCard=cardsById[grantedId]||{id:grantedId,name:grantedId};
          setStatus("自选成功！「"+(grantedCard.name||grantedId)+"」已加入你的卡牌收藏。",false);
          try{await loadPage("inventory");}catch(refreshError){setStatus("卡牌已成功加入收藏，但仓库刷新失败；重新打开仓库即可看到。",true);}
        }catch(error){confirm.disabled=false;close.disabled=false;confirm.textContent="确认选择并使用";setStatus("使用自选卷失败："+error.message,true);}
      });
    }catch(error){overlay?.remove();setStatus("无法打开自选卡牌界面："+error.message,true);button.disabled=false;}
  }

  async function useWarehouseItem(item,button,choiceIndex=null){
    if(button.disabled)return;
    if(item.effect_type==="select_card"){await useSelectCardTicket(item,button);return;}
    if(item.effect_type==="choose_reward"&&choiceIndex===null){
      const options=item.effect_config?.options||[];
      const menu=options.map((option,index)=>(index+1)+". "+(option.label||((option.reward_type==="tokens"?"代币":option.reward_type==="card"?"卡牌":"道具")+" ×"+option.amount))).join("\\n");
      const answer=prompt("请选择一项奖励，输入序号：\\n"+menu);
      if(answer===null)return;
      choiceIndex=Number(answer);
      if(!Number.isInteger(choiceIndex)||choiceIndex<1||choiceIndex>options.length){setStatus("奖励选项编号无效。",true);return;}
    }
    const key="acg-warehouse-item:"+currentUser.id+":"+item.item_id;
    let requestId;try{requestId=localStorage.getItem(key);if(!requestId){requestId=crypto.randomUUID();localStorage.setItem(key,requestId);}}catch(_){requestId=crypto.randomUUID();}
    button.disabled=true;setStatus("正在使用「"+item.name+"」……",false);
    try{
      const {data,error}=await client.rpc("use_inventory_item",{p_item_id:item.item_id,p_request_id:requestId,p_choice_index:choiceIndex});
      if(error)throw error;try{localStorage.removeItem(key);}catch(_){}
      const result=Array.isArray(data)?data[0]:data;
      if(result?.cards?.length)showSinglePackOpening({pack_id:result.result?.pack_id||"pack_010",pack_name:result.result?.pack_name||"奖励卡包",price_tokens:0,draw_mode:item.effect_type==="draw_pack"&&packCatalog.find(x=>x.id===result.result?.pack_id)?.category==="berry"?"uniform":"rarity"},result,"inventory");
      else if(result?.result?.kind==="tokens")setStatus("使用成功，获得 "+result.result.amount+" 代币。",false);
      else setStatus("使用成功，奖励已发放。",false);
      await loadPage("inventory");
    }catch(error){setStatus("道具使用失败："+error.message,true);button.disabled=false;}
  }
  async function loadInventory() {
    await loadCardNames();
    contentEl.replaceChildren();
    const heading=node("div","pc-warehouse-heading");
    heading.append(node("h3","","我的玩家仓库"),node("p","pc-muted","仓库分为卡牌、重要道具、消耗品和树果四个分类。对战道具等消耗品将在对应库存接入后显示。"));
    const tabsHost=node("div");tabsHost.id="pc-warehouse-tabs-host";
    const description=node("p","pc-muted");description.id="pc-warehouse-category-description";
    const filters=node("div","pc-search");
    const searchWrap=node("div","field"),searchLabel=node("label","","搜索"+(myWarehouseCategory==="berries"?"树果":"卡牌")),search=node("input");
    search.placeholder="输入名称或编号";search.value=myWarehouseQuery;searchLabel.appendChild(search);searchWrap.append(searchLabel);
    const packWrap=node("div","field"),packLabel=node("label","","卡包筛选"),pack=node("select");
    pack.add(new Option("全部卡包",""));
    [...new Set(Object.values(cardsById).map(card=>card.pack_id).filter(Boolean))].sort().forEach(id=>pack.add(new Option(id,id)));
    pack.value=myWarehousePack;packLabel.appendChild(pack);packWrap.append(packLabel);
    filters.append(searchWrap,packWrap);
    const summary=node("p","pc-muted");summary.id="pc-warehouse-summary";
    const host=node("div","pc-inventory-grid");host.id="pc-warehouse-cards";
    contentEl.append(heading,tabsHost,description,filters,summary,host);
    search.addEventListener("input",()=>{myWarehouseQuery=search.value.trim().toLowerCase();pcListPages["my-inventory"]=1;renderMyWarehouse();});
    pack.addEventListener("change",()=>{myWarehousePack=pack.value;pcListPages["my-inventory"]=1;renderMyWarehouse();});
    host.appendChild(node("div","pc-empty","正在读取你的仓库……"));
    const [{data:inventory,error},{data:itemCatalog,error:itemError}]=await Promise.all([
      client.from("card_inventory").select("card_id,quantity").eq("user_id",currentUser.id).gt("quantity",0).order("card_id"),
      client.from("item_catalog").select("item_id,name,icon,description,category,effect_type,effect_config,is_active")
    ]);
    if(error)throw error;if(itemError)throw itemError;
    myWarehouseRows=inventory||[];myWarehouseItems=itemCatalog||[];
    renderMyWarehouse();
  }



  const BADGE_THEMES=[{glyph:"⚔",light:"#ffe1a3",main:"#d98b35",dark:"#82431f"},{glyph:"🏆",light:"#d8f0ff",main:"#4c9fc2",dark:"#20516f"},{glyph:"✦",light:"#fff0b0",main:"#d7a638",dark:"#80531e"},{glyph:"♛",light:"#f6d6ff",main:"#9c69c8",dark:"#533778"},{glyph:"◆",light:"#c7f4e7",main:"#299b8a",dark:"#14594f"},{glyph:"♜",light:"#ffd4d9",main:"#d85c78",dark:"#762b4a"}];
  function badgeTheme(item,index=0){const key=String(item?.id||item?.name||"");if(/win|match|battle|game|胜|战|连胜/i.test(key))return BADGE_THEMES[0];if(/draw|collection|card|抽|收集|收藏/i.test(key))return BADGE_THEMES[2];if(/rate|season|rank|率|赛季|段位/i.test(key))return BADGE_THEMES[3];if(/streak|first|初|首|连续/i.test(key))return BADGE_THEMES[4];return BADGE_THEMES[index%BADGE_THEMES.length];}
  function createBadgeSeal(item,index=0){const theme=badgeTheme(item,index),seal=node("span","pc-badge-seal");seal.style.setProperty("--badge-light",theme.light);seal.style.setProperty("--badge-main",theme.main);seal.style.setProperty("--badge-dark",theme.dark);seal.appendChild(node("span","pc-badge-glyph",theme.glyph));return seal;}
  function renderBadgeShelf(host,badgeIds,achievementRows){const shelf=node("div","pc-badge-shelf"),byId=Object.fromEntries((achievementRows||[]).map(item=>[item.id,item]));(badgeIds||[]).slice(0,3).forEach((id,index)=>{const item=byId[id]||{id,name:id,description:"已获得的成就徽章"},card=node("div","pc-badge-card");card.append(createBadgeSeal(item,index));const copy=node("div","pc-badge-copy");copy.append(node("strong","",item.name||id),node("small","",item.description||"成就纪念徽章"));card.appendChild(copy);shelf.appendChild(card);});if(!shelf.children.length)shelf.appendChild(node("div","pc-empty","尚未选择主页徽章。解锁成就后，可以在主页展示设置中选择。"));host.appendChild(shelf);}
  const avatarFrameThemes=[{name:"赤焰缎带"},{name:"冰晶星环"},{name:"樱花绮梦"},{name:"紫晶蝶舞"},{name:"星月誓约"},{name:"碧海流光"},{name:"绯色玫瑰"},{name:"雪羽祈愿"},{name:"甜心物语"},{name:"王冠礼赞"},{name:"紫蝶幻境"},{name:"薄荷花园"}];
  function avatarFrameDataUrl(id){const frameId=Number(id);if(!Number.isInteger(frameId)||frameId<1||frameId>avatarFrameThemes.length)return "";return new URL("assets/avatar-frames/frame-"+String(frameId).padStart(2,"0")+".png",document.baseURI).href;}
  function renderProfileHero(host,{name,number,title,joined,avatarUrl,avatarFrameId}){const hero=node("section","pc-profile-hero"),avatar=node("div","pc-avatar-frame-slot"),core=node("div","pc-avatar-core"),initials=String(name||"A").trim().slice(0,1).toUpperCase()||"A";core.style.width="74px";core.style.height="74px";core.style.left="33px";core.style.top="25.5px";if(avatarUrl){const image=node("img");image.src=avatarUrl;image.alt=(name||"玩家")+"的头像";core.appendChild(image);}else core.textContent=initials;avatar.appendChild(core);if(avatarFrameId){const frame=node("img","pc-avatar-frame-art");frame.src=avatarFrameDataUrl(avatarFrameId);frame.alt="";avatar.appendChild(frame);}const meta=node("div","pc-profile-meta");meta.append(node("div","pc-profile-kicker","ACG CARD HUB · PLAYER PROFILE"),node("h2","pc-profile-name",name||"玩家"));meta.appendChild(node("div","pc-profile-sub",(number?number+"　·　":"")+"玩家档案"+(joined?"　·　加入于 "+joined:"")));if(title)meta.appendChild(node("span","pc-profile-title","✦ "+title));hero.append(avatar,meta);host.appendChild(hero);}


  async function loadAvatarPreview(){const preview=view.querySelector("#pc-avatar-preview"),{data,error}=await client.from("profiles").select("avatar_url").eq("id",currentUser.id).maybeSingle();if(error)throw error;const url=data?.avatar_url||"";preview.src=url||"data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#173f60"/><text x="50" y="64" text-anchor="middle" font-size="48" fill="#fff">+</text></svg>');}
  async function loadAvatarFramePicker(){const picker=view.querySelector("#pc-avatar-frame-picker"),status=view.querySelector("#pc-avatar-frame-status"),{data,error}=await client.from("profiles").select("avatar_frame_id").eq("id",currentUser.id).maybeSingle();if(error)throw error;const selected=Number(data?.avatar_frame_id)||0;picker.replaceChildren();const add=(id,label)=>{const button=node("button","pc-avatar-frame-option");button.type="button";button.dataset.frameId=id?String(id):"";button.setAttribute("aria-pressed",String(selected===id));button.style.border=selected===id?"3px solid #ffe08a":"1px solid #6ca9c0";button.style.background=selected===id?"linear-gradient(135deg,#f6e4a4,#d6b85e)":"linear-gradient(135deg,#10466a,#167a9b)";button.style.color=selected===id?"#173f60":"#ffffff";if(id){const image=node("img");image.src=avatarFrameDataUrl(id);image.alt="";button.appendChild(image);}const caption=node("span","",label+(selected===id?"　✓ 已选":""));button.appendChild(caption);button.addEventListener("click",()=>{picker.querySelectorAll("button").forEach(b=>{b.setAttribute("aria-pressed","false");b.style.border="1px solid #6ca9c0";b.style.background="linear-gradient(135deg,#10466a,#167a9b)";b.style.color="#ffffff";const span=b.querySelector("span");if(span)span.textContent=avatarFrameThemes[Number(b.dataset.frameId)-1]?.name||"无头像框";});button.setAttribute("aria-pressed","true");button.style.border="3px solid #ffe08a";button.style.background="linear-gradient(135deg,#f6e4a4,#d6b85e)";button.style.color="#173f60";caption.textContent=label+"　✓ 已选";status.textContent="已选择「"+label+"」，点击下方「保存头像框」后才会正式装备。";status.className="status";});picker.appendChild(button);};add(0,"无头像框");avatarFrameThemes.forEach((theme,index)=>add(index+1,theme.name));status.textContent=selected?"当前已装备："+avatarFrameThemes[selected-1]?.name:"当前未装备头像框";}
  async function loadAvatarDecorationSettings(){await Promise.all([loadAvatarPreview(),loadAvatarFramePicker()]);}
  const avatarFileInput=view.querySelector("#pc-avatar-file"),avatarStatus=view.querySelector("#pc-avatar-status"),avatarButton=view.querySelector("#pc-upload-avatar"),cropModal=view.querySelector("#pc-avatar-crop-modal"),cropPreview=view.querySelector("#pc-avatar-crop-image"),cropX=view.querySelector("#pc-avatar-crop-x"),cropY=view.querySelector("#pc-avatar-crop-y"),cropZoom=view.querySelector("#pc-avatar-crop-zoom");let cropImage=null,cropObjectUrl=null;
  function updateCropPreview(){if(!cropImage)return;const size=240,scale=Math.max(size/cropImage.naturalWidth,size/cropImage.naturalHeight)*(Number(cropZoom.value)/100),width=cropImage.naturalWidth*scale,height=cropImage.naturalHeight*scale;cropPreview.style.width=width+"px";cropPreview.style.height=height+"px";cropPreview.style.left=((size-width)*Number(cropX.value)/100)+"px";cropPreview.style.top=((size-height)*Number(cropY.value)/100)+"px";}
  function closeCropModal(){cropModal.style.display="none";if(cropObjectUrl){URL.revokeObjectURL(cropObjectUrl);cropObjectUrl=null;}cropImage=null;avatarFileInput.value="";}
  [cropX,cropY,cropZoom].forEach(input=>input.addEventListener("input",updateCropPreview));
  avatarFileInput.addEventListener("change",()=>{const file=avatarFileInput.files?.[0];if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)){avatarStatus.textContent="只支持 JPG、PNG 或 WebP 图片。";avatarStatus.className="status bad";avatarFileInput.value="";return;}if(file.size>8*1024*1024){avatarStatus.textContent="原始图片不能超过 8MB。";avatarStatus.className="status bad";avatarFileInput.value="";return;}if(cropObjectUrl)URL.revokeObjectURL(cropObjectUrl);cropObjectUrl=URL.createObjectURL(file);cropImage=new Image();cropImage.onload=()=>{cropX.value="50";cropY.value="50";cropZoom.value="100";cropPreview.src=cropObjectUrl;updateCropPreview();cropModal.style.display="flex";};cropImage.onerror=()=>{avatarStatus.textContent="图片读取失败，请换一张图片。";avatarStatus.className="status bad";};cropImage.src=cropObjectUrl;});
  view.querySelector("#pc-avatar-crop-cancel").addEventListener("click",closeCropModal);
  avatarButton.addEventListener("click",async()=>{if(!cropImage){avatarStatus.textContent="请先选择一张图片并完成裁剪。";avatarStatus.className="status bad";return;}avatarButton.disabled=true;avatarStatus.textContent="正在处理并上传头像……";avatarStatus.className="status";try{const size=512,scale=Math.max(size/cropImage.naturalWidth,size/cropImage.naturalHeight)*(Number(cropZoom.value)/100),cropSize=size/scale,sx=(cropImage.naturalWidth-cropSize)*Number(cropX.value)/100,sy=(cropImage.naturalHeight-cropSize)*Number(cropY.value)/100,canvas=document.createElement("canvas");canvas.width=size;canvas.height=size;const context=canvas.getContext("2d");if(!context)throw new Error("浏览器无法处理图片。");context.drawImage(cropImage,sx,sy,cropSize,cropSize,0,0,size,size);const blob=await new Promise((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error("头像裁剪失败")),"image/webp",0.92));const path=currentUser.id+"/avatar.webp";const {error:uploadError}=await client.storage.from("player-avatars").upload(path,blob,{upsert:true,contentType:"image/webp",cacheControl:"0"});if(uploadError)throw uploadError;const {data:publicData}=client.storage.from("player-avatars").getPublicUrl(path),baseUrl=publicData.publicUrl;const {error:updateError}=await client.rpc("save_player_avatar",{p_avatar_url:baseUrl});if(updateError)throw updateError;const {data:verified,error:verifyError}=await client.from("profiles").select("avatar_url").eq("id",currentUser.id).single();if(verifyError)throw verifyError;if(!verified?.avatar_url||verified.avatar_url!==baseUrl)throw new Error("数据库未能确认头像地址已保存。");closeCropModal();avatarStatus.textContent="头像已保存并验证。";avatarStatus.className="status good";await loadOverview();}catch(error){avatarStatus.textContent="头像上传失败："+error.message;avatarStatus.className="status bad";}finally{avatarButton.disabled=false;}});
  view.querySelector("#pc-save-avatar-frame").addEventListener("click",async()=>{const button=view.querySelector("#pc-save-avatar-frame"),status=view.querySelector("#pc-avatar-frame-status"),active=view.querySelector('#pc-avatar-frame-picker button[aria-pressed="true"]'),frameId=active?.dataset.frameId?Number(active.dataset.frameId):null;button.disabled=true;status.textContent="正在保存头像框……";status.className="status";try{const {error}=await client.rpc("save_player_avatar_frame",{p_frame_id:frameId});if(error)throw error;const {data:verified,error:readError}=await client.from("profiles").select("avatar_frame_id").eq("id",currentUser.id).single();if(readError)throw readError;if((verified?.avatar_frame_id??null)!==(frameId??null))throw new Error("数据库未确认头像框设置。");status.textContent="头像框已保存。";status.className="status good";await loadOverview();}catch(error){status.textContent="保存失败："+error.message;status.className="status bad";}finally{button.disabled=false;}});

  async function loadDisplayChoices() {
    await loadAvatarDecorationSettings();
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
    available.forEach((item,index)=>{
      const label=node("label","pc-badge-choice");
      const checkbox=node("input");checkbox.type="checkbox";checkbox.value=item.id;checkbox.checked=selected.has(item.id);
      checkbox.addEventListener("change",()=>{
        const checked=[...badgeWrap.querySelectorAll('input[type="checkbox"]:checked')];
        if(checked.length>3){checkbox.checked=false;status.textContent="主页徽章最多选择三个。";status.className="status bad";}
        else{status.textContent="";status.className="status";}
      });
      const copy=node("span","");copy.append(node("strong","",item.name),node("small","",item.description||"成就纪念徽章"));
      label.append(checkbox,createBadgeSeal(item,index),copy);
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
  let cardNamesLoadPromise=null;
  let lastSelectedDrawPoolId=null;
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
  let drawLobbyRoot=null;
  function closeDrawLobby(){if(drawLobbyRoot){drawLobbyRoot.remove();drawLobbyRoot=null;}}
  function renderDrawNotice(message,canRetry=true){
    closeDrawLobby();
    const root=node("div");root.id="acg-draw-lobby";drawLobbyRoot=root;
    root.style.cssText="position:fixed;inset:0;z-index:999990;overflow:auto;background:radial-gradient(ellipse at 50% -15%,#263958 0,#101827 34%,#080b12 72%);color:#edf2fa;font-family:Inter,'Microsoft YaHei',sans-serif;display:block";
    const top=node("header","adl-top"),brand=node("div","adl-brand");brand.innerHTML='ACG <b>PACK LAB</b>';
    const back=node("button","adl-close","返回玩家中心");back.type="button";
    back.addEventListener("click",()=>{closeDrawLobby();showCenter("overview");});
    top.append(brand,back);
    const main=node("main","adl-main");
    main.style.cssText="max-width:1160px;margin:auto;padding:70px 22px;text-align:center";
    const msg=node("div","adl-status",message);msg.style.cssText="padding:28px;border:1px solid #34445c;background:#111b2b;color:#dcecff";
    main.appendChild(msg);
    if(canRetry){
      const retry=node("button","adl-btn primary","重新连接抽卡系统");retry.type="button";
      retry.style.marginTop="18px";retry.addEventListener("click",()=>loadPage("draw"));
      main.appendChild(retry);
    }
    root.append(top,main);document.body.appendChild(root);
  }
  function renderDrawLobby(pools,stats,history,drawCount,packNames){
    closeDrawLobby();
    const root=node("div");root.id="acg-draw-lobby";drawLobbyRoot=root;
    const forceStyle=(el,styles)=>Object.entries(styles).forEach(([k,v])=>el.style.setProperty(k,v,"important"));
    forceStyle(root,{position:"fixed",inset:"0",zIndex:"999990",display:"block",overflowY:"auto",overflowX:"hidden",background:"radial-gradient(ellipse at 50% -15%,#263958 0,#101827 34%,#080b12 72%)",color:"#edf2fa",boxSizing:"border-box"});
    const top=node("header","adl-top"),brand=node("div","adl-brand");brand.innerHTML='ACG <b>PACK LAB</b>';
    let currentDrawBalance=Number(stats?.tokens??0);
    const right=node("div","adl-topright"),token=node("div","adl-token","代币："+currentDrawBalance),close=node("button","adl-close","返回玩家中心");
    close.type="button";close.addEventListener("click",()=>{closeDrawLobby();showCenter("overview");});right.append(token,close);top.append(brand,right);
    const main=node("main","adl-main"),eyebrow=node("div","adl-eyebrow","CARD PACK COLLECTION"),hero=node("div","adl-hero");
    const groupStyle=node("style");
    groupStyle.textContent=".adl-group-title{margin:24px 0 12px;padding:0 0 9px;color:#f4d98d;font-size:19px;letter-spacing:.08em;border-bottom:1px solid #59647a}.adl-special-divider{height:1px;margin:34px 0 22px;background:linear-gradient(90deg,transparent,#d9b45f 12%,#d9b45f 88%,transparent);position:relative}.adl-special-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 12px;padding:0 0 10px;border-bottom:1px solid #725d37;color:#ffe2a0;font-size:21px;font-weight:900}.adl-special-heading small{font-size:10px;letter-spacing:.18em;color:#c6a96c}.adl-subgroup-title{margin:22px 0 10px;color:#c8e8ff;font-size:15px;letter-spacing:.06em}.adl-subgroup-title:before{content:'◆';color:#e5bd68;margin-right:8px;font-size:10px}@media(max-width:850px){.adl-pools{grid-template-columns:repeat(2,minmax(0,1fr))!important}}@media(max-width:520px){.adl-pools{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}.adl-pool{min-height:220px!important}.adl-special-heading{font-size:18px}}";
    root.appendChild(groupStyle);
    forceStyle(main,{display:"block",position:"relative",width:"min(1180px,100%)",maxWidth:"1180px",margin:"0 auto",padding:"34px 22px 70px",background:"transparent",border:"0",boxShadow:"none",color:"#edf2fa",boxSizing:"border-box"});
    const hgroup=node("div");hgroup.append(node("h1","","卡包抽卡"),node("p","","选择你的卡包，开启下一张传说。每包 5 张卡，十连共 50 张。"));
    const tokenbox=node("div","adl-tokenbox"),tokenValue=node("b","",String(currentDrawBalance));tokenbox.append(document.createTextNode("当前代币"),tokenValue);hero.append(hgroup,tokenbox);
    const section=node("div","adl-section");section.append(document.createTextNode("选择卡包"),node("small","","SELECT YOUR PACK"));
    const packCategory=pool=>packCatalog.find(pack=>pack.id===pool.pack_id)?.category||"normal";
    const categoryOrder={normal:0,battle_item:1,berry:2};
    const orderedPools=pools.slice().sort((a,b)=>(categoryOrder[packCategory(a)]??0)-(categoryOrder[packCategory(b)]??0)||String(a.pack_name).localeCompare(String(b.pack_name),"zh-CN"));
    let selectedPool=orderedPools.find(pool=>pool.pack_id===lastSelectedDrawPoolId)||orderedPools[0]||null;
    if(selectedPool)lastSelectedDrawPoolId=selectedPool.pack_id;
    const cards=Object.values(cardsById);
    const makePoolGrid=groupPools=>{
      const grid=node("div","adl-pools");
      forceStyle(grid,{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:"15px",width:"100%",margin:"0",padding:"0",background:"transparent",border:"0",boxShadow:"none",boxSizing:"border-box"});
      groupPools.forEach(pool=>{
        const tile=node("article","adl-pool"+(selectedPool?.pack_id===pool.pack_id?" active":""));tile.dataset.packId=pool.pack_id;
        forceStyle(tile,{display:"block",minWidth:"0",minHeight:"260px",background:"linear-gradient(150deg,#1b2a40,#0d1420 68%)",borderRadius:"8px",overflow:"hidden",cursor:"pointer",boxSizing:"border-box"});
        const cover=node("div","adl-cover");
        const coverCard=(cards.find(c=>c.id===pool.cover_card_id&&c.pack_id===pool.pack_id&&c.image)||cards.filter(c=>c.pack_id===pool.pack_id&&c.image).sort((a,b)=>Number(b.star||0)-Number(a.star||0))[0]);
        // CSS background avoids image-translation extensions intercepting artwork clicks.
        if(coverCard){const art=node("div","adl-cover-art");art.style.backgroundImage="url("+JSON.stringify(coverCard.image)+")";cover.appendChild(art);}
        const info=node("div","adl-poolinfo");info.append(node("h3","",pool.pack_name),node("p","",pool.description||"ACG 卡牌卡池"),node("strong","","单包 "+pool.price_tokens+" 代币 · 5 张卡"));
        tile.append(cover,info);tile.addEventListener("click",()=>{selectedPool=pool;lastSelectedDrawPoolId=pool.pack_id;root.querySelectorAll(".adl-pool").forEach(el=>el.classList.toggle("active",el===tile));updateConfig();});grid.appendChild(tile);
      });
      return grid;
    };
    const normalPools=orderedPools.filter(pool=>packCategory(pool)==="normal");
    const battleItemPools=orderedPools.filter(pool=>packCategory(pool)==="battle_item");
    const berryPools=orderedPools.filter(pool=>packCategory(pool)==="berry");
    const otherPools=orderedPools.filter(pool=>!["normal","battle_item","berry"].includes(packCategory(pool)));
    const normalHeading=node("h3","adl-group-title","普通卡牌卡包");
    const normalGrid=makePoolGrid(normalPools);
    const specialDivider=node("div","adl-special-divider");
    const specialHeading=node("div","adl-special-heading");
    specialHeading.append(node("span","","额外系统补给"),node("small","","SPECIAL SUPPLIES"));
    const battleHeading=node("h4","adl-subgroup-title","对战道具包");
    const battleGrid=makePoolGrid(battleItemPools);
    const berryHeading=node("h4","adl-subgroup-title","树果包");
    const berryGrid=makePoolGrid(berryPools);
    const otherGrid=makePoolGrid(otherPools);
    const config=node("div","adl-config"),configInfo=node("div"),configTitle=node("h3","",selectedPool?.pack_name||"暂无开放卡池"),configDesc=node("p","","每包 5 张卡 · 经典卡池");
    forceStyle(config,{display:"flex",position:"relative",width:"100%",height:"auto",minHeight:"0",maxHeight:"none",flex:"0 0 auto",flexDirection:"row",flexWrap:"nowrap",alignSelf:"auto",gridColumn:"1 / -1",gridRow:"auto",alignItems:"center",justifyContent:"space-between",gap:"16px",margin:"30px 0 0",padding:"17px 18px",overflow:"visible",background:"linear-gradient(100deg,#141e2d,#0e1521)",border:"1px solid #283449",borderRadius:"7px",boxShadow:"none",color:"#edf2fa",boxSizing:"border-box"});
    configInfo.append(configTitle,configDesc);const actions=node("div","adl-actions"),single=node("button","adl-btn primary","开启 1 包 · 5 张"),ten=node("button","adl-btn","开启 10 包 · 50 张");
    single.type=ten.type="button";actions.append(single,ten);config.append(configInfo,actions);
    const rates=node("div","adl-rates"),status=node("div","adl-status","");
     forceStyle(rates,{height:"auto",minHeight:"0",maxHeight:"none",flex:"0 0 auto",gridColumn:"1 / -1"});
     forceStyle(status,{height:"auto",minHeight:"18px",maxHeight:"none",flex:"0 0 auto",gridColumn:"1 / -1"});
    function updateConfig(){
      if(!selectedPool)return;
      configTitle.textContent=selectedPool.pack_name;configDesc.textContent="每包 5 张 · 单包 "+selectedPool.price_tokens+" 代币";
      rates.innerHTML=selectedPool.draw_mode==="uniform"
        ? '<span>🍃 树果等概率</span><span class="adl-muted">每张树果卡被抽中的概率相同 · 不设星级与异画概率</span>'
        : '<span class="alt">✦ 异画 '+Number(selectedPool.rate_alt||0)+'%</span><span class="r5">★★★★★ 五星 '+selectedPool.rate_5+'%</span><span class="r4">★★★★ 四星 '+selectedPool.rate_4+'%</span><span>★★★ 三星 '+selectedPool.rate_3+'%</span><span class="adl-muted">每张卡独立判定</span>';
    }
    updateConfig();
    const historySection=node("div","adl-history"),historyTitle=node("h3","","抽卡记录 · 累计 "+(drawCount??0)+" 张");
    forceStyle(historySection,{display:"block",position:"relative",width:"100%",height:"auto",minHeight:"0",maxHeight:"none",flex:"0 0 auto",alignSelf:"auto",gridColumn:"1 / -1",gridRow:"auto",margin:"28px 0 0",padding:"16px 0 0",overflow:"visible",background:"transparent",border:"0",borderTop:"1px solid #34445c",boxShadow:"none",color:"#edf2fa",boxSizing:"border-box"});
    historySection.appendChild(historyTitle);
    if(!history?.length)historySection.appendChild(node("p","adl-muted","还没有抽卡记录。"));
    else history.forEach(item=>{
      const info=cardsById[item.card_id]||{name:item.card_id},line=node("div","adl-historyrow");
      if(info.image){const img=node("img");img.src=info.image;img.alt=info.name;line.appendChild(img);}
      const detail=node("div");detail.append(node("strong","",info.name),node("div","adl-muted",(info.star||"")+" 星 · "+(packNames[item.pack_id]||item.pack_id)+" · "+new Date(item.created_at).toLocaleString("zh-CN")));line.appendChild(detail);historySection.appendChild(line);
    });
    const launch=async count=>{
      if(!selectedPool||drawBusy)return;
      const estimatedCost=Number(selectedPool.price_tokens||0)*count;
      if(currentDrawBalance<estimatedCost){
        status.textContent="代币不足：本次需要 "+estimatedCost+"，当前只有 "+currentDrawBalance+"。";
        status.style.color="#ff9b9b";return;
      }
      status.textContent="正在连接抽卡系统……";status.style.color="";
      single.disabled=ten.disabled=true;
      try{
        const result=await performDraw(selectedPool,count);
        if(result){
          currentDrawBalance=Number(result.remaining_tokens);
          token.textContent="代币："+currentDrawBalance;
          tokenValue.textContent=String(currentDrawBalance);
          status.textContent="抽卡完成，本次消耗 "+Number(result.charged_tokens||0)+" 代币。";
        }
      }finally{single.disabled=ten.disabled=false;}
    };
    single.addEventListener("click",()=>launch(1));ten.addEventListener("click",()=>launch(10));
    main.append(eyebrow,hero,section);
    if(normalPools.length){main.append(normalHeading,normalGrid);}
    if(battleItemPools.length||berryPools.length||otherPools.length){
      main.append(specialDivider,specialHeading);
      if(battleItemPools.length)main.append(battleHeading,battleGrid);
      if(berryPools.length)main.append(berryHeading,berryGrid);
      if(otherPools.length)main.append(otherGrid);
    }
    main.append(config,rates,status,historySection);root.append(top,main);document.body.appendChild(root);
  }
  async function loadDraw() {
    const [_,poolsResult,statsResult,historyResult,packsResult]=await Promise.all([
      loadCardNames(),
      client.from("card_draw_pools").select("pack_id,pack_name,price_tokens,rate_alt,rate_3,rate_4,rate_5,enabled,cover_card_id").eq("enabled",true).order("pack_id"),
      client.from("player_stats").select("tokens").eq("user_id",currentUser.id).maybeSingle(),
      client.from("card_draw_history").select("id,pack_id,card_id,cost_tokens,draw_index,created_at",{count:"exact"}).eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(30),
      client.from("card_draw_pools").select("pack_id,pack_name")
    ]);
    const {data:pools,error}=poolsResult;if(error)throw error;drawPools=pools||[];
    const {data:stats,error:statsError}=statsResult;if(statsError)throw statsError;
    const {data:history,error:historyError,count:drawCount}=historyResult;if(historyError)throw historyError;
    const {data:packRows,error:packError}=packsResult;if(packError)throw packError;
    const packNames=Object.fromEntries((packRows||[]).map(pack=>[pack.pack_id,pack.pack_name]));
    contentEl.replaceChildren();
    if(!drawPools.length){renderDrawNotice("目前没有开放的卡池。请等待管理员完成卡池设置。",false);return;}
    renderDrawLobby(drawPools,stats,history,drawCount,packNames);
  }

  function showCardImagePreview(card){
    const src=typeof card==="string"?card:card?.image;if(!src)return;
    const overlay=node("div");overlay.style.cssText="position:fixed;inset:0;z-index:100020;background:rgba(3,8,18,.92);display:flex;align-items:center;justify-content:center;padding:22px;cursor:zoom-out";
    const image=node("img");image.src=src;image.alt=typeof card==="string"?"卡牌大图":(card?.name||"卡牌大图");image.style.cssText="display:block;max-width:min(92vw,760px);max-height:88vh;width:auto;height:auto;object-fit:contain;box-shadow:0 12px 48px #000b;border:1px solid #d5bd76;background:#101827;cursor:default";
    const close=node("button","","关闭 ×");close.type="button";close.style.cssText="position:absolute;top:16px;right:18px;padding:9px 14px;background:#172235;border:1px solid #8c9bb0;color:#fff;cursor:pointer";
    const dismiss=()=>overlay.remove();overlay.addEventListener("click",event=>{if(event.target===overlay)dismiss();});close.addEventListener("click",dismiss);image.addEventListener("click",event=>event.stopPropagation());overlay.append(image,close);document.body.appendChild(overlay);
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
    title.innerHTML='<small>MASTER DUEL INSPIRED · TEN PACK OPENING</small><h2>十连抽卡</h2><p>十个卡包同时登场 · 共 50 张卡牌 · 结果已由服务器确定</p>';
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
        const info=cardsById[card.card_id]||{name:card.card_id},grade=rarityOf(card),el=node("div","acg-td-card"+(grade==="r3"||grade==="uniform"?"":" "+grade));
        const inner=node("div","acg-td-inner"),back=node("div","acg-td-face acg-td-back"),front=node("div","acg-td-face acg-td-front"),img=node("img");
        img.src=info.image||"";img.alt=info.name;img.loading="lazy";img.decoding="async";img.style.cursor="zoom-in";img.addEventListener("click",event=>{event.stopPropagation();showCardImagePreview(info);});const name=node("strong","",info.name);
        front.append(img,name);inner.append(back,front);const label=node("div","acg-td-cardname","未揭晓");el.append(inner,label);el.addEventListener("click",()=>revealOne(i));cardGrid.appendChild(el);
      });
      nextBtn.textContent="翻开下一张";allBtn.disabled=false;
      reveal.scrollIntoView({behavior:"smooth",block:"center"});
    }
    function showComplete(){
      if(finished)return;finished=true;packs.forEach((_,i)=>packGrid.children[i].classList.add("opened"));
      openBtn.disabled=true;skipBtn.disabled=true;nextBtn.disabled=true;allBtn.disabled=true;
      headTitle.textContent="TEN PACKS COMPLETE";sub.textContent="十连完成 · 服务器已保存全部 50 张卡牌";
      rtitle.textContent="十连抽卡结果";progress.textContent="正在整理 50 张结果卡牌……";
      cardGrid.replaceChildren();const counts={alt:0,r5:0,r4:0,r3:0};cards.forEach(card=>counts[rarityOf(card)]++);
      summary.innerHTML="十连结果：异画 <b>"+counts.alt+"</b>　五星 <b>"+counts.r5+"</b>　四星 <b>"+counts.r4+"</b>　三星 <b>"+counts.r3+"</b>";
      revealActions.replaceChildren();const done=node("button","acg-td-btn primary","完成 · 返回抽卡大厅");done.type="button";done.disabled=true;done.addEventListener("click",()=>overlay.remove());revealActions.appendChild(done);
      let index=0;
      function renderResultChunk(){
        const fragment=document.createDocumentFragment(),end=cards.length;
        for(;index<end;index++){
          const card=cards[index],grade=rarityOf(card),info=cardsById[card.card_id]||{name:card.card_id};
          const el=node("div","acg-td-card flip"+(grade==="r3"?"":" "+grade));
          const inner=node("div","acg-td-inner"),back=node("div","acg-td-face acg-td-back"),front=node("div","acg-td-face acg-td-front"),img=node("img");
          img.src=info.image||"";img.alt=info.name;img.loading="lazy";img.decoding="async";img.style.cursor="zoom-in";img.addEventListener("click",event=>{event.stopPropagation();showCardImagePreview(info);});
          const name=node("strong","",info.name);front.append(img,name);inner.append(back,front);el.append(inner,node("div","acg-td-cardname",info.name));fragment.appendChild(el);
        }
        cardGrid.appendChild(fragment);progress.textContent=index+" / "+cards.length+" 张结果卡牌已载入";
        done.disabled=false;progress.textContent=cards.length+" / "+cards.length+" 张结果卡牌已载入";
      }
      reveal.scrollIntoView({behavior:"smooth",block:"start"});requestAnimationFrame(renderResultChunk);
    }
    openBtn.addEventListener("click",()=>{if(finished)return;if(current===-1||flipped===5)openPackage();else{revealOne([...cardGrid.children].findIndex(el=>!el.classList.contains("flip")));}});
    nextBtn.addEventListener("click",()=>{if(flipped===5){openPackage();return;}const i=[...cardGrid.children].findIndex(el=>!el.classList.contains("flip"));if(i>=0)revealOne(i);});
    allBtn.addEventListener("click",revealAllCurrent);
    skipBtn.addEventListener("click",()=>{if(finished)return;showComplete();});
  }
  async function performDraw(pool,packCount) {
    if(drawBusy)return;drawBusy=true;
    const requestId=getDrawRequestId(pool.pack_id,packCount);
    const loading=node("div","adl-status","正在抽取 "+(packCount*5)+" 张卡，请稍候……");
    if(drawLobbyRoot)drawLobbyRoot.querySelector(".adl-main").appendChild(loading);
    try{
      const {data,error}=await withTimeout(client.rpc("draw_packages",{p_pack_id:pool.pack_id,p_request_id:requestId,p_pack_count:packCount}),30000,"抽卡服务器响应超时。请稍后重试；本次请求编号已保留，不会因重复点击重复扣费。");
      if(error)throw error;const result=Array.isArray(data)?data[0]:data;
      if(!result?.cards||result.cards.length!==packCount*5)throw new Error("服务器没有返回完整抽卡结果；请重试，系统会沿用同一请求编号避免重复扣费。");
      // The RPC confirms the transaction. Keep the lobby mounted under the reveal
      // screen so returning is instant and the selected pack remains selected.
      clearDrawRequestId(pool.pack_id,packCount);
      if(packCount===10)showTenPackOpening(pool,result);
      else showSinglePackOpening(pool,result);
      return result;
    }catch(error){loading.textContent="抽卡失败："+error.message;loading.style.color="#ff9b9b";return null;}
    finally{drawBusy=false;}
  }
  function showSinglePackOpening(pool,result,returnPage="draw"){
    const overlay=node("div");overlay.id="acg-ten-draw";
    const top=node("div","acg-td-top"),brand=node("div","acg-td-brand");brand.innerHTML='ACG <b>PACK OPENING</b>';
    const balance=node("div","acg-td-balance",(Number(result.charged_tokens??pool.price_tokens)===0?"树果卷 ×1 · 免费抽卡":"本次消耗 "+(result.charged_tokens??pool.price_tokens)+" 代币")+" · 剩余 "+result.remaining_tokens+" 代币");top.append(brand,balance);
    const close=node("button","acg-td-close",returnPage==="inventory"?"返回仓库":"返回卡包大厅");close.type="button";close.addEventListener("click",()=>overlay.remove());overlay.append(top,close);
    const main=node("div","acg-td-main"),title=node("div","acg-td-title");title.innerHTML='<small>MASTER DUEL INSPIRED · PACK OPENING</small><h2>'+pool.pack_name+'</h2><p>本次获得 · '+result.cards.length+' 张卡牌</p>';
    const stage=node("section","acg-td-stage"),head=node("div","acg-td-stagehead");head.append(node("b","","ONE PACK OPENING"),node("p","","点击卡牌逐张揭晓"));
    const grid=node("div","acg-td-cards");
    const rarity=card=>pool.draw_mode==="uniform"?"uniform":card.is_alt?"alt":Number(card.rarity||cardsById[card.card_id]?.star||3)>=5?"r5":Number(card.rarity||cardsById[card.card_id]?.star||3)>=4?"r4":"r3";
    result.cards.slice().sort((a,b)=>a.draw_index-b.draw_index).forEach((card,i)=>{
      const info=cardsById[card.card_id]||{name:card.card_id},grade=rarity(card),el=node("div","acg-td-card"+(grade==="r3"?"":" "+grade));
      const inner=node("div","acg-td-inner"),back=node("div","acg-td-face acg-td-back"),front=node("div","acg-td-face acg-td-front"),img=node("img");
      img.src=info.image||"";img.alt=info.name;img.loading="lazy";img.decoding="async";img.style.cursor="zoom-in";img.addEventListener("click",event=>{event.stopPropagation();showCardImagePreview(info);});const name=node("strong","",info.name);front.append(img,name);inner.append(back,front);
      const label=node("div","acg-td-cardname","未揭晓");el.append(inner,label);
      el.addEventListener("click",()=>{if(el.classList.contains("flip"))return;el.classList.add("flip");label.textContent=info.name;});grid.appendChild(el);
    });
    const summary=node("div","acg-td-summary","点击卡牌翻开"),actions=node("div","acg-td-actions");
    const all=node("button","acg-td-btn primary","全部揭晓"),backBtn=node("button","acg-td-btn","返回卡包大厅");
    all.type=backBtn.type="button";all.addEventListener("click",()=>[...grid.children].forEach((el,i)=>setTimeout(()=>{el.classList.add("flip");el.querySelector(".acg-td-cardname").textContent=result.cards.slice().sort((a,b)=>a.draw_index-b.draw_index)[i]&&cardsById[result.cards.slice().sort((a,b)=>a.draw_index-b.draw_index)[i].card_id]?.name||"";},i*90)));
    backBtn.textContent=returnPage==="inventory"?"返回仓库":"返回卡包大厅";backBtn.addEventListener("click",()=>overlay.remove());actions.append(all,backBtn);
    stage.append(head,grid,summary,actions);main.append(title,stage);overlay.append(main);document.body.appendChild(overlay);
  }
  window.acgShowItemPackOpening = (pool,result) => showSinglePackOpening({ ...pool, pack_name: pool.pack_name || pool.name || "奖励卡包", draw_mode: pool.draw_mode || (pool.category==="berry"?"uniform":"rarity"), price_tokens: 0 },result);
  async function loadDismantle() {
    const [{data:inventory,error:ie},{data:stats,error:se},{data:autoSettings,error:autoError}]=await Promise.all([
      client.from("card_inventory").select("card_id,quantity").eq("user_id",currentUser.id).gt("quantity",0).order("card_id"),
      client.from("player_stats").select("tokens").eq("user_id",currentUser.id).maybeSingle(),
      client.rpc("player_get_auto_dismantle_settings")
    ]);
    if(ie)throw ie;if(se)throw se;if(autoError)throw autoError;
    contentEl.replaceChildren(node("div","pc-stat","当前代币："+(stats?.tokens??0)),
      node("p","pc-muted","选择不需要的卡牌并填写分解数量。分解后卡牌会从收藏中扣除，代币立即到账。"),
      node("p","pc-muted","三星 10 · 四星 15 · 五星 20 · 异画 30 代币 / 张"));
    const autoPanel=node("section","pc-stat pc-auto-dismantle-panel"),autoTitle=node("strong","pc-auto-dismantle-title","自动分解设置"),autoHint=node("p","pc-muted","开启后，只处理勾选星级中同名卡超过 3 张的部分；开启保存时也会立即检查现有库存。未勾选星级和前 3 张不会被分解。");
    autoPanel.style.cssText="display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:12px!important;padding:18px 20px!important;margin:14px 0 20px!important;width:100%;box-sizing:border-box";
    const autoHeader=node("div","pc-auto-dismantle-header");
    autoHeader.style.cssText="display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;flex-wrap:wrap!important;width:100%";
    autoTitle.style.cssText="display:block!important;margin:0!important;font-size:20px!important;line-height:1.3!important";
    const autoToggle=node("input");autoToggle.type="checkbox";autoToggle.checked=Boolean(autoSettings?.enabled);autoToggle.id="pc-auto-dismantle-enabled";
    autoToggle.style.cssText="width:18px!important;min-width:18px!important;height:18px!important;margin:0!important;flex:0 0 18px!important";
    const toggleLabel=node("label","","启用自动分解");toggleLabel.htmlFor=autoToggle.id;toggleLabel.style.cssText="display:inline-flex!important;align-items:center!important;gap:8px!important;margin:0!important;font-weight:800!important;white-space:nowrap!important;cursor:pointer";
    toggleLabel.prepend(autoToggle);autoHeader.append(autoTitle,toggleLabel);
    autoHint.style.cssText="margin:0!important;line-height:1.65!important";
    const rarityOptions=node("div","pc-auto-dismantle-rarities");rarityOptions.style.cssText="display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:22px!important;flex-wrap:wrap!important;margin:2px 0!important";
    const rarityChecks=[3,4,5].map(star=>{const input=node("input");input.type="checkbox";input.value=String(star);input.checked=(autoSettings?.rarities||[3,4,5]).includes(star);input.id="pc-auto-dismantle-"+star;input.style.cssText="width:17px!important;min-width:17px!important;height:17px!important;margin:0!important";const label=node("label","",""+star+" 星");label.htmlFor=input.id;label.style.cssText="display:inline-flex!important;align-items:center!important;gap:7px!important;margin:0!important;white-space:nowrap!important;cursor:pointer;font-weight:700";label.prepend(input);rarityOptions.appendChild(label);return input;});
    const autoSave=node("button","primary","保存自动分解设置");autoSave.type="button";autoSave.style.cssText="align-self:flex-start!important;margin:2px 0 0!important;min-width:160px";
    const autoStatus=node("p","pc-muted","");autoStatus.style.cssText="margin:0!important;line-height:1.5!important";
    autoSave.addEventListener("click",async()=>{autoSave.disabled=true;autoStatus.textContent="正在保存设置并检查库存……";try{
      const selectedStars=rarityChecks.filter(input=>input.checked).map(input=>Number(input.value));
      const {data,error}=await client.rpc("player_set_auto_dismantle_settings",{p_enabled:autoToggle.checked,p_rarities:selectedStars});if(error)throw error;
      const processed=data?.processed||{};autoStatus.textContent=(autoToggle.checked?"自动分解已开启。":"自动分解已关闭。")+" 本次处理 "+(processed.dismantled_cards||0)+" 张，返还 "+(processed.reward_tokens||0)+" 代币。";
      await loadDismantle();
      setStatus((autoToggle.checked?"自动分解已开启。":"自动分解已关闭。")+" 本次处理 "+(processed.dismantled_cards||0)+" 张，返还 "+(processed.reward_tokens||0)+" 代币。",false);
    }catch(error){autoStatus.textContent="保存失败："+error.message;autoSave.disabled=false;}});
    autoPanel.append(autoHeader,autoHint,rarityOptions,autoSave,autoStatus);
    contentEl.appendChild(autoPanel);
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
      controls.append(input,node("span","pc-muted","分解数量"));meta.appendChild(controls);row.appendChild(meta);
      rows.push({id:item.card_id,input,quantity:item.quantity,reward,row});
    });
    if(!rows.length){contentEl.appendChild(node("div","pc-empty","当前没有可分解的卡牌。"));return;}
    const listContainer=node("div");contentEl.appendChild(listContainer);
    function renderDismantlePage(){
      listContainer.replaceChildren();
      const page=renderPcPagination(listContainer,"dismantle",rows.length,renderDismantlePage);
      rows.slice(page.start,page.end).forEach(item=>listContainer.appendChild(item.row));
      const pager=listContainer.querySelector(".pc-pagination");if(pager)listContainer.appendChild(pager);
    }
    renderDismantlePage();
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

  async function loadMySeasons() {
    const [{data:current,error:currentError},{data:history,error:historyError}]=await Promise.all([
      client.rpc("player_get_current_season"),
      client.rpc("player_list_my_seasons")
    ]);
    if(currentError)throw currentError;if(historyError)throw historyError;
    contentEl.replaceChildren();
    const season=current?.[0];
    if(season){
      const card=node("section","pc-stat");
      card.append(node("h3","","本月赛季 · "+season.season_key),
        node("p","pc-muted","赛季时间："+new Date(season.starts_at).toLocaleDateString("zh-CN")+" 至 "+new Date(season.ends_at).toLocaleDateString("zh-CN")),
        node("div","pc-row","场次："+season.games_played+"　胜场："+season.wins+"　败场："+season.losses),
        node("p","pc-muted",season.rank_name?"当前段位："+season.rank_name:"当前尚未达到段位门槛"));
      contentEl.appendChild(card);
    }
    contentEl.appendChild(node("h4","","历史赛季"));
    if(!history?.length){contentEl.appendChild(node("div","pc-empty","还没有月度赛季记录。"));return;}
    history.forEach(item=>{
      const row=node("article","pc-stat"),head=node("div","pc-row");
      head.append(node("strong","",item.season_key),node("span","pc-muted",item.season_status==="settled"?"已结算":"进行中"));
      row.append(head,node("p","","战绩："+item.wins+" 胜 / "+item.losses+" 败 · "+item.games_played+" 场"),
        node("p","pc-muted",item.rank_name?"段位："+item.rank_name:"未获得段位"));
      contentEl.appendChild(row);
    });
  }

  async function loadPage(page) {
    currentPage=page;
    if(page==="draw"&&!initialSessionResolved){
      drawSessionGatePending = true;
      renderDrawNotice("正在确认玩家登录状态……");
      try { await withTimeout(initialSessionReady,12000,"登录状态读取超时，请刷新页面后重试。"); }
      catch(error) { drawSessionGatePending=false; renderDrawNotice("无法确认登录状态："+error.message,true); return; }
      drawSessionGatePending = false;
      if(currentPage!=="draw")return;
    }
    view.querySelectorAll("[data-page]").forEach(button=>button.classList.toggle("active",button.dataset.page===page));
    contentEl.replaceChildren(node("p","pc-muted","正在读取……"));
    try {
      if(page==="draw"&&!currentUser){
        const message=node("div","pc-empty","抽卡功能需要先登录。请先登录当前 ACG 卡牌网站账号。");
        const login=node("button","primary","前往账号登录");login.type="button";login.addEventListener("click",()=>document.getElementById("tab-account")?.click());
        message.appendChild(login);contentEl.replaceChildren(message);setStatus("请先登录。",true);return;
      }
      if(page==="overview")await loadOverview();
      else if(page==="matches")await loadMatches();
      else if(page==="seasons")await loadMySeasons();
      else if(page==="tokens")await loadTokens();
      else if(page==="inventory")await loadInventory();
      else if(page==="draw")await withTimeout(loadDraw(),25000,"抽卡大厅初始化超时，请检查网络后重试。");
      else if(page==="dismantle")await loadDismantle();
      else if(page==="achievements")await loadAchievements();
      if(page!=="draw") await loadDisplayChoices();
      setStatus("玩家中心已连接。",false);
    } catch(error) {
      if(page==="draw") renderDrawNotice("抽卡系统连接失败："+error.message,true);
      else contentEl.replaceChildren(node("div","pc-empty","读取失败："+error.message));
      setStatus("部分数据暂时无法读取，请稍后重试。",true);
    }
  }
  view.querySelectorAll("[data-page]").forEach(button=>button.addEventListener("click",()=>loadPage(button.dataset.page)));

  let lastSessionUserId=null;
  async function onSession(session,event="INITIAL_SESSION") {
    markInitialSessionReady();
    currentUser=session?.user||null;
    const nextUserId=currentUser?.id||null;
    const userChanged=nextUserId!==lastSessionUserId;
    lastSessionUserId=nextUserId;
    if(!currentUser){
      closeDrawLobby();
      if(currentPage==="draw") renderDrawNotice("抽卡功能需要先登录当前 ACG 卡牌网站账号。",false);
      personalEl.classList.add("hidden");
      pcLayout.classList.add("hidden");
      loginHint.textContent="登录后可查看自己的对战记录、代币、收藏和成就。公开主页仍可供访客查询。";
      setStatus("尚未登录。公开主页可以正常查询。",false);
      return;
    }
    personalEl.classList.remove("hidden");
    pcLayout.classList.remove("hidden");
    loginHint.textContent="已登录。以下内容仅本人可查看。";
    view.querySelector("#pc-public-name").value=currentUser.user_metadata?.username||"";
    // Only a real sign-in / account switch initializes data. Token refreshes must not reopen the last page.
    if (userChanged && !drawSessionGatePending && (currentPage==="draw" || !view.classList.contains("hidden"))) await loadPage(currentPage);
    if (userChanged) await checkAdmin();
  }


  const adminPanel = view.querySelector("#pc-admin-panel");

  // Dedicated card-grant panel. It uses the existing admin-only inventory RPC,
  // so every grant is server-authorized and written to card_inventory_adjustments.
  function buildAdminCardGrantPanel(){
    if(view.querySelector("#pc-card-grant-panel"))return;
    const panel=node("section","panel");
    panel.id="pc-card-grant-panel";
    panel.style.marginTop="18px";
    panel.append(
      node("h4","","指定卡牌发放"),
      node("p","pc-muted","从完整卡牌资料目录中选择卡牌。此处不检查卡牌是否开放抽取，因此未进入任何卡池的限定卡、活动卡也可以直接发给玩家。每次发放都会记录管理员、数量和原因。")
    );
    const grid=node("div","pc-grid");
    const makeField=(labelText,control)=>{
      const wrap=node("div","field");
      wrap.append(node("label","",labelText),control);
      return wrap;
    };
    const player=node("select");player.id="pc-card-grant-player";
    player.add(new Option("请选择玩家",""));
    const category=node("select");category.id="pc-card-grant-category";
    [["all","全部卡牌"],["cards","普通卡牌"],["battle","对战道具"],["berries","树果"]]
      .forEach(([value,label])=>category.add(new Option(label,value)));
    const search=node("input");search.id="pc-card-grant-search";search.type="search";
    search.placeholder="按卡牌名称或编号搜索";
    const card=node("select");card.id="pc-card-grant-card";card.size=6;
    card.add(new Option("请先读取卡牌目录",""));
    const amount=node("input");amount.id="pc-card-grant-amount";amount.type="number";
    amount.min="1";amount.max="2147483647";amount.step="1";amount.value="1";
    const reason=node("input");reason.id="pc-card-grant-reason";reason.maxLength=120;
    reason.value="管理员指定卡牌发放";reason.placeholder="例如：活动限定卡奖励";
    grid.append(
      makeField("接收玩家",player),
      makeField("卡牌类别",category),
      makeField("搜索卡牌",search),
      makeField("选择卡牌（可滚动）",card),
      makeField("发放数量",amount),
      makeField("发放原因（写入管理记录）",reason)
    );
    panel.appendChild(grid);
    const actions=node("div","save-row");
    const submit=node("button","primary","确认发放卡牌");
    submit.type="button";submit.id="pc-card-grant-submit";
    const status=node("p","status","请选择玩家和卡牌。");
    status.id="pc-card-grant-status";
    actions.append(submit);
    panel.append(actions,status);
    const inventoryHost=view.querySelector("#pc-inventory-cards");
    if(inventoryHost)inventoryHost.insertAdjacentElement("afterend",panel);
    else adminPanel.appendChild(panel);
  }

  // Turn the long administrator form into clear button-based work areas.
  (function buildAdminCategoryNavigation(){
    if(!adminPanel || adminPanel.querySelector(".pc-admin-category-nav"))return;
    const groups=[
      {id:"players",label:"玩家与仓库"},
      {id:"matches",label:"比赛管理"},
      {id:"pools",label:"卡池管理"},
      {id:"tokens",label:"代币发放"},
      {id:"achievements",label:"成就管理"},
      {id:"items",label:"道具工坊"},
      {id:"mail",label:"邮件管理"}
    ];
    const panelTitle=adminPanel.querySelector("h3");
    const intro=adminPanel.querySelector("p");
    const nav=node("div","pc-admin-category-nav");
    nav.setAttribute("role","tablist");
    nav.setAttribute("aria-label","管理员功能分类");
    const panes={};
    groups.forEach(group=>{
      const pane=node("section","pc-admin-category-pane");
      pane.dataset.adminCategory=group.id;
      panes[group.id]=pane;
    });
    let active="players";
    let current="players";
    const assign=(element)=>{
      if(element.nodeType===Node.ELEMENT_NODE && element.matches("h3,h4")){
        const heading=element.textContent.trim();
        if(heading.includes("比赛管理")||heading.includes("最近登记的比赛"))current="matches";
        else if(heading.includes("卡池设置"))current="pools";
        else if(heading.includes("代币发放")||heading.includes("代币余额修正"))current="tokens";
        else if(heading.includes("成就管理")||heading.includes("现有成就"))current="achievements";
        else if(heading.includes("玩家管理")||heading.includes("玩家收藏管理"))current="players";
      }
      panes[current].appendChild(element);
    };
    const original=[...adminPanel.childNodes].filter(x=>x!==panelTitle&&x!==intro);
    original.forEach(assign);
    adminPanel.replaceChildren();
    if(panelTitle)adminPanel.appendChild(panelTitle);
    if(intro)adminPanel.appendChild(intro);
    groups.forEach((group,index)=>{
      const button=node("button",index===0?"active":"",group.label);
      button.type="button";button.dataset.adminCategory=group.id;
      button.setAttribute("role","tab");button.setAttribute("aria-selected",String(index===0));
      button.addEventListener("click",()=>{
        active=group.id;
        nav.querySelectorAll("button").forEach(b=>{
          const selected=b.dataset.adminCategory===active;
          b.classList.toggle("active",selected);b.setAttribute("aria-selected",String(selected));
        });
        groups.forEach(item=>panes[item.id].classList.toggle("hidden",item.id!==active));
      });
      nav.appendChild(button);
    });
    const paneHost=node("div","pc-admin-pane-host");
    paneHost.style.cssText="display:block!important;width:100%!important;max-width:none!important;min-width:0!important;grid-column:1/-1!important;box-sizing:border-box!important;";
    paneHost.append(...groups.map((group,index)=>{
      if(index!==0)panes[group.id].classList.add("hidden");
      return panes[group.id];
    }));
    adminPanel.style.setProperty("width","100%","important");
    adminPanel.append(nav,paneHost);
  })();
  const matchForm = view.querySelector("#pc-match-form");
  const matchStatus = view.querySelector("#pc-match-status");
  const matchList = view.querySelector("#pc-admin-match-list");
  const seasonAdminPane=adminPanel.querySelector('.pc-admin-category-pane[data-admin-category="matches"]');
  if(seasonAdminPane&&!seasonAdminPane.querySelector("#pc-season-admin")){
    const section=node("section","");
    section.id="pc-season-admin";
    section.style.cssText="margin-top:24px;padding:16px;border:1px solid var(--border-color,#9bb);border-radius:12px;";
    section.append(node("h3","","月度赛季管理"),node("p","pc-muted","段位按月胜场门槛判定；奖励会以邮件发送，玩家手动领取。赛季按北京时间自然月计算。"));
    const form=node("form","");form.id="pc-season-rank-form";
    const fields=[
      ["段位编号","pc-season-rank-code","text","例如 bronze"],
      ["段位名称","pc-season-rank-name","text","例如 青铜"],
      ["最低胜场","pc-season-rank-wins","number","0"],
      ["邮件标题","pc-season-mail-title","text","月度赛季奖励"],
    ];
    fields.forEach(([label,id,type,placeholder])=>{
      const wrap=node("div","field"),lab=node("label","",label),input=node("input");
      input.id=id;input.type=type;input.placeholder=placeholder;if(type==="number"){input.min="0";input.step="1";input.required=true;}
      if(id==="pc-season-rank-code"||id==="pc-season-rank-name")input.required=true;
      lab.htmlFor=id;wrap.append(lab,input);form.appendChild(wrap);
    });
    const bodyWrap=node("div","field"),bodyLabel=node("label","","邮件正文（可用 {player}、{rank}）"),body=node("textarea");
    body.id="pc-season-mail-body";body.rows=2;body.value="恭喜获得本月 {rank} 段位奖励！";bodyLabel.htmlFor=body.id;bodyWrap.append(bodyLabel,body);form.append(bodyWrap);
    const rewardWrap=node("div","field"),rewardLabel=node("label","","奖励附件 JSON"),reward=node("textarea");
    reward.id="pc-season-rewards";reward.rows=4;reward.value='[]';
    rewardLabel.htmlFor=reward.id;rewardWrap.append(rewardLabel,reward,node("p","pc-muted",'代币示例：{"reward_type":"tokens","reward_id":null,"amount":100}；卡牌/道具需填写对应 reward_id。'));form.append(rewardWrap);
    const enabledWrap=node("label","pc-row"),enabled=node("input");enabled.type="checkbox";enabled.checked=true;enabled.id="pc-season-enabled";enabledWrap.append(enabled,node("span","","启用该段位"));
    const save=node("button","primary","保存段位奖励");save.type="submit";form.append(enabledWrap,save);
    const status=node("p","status");status.id="pc-season-config-status";form.append(status);
    section.append(form,node("h4","","现有段位配置"));
    const configList=node("div","pc-muted");configList.id="pc-season-config-list";section.append(configList);
    section.append(node("h4","","赛季结算"));
    const seasonSelect=node("select");seasonSelect.id="pc-season-select";
    const refresh=node("button","","刷新赛季");refresh.type="button";
    const settle=node("button","primary","执行结算");settle.type="button";
    const settleStatus=node("p","status");settleStatus.id="pc-season-settle-status";
    const snapshots=node("div","pc-muted");snapshots.id="pc-season-snapshots";
    section.append(seasonSelect,refresh,settle,settleStatus,snapshots);
    seasonAdminPane.prepend(section);
    async function loadSeasonAdmin(){
      configList.textContent="正在读取段位配置……";seasonSelect.replaceChildren(new Option("选择赛季",""));
      try{
        const [{data:configs,error:ce},{data:seasons,error:se}]=await Promise.all([client.rpc("admin_list_season_rank_rewards"),client.rpc("admin_list_seasons")]);
        if(ce)throw ce;if(se)throw se;
        configList.replaceChildren();
        (configs||[]).forEach(item=>{
          const row=node("div","pc-row"),info=node("div","");
          info.append(node("strong","",item.rank_name+" · "+item.min_wins+" 胜起"),node("div","pc-muted","奖励："+JSON.stringify(item.reward_attachments)+" · "+(item.is_enabled?"启用":"停用")));
          const edit=node("button","","编辑");edit.type="button";edit.addEventListener("click",()=>{
            form.querySelector("#pc-season-rank-code").value=item.rank_code;
            form.querySelector("#pc-season-rank-name").value=item.rank_name;
            form.querySelector("#pc-season-rank-wins").value=item.min_wins;
            form.querySelector("#pc-season-mail-title").value=item.mail_title;
            form.querySelector("#pc-season-mail-body").value=item.mail_body;
            form.querySelector("#pc-season-rewards").value=JSON.stringify(item.reward_attachments,null,2);
            enabled.checked=item.is_enabled;
            form.scrollIntoView({behavior:"smooth",block:"center"});
          });row.append(info,edit);configList.appendChild(row);
        });
        (seasons||[]).forEach(item=>seasonSelect.add(new Option(item.season_key+" · "+(item.status==="settled"?"已结算":"进行中")+" · "+item.players_count+" 人",item.season_key)));
      }catch(error){configList.textContent="读取失败："+error.message;}
    }
    form.addEventListener("submit",async event=>{
      event.preventDefault();save.disabled=true;status.textContent="正在保存……";
      try{
        const attachments=JSON.parse(reward.value||"[]");
        const {error}=await client.rpc("admin_save_season_rank_reward",{
          p_rank_code:form.querySelector("#pc-season-rank-code").value.trim(),
          p_rank_name:form.querySelector("#pc-season-rank-name").value.trim(),
          p_min_wins:Number(form.querySelector("#pc-season-rank-wins").value),
          p_attachments:attachments,
          p_mail_title:form.querySelector("#pc-season-mail-title").value||"月度赛季奖励",
          p_mail_body:body.value,
          p_is_enabled:enabled.checked
        });
        if(error)throw error;status.textContent="保存成功。";await loadSeasonAdmin();
      }catch(error){status.textContent="保存失败："+error.message;}
      finally{save.disabled=false;}
    });
    refresh.addEventListener("click",loadSeasonAdmin);
    settle.addEventListener("click",async()=>{
      const key=seasonSelect.value;if(!key){settleStatus.textContent="请先选择赛季。";return;}
      if(!confirm("确定结算 "+key+" 吗？结算快照和奖励邮件将被保存，不能重复发放。"))return;
      settle.disabled=true;settleStatus.textContent="正在结算……";
      try{
        const {data,error}=await client.rpc("admin_settle_monthly_season",{p_season_key:key});
        if(error)throw error;settleStatus.textContent="结算结果："+JSON.stringify(data);
        await loadSeasonAdmin();await loadSeasonSnapshots();
      }catch(error){settleStatus.textContent="结算失败："+error.message;}
      finally{settle.disabled=false;}
    });
    async function loadSeasonSnapshots(){
      const key=seasonSelect.value;if(!key){snapshots.textContent="请选择赛季查看结算快照。";return;}
      const {data,error}=await client.rpc("admin_list_season_settlements",{p_season_key:key});
      if(error){snapshots.textContent="读取失败："+error.message;return;}
      snapshots.replaceChildren();
      (data||[]).forEach(item=>{
        const row=node("div","pc-row"),info=node("div","");
        info.append(node("strong","",item.player_number+" · "+item.username),node("div","pc-muted",item.wins+" 胜 / "+item.losses+" 败 · "+(item.rank_name||"无段位")));
        row.append(info);
        if(item.mail_id){const resend=node("button","","补发邮件");resend.type="button";resend.addEventListener("click",async()=>{
          if(!confirm("确定向 "+item.username+" 补发原赛季奖励邮件吗？"))return;
          resend.disabled=true;try{const {data,error}=await client.rpc("admin_resend_season_reward",{p_season_key:key,p_user_id:item.user_id});if(error)throw error;settleStatus.textContent="补发成功，新邮件编号："+data;}catch(error){settleStatus.textContent="补发失败："+error.message;}finally{resend.disabled=false;}
        });row.appendChild(resend);}
        snapshots.appendChild(row);
      });
      if(!data?.length)snapshots.textContent="该赛季尚无结算快照。";
    }
    seasonSelect.addEventListener("change",loadSeasonSnapshots);
    loadSeasonAdmin();
  }
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
  let adminCheckPromise = null;
  let adminCheckUserId = null;
  async function checkAdmin() {
    if (!currentUser) {
      adminPanel.classList.add("hidden");
      adminCheckUserId = null;
      return false;
    }
    const checkedUserId = currentUser.id;
    if (adminCheckPromise && adminCheckUserId === checkedUserId) return adminCheckPromise;
    // A new account may sign in while the previous account's permission query is still pending.
    // Do not let the old request block or overwrite the new account's result.
    adminPanel.classList.add("hidden");
    adminCheckUserId = checkedUserId;
    const task = (async () => {
      try {
        const {data,error}=await client.from("profiles").select("is_admin").eq("id",checkedUserId).maybeSingle();
        if(error)throw error;
        if(currentUser?.id!==checkedUserId)return false;
        if(!data?.is_admin){adminPanel.classList.add("hidden");return false;}
        adminPanel.classList.remove("hidden");
        const {data:players,error:playersError}=await client.from("profiles").select("id,username,player_number").order("username");
        if(playersError)throw playersError;
        if(currentUser?.id!==checkedUserId)return false;
        adminPlayers=players||[];
        fillPlayerSelects();
        await loadCardNames();
        initializeAdminCardGrant();
        initializeAdminInventoryFilters();
        fillInventoryAdminSelects();
        await loadAdminBindings();
        await loadAdminMatches();
        await loadAdminLegacyTotals();
        await loadAdminAchievements();
        await loadAdminPools();
        return currentUser?.id===checkedUserId;
      } catch(error) {
        if(currentUser?.id===checkedUserId) {
          adminPanel.classList.add("hidden");
          setStatus("管理员资料读取失败："+error.message,true);
        }
        return false;
      }
    })();
    adminCheckPromise = task;
    try { return await task; }
    finally {
      if (adminCheckPromise === task) {
        adminCheckPromise = null;
        adminCheckUserId = null;
      }
    }
  }
  let adminInventory = {};
  let inventoryBusy = new Set();
  let adminInventoryCategory="cards";
  const adminInventoryCategoryLabels={cards:"普通卡牌",battle:"对战道具",berries:"树果",important:"重要道具",consumables:"消耗品"};
  function isAdminBattleItem(card){
    const pack=packCatalog.find(item=>item.id===card?.pack_id);
    return pack?.category==="battle_item" || card?.category==="battle_item" || card?.type==="对战道具";
  }
  function getAdminInventoryCategory(card){
    if(card?.type==="树果" || packCatalog.find(item=>item.id===card?.pack_id)?.category==="berry")return "berries";
    if(isAdminBattleItem(card))return "battle";
    if(card?.id===TREE_FRUIT_TICKET.id)return "consumables";
    return "cards";
  }
  function fillInventoryAdminSelects(){
    const userSelect=view.querySelector("#pc-inventory-user");
    const previous=userSelect.value;
    userSelect.replaceChildren(new Option("请选择玩家",""));
    adminPlayers.forEach(player=>userSelect.add(new Option(player.username+(player.player_number?" · "+player.player_number:" · 未绑定"),player.id)));
    if(adminPlayers.some(player=>player.id===previous))userSelect.value=previous;
    view.querySelectorAll("[data-inventory-category]").forEach(button=>{
      button.addEventListener("click",()=>{
        if(button.disabled)return;
        adminInventoryCategory=button.dataset.inventoryCategory;
        view.querySelectorAll("[data-inventory-category]").forEach(item=>item.classList.toggle("active",item===button));
        pcListPages["admin-inventory"]=1;
        renderAdminInventory();
      });
    });
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
    const packFilter=view.querySelector("#pc-inventory-pack-filter")?.value||"";
    const starFilter=view.querySelector("#pc-inventory-star-filter")?.value||"";
    const typeFilter=view.querySelector("#pc-inventory-type-filter")?.value||"";
    const ownedFilter=view.querySelector("#pc-inventory-owned-filter")?.value||"all";
    const inventoryCatalog=adminInventoryCategory==="consumables"?[TREE_FRUIT_TICKET]:Object.values(cardsById);
    const cards=inventoryCatalog.filter(card=>{
      const quantity=adminInventory[card.id]||0;
      return getAdminInventoryCategory(card)===adminInventoryCategory&&
        (!query||card.name.toLowerCase().includes(query)||card.id.toLowerCase().includes(query))&&
        (!packFilter||card.pack_id===packFilter)&&
        (!starFilter||String(card.star||"")===starFilter)&&
        (!typeFilter||(card.type||"未分类")===typeFilter)&&
        (ownedFilter==="all"||(ownedFilter==="owned"&&quantity>0)||(ownedFilter==="unowned"&&quantity===0));
    }).sort(compareCardsByStar);
    const owned=Object.values(adminInventory).reduce((sum,value)=>sum+value,0);
    const kinds=Object.values(adminInventory).filter(value=>value>0).length;
    summary.textContent=adminInventoryCategoryLabels[adminInventoryCategory]+" · 玩家拥有 "+kinds+" 种物品，共 "+owned+" 件 · 当前类别目录 "+cards.length+" 项";
    list.replaceChildren();
    if(!cards.length){list.appendChild(node("div","pc-empty","没有符合筛选条件的卡牌。"));return;}
    const page=renderPcPagination(list,"admin-inventory",cards.length,()=>renderAdminInventory());
    cards.slice(page.start,page.end).forEach(card=>{
      const quantity=adminInventory[card.id]||0;
      const item=node("article","pc-inventory-card");
      let img;
      if(card.icon){img=node("div","pc-consumable-icon",card.icon);img.style.cssText="width:58px;height:82px;display:grid;place-items:center;flex:0 0 58px;border-radius:6px;background:#263d55;font-size:30px";}
      else{img=node("img");img.src=card.image||"";img.alt=card.name;img.loading="lazy";img.style.cursor="zoom-in";img.addEventListener("click",event=>{event.stopPropagation();showCardImagePreview(card);});img.onerror=()=>{img.style.visibility="hidden";};}
      const info=node("div","pc-card-info");
      info.append(node("strong","",card.name),node("small","",card.description||((card.star?card.star+" 星 · ":"")+(card.type||"")+" · "+card.id)));
      const controls=node("div","pc-quantity-controls");
      const minus=node("button","","−");minus.type="button";minus.title="扣除一张";minus.disabled=quantity<=0||inventoryBusy.has(card.id);
      const count=node("strong","",String(quantity));
      const plus=node("button","","+");plus.type="button";plus.title="增加一张";plus.disabled=inventoryBusy.has(card.id);
      minus.addEventListener("click",()=>adjustAdminInventory(card,-1));
      plus.addEventListener("click",()=>adjustAdminInventory(card,1));
      controls.append(minus,count,plus);info.appendChild(controls);item.append(img,info);list.appendChild(item);
    });
    const pager=list.querySelector(".pc-pagination");if(pager)list.appendChild(pager);
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

  function initializeAdminCardGrant(){
    const playerSelect=view.querySelector("#pc-card-grant-player");
    const categorySelect=view.querySelector("#pc-card-grant-category");
    const searchInput=view.querySelector("#pc-card-grant-search");
    const cardSelect=view.querySelector("#pc-card-grant-card");
    const submit=view.querySelector("#pc-card-grant-submit");
    const status=view.querySelector("#pc-card-grant-status");
    if(!playerSelect||!categorySelect||!searchInput||!cardSelect||!submit||!status)return;
    const previousPlayer=playerSelect.value;
    playerSelect.replaceChildren(new Option("请选择玩家",""));
    adminPlayers.forEach(player=>{
      playerSelect.add(new Option(
        player.username+(player.player_number?" · "+player.player_number:" · 未绑定"),
        player.id
      ));
    });
    if(adminPlayers.some(player=>player.id===previousPlayer))playerSelect.value=previousPlayer;

    function renderGrantCardOptions(){
      const previous=cardSelect.value;
      const query=searchInput.value.trim().toLocaleLowerCase();
      const category=categorySelect.value;
      const catalog=Object.values(cardsById)
        .filter(card=>card&&card.id&&card.name)
        .filter(card=>category==="all"||getAdminInventoryCategory(card)===category)
        .filter(card=>!query||String(card.name).toLocaleLowerCase().includes(query)||String(card.id).toLocaleLowerCase().includes(query))
        .sort(compareCardsByStar);
      cardSelect.replaceChildren(new Option(catalog.length?"请选择卡牌":"没有符合条件的卡牌",""));
      catalog.forEach(card=>{
        const pack=packCatalog.find(item=>item.id===card.pack_id);
        const label=card.name+" · "+card.id+(pack?" · "+pack.name:"");
        cardSelect.add(new Option(label,card.id));
      });
      if(catalog.some(card=>card.id===previous))cardSelect.value=previous;
      status.textContent="当前可发放 "+catalog.length+" 张卡牌资料；此目录不受卡池开放状态限制。";
      status.className="status";
    }
    searchInput.addEventListener("input",renderGrantCardOptions);
    categorySelect.addEventListener("change",renderGrantCardOptions);
    renderGrantCardOptions();

    submit.addEventListener("click",async()=>{
      const userId=playerSelect.value;
      const cardId=cardSelect.value;
      const amount=Number(view.querySelector("#pc-card-grant-amount").value);
      const reason=view.querySelector("#pc-card-grant-reason").value.trim();
      const card=cardsById[cardId];
      const player=adminPlayers.find(item=>item.id===userId);
      if(!userId||!player||!cardId||!card){
        status.textContent="请选择接收玩家和有效的卡牌。";status.className="status bad";return;
      }
      if(!Number.isSafeInteger(amount)||amount<1||amount>2147483647){
        status.textContent="发放数量必须是 1 至 2,147,483,647 的整数。";status.className="status bad";return;
      }
      if(!reason||reason.length>120){
        status.textContent="请填写发放原因，最多 120 个字符。";status.className="status bad";return;
      }
      if(!confirm("确认向「"+player.username+"」发放「"+card.name+"」× "+amount+"？\n原因："+reason)){
        return;
      }
      submit.disabled=true;
      status.textContent="正在发放并写入管理记录……";status.className="status";
      try{
        const {data,error}=await client.rpc("admin_adjust_card_inventory",{
          p_user_id:userId,p_card_id:cardId,p_delta:amount,p_reason:reason
        });
        if(error)throw error;
        const next=Number(data);
        if(!Number.isSafeInteger(next)||next<amount){
          throw new Error("服务器返回的库存数量异常，请重新读取玩家库存确认。");
        }
        status.textContent="发放成功：已向「"+player.username+"」发放「"+card.name+"」× "+amount+"；该玩家当前拥有 × "+next+"。";
        status.className="status good";
        if(view.querySelector("#pc-inventory-user").value===userId)await loadAdminInventory();
      }catch(error){
        status.textContent="发放失败："+error.message;status.className="status bad";
      }finally{
        submit.disabled=false;
      }
    });
  }

  function initializeAdminInventoryFilters(){
    const packSelect=view.querySelector("#pc-inventory-pack-filter");
    const starSelect=view.querySelector("#pc-inventory-star-filter");
    const typeSelect=view.querySelector("#pc-inventory-type-filter");
    if(!packSelect||!starSelect||!typeSelect)return;
    packSelect.replaceChildren(new Option("全部卡包",""));
    packCatalog.forEach(pack=>packSelect.add(new Option(pack.name,pack.id)));
    starSelect.replaceChildren(new Option("全部星级",""));
    [...new Set(Object.values(cardsById).map(card=>Number(card.star||0)).filter(Boolean))].sort((a,b)=>b-a).forEach(star=>starSelect.add(new Option(star+" 星",String(star))));
    typeSelect.replaceChildren(new Option("全部类型",""));
    [...new Set(Object.values(cardsById).map(card=>card.type||"未分类"))].sort((a,b)=>a.localeCompare(b,"zh-CN")).forEach(type=>typeSelect.add(new Option(type,type)));
  }
  initializeAdminInventoryFilters();
  view.querySelector("#pc-inventory-user").addEventListener("change",loadAdminInventory);
  view.querySelector("#pc-inventory-search").addEventListener("input",()=>{pcListPages["admin-inventory"]=1;renderAdminInventory();});
  ["#pc-inventory-pack-filter","#pc-inventory-star-filter","#pc-inventory-type-filter","#pc-inventory-owned-filter"].forEach(selector=>{
    view.querySelector(selector)?.addEventListener("change",()=>{pcListPages["admin-inventory"]=1;renderAdminInventory();});
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
      const identity=node("div","pc-bind-identity");
      identity.append(node("strong","",row.player_number),node("span","pc-muted",account?("已绑定："+account.username):"尚未绑定"));
      const editWrap=node("div","pc-bind-edit");
      const nameInput=node("input");nameInput.type="text";nameInput.maxLength=40;nameInput.value=row.display_name||"";nameInput.placeholder="输入公开中文 ID";
      const save=node("button","","保存 ID");save.type="button";
      save.addEventListener("click",async()=>{
        const nextName=nameInput.value.trim();
        if(!nextName){status.textContent="中文 ID 不能为空。";status.className="status bad";return;}
        if(nextName.length>40){status.textContent="中文 ID 最多 40 个字符。";status.className="status bad";return;}
        save.disabled=true;
        try{
          const {error}=await client.rpc("admin_update_player_public_id",{p_player_number:row.player_number,p_public_id:nextName});
          if(error)throw error;
          status.textContent=row.player_number+" 的公开中文 ID 已更新为「"+nextName+"」。";status.className="status good";
          await loadAdminBindings();
        }catch(error){status.textContent="保存失败："+error.message;status.className="status bad";}
        finally{save.disabled=false;}
      });
      editWrap.append(nameInput,save);
      line.append(identity,editWrap);
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

  function parseLegacyRows(){
    const raw=view.querySelector("#pc-legacy-data").value.trim();
    const parsed=[];
    if(!raw)return {rows:[],errors:["请先粘贴历史战绩数据。"]};
    const lines=raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    const errors=[],seen=new Set();
    lines.forEach((line,index)=>{
      const cleanLine=line.replace(/^\uFEFF/,"");
      const parts=cleanLine.includes("\t")
        ? cleanLine.split("\t")
        : /[,，;；]/.test(cleanLine)
          ? cleanLine.split(/[,，;；]/)
          : cleanLine.split(/\s+/);
      const values=parts.map(value=>value.trim());
      if(index===0&&/玩家编号|编号|player_number/i.test(values[0]||""))return;
      if(values.length!==3){errors.push("第 "+(index+1)+" 行：需要三列（玩家编号、胜场、败场）。");return;}
      const player_number=values[0].toUpperCase(),wins=values[1],losses=values[2];
      if(!/^P\d{3}$/.test(player_number)){errors.push("第 "+(index+1)+" 行：玩家编号格式应为 P001。");return;}
      if(!/^\d{1,12}$/.test(wins)||!/^\d{1,12}$/.test(losses)){errors.push("第 "+(index+1)+" 行：胜场和败场必须是非负整数。");return;}
      if(seen.has(player_number)){errors.push("第 "+(index+1)+" 行：玩家编号 "+player_number+" 重复。");return;}
      seen.add(player_number);
      const player=adminPlayers.find(item=>item.player_number===player_number);
      if(!player){errors.push("第 "+(index+1)+" 行："+player_number+" 尚未绑定注册账号。");return;}
      parsed.push({player_number,wins:Number(wins),losses:Number(losses),username:player.username});
    });
    if(!parsed.length&&!errors.length)errors.push("没有识别到可导入的数据。");
    return {rows:parsed.map(({player_number,wins,losses})=>({player_number,wins,losses})),display:parsed,errors};
  }
  function renderLegacyPreview(){
    const result=parseLegacyRows(),host=view.querySelector("#pc-legacy-preview-list"),status=view.querySelector("#pc-legacy-status"),submit=view.querySelector("#pc-legacy-submit");
    host.replaceChildren();
    if(result.display?.length){
      const table=node("div","pc-row");
      table.append(node("strong","","玩家编号 · 玩家 · 胜场 · 败场"));
      host.appendChild(table);
      result.display.forEach(row=>host.appendChild(node("div","pc-row",row.player_number+" · "+row.username+" · "+row.wins+" 胜 · "+row.losses+" 败")));
    }
    status.textContent="识别到 "+result.rows.length+" 名玩家。"+(result.errors.length?"\n"+result.errors.join("\n"):"数据检查通过，可以导入。");
    status.className="status"+(result.errors.length?" bad":" good");
    submit.disabled=!result.rows.length||result.errors.length>0;
    return result;
  }
  async function loadAdminLegacyTotals(){
    const host=view.querySelector("#pc-legacy-list");
    host.replaceChildren(node("p","pc-muted","正在读取历史累计战绩……"));
    const {data,error}=await client.rpc("admin_list_legacy_match_totals");
    if(error)throw error;
    host.replaceChildren();
    const rows=data||[];
    if(!rows.length){host.appendChild(node("div","pc-empty","目前还没有导入历史累计战绩。"));return;}
    rows.filter(row=>Number(row.legacy_wins)>0||Number(row.legacy_losses)>0).forEach(row=>{
      host.appendChild(node("div","pc-row",row.player_number+" · "+row.username+" · "+row.legacy_wins+" 胜 · "+row.legacy_losses+" 败"));
    });
    if(!host.childElementCount)host.appendChild(node("div","pc-empty","目前还没有导入历史累计战绩。"));
  }
  view.querySelector("#pc-legacy-preview").addEventListener("click",renderLegacyPreview);
  view.querySelector("#pc-legacy-data").addEventListener("input",()=>{view.querySelector("#pc-legacy-submit").disabled=true;});
  view.querySelector("#pc-legacy-submit").addEventListener("click",async()=>{
    const result=renderLegacyPreview();
    if(!result.rows.length||result.errors.length)return;
    if(!confirm("确认导入 "+result.rows.length+" 名玩家的历史累计战绩？已存在的历史数据会被本次数据替换，不会与旧值相加。"))return;
    const button=view.querySelector("#pc-legacy-submit"),status=view.querySelector("#pc-legacy-status");
    button.disabled=true;status.textContent="正在安全导入并重新计算累计战绩……";status.className="status";
    try{
      const {data,error}=await client.rpc("admin_import_legacy_match_totals",{p_rows:result.rows});
      if(error)throw error;
      status.textContent="导入成功："+data+" 名玩家。累计胜负已重新计算；真实比赛记录没有被创建或修改。";
      status.className="status good";
      view.querySelector("#pc-legacy-data").value="";
      view.querySelector("#pc-legacy-preview-list").replaceChildren();
      await loadAdminLegacyTotals();
      await loadPage(currentPage);
    }catch(error){status.textContent="导入失败："+error.message;status.className="status bad";}
    finally{button.disabled=false;}
  });
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
  view.querySelector("#pc-sync-pack-catalog").addEventListener("click",async()=>{
    const status=view.querySelector("#pc-sync-pack-status");
    status.textContent="正在重新读取最新卡包和卡牌资料……";
    status.className="status";
    await loadCardNames();
    const packId=view.querySelector("#pc-pool-id").value;
    const button=view.querySelector("#pc-sync-pack-catalog");
    const pack=packCatalog.find(item=>item.id===packId);
    const cards=Object.values(cardsById).filter(card=>card.pack_id===packId);
    if(!packId||!pack||!cards.length){
      status.textContent="当前卡包没有可同步的卡牌，请先在卡牌资料中添加卡牌并保存。";
      status.className="status bad";return;
    }
    const isBerryPack=pack.category==="berry";
    const payload=cards.map(card=>({
      card_id:card.id,
      rarity:isBerryPack?1:Number(card.star),
      is_alt:isBerryPack?false:/（异画）|\(异画\)/.test(card.name||"")
    }));
    if(payload.some(card=>!card.card_id||(!isBerryPack&&(!Number.isInteger(card.rarity)||card.rarity<1||card.rarity>5)))){
      status.textContent="同步中止：卡牌编号或星级资料不完整，请先检查卡牌资料。";
      status.className="status bad";return;
    }
    button.disabled=true;
    status.textContent="正在同步「"+pack.name+"」的 "+payload.length+" 张卡牌……";
    status.className="status";
    try{
      const {data,error}=await client.rpc("admin_sync_draw_pack_catalog",{
        p_pack_id:packId,p_pack_name:pack.name,p_cards:payload,p_category:pack.category||"normal"
      });
      if(error)throw error;
      status.textContent="同步成功：「"+pack.name+"」已同步 "+(Number(data)||payload.length)+" 张卡牌。"+(isBerryPack?"树果将以 1 星存储并采用全卡等概率抽取。":"现在可以设置价格、概率并开放卡池。");
      status.className="status good";
      await loadAdminPools();
      view.querySelector("#pc-pool-id").value=packId;
      syncPoolModeControls(packId);
      fillPoolCoverOptions(packId);
      syncAltProbabilityControl(packId);
    }catch(error){
      status.textContent="同步失败："+error.message;
      status.className="status bad";
    }finally{button.disabled=false;}
  });
  view.querySelector("#pc-pool-id").addEventListener("change",async()=>{
    await loadCardNames();
    const packId=view.querySelector("#pc-pool-id").value;
    fillPoolCoverOptions(packId);
    syncAltProbabilityControl(packId);
    syncPoolModeControls(packId);
    const pack=packCatalog.find(item=>item.id===packId);
    const count=Object.values(cardsById).filter(card=>card.pack_id===packId).length;
    const status=view.querySelector("#pc-sync-pack-status");
    status.textContent=(pack?.name||packId)+"：读取到 "+count+" 张卡牌。可以同步到抽卡系统。";
    status.className=count?"status":"status bad";
  });
  view.querySelector("#pc-pool-cover").addEventListener("change",updatePoolCoverPreview);
  async function loadAdminPools(){
    const list=view.querySelector("#pc-admin-pool-list");
    list.replaceChildren(node("p","pc-muted","正在读取卡池状态……"));
    const {data,error}=await client.from("card_draw_pools")
      .select("pack_id,pack_name,price_tokens,rate_alt,rate_3,rate_4,rate_5,enabled,cover_card_id").order("pack_id");
    if(error)throw error;
    const packSelect=view.querySelector("#pc-pool-id");
    const availablePackIds=new Set(Object.values(cardsById).map(card=>card.pack_id).filter(Boolean));
    const poolRows=data||[];
    const knownPackIds=new Set([...packCatalog.map(pack=>pack.id),...availablePackIds,...poolRows.map(pool=>pool.pack_id)]);
    const packNames=new Map(packCatalog.map(pack=>[pack.id,pack.name]));
    packSelect.replaceChildren();
    [...knownPackIds].sort((a,b)=>a.localeCompare(b,"zh-CN", {numeric:true})).forEach(id=>{
      const row=poolRows.find(pool=>pool.pack_id===id);
      const name=packNames.get(id)||row?.pack_name||id;
      const hasCards=Object.values(cardsById).some(card=>card.pack_id===id);
      const option=new Option(name+(row?"":hasCards?"（尚未同步）":"（暂无卡牌）"),id);
      packSelect.add(option);
    });
    list.replaceChildren();
    if(!poolRows.length){list.appendChild(node("div","pc-empty","数据库中还没有卡池配置。请先同步卡包抽卡资料。"));return;}
    const selectedPool=poolRows.find(pool=>pool.pack_id===packSelect.value)||poolRows[0];
    packSelect.value=selectedPool.pack_id;
    fillPoolCoverOptions(selectedPool.pack_id,selectedPool.cover_card_id||"");
    syncAltProbabilityControl(selectedPool.pack_id);
    syncPoolModeControls(selectedPool.pack_id);
    data.forEach(pool=>{
      const row=node("div","pc-row"),info=node("div"),actions=node("div");
      const ready=pool.price_tokens!==null&&(pool.draw_mode==="uniform"||(pool.rate_alt!==null&&pool.rate_3!==null&&pool.rate_4!==null&&pool.rate_5!==null));
      const config=ready
        ? (pool.draw_mode==="uniform"?"每包 "+pool.price_tokens+" 代币 · 树果等概率":"每包 "+pool.price_tokens+" 代币 · 异画 "+pool.rate_alt+"% / 五星 "+pool.rate_5+"% / 四星 "+pool.rate_4+"% / 三星 "+pool.rate_3+"%")
        : "尚未设置价格和概率";
      info.append(node("strong","",pool.pack_name),node("div","pc-muted",config),
        node("div",pool.enabled?"pc-positive":"pc-muted",pool.enabled?"开放中":"未开放"));
      actions.style.display="flex";actions.style.alignItems="center";
      const edit=node("button","","载入设置");edit.type="button";
      edit.addEventListener("click",()=>{
        view.querySelector("#pc-pool-id").value=pool.pack_id;
        fillPoolCoverOptions(pool.pack_id,pool.cover_card_id||"");
        syncAltProbabilityControl(pool.pack_id);
        syncPoolModeControls(pool.pack_id);
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
    const selectedPack=packCatalog.find(item=>item.id===view.querySelector("#pc-pool-id").value);
    const isUniformPool=selectedPack?.category==="berry";
    const values={
      p_pack_id:view.querySelector("#pc-pool-id").value,
      p_price_tokens:Number(view.querySelector("#pc-pool-price").value),
      p_rate_alt:isUniformPool?0:Number(view.querySelector("#pc-pool-alt").value),
      p_rate_3:isUniformPool?100:Number(view.querySelector("#pc-pool-r3").value),
      p_rate_4:isUniformPool?0:Number(view.querySelector("#pc-pool-r4").value),
      p_rate_5:isUniformPool?0:Number(view.querySelector("#pc-pool-r5").value)
    };
    if(!Number.isSafeInteger(values.p_price_tokens)||values.p_price_tokens<=0||
       (!isUniformPool&&([values.p_rate_alt,values.p_rate_3,values.p_rate_4,values.p_rate_5].some(x=>!Number.isFinite(x)||x<0||x>100||Math.round(x*100)!==x*100)||
       Math.round((values.p_rate_alt+values.p_rate_3+values.p_rate_4+values.p_rate_5)*100)!==10000))){
      status.textContent=isUniformPool?"每包价格必须为正整数。":"每包价格必须为正整数；异画、五星、四星、三星概率须为 0–100 的数字（最多两位小数），总和必须为 100%。";status.className="status bad";return;
    }
    button.disabled=true;status.textContent="正在保存卡池……";status.className="status";
    try{
      const {error}=await client.rpc("admin_set_draw_pool_v2",values);
      if(error)throw error;
      const {error:coverError}=await client.rpc("admin_set_draw_pool_cover",{p_pack_id:values.p_pack_id,p_cover_card_id:view.querySelector("#pc-pool-cover").value||null});
      if(coverError)throw new Error("价格和概率已保存，但封面保存失败："+coverError.message+"。请确认已执行卡包封面 SQL。");
      status.textContent=isUniformPool?"树果卡池已开放：每张树果等概率抽取。":"卡池设置与封面均已保存，玩家现在可以抽取。";status.className="status good";
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
  // Keep Supabase Auth callbacks synchronous; load player data after the callback exits.
  client.auth.onAuthStateChange((event,session)=>{
    setTimeout(()=>{ void onSession(session,event); },0);
  });
  client.auth.getSession().then(({data,error})=>{
    if(error){setStatus("无法读取登录状态："+error.message,true);markInitialSessionReady();return;}
    void onSession(data?.session||null,"INITIAL_SESSION");
  });
})();