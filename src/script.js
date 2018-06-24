const process = require("process");
const fs = require("fs");
const path = require("path");
var cp = require('child_process');

const commandLineArgs = require("command-line-args");

const fileSystem = require("./app/fileSystem");
const javascript = require("./app/javascript");
const traversing = require("./app/traversing");
const layout = require("./app/layout");

const {View} = require("./view");
const {MouseController} = require("./view/MouseController");

const {
  createNodes,
  createFileNode,
  createJSNode,
  classToDom,
  initNodes,
  getClustersSvg,
  getEdgesSvg
} = require("./view/objects");


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

function getDependencies(data){

  let dependencies = [];
  traversing.traverseFiles(data, ".js", file => {
    dependencies.push(...file.globalDependencies);
  });
  return Array.from(new Set(dependencies));
}


// const optionDefinitions = [
//   { name: "src", type: String, defaultOption: true },
//   { name: "output", alias:"o", type: String},
// ];

// const options = commandLineArgs(optionDefinitions);

const options = {
  src:"src",
  output:"build/result2.dot"
};


let filesHierachy = fileSystem.getFileHierarchy(options.src);
retrieveJsContent(filesHierachy);
resolveImports(filesHierachy);


let view = new View();

let dependencies = getDependencies(filesHierachy);
let domNodes = createNodes(filesHierachy, dependencies);
for(let path in domNodes){
  view.nodesContainer.appendChild(domNodes[path]);
}

let graph = layout.buildGraph(filesHierachy, dependencies);



// {
//   let child = cp.spawn("dot", ['-Tsvg']);

//   child.stdin.write(graph.toString());

//   let result = "";
//   child.stdout.on('finish', function (data) {
//     view.svgDom.innerHTML = data;
//     view.width = this.domElement.clientWidth;
//     view.height = this.domElement.clientHeight;
//   });

//   child.stdout.on('data', function (data) {
//     result += data;
//   });

//   child.stdin.end();
// }



{
  let child = cp.spawn("dot", ['-Tjson']);

  child.stdin.write(graph.toString());

  let result = "";
  child.stdout.on('finish', function (data) {
    let json = JSON.parse(result);
    view.init(json);

    let edgesSvg = getEdgesSvg(json.edges, view);
    edgesSvg.forEach(e => view.svgMain.add(e));

    let clustersSvg = getClustersSvg(json.objects.filter(o => o.compound === "true"), view);
    clustersSvg.forEach(r => view.svgMain.add(r));

    initNodes(domNodes, json, view);

    let controller = new MouseController(view);
    controller.enable();


  });

  child.stdout.on('data', function (data) {
    result += data;
  });

  child.stdin.end();
}
