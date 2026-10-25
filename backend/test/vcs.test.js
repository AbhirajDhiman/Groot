const fs = require('fs').promises;
const path = require('path');
const assert = require('assert');

const { initRepo } = require('../controllers/init');
const { addFile } = require('../controllers/add');
const { commitChanges } = require('../controllers/commit');
const { repoStatus } = require('../controllers/status');
const { showLog } = require('../controllers/log');
const { revertCommit } = require('../controllers/revert');
const { diffRepo } = require('../controllers/diff');
const { readJson } = require('../utils/repoUtils');

async function runVcsTests() {
  console.log('\n--- Running Groot VCS Core Tests ---');
  const sandboxDir = path.join(__dirname, 'sandbox_repo_' + Date.now());
  const originalCwd = process.cwd();

  try {
    // 1. Create sandbox directory
    await fs.mkdir(sandboxDir, { recursive: true });
    process.chdir(sandboxDir);

    // 2. Test initRepo
    console.log('Testing: groot init');
    const initResult = await initRepo(sandboxDir);
    assert.strictEqual(initResult.success, true, 'initRepo should succeed');

    const grootDir = path.join(sandboxDir, '.groot');
    const statGroot = await fs.stat(grootDir);
    assert.strictEqual(statGroot.isDirectory(), true, '.groot directory must exist');

    const config = await readJson(path.join(grootDir, 'config.json'));
    assert.ok(config && config.version, 'config.json must have version');

    // 3. Test addFile (staging)
    console.log('Testing: groot add <file>');
    await fs.writeFile(path.join(sandboxDir, 'hello.txt'), 'Hello, Groot VCS!', 'utf8');
    await fs.mkdir(path.join(sandboxDir, 'src'), { recursive: true });
    await fs.writeFile(path.join(sandboxDir, 'src', 'index.js'), 'console.log("Groot");', 'utf8');

    const addResult = await addFile(['hello.txt', 'src/index.js']);
    assert.strictEqual(addResult.success, true, 'addFile should succeed');
    assert.strictEqual(addResult.stagedFiles.length, 2, 'Two files should be staged');

    const stagingHello = path.join(grootDir, 'staging', 'hello.txt');
    const stagingSrc = path.join(grootDir, 'staging', 'src', 'index.js');
    await fs.access(stagingHello);
    await fs.access(stagingSrc);

    // 4. Test repoStatus
    console.log('Testing: groot status');
    const status1 = await repoStatus();
    assert.strictEqual(status1.success, true, 'repoStatus should succeed');
    assert.strictEqual(status1.staged.length, 2, 'Status should report 2 staged files');

    // 5. Test commitChanges
    console.log('Testing: groot commit <message>');
    const commitResult = await commitChanges('First test commit');
    assert.strictEqual(commitResult.success, true, 'commitChanges should succeed');
    assert.ok(commitResult.commitID, 'Commit must return a commitID');

    const commitDir = path.join(grootDir, 'commits', commitResult.commitID);
    await fs.access(path.join(commitDir, 'commit.json'));
    await fs.access(path.join(commitDir, 'hello.txt'));
    await fs.access(path.join(commitDir, 'src', 'index.js'));

    const headCommit = (await fs.readFile(path.join(grootDir, 'HEAD'), 'utf8')).trim();
    assert.strictEqual(headCommit, commitResult.commitID, 'HEAD must match commit ID');

    // 6. Test showLog
    console.log('Testing: groot log');
    const logResult = await showLog();
    assert.strictEqual(logResult.success, true, 'showLog should succeed');
    assert.strictEqual(logResult.commits.length, 1, 'Log should contain 1 commit');
    assert.strictEqual(logResult.commits[0].commitID, commitResult.commitID);

    // 7. Test diffRepo
    console.log('Testing: groot diff');
    await fs.writeFile(path.join(sandboxDir, 'hello.txt'), 'Hello, Groot VCS with Modifications!', 'utf8');
    const diffResult = await diffRepo('hello.txt');
    assert.strictEqual(diffResult.success, true, 'diffRepo should succeed');

    // 8. Test revertCommit
    console.log('Testing: groot revert <commitID>');
    const revertResult = await revertCommit(commitResult.commitID);
    assert.strictEqual(revertResult.success, true, 'revertCommit should succeed');

    const restoredContent = await fs.readFile(path.join(sandboxDir, 'hello.txt'), 'utf8');
    assert.strictEqual(restoredContent, 'Hello, Groot VCS!', 'File should be restored to committed content');

    console.log('\n[PASS] All Groot VCS Core Tests passed successfully!');
    return true;
  } finally {
    process.chdir(originalCwd);
    try {
      await fs.rm(sandboxDir, { recursive: true, force: true });
    } catch {
      // Cleanup
    }
  }
}

module.exports = { runVcsTests };

if (require.main === module) {
  runVcsTests().catch((err) => {
    console.error('[FAIL] VCS test failure:', err);
    process.exit(1);
  });
}
