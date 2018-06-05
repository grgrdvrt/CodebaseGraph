const traversing = require("./traversing");
const dot = require('graphviz-doc-builder');
const path = require('path');
const dagre = require('dagre');
const cables = require('./cables');

function getDependencies(data){

  let dependencies = [];
  traversing.traverseFiles(data, ".js", file => {
      dependencies.push(...file.globalDependencies);
  });
  return Array.from(new Set(dependencies));
}



function layoutGraph(data){
  const dependencies = getDependencies(data);

  const g = new dagre.graphlib.Graph({compound:true});
  g.setGraph({});
  g.setDefaultEdgeLabel(function() { return {}; });

  const dependenciesSubgraph = dependenciesToGraph(g, dependencies);
  const filesSubgraph = packageToGraph(g, data);
  buildLinks(g, data, dependencies);


  dagre.layout(g);

  g.nodes().forEach(v => {
    let node = g.node(v);
    let style = node.dom.style;
    style.top = node.y + "px";
    style.left = node.x + "px";
  });
  // let svgStr = g.edges().map(e => {
  //   console.log(
  //     g.node(e.v),
  //     g.node(e.w)
  //   );
  //   // console.log("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(g.edge(e)));
  //   let ptsStr = g.edge(e).points.map(p => `${p.x},${p.y}`).join(" ");
  //   return `<polyline points="${ptsStr}" stroke="red" stroke-width="4" fill="none" />`;
  // }).join("\n");

  // document.querySelector(".edges").innerHTML = svgStr;

  let recMap = {};
  let rectangles = g.nodes()
      .filter(v => traversing.isLeaf(g.node(v).data))
      .map(v => {
        let node = g.node(v);
        let rect = {id:v, data:data, x:node.x, y:node.y, w:node.width, h:node.height, c:node.color};
        recMap[v] = rect;
        return rect;
      });

  let edges = g.edges().map(e => {
    return {from :recMap[e.v], to:recMap[e.w]};
  });

  cables.drawEdges(rectangles, edges);

  return g;
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
  assignCount(data);
  data.color = dot.color(0.5 * (colorRange.min + colorRange.max), 0.35, 0.99);
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


function packageToGraph(g, data, parent){
  let content;
  switch(data.type){
    case ".js":content = jsFileToGraph(g, data);break;
    case "dir":content = dirToGraph(g, data);break;
    default:content = fileToGraph(g, data);break;
  }
  if(parent){
    g.setParent(content, parent);
  }
  return content;
}


function fileToGraph(g, data){
  document.querySelector(".nodes").appendChild(data.node);
  g.setNode(
    data.path,
    {
      data:data,
      dom:data.node,
      color:data.color,
      width: data.node.offsetWidth,
      height: data.node.offsetHeight
    }
  );
  return data.path;
}


function dirToGraph(g, data){
  let id = data.path === "" ? "/" : data.path;
  // document.querySelector(".nodes").appendChild(data.node);
  g.setNode(
    id,
    {
      data:data,
      dom:data.node,
      color:data.color,
      width: data.node.offsetWidth,
      height: data.node.offsetHeight
    }
  );
  data.children.map(c => packageToGraph(g, c, data.path));
  return id;
}


function gridLayout(children){
}


function jsFileToGraph(g, data){
  document.querySelector(".nodes").appendChild(data.node);
  let size = data.node.getBoundingClientRect();
  g.setNode(
    data.path,
    {
      data:data,
      dom:data.node,
      color:data.color,
      width:size.width,
      height:size.height
    }
  );
  return data.path;
}



function dependenciesToGraph(g, dependencies){

  const depsNode = g.setNode("dependencies", {data:{type:"dir"}, dom:document.createElement("div"),  width: 144, height: 100    });
  dependencies.forEach(dep => {
    g.setNode(dep, { data:{type:".js"}, dom:document.createElement("div"),  width: 144, height: 100 });

    g.setParent(dep, "dependencies");
  });

}


function buildLinks(g, data, dependencies){

  // let importsLinks = [];
  traversing.traverseFiles(data, ".js", file => {
    const fileLinks = file.localDependencies.map(to => {
      const from = file.path;
      const constraint = dependencies.indexOf(to) === -1;
      const toFile = traversing.find(data, to);
      let hsv;
      if(toFile){
        hsv = toFile.color.clone().setS(0.5);
      }
      else {
        hsv = dot.color();
      }
      let hsv2 = file.color.clone().setS(0.5);
      g.setEdge(from , to);
    });
    // importsLinks.push(...fileLinks);
  });

  // return importsLinks;
}

Object.assign(module.exports, {
  layoutGraph
});
