//@doc displays the graph

const path = require("path");

const traversing = require("../app/traversing");

const svg = require("./svg");

const modes = {
  DEPENDENCIES:"dependencies",
  BACK_DEPENDENCIES:"backDependencies",
  ALL:"all",
};

class View {
  constructor(){

    this.scale = 1;
    this.width = 0;
    this.height = 0;
    this.x = 0;
    this.y = 0;

    this.buildDom();

    this.mode = modes.ALL;
  }


  buildDom(){
    this.domElement = document.createElement("div");
    this.domElement.classList.add("graphDom");

    this.svgDom = document.createElement("div");
    this.domElement.appendChild(this.svgDom);

    this.svgMain = svg.create("svg");
    this.svgDom.appendChild(this.svgMain.node);

    this.packagesContainer = document.createElement("div");
    this.packagesContainer.classList.add("packagesContainer");
    this.domElement.appendChild(this.packagesContainer);

    this.nodesContainer = document.createElement("div");
    this.nodesContainer.classList.add("nodesContainer");
    this.domElement.appendChild(this.nodesContainer);
  }


  init(json){

    let s = json.bb.split(",");
    this.width = s[2];
    this.height = s[3];

    this.svgMain.attrs({
      width:this.width,
      height:this.height
    });
    this.center();
  }


  setScale(scale){
    this.scale = Math.max(0.05, Math.min(1, scale));
    this.applyTransform();
  }


  setPosition(x, y){
    this.x = x;
    this.y = y;
    this.applyTransform();
  }


  center(){
    this.x = 0.5 * (window.innerWidth - this.width);
    this.y = 0.5 * (window.innerHeight - this.height);

    let sx = this.width / window.innerWidth;
    let sy = this.height / window.innerHeight;
    this.scale = 1 / Math.max(sx, sy);

    this.applyTransform();
  }


  applyTransform(){
    this.domElement.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.scale}) `;
  }


  setNodesMap(nodesMap){
    this.nodesMap = nodesMap;
    for(let path in this.nodesMap){
      this.nodesContainer.appendChild(this.nodesMap[path].dom);
    }
  }


  focus(node){
    this.blur();
    let view = node.view;
    view.focus();
    view.data.localDependencies.forEach(depName => this.nodesMap[depName].focus());
  }


  blur(){
    for(let path in this.nodesMap){
      this.nodesMap[path].blur();
    }
  }


  localMode(target){
    switch(this.mode){
      case modes.ALL:
        this.setDependenciesMode(target);
        break;
      case modes.DEPENDENCIES:
        if(target === this.target){
          this.setBackDependenciesMode(target);
        }
        else {
          this.setDependenciesMode(target);
        }
        break;
      case modes.BACK_DEPENDENCIES:
        this.setAllMode();
        break;
    }
  }

  setAllMode(){
    this.mode = modes.ALL;
    for(let path in this.nodesMap){
      this.nodesMap[path].focus();
    }
  }

  setDependenciesMode(target){
    this.mode = modes.DEPENDENCIES;
    this.target = target;
    this.focus(target);
  }

  setBackDependenciesMode(target){
    this.mode = modes.BACK_DEPENDENCIES;
    this.target = target;

    this.blur();
    let view = target.view;
    view.focus();

    for(let path in this.nodesMap){
      let node = this.nodesMap[path];
      if(node.data.localDependencies && node.data.localDependencies.indexOf(view.data.path) !== -1){
        node.focus();
      }
    }
  }
}



module.exports = {
  View
};
