/* jshint esversion:6, node:true, loopfunc:true, undef: true, unused: true, sub:true */
"use strict";
let lwip = require('lwip');

module.exports = function(Grid){

function pad0(n){ return ("0000"+n).slice(-4); }

Grid.prototype.draw = function(zoom,dir,file,n,cb){
  let offset = this.w*this.h*zoom*zoom;
  let pixels = new Buffer(offset*3);
  let data = this.data;
  for(let y=0;y<data.length;y++){
    let d = data[y];
    for(let x=0;x<d.length;x++){
      let c = d[x];
      for(let zy=0;zy<zoom;zy++){
        for(let zx=0;zx<zoom;zx++){
          let i = (y*zoom+zy)*this.w*zoom + (x*zoom+zx);
          pixels[i         ] = ~~(c.r*255);
          pixels[i+1*offset] = ~~(c.g*255);
          pixels[i+2*offset] = ~~(c.b*255);
        }
      }
    }
  }
  lwip.open(pixels, {width:this.w*zoom,height:this.h*zoom}, function(err,image){
    if(err) return cb(err);
    let filename = dir + '/'+file+'-'+pad0(n)+'.png';
    image.writeFile(filename,err => cb(err,filename));
  });
};

};
