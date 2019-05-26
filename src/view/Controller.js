//@doc manages interactions with mouse and keyboard

const openInEditor = require('open-in-editor');
const editor = openInEditor.configure({
  editor:"code"
}, function(err) {
  console.error('Something went wrong: ' + err);
});

// const openEditor = require('open-editor');



class Controller{
  constructor(view){
    this.view = view;
    this.target = this.view.domElement;

    this.mouseInit = {x:0, y:0};
    this.posInit = {x:0, y:0};

    this.isDragging = false;

    this.selectedNode = undefined;

    this._startDragBind = this.startDrag.bind(this);
    this._dragBind = this.drag.bind(this);
    this._stopDragBind = this.stopDrag.bind(this);
    this._zoomBind = this.zoom.bind(this);
    this._clickBind = this.onClick.bind(this);

    this._keyDownBind = this.onKeyDown.bind(this);
    this._keyUpBind = this.onKeyUp.bind(this);

    this.disableOpenClick();
  }


  enable(){
    document.addEventListener("mousedown", this._startDragBind);
    document.addEventListener("mousewheel", this._zoomBind);

    document.addEventListener("keydown", this._keyDownBind);
    document.addEventListener("keyup", this._keyUpBind);

    document.addEventListener("click", this._clickBind);
  }


  disable(){
    document.removeEventListener("mousedown", this._startDragBind);
    document.removeEventListener("mousewheel", this._zoomBind);
    document.removeEventListener("mousemove", this._dragBind);
    document.removeEventListener("mouseup", this._stopDragBind);

    document.removeEventListener("keydown", this._keyDownBind);
    document.removeEventListener("keyup", this._keyUpBind);

    document.removeEventListener("click", this._clickBind);
  }


  onKeyDown(e){
    switch(e.key){
      case "Alt":this.enableOpenClick(); break;
      default:break;
    }
  }

  onKeyUp(e){
    switch(e.key){
      case "Alt":this.disableOpenClick(); break;
      default:break;
    }
  }


  enableOpenClick(){
    this.view.domElement.classList.remove("js-blockOpenClick");
  }

  disableOpenClick(){
    this.view.domElement.classList.add("js-blockOpenClick");
  }


  zoom(e){
    let mouse = {
      x:e.clientX,
      y:e.clientY,
    };
    let scale = this.view.scale;

    let dx = (this.view.x + 0.5 * this.view.width - mouse.x) / scale;
    let dy = (this.view.y + 0.5 * this.view.height - mouse.y) / scale;

    scale += 0.001 * e.deltaY * scale;
    scale = Math.max(0.05, Math.min(1, scale));

    this.view.setPosition(
      mouse.x + scale * dx - 0.5 * this.view.width,
      mouse.y + scale * dy - 0.5 * this.view.height
    );
    this.view.setScale(scale);

    this.zoomedData = undefined;
  }


  startDrag(e){
    this.mouseInit.x = e.clientX;
    this.mouseInit.y = e.clientY;
    this.posInit.x = this.view.x;
    this.posInit.y = this.view.y;
    document.addEventListener("mousemove", this._dragBind);
    document.addEventListener("mouseup", this._stopDragBind);
  }


  stopDrag(e){
    document.removeEventListener("mousemove", this._dragBind);
    document.removeEventListener("mouseup", this._stopDragBind);
    //FIXME hack
    this.drag(e);
  }


  drag(e){
    let dx = e.clientX - this.mouseInit.x;
    let dy = e.clientY - this.mouseInit.y;
    this.view.setPosition(
      this.posInit.x + dx,
      this.posInit.y + dy
    );
  }



  onClick(e){
    //FIXME hack to avoid click when stop drag
    if(this.mouseInit.x !== e.clientX || this.mouseInit.y !== e.clientY){
      return;
    }

    if(e.target.classList.contains("node")){

      // this.view.focus(e.target);
      this.view.localMode(e.target);
    }
    else if(e.target.classList.contains("package")){
      this.showNode(e.target);
    }
    else if(e.target.dataset.loc !== undefined){
      let parentObj = e.target.parentNode;
      //FIXME hack
      while(parentObj && parentObj.dataset.path === undefined){
        parentObj = parentObj.parentNode;
      }

      console.log(parentObj.dataset.path + ":" + e.target.dataset.loc);
      editor.open(parentObj.dataset.path + ":" + e.target.dataset.loc);
      // openEditor([{
      //   file:parentObj.dataset.path,
      //   line:e.target.dataset.loc
      // }]);
    }
    else {
      this.view.setAllMode();
    }
  }




  showNode(node){

    let nw = node.offsetWidth;
    let nh = node.offsetHeight;
    let nx = parseInt(node.style.left);
    let ny = parseInt(node.style.top);

    let ww = window.innerWidth;
    let wh = window.innerHeight;
    let vw = this.view.width;
    let vh = this.view.height;


    let scale;
    if(this.zoomedData !== undefined && this.zoomedData.node === node){
      scale = this.zoomedData.scale;
      this.zoomedData = undefined;
    }
    else {
      scale = Math.min(ww / nw, wh / nh);
      scale = Math.max(0.05, Math.min(1, scale));
    }


    let x = 0.5 * ((ww - vw) - scale * (nw - vw)) - scale * nx;
    let y = 0.5 * ((wh - vh) - scale * (nh - vh)) - scale * ny;

    this.zoomedData = {
      node:node,
      scale:this.view.scale
    };

    TweenLite.to(this.view, 0.5, {x, y, scale, onUpdate:v => {
      this.view.applyTransform();
    }});
  }

}


Object.assign(module.exports, {
  Controller
});
