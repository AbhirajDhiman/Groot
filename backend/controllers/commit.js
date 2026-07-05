const fs=require('fs').promises; //promises is a utility which helps simplify the use of asynchronous file system operations in Node.js. It provides a set of methods that return promises, allowing developers to use async/await syntax for better readability and error handling.;
const path=require('path'); // gives us path to the current directory and helps us to create paths that are compatible across different operating systems.

const { v4:uuidv4 } = require('uuid'); //uuidv4 is a library that generates unique identifiers (UUIDs) in version 4 format. It is commonly used to create unique IDs for various purposes, such as identifying resources or objects in a system.


const commitChanges = async (message) => {
  if (!message) {
    console.log("Commit message is required.");
    return;
  }
  const repoPath=path.resolve(process.cwd(), '.Groot');
  const stagePath=path.join(repoPath, 'staging');
  const commitsPath=path.join(repoPath, 'commits');

  try{
    const commitID=uuidv4();
    const commitDirectory=path.join(commitsPath, commitID);
    await fs.mkdir(commitDirectory, { recursive: true });
    const files=await fs.readdir(stagePath);

    for (const file of files) {
      await fs.copyFile(
          path.join(stagePath, file),
          path.join(commitDirectory, file)
      );
    }
    await fs.writeFile(
        path.join(commitDirectory, 'commit.json'),
        JSON.stringify({ message, date: new Date().toISOString(), commitID })
    );
    console.log(`Commit :${commitID} created successfully with message: "${message}"`);
  } catch (err) {
    console.error("Error occurred while committing changes:", err);
  }
  console.log(`Committing changes with message: "${message}"`);
}
module.exports = { commitChanges };