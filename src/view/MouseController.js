class MouseController{
  constructor(view){
    this.view = view;
    this.target = this.view.domElement;

    this.mouseInit = {x:0, y:0};
    this.posInit = {x:0, y:0};

    this._startDragBind = this.startDrag.bind(this);
    this._dragBind = this.drag.bind(this);
    this._stopDragBind = this.stopDrag.bind(this);
    this._zoomBind = this.zoom.bind(this);
  }


  enable(){
    this.target.addEventListener("mousedown", this._startDragBind);
    this.target.addEventListener("mousewheel", this._zoomBind);
  }


  disable(){
    this.target.removeEventListener("mousedown", this._startDragBind);
    this.target.removeEventListener("mousewheel", this._zoomBind);
    document.removeEventListener("mousemove", this._dragBind);
    document.removeEventListener("mouseup", this._stopDragBind);
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
    this.drag(e);//TODO wrong meaning here
  }


  drag(e){
    let dx = e.clientX - this.mouseInit.x;
    let dy = e.clientY - this.mouseInit.y;
    this.view.setPosition(
      this.posInit.x + dx,
      this.posInit.y + dy
    );
  }
}


Object.assign(module.exports, {
  MouseController
});
