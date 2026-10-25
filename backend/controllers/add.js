const fs = require('fs').promises;
const path = require('path');
const {
  ensureRepoRoot,
  getRelativeFiles,
  isSafePath,
  DEFAULT_IGNORES,
} = require('../utils/repoUtils');

/**
 * Stages files or directories into the Groot staging area.
 * Supports individual files, directories, arrays of files, or "." for all files.
 */
async function addFile(filePaths) {
  try {
    const { rootDir, grootDir } = await ensureRepoRoot();
    const stagingPath = path.join(grootDir, 'staging');
    await fs.mkdir(stagingPath, { recursive: true });

    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    const filteredPaths = paths.filter((p) => p && typeof p === 'string' && p.trim().length > 0);

    if (filteredPaths.length === 0) {
      console.error('No files specified. Usage: groot add <file1> [file2...] or groot add .');
      return { success: false, error: 'No files specified' };
    }

    const stagedFiles = [];

    for (const rawPath of filteredPaths) {
      const trimmed = rawPath.trim();
      const resolvedPath = path.resolve(process.cwd(), trimmed);

      if (!isSafePath(rootDir, resolvedPath)) {
        console.error(`Error: Cannot stage file outside repository root: ${trimmed}`);
        continue;
      }

      // If user typed "." or repository root itself, stage all files
      if (trimmed === '.' || resolvedPath === rootDir) {
        const allFiles = await getRelativeFiles(rootDir, rootDir);
        for (const relFile of allFiles) {
          const src = path.join(rootDir, relFile);
          const dest = path.join(stagingPath, relFile);
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.copyFile(src, dest);
          stagedFiles.push(relFile);
        }
        continue;
      }

      // Check if file or directory exists
      let stat;
      try {
        stat = await fs.stat(resolvedPath);
      } catch (err) {
        console.error(`File or directory not found: ${trimmed}`);
        continue;
      }

      if (stat.isDirectory()) {
        const subFiles = await getRelativeFiles(resolvedPath, rootDir);
        for (const relFile of subFiles) {
          const src = path.join(rootDir, relFile);
          const dest = path.join(stagingPath, relFile);
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.copyFile(src, dest);
          stagedFiles.push(relFile);
        }
      } else if (stat.isFile()) {
        const relFile = path.relative(rootDir, resolvedPath);
        if (DEFAULT_IGNORES.includes(path.basename(relFile))) {
          continue;
        }
        const dest = path.join(stagingPath, relFile);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(resolvedPath, dest);
        stagedFiles.push(relFile);
      }
    }

    const uniqueStaged = [...new Set(stagedFiles)];
    if (uniqueStaged.length === 0) {
      console.log('No changes were staged.');
    } else {
      for (const file of uniqueStaged) {
        console.log(`Staged: ${file}`);
      }
      console.log(`Successfully staged ${uniqueStaged.length} file(s) into Groot staging area.`);
    }

    return { success: true, stagedFiles: uniqueStaged };
  } catch (err) {
    console.error('Error staging files:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { addFile };
