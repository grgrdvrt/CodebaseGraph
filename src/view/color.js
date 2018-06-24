
function HSVColorToString(color){
  return HSLToString(HSVToHSL(color.split(" ").map(Number)));
}

function HSVToHSL(hsv){
  //from https://gist.github.com/xpansive/1337890
  let h = 2 - hsv[1] * hsv[2];
  return {
    h : hsv[0],
    s : hsv[1] * hsv[2]/(h < 1 ? h : 2 - h),
    l:h / 2
  };
}


function HSLToString(hsl){
  let h = Math.round(hsl.h * 360);
  let s = Math.round(hsl.s * 100);
  let l = Math.round(hsl.l * 100);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

module.exports = {
  HSVColorToString,
  HSVToHSL,
  HSLToString
}
