/* jshint esversion:6, node:true */
"use strict";
let Grid = require("Grid");
let Perlin = require("PerlinSimplex");
let Gradient = require("Gradient");
let CellularAutomata = require("CellularAutomata");
let Dirs = CellularAutomata.Dirs;
require("./GridAdv")(Grid);

function cloud(){

}

function island(){

}

function waterHorizon(grid, nearLevel, horizonLevel){
  let gradient = new Gradient();
  gradient.addColorStop( 1.0000, {r:217/255,g:237/255,b:244/255});
  gradient.addColorStop( 0.0000, {r:19/255,g:129/255,b:206/255});
  let sea = gradient.get.bind(gradient);
  gradient = new Gradient();
  gradient.addColorStop( 0.0000, {r:205/255,g:232/255,b:249/255});
  gradient.addColorStop( 1.0000, {r:116/255,g:190/255,b:237/255});
  let sky = gradient.get.bind(gradient);

  let h = grid.h;
  grid.each(function(p,v){
    if(h-p.y > horizonLevel)
      return sky(((h-p.y)-horizonLevel)/(h-horizonLevel));
    else
      return sea((horizonLevel-(h-p.y))/(horizonLevel-nearLevel));
  });
}

function waterWave(grid, level, variation, offset, scale, color, depthMin, depthMax){
  scale /= grid.w;
  for(let x=0;x<grid.w;x++){
    let dh = depthMin + (depthMax-depthMin)*Math.abs(Math.cos(offset + scale*x));
    let h = (level+variation*Math.cos(offset + scale*x));
    let h0 = ~~(h - dh/2);
    let h1 = ~~(h + dh/2);
    for(let y=grid.h-h0;y>(grid.h-h1);y--){
      grid.set({x,y}, color);
    }
  }
}

function underwaterLimit(grid, level, variation, offset, scale, waterColor){
  scale /= grid.w;
  for(let x=0;x<grid.w;x++){
    let h = level+variation*Math.cos(offset + scale*x);
    for(let y=grid.h-1;y>(grid.h-h);y--){
      grid.set({x,y}, waterColor);
    }
  }
}

function drawEllipse(grid, pos, rX, rY, rot, color){
  for(let x=Math.floor(pos.x-rX);x<=pos.x+rX;x++)
    for(let y=Math.floor(pos.y-rY);y<=pos.y+rY;y++){
      if( (Math.pow((x-pos.x)/rX,2) + Math.pow((y-pos.y)/rY,2)) < 1)
        grid.set({x,y}, color);
    }
}

function rock(grid, pos, rX, rY){
  let color = {r:1,g:230/255,b:174/255};
  let colorLight = {r:1,g:1,b:1};
  let colorDark = {r:233,g:130,b:51};

  drawEllipse(grid,pos,rX,rY,0,color);
  drawEllipse(grid,{x:pos.x-1/2*rX,y:pos.y-1/2*rY},rX*3/8,rY*3/8,0.5*Math.PI,colorLight);
}

function shell(){

}

let rnd = Math.random;
let round = Math.round;
let cos = Math.cos;
let sin = Math.sin;
let sqrt = Math.sqrt;
let log = Math.log;
let max = Math.max;
let min = Math.min;
let abs = Math.abs;
let PI = Math.PI;
let PI2 = Math.PI*2;

function rnd2dGauss(c,d){
  var u1 = rnd();
  var u2 = rnd();
  var l = d*sqrt(-2*log(u1));
  var a = PI2*u2;
  var x = c.x+(l*cos(a));
  var y = c.y+(l*sin(a));
  return {x,y};
}

function rndGauss(c,d){ return c+(d*sqrt(-2*log(rnd()))*cos(PI2*rnd())); }

function randomCoralGradient(){
  let gradient = new Gradient();
  gradient.addColorStop( 0.0000, {r:rnd(),g:rnd(),b:0.5+rnd()*0.5});
  gradient.addColorStop( 1.0000, {r:rnd(),g:rnd(),b:0.5+rnd()*0.5});
  return gradient.get.bind(gradient);
}

function randomCoralParam(){
  let param = {};
  param.color = randomCoralGradient();
  param.oddToBranch = 0.1+0.3*rnd();
  param.trunkGrow = ~~(40 + 100*rnd());
  param.gravityImpact = 0.5+0.5*rnd();
  return param;
}
function corailTree(grid,pos,param){
  let width = grid.w;
  let height = grid.h;
  let gradient;
  gradient = new Gradient();
  gradient.addColorStop( 0.0000, {r:1,g:0,b:0.5});
  gradient.addColorStop( 1.0000, {r:0,g:0.5,b:0.5});
  let color = param.color || gradient.get.bind(gradient);
  let oddToBranch = param.oddToBranch || 0.2;
  let trunkGrow = param.trunkGrow || 60;
  let gravityImpact = param.gravityImpact || 0.75;
  function angleToDirection(a){
    return {x:round(cos(a-0.5*PI)),y:round(sin(a-0.5*PI))};
  }
  let factory = function(inertiaAngle,dist,count,nextTrunkGrow){
    count = count || 0;
    dist = (dist || 0)+1;
    nextTrunkGrow = nextTrunkGrow || trunkGrow;
    function corailBehavior(window, factory){
      let worstDiff = 0;
      window.eachIn(4).forEach(function(d){
        let atom = window.get(d);
        if(!atom) return;
        worstDiff = max(worstDiff,abs(dist-atom.dist));
      });
      if(worstDiff > 6) return;
      if(count === 0){
        if(rnd()<oddToBranch){
          let a = rndGauss(inertiaAngle*gravityImpact-0.25*PI, 0.05*PI);
          let d = angleToDirection(a);
          if(window.getType(d) == "empty") window.set(d, factory(a,dist));
          a = rndGauss(inertiaAngle*gravityImpact+0.25*PI, 0.05*PI);
          d = angleToDirection(a);
          if(window.getType(d) == "empty") window.set(d, factory(a,dist));
        }else{
          let a = rndGauss(inertiaAngle*gravityImpact, 0.05*PI);
          let d = angleToDirection(a);
          if(window.getType(d) == "empty") window.set(d, factory(a,dist));
        }
      }
      if(count == nextTrunkGrow){
        Dirs.all.forEach(function(d){
          if(window.getType(d) == "empty") window.set(d, factory(0,dist,1,nextTrunkGrow*2));
        });
      }
      count++;
    }
    return {type:"corail", dist, typeId:1, behavior: corailBehavior};
  };

  let caGrid = new Grid(width,height);
  let p = {x:~~pos.x,y:~~pos.y};
  let atoms = [p];
  caGrid.set(p,factory(0));
  return {
    draw:function(grid){
      grid.each(function(p,v){
        let v2 = caGrid.get(p);
        if(!v2) return v;
        return color(v2.dist/200);
      });
    },
    run: function(nbStep){
      CellularAutomata.run(atoms, caGrid, factory, nbStep);
    }
  };
}

function seaWeed(){
}

function fish(){

}

function corailWeed(){

}

function ground(grid, level, variation, sandColor){
  let P = new Perlin();
  P.noiseDetail(3,0.25);
  for(let x=0;x<grid.w;x++){
    let h = level+variation*P.noise(5*x/grid.w,0);
    for(let y=grid.h-1;y>(grid.h-h);y--){
      grid.set({x,y}, sandColor);
    }
  }
}

let purple = {r:1,g:0,b:1};
let white = {r:1,g:1,b:1};
let blueSea = {r:96/255,g:164/255,b:225/255};
let sand = {r:237/255,g:191/255,b:113/255};

let gradient;
gradient = new Gradient();
gradient.addColorStop( 0.0000, blueSea);
gradient.addColorStop( 1.0000, sand);
let sandGradiant = gradient.get.bind(gradient);

let size = 1024;
let w = size;
let h = size;

let grid = new Grid(w,h);

grid.fill(purple);

waterHorizon(grid, h*6/10, h*7/10);
underwaterLimit(grid, h*13/20, h/40, 0, 8, blueSea);
waterWave(grid, h*13/20, h/40, 1, 8, white, h/320, h/120);
waterWave(grid, h*13/20, h/40, 3, 8, white, h/240, h/80);

ground(grid,h*4/20,h/20,sandGradiant(0.25));
ground(grid,h*3/20,h/20,sandGradiant(0.50));
ground(grid,h*2/20,h/20,sandGradiant(0.75));

ground(grid,h/20,h/20,sandGradiant(1));
//rock(grid, {x:w/2,y:(h-h/20)}, h/20, h/40);

//
//  corailTree(grid, {x:~~x,y:(h-h/20)}, 20, randomCoralParam());
//for(let y=(h-4*h/20);y<(h-h/20);y+=(1+rnd())*h/40)
//  for(let x=(1+rnd())*w/20;x<w;x+=(1+rnd())*w/20)
function rndCorailPos(){ return {x:~~(w*rnd()),y:~~(h-4*h/20*rnd())}; }
let pts = [];
for(let i = 0;i<10;i++)
  pts.push(rndCorailPos());
pts.sort(function(a,b){ return a.y-b.y; });
let corails = pts.map(pt => corailTree(grid, pt, randomCoralParam()));
let base = grid;

let iter = 0;
function evolveAndDraw(){
  grid = base.clone();
  corails.forEach(c => c.run(1));
  corails.forEach(c => c.draw(grid));
  grid.draw(1,"img","corail",iter++,function(){});
}
for(let i=0;i<20;i++){
  console.log("iteration",i);
  evolveAndDraw();
}
