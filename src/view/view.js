const path = require("path");

const traversing = require("../traversing");

const svg = require("./svg");


let graphDom = document.createElement("div");
document.body.appendChild(graphDom);
graphDom.classList.add("graphDom");

let svgDom = document.createElement("div");
graphDom.appendChild(svgDom);

let nodesContainer = document.createElement("div");
graphDom.appendChild(nodesContainer);
nodesContainer.classList.add("nodesContainer");

let nodesMap = {};

let posInit = {x:0, y:0};
let graphPos = {x:0, y:0};
let graphPosInit = {x:undefined, y:undefined};
let scale = 1;
let size = {width:undefined, height:undefined};

function init(contentStr){
  // svgDom.innerHTML = contentStr;
  size.width = graphDom.clientWidth;
  size.height = graphDom.clientHeight;
  let nodes = {};
  document.querySelectorAll(".node title").forEach(title => {
    nodes[title.textContent] = title.parentNode;
  });
  console.log(nodes);

  initMouse();
}


function initJSON(json){
  console.log(json);

  let s = json.bb.split(",");
  size.width = s[2];
  size.height = s[3];

  let svgMain = svg.create("svg");
  svgDom.appendChild(svgMain.node);

  let result = json.edges.map(e => {
    let color = (Math.round(Math.random() * 0xffffff)).toString(16);
    let draws = e["_draw_"];
    if(!draws) return "";
    let pts = [];
    let paths = draws.filter(d => d.points).map(d => d.points.map(pt => {
      return `${pt[0]},${size.height - pt[1]}`;
    }));
    let result = paths.map(pts => {
      return `<path d="M${pts[0]}C${pts.slice(1).join(" ")}" fill="none" stroke="#${color}"/>`;
    }).join("");
    return result;
  }).join("");

  svgMain.node.innerHTML = result;

  json.objects.filter(o => o.nodes === undefined).forEach(obj => {
    let node = nodesMap[obj.name];
    if(node === undefined)return;
    let pos = obj.pos.split(",").map(Number);
    Object.assign(node.style, {
      left:(pos[0] - 72 * 0.5 * Number(obj.width)) + "px",
      top:(size.height - (pos[1] + 72 * 0.5 * Number(obj.height))) + "px"
    });
  });


  svgMain.attrs({
    width:size.width,
    height:size.height
  });
  initMouse();
}

function initNodes(data){
  // console.log("initNodes", data);
  traversing.traverseFiles(data, undefined, f => {
    if(f.type === ".js"){
      let node = createJSNode(f);
      f.dom = node;
      nodesContainer.appendChild(node);
      // console.log(node.offsetWidth, node.offsetHeight);
    }
  });
}

function createJSNode(data){
  let node = document.createElement("div");
  node.classList.add("jsNode");
  // console.log(data.path, node);
  nodesMap[data.path] = node;

  const classesStrs = data.content.classes.map(classToDom);
  const imports = data.content.imports.map(i => i.path).join("<br>");

  node.innerHTML = imports + "<br>" + classesStrs.join("<br>");
  return node;
}


function classToDom(classDeclaration){
  const d = classDeclaration;
  const methods = d.methods.map(m => `${m.name}(${m.params.join(", ")})`);
  let str = "";
  str += d.name;
  str += (d.superclass === null ? '' : ' extends ' + d.superclass) + "<br>";
  str += methods.join("<br>");
  return str;
}



//MOUSE INTERACTION

function initMouse(){
  document.addEventListener("mousedown", startDrag);
  document.addEventListener("mousewheel", zoom);
}


function zoom(e){
  let mouseX = e.clientX;
  let mouseY = e.clientY;
  let dx = (graphPos.x + 0.5 * size.width - mouseX) / scale;
  let dy = (graphPos.y + 0.5 * size.height - mouseY) / scale;
  let s1 = scale;
  scale += 0.001 * e.deltaY * scale;
  scale = Math.max(0.05, Math.min(1, scale));
  graphPos.x = mouseX + scale * dx - 0.5 * size.width;
  graphPos.y = mouseY + scale * dy - 0.5 * size.height;
  applyTransform(scale, graphPos.x, graphPos.y);
}


function startDrag(e){
  posInit.x = e.clientX;
  posInit.y = e.clientY;
  graphPosInit.x = graphPos.x;
  graphPosInit.y = graphPos.y;
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);
}


function stopDrag(e){
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
  let dx = e.clientX - posInit.x;
  let dy = e.clientY - posInit.y;
  setGraphPos(
    graphPosInit.x + dx,
    graphPosInit.y + dy
  );
}


function setGraphPos(x, y){
  graphPos.x = x;
  graphPos.y = y;
  applyTransform(scale, graphPos.x, graphPos.y);
}


function drag(e){
  let dx = e.clientX - posInit.x;
  let dy = e.clientY - posInit.y;
  setGraphPos(
    graphPosInit.x + dx,
    graphPosInit.y + dy
  );
}


function applyTransform(s, tx, ty){
  graphDom.style.transform = `translate(${tx}px, ${ty}px) scale(${scale}) `;
}


module.exports = {
  init,
  initJSON,
  initNodes
};
