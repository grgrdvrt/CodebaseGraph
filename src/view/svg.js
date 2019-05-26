//@doc simple abstraction to build svg elements

const svgns = "http://www.w3.org/2000/svg";

class SVGNode{
  constructor(node){
    this.node = node;
  }

  attr(name, val){
    this.node.setAttributeNS(null, name, val);
    return this;
  }

  attrs(attributes){
    for(let k in attributes){
      this.attr(k, attributes[k]);
    }
    return this;
  }

  add(nodes){
    if(Array.isArray(nodes)){
      nodes.forEach(
        node => this.node.appendChild(node.constructor === SVGNode ? node.node : node)
      );
    }
    else {
      this.node.appendChild(nodes.constructor === SVGNode ? nodes.node : nodes);
    }
    return this;
  }
}

Object.assign(module.exports, {
  create:function(type){return new SVGNode(document.createElementNS(svgns, type));},
  init:function(node){return new SVGNode(node);}
});
