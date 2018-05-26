//retrieves the files hierarchy

const fs = require('fs');
const path = require('path');


function dir(name, relativePath, absolutePath, children){
  return {
    type:"dir",
    name:name,
    path:relativePath,
    absolutePath:absolutePath,
    children:children
  };
}

function file(name, relativePath, absolutePath){
  return {
    name:name,
    type:path.extname(relativePath),
    path:relativePath,
    absolutePath:absolutePath
  };
}

function getFileHierarchyAux(dirPath, rootPath){
  const dirName = path.parse(dirPath).name;
  const dirAbsolutePath = path.join(rootPath, dirPath);
  const content = fs.readdirSync(dirAbsolutePath).map(fileName => {
    const filePath = path.join(dirPath, fileName);
    const fileAbsolutePath = path.join(rootPath, filePath);

    if(fs.statSync(fileAbsolutePath).isDirectory()){
      return getFileHierarchyAux(filePath, rootPath);
    }
    else {
      return file(fileName, filePath, fileAbsolutePath);
    }
  });

  return dir(dirName, dirPath, dirAbsolutePath, content);
}


function getFileHierarchy(dirPath){
  return getFileHierarchyAux("", dirPath);
}


module.exports = {
  getFileHierarchy:getFileHierarchy
};
