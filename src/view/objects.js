//@doc defines how to display the graph's objects

const traversing = require('../app/traversing');

const color = require('./color');
const svg = require('./svg');

const {NodeView} = require("./NodeView");


function createNodes(data, dependencies){
  let nodesMap = {};
  traversing.traverseFiles(data, undefined, file => {
    if(file.type === ".js"){
      let view = new NodeView(file, createJSNode(file));
      view.dom.view = view;
      file.view = view;
      nodesMap[file.path] = view;
    }
    else if(file.type !== "dir"){
      let view = new NodeView(file, createFileNode(file));
      view.dom.view = view;
      file.view = view;
      nodesMap[file.path] = view;
    }
  });

  dependencies.forEach(dep => {
    let view = new NodeView(dep, createDependencyNode(dep));
    dep.view = view;
    nodesMap[dep.path] = view;
  });
  return nodesMap;
}


function createDependencyNode(data){
  let fileNode = document.createElement("div");
  fileNode.classList.add("node", "dependencyNode");

  let nameNode = document.createElement("h3");
  nameNode.classList.add("dependencyName");
  nameNode.innerHTML = data.path;
  fileNode.appendChild(nameNode);

  return fileNode;
}


function createFileNode(data){
  let fileNode = document.createElement("div");
  fileNode.classList.add("node", "fileNode");
  fileNode.dataset.path = data.absolutePath;

  let nameNode = document.createElement("h3");
  nameNode.classList.add("fileName");
  nameNode.dataset.loc = "0";
  nameNode.innerHTML = data.name;
  fileNode.appendChild(nameNode);

  return fileNode;
}


function createJSNode(data){
  let fileNode = document.createElement("div");
  fileNode.classList.add("node", "jsNode");
  fileNode.dataset.path = data.absolutePath;

  let nameNode = document.createElement("h3");
  nameNode.classList.add("fileName");
  nameNode.dataset.loc = "0";
  nameNode.innerHTML = data.name;
  fileNode.appendChild(nameNode);

  if(data.content.error !== null){
    fileNode.appendChild(errorToDom(data.content.error));
  }
  else {
    data.content.classes.map(classToDom)
      .forEach(fileNode.appendChild, fileNode);
  }

  return fileNode;
}


function classToDom(classDeclaration){
  const d = classDeclaration;
  let name = d.name;
  if(d.superclass !== null){
    name += ' extends ' + d.superclass;
  }

  let classNode = document.createElement("div");

  let nameNode = document.createElement("h4");
  nameNode.classList.add("className");
  nameNode.dataset.loc = `${d.loc.line}:${d.loc.column}`;
  nameNode.innerHTML = d.name;
  classNode.appendChild(nameNode);


  let methodsNode = document.createElement("ul");
  d.methods.map(m => {
    let methodNode = document.createElement("li");
    methodNode.classList.add("method");
    methodNode.dataset.loc = `${m.loc.line}:${m.loc.column}`;
    methodNode.innerHTML = `${m.name}(${m.params.join(",&nbsp;")})`;
    return methodNode;
  }).forEach(methodsNode.appendChild, methodsNode);
  classNode.appendChild(methodsNode);

  return classNode;
}


function errorToDom(err){
  let errorNode = document.createElement("p");
  errorNode.innerHTML = err.err.message;
  return errorNode;
}


function initNode(nodeView, obj, view){
  if(nodeView === undefined)return;
  let pos = obj.pos.split(",").map(Number);
  Object.assign(nodeView.dom.style, {
    left:Math.round(pos[0] - 72 * 0.5 * Number(obj.width)) + "px",
    top:Math.round((view.height - (pos[1] + 72 * 0.5 * Number(obj.height)))) + "px",
    borderColor : color.HSVColorToString(obj.color || "0 0 0"),
    backgroundColor : color.HSVColorToString(obj.fillcolor || "0 0 0")
  });
}


function getClusterNode(cluster, view){
  let bb = cluster.bb.split(",").map(Number);
  let w = bb[2] - bb[0];
  let h = bb[3] - bb[1];

  let node = document.createElement("div");
  node.classList.add("package");
  node.innerHTML = cluster.label;
  Object.assign(node.style, {
    width:Math.round(w) + "px",
    height:Math.round(h) + "px",
    left:Math.round(bb[0]) + "px",
    top:Math.round((view.height - (bb[1] + h))) + "px",
  });
  return node;
}


function getEdgesSvg(edgesData, view){
  let result = [];
  edgesData.forEach(e => {
    let draws = e["_draw_"];
    if(!draws) return;
    let paths = draws.filter(d => d.points).map((d, i) => {
      let color = draws[2 * i].color;
      let pts = d.points.map(pt => {
        return `${pt[0]},${view.height - pt[1]}`;
      });

      result.push(svg.create("path").attrs({
        d:`M${pts[0]}C${pts.slice(1).join(" ")}`,
        fill:"none",
        "stroke-width":2,
        stroke:color
      }));
    });
  });
  return result;
}


Object.assign(module.exports, {
  createNodes,
  createFileNode,
  createJSNode,
  initNode,
  getClusterNode,
  getEdgesSvg
});
