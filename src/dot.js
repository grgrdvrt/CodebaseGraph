/*
  provides an interface to build dot documents for graphviz
  based on https://graphviz.gitlab.io/_pages/doc/info/lang.html
*/


let id = 0;
function genId() {
  return id++;
}


function tabs(n) {
  let str = "";
  for(let i = 0; i < n; i++) {
    str += "\t";
  }
  return str;
}


function attributesToString(attributes) {
  const aList = formatAList(attributes);
  if(aList.length === 0) {
    return "";
  }
  else {
    return `[${aList.join("; ")}]`;
  }
}


function formatAList(attributes) {
  let list = [];
  for(let attrName in attributes) {
    const value = attributes[attrName];
    if(value !== undefined && value.toString() !== "") {
      list.push(attrName + " = \"" + value.toString() + "\"");
    }
  }
  return list;
}


function typeParamsToString(type, params) {
  const aList = formatAList(params);
  if(aList.length === 0) {
    return "";
  }
  else {
    return `${type} [${aList.join("; ")}]`;
  }
}



class Color {
  constructor(h, s, v) {
    this.set(h, s, v);
  }

  set(h = 0, s = 0, v = 0) {
    this.h = h;
    this.s = s;
    this.v = v;
  }

  setH(h) {
    this.h = h;
    return this;
  }

  setS(s) {
    this.s = s;
    return this;
  }

  setV(v) {
    this.v = v;
    return this;
  }

  clone() {
    return new Color(this.h, this.s, this.v);
  }

  toString() {
    const format = v => v.toFixed(4).toString();
    return [this.h, this.s, this.v].map(format).join(" ");
  }
}



class LabelCell {
  constructor(label) {
    this.label = label;
    this._id = genId();
  }

  get id() {
    if(this.nodeId === undefined) {
      console.warn("a Cell should be added to a Record or to another Cell before being used");
    }
    return `${this.nodeId}:${this._id}`;
  }

  setNodeId(nodeId) {
    this.nodeId = nodeId;
  }

  toString() {
    return `<${this._id}> ${this.label}`;
  }
}



class Cell {
  constructor(cells, id) {
    this._id = id === undefined ? genId() : id;
    this.nodeId = undefined;
    this.cells = [];
    this.add(...cells);
  }

  get id() {
    if(this.nodeId === undefined) {
      console.warn("a Cell should be added to a Record or to another Cell before being used");
    }
    return `${this.nodeId}:${this._id}`;
  }

  setNodeId(nodeId) {
    this.nodeId = nodeId;
    this.cells.forEach(cell => cell.setNodeId(this.nodeId));
  }

  add(...cells) {
    cells.forEach(cell => cell.setNodeId(this.nodeId));
    this.cells.push(...cells);
    return this;
  }

  toString() {
    let label;
    if(this.cells.length > 1) {
      return ` {${this.cells.map(cell => cell.toString()).join("|")}}`;
    }
    else {
      return `<${this._id}> ${label}`;
    }
  }
}



class Record {
  constructor(cells, id) {
    this.id = id === undefined ? genId() : id;
    this.attributes = {};
    this.cells = [];
    this.add(...cells);
  }

  setAttributes(attributes) {
    Object.assign(this.attributes, attributes);
    return this;
  }

  add(...cells) {
    cells.forEach(cell => cell.setNodeId(this.id));
    this.cells.push(...cells);
    return this;
  }

  toString() {
    let label;
    if(this.cells.length > 1) {
      label = ` {${this.cells.map(cell => cell.toString()).join("|")}}`;
    }
    else if (this.cells.length === 1) {
      label = this.cells[0].toString();
    }
    const attributes = Object.assign({}, this.attributes, {label:label, shape:"record"});
    let attrsStr = attributesToString(attributes);
    return `"${this.id}"${(attrsStr === "" ? "" : " " + attrsStr)}`;
  }
}



class Node {
  constructor(label, id = undefined) {
    this.id = id === undefined ? genId() : id;
    this.label = label;
    this.attributes = {};
  }

  setAttributes(attributes) {
    Object.assign(this.attributes, attributes);
    return this;
  }

  toString() {
    const attributes = Object.assign({}, this.attributes, {label:this.label});
    let attrsStr = attributesToString(attributes);
    return `"${this.id}"${(attrsStr === "" ? "" : " " + attrsStr)}`;
  }
}



class Edge {
  constructor(from, ...to) {
    this.nodes = [];
    this.add(from, ...to);
    this.isOriented = true;
    this.params = {};
    this.attributes = {};
  }

  add(...nodes) {
    this.nodes.push(...nodes);
  }

  setAttributes(attributes) {
    Object.assign(this.attributes, attributes);
    return this;
  }

  setParams(params) {
    Object.assign(this.params, params);
    return this;
  }

  toString() {
    let separator = this.params.isOriented ? " -> " : " -- ";
    let attrsStr = attributesToString(this.attributes);
    return this.nodes.map(node => {
      let id;
      switch(node.constructor) {
        case String : id = node;break;
        case Subgraph : id = node.getFirstNode().id;
        default : id = node.id; break;
      }
      return `"${id}"`;
    }).join(separator) + `${(attrsStr === "" ? "" : " " + attrsStr)}`;
  }
}



class BaseGraph {
  constructor(label = "") {
    this._id = genId();
    this.label = label;
    this.items = [];
    this.attributes = {};
    this.params = {};
  }

  get id() {
    return this._id;
  }

  label(label) {
    this.label = label;
    return this;
  }

  add(...items) {
    this.items.push(...items);
    return this;
  }

  setAttributes(attributes) {
    Object.assign(this.attributes, attributes);
    return this;
  }

  getFirstNode() {
    for(let i = 0, n = this.items.length; i < n; i++) {
      const child = this.items[i];
      switch(child.constructor) {
        case Subgraph:
          const firstNode = child.getFirstNode();
          if(firstNode !== null) {
            return firstNode;
          }
          break;
        case Node:
        case Record:
          return child;
          break;
        default:break;
      }
    }
    return null;
  }

  setParams(params) {
    Object.assign(this.params, params);
    return this;
  }

  toString(level = 0) {
    this.items.forEach(item => {
      if(item.setParams) {
        item.setParams({isOriented:this.params.isOriented});
      }
    });
    const attributes = Object.assign({}, this.attributes, {label:this.label});
    let content = [
      ...formatAList(attributes),
      typeParamsToString("graph", this.params.graph),
      typeParamsToString("node", this.params.node),
      typeParamsToString("edge", this.params.edge),
      ...this.items.map(item => item.toString(level + 1))
    ].filter(c => c).map(c => tabs(level + 1) + c + ";");
    return ` {\n${content.join("\n")}\n${tabs(level)}}`;
  }
}



class Graph extends BaseGraph {
  constructor(label = "") {
    super(label);
    this._id = "";
  }

  toString(level = 0) {
    if(level !== 0) {
      throw new Error("a Graph should be at the root of a document");
    }
    return `${this.params.isStrict ? "strict" : ""} ${this.params.isOriented ? "digraph" : "graph"} "${this.id}" ${super.toString(level)}`;
  }
}



class Subgraph extends BaseGraph {
  constructor(label = "") {
    super(label);
  }

  get id() {
    return (this.params.isCluster ? "cluster" : "") + this._id;
  }

  toString(level = 0) {
    return `subgraph "${this.id}" ${super.toString(level)}`;
  }
}

//export classes as functions (simpler syntax for chaining)
let libExports = [
  Color,
  LabelCell,
  Cell,
  Record,
  Node,
  Edge,
  Graph,
  Subgraph,
].reduce((exports, emt) => {
  exports[emt.name.charAt(0).toLowerCase() + emt.name.slice(1)] = (...args) => new emt(...args);
  return exports;
}, {});

Object.assign(module.exports, libExports);

