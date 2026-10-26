/* Original, gently looping Web Audio accompaniment. No downloads or autoplay. */
(function(){'use strict';
let context,master,timer=null,wanted=false,next=0,step=0,generation=0;const voices=new Set();
const melody=[76,79,81,79,76,74,72,74,76,79,83,81,79,76,74,72,74,77,81,79,77,74,72,71,72,76,79,76,74,72,71,72];
const chords=[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]];
function voice(note,time,length,volume,type){const osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.value=440*Math.pow(2,(note-69)/12);gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.025);gain.gain.exponentialRampToValueAtTime(.0001,time+length);osc.connect(gain);gain.connect(master);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect()};osc.start(time);osc.stop(time+length+.03);}
function schedule(){if(!wanted||document.hidden||context?.state!=='running')return;const beat=.29;while(next<context.currentTime+.18){const chord=chords[Math.floor(step/8)%4];voice(chord[step%4]+12,next,.6,.10,'sine');if(step%2===0)voice(melody[Math.floor(step/2)%melody.length],next,.48,.055,'triangle');if(step%8===0)voice(chord[0],next,1.7,.09,'sine');step++;next+=beat;}}
function stop(){wanted=false;generation++;clearInterval(timer);timer=null;if(master&&context)master.gain.setValueAtTime(0,context.currentTime);for(const osc of voices){try{osc.stop()}catch(_){}}voices.clear();}
async function play(){if(document.hidden)return;wanted=true;const ticket=++generation;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!context){context=new A();master=context.createGain();master.gain.value=0;master.connect(context.destination)}if(context.state!=='running')await context.resume();if(ticket!==generation||!wanted||document.hidden)return;master.gain.cancelScheduledValues(context.currentTime);master.gain.setValueAtTime(0,context.currentTime);master.gain.linearRampToValueAtTime(.22,context.currentTime+.2);if(!timer){next=context.currentTime+.04;schedule();timer=setInterval(schedule,100)}}catch(_){/* Audio failure must not stop gameplay. */}}
window.HATowerMusic={setPlaying(value){if(value){if(!wanted||!timer)play()}else stop();},stop};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);
})();
