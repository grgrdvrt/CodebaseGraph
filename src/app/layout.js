//@doc transforms files hierarchy to dot graph

const traversing = require("./traversing");
const dot = require('graphviz-doc-builder');
const path = require('path');




function randomColor(){
  return dot.color(
    Math.random(),
    Math.random() * 0.3 + 0.1,
    1
  );
}


function buildGraph(data, dependencies){
  assignColor(data, {min:0, max:1});

  const dependenciesSubgraph = dependenciesToDot(dependencies);
  const filesSubgraph = packageToDot(data);
  const graph = dot.graph()
        .setParams({
          graph : {
            rankdir : "TB",
            fontname : "helvetica",
            fontcolor:"#111111",
            compound:true
          },
          node : {
            fontsize : "20",
            fontname : "helvetica",
            fontcolor:"#111111",
          },
          edge : {
            fontname : "helvetica",
            fontcolor:"#111111"
          },
          isOriented:true
        }).setAttributes({
          dpi:72,
        }).add(
          dependenciesSubgraph,
          filesSubgraph,
          ...buildLinks(data, dependencies),
        );

  let firstDependency = dependenciesSubgraph.getFirstNode();
  let firstFile = filesSubgraph.getFirstNode();
  if(firstDependency !== null && firstFile !== null){
    graph.add(
      dot.edge(
        firstDependency.id,
        firstFile.id
      ).setAttributes({
        ltail:dependenciesSubgraph.id,
        lhead:filesSubgraph.id,
        style:"invis"
      })
    );
  }

  return graph;
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


function packageToDot(data){
  let content;
  switch(data.type){
    case ".js":content = jsFileToDot(data);break;
    case "dir":content = dirToDot(data);break;
    default:content = fileToDot(data);break;
  }
  return content;
}


function fileToDot(data){
  return dot.node(path.basename(data.path), data.path)
    .setAttributes({
      fixedsize:true,
      width:data.view.dom.offsetWidth * 1/72,
      height:data.view.dom.offsetHeight * 1/72,
      style:"solid",
      shape:"note",
      margin : 0
    });
}


function dirToDot(data){
  return dot.subgraph(data.path)
    .setParams({
      node:{
        style:"filled",
        color:data.color
      },
      isCluster:true
    })
    .setAttributes({
      shape:"folder",
      margin:0,
      // fontsize:30,
      labeljust:"l"
    }).add(
      ...data.children.map(packageToDot),
      ...gridLayout(data.children)
    );
}


function gridLayout(children){
  const jsFiles = children.filter(child => child.type === ".js");
  const n = jsFiles.length;
  let links = [];
  if(n < 10){
    return links;
  }
  let nCols = Math.ceil(Math.sqrt(n));
  for(let i = nCols; i < n; i++){
    const from = jsFiles[i - nCols].path;
    const to = jsFiles[i].path;
    links.push(
      dot.edge(from, to)
        .setAttributes({style:"invis"})
    );
  }
  return links;
}


function jsFileToDot(data){
  const classesCells = data.content.classes.map(classToDot);
  const imports = data.content.imports.map(i => i.path).join("\\n");
  const hsv = dot.color(data.color.h, 0.8, 0.8);

  return dot.record([dot.labelCell(path.basename(data.path)), ...classesCells], data.path)
    .setAttributes({
      fixedsize:true,
      width:data.view.dom.offsetWidth * 1/72,
      height:data.view.dom.offsetHeight * 1/72,
      style:"filled,solid",
      color:hsv,
      fillcolor:data.color,
      margin : 0
    });
}



function dependenciesToDot(dependencies){
  return dot.subgraph("dependencies")
    .setAttributes({
      rank : "source",
      fontsize : 30,
      labeljust : "l"
    }).setParams({isCluster:true})
    .add(
      ...(dependencies.map(dep => {
        return dot.node(dep.path, dep.path)
          .setAttributes({
            fixedsize:true,
            width:dep.view.dom.offsetWidth * 1/72,
            height:dep.view.dom.offsetHeight * 1/72,
            shape:"rectangle"});
      }))
    );
}

function classToDot(classDeclaration){
  const d = classDeclaration;
  const methods = d.methods.map(m => `${m.name}(${m.params.join(", ")})`);
  let str = "";
  str += d.name;
  str += (d.superclass === null ? '' : ' extends ' + d.superclass) + "\\n";
  str += methods.join("\\n");
  return dot.labelCell(str);
}


function buildLinks(data, dependencies){

  let importsLinks = [];
  traversing.traverseFiles(data, /\.jsx?$/, file => {
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
      return dot.edge(from, to).setAttributes({
        constraint:constraint,
        color:`${hsv.toString()};0.9:${hsv2.toString()};0.1`
      });
    });
    importsLinks.push(...fileLinks);
  });

  return importsLinks;
}

Object.assign(module.exports, {
  buildGraph
});
