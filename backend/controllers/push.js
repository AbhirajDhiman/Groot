const fs=require('fs').promises;
const path=require('path');
const {S3_BUCKET,s3}=require('../config/aws-config');


const pushChanges = async () => {
  const repoPath=path.resolve(process.cwd(), '.Groot');
  const commitPath=path.join(repoPath, 'commits');

  try{
    const commitFiles=await fs.readdir(commitPath);
    for(const file of commitFiles){
      const filePath=path.join(commitPath, file);
      const fileContent=await fs
    }
  }catch(err){
    console.error("Error pushing changes to remote repository:", err);
  }


}
module.exports = { pushChanges };