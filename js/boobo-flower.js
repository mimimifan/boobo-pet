/* BOOBO_FLOWER_V47: 花田、花材与自编花环 */
(function(){
 'use strict';if(window.BooboFlower)return;
 var API=window.BooboAPI,R=window.BooboRoom,KEY='boobo_flower_v1';
 var FLOWERS=[
  {id:'daisy',name:'小雏菊',color:'#fff6dc',shade:'#bba77d',time:180,lv:31,highlight:'#fffef0'},
  {id:'tulip',name:'郁金香',color:'#f4b3bd',shade:'#c77994',time:300,lv:32,highlight:'#ffe1df'},
  {id:'sun',name:'向日葵',color:'#f6d16c',shade:'#d5a348',time:420,lv:33,highlight:'#ffe695'},
  {id:'rose',name:'波斯菊',color:'#e88c9a',shade:'#b85e7c',time:480,lv:34,highlight:'#fac2cc'},
  {id:'lavender',name:'三色堇',color:'#bdabe1',shade:'#8c79b0',time:600,lv:35,highlight:'#e2d8f3'},
  {id:'hydrangea',name:'勿忘草',color:'#a9cde5',shade:'#719fbd',time:720,lv:36,highlight:'#e0eff4'}
 ];
 function flower(id){return FLOWERS.find(function(f){return f.id===id;});}
 var raw={};try{raw=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){}
 function count(v){return Math.max(0,Math.min(9999,parseInt(v,10)||0));}
 var D={beds:Array.from({length:6},function(_,i){var b=Array.isArray(raw.beds)&&raw.beds[i];return b&&flower(b.id)&&Number.isFinite(b.end)?{id:b.id,start:Number(b.start)||Date.now(),end:b.end,water:!!b.water}:null;}),stock:{},wreaths:[],wear:null,lightOn:raw.lightOn!==false,seeds:{},gifts:[],next:count(raw.next)||1};
 FLOWERS.forEach(function(f){D.stock[f.id]=count(raw.stock&&raw.stock[f.id]);});
 if(Array.isArray(raw.wreaths))raw.wreaths.slice(0,24).forEach(function(w){if(w&&typeof w.id==='string'&&Array.isArray(w.flowers)&&w.flowers.length===6&&w.flowers.every(flower)&&!D.wreaths.some(function(x){return x.id===w.id;}))D.wreaths.push({id:w.id,flowers:w.flowers.slice()});});
 if(D.wreaths.some(function(w){return w.id===raw.wear;}))D.wear=raw.wear;
 var prior=raw.stats||{};
 D.stats={harvests:count(prior.harvests),watered:count(prior.watered),crafted:Math.max(count(prior.crafted),D.wreaths.length),kinds:[]};
 var known=Array.isArray(prior.kinds)?prior.kinds.slice():[];
 FLOWERS.forEach(function(f){if(D.stock[f.id]>0)known.push(f.id);});D.wreaths.forEach(function(w){known=known.concat(w.flowers);});
 D.stats.kinds=FLOWERS.filter(function(f){return known.indexOf(f.id)>=0;}).map(function(f){return f.id;});
 function flowerChanged(){API.emit('flower',{});}
 function rememberFlower(id){if(D.stats.kinds.indexOf(id)<0)D.stats.kinds.push(id);}
 function lv(){var p=window.BooboPlus&&window.BooboPlus.get();return p?p.lv:1;}
 FLOWERS.forEach(function(f){D.seeds[f.id]=count(raw.seeds&&raw.seeds[f.id]);});D.gifts=Array.isArray(raw.gifts)?raw.gifts.filter(function(id){return !!flower(id);}):[];
 function unlockSeeds(){var changed=false;FLOWERS.forEach(function(f){if(lv()>=f.lv&&D.gifts.indexOf(f.id)<0){D.gifts.push(f.id);D.seeds[f.id]=Math.min(9999,D.seeds[f.id]+4);changed=true;}});if(changed)save();}
 function save(){if(typeof selected==='string')D.selected=selected;try{localStorage.setItem(KEY,JSON.stringify(D));}catch(e){API.say('花圃存档暂时写不进去，请先导出备份，不要清除网站数据。');}}
 (function(){var st=API.state,id='gh_curtain';if((st.owned||[]).indexOf(id)>=0){var paid=st.paid||{},back=Object.prototype.hasOwnProperty.call(paid,id)?Math.max(0,Number(paid[id])||0):26;st.stars+=back;}st.owned=(st.owned||[]).filter(function(x){return x!==id;});st.placed=(st.placed||[]).filter(function(x){return x!==id;});if(st.paid)delete st.paid[id];API.save();})();
 function rect(x,y,w,h,c){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>';}
 /* BOOBO_FLOWER_ART_V42: 小幅像素花头，花环和花簇共享花形 */
 var PETALS={
 daisy:['....ppp....','...phhhp...','.ppphhhppp.','phhhqCqhhhp','phhqCCCqhhp','.ppqCCCqpp.','phhqCCCqhhp','phhhqCqhhhp','.ppphhhppp.','...phhhp...','....ppp....'],
 tulip:['.p.......p.','ppp..p..ppp','phpppppphhp','phhppphhhhp','phhhpphhhqp','.phhpphhqp.','..pppppqp..','...qqqqq...','.....g.....'],
 sun:['...pp.pp...','.pphppphpp.','.phqqqqqhp.','ppqccCccqpp','phqcCCCcqhp','.pqcCCCcqp.','phqcCCCcqhp','ppqccCccqpp','.phqqqqqhp.','.pphppphpp.','...pp.pp...'],
 rose:['...pp.pp...','..phhphhp..','.phhhphhhp.','pphhppphhpp','phhpqCqphhp','.ppqCCCqpp.','phhpqCqphhp','pphhppphhpp','.phhhphhhp.','..phhphhp..','...pp.pp...'],
 lavender:['..pp...pp..','.phhp.phhp.','phhhppphhhp','phhhqqqhhhp','.phqCCCqhp.','..pqCCCqp..','.phqCCCqhp.','phhhppphhhp','phhhhhhhhhp','.pphhhhpp..','...pppp....'],
 hydrangea:['...ppppp...','..phhhhhp..','..phhhhhp..','ppphhphhppp','phhhqCqhhhp','phhqCCCqhhp','phhhqCqhhhp','.pphhphhpp.','..phhphhp..','..phhphhp..','...pp.pp...']};
 function head(f,cx,cy,scale){var rows=PETALS[f.id]||PETALS.daisy,s='',pal={p:f.id==='daisy'?'#cfbd96':f.color,q:f.shade,h:f.highlight,c:'#86683e',C:'#e9ba57',g:'#608568'};
  rows.forEach(function(row,y){for(var x=0;x<row.length;x++)if(pal[row[x]])s+=rect(cx+(x-Math.floor(row.length/2))*scale,cy+(y-Math.floor(rows.length/2))*scale,scale,scale,pal[row[x]]);});return s;
 }
 function leaf(x,y,left){return rect(x+(left?-6:1),y,5,2,'#719864')+rect(x+(left?-5:2),y-1,3,1,'#a7be7a')+rect(x+(left?-3:1),y+2,2,1,'#527a59');}
 function art(id,phase,single){var f=flower(id),s='',pts=single?[[20,15]]:[[10,20],[29,21],[20,12],[20,29]];
  if(phase===0){[12,23,29].forEach(function(x,i){s+=rect(x,33-i*2,1,11+i*2,'#527a59')+leaf(x,35-i*2,i%2===0);});}
  else{pts.forEach(function(a,i){s+=rect(a[0],a[1]+3,1,43-a[1]-3,'#527a59')+rect(a[0]+1,a[1]+8,1,34-a[1],'#8aa56b')+leaf(a[0],a[1]+9,i%2===0);});pts.forEach(function(a){s+=phase===1?rect(a[0]-2,a[1]-2,5,5,f.shade)+rect(a[0]-1,a[1]-3,3,4,f.color):head(f,a[0],a[1],1);});}
  return '<svg viewBox="0 0 40 48" shape-rendering="crispEdges" aria-hidden="true">'+s+'</svg>';
 }
 function wreathArt(ids){var s='';
  for(var x=3;x<83;x++){var y=x<14||x>71?10:12;s+=rect(x,y,1,2,'#527a59');if(x%4<2)s+=rect(x,y,1,1,'#93b478');}
  [2,14,28,42,56,70,79].forEach(function(x,i){s+=rect(x,8+(i%2)*7,4,2,'#80a76c')+rect(x+1,7+(i%2)*7,3,1,'#aec88a');});
  (ids||[]).slice(0,6).forEach(function(id,i){var f=flower(id);if(f)s+=head(f,7+i*14,11+(i===0||i===5?-1:1),1);});
  return '<svg viewBox="0 0 84 24" shape-rendering="crispEdges" aria-hidden="true">'+s+'</svg>';
 }
 function wreathIcon(){return wreathArt(['daisy','rose','daisy','rose','daisy','rose']);}
 function pail(){return '<svg viewBox="0 0 32 28" shape-rendering="crispEdges" aria-hidden="true">'+rect(8,5,12,2,'#587e82')+rect(6,7,2,7,'#587e82')+rect(20,7,2,6,'#587e82')+rect(5,12,17,12,'#618b91')+rect(7,13,12,9,'#91b9b5')+rect(8,14,3,7,'#c2d9cc')+rect(22,15,4,3,'#618b91')+rect(25,12,4,5,'#618b91')+rect(28,10,3,3,'#91b9b5')+rect(5,24,17,2,'#527478')+rect(1,12,4,2,'#618b91')+rect(0,14,2,7,'#618b91')+'</svg>';}
 function skyLayer(){
  var yard=stage().querySelector('#rmYard'),keep=['yd-glow','yd-sun','yd-moon','yd-shoot','yd-st','yd-cl'];
  return '<div class="gh-sky-layer rm-yard" aria-hidden="true">'+Array.from(yard.children).filter(function(el){return keep.some(function(c){return el.classList.contains(c);});}).map(function(el){return el.outerHTML;}).join('')+'</div>';
 }
 function greenhouse(){var s='';function r(x,y,w,h,c){s+=rect(x,y,w,h,c);}function path(d,c){s+='<path d="'+d+'" fill="'+c+'"/>';}
  s+='<defs><clipPath id="ghGlass42"><rect x="5" y="15" width="210" height="112"/></clipPath></defs><g clip-path="url(#ghGlass42)">';
  s+='<g class="gh-outside" shape-rendering="auto" transform="translate(220 0) scale(-1 1)">';
  /* BOOBO_OUTLOOK_V46：沿用小院远山/远树的配色与层次，玻璃后保留空气透视。 */
  path('M0 130V91L22 83L44 88L75 71L102 84L128 77L154 88L180 73L204 84L220 79V130Z','var(--hx)');
  path('M0 130V104L19 94L39 101L66 87L90 98L114 91L139 102L164 89L188 100L210 93L220 101V130Z','var(--hf)');
  path('M0 130V117Q20 105 42 112T87 109T133 111T180 107T220 113V130Z','var(--hn)');
  [[26,109,8],[43,110,6],[58,106,9],[71,111,6],[173,110,7],[189,108,9],[203,113,6]].forEach(function(a){var x=a[0],y=a[1],w=a[2];
   r(x,y-4,1,14,'var(--tre)');
   path('M'+x+' '+(y-w*2)+'l'+w+' '+(w*1.5)+'h-'+(w*.3)+'l'+(w*.55)+' '+(w*.9)+'h-'+(w*2.5)+'l'+(w*.55)+' -'+(w*.9)+'h-'+(w*.3)+'Z','var(--tre)');
  });
  path('M0 130V122Q27 113 56 120T108 119T161 120T220 116V130Z','var(--gr1)');
  path('M0 130V126Q38 118 76 124T147 125T220 122V130Z','var(--gr2)');
  [[18,126,13],[53,129,15],[175,128,17],[211,130,12]].forEach(function(a){var x=a[0],y=a[1],w=a[2];
   path('M'+(x-w)+' '+(y+3)+'v-4q2 -7 '+w+' -7t'+w+' 7v4Z','var(--gr3)');
   r(x-w+5,y-6,w,1,'var(--gr1)');
  });
  [[39,124],[157,124],[192,122]].forEach(function(a){r(a[0],a[1],2,1,'#efe4bc');r(a[0]+1,a[1]-1,1,3,'#e8d296');});
  s+='</g><g class="gh-reflection">';[9,82,155].forEach(function(x){r(x+4,21,2,26,'#fffbed');r(x+9,21,1,18,'#fffbed');path('M'+(x+17)+' 72h4l-13 21h-4z','#f5f7df');});s+='</g></g>';
  s+='<g class="gh-interior">';
  /* 室内主梁与细窗棂 */
  r(0,0,220,6,'#5a3d2b');r(0,6,220,7,'#b98256');r(0,6,220,1,'#e8b26b');r(0,12,220,3,'#8c5e3d');
  [0,72,144,216].forEach(function(x){r(x,14,4,114,'#8c5e3d');r(x,14,1,114,'#e9b674');r(x+3,14,1,114,'#5a3d2b');r(x-1,125,6,3,'#c39059');});
  r(4,57,212,2,'#ae784e');r(4,59,212,1,'#f2d5a0');
  r(0,127,220,2,'#f2cb91');r(0,129,220,5,'#b98256');r(0,134,220,2,'#6e4a30');
  r(0,136,220,13,'#f4dda9');r(0,148,220,2,'#c6a575');
  for(var x=10;x<220;x+=28){r(x,139,18,6,'#dcc39a');r(x,139,18,1,'#fff0cc');}
  r(0,150,220,74,'#f0d098');
  [[150,24,40],[174,25,48],[199,25,56]].forEach(function(a,i){
   r(0,a[0],220,2,'#b99364');
   for(var x=-(i%2)*a[2]/2;x<220;x+=a[2]){r(x,a[0]+2,2,a[1]-2,'#c8a270');}
  });
  r(0,150,220,3,'#b69873');r(0,153,220,3,'#e0c59d');
  return '<svg class="gh-room" viewBox="0 0 220 224" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">'+s+'</g></svg>';
 }
 /* BOOBO_OUTLINE_V46：合并家具的实际像素轮廓，再在外侧补一圈同色深描边。 */
 function outlinedArt(body){
  var w=224,h=228,mask=new Uint8Array(w*h),bold=new Uint8Array(w*h),edge=new Uint8Array(w*h),match;
  var outlineBody=body.replace(/<g class="gh-shelf-flowers">[\s\S]*?<\/g>/g,'');
  var rx=/<rect\b([^>]+)>/g;
  while((match=rx.exec(outlineBody))){
   var a=match[1];function value(k){var m=a.match(new RegExp('(?:^|\\s)'+k+'="([^"]+)"'));return m?Number(m[1]):0;}
   var x=value('x'),y=value('y'),rw=value('width'),rh=value('height');
   for(var yy=Math.max(0,Math.floor(y)+2);yy<Math.min(h,Math.ceil(y+rh)+2);yy++)
    for(var xx=Math.max(0,Math.floor(x)+2);xx<Math.min(w,Math.ceil(x+rw)+2);xx++){mask[yy*w+xx]=1;if(rw>=8&&rh>=3||rw>=3&&rh>=12)bold[yy*w+xx]=1;}
  }
  for(var y=1;y<h-1;y++)for(var x=1;x<w-1;x++)if(mask[y*w+x]){
   var dirs=[[-1,0],[1,0],[0,-1],[0,1]];if(bold[y*w+x])dirs=dirs.concat([[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,-1],[-1,1],[1,1]]);
   dirs.forEach(function(d){var n=(y+d[1])*w+x+d[0];if(!mask[n])edge[n]=1;});
  }
  var d='';for(var y=0;y<h;y++)for(var x=0;x<w;){if(!edge[y*w+x]){x++;continue;}
   var start=x;while(x<w&&edge[y*w+x])x++;d+='M'+(start-2)+' '+(y-2)+'h'+(x-start)+'v1h-'+(x-start)+'z';
  }
  return '<path class="gh-object-outline" d="'+d+'" fill="#5a3d2b"/>'+body;
 }

 /* BOOBO_SHELF_FLOWER_V50: tiny flowers get a contour in their own scale. */
 function shelfFlowerHead(f,cx,cy){
  var rows=PETALS[f.id]||PETALS.daisy,scale=.7,edge=.35,outline='';
  rows.forEach(function(row,y){for(var x=0;x<row.length;x++)if(row[x]!=='.'){
   var px=cx+(x-Math.floor(row.length/2))*scale,py=cy+(y-Math.floor(rows.length/2))*scale;
   outline+=rect(px-edge,py-edge,scale+edge*2,scale+edge*2,'#6e4a30');
  }});
  return outline+head(f,cx,cy,scale);
 }
 function propArt(id){var s='';function r(x,y,w,h,c){s+=rect(x,y,w,h,c);}function pot(x,y,w,h,c){r(x,y,w,2,'#6e4a30');r(x,y+2,w,h-3,c);r(x+1,y+2,2,h-4,'#e39a6a');r(x+1,y+h-1,w-2,1,'#8c5e3d');r(x+2,y+1,w-4,1,'#b98256');}
  if(id==='gh_lights'){
   for(var x=4;x<216;x++){var y=16+Math.round(4*Math.sin(Math.PI*((x-4)%70)/70));r(x,y,1,1,'#6f6651');}
   [12,37,62,87,112,137,162,187,212].forEach(function(x){var y=17+Math.round(4*Math.sin(Math.PI*((x-4)%70)/70));r(x,y,1,3,'#7c6c50');r(x-2,y+3,5,2,'#95794e');
    s+='<g class="gh-glass">'+rect(x-2,y+5,5,5,'#f7d57c')+rect(x-1,y+10,3,1,'#dbb46b')+'</g><g class="gh-filament">'+rect(x-1,y+6,2,3,'#fff4ce')+'</g>';
   });
  }else if(id==='gh_shelf'){
   /* 双层薄木架，陶盆、种子罐、小剪刀 */
   [153,212].forEach(function(x){r(x,116,3,36,'#8c5e3d');r(x,116,1,36,'#d9a571');r(x,152,4,2,'#5a3d2b');});
   [128,149].forEach(function(y){r(150,y,67,2,'#e8b26b');r(150,y+2,67,2,'#b98256');r(151,y+4,65,1,'#6e4a30');});
   pot(156,116,13,12,'#c9744a');pot(177,114,13,14,'#9ad07a');pot(198,116,13,12,'#d7a35c');
   [162,183,204].forEach(function(x,i){r(x,104,1,13,'#4a8a48');s+=leaf(x,111,i%2===0);s+='<g class="gh-shelf-flowers">'+shelfFlowerHead(flower(['daisy','rose','daisy'][i]),x,104)+'</g>';});
   pot(158,141,12,8,'#d9a571');r(163,134,2,7,'#4a8a48');r(159,135,5,2,'#9ad07a');r(166,133,4,2,'#6fae5c');
   r(178,138,9,11,'#4a8a48');r(179,140,7,8,'#9ad07a');r(177,137,11,2,'#b98256');r(181,143,3,3,'#eee0b7');
   r(196,140,12,9,'#e5ba70');r(196,140,12,1,'#af916d');r(198,143,8,1,'#f0dfb8');r(200,145,4,2,'#6fae5c');
  }else if(id==='gh_workbench'){
   /* 窗下育苗工作台：薄台面、抽屉、种子盒和一排新芽。 */
   r(152,124,62,2,'#e8b26b');r(151,126,64,3,'#b98256');r(152,129,62,2,'#6e4a30');
   [155,208].forEach(function(x){r(x,131,4,22,'#8c5e3d');r(x,131,1,22,'#d9a571');r(x,152,5,2,'#5a3d2b');});
   r(156,129,56,16,'#5a3d2b');r(158,130,52,13,'#8c5e3d');
   r(160,131,22,10,'#b98256');r(185,131,22,10,'#b98256');
   r(160,131,22,1,'#d9a571');r(185,131,22,1,'#d9a571');
   r(170,135,4,2,'#e5ba70');r(194,135,4,2,'#e5ba70');r(158,143,52,2,'#6e4a30');
   r(158,119,26,5,'#8c5e3d');r(159,120,24,3,'#aa784e');
   [162,170,178].forEach(function(x,i){r(x,112-i%2,1,7+i%2,'#4e7746');r(x-3,112-i%2,3,2,'#9ad07a');r(x+1,110-i%2,3,2,'#6fae5c');});
   r(189,113,10,11,'#edc66b');r(190,114,8,1,'#fff0cc');r(192,117,4,3,'#6fae5c');r(192,112,7,2,'#b18a5c');
   r(204,113,5,11,'#8fc0c0');r(205,114,1,8,'#c7e5db');r(205,108,2,6,'#8c5e3d');r(205,106,5,3,'#618b87');
  }else{
   r(160,198,56,18,'#4a8a48');r(162,200,52,14,'#9ad07a');r(164,202,48,10,'#6fae5c');
   [164,176,188,200].forEach(function(x,i){r(x,202+(i%2)*5,6,5,'#9ad07a');r(x+6,202+((i+1)%2)*5,6,5,'#9ad07a');});
  }
  return '<g class="gh-motion">'+outlinedArt(s)+'</g>';
 }
 function props(){var s='';['gh_lights','gh_shelf','gh_workbench','gh_mat'].forEach(function(id){s+='<g class="gh-'+id.slice(3)+'">'+propArt(id)+'</g>';});return '<svg class="gh-props" viewBox="0 0 220 224" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">'+s+'</svg>';}
 function shovelIcon(){return '<svg viewBox="0 0 28 28" aria-hidden="true" shape-rendering="crispEdges">'+rect(13,3,5,3,'#5a3d2b')+rect(12,6,3,9,'#b98256')+rect(7,15,10,2,'#527478')+rect(6,17,11,5,'#91b9b5')+rect(7,22,8,2,'#618b91')+rect(8,24,4,2,'#527478')+rect(8,17,2,4,'#cfe9f5')+'</svg>';}
 function uproot(i){var b=D.beds[i];if(!unlocked()||!b||busy[i])return false;return window.BooboConfirm.ask('铲除这簇'+flower(b.id).name+'，退回1包花种。生长时间不保留。',function(){if(!unlocked()||D.beds[i]!==b)return;D.seeds[b.id]=Math.min(9999,D.seeds[b.id]+1);D.beds[i]=null;save();render();API.say('花田整理好了，花种已放回抽屉。');},'整理这块花田？');}
 /* 仍使用 v40 的偏移坐标，回退文件后也不会把已调位置挪走。 */
 R.flowerDefaults({gh_shelf:{x:-2,b:72,u:0},gh_lights:{x:-2,b:0,u:0},gh_mat:{x:0,b:0,u:0}});
 R.flowerFinishingDefaults({gh_shelf:{x:-66,b:60,u:0},gh_lights:{x:0,b:0,u:0},gh_mat:{x:0,b:0,u:0}});
 R.flowerDetailDefaults();R.flowerOutlineDefaults();
 var ROWS={fl_row1:{x:50,b:-16,u:3},fl_row2:{x:50,b:0,u:3}};
 function paintRows(){
  Object.keys(ROWS).forEach(function(id,i){var el=garden.querySelector('[data-fl-row="'+i+'"]');if(!el)return;var m=layoutOf(id);
   el.style.transform='translate('+((m.x-50)*garden.clientWidth/100).toFixed(2)+'px,'+(-m.b)+'px) scale('+(m.u/3).toFixed(3)+')';
  });
 }
 var hitSig='';
 var FURN={gh_workbench:{x:83,b:112,u:3,ax:183,ay:128},gh_shelf:{x:80,b:174,u:3,ax:183,ay:132},gh_lights:{x:50,b:258,u:3,ax:110,ay:22},gh_mat:{x:85.45,b:21,u:3,ax:188,ay:207}};
 function layoutOf(id){var f=FURN[id]||ROWS[id];if(!f)return null;return R.flowerLayout(id,{x:f.x,b:f.b,u:f.u});}
 function paintFurniture(){
  var hit=garden.querySelector('.gh-hits'),key='',tf={};
  Object.keys(FURN).forEach(function(id){
   var f=FURN[id],g=garden.querySelector('.gh-'+id.slice(3)),m=layoutOf(id);if(!g)return;
   var dx=((m.x-f.x)*2.2).toFixed(2),dy=(-(m.b-f.b)/1.5).toFixed(2),u=(m.u/3).toFixed(3);
   tf[id]='translate('+dx+' '+dy+') translate('+f.ax+' '+f.ay+') scale('+u+') translate('+(-f.ax)+' '+(-f.ay)+')';
   g.setAttribute('transform',tf[id]);key+=id+dx+dy+u+((API.state.placed||[]).indexOf(id)<0?'0':'1')+'|';
  });key+=Math.round(garden.getBoundingClientRect().width)+':'+garden.clientHeight;
  if(key!==hitSig){hitSig=key;var sr=garden.getBoundingClientRect(),html='';
   Object.keys(FURN).forEach(function(id){
    if((API.state.placed||[]).indexOf(id)<0)return;var g=garden.querySelector('.gh-'+id.slice(3));if(!g)return;
    var br=g.getBoundingClientRect(),it=(API.items||[]).filter(function(x){return x.id===id;})[0];
    html+='<button type="button" class="gh-hit" data-gh="'+id+'" aria-label="'+(it?it.name:id)+
     '，点击互动" style="left:'+Math.round(br.left-sr.left)+'px;top:'+Math.round(br.top-sr.top)+
     'px;width:'+Math.max(30,Math.round(br.width))+'px;height:'+Math.max(id==='gh_lights'?18:30,Math.round(br.height))+'px"></button>';
   });if(hit.innerHTML!==html)hit.innerHTML=html;
  }
  var lights=garden.querySelector('.gh-lights'),lit=D.lightOn&&(API.state.placed||[]).indexOf('gh_lights')>=0;
  lights.classList.toggle('is-off',!D.lightOn);garden.classList.toggle('lit',lit);
  var lm=layoutOf('gh_lights');garden.style.setProperty('--gh-glow-x',lm.x+'%');garden.style.setProperty('--gh-glow-y',(31-(lm.b-258))+'px');
 
 }
 function interact(id){if(!unlocked()||(API.state.placed||[]).indexOf(id)<0)return;var g=garden.querySelector('.gh-'+id.slice(3)+' .gh-motion');if(id==='gh_lights'){D.lightOn=!D.lightOn;save();render();API.say(D.lightOn?'灯串亮起来啦。':'把灯串关掉，看看窗外的景色。');return;}if(g){g.classList.remove('gh-playing');void g.getBoundingClientRect();g.classList.add('gh-playing');setTimeout(function(){g.classList.remove('gh-playing');},1000);}if(id==='gh_mat')API.pose('happy');API.say(id==='gh_workbench'?'啵啵把种子盒摆整齐，轻轻扶了扶小苗。':id==='gh_shelf'?'啵啵把花盆扶正，擦了擦木架。':'啵啵踩了踩软软的地垫，开心地蹦了一下。');}
 function ready(b){return b&&Date.now()>=b.end;}
 function stage(){return document.getElementById('petStage');}
 function unlocked(){var p=window.BooboPlus&&window.BooboPlus.get();return p&&p.lv>=31;}
 function wear(){var pc=document.getElementById('petCharacter'),el=document.getElementById('flowerCrown');if(!el){el=document.createElement('span');el.id='flowerCrown';el.setAttribute('aria-hidden','true');pc.appendChild(el);}var w=D.wreaths.find(function(w){return w.id===D.wear;});el.hidden=!w;var key=w?w.id:'';if(key!==wearSig){wearSig=key;if(w)el.innerHTML=wreathArt(w.flowers);}}
 var garden,tools,sig='',dialog=null,pick=[],bedIndex=0,mode='plant',selected=flower(raw.selected)?raw.selected:'daisy',busy={},wearSig='';
 function plotArt(){
  var s='';function r(x,y,w,h,c){s+=rect(x,y,w,h,c);}
  r(0,0,64,3,'#6e4a30');s+='<rect class="pl-soil" x="2" y="2" width="60" height="12" fill="#8a6348"/>';
  [[6,4],[18,7],[30,3],[42,8],[52,5],[24,11],[46,12]].forEach(function(a){r(a[0],a[1],3,2,'#a57e61');});
  [[12,9],[36,6],[56,10]].forEach(function(a){r(a[0],a[1],2,2,'#6e4a30');});
  r(0,13,64,3,'#d9a571');r(0,16,64,7,'#b98256');[10,22,34,46].forEach(function(x){r(x,16,2,7,'#8c5e3d');});
  r(0,23,64,2,'#5a3d2b');r(0,0,3,25,'#8c5e3d');r(61,0,3,25,'#8c5e3d');r(0,0,3,2,'#d9a571');r(61,0,3,2,'#d9a571');
  r(0,0,64,1,'#5a3d2b');r(0,1,1,24,'#5a3d2b');r(63,1,1,24,'#5a3d2b');
  return '<svg viewBox="0 0 64 25" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true">'+s+'</svg>';
 }
 var PLOT=plotArt();
 function gardenHTML(){return [0,1].map(function(row){return '<div class="fl-row" data-fl-row="'+row+'">'+D.beds.slice(row*3,row*3+3).map(function(b,j){var i=row*3+j;
  var rp=ready(b),pct=b?Math.max(0,Math.min(1,(Date.now()-b.start)/Math.max(1,b.end-b.start))):0;
  var txt=b?(rp?'可收花':Math.max(1,Math.ceil((b.end-Date.now())/60000))+'分钟'):'空地';var nm=b?flower(b.id).name:'空花田';
  return '<button type="button" class="fl-bed'+(rp?' ripe':'')+(b&&b.water?' watered':'')+
   '" data-bed="'+i+'" aria-label="花田'+(i+1)+'：'+(b?nm+(rp?'，可以收花':'，生长中')+'，'+txt:'空地，点击种花')+
   '"><span class="fl-plot">'+PLOT+'</span>'+(b?art(b.id,rp?2:pct>.55?1:0):'')+
   '<span class="fl-bed-label">'+nm+' <i>'+txt+'</i></span></button>';}).join('')+'</div>';}).join('');}
 function seedIcon(){return '<svg viewBox="0 0 26 28" aria-hidden="true" shape-rendering="crispEdges">'+rect(5,3,16,22,'#ddc99e')+rect(7,5,12,17,'#f5e5bf')+rect(8,7,10,2,'#b3a081')+rect(12,13,2,7,'#66875e')+rect(8,12,5,3,'#91ac72')+rect(14,10,4,3,'#91ac72')+'</svg>';}
 function basket(){return '<svg viewBox="0 0 28 28" aria-hidden="true" shape-rendering="crispEdges">'+rect(7,7,14,3,'#9d805a')+rect(5,10,3,7,'#9d805a')+rect(20,10,3,7,'#9d805a')+rect(3,16,22,8,'#be9c6b')+rect(5,18,18,4,'#d9bc8a')+rect(4,15,20,3,'#947655')+rect(9,18,2,6,'#b18e60')+rect(17,18,2,6,'#b18e60')+'</svg>';}
 function render(){var st=stage(),on=R.scene()==='flower';unlockSeeds();if(!garden){garden=document.createElement('div');garden.id='flowerGarden';garden.innerHTML=skyLayer()+greenhouse()+props()+'<i class="gh-ambient" aria-hidden="true"></i><i class="gh-night-shade" aria-hidden="true"></i><div class="fl-beds"></div><div class="gh-hits"></div><div class="fl-effects" aria-hidden="true"></div>';st.appendChild(garden);garden.addEventListener('click',function(e){var b=e.target.closest('[data-bed]');if(b)tapBed(Number(b.dataset.bed));var h=e.target.closest('[data-gh]');if(h)interact(h.dataset.gh);});tools=document.createElement('div');tools.id='flowerTools';tools.innerHTML='<div class="fl-toolbar"><button type="button" data-fl="seed">'+seedIcon()+'<span>花种</span></button><button type="button" data-fl="water">'+pail()+'<span>浇水</span></button><button type="button" data-fl="shovel">'+shovelIcon()+'<span>铲除</span></button><button type="button" data-fl="make">'+wreathIcon()+'<span>编花环</span></button><button type="button" data-fl="wardrobe">'+basket()+'<span>花环盒</span></button></div><p id="flToolHint" aria-live="polite"></p>';st.insertAdjacentElement('afterend',tools);tools.addEventListener('click',function(e){var a=e.target.closest('[data-fl]');if(!a)return;if(a.dataset.fl==='seed'){if(mode!=='plant'&&flower(selected)){mode='plant';render();}else openSeeds();}else if(a.dataset.fl==='water'){mode=mode==='water'?'plant':'water';render();}else if(a.dataset.fl==='shovel'){mode=mode==='shovel'?'plant':'shovel';render();}else if(a.dataset.fl==='make')openMake();else openWardrobe();});}
  /* BOOBO_FLOWER_FIX_V40 */ garden.hidden=tools.hidden=!on;st.classList.toggle('sky-scene',R.scene()==='yard'||R.scene()==='door'||on);wear();if(!on){sig='';hitSig='';return;}
  garden.dataset.level=String(lv());['shelf','lights','workbench','mat'].forEach(function(k){garden.querySelector('.gh-'+k).style.display=(API.state.placed||[]).indexOf('gh_'+k)>=0?'':'none';});
  paintFurniture();
  tools.querySelector('[data-fl="water"]').classList.toggle('selected',mode==='water');tools.querySelector('[data-fl="shovel"]').classList.toggle('selected',mode==='shovel');tools.querySelector('[data-fl="seed"]').classList.toggle('selected',mode==='plant');document.getElementById('flToolHint').textContent=mode==='shovel'?'铲子已选中 · 点花田铲除，退回1包花种':mode==='water'?'水壶已选中 · 点花田浇水 · 再点水壶收起':flower(selected).name+'种子 '+D.seeds[selected]+' 包 · 点空地种下，再点花种可更换';
  var next=D.beds.map(function(b){return b?b.id+':'+(ready(b)?'r':Math.ceil((b.end-Date.now())/60000))+':'+b.water+':'+(Date.now()-b.start>(b.end-b.start)*.55):'-';}).join('|');if(next!==sig){sig=next;garden.querySelector('.fl-beds').innerHTML=gardenHTML();}paintRows();
  var box=document.getElementById('gameOverlay');if(box&&box.hidden)dialog=null;
 }
 function closePanel(){document.getElementById('closeGame').click();dialog=null;}
 function burst(i,kind){var bed=garden.querySelector('[data-bed="'+i+'"]'),layer=garden.querySelector('.fl-effects'),r=bed.getBoundingClientRect(),g=garden.getBoundingClientRect(),el=document.createElement('span');el.className='fl-fx fl-'+kind;el.style.left=(r.left-g.left+r.width/2)+'px';el.style.top=(r.top-g.top+10)+'px';el.innerHTML=kind==='watering'?pail()+'<i></i><i></i><i></i>':'<b>+3</b><i></i><i></i><i></i>';layer.appendChild(el);setTimeout(function(){el.remove();},1100);}
 function tapBed(i){if(!unlocked()||busy[i])return;var b=D.beds[i];if(mode==='shovel'){if(b)uproot(i);else API.say('这里已经是空花田啦。');return;}if(ready(b)){harvest(i);return;}if(mode==='water'){if(!b){API.say('这块田还空着，先选花种种下去再浇水吧。');return;}water(i);return;}if(!b){if(D.seeds[selected]>0)plant(i,selected);else API.say('这包花种用完啦，点花种工具补种或换一种。');return;}API.say(flower(b.id).name+'还在长，选水壶后点它就能浇水。');}
 function water(i){var b=D.beds[i];if(!unlocked()||!b||busy[i]||ready(b))return;if(b.water){API.say('这块花田喝饱水啦，等花慢慢开。');return;}b.end=Date.now()+Math.max(0,b.end-Date.now())*.7;b.water=true;D.stats.watered++;busy[i]=true;save();render();burst(i,'watering');setTimeout(function(){delete busy[i];},1000);API.say('啵啵举起小水壶，给整簇花浇了水。');flowerChanged();}
 function openSeeds(){if(!unlocked())return;panel('<p class="fl-tip">每解锁一种花，收到 4 包种子。补种只需 1★。</p><div class="fl-seeds">'+FLOWERS.map(function(f){var lock=lv()<f.lv;return '<div class="fl-seed-card'+(lock?' locked':'')+(selected===f.id?' chosen':'')+'"><button type="button" data-seed="'+f.id+'" aria-pressed="'+(selected===f.id)+'"'+(lock||D.seeds[f.id]<1?' disabled':'')+'>'+art(f.id,2,true)+'<b>'+f.name+'</b><small>'+(lock?'Lv'+f.lv+'解锁':D.seeds[f.id]+' 包 · '+f.time/60+'分钟')+'</small></button>'+(!lock?'<button type="button" class="fl-buy" data-buy="'+f.id+'">补 1 包 · 1★</button>':'<span class="fl-lock">升级赠送花种</span>')+'</div>';}).join('')+'</div>','温室的花种抽屉','seed');var box=document.querySelector('.fl-seeds');box.onclick=function(e){var a=e.target.closest('[data-seed]'),b=e.target.closest('[data-buy]');if(a&&!a.disabled){selected=a.dataset.seed;D.selected=selected;save();mode='plant';closePanel();render();API.say('选好了'+flower(selected).name+'，点空花田种下吧。');}else if(b){var f=flower(b.dataset.buy);if(lv()<f.lv||API.state.stars<1){API.say('还差一颗星星。');return;}if(D.seeds[f.id]>=9999){API.say('这种花种已经装满啦。');return;}D.seeds[f.id]++;API.state.stars--;save();API.save();API.render();openSeeds();}};}
 function panel(html,title,kind){if(!unlocked()){API.say('花圃在 Lv31 开门。');return;}dialog=kind;var ov=document.getElementById('gameOverlay');ov.hidden=false;ov.classList.add('show');ov.querySelector('.modal-head strong').textContent=title;document.getElementById('gameContent').innerHTML='<div class="fl-panel">'+html+'</div>';}
 function openBed(i){tapBed(i);}
 function plant(i,id){var f=flower(id);if(!unlocked()||!Number.isInteger(i)||i<0||i>=6||D.beds[i]||!f||lv()<f.lv||D.seeds[id]<1)return false;D.seeds[id]--;D.beds[i]={id:id,start:Date.now(),end:Date.now()+f.time*1000,water:false};save();render();API.say('种下一包'+f.name+'，会长出一小簇。');return true;}
 function harvest(i){var b=D.beds[i];if(!unlocked()||!ready(b))return false;D.stock[b.id]=Math.min(9999,D.stock[b.id]+3);D.beds[i]=null;D.stats.harvests++;rememberFlower(b.id);save();render();burst(i,'harvested');API.say('收下了 3 朵'+flower(b.id).name+'。');render();flowerChanged();return true;}
 function harvestAll(){if(!unlocked())return;var n=0;D.beds.forEach(function(b,i){if(harvest(i))n++;});API.say(n?'啵啵把 '+n*3+' 朵新鲜的花抱进了花篮。':'花还在慢慢长，先陪啵啵坐一会儿吧。');}
 function makeHTML(){return '<p class="fl-tip">选 6 朵花，可以混搭，也可以只用一种。<br>花环会一直保留，不会消耗掉。</p><div class="fl-wreath-preview">'+wreathArt(pick)+'</div><p class="fl-selected">已选 '+pick.length+' / 6</p><div class="fl-materials">'+FLOWERS.map(function(f){var n=pick.filter(function(id){return id===f.id;}).length,avail=D.stock[f.id]-n;return '<button type="button" data-add="'+f.id+'"'+(avail<=0||pick.length===6?' disabled':'')+'>'+art(f.id,2)+'<span>'+f.name+'</span><small>剩 '+avail+' 朵</small></button>';}).join('')+'</div><div class="fl-buttons"><button type="button" data-undo'+(!pick.length?' disabled':'')+'>撤回一朵</button><button type="button" data-craft'+(pick.length!==6?' disabled':'')+'>编好并戴上</button></div><p class="fl-tip">花环盒 '+D.wreaths.length+' / 24 · 花材只在编好时扣除</p>';}
 function drawMake(){panel(makeHTML(),'给啵啵编花环','make');document.querySelector('.fl-panel').onclick=function(e){var add=e.target.closest('[data-add]');if(add&&!add.disabled){pick.push(add.dataset.add);drawMake();}else if(e.target.closest('[data-undo]')&&pick.length){pick.pop();drawMake();}else if(e.target.closest('[data-craft]'))craft();};}
 function openMake(){if(!unlocked())return;pick=[];drawMake();}
 function craft(){if(!unlocked()||pick.length!==6)return;if(D.wreaths.length>=24){API.say('花环盒装满了，可以先拆一只，花材会退回来。');return;}var need={};pick.forEach(function(id){need[id]=(need[id]||0)+1;});if(Object.keys(need).some(function(id){return D.stock[id]<need[id];}))return;Object.keys(need).forEach(function(id){D.stock[id]-=need[id];});var id='w'+Date.now()+'-'+D.next++;D.wreaths.push({id:id,flowers:pick.slice()});D.wear=id;D.stats.crafted++;pick=[];save();wear();API.say('啵啵戴上你编的花环，开心地晃了晃。');API.pose('happy');openWardrobe();flowerChanged();}
 function openWardrobe(){if(!unlocked())return;panel('<p class="fl-tip">戴着花环，也能去其他房间玩。</p><div class="fl-wardrobe">'+D.wreaths.map(function(w,i){return '<div class="fl-wreath">'+wreathArt(w.flowers)+'<b>花环 '+(i+1)+(D.wear===w.id?' · 正在戴':'')+'</b><div><button type="button" data-wear="'+w.id+'">'+(D.wear===w.id?'摘下':'戴上')+'</button><button type="button" data-unweave="'+w.id+'">拆回花材</button></div></div>';}).join('')+'</div>'+(!D.wreaths.length?'<p class="fl-tip">花环盒还空着，先去收几朵花吧。</p>':'')+'<button type="button" id="flNewWreath">再编一个花环</button>','啵啵的花环盒','wardrobe');var box=document.querySelector('.fl-panel');if(!box)return;box.onclick=function(e){var a=e.target.closest('[data-wear]'),b=e.target.closest('[data-unweave]');if(a){D.wear=D.wear===a.dataset.wear?null:a.dataset.wear;save();wear();openWardrobe();}else if(b){var i=D.wreaths.findIndex(function(w){return w.id===b.dataset.unweave;});if(i<0)return;var target=D.wreaths[i];window.BooboConfirm.ask('拆开后，6朵花会回到花篮。',function(){var n=D.wreaths.indexOf(target);if(n<0)return;target.flowers.forEach(function(id){D.stock[id]=Math.min(9999,D.stock[id]+1);});if(D.wear===target.id)D.wear=null;D.wreaths.splice(n,1);save();wear();openWardrobe();},'拆开这只花环？');}else if(e.target.closest('#flNewWreath'))openMake();};}
 window.BooboFlower={snapshot:function(){var d=JSON.parse(JSON.stringify(D));d.selected=selected;return d;},icon:function(id){return art(id,2,true);},state:function(){return D;},FLOWERS:FLOWERS,render:render,openBed:openBed,openMake:openMake,openWardrobe:openWardrobe,plant:plant,water:water,harvest:harvest,uproot:uproot,layout:layoutOf,FURN:FURN,interact:interact,openSeeds:openSeeds,cheat:function(cmd){if(cmd==='grow')D.beds.forEach(function(b){if(b)b.end=Date.now()-1;});else if(cmd==='stock')FLOWERS.forEach(function(f){D.stock[f.id]=Math.min(9999,D.stock[f.id]+12);rememberFlower(f.id);});save();render();flowerChanged();API.say(cmd==='grow'?'花田里的花都成熟啦。':'每种花材补充了12朵。');}};
 var draw=R.draw;R.draw=function(){var result=draw.apply(R,arguments);render();return result;};document.addEventListener('boobo:scene',render);document.addEventListener('visibilitychange',function(){if(!document.hidden)render();});var redraw=R.redraw;R.redraw=function(){redraw();render();};var nudge=R.nudge;R.nudge=function(){nudge.apply(R,arguments);render();};var reset=R.resetLayout;R.resetLayout=function(){reset.apply(R,arguments);render();};var dump=R.dumpLayout;R.dumpLayout=function(){if(R.scene()!=='flower')return dump();var o={scene:'flower'};R.editIds().forEach(function(id){o[id]=layoutOf(id);});return JSON.stringify(o);};render();flowerChanged();window.addEventListener('pageshow',render);setInterval(function(){if(!document.hidden)render();},1000);
})();
