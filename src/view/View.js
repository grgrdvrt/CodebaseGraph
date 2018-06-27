const path = require("path");

const traversing = require("../app/traversing");

const svg = require("./svg");


class View {
  constructor(){

    this.scale = 1;
    this.width = 0;
    this.height = 0;
    this.x = 0;
    this.y = 0;

    this.domElement = document.createElement("div");
    this.domElement.classList.add("graphDom");
    document.body.appendChild(this.domElement);

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


}



module.exports = {
  View
};
