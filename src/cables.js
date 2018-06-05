const Voronoi = require("voronoi");
const path = require('ngraph.path');
const createGraph = require('ngraph.graph');
const svg = require("./svg");




function point(x, y){
  return {x, y};
}

function intersects(r1, r2, margin){
  let interH = r1.x - margin < r2.x + r2.w + margin && r1.x + r1.w + margin > r2.x - margin;
  let interV = r1.y - margin < r2.y + r2.h + margin && r1.y + r1.h + margin > r2.y - margin;
  return interH && interV;
}


function ptIsInRect(pt, rect){
  return pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h;
}






function makePoints(rectangles, margin){
  let pts = [];
  let pt = (x, y, r) => {return {r, pt:point(x, y)};};
  rectangles.forEach(r => {
    pts.push(
      pt(r.x - margin, r.y - margin, r),
      pt(r.x + r.w + margin, r.y - margin, r),
      pt(r.x + r.w + margin, r.y + r.h + margin, r),
      pt(r.x - margin, r.y + r.h + margin, r),
    );
  });
  return pts;
}

function collectEdges(triangles){
  let edges = [];
  let contains = e1 => edges.filter(e2 => (e1.a === e2.a && e1.b === e2.b) || (e1.a === e2.b && e1.b === e2.a)).length > 0;
  let addEdge = (a, b) => {
    let edge = {a, b};
    if(!contains(edge)){
      edges.push(edge);
    }
  };
  triangles.forEach(t => {
    addEdge(t[0], t[1]);
    addEdge(t[1], t[2]);
    addEdge(t[2], t[0]);
  });
  return edges;
}

function drawSmoothLine(ctx, pts){
  let p = i => pts[i].data;
  if(pts.length < 2)return;
  if(pts.length === 2){
    ctx.moveTo(p(0).x, p(0).y);
    ctx.lineTo(p(1).x, p(1).y);
    return;
  }
  if(pts.length === 3){
    ctx.moveTo(p(0).x, p(0).y);
    ctx.quadraticCurveTo(p(1).x, p(1).y, p(2).x, p(2).y);
    return;
  }
  let n = pts.length;
  let pt = p(0);
  ctx.moveTo(pt.x, pt.y);
  for(let i = 1; i < n - 1; i++){
    pt = p(i);
    let nPt = p(i + 1);
    ctx.quadraticCurveTo(pt.x, pt.y, 0.5 * (pt.x + nPt.x), 0.5 * (pt.y + nPt.y));
  }
  pt = p(n - 2);
  let nPt = p(n - 1);
  ctx.quadraticCurveTo(pt.x, pt.y, nPt.x, nPt.y);
}



function drawEdges(rectangles, edges){
  let w = 0;
  let h = 0;
  let margin = 5;
  rectangles.forEach(r => {
    if(r.x + r.w> w)w = r.x + r.w+ margin;
    if(r.y + r.h> h)h = r.y + r.h+ margin;
  });



  let svgContainer = svg.init(document.querySelector(".edgesContainer"))
      .attrs({
        width:w,
        height:h,
      });
  let edgesSvgGroup = svg.init(document.querySelector(".edgesContainer"))
      .attrs({
        width:w,
        height:h,
      });


  let pts = makePoints(rectangles, margin);
  let nPts = 10000;
  for(let i = 0; i < nPts; i++){
    pts.push({pt:{
      x:Math.random() * w,
      y:Math.random() * h
    }});
  }

  var voronoi = new Voronoi();
  var bbox = {xl: 0, xr: w, yt: 0, yb: h};
  var sites = pts.map(p => p.pt);


  var diagram = voronoi.compute(sites, bbox);


  // diagram.edges.forEach((e, i) => {
  //   svgContainer.add(
  //     svg.create("line")
  //     .attrs({
  //       x1:e.va.x,
  //       y1:e.va.y,
  //       x2:e.vb.x,
  //       y2:e.vb.y,
  //       stroke:"blue",
  //       strokeWidth:4,
  //       fill:"none"
  //     })
  //   );
  // });




  let graph = createGraph();

  diagram.vertices.forEach((p, i) => {p.id = i; graph.addNode(i, p);});
  diagram.edges.forEach(e => graph.addLink(e.va.id, e.vb.id));


  rectangles.forEach(r => {
    r.v = diagram.vertices.filter(v => ptIsInRect(v, r));
  });



  let pathFinder = path.aStar(graph, {
    distance(fromNode, toNode) {
      let dx = fromNode.data.x - toNode.data.x;
      let dy = fromNode.data.y - toNode.data.y;

      let weight = fromNode.data.weight + toNode.data.weight;
      return weight * Math.sqrt(dx * dx + dy * dy);
    },
    heuristic(fromNode, toNode) {
      let dx = fromNode.data.x - toNode.data.x;
      let dy = fromNode.data.y - toNode.data.y;

      let weight = fromNode.data.weight + toNode.data.weight;
      return weight * Math.sqrt(dx * dx + dy * dy);
    }
  });



  edges.forEach(e => {

    let beginCandidates = rectangles.filter(r => r === e.from)[0].v;
    let endCandidates = rectangles.filter(r => r === e.to)[0].v;
    let begin = beginCandidates[Math.floor(Math.random() * beginCandidates.length)];
    let end = endCandidates[Math.floor(Math.random() * endCandidates.length)];

    diagram.vertices.forEach(v => v.weight = 1);
    rectangles.forEach(r => {
      if(r === begin.r || r == end.r){
        r.v.forEach(v => v.weight = 0);
      }
      else{
        r.v.forEach(v => v.weight = Number.MAX_VALUE);
      }
    });
    begin.weight = end.weight = 0;
    let result = pathFinder.find(begin.id, end.id);

    let result2 = [];
    let n = result.length;
    result2.push(result[0]);
    for(let i = 1; i < n - 2; i++){
      let p1 = result[i];
      let p2 = result[i + 1];
      result2.push({data:{
        x:0.5 * (p1.data.x + p2.data.x),
        y:0.5 * (p1.data.y + p2.data.y)
      }});
    }
    result2.push(result[n - 1]);


    svgContainer.add(
      svg.create("polyline")
        .attrs({
          points:result2.map(pt => `${pt.data.x + Math.random() * 20},${pt.data.y + Math.random() * 20}`).join(" "),
          stroke:"red",
          strokeWidth:4,
          fill:"none"
        })
    );



  });

}

Object.assign(module.exports, {
  drawEdges
});
