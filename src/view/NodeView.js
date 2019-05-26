class NodeView{
  constructor(data, dom){
    this.data = data;
    this.dom = dom;
  }

  focus(){
    this.dom.style.backgroundColor = this.color;
    Object.assign(this.dom.style, this.style);
  }

  blur(){
    if(!this.style){
      this.style = Object.assign({}, this.dom.style);
    }
    Object.assign(this.dom.style, {
      color : "black",
      borderColor : "black",
      backgroundColor : "white"
    });
  }
}


Object.assign(module.exports, {
  NodeView
});
