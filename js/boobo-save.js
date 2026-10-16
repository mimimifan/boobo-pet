/* v49: portable JSON saves. No cloud upload. Runs before game loaders. */
(function () {
  'use strict';
  var KEYS = ['boobo_pet_v2','boobo_plus_v1','boobo_life_v1','boobo_act_v1',
    'boobo_kitchen_v1','boobo_yard_v1','boobo_court_v1','boobo_flower_v1',
    'boobo_layout_v5','boobo_scene_v1'];
  var PENDING='boobo_save_pending_v1', BACKUP='boobo_save_backup_v1', LIMIT=1048576;
  var FLOWERS=['daisy','tulip','sun','rose','lavender','hydrangea'];
  var SCENES=['bed','living','kitchen','door','yard','flower'];
  var RECIPES=['tomato','rice','soup','pancake','wonton','pudding'];
  var own=function(o,k){return Object.prototype.hasOwnProperty.call(o,k);};
  var notice='', fatal=false, selected=null, origin=null, locked=[], box, status, readId=0;
  function fail(s){throw new Error(s);}
  function object(x){return !!x && typeof x==='object' && !Array.isArray(x);}
  function safeTree(x,depth){
    if(depth>12)fail('存档层级过深。');
    if(x===null || typeof x==='boolean')return;
    if(typeof x==='number'){if(!Number.isFinite(x)||Math.abs(x)>9e15)fail('存档数值无效。');return;}
    if(typeof x==='string'){if(x.length>160||!/^[A-Za-z0-9_:.+ /-]*$/.test(x))fail('存档含有不支持的文字字段。');return;}
    if(typeof x!=='object')fail('存档字段类型无效。');
    var keys=Object.keys(x);if(keys.length>512)fail('存档项目过多。');
    keys.forEach(function(k){
      if(['__proto__','prototype','constructor'].indexOf(k)>=0||!/^[A-Za-z0-9_:-]{1,60}$/.test(k))fail('存档字段名称无效。');
      safeTree(x[k],depth+1);
    });
  }
  function array(x,max){if(!Array.isArray(x)||x.length>max)fail('存档列表无效。');}
  function number(x,min,max){if(typeof x!=='number'||!Number.isFinite(x)||x<min||x>max)fail('存档数值超出范围。');}
  function integer(x,min,max){number(x,min,max);if(!Number.isSafeInteger(x))fail('存档计数必须是整数。');}
  function fields(d,names){if(!d)return;names.forEach(function(k){if(own(d,k))integer(d[k],0,Number.MAX_SAFE_INTEGER);});}
  function countMap(d,k){if(!own(d,k))return;if(!object(d[k]))fail('存档计数表格式无效。');Object.keys(d[k]).forEach(function(id){integer(d[k][id],0,Number.MAX_SAFE_INTEGER);});}
  function validate(data){
    if(!object(data)||Object.keys(data).length!==KEYS.length||KEYS.some(function(k){return !own(data,k);}))fail('存档不完整：需要全部 10 组游戏数据。');
    var parsed={};
    KEYS.forEach(function(k){var s=data[k];if(s===null){parsed[k]=null;return;}
      if(typeof s!=='string'||s.length>LIMIT)fail('存档内容无效。');
      if(k==='boobo_scene_v1'){if(SCENES.indexOf(s)<0)fail('场景无效。');parsed[k]=s;return;}
      var d;try{d=JSON.parse(s);}catch(e){fail('某组游戏数据无法读取。');}
      if(!object(d))fail('游戏数据格式无效。');safeTree(d,0);parsed[k]=d;
    });
    var p=parsed.boobo_pet_v2, l=parsed.boobo_plus_v1, f=parsed.boobo_flower_v1;
    if(!p||!l||!f||!parsed.boobo_layout_v5)fail('缺少主存档、等级、花圃或家具位置。');
    ['hunger','mood','energy','bond'].forEach(function(k){number(p[k],0,100);});
    ['stars','games'].forEach(function(k){number(p[k],0,Number.MAX_SAFE_INTEGER);});
    array(p.owned,256);array(p.placed,256);
    if(p.owned.concat(p.placed).some(function(id){return typeof id!=='string'||!/^[a-z][a-z0-9_]{0,50}$/.test(id);}))fail('家具编号无效。');
    if(!object(p.paid)||typeof p.sleeping!=='boolean')fail('主存档字段缺失。');
    fields(p,['stars','games']);countMap(p,'paid');
    integer(l.lv,1,36);fields(l,['exp','streak','days','dayExp','pick']);
    ['tasks','counts','best'].forEach(function(k){countMap(l,k);});
    if(own(l,'achAt')&&!object(l.achAt))fail('成就日期格式无效。');
    array(l.achs,256);
    if(l.achs.some(function(id){return typeof id!=='string';}))fail('成就编号无效。');
    var life=parsed.boobo_life_v1;
    if(life){fields(life,['t','milk']);if(own(life,'acc')){if(!object(life.acc))fail('时间累积器格式无效。');Object.keys(life.acc).forEach(function(k){number(life.acc[k],0,1);});}}
    var act=parsed.boobo_act_v1;
    if(act){fields(act,['fish','toy']);countMap(act,'cnt');if(own(act,'lamps')){if(!object(act.lamps))fail('灯光存档格式无效。');Object.keys(act.lamps).forEach(function(k){if([null,0,1].indexOf(act.lamps[k])<0)fail('灯光状态无效。');});}}
    fields(parsed.boobo_yard_v1,['mails']);fields(parsed.boobo_court_v1,['swing','lie','ball','water','seed']);
    number(l.lv,1,36);number(l.exp,0,Number.MAX_SAFE_INTEGER);array(l.achs,256);
    array(f.beds,6);if(f.beds.length!==6)fail('花田数量无效。');
    f.beds.forEach(function(b){if(b===null)return;if(!object(b)||FLOWERS.indexOf(b.id)<0)fail('花种无效。');number(b.start,1,9e15);number(b.end,1,9e15);});
    array(f.wreaths,24);var ids=[];
    f.wreaths.forEach(function(w){if(!object(w)||typeof w.id!=='string'||!/^w[0-9]+-[0-9]+$/.test(w.id)||ids.indexOf(w.id)>=0)fail('花环编号无效。');ids.push(w.id);array(w.flowers,6);if(w.flowers.length!==6||w.flowers.some(function(id){return FLOWERS.indexOf(id)<0;}))fail('花环花材无效。');});
    if(f.wear!==null&&ids.indexOf(f.wear)<0)fail('佩戴的花环不存在。');
    if(!object(f.seeds)||!object(f.stock))fail('花种或花篮数据无效。');
    ['seeds','stock'].forEach(function(k){FLOWERS.forEach(function(id){number(f[k][id],0,9999);});});
    fields(f,['next']);
    if(own(f,'selected')&&FLOWERS.indexOf(f.selected)<0)fail('选中的花种无效。');
    if(own(f,'gifts')){array(f.gifts,6);if(f.gifts.some(function(id){return FLOWERS.indexOf(id)<0;}))fail('花种赠礼记录无效。');}
    if(own(f,'stats')){if(!object(f.stats))fail('花圃统计格式无效。');fields(f.stats,['harvests','watered','crafted']);if(own(f.stats,'kinds')){array(f.stats.kinds,6);if(f.stats.kinds.some(function(id){return FLOWERS.indexOf(id)<0;}))fail('花材统计无效。');}}
    var kitchen=parsed.boobo_kitchen_v1;
    if(kitchen){array(kitchen.dishes,8);kitchen.dishes.concat(kitchen.pending?[kitchen.pending]:[]).forEach(function(d){if(!object(d)||RECIPES.indexOf(d.id)<0)fail('菜品无效。');number(d.q,0,3);});}
    if(kitchen){fields(kitchen,['made','perfect','snack']);if(own(kitchen,'diff'))integer(kitchen.diff,0,2);kitchen.dishes.concat(kitchen.pending?[kitchen.pending]:[]).forEach(function(d){integer(d.q,0,3);});}
    Object.keys(parsed.boobo_layout_v5).forEach(function(k){var v=parsed.boobo_layout_v5[k];if(k.indexOf('__')===0){number(v,0,100);return;}if(!object(v))fail('家具位置无效。');Object.keys(v).forEach(function(a){if(['x','b','u'].indexOf(a)<0)fail('家具位置字段无效。');number(v[a],-10000,10000);});});
    return parsed;
  }
  // CRC32 detects accidental file corruption; it is not an authenticity signature.
  function checksum(data){var s=JSON.stringify(KEYS.map(function(k){return [k,data[k]];})),c=-1;
    for(var i=0;i<s.length;i++){c^=s.charCodeAt(i);for(var j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return ((c^-1)>>>0).toString(16).padStart(8,'0');}
  function envelope(data){validate(data);return {format:'boobo-save',schemaVersion:1,gameVersion:51,exportedAt:new Date().toISOString(),data:data,checksum:checksum(data)};}
  function decode(text){
    if(typeof text!=='string'||new Blob([text]).size>LIMIT)fail('文件过大，最多支持 1 MB。');
    var e;try{e=JSON.parse(text);}catch(err){fail('不是有效的 JSON 存档文件。');}
    if(!object(e)||e.format!=='boobo-save'||e.schemaVersion!==1)fail('不支持这个存档格式或版本。');
    if(typeof e.exportedAt!=='string'||!Number.isFinite(Date.parse(e.exportedAt)))fail('导出时间无效。');
    var d=validate(e.data);if(e.checksum!==checksum(e.data))fail('完整性校验失败，文件可能没有复制完整。');
    return {file:e,parsed:d};
  }
  function raw(){var d={};KEYS.forEach(function(k){d[k]=localStorage.getItem(k);});return d;}
  function snapshot(){
    if(!window.BooboAPI||!window.BooboPlus||!window.BooboFlower)fail('游戏还没准备好，请稍后重试。');
    if(window.BooboLife)window.BooboLife.flush();
    var d=raw();d.boobo_pet_v2=JSON.stringify(window.BooboAPI.state);
    if(window.BooboLife&&window.BooboLife.state)d.boobo_life_v1=JSON.stringify(window.BooboLife.state());
    d.boobo_plus_v1=JSON.stringify(window.BooboPlus.get());
    [['Act','act'],['Kitchen','kitchen'],['Yard','yard'],['Court','court'],['Flower','flower']].forEach(function(pair){var api=window['Boobo'+pair[0]];if(api&&api.state)d['boobo_'+pair[1]+'_v1']=JSON.stringify(api.state());});
    d.boobo_flower_v1=JSON.stringify(window.BooboFlower.snapshot());
    d.boobo_layout_v5=window.BooboRoom.exportLayout();d.boobo_scene_v1=window.BooboRoom.scene();
    return envelope(d);
  }
  function apply(data){KEYS.forEach(function(k){if(data[k]===null)localStorage.removeItem(k);else localStorage.setItem(k,data[k]);});}
  // A reload runs this transaction before room / pet modules read their state.
  // The old page's pagehide save happens before this point, never after import.
  try{
    var pending=localStorage.getItem(PENDING);
    if(pending){var job=JSON.parse(pending), target=decode(JSON.stringify(job.target));
      validate(job.before);
      try{apply(target.file.data);if(KEYS.some(function(k){return localStorage.getItem(k)!==target.file.data[k];}))fail('写入校验失败。');localStorage.removeItem('boobo_dbg_day');localStorage.removeItem(PENDING);notice='存档已恢复，欢迎和啵啵继续玩。';}
      catch(err){try{apply(job.before);localStorage.removeItem(PENDING);notice='导入没有完成，已保留导入前进度。请先导出备份，检查剩余空间后再试。';}catch(undo){fatal=true;notice='存储空间异常，恢复尚未完成。请保留本页与原存档文件，释放设备空间后重新打开。';}}
    }
  }catch(err){fatal=true;notice='待恢复的数据无法校验。游戏已暂停，请先保留原始存档文件。';}
  if(fatal){var write=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
    Storage.prototype.setItem=function(k,v){if(KEYS.indexOf(k)>=0)return;return write.call(this,k,v);};
    Storage.prototype.removeItem=function(k){if(KEYS.indexOf(k)>=0)return;return remove.call(this,k);};}
  function message(s){status.textContent=s;}
  function details(e){var d=e.parsed,p=d.boobo_pet_v2,f=d.boobo_flower_v1;
    return '导出于 '+new Date(e.file.exportedAt).toLocaleString()+'\n等级 '+d.boobo_plus_v1.lv+' · 星星 '+p.stars+'\n家具 '+p.owned.length+' 件 · 成就 '+d.boobo_plus_v1.achs.length+' 项\n花环 '+f.wreaths.length+' 只 · 种植中 '+f.beds.filter(Boolean).length+' 块田';}
  function preview(text){selected=null;box.querySelector('#saveCommit').disabled=true;
    try{selected=decode(text);message(details(selected)+'\n确认后会替换当前进度；导入前会自动留一份本机备份。');box.querySelector('#saveCommit').disabled=false;}catch(e){message(e.message);}
  }
  function queue(e){
    try{var before=snapshot().data, prior=localStorage.getItem(BACKUP);
      localStorage.setItem(BACKUP,JSON.stringify(envelope(before)));
      try{localStorage.setItem(PENDING,JSON.stringify({target:e,before:before}));}
      catch(err){try{if(prior===null)localStorage.removeItem(BACKUP);else localStorage.setItem(BACKUP,prior);}catch(ignore){}throw err;}
      window.__booboStorageReload=true;location.reload();
    }catch(err){message('暂时无法准备恢复，当前进度未替换。请先导出备份并检查浏览器存储空间。');}
  }
  function close(){if(!box||box.hidden||fatal)return;box.hidden=true;selected=null;readId++;locked.forEach(function(p){p[0].inert=p[1];});locked=[];if(origin&&origin.isConnected)origin.focus();}
  function open(){
    var game=document.getElementById('gameOverlay');if(game&&!game.hidden){window.BooboAPI.say('先结束当前小游戏，再整理存档吧。');return;}
    if(!box.hidden)return;origin=document.activeElement;selected=null;readId++;
    box.querySelector('#saveCommit').disabled=true;box.querySelector('#saveFile').value='';box.querySelector('#saveText').value='';
    box.querySelector('#saveRestore').disabled=!localStorage.getItem(BACKUP);
    message(notice||'进度保存在当前浏览器或安装包里。换网址、换设备或安装 APK 前，先导出一份 JSON 存档。');
    locked=Array.from(document.body.children).filter(function(el){return el!==box&&['SCRIPT','STYLE','LINK'].indexOf(el.tagName)<0;}).map(function(el){var old=el.inert;el.inert=true;return [el,old];});
    box.hidden=false;box.querySelector('#saveClose').focus();
  }
  function boot(){
    box=document.createElement('div');box.id='booboSave';box.hidden=true;
    box.innerHTML='<section class="save-card" role="dialog" aria-modal="true" aria-labelledby="saveTitle"><div class="save-head"><h2 id="saveTitle">啵啵的存档盒</h2><button type="button" id="saveClose" aria-label="关闭存档盒">关闭</button></div><p class="save-note">本地保存 · 手动迁移 · 不会上传存档</p><div class="save-actions"><button type="button" id="saveExport">导出存档</button><label class="save-file" tabindex="0" role="button">选择存档<input id="saveFile" type="file" accept=".json,application/json" aria-label="选择 JSON 存档"></label></div><details><summary>下载或选文件不方便？用文本迁移</summary><textarea id="saveText" maxlength="1048576" spellcheck="false" aria-label="存档 JSON 文本" placeholder="导出后可复制这里的内容；导入时粘贴完整 JSON"></textarea><div class="save-actions"><button type="button" id="saveCopy">复制文本</button><button type="button" id="savePreview">预览文本</button></div></details><p id="saveStatus" role="status" aria-live="polite"></p><div class="save-actions"><button type="button" id="saveRestore">找回导入前进度</button><button type="button" id="saveCommit" disabled>确认导入</button></div><p class="save-note">导入会刷新页面。请关闭其他同网址游戏标签页；浏览器与 APK 不会自动同步。</p></section>';
    document.body.appendChild(box);status=box.querySelector('#saveStatus');
    var entry=document.createElement('button');entry.type='button';entry.id='openSave';entry.className='save-entry';entry.textContent='存档 · 备份与迁移';
    document.querySelector('footer').insertAdjacentElement('beforebegin',entry);entry.onclick=open;
    box.querySelector('#saveClose').onclick=close;box.onclick=function(e){if(e.target===box)close();};
    box.querySelector('.save-file').onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();box.querySelector('#saveFile').click();}};
    box.querySelector('#saveFile').onchange=function(e){var f=e.target.files[0];if(!f)return;var token=++readId;selected=null;box.querySelector('#saveCommit').disabled=true;if(f.size>LIMIT){selected=null;box.querySelector('#saveCommit').disabled=true;message('文件过大，最多支持 1 MB。');return;}var reader=new FileReader();reader.onload=function(){if(token!==readId)return;box.querySelector('#saveText').value=reader.result;preview(reader.result);};reader.onerror=function(){if(token!==readId)return;message('文件读取失败，请重新选择。');};reader.readAsText(f);};
    box.querySelector('#saveExport').onclick=function(){try{var e=snapshot(),text=JSON.stringify(e,null,2);selected=null;readId++;box.querySelector('#saveCommit').disabled=true;box.querySelector('#saveText').value=text;
      var a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.href=url;a.download='boobo-save-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},60000);message('已生成 JSON 存档，请确认文件已下载。若没有弹出下载，可展开文本迁移，复制完整内容。');
    }catch(e){message('导出失败：'+e.message+' 请先保留当前页面，不要清除网站数据。');}};
    box.querySelector('#savePreview').onclick=function(){readId++;preview(box.querySelector('#saveText').value);};
    box.querySelector('#saveText').oninput=function(){readId++;selected=null;box.querySelector('#saveCommit').disabled=true;};
    box.querySelector('#saveCopy').onclick=async function(){var el=box.querySelector('#saveText');if(!el.value){message('先导出存档，文本就会出现在这里。');return;}try{await navigator.clipboard.writeText(el.value);message('已复制，请粘贴到安全位置保存。');}catch(e){el.focus();el.select();message('请长按文本框，选择全选并复制。');}};
    box.querySelector('#saveCommit').onclick=function(){if(!selected)return;var e=selected.file;window.BooboConfirm.ask('用这份存档替换当前进度？导入前进度会留在本机备份中。',function(){queue(e);},'恢复这份存档？');};
    box.querySelector('#saveRestore').onclick=function(){readId++;try{var e=decode(localStorage.getItem(BACKUP));selected=e;box.querySelector('#saveText').value=JSON.stringify(e.file,null,2);box.querySelector('#saveCommit').disabled=false;message(details(e)+'\n这是上一次导入前的本机备份，确认导入即可找回。');}catch(e){message('本机备份无法读取：'+e.message);}};
    document.addEventListener('keydown',function(e){if(box.hidden||document.getElementById('booboConfirm')&&!document.getElementById('booboConfirm').hidden)return;
      if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='Tab'){var els=Array.from(box.querySelectorAll('button:not(:disabled),summary,textarea,[tabindex="0"]')).filter(function(x){return x.getClientRects().length;});var first=els[0],last=els[els.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    },true);
    if(fatal){open();message(notice);box.querySelector('.save-actions').hidden=true;box.querySelector('#saveClose').hidden=true;box.querySelector('#saveCommit').disabled=true;box.querySelector('#saveRestore').disabled=true;}
    else if(notice){window.BooboAPI.say(notice);}
  }
  window.BooboSave={keys:KEYS.slice(),snapshot:snapshot,decode:decode,open:open};
  if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',boot);else setTimeout(boot,0);
})();
