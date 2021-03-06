//@doc provides functions to traverse a file hierarchy

function isLeaf(node){
  return !node.isDirectory;
}


function traverseFiles(node, type, callback){
  if(isLeaf(node)){
    if(type === undefined || node.type.match(type)){
      callback(node);
    }
  }
  else {
    node.children.forEach(child => traverseFiles(child, type, callback));
  }
}

function find(node, path){
  let items = path.split("/");
  let firstItem = items.shift();
  let child = node.children.filter(child => child.name === firstItem)[0];
  let result = null;
  if(child){
    if(isLeaf(child)){
      if(items.length === 0){
        result = child;
      }
    }
    else {
      result = find(child, items.join("/"));
    }
  }
  return result;
}

function find2(nodesMap, path){
  return nodesMap[path];
}

module.exports = {
  traverseFiles:traverseFiles,
  isLeaf:isLeaf,
  find:find,
  find2:find2
};
