// HA Marketing - Online Game Voice Room (WebRTC + Firebase RTDB)
// يدعم حتى 4 لاعبين بصوت جماعي داخل نفس الغرفة.
(function(){
  const ICE={iceServers:[
    {urls:'stun:stun.l.google.com:19302'},
    {urls:'stun:stun1.l.google.com:19302'}
  ]};

  let roomId=null,userId=null,localStream=null,roomRef=null;
  let peers={},listeners=[],remoteAudios={};

  function makeId(){return 'u_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
  function on(ref,event,cb){ref.on(event,cb);listeners.push({ref,event,cb})}
  function clearListeners(){listeners.forEach(x=>{try{x.ref.off(x.event,x.cb)}catch(e){}});listeners=[]}

  async function getMic(){
    if(localStream)return localStream;
    localStream=await navigator.mediaDevices.getUserMedia({
      audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false
    });
    return localStream;
  }

  function audioFor(peerId){
    if(remoteAudios[peerId])return remoteAudios[peerId];
    const a=document.createElement('audio');
    a.autoplay=true;a.playsInline=true;a.style.display='none';
    document.body.appendChild(a);remoteAudios[peerId]=a;return a;
  }

  function pairKey(a,b){return [a,b].sort().join('__')}
  function isCaller(peerId){return userId.localeCompare(peerId)<0}

  function makePeer(peerId){
    if(peers[peerId])return peers[peerId];
    const pc=new RTCPeerConnection(ICE);
    peers[peerId]=pc;
    localStream.getTracks().forEach(t=>pc.addTrack(t,localStream));
    pc.ontrack=e=>{audioFor(peerId).srcObject=e.streams[0]};
    pc.onconnectionstatechange=()=>{
      window.dispatchEvent(new CustomEvent('ha-game-voice-peer-state',{
        detail:{peerId,state:pc.connectionState}
      }));
    };
    return pc;
  }

  async function connectPeer(peerId){
    if(!peerId||peerId===userId)return;
    const pc=makePeer(peerId);
    const key=pairKey(userId,peerId);
    const sig=roomRef.child('signals/'+key);
    const mine=isCaller(peerId);

    pc.onicecandidate=e=>{
      if(e.candidate)sig.child(mine?'aCandidates':'bCandidates').push(e.candidate.toJSON());
    };

    if(mine){
      on(sig.child('answer'),'value',async snap=>{
        const a=snap.val();
        if(a && !pc.currentRemoteDescription){
          try{await pc.setRemoteDescription(new RTCSessionDescription(a))}catch(e){console.warn(e)}
        }
      });
      on(sig.child('bCandidates'),'child_added',snap=>{
        const c=snap.val();if(c)pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{});
      });

      if(!pc.localDescription){
        const offer=await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sig.child('offer').set({type:offer.type,sdp:offer.sdp});
      }
    }else{
      on(sig.child('aCandidates'),'child_added',snap=>{
        const c=snap.val();if(c)pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{});
      });
      on(sig.child('offer'),'value',async snap=>{
        const offer=snap.val();
        if(!offer||pc.currentRemoteDescription)return;
        try{
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer=await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sig.child('answer').set({type:answer.type,sdp:answer.sdp});
        }catch(e){console.warn(e)}
      });
    }
  }

  async function join(rid,uid){
    await leave();
    if(!window.firebase?.database)throw new Error('Firebase غير محمل.');
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('المايك غير مدعوم.');
    roomId=rid;userId=uid||makeId();roomRef=firebase.database().ref('gameVoiceRooms/'+roomId);
    await getMic();

    const snap=await roomRef.child('members').once('value');
    const members=snap.val()||{};
    const ids=Object.keys(members).filter(x=>x!==userId);
    if(ids.length>=4)throw new Error('غرفة الصوت ممتلئة.');

    await roomRef.child('members/'+userId).set({joinedAt:firebase.database.ServerValue.TIMESTAMP});
    try{roomRef.child('members/'+userId).onDisconnect().remove()}catch(e){}

    ids.forEach(connectPeer);
    on(roomRef.child('members'),'child_added',snap=>{
      const peerId=snap.key;if(peerId!==userId)connectPeer(peerId);
    });
    on(roomRef.child('members'),'child_removed',snap=>{
      const peerId=snap.key;
      if(peers[peerId]){try{peers[peerId].close()}catch(e){};delete peers[peerId]}
      if(remoteAudios[peerId]){remoteAudios[peerId].remove();delete remoteAudios[peerId]}
    });

    window.dispatchEvent(new CustomEvent('ha-game-voice-joined',{
      detail:{roomId,userId,maxPlayers:4}
    }));
    return {roomId,userId,maxPlayers:4};
  }

  function mute(value){
    if(localStream)localStream.getAudioTracks().forEach(t=>t.enabled=!value);
  }

  async function leave(){
    clearListeners();
    try{if(roomRef&&userId)await roomRef.child('members/'+userId).remove()}catch(e){}
    Object.values(peers).forEach(pc=>{try{pc.close()}catch(e){}});
    peers={};
    Object.values(remoteAudios).forEach(a=>{try{a.remove()}catch(e){}});
    remoteAudios={};
    if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null}
    roomId=null;userId=null;roomRef=null;
  }

  window.HA_GameVoice={join,leave,mute};
})();
