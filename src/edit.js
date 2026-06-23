/* edit-confirm — appended module: adds an "Edit" action to each Sign-off Queue
   row that opens a fill-in editor. Saving records the institution-confirmed
   value, clears NEEDS_FI, sets confidence to 1.00, counts toward FI-attested
   (via window.__ratify), and persists to localStorage for the session. Reads/
   writes window.__KG so the change flows into the examiner package. Self-
   contained and reversible: delete this <script> to revert (stored edits in
   localStorage key 'ccu-fc-edits' can be cleared from the console). */
(function(){
  var LS='ccu-fc-edits';
  function E(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function load(){try{return JSON.parse(localStorage.getItem(LS)||'{}');}catch(e){return {};}}
  function save(o){try{localStorage.setItem(LS,JSON.stringify(o));}catch(e){}}
  function today(){var d=new Date();function p(n){return n<10?'0'+n:n;}return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
  function toast(m,k){ if(window.__ctawToast){window.__ctawToast(m,k);return;} var t=document.createElement('div'); t.className='efc-toast'+(k?(' '+k):''); t.innerHTML=m; document.body.appendChild(t); setTimeout(function(){t.classList.add('in');},10); setTimeout(function(){t.remove();},3400); }
  function nodes(){return (window.__KG&&window.__KG.nodes)||{};}

  function modal(title,bodyHTML){
    var ov=document.createElement('div'); ov.className='efc-ov';
    ov.innerHTML='<div class="efc-panel"><div class="efc-h"><span>'+E(title)+'</span><button class="efc-x">×</button></div><div class="efc-b">'+bodyHTML+'</div></div>';
    document.body.appendChild(ov);
    function close(){ov.classList.remove('in'); setTimeout(function(){ov.remove();},180);}
    ov.querySelector('.efc-x').addEventListener('click',close);
    ov.addEventListener('click',function(e){if(e.target===ov)close();});
    ov._close=close; setTimeout(function(){ov.classList.add('in');},10);
    return ov;
  }

  function confirmFact(id,val){
    var n=nodes()[id]; if(!n)return false;
    var first=!n._fc;
    n.name=val; n.nf=false; n.st='institution-confirmed'; n.conf=1; n._fc=1; n.owner=n.owner||'Institution'; n.eff=n.eff||today();
    var ed=load(); ed[id]={value:val,ts:Date.now()}; save(ed);
    if(first && window.__ratify) window.__ratify(1);
    markRows(id,val);
    return first;
  }

  function markRows(id,val){
    var lins=document.querySelectorAll('.rl-lin[data-id="'+id+'"]');
    lins.forEach(function(l){
      var item=l.closest('.rl-item'); if(!item)return;
      var nm=item.querySelector('.rl-in'); if(nm){nm.textContent=val;}
      item.classList.add('efc-confirmed');
      var ef=item.querySelector('.efc-edit'); if(ef){ef.textContent='✓ Confirmed'; ef.classList.add('done');}
    });
  }

  function openEditor(id){
    var n=nodes()[id]; if(!n){toast('Fact not found in graph');return;}
    var cur=n.name||'';
    var body='<div class="efc-meta">'
      +'<div><span class="efc-k">Fact ID</span><b class="efc-mono">'+E(id)+'</b></div>'
      +'<div><span class="efc-k">Kind</span>'+E(n.kl||n.k||'—')+'</div>'
      +'<div><span class="efc-k">Owner</span>'+E(n.owner||'—')+'</div>'
      +'<div><span class="efc-k">Source</span>'+E(n.srcn||n.src||'—')+'</div>'
      +'<div><span class="efc-k">Confidence</span>'+(n.conf!=null?(+n.conf).toFixed(2):'—')+(n.nf?' &nbsp;<b class="efc-nf">NEEDS_FI</b>':'')+'</div>'
      +'</div>'
      +'<label class="efc-lab">Institution-confirmed value</label>'
      +'<textarea id="efc-val" class="efc-val" rows="3">'+E(cur)+'</textarea>'
      +'<div class="efc-note">Saving records the confirmed value, clears the NEEDS_FI flag, sets confidence to 1.00, and counts toward FI-attested. Stored locally for this demo session — it also appears in the examiner package.</div>'
      +'<button id="efc-save" class="efc-go">Save &amp; confirm</button>';
    var ov=modal('Edit & confirm',body);
    ov.querySelector('#efc-save').addEventListener('click',function(){
      var v=(ov.querySelector('#efc-val').value||'').replace(/\s+/g,' ').trim()||cur;
      confirmFact(id,v); ov._close();
      toast('Confirmed: '+E(v.length>48?v.slice(0,48)+'…':v),'ok');
    });
  }

  function injectEdit(){
    var rows=document.querySelectorAll('.rl-item');
    for(var i=0;i<rows.length;i++){
      var r=rows[i]; if(r.querySelector('.efc-edit'))continue;
      var lin=r.querySelector('.rl-lin'); if(!lin)continue;
      var id=lin.getAttribute('data-id'); if(!id)continue;
      var n=nodes()[id];
      var btn=document.createElement('span'); btn.className='efc-edit'; btn.setAttribute('data-id',id);
      if(n&&n._fc){btn.textContent='✓ Confirmed'; btn.classList.add('done');} else {btn.textContent='Edit';}
      lin.parentNode.insertBefore(btn,lin);
    }
  }

  function applyStored(){
    var ed=load(); var ids=Object.keys(ed); if(!ids.length)return;
    var N=nodes(); var c=0;
    ids.forEach(function(id){var n=N[id]; if(n&&!n._fc){n.name=ed[id].value;n.nf=false;n.st='institution-confirmed';n.conf=1;n._fc=1;c++;}});
    if(c&&window.__ratify) window.__ratify(c);
  }

  // click delegation for the injected Edit buttons
  document.addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.efc-edit'); if(!b)return;
    if(b.classList.contains('done'))return;
    e.preventDefault(); e.stopPropagation(); openEditor(b.getAttribute('data-id'));
  },true);

  function init(){
    setTimeout(applyStored,500);              // after base render + ratify hook exist
    [300,900,1800].forEach(function(t){setTimeout(injectEdit,t);});
    var sv=document.getElementById('view-signoff');
    if(sv && window.MutationObserver){ new MutationObserver(function(){injectEdit();}).observe(sv,{childList:true,subtree:true}); }
  }

  var CSS=".efc-edit{display:inline-block;font:600 11px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:#0d9488;background:#f0fdfa;border:1px solid #99f6e4;border-radius:7px;padding:4px 9px;margin-right:6px;cursor:pointer}.efc-edit:hover{background:#ccfbf1}.efc-edit.done{color:#15803d;background:#dcfce7;border-color:#bbf7d0;cursor:default}.rl-item.efc-confirmed .rl-in{color:#15803d}"
   +".efc-ov{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:9990;opacity:0;transition:.18s;padding:24px}.efc-ov.in{opacity:1}"
   +".efc-panel{background:#fff;border-radius:14px;max-width:540px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937}"
   +".efc-h{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;border-bottom:1px solid #eef2f7;font-size:15px;font-weight:800;color:#0f172a}.efc-x{border:0;background:#f1f5f9;width:28px;height:28px;border-radius:8px;font-size:18px;cursor:pointer;color:#475569}.efc-x:hover{background:#e2e8f0}"
   +".efc-b{padding:18px 20px}.efc-meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:12px;color:#475569;background:#f8fafc;border:1px solid #eef2f7;border-radius:9px;padding:11px 13px;margin-bottom:14px}.efc-meta .efc-k{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;font-weight:700}.efc-mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#0f766e}.efc-nf{color:#b45309}"
   +".efc-lab{display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:5px}.efc-val{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:9px 11px;font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;resize:vertical}.efc-val:focus{outline:2px solid #5eead4;border-color:#0d9488}"
   +".efc-note{font-size:11px;color:#64748b;margin:10px 0 14px}.efc-go{background:#0d9488;color:#fff;border:0;padding:10px 18px;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer}.efc-go:hover{background:#0f766e}"
   +".efc-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);background:#0f172a;color:#fff;padding:11px 18px;border-radius:10px;font:600 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.25);z-index:9999;opacity:0;transition:.3s}.efc-toast.in{opacity:1;transform:translate(-50%,0)}.efc-toast.ok{border-left:4px solid #16a34a}";
  var st=document.createElement('style'); st.textContent=CSS; (document.head||document.documentElement).appendChild(st);

  if(document.readyState!=='loading')init(); else document.addEventListener('DOMContentLoaded',init);
})();
