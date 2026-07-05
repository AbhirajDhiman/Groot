const fs = require('fs').promises; //promises is a utility which helps simplify the use of asynchronous file system operations in Node.js. It provides a set of methods that return promises, allowing developers to use async/await syntax for better readability and error handling.
const path=require('path'); // gives us path to the current directory and helps us to create paths that are compatible across different operating systems.
async function initRepo(){
    const repoPath=path.resolve(process.cwd(),'.Groot'); //resolve method is used to create an absolute path to the .simplegit directory in the current working directory.
    const commitsPath=path.join(repoPath,'commits'); //join method is used to create a path to the commits.json file inside the .simplegit directory.

    try{
        await fs.mkdir(repoPath,{recursive:true}); //creates the .simplegit directory if it doesn't exist. The recursive option allows creating nested directories if needed.
        await fs.mkdir(commitsPath,{recursive:true}); //creates the commits.json file if it doesn't exist.  
        await fs.writeFile(path.join(commitsPath,'config.json'),
            JSON.stringify({ bucket : process.env.S3_BUCKET })
        ); //creates the commits.json file and initializes it with an empty array.
        console.log('Repository initialized successfully at',repoPath);
    }catch(err){
        console.error('Error initializing repository:',err);
    }

}
module.exports = { initRepo };