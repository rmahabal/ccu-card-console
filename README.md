# UOS Knowledge Graph Console — Visa demo

Layer-aware console for the v1.3 CCU card knowledge graph (the Visa-issuing demo KG). Completely separate from the two existing hosted repos (`uos-kg-console`, `kg-demo`) — built fresh here, shares no files or git history with them.

## Files

- **`ccu-card-console.html`** — the **hostable demo page**. The CCU v1.3 graph (492 nodes, 845 edges) is baked in; opens already rendered. Single self-contained file — drop it on any static host (Netlify / Cloudflare Pages / GitHub Pages) or just double-click locally. This is the Monday-demo artifact.
- **`uos-console.html`** — the **generic uploader**. Drop *any* UOS instance JSON → renders the live console. Self-contained (engine + template embedded). The "Load sample" button reads `kg/ccu_v1.3.json` if hosted alongside; "Choose file" works standalone.
- `kg/ccu_v1.3.json` — the v1.3 instance.
- `src/` — the build sources: `engine_v2.js` (layer-aware engine), `console_template.html` (patched template), `bake.js` (Node baker).

## What changed from the base console (v1.2 → v1.3)

The base engine hardcoded the 16 object types and would silently drop v1.3's new **service layer** (8 categories: VoiceProfile, ServiceStandard, ServicePolicy, Workflow, IntentTaxonomy, KnowledgeArticle, EscalationPath, Entitlement). The new engine is **layer-driven** — it reads the instance's `layers` block, so:

- Graph composition shows 5 kind-groups (Catalog · Compliance · **Service & runtime** · Member spine · Provenance), with the service layer styled in its own violet/cyan accent.
- The 8 new node kinds get colors, legend entries, and filter chips in Graph Explorer.
- Counts, KPIs, readiness, and the "24 objects · 5 kinds" label all reflect the full graph; the service categories fold into the Service & Support readiness group.
- New edge types render generically; the `demo_packs` (business-card pack) provenance is preserved.
- Future category additions surface automatically (no code change) because everything is driven from `layers`.
- Uptiq wordmark in the top-left.

## Rebuild

```
cd console
node src/bake.js kg/ccu_v1.3.json ccu-card-console.html   # rebuild baked page
```
The uploader re-embeds `src/console_template.html` + `src/engine_v2.js`; regenerate it with the small Python snippet used at build time if those change.

## Reusability

`engine_v2.js` is reusable BKG IP — it renders any UOS instance, not just CCU/Visa. When stable, lift it into the BKG project (`04 Banking Knowledge Graph`) as the canonical console-v2.
