const path = require("path");

const traversing = require("../app/traversing");

const svg = require("./svg");

const openInEditor = require('open-in-editor');
const editor = openInEditor.configure({
  // cmd:"/Applications/Emacs.app/Contents/MacOS/Emacs",
  editor:"code"
}, function(err) {
  console.error('Something went wrong: ' + err);
});




class View{
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

    this.nodesContainer = document.createElement("div");
    this.nodesContainer.classList.add("nodesContainer");
    this.domElement.appendChild(this.nodesContainer);


    document.addEventListener("click", this.onClick);
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


  onClick(e){
    if(e.target.dataset.loc !== undefined){
      let parentObj = e.target.parentNode;
      //FIXME hack
      while(parentObj && parentObj.dataset.path === undefined){
        parentObj = parentObj.parentNode;
      }

      console.log(parentObj.dataset.path + ":" + e.target.dataset.loc);
      editor.open(parentObj.dataset.path + ":" + e.target.dataset.loc);
    }
  }

  setScale(scale){
    this.scale = scale;
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
