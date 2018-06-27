const process = require("process");
const fs = require("fs");
const path = require("path");
var cp = require('child_process');

const commandLineArgs = require("command-line-args");

const fileSystem = require("./app/fileSystem");
const javascript = require("./app/javascript");
const traversing = require("./app/traversing");
const layout = require("./app/layout");

const {
  file,
  externalDependency
} = require("./app/fileSystem");

const {View} = require("./view/View");
const {Controller} = require("./view/Controller");


const {
  createNodes,
  createFileNode,
  createJSNode,
  classToDom,
  initNodes,
  getClustersNodes,
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

function getExternalDependencies(data){

  let dependencies = [];
  traversing.traverseFiles(data, ".js", file => {
    dependencies.push(...file.globalDependencies);
  });
  return Array.from(new Set(dependencies))
    .map(path => externalDependency(path));
}


let src = "src";


let filesHierachy = fileSystem.getFileHierarchy(src);
retrieveJsContent(filesHierachy);
resolveImports(filesHierachy);


let view = new View();

let externalDependencies = getExternalDependencies(filesHierachy);
let domNodes = createNodes(filesHierachy, externalDependencies);
for(let path in domNodes){
  view.nodesContainer.appendChild(domNodes[path]);
}

let graph = layout.buildGraph(filesHierachy, externalDependencies);






let child = cp.spawn("dot", ['-Tjson']);

child.stdin.write(graph.toString());

let result = "";
child.stdout.on('finish', function (data) {
  let json = JSON.parse(result);
  view.init(json);

  let edgesSvg = getEdgesSvg(json.edges, view);
  edgesSvg.forEach(e => view.svgMain.add(e));

  // let clustersSvg = getClustersSvg(json.objects.filter(o => o.compound === "true"), view);
  // clustersSvg.forEach(r => view.svgMain.add(r));

  let clustersNodes = getClustersNodes(json.objects.filter(o => o.compound === "true"), view);
  clustersNodes.forEach(node => view.packagesContainer.appendChild(node));


  initNodes(domNodes, json, view);

  let controller = new Controller(view);
  controller.enable();


});

child.stdout.on('data', function (data) {
  result += data;
});

child.stdin.end();
