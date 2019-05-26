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
  initNode,
  getClusterNode,
  getEdgesSvg
} = require("./view/objects");


function retrieveJsContent(filesHierachy){
  traversing.traverseFiles(filesHierachy, /\.jsx?$/, file => {
    const data = fs.readFileSync(file.absolutePath, "utf8");
    file.content = javascript.getFileContent(file, data);
  });
}


function resolveImports(filesHierachy){

  traversing.traverseFiles(filesHierachy, /\.jsx?$/, file => {

    const localDependencies = new Set();
    const externalDependencies = new Set();

    file.content.imports.forEach(importInfos => {

      const isRelative = importInfos.modulePath.indexOf(".") === 0;
      let modulePath;
      if(isRelative){
        modulePath = path.join(path.parse(file.path).dir, importInfos.modulePath);
      }
      else {
        modulePath = importInfos.modulePath;
      }


      let importedFile = traversing.find(filesHierachy, modulePath) ||
        traversing.find(filesHierachy, modulePath + ".js") ||
        traversing.find(filesHierachy, modulePath + ".jsx") ||
        traversing.find(filesHierachy, path.join(modulePath, "index.js"));

      if(importedFile === null){
        externalDependencies.add(modulePath);
      }
      else {
        localDependencies.add(importedFile.path);
      }

      return modulePath;

    });

    file.localDependencies = Array.from(localDependencies);
    file.externalDependencies = Array.from(externalDependencies);
  });
}

function getExternalDependencies(data){

  let dependencies = [];
  traversing.traverseFiles(data, /\.jsx?$/, file => {
    dependencies.push(...file.externalDependencies);
  });
  return Array.from(new Set(dependencies))
    .map(path => externalDependency(path));
}




let browseBtn = document.createElement("button");
browseBtn.innerText = "select project";
document.body.appendChild(browseBtn);


const {remote} = require('electron');
browseBtn.addEventListener('click', _ => {
  let result = remote.dialog.showOpenDialog({
    properties:['openDirectory']
  });
  displayGraph(result[0]);
});



function displayGraph(src){

  let filesHierachy = fileSystem.getFileHierarchy(src);
  retrieveJsContent(filesHierachy);
  resolveImports(filesHierachy);


  let view = new View();
  document.body.appendChild(view.domElement);

  let externalDependencies = getExternalDependencies(filesHierachy);
  let domNodes = createNodes(filesHierachy, externalDependencies);
  view.setNodesMap(domNodes);

  let graph = layout.buildGraph(filesHierachy, externalDependencies);


  let child = cp.spawn("dot", ['-Tjson'], {stdio:['pipe' ,'pipe', 'pipe']});
  child.stdin.setEncoding= "utf-8";


  let result = "";
  child.on('close', function (data) {
    let json = JSON.parse(result);
    console.log(json);
    view.init(json);

    let edgesSvg = getEdgesSvg(json.edges, view);
    edgesSvg.forEach(e => view.svgMain.add(e));

    let clustersNodes = json.objects.filter(o => o.compound === "true")
        .map(cluster => getClusterNode(cluster, view));
    clustersNodes.forEach(node => view.packagesContainer.appendChild(node));


    json.objects.filter(o => o.nodes === undefined).forEach(obj => {
      initNode(domNodes[obj.name], obj, view);
    });

    let controller = new Controller(view);
    controller.enable();

    console.log(filesHierachy);

  });

  child.stdout.on('data', function (data) {
    result += data;
  });

  child.stdout.on('error', function(err){
    console.error(err);
  });

  child.stdin.write(graph.toString());
  child.stdin.end();
}

