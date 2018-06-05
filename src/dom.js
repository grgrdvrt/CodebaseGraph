const traversing = require("./traversing");
const path = require('path');

function getDependencies(data){

  let dependencies = [];
  traversing.traverseFiles(data, ".js", file => {
      dependencies.push(...file.globalDependencies);
  });
  return Array.from(new Set(dependencies));
}

class Color {
  constructor(h, s, l) {
    this.set(h, s, l);
  }

  set(h = 0, s = 0, l = 0) {
    this.h = h;
    this.s = s;
    this.l = l;
  }

  setH(h) {
    this.h = h;
    return this;
  }

  setS(s) {
    this.s = s;
    return this;
  }

  setL(l) {
    this.l = l;
    return this;
  }

  clone() {
    return new Color(this.h, this.s, this.l);
  }

  toString() {
    let h = Math.round(this.h % 360);
    let s = Math.round(this.s * 100);
    let l = Math.round(this.l * 100);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
}


function randomColor(){
  return new Color(
    Math.random(),
    Math.random() * 0.3 + 0.1,
    1
  );
}


function createDomNodes(data){
  assignCount(data);
  assignColor(data, {min:0, max:360});


  let dependencies = getDependencies(data);
  let node = document.createElement("div");
  node.appendChild(packageToDom(data).node);
  node.appendChild(dependenciesToDom(dependencies).node);
  node.classList.add("graphNode");

  data.node = node;
  return data;
}


function assignCount(data){
  if(traversing.isLeaf(data)){
    return 1;
  }
  else {
    data.count = data.children.reduce((t, c) => t + assignCount(c), 0);
  }
  return data.count;
}


function assignColor(data, colorRange){
  data.color = new Color(0.5 * (colorRange.min + colorRange.max), 0.8, 0.9);
  if(data.type === "dir"){
    const weights = data.children.map(child => {
      return child.type === "dir" ? child.count : 1;
    });
    let range = colorRange.max - colorRange.min;
    let ratio = range / data.count;
    let min = colorRange.min;
    data.children.forEach((child, i) => {
      let max = min + weights[i] * ratio;
      assignColor(child, {min:min, max:max});
      min = max;
    });
  }
}


function packageToDom(data){
  let node;
  switch(data.type){
    case ".js":node = jsFileToDom(data);break;
    case "dir":node = dirToDom(data);break;
    default:node = fileToDom(data);break;
  }
  node.node.classList.add("graphNode");
  return node;
}


function fileToDom(data){
  let node = document.createElement("div");
  node.innerHTML = path.basename(data.path);
  node.classList.add("graphNode");
  data.node = node;
  node.style.borderColor = data.color.toString();
  return data;
}


function dirToDom(data){
  let node = document.createElement("div");
  // data.children.forEach(c => node.appendChild(packageToDom(c).node));
  data.children.forEach(c => packageToDom(c).node);
  node.classList.add("graphNode");
  data.node = node;
  return data;
}


function gridLayout(children){
}


function jsFileToDom(data){
  const classesCells = data.content.classes.map(classToDom);
  const imports = data.content.imports.map(i => i.path).join("\\n");
  const hsl = new Color(data.color.h, 0.8, 0.7);

  let node = document.createElement("div");
  node.innerHTML = path.basename(data.path) + classesCells;
  node.classList.add("graphNode");
  node.style.backgroundColor = data.color.toString();
  node.style.borderColor = hsl.toString();
  data.node = node;
  return data;
}



function dependenciesToDom(dependencies){
  const node = document.createElement("div");
  dependencies.forEach(dep => {
    let depNode = document.createElement("div");
    depNode.innerHTML = dep;
    node.appendChild(depNode);
  });
  node.classList.add("graphNode");
  return {node};
}

function classToDom(classDeclaration){
  const d = classDeclaration;
  const methods = d.methods.map(m => `${m.name}(${m.params.join(", ")})`);
  let str = "";
  str += d.name;
  str += (d.superclass === null ? '' : ' extends ' + d.superclass) + "<br/>";
  str += methods.join("<br/>");
  return str;
}



Object.assign(module.exports, {
  createDomNodes
});
