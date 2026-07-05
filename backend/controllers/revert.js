const revertCommit = async (commitHash) => {
  if (!commitHash) {
    console.log("No commit hash specified to revert.");
    return;
  }
  console.log(`Reverting commit with hash: ${commitHash}`);
}
module.exports = { revertCommit };