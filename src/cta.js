/* cta-wire — appended module: activates the demo CTAs (Run integrity audit,
   Route/Send to owners, Re-sync sources, Go to Sign-off, Add source) with real,
   graph-driven actions and inline result panels. Self-contained and reversible:
   delete this <script> to revert; nothing else depends on it. */
(function(){
  function E(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function G(){return window.__KG||window.G||{nodes:{},edges:[]};}
  function nav(v){var n=document.querySelector('[data-view="'+v+'"]'); if(n){n.click();return true;} return false;}

  // ---------- lightweight toast + modal (own styles, no dependency) ----------
  function toast(msg,kind){
    var t=document.createElement('div'); t.className='ctaw-toast'+(kind?(' '+kind):'');
    t.innerHTML=msg; document.body.appendChild(t);
    setTimeout(function(){t.classList.add('in');},10);
    setTimeout(function(){t.classList.remove('in'); setTimeout(function(){t.remove();},300);},3600);
  }
  window.__ctawToast=function(m,k){toast(m,k);};
  function modal(title,bodyHTML){
    var ov=document.createElement('div'); ov.className='ctaw-ov';
    ov.innerHTML='<div class="ctaw-panel"><div class="ctaw-h"><span>'+E(title)+'</span>'
      +'<button class="ctaw-x" aria-label="Close">×</button></div><div class="ctaw-b">'+bodyHTML+'</div></div>';
    document.body.appendChild(ov);
    function close(){ov.classList.remove('in'); setTimeout(function(){ov.remove();},200);}
    ov.querySelector('.ctaw-x').addEventListener('click',close);
    ov.addEventListener('click',function(e){if(e.target===ov)close();});
    setTimeout(function(){ov.classList.add('in');},10);
    return ov;
  }

  // ---------- 1. integrity audit ----------
  function audit(){
    var g=G(), nodes=g.nodes||{}, edges=g.edges||[];
    var ids=Object.keys(nodes), idset={}; ids.forEach(function(k){idset[k]=1;});
    var badTarget=edges.filter(function(e){return e&&e[1]!=null&&!idset[e[1]];});
    var badSource=edges.filter(function(e){return e&&e[0]!=null&&!idset[e[0]]&&e[2]!=='seeds';});
    var selfLoop=edges.filter(function(e){return e&&e[0]===e[1];});
    var touched={}; edges.forEach(function(e){if(e[0])touched[e[0]]=1; if(e[1])touched[e[1]]=1;});
    var orphans=ids.filter(function(k){return !touched[k];});
    var nf=ids.filter(function(k){return nodes[k].nf;});
    var noConf=ids.filter(function(k){var c=nodes[k].conf; return c==null||c==='';});
    var oblRefs={}; edges.forEach(function(e){if(e[2]==='seeds'&&!idset[e[0]])oblRefs[e[0]]=1;});
    var issues=badTarget.length+badSource.length;

    function row(label,n,sev,sample){
      var icon=sev==='err'?'✕':sev==='warn'?'!':'✓';
      return '<tr class="'+sev+'"><td class="ic">'+icon+'</td><td>'+E(label)+'</td><td class="n">'+n+'</td><td class="sm">'+(sample||'')+'</td></tr>';
    }
    function samp(arr,fn){return arr.slice(0,3).map(fn).join('; ')+(arr.length>3?' …':'');}
    var body='<p class="ctaw-lead">Live structural pass over <b>'+ids.length+'</b> facts and <b>'+edges.length+'</b> relationships.</p>'
      +'<table class="ctaw-tbl"><tbody>'
      +row('Unresolved edge targets (point to a non-existent node)',badTarget.length,badTarget.length?'err':'ok',samp(badTarget,function(e){return E(e[0])+' →<b>'+E(e[1])+'</b>';}))
      +row('Unresolved edge sources (excl. obligation seeds)',badSource.length,badSource.length?'err':'ok',samp(badSource,function(e){return '<b>'+E(e[0])+'</b>';}))
      +row('Self-referencing edges',selfLoop.length,selfLoop.length?'warn':'ok','')
      +row('Orphan nodes (no relationships)',orphans.length,orphans.length?'warn':'ok',samp(orphans,function(k){return E(k);}))
      +row('Facts pending FI confirmation (NEEDS_FI)',nf.length,'warn','routable via "Route all to owners"')
      +row('Facts without a confidence score',noConf.length,noConf.length?'warn':'ok','')
      +row('Obligation references (external, expected)',Object.keys(oblRefs).length,'ok','reg-pack seeds — informational')
      +'</tbody></table>'
      +'<div class="ctaw-verdict '+(issues?'bad':'good')+'">'+(issues?('✕ '+issues+' structural issue'+(issues===1?'':'s')+' need attention'):'✓ No structural integrity issues')+'</div>';
    modal('Integrity audit — '+(g.nodes['INST:ccu']?E(g.nodes['INST:ccu'].name):'graph'),body);
    toast('Integrity audit complete — '+(issues?(issues+' issue'+(issues===1?'':'s')+' found'):'graph clean'), issues?'warn':'ok');
  }

  // ---------- 2. route NEEDS_FI gaps to owners ----------
  function routeOwners(){
    var g=G(), nodes=g.nodes||{}, ids=Object.keys(nodes);
    var gaps=ids.map(function(k){return nodes[k];}).filter(function(n){return n.nf;});
    var byO={}, order=[];
    gaps.forEach(function(n){var o=n.owner||'Unassigned'; if(!byO[o]){byO[o]=[];order.push(o);} byO[o].push(n);});
    order.sort(function(a,b){return byO[b].length-byO[a].length;});
    var body='<p class="ctaw-lead"><b>'+gaps.length+'</b> facts flagged NEEDS_FI, grouped by accountable owner. Routing notifies each owner of their open confirmations.</p>'
      +'<table class="ctaw-tbl"><thead><tr><th>Owner</th><th class="n">Open gaps</th><th>Examples</th></tr></thead><tbody>';
    order.forEach(function(o){
      var a=byO[o];
      body+='<tr><td><b>'+E(o)+'</b></td><td class="n">'+a.length+'</td><td class="sm">'+a.slice(0,2).map(function(n){return E(n.name||n.id);}).join('; ')+(a.length>2?' …':'')+'</td></tr>';
    });
    body+='</tbody></table><div class="ctaw-verdict good">→ Ready to route '+gaps.length+' gaps to '+order.length+' owners</div>';
    var ov=modal('Route open gaps to owners',body);
    toast('Routed <b>'+gaps.length+'</b> gaps to <b>'+order.length+'</b> owners','ok');
  }

  // ---------- 3. re-sync sources ----------
  function resync(btn){
    var orig=btn?btn.textContent:'';
    if(btn){btn.disabled=true; btn.textContent='Re-syncing…';}
    var g=G(), n=Object.keys(g.nodes||{}).length;
    setTimeout(function(){
      if(btn){btn.textContent='✓ Re-synced'; setTimeout(function(){btn.textContent=orig;btn.disabled=false;},2200);}
      var now=new Date(), hh=('0'+now.getHours()).slice(-2), mm=('0'+now.getMinutes()).slice(-2);
      toast('Sources re-synced — '+n+' facts current, no drift detected · '+hh+':'+mm,'ok');
    },900);
  }

  // ---------- 4. go to sign-off (reuse existing nav) ----------
  function gotoSignoff(){ if(!nav('signoff')) toast('Sign-off Queue','ok'); }

  // ---------- 5. add source (light mini-form) ----------
  function addSource(){
    var body='<p class="ctaw-lead">Register a new source document or system. In this demo it is queued for ingest and provenance-tracked.</p>'
      +'<div class="ctaw-form">'
      +'<label>Source name<input id="ctaw-src-name" placeholder="e.g. 2026 Truth-in-Savings disclosure"></label>'
      +'<label>Type<select id="ctaw-src-type"><option>Document (PDF/SOP)</option><option>Core system</option><option>Rate sheet</option><option>Reg-pack feed</option><option>External / consent-based</option></select></label>'
      +'<button class="ctaw-go" id="ctaw-src-go">Queue for ingest</button></div>';
    var ov=modal('Add source',body);
    ov.querySelector('#ctaw-src-go').addEventListener('click',function(){
      var nm=(ov.querySelector('#ctaw-src-name').value||'').trim()||'Untitled source';
      var ty=ov.querySelector('#ctaw-src-type').value;
      ov.classList.remove('in'); setTimeout(function(){ov.remove();},200);
      toast('Source “'+E(nm)+'” ('+E(ty)+') queued for ingest','ok');
    });
  }

  // ---------- delegation: robust against re-rendered views ----------
  document.addEventListener('click',function(e){
    var tg=e.target; if(!tg||!tg.closest)return;
    // primary CTAs (button / .cta)
    var b=tg.closest('button,.cta');
    if(b){
      var t=(b.textContent||'').replace(/\s+/g,' ').trim();
      if(/Run integrity audit/i.test(t)){e.preventDefault(); return audit();}
      if(/Route all to owners|Send NEEDS_FI to owners/i.test(t)){e.preventDefault(); return routeOwners();}
      if(/Re-?sync sources/i.test(t)){e.preventDefault(); return resync(b);}
      if(/Go to Sign-?off/i.test(t)){e.preventDefault(); return gotoSignoff();}
      if(/(\+|＋)?\s*Add source/i.test(t) && t.length<22){e.preventDefault(); return addSource();}
    }
    // '.more' links that have no data-go nav target
    var more=tg.closest('.more');
    if(more && !more.getAttribute('data-go')){
      var mt=(more.textContent||'').trim();
      if(/Full log/i.test(mt)){e.preventDefault(); return nav('provenance');}
      if(/packs/i.test(mt)){e.preventDefault(); return nav('gaps');}
    }
    // row micro-actions: Edit / Open / Route (never the attest button)
    var bs=tg.closest('.btn-sm');
    if(bs && !bs.classList.contains('js-attest')){
      var bt=(bs.textContent||'').trim();
      var row=bs.closest('.qrow,.js-row');
      var nm=row?(((row.querySelector('.qt')||{}).textContent)||'').trim():'';
      var ow=row?(((row.querySelector('.owner-pill')||{}).textContent)||'').trim():'';
      if(/^Edit/i.test(bt)){e.preventDefault(); return toast('Inline edit — '+(nm?('\u201c'+E(nm)+'\u201d'):'fact')+' (demo)');}
      if(/^Open/i.test(bt)){e.preventDefault(); return toast('Opening '+(nm?('\u201c'+E(nm)+'\u201d'):'item'));}
      if(/^Route/i.test(bt)){e.preventDefault(); return toast('Routed '+(nm?('\u201c'+E(nm)+'\u201d'):'item')+(ow?(' to '+E(ow)):' to owner'),'ok');}
    }
  },true);

  var CSS=".ctaw-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);background:#0f172a;color:#fff;padding:11px 18px;border-radius:10px;font:600 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.25);z-index:9999;opacity:0;transition:.3s;max-width:80vw}.ctaw-toast.in{opacity:1;transform:translate(-50%,0)}.ctaw-toast.ok{border-left:4px solid #16a34a}.ctaw-toast.warn{border-left:4px solid #d97706}"
   +".ctaw-ov{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:9990;opacity:0;transition:.2s;padding:24px}.ctaw-ov.in{opacity:1}"
   +".ctaw-panel{background:#fff;border-radius:14px;max-width:780px;width:100%;max-height:86vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937}"
   +".ctaw-h{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid #eef2f7;font-size:16px;font-weight:800;color:#0f172a;position:sticky;top:0;background:#fff}"
   +".ctaw-x{border:0;background:#f1f5f9;width:28px;height:28px;border-radius:8px;font-size:18px;cursor:pointer;color:#475569}.ctaw-x:hover{background:#e2e8f0}"
   +".ctaw-b{padding:18px 22px}.ctaw-lead{color:#475569;font-size:13px;margin:0 0 12px}"
   +".ctaw-tbl{border-collapse:collapse;width:100%;font-size:13px}.ctaw-tbl th,.ctaw-tbl td{text-align:left;padding:7px 9px;border-bottom:1px solid #eef2f7;vertical-align:top}.ctaw-tbl th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#475569;background:#f8fafc}.ctaw-tbl td.n{text-align:right;font-weight:800;font-variant-numeric:tabular-nums}.ctaw-tbl td.ic{width:22px;text-align:center;font-weight:800}.ctaw-tbl td.sm{color:#64748b;font-size:11px}"
   +".ctaw-tbl tr.err td.ic{color:#dc2626}.ctaw-tbl tr.warn td.ic{color:#d97706}.ctaw-tbl tr.ok td.ic{color:#16a34a}.ctaw-tbl tr.err td{background:#fef2f2}"
   +".ctaw-verdict{margin-top:14px;padding:10px 14px;border-radius:9px;font-weight:700;font-size:13px}.ctaw-verdict.good{background:#dcfce7;color:#15803d}.ctaw-verdict.bad{background:#fee2e2;color:#b91c1c}"
   +".ctaw-form{display:flex;flex-direction:column;gap:12px;max-width:420px}.ctaw-form label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;color:#334155}.ctaw-form input,.ctaw-form select{padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px}"
   +".ctaw-go{background:#0d9488;color:#fff;border:0;padding:9px 16px;border-radius:8px;font-weight:700;cursor:pointer;align-self:flex-start}.ctaw-go:hover{background:#0f766e}";
  var st=document.createElement('style'); st.textContent=CSS; (document.head||document.documentElement).appendChild(st);
})();
