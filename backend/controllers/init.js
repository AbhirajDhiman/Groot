const fs = require('fs').promises; // promises provides promise-based file system operations for async/await use.
const path = require('path');

const repoBase = path.resolve(__dirname, '..');
async function initRepo() {
    const repoPath = path.join(repoBase, '.Groot');
    const commitsPath = path.join(repoPath, 'commits');

    try {
        await fs.mkdir(repoPath, { recursive: true });
        await fs.mkdir(commitsPath, { recursive: true });
        await fs.writeFile(
            path.join(commitsPath, 'config.json'),
            JSON.stringify({ bucket: process.env.S3_BUCKET })
        );
        console.log('Repository initialized successfully at', repoPath);
    } catch (err) {
        console.error('Error initializing repository:', err);
    }
}

module.exports = { initRepo };