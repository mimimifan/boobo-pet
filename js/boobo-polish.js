/* 小院家具素材、秋千组合动画与共用头像。 */
(function(){
  'use strict';if(window.BooboPolish)return;
  var R=window.BooboRoom,A=R.ART;

      /* BOOBO_V33: 在首次绘制前设置素材与预览 */
      var baseIcon=R.icon;
      R.icon=function(id){if(id!=='swing')return baseIcon(id);var f=baseIcon('swing');if(f.indexOf('data-preview=')>=0)return f;var s=baseIcon('swseat'),ropes=baseIcon('swrope');return '<svg viewBox="0 0 46 54" shape-rendering="crispEdges" aria-hidden="true">'+'<g transform="translate(6 2)">'+ropes.slice(ropes.indexOf('>')+1,ropes.lastIndexOf('</svg>'))+'</g>'+f.slice(f.indexOf('>')+1,f.lastIndexOf('</svg>'))+'<g transform="translate(6 40)">'+s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>'))+'</g></svg>';};

  function grid(w,h,f){var a=[];for(var y=0;y<h;y++){var s='';for(var x=0;x<w;x++)s+=f(x,y)||'.';a.push(s);}return a;}
  function svg(rows,pal){var s='<svg viewBox="0 0 '+rows[0].length+' '+rows.length+'" shape-rendering="crispEdges" aria-hidden="true">';rows.forEach(function(r,y){for(var x=0;x<r.length;x++)if(pal[r[x]])s+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+pal[r[x]]+'"/>';});return s+'</svg>';}
  /* BOOBO_YARD_ART_V40 */
  A.swing=grid(46,54,function(x,y){
    if(y<=3&&x>=1&&x<=44)return y===0?'W':y===3?'D':'w';
    if(y>=51&&((x<=7)||(x>=38)))return y===51?'S':'Z';
    if(y>=4&&((x>=2&&x<=5)||(x>=40&&x<=43)))return x===5||x===43?'D':x===2||x===40?'W':'w';
    if(y>=3&&y<=7&&((x>=8&&x<=10)||(x>=35&&x<=37)))return y===7?'D':'C';
    if(y>=5&&y<=10){var d=y-5;if((x>=6+d&&x<=7+d)||(x>=38-d&&x<=39-d))return 'd';}
    if(y>=5&&y<=9){for(var i=0;i<3;i++){var c=17+i*6;if(Math.abs(x-c)<=Math.floor((9-y)/2))return ['p','b','y'][i];}}
    if(y>=13&&y<=37&&((x>=6&&x<=8)||(x>=37&&x<=39))&&(x+y)%4<2)return (x+y)%3?'g':'G';
    if((x===7&&y===19)||(x===38&&y===30))return 'p';return '.';
  });

  A.swrope=grid(34,44,function(x,y){
    if(y>=38)return '.';
    return x===3||x===30?'o':x===4||x===29?(y%6===0?'W':'C'):'.';
  });
  A.swseat=grid(34,6,function(x,y){
    if(y===0||y===5||x===0||x===33)return 'o';
    if(y===1&&x>=8&&x<=25)return 'p';
    if(y===2&&x>=9&&x<=24)return 'l';
    return y===1?'W':(x-1)%8===0?'D':'w';
  });
  A.garden=grid(24,18,function(x,y){
    var f=[[5,5,'p'],[12,2,'y'],[19,4,'l']];
    for(var i=0;i<3;i++){var a=f[i];if(x===a[0]&&y===a[1])return 'Y';
      if((x===a[0]-1||x===a[0]+1)&&y===a[1])return a[2];
      if(x===a[0]&&(y===a[1]-1||y===a[1]+1))return a[2];
      if(x===a[0]&&y>a[1]+1&&y<=14)return 'k';}
    if(y>=15)return y===15?'W':'z';
    function bush(cx,w,h){var dx=(x-cx)/w,dy=(y-14)/h;return y<=14&&dx*dx+dy*dy<=1;}
    if(bush(5,5,8)||bush(12,6,11)||bush(19,5,9))return ((x*3+y*5)%11===0)?'k':((x+y)%5<2?'G':'g');return '.';
  });
  var pal={o:'#374b55',b:'#86acc0',n:'#537b99',s:'#172b36',y:'#e8b85b',w:'#f5e7cf'};
  var body=svg(['....oooo......','...obbbo......','...obsoyy.....','...obbbw......','..obbbwww.....','.obbbwwww.....','obbbbbboo.....','ooobbbbo......','...oooo.......','..............','..............','..............'],pal);
  var wing=svg(['..nnn..','.nbbbn.','nbbbbn.','nbbbn..','.nnn...'],pal);
  var feet=svg(grid(14,12,function(x,y){return y===9&&(x===4||x===6)?'y':'.';}),pal);
  var bird='<span class="bb-bird-facing"><span class="bb-bird-body">'+body+'<i class="bb-bird-wing">'+wing+'</i></span><i class="bb-bird-feet">'+feet+'</i></span>';
  function rabbitShape(x,y){
    if(y>=1&&y<=5&&((x>=5&&x<=7)||(x>=12&&x<=14)))return true;
    if(y===5||y===16)return x>=6&&x<=13;
    if(y===6||y===15)return x>=4&&x<=15;
    if(y===7||y===14)return x>=3&&x<=16;
    if(y>=8&&y<=13)return x>=2&&x<=17;
    if(y===17)return (x>=5&&x<=8)||(x>=11&&x<=14);
    return false;
  }
  var player=svg(grid(20,20,function(x,y){
    if(!rabbitShape(x,y))return y===19&&x>=5&&x<=14?'s':'.';
    if(y>=2&&y<=4&&(x===6||x===13))return 'p';
    if(!rabbitShape(x-1,y)||!rabbitShape(x+1,y)||!rabbitShape(x,y-1)||!rabbitShape(x,y+1))return 'o';
    if(y>=9&&y<=10&&(x===6||x===7||x===12||x===13))return y===9&&(x===6||x===12)?'h':'d';
    if(y===11&&(x===4||x===5||x===14||x===15))return 'p';
    if((y===12&&(x===9||x===11))||(y===13&&x===10))return 'm';
    return y>=14?'c':y===6||y===7?'h':'w';
  }),{o:'#ab947a',w:'#fff0d2',h:'#fff8e8',c:'#eedbbb',p:'#ecb0b2',d:'#66574c',m:'#9c7967',s:'#00000016'});
  var swingSince=0;
  function ungroup(st){
    if(!st)return;
    var g=document.getElementById('bbSwingGroup'),rg=document.getElementById('bbSwingRopes');
    var back=document.getElementById('roomDecor'),front=document.getElementById('roomDecorFront');
    if(g){var p=g.querySelector('#petButton'),s=g.querySelector('.rm-swseat');if(p)st.insertBefore(p,front);if(s&&front)front.appendChild(s);g.remove();}
    if(rg){var ropes=rg.querySelector('.rm-swrope');if(ropes&&back)back.appendChild(ropes);rg.remove();}
  }
  function group(st){
    ungroup(st);
    if(!st||!st.classList.contains('pet-swing')||st.dataset.scene!=='yard'){swingSince=0;return;}
    var seat=st.querySelector('.rm-swseat'),ropes=st.querySelector('.rm-swrope'),p=document.getElementById('petButton'),sp=R.spotOf('swrope');
    if(!seat||!ropes||!p||!sp)return;
    if(!swingSince)swingSince=performance.now();
    var delay=-((performance.now()-swingSince)%2800)/1000+'s';
    var origin=sp.x+'% '+(st.clientHeight-sp.b-sp.h)+'px';
    var rg=document.createElement('div'),g=document.createElement('div');
    rg.id='bbSwingRopes';rg.className='bb-swing-ropes';g.id='bbSwingGroup';g.className='bb-swing-group';
    [rg,g].forEach(function(el){el.style.transformOrigin=origin;el.style.animationDelay=delay;st.appendChild(el);});
    rg.appendChild(ropes);g.appendChild(seat);g.appendChild(p);
  }
  var greenPlaced=false;
      function plants(st,state){
    var have=st.dataset.scene==='yard'&&(state.placed||[]).indexOf('garden')>=0;
    var placed=(state.placed||[]).indexOf('garden')>=0;
        var fresh=have&&!greenPlaced;greenPlaced=placed;st.classList.toggle('yard-green',have);
    var yard=document.getElementById('rmYard');if(!yard)return;var land=yard.querySelector('.yg-land');
    if(!land){
      var h='<div class="yg-land">';
      [3,25,49,73,97].forEach(function(x,i){h+='<i class="yg-shrub" style="left:'+x+'%;bottom:'+(54+i%2*17)+'px"></i>';});
      [5,94].forEach(function(x){h+='<i class="yg-tree" style="left:'+x+'%"></i>';});
      [9,31,58,83].forEach(function(x,i){h+='<i class="yg-flowers" style="left:'+x+'%;bottom:'+(8+i%2*12)+'px"></i>';});
      [14,39,67,88].forEach(function(x,i){h+='<i class="yg-tuft" style="left:'+x+'%;bottom:'+(32+i%2*15)+'px"></i>';});
      yard.insertAdjacentHTML('beforeend',h+'</div>');land=yard.querySelector('.yg-land');
    }
    if(fresh&&land){land.classList.remove('green-in');void land.offsetWidth;land.classList.add('green-in');}
  }
  document.addEventListener('animationend',function(ev){if(ev.animationName==='bb-green32')ev.target.classList.remove('green-in');});
  window.BooboPolish={ungroup:ungroup,group:group,stopSwing:function(){swingSince=0;},plants:plants,bird:bird,player:player};
})();
