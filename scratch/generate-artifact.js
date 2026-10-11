// scratch/generate-artifact.js
const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../config/composio_1000_apps_catalog.json');
const artifactPath = 'C:/Users/subba/.gemini/antigravity/brain/bfb9c975-0c9f-4cc6-941e-731fe103d2b5/unin_phase2_1000_apps_master_catalog.md';

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const connectors = catalog.connectors;

// Group by category
const groups = {};
for (const app of connectors) {
  if (!groups[app.category]) groups[app.category] = [];
  groups[app.category].push(app);
}

let md = '# UNIN Phase 2 — 1,000+ Composio Enterprise App Connectors Master Catalog\n\n';
md += `> **Phase 2 Expansion**: Master registry of **${connectors.length} Enterprise App Connectors** ready for UNIN integration.\n`;
md += `> **Architecture**: Zero-Trust Hardware Encryption (DPAPI / AES-256-GCM) with Human-In-The-Loop Safety Gatekeeper.\n\n`;

md += '## 📑 Quick Category Index\n\n';
for (const [cat, items] of Object.entries(groups)) {
  const icon = items[0]?.icon || '📦';
  const anchor = 'category-' + cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  md += `- [${icon} **${cat}** (${items.length} apps)](#${anchor})\n`;
}

md += '\n---\n\n';

for (const [cat, items] of Object.entries(groups)) {
  const icon = items[0]?.icon || '📦';
  const anchor = 'category-' + cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  md += `## <a id="${anchor}"></a>${icon} ${cat} (${items.length} Apps)\n\n`;
  md += '| # | App Name | Identifier (Slug) | Auth Type | Description |\n';
  md += '| :---: | :--- | :--- | :---: | :--- |\n';

  items.forEach((item, idx) => {
    md += `| ${idx + 1} | **${item.name}** | \`${item.id}\` | \`${item.authType}\` | ${item.description} |\n`;
  });

  md += '\n';
}

fs.writeFileSync(artifactPath, md, 'utf8');
console.log('Artifact generated successfully at:', artifactPath, 'Size bytes:', fs.statSync(artifactPath).size);
