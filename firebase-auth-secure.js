(function(){
  let readyPromise=null;
  async function ready(){
    if(!window.firebase || !firebase.auth) throw new Error('Firebase Auth غير محمل');
    if(readyPromise) return readyPromise;
    readyPromise=(async()=>{
      try{ await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL); }catch(e){ console.warn(e); }
      if(firebase.auth().currentUser) return firebase.auth().currentUser;
      return await new Promise((resolve,reject)=>{
        let settled=false;
        const off=firebase.auth().onAuthStateChanged(async user=>{
          if(user && !settled){ settled=true; try{off();}catch(e){} resolve(user); return; }
          if(!user && !settled){
            try{
              const cred=await firebase.auth().signInAnonymously();
              if(!settled){ settled=true; try{off();}catch(e){} resolve(cred.user); }
            }catch(err){
              if(!settled){ settled=true; try{off();}catch(e){} reject(err); }
            }
          }
        },err=>{ if(!settled){settled=true;reject(err);} });
      });
    })();
    try{return await readyPromise;}catch(e){readyPromise=null;throw e;}
  }
  window.HA_FirebaseAuth={ready,uid:()=>firebase.auth().currentUser?.uid||null};
})();
