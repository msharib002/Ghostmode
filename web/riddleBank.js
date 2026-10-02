// 976 unique, deterministic logic riddles for rooms 25–1000.
// Each of the 16 families has 61 different inputs. These are generated
// challenges rather than a claim of 976 separately authored word riddles.
const days=['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const digits=n=>String(n).split('').reduce((sum,ch)=>sum+Number(ch),0);
const pair=(q,a,b,c)=>({q,a:String(a),bad:[String(b),String(c)]});
const timeText=n=>`${String(Math.floor(n/60)%12||12).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;

export function generatedRiddle(index){
 if(!Number.isInteger(index)||index<0||index>=976)throw Error('Riddle index out of range');
 const family=index%16,k=Math.floor(index/16);
 switch(family){
  case 0:{const a=9+3*k,d=3+k%8;return pair(`A number trail reads ${a}, ${a+d}, ${a+2*d}, ${a+3*d}. What number opens it next?`,a+4*d,a+5*d,a+4*d+1);}
  case 1:{const n=4+k;return pair(`Four square stones glow ${n*n}, ${(n+1)**2}, ${(n+2)**2}. Which stone comes next?`,(n+3)**2,(n+2)**2+2,(n+4)**2);}
  case 2:{const n=2+k;return pair(`The machine doubles and adds one: ${n}, ${2*n+1}, ${4*n+3}, ${8*n+7}. What comes next?`,16*n+15,16*n+14,8*n+15);}
  case 3:{const a=2+k%17,b=5+k;return pair(`Each lamp is the sum of two before it: ${a}, ${b}, ${a+b}, ${a+2*b}, ${2*a+3*b}. Next lamp?`,3*a+5*b,3*a+4*b,2*a+5*b);}
  case 4:{const a=15+3*k,up=6+k%9,down=2+k%5;return pair(`The dial goes up ${up}, down ${down}, then repeats: ${a}, ${a+up}, ${a+up-down}, ${a+2*up-down}. Next?`,a+2*up-2*down,a+3*up-down,a+up-2*down);}
  case 5:{const n=123+13*k,s=digits(n);return pair(`A three-digit vault shows ${n}. Add its digits to find the key. What is the key?`,s,s+1,s+3);}
  case 6:{const n=231+11*k,reverse=Number(String(n).split('').reverse().join(''));return pair(`The mirror reverses every digit of ${n}. What number appears?`,reverse,reverse+1,reverse+10);}
  case 7:{const code=alphabet[k%26]+alphabet[(k*7+4)%26]+alphabet[(k*11+9)%26],step=1+k%5;const shifted=[...code].map(c=>alphabet[(alphabet.indexOf(c)+step)%26]).join('');return pair(`The cipher moves every letter ${step} places forward. What does ${code} become?`,shifted,code,[...code].map(c=>alphabet[(alphabet.indexOf(c)+step+1)%26]).join(''));}
  case 8:{const a=alphabet[k%26],b=alphabet[(k*5+3)%26],c=alphabet[(k*9+11+Math.floor(k/26))%26],sum=alphabet.indexOf(a)+alphabet.indexOf(b)+alphabet.indexOf(c)+3;return pair(`A=1 through Z=26. Add the values of ${a}, ${b} and ${c}. Which total opens the door?`,sum,sum+1,sum+3);}
  case 9:{const hour=1+k%12,minute=(k*7+Math.floor(k/60))%60,advance=25+5*(k%12),start=hour*60+minute;return pair(`The clock reads ${timeText(start)}. Move ahead ${advance} minutes. What does it show?`,timeText(start+advance),timeText(start+advance+5),timeText(start+advance-5));}
  case 10:{const start=k%7,advance=k+8,answer=days[(start+advance)%7];return pair(`It is ${days[start]}. The gate opens ${advance} days later. Which day is it?`,answer,days[(start+advance+1)%7],days[(start+advance+2)%7]);}
  case 11:{const n=12+k,total=2*n+1;return pair(`Two consecutive numbers add up to ${total}. What is the larger number?`,n+1,n,n+2);}
  case 12:{const divisor=3+k%9,start=20+k*5,answer=Math.floor(start/divisor+1)*divisor;return pair(`Find the smallest number greater than ${start} that is divisible by ${divisor}.`,answer,answer+1,answer+divisor);}
  case 13:{const n=12+k,binary=n.toString(2);return pair(`The monitor blinks ${binary} in binary. What is its decimal value?`,n,n+1,n+2);}
  case 14:{const half=8+k,extra=3+k%11;return pair(`A lantern holds ${2*half} sparks. Half remain, then ${extra} arrive. How many sparks now?`,half+extra,half+extra+1,2*half+extra);}
  case 15:{const divisor=4+k%7,remainder=1+k%(divisor-1),floor=30+k*4,answer=floor+((remainder-floor%divisor+divisor)%divisor||divisor);return pair(`I am the smallest number above ${floor} that leaves ${remainder} when divided by ${divisor}. Who am I?`,answer,answer+1,answer+divisor);}
 }
}
