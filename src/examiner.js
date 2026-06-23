/* examiner — appended module: wires the "Export examiner package" button to
   generate a client-side examiner evidence bundle from the live knowledge graph
   + attestation state. Produces a printable HTML report (opens in a new tab,
   print-to-PDF) plus a structured JSON sidecar download. Reads everything from
   window.__KG (nodes/edges), the live attestation KPI, and window.EXAMINER_AGENTS
   / window.EXAMINER_CHAINS. Self-contained and reversible: delete this <script>
   to revert; nothing else depends on it. */
(function(){
  function E(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function pctOf(a,b){return b?Math.round(a/b*100):0;}
  function txt(id){try{var el=document.getElementById(id);return el?(el.textContent||''):'';}catch(e){return '';}}
  function domText(sel){try{var el=document.querySelector(sel);return el?(el.textContent||'').replace(/\s+/g,' ').trim():'';}catch(e){return '';}}
  function pad(n){return n<10?'0'+n:''+n;}
  function stamp(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function stampT(d){return stamp(d)+' '+pad(d.getHours())+':'+pad(d.getMinutes());}

  function gather(){
    var G=window.__KG||window.G||{nodes:{},edges:[]};
    var nodes=G.nodes||{}, edges=G.edges||[];
    var ids=Object.keys(nodes);
    var inst=nodes['INST:ccu']||nodes[ids.filter(function(k){return nodes[k].k==='inst';})[0]]||{name:'the institution'};
    var att=0, total=ids.length;
    var sub=txt('kpi-attested-sub').match(/(\d+)\s+of\s+(\d+)/);
    if(sub){att=+sub[1]; total=+sub[2]||ids.length;}
    var attPct=txt('kpi-attested').replace(/[^\d]/g,'')||String(pctOf(att,total));
    var gaps=ids.map(function(k){return nodes[k];}).filter(function(n){return n&&n.nf;});
    var byKind={}, kindOrder=[];
    ids.forEach(function(k){var n=nodes[k]; var kl=n.kl||n.k||'?'; if(!byKind[kl]){byKind[kl]=[];kindOrder.push(kl);} byKind[kl].push(n);});
    var seeds=edges.filter(function(e){return e&&e.length>=3&&e[2]==='seeds';});
    var packs={}, packOrder=[];
    seeds.forEach(function(e){
      var pk=String(e[0]).split(/[-:]/)[0];
      if(!packs[pk]){packs[pk]={obl:{},nodes:{},name:pk};packOrder.push(pk);}
      packs[pk].obl[e[0]]=1; packs[pk].nodes[e[1]]=1;
    });
    packOrder.sort();
    var conf={high:0,med:0,low:0,none:0};
    ids.forEach(function(k){var c=nodes[k].conf; if(c==null||c==='')conf.none++; else if(+c>=0.8)conf.high++; else if(+c>=0.5)conf.med++; else conf.low++;});
    var gapsByOwner={}, ownerOrder=[];
    gaps.forEach(function(n){var o=n.owner||'Unassigned'; if(!gapsByOwner[o]){gapsByOwner[o]=[];ownerOrder.push(o);} gapsByOwner[o].push(n);});
    ownerOrder.sort();
    var charter=domText('.fi-meta, .topbar .sub')||'';
    return {
      inst:inst, charter:charter, nodes:nodes, ids:ids,
      total:ids.length, edges:edges.length, seeds:seeds.length,
      att:att, attPct:attPct, gaps:gaps, byKind:byKind, kindOrder:kindOrder,
      packs:packs, packOrder:packOrder, conf:conf,
      gapsByOwner:gapsByOwner, ownerOrder:ownerOrder,
      agents:(window.EXAMINER_AGENTS||[]), chains:(window.EXAMINER_CHAINS||[]),
      version:domText('.graph-chip, .ver-chip')||'v1.3',
      generated:new Date()
    };
  }

  function confPill(c){
    if(c==null||c==='')return '<span class="pill none">no score</span>';
    var n=+c, cls=n>=0.8?'high':n>=0.5?'med':'low';
    return '<span class="pill '+cls+'">'+n.toFixed(2)+'</span>';
  }

  function card(v,l,s){return '<div class="kc"><div class="v">'+v+'</div><div class="l">'+E(l)+'</div><div class="s">'+E(s)+'</div></div>';}
  function cb(id,l){return '<label><input type="checkbox" checked onchange="document.getElementById(\''+id+'\').style.display=this.checked?\'\':\'none\'"> '+E(l)+'</label>';}

  function reportHTML(d){
    var instName=E(d.inst.name||'the institution');
    var gaps=d.gaps.length, total=d.total, attested=d.att, attPct=d.attPct;
    var oblCount=d.packOrder.reduce(function(a,pk){return a+Object.keys(d.packs[pk].obl).length;},0);
    var H=[];
    H.push('<!doctype html><html><head><meta charset="utf-8"><title>Examiner Package — '+instName+'</title>');
    H.push('<style>'+CSS+'</style></head><body>');
    H.push('<header class="cov">');
    H.push('<div class="brand">UOS Knowledge Graph · Examiner Evidence Package</div>');
    H.push('<h1>'+instName+'</h1>');
    if(d.charter) H.push('<div class="sub">'+E(d.charter)+'</div>');
    H.push('<div class="meta">Graph version '+E(d.version)+' &nbsp;·&nbsp; Generated '+stampT(d.generated)+' &nbsp;·&nbsp; <span class="conf-note">CONFIDENTIAL — prepared for supervisory review</span></div>');
    H.push('</header>');

    H.push('<div class="noprint ctrl"><span class="ct-lab">Include sections</span>'
      +cb('sec-summary','Summary')+cb('sec-coverage','Obligation coverage')+cb('sec-ledger','Provenance ledger')+cb('sec-remediation','Remediation register')
      +(d.agents.length?cb('sec-agents','Agent grounding'):'')+'</div>');

    H.push('<section id="sec-summary"><h2>1 · Executive summary</h2>');
    H.push('<div class="cards">');
    H.push(card(total,'Facts in graph','distinct governed objects'));
    H.push(card(d.edges,'Relationships','typed edges'));
    H.push(card(oblCount,'Regulatory obligations','across '+d.packOrder.length+' reg-packs'));
    H.push(card(attested+' <span class="u">/ '+total+'</span>','FI-attested','='+attPct+'% institution-confirmed'));
    H.push(card(gaps,'Open gaps (NEEDS_FI)','pending FI confirmation'));
    H.push('</div>');
    H.push('<p class="state">As of generation, <b>'+attested+'</b> of <b>'+total+'</b> facts carry an institution attestation ('+attPct+'%); <b>'+gaps+'</b> facts are flagged <b>NEEDS_FI</b> and must not be quoted by an agent until confirmed. The remainder are pre-built from public sources at the confidence shown in the provenance ledger (§3).</p>');
    H.push('<p class="state"><b>Bitemporal record.</b> Every fact tracks effective-time (when the rule took effect) separately from as-of-time (the graph version an agent read), so the question "which rule did the agent apply, and was it current at the time?" is always answerable from this package.</p>');
    H.push('<div class="confbar"><span class="seg high" style="flex:'+(d.conf.high||0.001)+'">High '+d.conf.high+'</span><span class="seg med" style="flex:'+(d.conf.med||0.001)+'">Med '+d.conf.med+'</span><span class="seg low" style="flex:'+(d.conf.low||0.001)+'">Low '+d.conf.low+'</span><span class="seg none" style="flex:'+(d.conf.none||0.001)+'">No score '+d.conf.none+'</span></div>');
    H.push('</section>');

    H.push('<section id="sec-coverage"><h2>2 · Regulatory obligation coverage</h2>');
    H.push('<p class="state">Each reg-pack contributes obligations that <i>seed</i> the facts an agent must honor. Coverage below maps obligations to the graph nodes they govern.</p>');
    H.push('<table><thead><tr><th>Reg-pack</th><th class="n">Obligations</th><th class="n">Facts seeded</th></tr></thead><tbody>');
    d.packOrder.forEach(function(pk){
      var p=d.packs[pk];
      H.push('<tr><td><b>'+E(pk)+'</b></td><td class="n">'+Object.keys(p.obl).length+'</td><td class="n">'+Object.keys(p.nodes).length+'</td></tr>');
    });
    H.push('<tr class="tot"><td>Total</td><td class="n">'+oblCount+'</td><td class="n">'+d.seeds+' links</td></tr>');
    H.push('</tbody></table></section>');

    H.push('<section id="sec-ledger"><h2>3 · Provenance ledger</h2>');
    H.push('<p class="state">Full inventory of governed facts with source, confidence, owner, effective date, and confirmation state. This is the auditable record of <i>where every fact came from</i>.</p>');
    d.kindOrder.forEach(function(kl){
      var arr=d.byKind[kl].slice().sort(function(a,b){return (a.id>b.id)?1:-1;});
      H.push('<h3>'+E(kl)+' <span class="ct">'+arr.length+'</span></h3>');
      H.push('<table class="led prov"><thead><tr><th>ID</th><th>Name</th><th>Owner</th><th>Source</th><th class="n">Conf</th><th>Effective</th><th>State</th></tr></thead><tbody>');
      arr.forEach(function(n){
        H.push('<tr'+(n.nf?' class="warn"':'')+'><td class="mono">'+E(n.id)+'</td><td>'+E(n.name||'')+(n.nf?' <span class="pill nf">NEEDS_FI</span>':'')+'</td><td>'+E(n.owner||'—')+'</td><td>'+E(n.srcn||n.src||'—')+'</td><td class="n">'+confPill(n.conf)+'</td><td>'+E(n.eff||'—')+'</td><td>'+E(n.st||'—')+'</td></tr>');
      });
      H.push('</tbody></table>');
    });
    H.push('</section>');

    H.push('<section id="sec-remediation"><h2>4 · Remediation register — '+gaps+' open gaps</h2>');
    H.push('<p class="state">Facts flagged NEEDS_FI, grouped by accountable owner. Each is a defined item the institution must confirm before its agents may rely on it.</p>');
    d.ownerOrder.forEach(function(o){
      var arr=d.gapsByOwner[o];
      H.push('<h3>'+E(o)+' <span class="ct">'+arr.length+'</span></h3><table class="led rem"><thead><tr><th>ID</th><th>Fact</th><th>Kind</th><th>Source seed</th></tr></thead><tbody>');
      arr.forEach(function(n){ H.push('<tr class="warn"><td class="mono">'+E(n.id)+'</td><td>'+E(n.name||'')+'</td><td>'+E(n.kl||n.k||'')+'</td><td>'+E(n.srcn||n.src||'—')+'</td></tr>'); });
      H.push('</tbody></table>');
    });
    H.push('</section>');

    if(d.agents.length){
      H.push('<section id="sec-agents"><h2>5 · Agent grounding evidence</h2>');
      H.push('<p class="state">Each deployed agent operates only on the governed facts listed below. An agent marked <b>blocked</b> is withheld until its required reg-pack is loaded; a fact marked NEEDS_FI is a confirmation dependency.</p>');
      var chainBy={}; d.chains.forEach(function(c){chainBy[c.agent]=c;});
      d.agents.forEach(function(a){
        H.push('<div class="agent s-'+a.status+'"><div class="ah"><b>'+E(a.name)+'</b><span class="st '+a.status+'">'+a.status+'</span></div>');
        if(a.nodes&&a.nodes.length){
          H.push('<div class="stands">Stands on: '+a.nodes.map(function(nd){return '<span class="ev'+(nd.nf?' nf':'')+'">'+E(nd.label||nd.id)+(nd.nf?' ⚠':'')+'</span>';}).join('')+'</div>');
        } else if(a.why){ H.push('<div class="stands miss">Missing: '+E(a.why)+'</div>'); }
        var ch=chainBy[a.name];
        if(ch&&ch.steps){
          H.push('<ol class="chain">');
          ch.steps.forEach(function(s){H.push('<li><span class="rel">'+E(s.rel)+'</span> → <b>'+E(s.label||s.node)+'</b><span class="contrib">'+E(s.contributes||'')+'</span></li>');});
          H.push('</ol>');
        }
        H.push('</div>');
      });
      H.push('</section>');
    }

    H.push('<footer><h2>Methodology &amp; attestation</h2>');
    H.push('<p class="state">This package was generated directly from the institution\'s knowledge graph ('+total+' facts, '+d.edges+' relationships) at '+stampT(d.generated)+'. Figures reflect the attestation state at time of export. Facts pre-built from public sources are labelled with their source and confidence; institution-confirmed facts carry an attestation. No figure in this package is hand-entered — all are read from the governed graph.</p>');
    H.push('<div class="sign"><div class="line">Prepared by (name / title)</div><div class="line">Date</div></div>');
    H.push('</footer>');
    H.push('<div class="noprint bar"><button onclick="window.print()">Print / Save as PDF</button></div>');
    H.push('</body></html>');
    return H.join('');
  }

  function buildJSON(d){
    return {
      institution:d.inst.name, charter:d.charter, graph_version:d.version,
      generated:d.generated.toISOString(),
      summary:{facts:d.total, relationships:d.edges, obligations:d.packOrder.reduce(function(a,pk){return a+Object.keys(d.packs[pk].obl).length;},0),
               reg_packs:d.packOrder.length, fi_attested:d.att, attested_pct:d.attPct, open_gaps:d.gaps.length, confidence:d.conf},
      obligation_coverage:d.packOrder.map(function(pk){return {pack:pk, obligations:Object.keys(d.packs[pk].obl).length, facts_seeded:Object.keys(d.packs[pk].nodes).length};}),
      provenance_ledger:d.ids.map(function(k){var n=d.nodes[k];return {id:n.id,name:n.name,kind:n.kl||n.k,owner:n.owner,source:n.srcn||n.src,confidence:n.conf,effective_from:n.eff,state:n.st,needs_fi:!!n.nf,url:n.url};}),
      remediation_register:d.gaps.map(function(n){return {id:n.id,fact:n.name,kind:n.kl||n.k,owner:n.owner||'Unassigned',source:n.srcn||n.src};}),
      agents:d.agents.map(function(a){return {name:a.name,status:a.status,stands_on:(a.nodes||[]).map(function(x){return {id:x.id,label:x.label,needs_fi:!!x.nf};}),missing:a.why||null};})
    };
  }
  function downloadJSON(d){
    try{
      var blob=new Blob([JSON.stringify(buildJSON(d),null,2)],{type:'application/json'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a'); a.href=url; a.download='examiner-package-ccu-'+stamp(d.generated)+'.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){URL.revokeObjectURL(url);},1500);
    }catch(e){}
  }

  function run(){
    var d=gather();
    var w=window.open('','_blank');
    if(!w){ alert('Please allow pop-ups to open the examiner package.'); return; }
    w.document.open(); w.document.write(reportHTML(d)); w.document.close();
    downloadJSON(d);
  }

  function wire(){
    var bs=document.querySelectorAll('button');
    for(var i=0;i<bs.length;i++){
      if(/Export examiner package/i.test(bs[i].textContent||'') && !bs[i].__exwired){
        bs[i].__exwired=1;
        bs[i].addEventListener('click',function(e){e.preventDefault(); run();});
      }
    }
  }

  var CSS="*{box-sizing:border-box}body{font:14px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;margin:0;background:#fff}"
   +"header.cov{padding:46px 54px 30px;border-bottom:3px solid #0d9488}.brand{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#0d9488;font-weight:800}"
   +"h1{font-size:30px;margin:8px 0 4px}.cov .sub{color:#475569;font-size:15px}.cov .meta{margin-top:12px;font-size:12px;color:#64748b}.conf-note{color:#b45309;font-weight:700}"
   +"section{padding:26px 54px;border-bottom:1px solid #eef2f7}h2{font-size:18px;margin:0 0 12px;color:#0f172a}h3{font-size:13px;margin:18px 0 6px;color:#334155}h3 .ct{color:#94a3b8;font-weight:600}"
   +".state{color:#475569;font-size:13px;max-width:60em}"
   +".cards{display:flex;gap:12px;flex-wrap:wrap;margin:6px 0 14px}.kc{flex:1;min-width:140px;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;background:#f8fafc}.kc .v{font-size:24px;font-weight:800;color:#0f172a}.kc .v .u{font-size:14px;color:#94a3b8;font-weight:600}.kc .l{font-size:12px;font-weight:700;margin-top:2px}.kc .s{font-size:11px;color:#64748b}"
   +".confbar{display:flex;height:26px;border-radius:6px;overflow:hidden;margin:10px 0;font-size:11px;font-weight:700;color:#fff}.confbar .seg{display:flex;align-items:center;justify-content:center;min-width:54px}.seg.high{background:#16a34a}.seg.med{background:#d97706}.seg.low{background:#dc2626}.seg.none{background:#94a3b8}"
   +"table{border-collapse:collapse;width:100%;font-size:12px;margin:4px 0 8px}th,td{text-align:left;padding:5px 8px;border-bottom:1px solid #eef2f7;vertical-align:top}th{background:#f1f5f9;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#475569}td.n,th.n{text-align:right}tr.tot td{font-weight:800;border-top:2px solid #cbd5e1}tr.warn td{background:#fffbeb}.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#0f766e}"
   +".led{table-layout:fixed}.led td{word-break:break-word;overflow-wrap:anywhere}"
   +".prov th:nth-child(1),.prov td:nth-child(1){width:16%}.prov th:nth-child(2),.prov td:nth-child(2){width:26%}.prov th:nth-child(3),.prov td:nth-child(3){width:11%}.prov th:nth-child(4),.prov td:nth-child(4){width:16%}.prov th:nth-child(5),.prov td:nth-child(5){width:7%}.prov th:nth-child(6),.prov td:nth-child(6){width:10%}.prov th:nth-child(7),.prov td:nth-child(7){width:14%}"
   +".rem th:nth-child(1),.rem td:nth-child(1){width:20%}.rem th:nth-child(2),.rem td:nth-child(2){width:42%}.rem th:nth-child(3),.rem td:nth-child(3){width:16%}.rem th:nth-child(4),.rem td:nth-child(4){width:22%}"
   +".ctrl{position:sticky;top:0;z-index:5;background:#0f172a;color:#fff;padding:10px 54px;font-size:12px;display:flex;flex-wrap:wrap;gap:16px;align-items:center}.ctrl .ct-lab{font-weight:800;letter-spacing:.05em;text-transform:uppercase;font-size:10px;color:#94a3b8}.ctrl label{display:flex;align-items:center;gap:5px;cursor:pointer}.ctrl input{accent-color:#0d9488;cursor:pointer}"
   +".pill{display:inline-block;font-size:10px;font-weight:800;padding:1px 6px;border-radius:8px;vertical-align:middle}.pill.high{background:#dcfce7;color:#15803d}.pill.med{background:#ffedd5;color:#b45309}.pill.low{background:#fee2e2;color:#b91c1c}.pill.none{background:#f1f5f9;color:#64748b}.pill.nf{background:#fef3c7;color:#92400e}.pill.ok{background:#ecfeff;color:#0e7490}"
   +".agent{border:1px solid #e2e8f0;border-left:4px solid #cbd5e1;border-radius:8px;padding:12px 14px;margin:10px 0}.agent.s-ready{border-left-color:#16a34a}.agent.s-partial{border-left-color:#d97706}.agent.s-blocked{border-left-color:#94a3b8}.ah{display:flex;align-items:center;gap:10px}.ah b{font-size:14px}.st{font-size:10px;font-weight:800;text-transform:uppercase;padding:1px 7px;border-radius:8px}.st.ready{background:#dcfce7;color:#15803d}.st.partial{background:#ffedd5;color:#b45309}.st.blocked{background:#e2e8f0;color:#475569}"
   +".stands{margin-top:8px;font-size:12px;color:#475569}.stands.miss{color:#b45309}.ev{display:inline-block;background:#f1f5f9;border-radius:6px;padding:2px 7px;margin:2px 4px 2px 0;font-size:11px}.ev.nf{background:#fef3c7;color:#92400e}"
   +".chain{margin:8px 0 0;padding-left:18px;font-size:12px;color:#475569}.chain li{margin:3px 0}.chain .rel{color:#0d9488;font-weight:700}.chain .contrib{display:block;color:#94a3b8;font-size:11px}"
   +"footer{padding:26px 54px 60px}.sign{display:flex;gap:40px;margin-top:24px}.sign .line{flex:1;border-top:1px solid #94a3b8;padding-top:6px;font-size:11px;color:#64748b}"
   +".bar{position:fixed;bottom:0;left:0;right:0;background:#0f172a;padding:10px;text-align:center}.bar button{background:#0d9488;color:#fff;border:0;padding:9px 20px;border-radius:8px;font-weight:700;cursor:pointer}"
   +"@media print{.noprint{display:none}section,footer{padding:18px 0}header.cov{padding:10px 0 16px}body{font-size:11px}table{font-size:10px}}";

  if(document.readyState!=='loading')wire(); else document.addEventListener('DOMContentLoaded',wire);
})();
