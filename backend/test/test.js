const { runVcsTests } = require('./vcs.test');
const { runApiTests } = require('./api.test');

async function runAllTests() {
  console.log('==============================================');
  console.log('🌳  GROOT BACKEND TEST SUITE EXECUTION  🌳');
  console.log('==============================================');

  const startTime = Date.now();
  let vcsPassed = false;
  let apiPassed = false;

  try {
    vcsPassed = await runVcsTests();
  } catch (err) {
    console.error('VCS Test Suite Failed:', err.message);
  }

  try {
    apiPassed = await runApiTests();
  } catch (err) {
    console.error('API Test Suite Failed:', err.message);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n==============================================');
  if (vcsPassed && apiPassed) {
    console.log(`🎉 ALL TESTS PASSED (${duration}s)`);
    console.log('Groot Backend Version Control System is ready.');
    console.log('==============================================\n');
    process.exit(0);
  } else {
    console.error(`❌ TEST SUITE FAILED (${duration}s)`);
    console.error(`VCS Tests: ${vcsPassed ? 'PASS' : 'FAIL'}`);
    console.error(`API Tests: ${apiPassed ? 'PASS' : 'FAIL'}`);
    console.log('==============================================\n');
    process.exit(1);
  }
}

runAllTests();
