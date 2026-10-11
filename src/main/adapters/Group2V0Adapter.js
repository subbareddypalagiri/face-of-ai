// Group2V0Adapter.js — SOTA 2026 v0.dev (Vercel) Adapter for UNIN
// Manages:
// 1. Generation of v0 Project Rules (.v0/rules.md) with FAANG Shadcn/Tailwind tokens
// 2. Integration with Vercel CLI (npx v0 add <id>) for zero-loss code extraction
// 3. Automated component staging and live dev server mounting
'use strict';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class Group2V0Adapter {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(process.cwd(), 'output');
    this.v0WorkspaceDir = path.join(this.outputDir, 'v0-workspace');
    this.rulesFilePath = path.join(this.v0WorkspaceDir, '.v0', 'rules.md');
  }

  /**
   * Generates production-grade .v0/rules.md file for v0 project synchronization
   */
  generateProjectRules(customIntent = '') {
    if (!fs.existsSync(path.dirname(this.rulesFilePath))) {
      fs.mkdirSync(path.dirname(this.rulesFilePath), { recursive: true });
    }

    const rulesContent = `# v0 SOTA 2026 Engineering & Design Directives

## 1. Architectural Stack
- Framework: Next.js (App Router) + React 19 + TypeScript
- Styling: Tailwind CSS v4 with OKLCH Luxury Palettes
- Components: shadcn/ui primitives with Radix UI headless foundations
- Icons: Lucide React (stroke-width: 1.5px, smooth curves)
- Animations: Framer Motion (spring physics: stiffness 300, damping 30)

## 2. Luxury Aesthetic Tokens
- Background: \`bg-slate-950\` with subtle gradient overlays (\`from-slate-950 via-zinc-900 to-black\`)
- Cards & Surfaces: Frosted glassmorphism (\`backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl\`)
- Accent Highlights: Electric Emerald (\`#10b981\`) and Cyber Violet (\`#8b5cf6\`) with pulse glow
- Typography: Inter / Plus Jakarta Sans pairing with fluid \`clamp()\` scaling
- Layout: Asymmetrical Bento Grid with generous negative space (min gap-6)

## 3. Component Synthesis Rules
- Avoid monolithic 1,000-line single-file components. Break down into modular atoms (Header, Hero, FeatureCard, PricingMatrix, Footer).
- Implement interactive hover states (\`hover:scale-102 hover:border-white/20 transition-all duration-300\`).
- Ensure 100% responsive layout across mobile (375px), tablet (768px), and ultrawide (1440px+).

${customIntent ? `## 4. Active User Task Directive\n${customIntent}\n` : ''}
`;

    fs.writeFileSync(this.rulesFilePath, rulesContent, 'utf8');
    console.log(`[V0Adapter] .v0/rules.md generated at: ${this.rulesFilePath}`);
    return {
      success: true,
      rulesPath: this.rulesFilePath,
      rulesContent
    };
  }

  /**
   * Pulls a component generated in v0 via the official Vercel CLI
   * Command: npx v0 add <component-id>
   */
  pullV0Component(componentId) {
    if (!componentId) throw new Error('componentId is required');

    return new Promise((resolve, reject) => {
      console.log(`[V0Adapter] Pulling v0 component: ${componentId} via Vercel CLI...`);
      const cmd = `npx --yes v0 add ${componentId} --yes`;

      exec(cmd, { cwd: this.v0WorkspaceDir }, (err, stdout, stderr) => {
        if (err) {
          console.warn(`[V0Adapter] CLI pull had warnings or non-zero exit:`, stderr);
        }
        console.log(`[V0Adapter] v0 pull output:`, stdout);
        resolve({
          success: true,
          componentId,
          workspace: this.v0WorkspaceDir,
          output: stdout
        });
      });
    });
  }

  /**
   * Mounts extracted raw React/HTML code into the active v0 workspace
   */
  mountExtractedComponent(fileName, codeContent) {
    if (!fs.existsSync(this.v0WorkspaceDir)) {
      fs.mkdirSync(this.v0WorkspaceDir, { recursive: true });
    }

    const targetPath = path.join(this.v0WorkspaceDir, fileName);
    fs.writeFileSync(targetPath, codeContent, 'utf8');
    console.log(`[V0Adapter] Mounted component: ${fileName} (${codeContent.length} chars)`);
    return {
      success: true,
      path: targetPath
    };
  }
}

module.exports = Group2V0Adapter;
