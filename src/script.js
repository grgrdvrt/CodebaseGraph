const process = require("process");
const fs = require("fs");
const path = require("path");
var cp = require('child_process');

const commandLineArgs = require("command-line-args");

const fileSystem = require("./fileSystem");
const javascript = require("./javascript");
const traversing = require("./traversing");
const layout = require("./layout");
const view = require("./view/view");

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
  // src:"src",
  // src:"/Users/gregoire/Documents/projets/HAVAS_PARIS/veolia-parcours-de-leau/src/js",
  src:"/Users/gregoire/Documents/projets/sobieski/src/js",
  output:"build/result2.dot"
};


let filesHierachy = fileSystem.getFileHierarchy(options.src);
retrieveJsContent(filesHierachy);
resolveImports(filesHierachy);

let dependencies = getDependencies(filesHierachy);
let domNodes = view.initNodes(filesHierachy, dependencies);

let graph = layout.buildGraph(filesHierachy, dependencies);



// {
//   let child = cp.spawn("dot", ['-Tsvg']);

//   child.stdin.write(graph.toString());

//   let result = "";
//   child.stdout.on('finish', function (data) {
//     view.init(result);
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
    view.initJSON(JSON.parse(result), domNodes);
  });

  child.stdout.on('data', function (data) {
    result += data;
  });

  child.stdin.end();
}
