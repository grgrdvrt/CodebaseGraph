//@doc retrieves the files hierarchy

const fs = require('fs');
const path = require('path');


function dir(name, relativePath, absolutePath, children){
  return {
    name:name,
    isDirectory:true,
    type:"dir",
    path:relativePath,
    absolutePath:absolutePath,
    children:children
  };
}

function file(name, relativePath, absolutePath){
  return {
    name:name,
    isDirectory:false,
    type:path.extname(relativePath),
    path:relativePath,
    absolutePath:absolutePath
  };
}

function externalDependency(path){
  return {
    path:path,
    type:'externalDependency',
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


Object.assign(module.exports, {
  getFileHierarchy:getFileHierarchy,
  dir:dir,
  file:file,
  externalDependency:externalDependency
});
