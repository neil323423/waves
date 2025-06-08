(async()=>{
  const storageKey = 'wv-verified';
  const last = localStorage.getItem(storageKey);
  if(last && Date.now() - last < 2592000000) return;

  const style = document.createElement('style');
  style.textContent = `
    :root{--bg:#000;--card:rgba(0,0,0,0.85);--accent:#fff;--radius:12px;--trans:.3s}
    #wv-overlay{position:fixed;inset:0!important;pointer-events:auto;user-select:none;background:var(--bg);display:flex;align-items:center;justify-content:center;font-family:system-ui;z-index:2147483647!important;opacity:1;transition:opacity .4s}
    #wv-card{background:var(--card);backdrop-filter:blur(12px);border-radius:var(--radius);padding:32px;width:320px;text-align:center;color:var(--accent)}
    #wv-progress{width:100%;height:6px;background:#333;border-radius:var(--radius);overflow:hidden;margin:16px 0}
    #wv-bar{width:0;height:100%;background:var(--accent);transition:width var(--trans)}
    #wv-info{font-size:.95rem;opacity:.8}
    #wv-complete{display:none;}
    #wv-complete.show{display:block;}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div'); overlay.id='wv-overlay';
  overlay.innerHTML = `
    <div id="wv-card">
      <h2><i class="fas fa-shield-alt"></i> Verifying Your Browser...</h2>
      <div id="wv-progress"><div id="wv-bar"></div></div>
      <div id="wv-info"></div>
    </div>
    <div id="wv-complete"><h2><i class="fas fa-check-circle"></i> Success!</h2><p>You May Continue.</p></div>
  `;
  document.body.appendChild(overlay);

  const info = document.getElementById('wv-info');
  const bar = document.getElementById('wv-bar');
  const tests = [
    {msg:'Automation',pass:!navigator.webdriver},
    {msg:'Headless',pass:!/headless|phantomjs|puppeteer|selenium/i.test(navigator.userAgent)},
    {msg:'Languages',pass:Array.isArray(navigator.languages) && navigator.languages.length>0},
    {msg:'Plugins',pass:navigator.plugins.length>0},
    {msg:'WebGL',pass:(()=>{try{const c=document.createElement('canvas');const g=c.getContext('webgl')||c.getContext('experimental-webgl');return!!g;}catch{return false;}})()}
  ];

  let failures = [];
  for(let i=0;i<tests.length;i++){
    const t=tests[i];
    info.textContent = `${t.msg}...`;
    if(!t.pass) failures.push(t.msg);
    bar.style.width = `${((i+1)/tests.length)*100}%`;
    await new Promise(r=>setTimeout(r,200));
  }

  if(failures.length===0){
    localStorage.setItem(storageKey, Date.now());
    document.getElementById('wv-card').style.display='none';
    const done = document.getElementById('wv-complete'); done.classList.add('show');
    setTimeout(()=>overlay.style.opacity='0',500);
    setTimeout(()=>overlay.remove(),800);
  } else {
    info.innerHTML = `Failed:<br>${failures.map(f=>`• ${f}`).join('<br>')}`;
    bar.style.background='red';
  }
})();