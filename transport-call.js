
// HA Marketing - اتصال صوتي حقيقي بين الزبون والسائق عبر WebRTC + Firebase Realtime Database
(function(){
  const ICE = {
    iceServers: [
      {urls:'stun:stun.l.google.com:19302'},
      {urls:'stun:stun1.l.google.com:19302'}
    ]
  };

  let pc=null, localStream=null, remoteAudio=null, callRef=null, candidateRefs=[];
  let currentRideId=null, currentRole=null, activeCallId=null, incomingListener=null;

  function ensureUI(){
    if(document.getElementById('haTransportCallOverlay')) return;

    const style=document.createElement('style');
    style.textContent=`
      #haTransportCallOverlay{position:fixed;inset:0;background:#000b;z-index:12000;display:none;align-items:center;justify-content:center;padding:16px}
      #haTransportCallOverlay.show{display:flex}
      .ha-call-card{width:min(390px,94vw);background:#fff;border-radius:22px;padding:20px;text-align:center;box-shadow:0 25px 80px #0008}
      .ha-call-icon{width:86px;height:86px;border-radius:50%;margin:0 auto 12px;background:#e8f0ff;display:flex;align-items:center;justify-content:center;font-size:38px}
      .ha-call-title{font-size:20px;font-weight:900;color:#111;margin-bottom:5px}
      .ha-call-sub{font-size:13px;color:#666;min-height:20px}
      .ha-call-actions{display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap}
      .ha-call-actions button{border:0;border-radius:999px;padding:12px 18px;font-weight:900;cursor:pointer}
      .ha-call-accept{background:#16a34a;color:#fff}
      .ha-call-reject,.ha-call-end{background:#dc2626;color:#fff}
      .ha-call-mute{background:#111827;color:#fff}
      .ha-call-hidden{display:none!important}
    `;
    document.head.appendChild(style);

    const overlay=document.createElement('div');
    overlay.id='haTransportCallOverlay';
    overlay.innerHTML=`
      <div class="ha-call-card">
        <div class="ha-call-icon">📞</div>
        <div class="ha-call-title" id="haCallTitle">اتصال داخل التطبيق</div>
        <div class="ha-call-sub" id="haCallSub">جاري التحضير...</div>
        <div class="ha-call-actions">
          <button id="haCallAccept" class="ha-call-accept ha-call-hidden">قبول</button>
          <button id="haCallReject" class="ha-call-reject ha-call-hidden">رفض</button>
          <button id="haCallMute" class="ha-call-mute ha-call-hidden">كتم</button>
          <button id="haCallEnd" class="ha-call-end ha-call-hidden">إنهاء</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    remoteAudio=document.createElement('audio');
    remoteAudio.autoplay=true;
    remoteAudio.playsInline=true;
    remoteAudio.style.display='none';
    document.body.appendChild(remoteAudio);

    document.getElementById('haCallEnd').onclick=endCall;
    document.getElementById('haCallReject').onclick=rejectIncoming;
    document.getElementById('haCallAccept').onclick=acceptIncoming;
    document.getElementById('haCallMute').onclick=toggleMute;
  }

  function setUI(mode, title, sub){
    ensureUI();
    const o=document.getElementById('haTransportCallOverlay');
    o.classList.add('show');
    document.getElementById('haCallTitle').textContent=title||'اتصال داخل التطبيق';
    document.getElementById('haCallSub').textContent=sub||'';
    ['haCallAccept','haCallReject','haCallMute','haCallEnd'].forEach(id=>document.getElementById(id).classList.add('ha-call-hidden'));

    if(mode==='incoming'){
      document.getElementById('haCallAccept').classList.remove('ha-call-hidden');
      document.getElementById('haCallReject').classList.remove('ha-call-hidden');
    }else if(mode==='active'){
      document.getElementById('haCallMute').classList.remove('ha-call-hidden');
      document.getElementById('haCallEnd').classList.remove('ha-call-hidden');
    }else{
      document.getElementById('haCallEnd').classList.remove('ha-call-hidden');
    }
  }

  function hideUI(){
    const o=document.getElementById('haTransportCallOverlay');
    if(o)o.classList.remove('show');
  }

  async function getMic(){
    if(localStream) return localStream;
    localStream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    return localStream;
  }

  function makePC(role, callId){
    if(pc) try{pc.close()}catch(e){}
    pc=new RTCPeerConnection(ICE);

    pc.ontrack=e=>{
      if(remoteAudio) remoteAudio.srcObject=e.streams[0];
    };

    pc.onconnectionstatechange=()=>{
      if(!pc)return;
      const st=pc.connectionState;
      if(st==='connected'){
        setUI('active','المكالمة متصلة','يمكنك التحدث الآن');
      }else if(st==='failed'||st==='disconnected'){
        document.getElementById('haCallSub').textContent='انقطع الاتصال';
      }
    };

    pc.onicecandidate=e=>{
      if(!e.candidate || !callRef)return;
      const side=role==='customer'?'customerCandidates':'driverCandidates';
      callRef.child(side).push(e.candidate.toJSON());
    };

    const remoteSide=role==='customer'?'driverCandidates':'customerCandidates';
    const ref=callRef.child(remoteSide);
    const cb=snap=>{
      const c=snap.val();
      if(c)pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error);
    };
    ref.on('child_added',cb);
    candidateRefs.push({ref,cb});
    return pc;
  }

  async function start(rideId, role, label){
    ensureUI();
    try{if(window.HA_FirebaseAuth)await HA_FirebaseAuth.ready();}catch(e){alert('تعذر التحقق الآمن من Firebase.');return;}
    if(!window.firebase || !firebase.database){
      alert('Firebase غير محمل في هذه الصفحة.');
      return;
    }
    if(!navigator.mediaDevices?.getUserMedia){
      alert('المتصفح لا يدعم الاتصال الصوتي.');
      return;
    }
    if(!rideId){
      alert('لا توجد رحلة فعالة للاتصال.');
      return;
    }

    currentRideId=rideId;
    currentRole=role;
    activeCallId='call_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    callRef=firebase.database().ref('rideCalls/'+rideId+'/'+activeCallId);

    try{
      setUI('calling','جاري الاتصال',label||'انتظار رد الطرف الآخر...');
      const stream=await getMic();
      const p=makePC(role,activeCallId);
      stream.getTracks().forEach(t=>p.addTrack(t,stream));

      const offer=await p.createOffer();
      await p.setLocalDescription(offer);

      await callRef.set({
        status:'ringing',
        callerRole:role,
        createdAt:firebase.database.ServerValue.TIMESTAMP,
        offer:{type:offer.type,sdp:offer.sdp}
      });

      callRef.on('value',async snap=>{
        const d=snap.val();
        if(!d)return;
        if(d.status==='accepted' && d.answer && !pc.currentRemoteDescription){
          await pc.setRemoteDescription(new RTCSessionDescription(d.answer));
          setUI('active','المكالمة متصلة','يمكنك التحدث الآن');
        }
        if(d.status==='rejected'){
          document.getElementById('haCallSub').textContent='تم رفض المكالمة';
          setTimeout(cleanup,900);
        }
        if(d.status==='ended'){
          document.getElementById('haCallSub').textContent='انتهت المكالمة';
          setTimeout(cleanup,700);
        }
      });
    }catch(err){
      console.error(err);
      alert('تعذر بدء الاتصال. تأكد من السماح للمايك والإنترنت.');
      cleanup();
    }
  }

  async function listenForIncoming(rideId, role){
    ensureUI();
    try{if(window.HA_FirebaseAuth)await HA_FirebaseAuth.ready();}catch(e){console.error(e);return;}
    if(!window.firebase || !firebase.database || !rideId)return;

    currentRideId=rideId;
    currentRole=role;

    if(incomingListener){
      incomingListener.ref.off('child_added',incomingListener.cb);
      incomingListener=null;
    }

    const ref=firebase.database().ref('rideCalls/'+rideId);
    const cb=snap=>{
      const d=snap.val();
      if(!d || d.status!=='ringing' || d.callerRole===role)return;
      activeCallId=snap.key;
      callRef=snap.ref;
      setUI('incoming','مكالمة واردة', role==='driver'?'اتصال من الزبون':'اتصال من السائق');
    };
    ref.limitToLast(10).on('child_added',cb);
    incomingListener={ref,cb};
  }

  async function acceptIncoming(){
    try{
      const snap=await callRef.once('value');
      const d=snap.val();
      if(!d?.offer)return;

      setUI('calling','جاري ربط المكالمة','لحظة واحدة...');
      const stream=await getMic();
      const p=makePC(currentRole,activeCallId);
      stream.getTracks().forEach(t=>p.addTrack(t,stream));

      await p.setRemoteDescription(new RTCSessionDescription(d.offer));
      const answer=await p.createAnswer();
      await p.setLocalDescription(answer);

      await callRef.update({
        status:'accepted',
        answer:{type:answer.type,sdp:answer.sdp},
        acceptedAt:firebase.database.ServerValue.TIMESTAMP
      });
      setUI('active','المكالمة متصلة','يمكنك التحدث الآن');
    }catch(err){
      console.error(err);
      alert('تعذر قبول المكالمة.');
      cleanup();
    }
  }

  async function rejectIncoming(){
    try{if(callRef)await callRef.update({status:'rejected'});}catch(e){}
    cleanup();
  }

  async function endCall(){
    try{if(callRef)await callRef.update({status:'ended',endedAt:firebase.database.ServerValue.TIMESTAMP});}catch(e){}
    cleanup();
  }

  function toggleMute(){
    if(!localStream)return;
    const track=localStream.getAudioTracks()[0];
    if(!track)return;
    track.enabled=!track.enabled;
    document.getElementById('haCallMute').textContent=track.enabled?'كتم':'تشغيل المايك';
  }

  function cleanup(){
    candidateRefs.forEach(x=>x.ref.off('child_added',x.cb));
    candidateRefs=[];
    if(pc){try{pc.close()}catch(e){} pc=null}
    if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null}
    if(remoteAudio)remoteAudio.srcObject=null;
    if(callRef)callRef.off();
    callRef=null;
    activeCallId=null;
    hideUI();
  }

  window.addEventListener('beforeunload',()=>{try{if(callRef)callRef.update({status:'ended'});}catch(e){}});

  window.HATransportCall={start,listenForIncoming,end:endCall};
})();
