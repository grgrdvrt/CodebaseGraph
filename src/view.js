
let graphDom = document.createElement("div");
graphDom.classList.add("graphDom");

let posInit = {x:0, y:0};
let graphPos = {x:0, y:0};
let graphPosInit = {x:undefined, y:undefined};
let scale = 1;
let size = {width:undefined, height:undefined};

function init(contentStr){
  document.body.appendChild(graphDom);
  graphDom.innerHTML = contentStr;
  size.width = graphDom.clientWidth;
  size.height = graphDom.clientHeight;
  let nodes = {};
  document.querySelectorAll(".node title").forEach(title => {
    nodes[title.textContent] = title.parentNode;
  });
  console.log(nodes);

  initMouse();
}


function initMouse(){
  document.addEventListener("mousedown", startDrag);
  document.addEventListener("mousewheel", zoom);
}

function zoom(e){
  let mouseX = e.clientX;
  let mouseY = e.clientY;
  let dx = (graphPos.x + 0.5 * size.width - mouseX) / scale;
  let dy = (graphPos.y + 0.5 * size.height - mouseY) / scale;
  // console.log(dx, dy);
  let s1 = scale;
  scale += 0.001 * e.deltaY * scale;
  scale = Math.max(0.05, Math.min(1, scale));
  // console.log(s1, scale);
  graphPos.x = mouseX + scale * dx - 0.5 * size.width;
  graphPos.y = mouseY + scale * dy - 0.5 * size.height;
  // console.log(graphPos);
  applyTransform(scale, graphPos.x, graphPos.y);
}

function startDrag(e){
  posInit.x = e.clientX;
  posInit.y = e.clientY;
  graphPosInit.x = graphPos.x;
  graphPosInit.y = graphPos.y;
  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", stopDrag);
}

function stopDrag(e){
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", stopDrag);
  let dx = e.clientX - posInit.x;
  let dy = e.clientY - posInit.y;
  setGraphPos(
    graphPosInit.x + dx,
    graphPosInit.y + dy
  );
}

function setGraphPos(x, y){
  graphPos.x = x;
  graphPos.y = y;
  applyTransform(scale, graphPos.x, graphPos.y);
}

function drag(e){
  let dx = e.clientX - posInit.x;
  let dy = e.clientY - posInit.y;
  setGraphPos(
    graphPosInit.x + dx,
    graphPosInit.y + dy
  );
}


function applyTransform(s, tx, ty){
  graphDom.style.transform = `translate(${tx}px, ${ty}px) scale(${scale}) `;
}


module.exports = {
  init
};
