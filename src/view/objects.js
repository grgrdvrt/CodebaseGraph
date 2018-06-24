const traversing = require('../app/traversing');

const color = require('./color');
const svg = require('./svg');


function createNodes(data, dependencies){
  let nodesMap = {};
  traversing.traverseFiles(data, undefined, f => {
    if(f.type === ".js"){
      let node = createJSNode(f);
      nodesMap[f.path] = node;
      f.dom = node;
    }
    else if(f.type !== "dir"){
      let node = createFileNode(f);
      nodesMap[f.path] = node;
      f.dom = node;
    }
  });

  dependencies.forEach(dep => {
    let node = createFileNode(dep);
    dep.dom = node;
  });
  return nodesMap;
}



function createFileNode(data){

  let fileNode = document.createElement("div");
  fileNode.classList.add("fileNode");
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
  fileNode.classList.add("jsNode");
  fileNode.dataset.path = data.absolutePath;

  let nameNode = document.createElement("h3");
  nameNode.classList.add("fileName");
  nameNode.dataset.loc = "0";
  nameNode.innerHTML = data.name;
  fileNode.appendChild(nameNode);


  data.content.classes.map(classToDom)
    .forEach(fileNode.appendChild, fileNode);

  return fileNode;
}



function classToDom(classDeclaration){
  const d = classDeclaration;
  let name = d.name;
  if(d.superclass !== null){
    name += '&nbsp;extends&nbsp;' + d.superclass;
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





function initNodes(nodesMap, json, view){
  console.log(json);
  json.objects.filter(o => o.nodes === undefined).forEach(obj => {
    let node = nodesMap[obj.name];
    if(node === undefined)return;
    let pos = obj.pos.split(",").map(Number);
    Object.assign(node.style, {
      left:Math.round(pos[0] - 72 * 0.5 * Number(obj.width)) + "px",
      top:Math.round((view.height - (pos[1] + 72 * 0.5 * Number(obj.height)))) + "px",
      borderColor : color.HSVColorToString(obj.color),
      backgroundColor : color.HSVColorToString(obj.fillcolor || "0 0 0")
    });
  });
}



function getClustersSvg(clustersData, view){
  return clustersData.map(cluster => {
    let bb = cluster.bb.split(",").map(Number);
    let w = bb[2] - bb[0];
    let h = bb[3] - bb[1];
    return svg.create("rect").attrs({
      x:bb[0],
      y:view.height - bb[1] - h,
      width:w,
      height:h,
      fill:"none",
      stroke:"black",
      "stroke-width":2
    });
  });
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
  classToDom,
  initNodes,
  getClustersSvg,
  getEdgesSvg
});
