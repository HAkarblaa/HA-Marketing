(function(){'use strict';
const values={p:100,n:320,b:330,r:500,q:900,k:0};
function choose(source,depth=2){
 const game=new Chess(source.fen()),side=game.turn(),end=performance.now()+350;let nodes=0;
 const score=()=>{let s=0;for(const row of game.board())for(const p of row)if(p){const f=p.square.charCodeAt(0)-97,r=Number(p.square[1])-1;const center=7-Math.abs(3.5-f)-Math.abs(3.5-r);s+=(p.color===side?1:-1)*(values[p.type]+(p.type==='n'||p.type==='b'?center*8:0))}return s};
 function search(d,a,b){if(++nodes>5000||performance.now()>end||d===0)return score();if(game.isCheckmate())return game.turn()===side?-100000-d:100000+d;if(game.isDraw())return 0;const max=game.turn()===side;let best=max?-Infinity:Infinity;for(const m of ordered()){game.move(m);let v;try{v=search(d-1,a,b)}finally{game.undo()}best=max?Math.max(best,v):Math.min(best,v);if(max)a=Math.max(a,best);else b=Math.min(b,best);if(b<=a||performance.now()>end)break}return best}
 function ordered(){return game.moves({verbose:true}).sort((a,b)=>(values[b.captured]||0)-(values[a.captured]||0)+(b.promotion?900:0)-(a.promotion?900:0))}
 const moves=ordered();let best=moves[0],bestScore=-Infinity;for(const m of moves){game.move(m);let s;try{s=search(Math.max(0,depth-1),-Infinity,Infinity)}finally{game.undo()}if(s>bestScore){bestScore=s;best=m}if(performance.now()>end)break}return best?{from:best.from,to:best.to,...(best.promotion?{promotion:best.promotion}:{})}:null
}
window.HAChessAI={choose};
})();
