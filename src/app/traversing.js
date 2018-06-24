//@doc provides function to traverse a file hierarchy

function isLeaf(node){
  return node.type !== "dir";
}


function traverseFiles(node, type, callback){
  if(isLeaf(node)){
    if(type === undefined || type === node.type){
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
  // console.log("path", path);
  // console.log(node.children.map(c => c.name));
  // console.log("child", child ? child.path : undefined);
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


module.exports = {
  traverseFiles:traverseFiles,
  isLeaf:isLeaf,
  find:find
};
