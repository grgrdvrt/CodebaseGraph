const process = require("process");
const fs = require("fs");
const path = require("path");

const commandLineArgs = require("command-line-args");

const fileSystem = require("./fileSystem");
const javascript = require("./javascript");
const traversing = require("./traversing");
const rendering = require("./rendering");

function retrieveJsContent(filesHierachy){
  traversing.traverseFiles(filesHierachy, ".js", file => {
    const data = fs.readFileSync(file.absolutePath, "utf8");
    file.content = javascript.getFileContent(file, data);
  });
}

function resolveImports(filesHierachy){

  traversing.traverseFiles(filesHierachy, ".js", file => {

    const localDependencies = new Set();
    const globalDependencies = new Set();

    file.content.imports.forEach(importInfos => {

      const isRelative = importInfos.modulePath.indexOf(".") === 0;
      let modulePath;
      if(isRelative){
        modulePath = path.join(path.parse(file.path).dir, importInfos.modulePath);
      }
      else {
        modulePath = importInfos.modulePath;
      }


      let importedFile = traversing.find(filesHierachy, modulePath);
      if(importedFile === null){
        importedFile = traversing.find(filesHierachy, modulePath + ".js");
      }
      if(importedFile === null){
        importedFile = traversing.find(filesHierachy, path.join(modulePath, "index.js"));
      }

      if(importedFile === null){
        globalDependencies.add(modulePath);
      }
      else {
        localDependencies.add(importedFile.path);
      }

      return modulePath;

    });

    file.localDependencies = Array.from(localDependencies);
    file.globalDependencies = Array.from(globalDependencies);

  });
}



// const optionDefinitions = [
//   { name: "src", type: String, defaultOption: true },
//   { name: "output", alias:"o", type: String},
// ];

// const options = commandLineArgs(optionDefinitions);

const options = {
  src:"/Users/gregoire/Documents/projets/HAVAS_PARIS/veolia-parcours-de-leau/src/js",
  // src:"src",
  output:"build/result2.dot"
};


let filesHierachy = fileSystem.getFileHierarchy(options.src);
retrieveJsContent(filesHierachy);
resolveImports(filesHierachy);
let graph = rendering.buildGraph(filesHierachy);





const graphlibDot = require('graphlib-dot');
const d3 = require('d3');
const dagreD3 = require('dagre-d3');
var exec = require('child_process').exec;



// Set up zoom support
var svg = d3.select("svg"),
    inner = d3.select("svg g"),
    zoom = d3.zoom().on("zoom", function() {
      inner.attr("transform", d3.event.transform);
    });
svg.call(zoom);

// Create and configure the renderer
var render = dagreD3.render();

var str = graph.toString();
console.log(str);
var g = graphlibDot.read(str);

// Set margins, if not present
if (!g.graph().hasOwnProperty("marginx") &&
    !g.graph().hasOwnProperty("marginy")) {
  g.graph().marginx = 20;
  g.graph().marginy = 20;
}

g.graph().transition = function(selection) {
  return selection.transition().duration(500);
};

// Render the graph into svg g
d3.select("svg g").call(render, g);


let nodes = document.querySelectorAll(".node");

nodes.forEach(node => {
  node.addEventListener("click", e => {
    console.log(e.currentTarget);
    exec(`open ${options.src}/App.js +100`);
  });
});
