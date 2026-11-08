(function(root){'use strict';const KEY='echoes-rift-manual-v1';
function read(storage){try{let item=JSON.parse(storage.getItem(KEY));if(!item||item.version!==1||typeof item.savedAt!=='string'||!Number.isFinite(Date.parse(item.savedAt))||!root.Rift.validate(item.state))return null;return item;}catch{return null;}}
function write(storage,state,now=new Date()){if(!state?.started||!root.Rift.validate(state))return {ok:false,message:'Begin a valid journey before saving.'};let checkpoint={version:1,savedAt:now.toISOString(),state:JSON.parse(JSON.stringify(state))};try{storage.setItem(KEY,JSON.stringify(checkpoint));return {ok:true,checkpoint,message:'Game saved to this browser. Your manual checkpoint is ready to load.'};}catch{return {ok:false,message:'This browser could not store the save. Export a backup from Pack instead.'};}}
function restore(storage){let item=read(storage);if(!item)return null;return root.Rift.migrate(JSON.parse(JSON.stringify(item.state)));}
root.RiftSaves={KEY,read,write,restore};
})(typeof window!=='undefined'?window:globalThis);
