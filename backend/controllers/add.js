const fs = require('fs').promises;
const path = require('path');

const repoBase = path.resolve(__dirname, '..');

const resolveSourcePath = async (filePath) => {
    const rootCandidate = path.resolve(process.cwd(), filePath);
    try {
        const stat = await fs.stat(rootCandidate);
        if (stat.isFile()) return rootCandidate;
    } catch (err) {
        // ignore and try backend path
    }

    const backendCandidate = path.resolve(repoBase, filePath);
    const stat = await fs.stat(backendCandidate);
    if (stat.isFile()) return backendCandidate;
    throw new Error(`File not found: ${filePath}`);
};

const addFile = async (filePaths) => {
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    if (paths.length === 0 || !paths[0]) {
        console.error('No file path provided. Use: node server.js add <file>');
        return;
    }

    const repoPath = path.join(repoBase, '.Groot');
    const stagingPath = path.join(repoPath, 'staging');

    try {
        await fs.mkdir(stagingPath, { recursive: true });

        for (const filePath of paths) {
            if (!filePath) {
                continue;
            }

            const sourcePath = path.resolve(process.cwd(), filePath);
            const fileName = path.basename(sourcePath);

            const fileStat = await fs.stat(sourcePath);
            if (!fileStat.isFile()) {
                console.error(`Path ${sourcePath} is not a file.`);
                continue;
            }

            await fs.copyFile(sourcePath, path.join(stagingPath, fileName));
            console.log(`File "${fileName}" added to staging area successfully.`);
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`File not found: ${err.path}. Provide a relative path from ${process.cwd()} or an absolute path.`);
        } else {
            console.error('Error adding file to staging area:', err);
        }
    }
}

module.exports = { addFile };

