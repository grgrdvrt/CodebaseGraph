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
  // src:"src",
  // src:"/Users/gregoire/Documents/projets/HAVAS_PARIS/veolia-parcours-de-leau/src/js",
  src:"/Users/gregoire/Documents/projets/sobieski/src/js",
  output:"build/result2.dot"
};


let filesHierachy = fileSystem.getFileHierarchy(options.src);
retrieveJsContent(filesHierachy);
resolveImports(filesHierachy);
let graph = rendering.buildGraph(filesHierachy);


const { Module, render } = require('viz.js/full.render.js');


var cp = require('child_process');
var child = cp.spawn("dot", ['-Tsvg']);

child.stdin.write(graph.toString());

let result = "";
child.stdout.on('finish', function (data) {
  initDom(result);
});
child.stdout.on('data', function (data) {
  result += data;
});

child.stdin.end();


function initDom(contentStr){
  document.body.innerHTML = contentStr;
  let nodes = {};
  document.querySelectorAll(".node title").forEach(title => {
    nodes[title.textContent] = title.parentNode;
  });
  console.log(nodes);

  document.addEventListener("click", e => console.log(e.target));
}

// fs.writeFile(options.output, graph.toString(), function(err) {
//   if(err) {
//     return console.log(err);
//   }

//   console.log(`The file was saved in ${options.output}`);
// });
