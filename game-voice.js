// HA Marketing - Online Game Voice Room (WebRTC + Firebase RTDB)
// مايك مباشر بين لاعبين داخل غرفة لعبة.
// مثال:
// HA_GameVoice.join('penalties_room_123', 'playerA');
// HA_GameVoice.leave();

(function(){
  const ICE={iceServers:[
    {urls:'stun:stun.l.google.com:19302'},
    {urls:'stun:stun1.l.google.com:19302'}
  ]};

  let roomId=null, userId=null, pc=null, localStream=null, remoteAudio=null;
  let roomRef=null, role=null, listeners=[];

  function id(){
    return 'u_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  }

  async function getMic(){
    if(localStream)return localStream;
    localStream=await navigator.mediaDevices.getUserMedia({
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},
      video:false
    });
    return localStream;
  }

  function ensureAudio(){
    if(remoteAudio)return;
    remoteAudio=document.createElement('audio');
    remoteAudio.autoplay=true;
    remoteAudio.playsInline=true;
    remoteAudio.style.display='none';
    document.body.appendChild(remoteAudio);
  }

  function on(ref,event,cb){
    ref.on(event,cb); listeners.push({ref,event,cb});
  }

  function clearListeners(){
    listeners.forEach(x=>{try{x.ref.off(x.event,x.cb)}catch(e){}});
    listeners=[];
  }

  function makePC(){
    pc=new RTCPeerConnection(ICE);
    localStream.getTracks().forEach(t=>pc.addTrack(t,localStream));
    pc.ontrack=e=>{ensureAudio();remoteAudio.srcObject=e.streams[0];};
    pc.onconnectionstatechange=()=>{
      window.dispatchEvent(new CustomEvent('ha-game-voice-state',{detail:{state:pc.connectionState}}));
    };
    return pc;
  }

  async function join(rid, uid){
    if(!window.firebase?.database) throw new Error('Firebase غير محمل.');
    if(!navigator.mediaDevices?.getUserMedia) throw new Error('المايك غير مدعوم.');

    await leave();
    roomId=rid;
    userId=uid||id();
    roomRef=firebase.database().ref('gameVoiceRooms/'+roomId);
    await getMic();

    const membersSnap=await roomRef.child('members').once('value');
    const members=membersSnap.val()||{};
    const memberIds=Object.keys(members);

    role=memberIds.length===0?'caller':'answerer';
    await roomRef.child('members/'+userId).set({
      joinedAt:firebase.database.ServerValue.TIMESTAMP
    });

    const p=makePC();

    if(role==='caller'){
      p.onicecandidate=e=>{
        if(e.candidate)roomRef.child('callerCandidates').push(e.candidate.toJSON());
      };

      const offer=await p.createOffer();
      await p.setLocalDescription(offer);
      await roomRef.child('offer').set({type:offer.type,sdp:offer.sdp});

      on(roomRef.child('answer'),'value',async snap=>{
        const a=snap.val();
        if(a && !pc.currentRemoteDescription){
          await pc.setRemoteDescription(new RTCSessionDescription(a));
        }
      });

      on(roomRef.child('answererCandidates'),'child_added',snap=>{
        const c=snap.val();
        if(c)pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
      });
    }else{
      p.onicecandidate=e=>{
        if(e.candidate)roomRef.child('answererCandidates').push(e.candidate.toJSON());
      };

      const offerSnap=await roomRef.child('offer').once('value');
      const offer=offerSnap.val();
      if(!offer) throw new Error('الغرفة بعد ما جاهزة.');

      await p.setRemoteDescription(new RTCSessionDescription(offer));
      const answer=await p.createAnswer();
      await p.setLocalDescription(answer);
      await roomRef.child('answer').set({type:answer.type,sdp:answer.sdp});

      on(roomRef.child('callerCandidates'),'child_added',snap=>{
        const c=snap.val();
        if(c)pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
      });
    }

    window.dispatchEvent(new CustomEvent('ha-game-voice-joined',{detail:{roomId,userId,role}}));
    return {roomId,userId,role};
  }

  function mute(value){
    if(!localStream)return;
    localStream.getAudioTracks().forEach(t=>t.enabled=!value);
  }

  async function leave(){
    clearListeners();
    try{if(roomRef && userId)await roomRef.child('members/'+userId).remove()}catch(e){}
    try{if(pc)pc.close()}catch(e){}
    pc=null;
    if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null}
    if(remoteAudio)remoteAudio.srcObject=null;
    roomId=null;userId=null;roomRef=null;role=null;
  }

  window.HA_GameVoice={join,leave,mute};
})();
