const { initToolRegistry, toolRegistry } = require('../src/main/tools');
const desktopAutomator = require('../desktop-automator.js');

async function testRegistry() {
  console.log('--- Testing inject_and_submit_workspace in ToolRegistry ---');
  initToolRegistry({
    desktopAutomator,
    browserAgent: {},
    skillHunter: {},
    nativeUiaBridge: {},
    memoryCore: {},
    getMainWindow: () => null
  });

  if (!toolRegistry.has('inject_and_submit_workspace')) {
    throw new Error('Tool inject_and_submit_workspace not registered!');
  }
  console.log('✓ Tool inject_and_submit_workspace registered successfully in ToolRegistry!');
  console.log('Total tools registered:', toolRegistry.getToolList().length);
  setTimeout(() => process.exit(0), 100);
}

testRegistry().catch(err => {
  console.error(err);
  process.exit(1);
});
