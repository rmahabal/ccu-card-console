/* agentlayer — appended module: card-lifecycle agents (8 grounded), collapsed 51-library,
   Overview readiness summary, and the Agent-grounding tab (KG -> Agent Graph operating chain).
   Self-contained and reversible: remove this script + its CSS block to revert. */
(function(){
  var AGENTS=__AGENTS__;
  var CHAINS=__CHAINS__;
  var SC={ready:'#16a34a',partial:'#d97706',blocked:'#94a3b8'};
  var SLABEL={ready:'Ready',partial:'Partial',blocked:'Blocked'};
  var SNOTE={ready:'knowledge present · pending sign-off',partial:'partial — some knowledge missing',blocked:'blocked — load the pack'};
  function E(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  function agentCard(a){
    var dots=a.nodes.map(function(n){return '<span class="ev" title="'+E(n.id)+(n.nf?' · NEEDS_FI':'')+'">'+E(n.label)+(n.nf?' <i class="nf">NEEDS_FI</i>':'')+'</span>';}).join('');
    var ev=a.nodes.length?('<div class="ev-wrap"><div class="ev-h">Stands on</div>'+dots+'</div>')
                         :('<div class="ev-wrap"><div class="ev-h miss">Missing</div><span class="ev miss">'+E(a.why)+'</span></div>');
    var tag=a.tag?'<span class="uc-tag">'+E(a.tag)+'</span>':'';
    return '<div class="agent-card s-'+a.status+'">'
      +'<div class="ac-top"><span class="ac-name">'+E(a.name)+'</span>'+tag+'</div>'
      +'<div class="ac-status" style="color:'+SC[a.status]+'"><span class="ac-dot" style="background:'+SC[a.status]+'"></span>'+SLABEL[a.status]+'</div>'
      +'<div class="ac-note">'+SNOTE[a.status]+'</div>'+ev+'</div>';
  }

  // ---------- 1. GAPS PAGE: hero (8 cards) + collapsed 51 library ----------
  function buildGaps(){
    var v=document.getElementById('view-gaps'); if(!v||v.__done)return; v.__done=1;
    var ph=v.querySelector('.page-h');
    var r=AGENTS.filter(function(a){return a.status==='ready';}).length;
    var p=AGENTS.filter(function(a){return a.status==='partial';}).length;
    var b=AGENTS.filter(function(a){return a.status==='blocked';}).length;
    // move existing gaps content (the 51-agent library) into a collapsible wrapper
    var lib=document.createElement('div'); lib.id='lib-body'; lib.style.display='none';
    var kids=[]; var n=ph?ph.nextSibling:v.firstChild;
    while(n){var nx=n.nextSibling; if(n.nodeType===1)kids.push(n); n=nx;}
    kids.forEach(function(k){lib.appendChild(k);});
    var hero=document.createElement('div');
    hero.innerHTML=
      '<div class="agent-metric"><div><b>'+r+'</b> card-lifecycle agents grounded today '
        +'<span class="am-sub">· '+p+' partial · '+b+' one pack away</span></div>'
        +'<div class="am-lib">51 in the full UOS library</div></div>'
      +'<div class="agent-grid">'+AGENTS.map(agentCard).join('')+'</div>'
      +'<div class="lib-toggle" id="lib-toggle">▸ Full UOS agent library — 51 agents · load a reg pack to activate</div>';
    if(ph)ph.insertAdjacentElement('afterend',hero); else v.insertBefore(hero,v.firstChild);
    v.appendChild(lib);
    var tg=document.getElementById('lib-toggle');
    tg.addEventListener('click',function(){
      var open=lib.style.display==='none'; lib.style.display=open?'':'none';
      tg.textContent=(open?'▾':'▸')+' Full UOS agent library — 51 agents · load a reg pack to activate';
      // relabel blocked groups inside library once
      if(open&&!lib.__lbl){lib.__lbl=1;}
    });
  }

  // ---------- 2. OVERVIEW readiness summary -> card story ----------
  function buildOverviewSummary(){
    var box=null;
    document.querySelectorAll('#view-overview .card.sec, .view#view-overview .card.sec').forEach(function(c){
      var h=c.querySelector('.sec-h h3'); if(h&&/Agent readiness/i.test(h.textContent))box=c;});
    if(!box||box.__done)return; box.__done=1;
    var more=box.querySelector('.sec-h .more'); if(more)more.textContent='See all agents →';
    var r=AGENTS.filter(function(a){return a.status==='ready';}).length;
    var rows=AGENTS.map(function(a){return '<div class="ov-arow"><span class="ac-dot" style="background:'+SC[a.status]+'"></span>'
      +'<span class="ov-an">'+E(a.name)+'</span>'+(a.tag?'<span class="uc-tag sm">'+E(a.tag)+'</span>':'')
      +'<span class="ov-as" style="color:'+SC[a.status]+'">'+SLABEL[a.status]+'</span></div>';}).join('');
    // replace everything after sec-h
    var sh=box.querySelector('.sec-h'); var n=sh?sh.nextSibling:null;
    while(n){var nx=n.nextSibling; if(n.nodeType===1)box.removeChild(n); n=nx;}
    var wrap=document.createElement('div');
    wrap.innerHTML='<div class="joinbox" style="margin-bottom:10px"><b>'+r+' card-lifecycle agents grounded today</b> — readiness is the join of what each agent needs against what this graph holds. The full UOS library has 51 agents; the rest light up as their reg packs load.</div>'
      +'<div class="ov-agents">'+rows+'</div>'
      +'<div class="rlegend" style="margin-top:12px"><span><span class="sw" style="background:'+SC.ready+'"></span>Ready (pending sign-off)</span><span><span class="sw" style="background:'+SC.partial+'"></span>Partial</span><span><span class="sw" style="background:'+SC.blocked+'"></span>Blocked · pack not loaded</span></div>';
    box.appendChild(wrap);
  }

  // ---------- 3. EXPLORER: "Agent grounding" tab ----------
  function chainHTML(c){
    var steps=c.steps.map(function(s,i){
      var arrow=i<c.steps.length-1?'<div class="cg-arrow">↓</div>':'';
      return '<div class="cg-step'+(s.flag==='control'?' cg-control':'')+'">'
        +'<div class="cg-rel">'+E(s.rel)+'</div>'
        +'<div class="cg-node"><span class="cg-name">'+E(s.label)+'</span><span class="cg-id">'+E(s.node)+'</span></div>'
        +'<div class="cg-contrib">'+E(s.contributes)+'</div>'
        +(s.flag==='control'?'<div class="cg-flag">⛨ Control Framework — validated before it executes</div>':'')
        +'</div>'+arrow;
    }).join('');
    return '<div class="cg-chain">'+steps+'</div>';
  }
  function buildGroundingTab(){
    var tabsHost=document.getElementById('extabs'); var ex=document.getElementById('view-explorer');
    if(!tabsHost||!ex||document.getElementById('tp-agent'))return;
    var tab=document.createElement('div'); tab.className='tab'; tab.dataset.tab='agent'; tab.textContent='Agent grounding';
    tabsHost.appendChild(tab);
    var panel=document.createElement('div'); panel.className='tpanel'; panel.id='tp-agent';
    var picker=CHAINS.map(function(c,i){return '<div class="cg-pick'+(i===0?' on':'')+'" data-i="'+i+'">'+E(c.agent)+(c.tag?' · '+E(c.tag):'')+'</div>';}).join('');
    panel.innerHTML='<section class="card sec">'
      +'<div class="sec-h"><h3>Agent grounding</h3><span class="hint">how an agent stands on the graph — Knowledge Graph → Agent Graph</span></div>'
      +'<div class="cg-intro">The product graph says <b>what the institution offers</b>; the service layer says <b>how an agent operates</b> — its intent routing, workflow, policy, escalation, autonomy boundary and voice. Pick an agent to watch it ground:</div>'
      +'<div class="cg-picker" id="cg-picker">'+picker+'</div>'
      +'<div id="cg-host"></div>'
      +'<div class="note" style="margin-top:14px">Nothing here is invented: every step is a real node and edge. The <b>autonomy gate</b> is the Control Framework — past its threshold the agent stops and a human signs off.</div>'
      +'</section>';
    ex.querySelector('#tp-matrix').insertAdjacentElement('afterend',panel);
    function renderChain(i){document.getElementById('cg-host').innerHTML=chainHTML(CHAINS[i]);}
    renderChain(0);
    panel.querySelectorAll('.cg-pick').forEach(function(pk){pk.addEventListener('click',function(){
      panel.querySelectorAll('.cg-pick').forEach(function(x){x.classList.remove('on');});pk.classList.add('on');renderChain(+pk.dataset.i);});});
    // unified tab wiring (covers the new tab + keeps existing in sync)
    var all=tabsHost.querySelectorAll('.tab');
    all.forEach(function(t){t.addEventListener('click',function(){
      all.forEach(function(x){x.classList.remove('active');});t.classList.add('active');
      ex.querySelectorAll('.tpanel').forEach(function(p){p.classList.toggle('active',p.id==='tp-'+t.dataset.tab);});});});
  }

  function init(){try{buildGaps();}catch(e){} try{buildOverviewSummary();}catch(e){} try{buildGroundingTab();}catch(e){}}
  if(document.readyState!=='loading')init(); else document.addEventListener('DOMContentLoaded',init);
})();
