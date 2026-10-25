const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const GROOT_DIR_NAMES = ['.groot', '.Groot'];
const DEFAULT_IGNORES = ['.groot', '.Groot', '.git', 'node_modules', '.DS_Store'];

/**
 * Searches current directory and ancestors to find the Groot repository root.
 * Returns { rootDir, grootDir, dirName } or null if not found.
 */
async function findRepoRoot(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (true) {
    for (const name of GROOT_DIR_NAMES) {
      const candidate = path.join(currentDir, name);
      try {
        const stat = await fs.stat(candidate);
        if (stat.isDirectory()) {
          return {
            rootDir: currentDir,
            grootDir: candidate,
            dirName: name,
          };
        }
      } catch (err) {
        // Not found, continue checking
      }
    }

    if (currentDir === root) {
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Ensures the command is running inside a Groot repository, throwing a clean error otherwise.
 */
async function ensureRepoRoot(startDir = process.cwd()) {
  const repo = await findRepoRoot(startDir);
  if (!repo) {
    throw new Error(
      "Fatal: Not a Groot repository (or any of the parent directories). Run 'groot init' first."
    );
  }
  return repo;
}

/**
 * Recursively retrieves all relative file paths inside a directory.
 */
async function getRelativeFiles(dirPath, baseDir = dirPath, ignoreList = DEFAULT_IGNORES) {
  let results = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoreList.includes(entry.name)) {
        continue;
      }
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await getRelativeFiles(fullPath, baseDir, ignoreList);
        results = results.concat(subFiles);
      } else if (entry.isFile()) {
        results.push(path.relative(baseDir, fullPath));
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
  return results;
}

/**
 * Recursively copies all files from srcDir to destDir, preserving relative path structure.
 */
async function copyDirectoryRecursive(srcDir, destDir, ignoreList = DEFAULT_IGNORES) {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (ignoreList.includes(entry.name)) {
      continue;
    }
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(srcPath, destPath, ignoreList);
    } else if (entry.isFile()) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Reads a JSON file safely, returning a default value if missing or invalid.
 */
async function readJson(filePath, defaultValue = null) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return defaultValue;
  }
}

/**
 * Writes a JSON file with pretty formatting.
 */
async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Checks if a path is safely within the repository root to prevent path traversal.
 */
function isSafePath(repoRoot, targetPath) {
  const resolved = path.resolve(repoRoot, targetPath);
  return resolved === repoRoot || resolved.startsWith(repoRoot + path.sep);
}

module.exports = {
  findRepoRoot,
  ensureRepoRoot,
  getRelativeFiles,
  copyDirectoryRecursive,
  readJson,
  writeJson,
  isSafePath,
  DEFAULT_IGNORES,
};
