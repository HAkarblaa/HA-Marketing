// HA Marketing - Voice Messages (Firebase Realtime Database, free-friendly)
// يسجل رسالة صوتية قصيرة ويرسلها أونلاين داخل مسار محادثة.
// الاستخدام:
// const vm = await HA_VoiceMessage.start();
// await HA_VoiceMessage.stopAndSend('rideChats/ROOM_ID/messages', {senderRole:'customer'});
// الاستماع:
// HA_VoiceMessage.listen('rideChats/ROOM_ID/messages', (msg)=>{ ... });

(function(){
  let recorder=null;
  let stream=null;
  let chunks=[];
  let startedAt=0;
  const MAX_MS=30000; // 30 ثانية حتى تبقى الرسائل صغيرة ومناسبة لـ Realtime Database
  let autoStopTimer=null;

  function supported(){
    return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && window.firebase?.database);
  }

  async function start(){
    if(!supported()) throw new Error('التسجيل الصوتي غير مدعوم أو Firebase غير محمل.');

    cancel();
    stream=await navigator.mediaDevices.getUserMedia({
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},
      video:false
    });

    let mime='audio/webm;codecs=opus';
    if(!MediaRecorder.isTypeSupported(mime)) mime='audio/webm';

    recorder=new MediaRecorder(stream,{mimeType:mime});
    chunks=[];
    startedAt=Date.now();

    recorder.ondataavailable=e=>{
      if(e.data && e.data.size) chunks.push(e.data);
    };

    recorder.start(250);

    autoStopTimer=setTimeout(()=>{
      if(recorder && recorder.state==='recording') recorder.stop();
    },MAX_MS);

    window.dispatchEvent(new CustomEvent('ha-voice-recording-started'));
    return true;
  }

  function blobToDataURL(blob){
    return new Promise((resolve,reject)=>{
      const r=new FileReader();
      r.onload=()=>resolve(r.result);
      r.onerror=reject;
      r.readAsDataURL(blob);
    });
  }

  async function stopAndSend(path, meta={}){
    if(!recorder || recorder.state!=='recording') throw new Error('ماكو تسجيل شغال حالياً.');
    if(!path) throw new Error('مسار المحادثة مطلوب.');

    const stopped=new Promise(resolve=>{
      recorder.onstop=resolve;
    });
    recorder.stop();
    clearTimeout(autoStopTimer);
    await stopped;

    const duration=Math.max(1,Math.round((Date.now()-startedAt)/1000));
    const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});
    stopTracks();

    // حماية من الرسائل الكبيرة جداً
    if(blob.size > 700*1024){
      throw new Error('التسجيل كبير. حاول برسالة أقصر.');
    }

    const dataUrl=await blobToDataURL(blob);
    const payload={
      type:'voice',
      audioData:dataUrl,
      duration,
      mime:blob.type,
      createdAt:firebase.database.ServerValue.TIMESTAMP,
      ...meta
    };

    const ref=await firebase.database().ref(path).push(payload);
    window.dispatchEvent(new CustomEvent('ha-voice-message-sent',{detail:{key:ref.key,payload}}));
    return ref.key;
  }

  function cancel(){
    clearTimeout(autoStopTimer);
    try{
      if(recorder && recorder.state!=='inactive') recorder.stop();
    }catch(e){}
    stopTracks();
    recorder=null;
    chunks=[];
    startedAt=0;
    window.dispatchEvent(new CustomEvent('ha-voice-recording-cancelled'));
  }

  function stopTracks(){
    if(stream){
      stream.getTracks().forEach(t=>{try{t.stop()}catch(e){}});
      stream=null;
    }
  }

  function isRecording(){
    return !!(recorder && recorder.state==='recording');
  }

  function listen(path, callback){
    if(!window.firebase?.database) throw new Error('Firebase غير محمل.');
    const ref=firebase.database().ref(path);
    const handler=snap=>{
      const msg=snap.val();
      if(msg?.type==='voice') callback({...msg,key:snap.key});
    };
    ref.limitToLast(100).on('child_added',handler);
    return ()=>ref.off('child_added',handler);
  }

  function makePlayer(msg){
    const wrap=document.createElement('div');
    wrap.className='ha-voice-player';
    wrap.innerHTML=`
      <button type="button" class="ha-voice-play">▶️</button>
      <span class="ha-voice-time">${msg.duration||0} ث</span>
      <audio preload="metadata"></audio>
    `;
    const audio=wrap.querySelector('audio');
    const btn=wrap.querySelector('.ha-voice-play');
    audio.src=msg.audioData||'';
    btn.onclick=()=>{
      if(audio.paused){audio.play();btn.textContent='⏸️';}
      else{audio.pause();btn.textContent='▶️';}
    };
    audio.onended=()=>btn.textContent='▶️';
    return wrap;
  }

  window.HA_VoiceMessage={
    supported,start,stopAndSend,cancel,isRecording,listen,makePlayer,MAX_MS
  };
})();
