const fs = require('fs').promises; //promises is a utility which helps simplify the use of asynchronous file system operations in Node.js. It provides a set of methods that return promises, allowing developers to use async/await syntax for better readability and error handling.;
const path = require('path');

const addFile = async (filePath) => {
    if (!filePath) {
        console.error('No file path provided. Use: node server.js add <file>');
        return;
    }

    const repoPath = path.resolve(process.cwd(), '.Groot');
    const stagingPath = path.join(repoPath, 'staging');

    try {
        const sourcePath = path.resolve(process.cwd(), filePath);
        const fileName = path.basename(sourcePath);

        const fileStat = await fs.stat(sourcePath);
        if (!fileStat.isFile()) {
            console.error(`Path ${sourcePath} is not a file.`);
            return;
        }

        await fs.mkdir(stagingPath, { recursive: true });
        await fs.copyFile(sourcePath, path.join(stagingPath, fileName));
        console.log(`File "${fileName}" added to staging area successfully.`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`File not found: ${filePath}. Provide a relative path from ${process.cwd()} or an absolute path.`);
        } else {
            console.error('Error adding file to staging area:', err);
        }
    }
}

module.exports = { addFile };

