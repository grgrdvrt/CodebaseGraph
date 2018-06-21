const path = require("path");

const traversing = require("../traversing");

const svg = require("./svg");

const openInEditor = require('open-in-editor');
const editor = openInEditor.configure({
  // cmd:"/Applications/Emacs.app/Contents/MacOS/Emacs",
  editor:"code"
}, function(err) {
  console.error('Something went wrong: ' + err);
});


let graphDom = document.createElement("div");
document.body.appendChild(graphDom);
graphDom.classList.add("graphDom");

let svgDom = document.createElement("div");
graphDom.appendChild(svgDom);

let nodesContainer = document.createElement("div");
graphDom.appendChild(nodesContainer);
nodesContainer.classList.add("nodesContainer");


let posInit = {x:0, y:0};
let graphPos = {x:0, y:0};
let graphPosInit = {x:undefined, y:undefined};
let scale = 1;
let size = {width:undefined, height:undefined};

function init(contentStr){
  svgDom.innerHTML = contentStr;
  size.width = graphDom.clientWidth;
  size.height = graphDom.clientHeight;
  let nodes = {};
  document.querySelectorAll(".node title").forEach(title => {
    nodes[title.textContent] = title.parentNode;
  });
  // console.log(nodes);

  initMouse();
}



function initJSON(json, nodesMap){
  console.log(json);

  let s = json.bb.split(",");
  size.width = s[2];
  size.height = s[3];

  let svgMain = svg.create("svg");
  svgDom.appendChild(svgMain.node);


  let result = getEdgesSvg(json.edges);
  result.forEach(e => svgMain.add(e));
  // svgMain.node.innerHTML = result;

  json.objects.filter(o => o.nodes === undefined).forEach(obj => {
    let node = nodesMap[obj.name];
    if(node === undefined)return;
    let pos = obj.pos.split(",").map(Number);
    Object.assign(node.style, {
      left:Math.round(pos[0] - 72 * 0.5 * Number(obj.width)) + "px",
      top:Math.round((size.height - (pos[1] + 72 * 0.5 * Number(obj.height)))) + "px",
      borderColor : HSVColorToString(obj.color),
      backgroundColor : HSVColorToString(obj.fillcolor || "0 0 0")
    });
  });


  let clustersSvg = getClustersSvg(json.objects.filter(o => o.compound === "true"));
  clustersSvg.forEach(r => svgMain.add(r));


  svgMain.attrs({
    width:size.width,
    height:size.height
  });
  initMouse();
  center();
}


function HSVColorToString(color){
  return HSLToString(HSVToHSL(color.split(" ").map(Number)));
}

function HSVToHSL(hsv){
  //from https://gist.github.com/xpansive/1337890
  let h = 2 - hsv[1] * hsv[2];
  return {
    h : hsv[0],
    s : hsv[1] * hsv[2]/(h < 1 ? h : 2 - h),
    l:h / 2
  };
}


function HSLToString(hsl){
  let h = Math.round(hsl.h * 360);
  let s = Math.round(hsl.s * 100);
  let l = Math.round(hsl.l * 100);
  return `hsl(${h}, ${s}%, ${l}%)`;
}


function initNodes(data, dependencies){
  let nodesMap = {};
  traversing.traverseFiles(data, undefined, f => {
    if(f.type === ".js"){
      let node = createJSNode(f);
      nodesMap[f.path] = node;
      f.dom = node;
      nodesContainer.appendChild(node);
    }
    else if(f.type !== "dir"){
      let node = createFileNode(f);
      nodesMap[f.path] = node;
      f.dom = node;
      nodesContainer.appendChild(node);
    }
  });

  dependencies.forEach(dep => {
    let node = createFileNode(dep);
    dep.dom = node;
    nodesContainer.appendChild(node);
  });
  return nodesMap;
}


function getEdgesSvg(edges){
  let result = [];
  edges.forEach(e => {

    let draws = e["_draw_"];
    if(!draws) return;
    let paths = draws.filter(d => d.points).map((d, i) => {
      let color = draws[2 * i].color;
      let pts = d.points.map(pt => {
        return `${pt[0]},${size.height - pt[1]}`;
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


function getClustersSvg(clusters){
  return clusters.map(cluster => {
    let bb = cluster.bb.split(",").map(Number);
    let w = bb[2] - bb[0];
    let h = bb[3] - bb[1];
    return svg.create("rect").attrs({
      x:bb[0],
      y:size.height - bb[1] - h,
      width:w,
      height:h,
      fill:"none",
      stroke:"black",
      "stroke-width":2
    });
  });
}


function createFileNode(data){
  let node = document.createElement("div");
  node.classList.add("fileNode");
  node.filePath = data.absolutePath;

  node.innerHTML = `<span class="fileName" data-loc="0">${data.name}</span>`;
  return node;
}

function createJSNode(data){
  let node = document.createElement("div");
  node.classList.add("jsNode");
  node.filePath = data.absolutePath;

  const classesStrs = data.content.classes.map(classToDom);
  // const imports = data.content.imports.map(i => i.modulePath).join("<br>");

  let fileName = `<span class="fileName" data-loc="0">${data.name}</span>`;
  node.innerHTML = fileName + "<br>" + classesStrs.join("<br>");
  return node;
}


function classToDom(classDeclaration){
  const d = classDeclaration;
  const methods = d.methods.map(m => `<span class="method" data-loc="${m.loc.line}:${m.loc.column}">${m.name}(${m.params.join(",&nbsp;")})</span>`);
  let str = "";
  str += `<span class="className" data-loc="${d.loc.line}:${d.loc.column}">${d.name}${d.superclass === null ? '' : '&nbsp;extends&nbsp;' + d.superclass}</span><br>`;
  str += methods.join("<br>");
  return str;
}




function center(){
  graphPos.x = 0.5 * (window.innerWidth - size.width);
  graphPos.y = 0.5 * (window.innerHeight - size.height);
  let sx = size.width / window.innerWidth;
  let sy = size.height / window.innerHeight;
  scale = 1 / Math.max(sx, sy);
  applyTransform(scale, graphPos.x, graphPos.y);
}

//MOUSE INTERACTION

function initMouse(){
  document.addEventListener("mousedown", startDrag);
  document.addEventListener("mousewheel", zoom);


  document.addEventListener("click", e => {
    if(e.target.dataset.loc !== undefined){
      console.log(e.target.parentNode.filePath + ":" + e.target.dataset.loc);
      editor.open(e.target.parentNode.filePath + ":" + e.target.dataset.loc);
    }
  });
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
