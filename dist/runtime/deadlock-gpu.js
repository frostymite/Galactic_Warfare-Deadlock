/* Deadlock v12 GPU Runtime — dependency-free WebGL2 cinematic background layer. */
(() => {
  'use strict';
  const THEME = {
    Overview:[0.02,0.16,0.21,0.52], Character:[0.02,0.13,0.18,0.45], Story:[0.03,0.12,0.18,0.58],
    Holonet:[0.02,0.23,0.30,0.68], Combat:[0.34,0.045,0.04,0.76], Dogfight:[0.12,0.04,0.28,0.75],
    Ship:[0.02,0.16,0.20,0.70], Galaxy:[0.05,0.05,0.25,0.78], HQ:[0.03,0.14,0.18,0.66],
    Contracts:[0.20,0.11,0.02,0.56], Targets:[0.24,0.05,0.05,0.62], Bounties:[0.22,0.10,0.02,0.60]
  };
  const VERT = `#version 300 es
  in vec2 a_position; out vec2 v_uv;
  void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
  const FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv; out vec4 outColor;
  uniform vec2 u_resolution; uniform float u_time; uniform vec4 u_theme; uniform float u_impact; uniform float u_motion;
  float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}
  float starLayer(vec2 uv,float scale,float speed){vec2 p=uv*scale;vec2 id=floor(p);vec2 gv=fract(p)-.5;float h=hash21(id);float s=smoothstep(.055,0.,length(gv));s*=step(.965,h);s*=.55+.45*sin(u_time*speed+h*20.);return s;}
  void main(){
    vec2 uv=v_uv; vec2 p=(gl_FragCoord.xy-.5*u_resolution.xy)/max(u_resolution.y,1.);
    float t=u_time*.045;
    float n=noise(p*2.6+vec2(t,-t*.7));
    float n2=noise(p*5.2-vec2(t*.4,t*.8));
    vec3 base=vec3(.003,.009,.014);
    vec3 accent=u_theme.rgb;
    float neb=smoothstep(.15,.95,n*.72+n2*.28);
    base+=accent*neb*u_theme.a*.72;
    base+=accent*.13*exp(-2.6*abs(p.y+.09*sin(p.x*2.2+t)));
    vec2 suv=uv+vec2(u_time*.0008*u_motion,-u_time*.00025*u_motion);
    float stars=starLayer(suv,52.,1.9)+starLayer(suv+.17,87.,2.7)*.7+starLayer(suv+.41,137.,3.5)*.4;
    base+=vec3(.56,.90,1.)*stars*(.35+.5*u_theme.a);
    float horizon=pow(max(0.,1.-length(p*vec2(.65,1.25))),3.);base+=accent*horizon*.12;
    float scan=.018*sin(gl_FragCoord.y*1.7+u_time*2.);base+=scan*accent;
    float vign=smoothstep(1.05,.30,length(p));base*=.42+.58*vign;
    base+=vec3(.72,.16,.08)*u_impact*.14*(1.-length(p)*.35);
    outColor=vec4(base,1.);
  }`;

  class GPURuntime {
    constructor(){this.canvas=null;this.gl=null;this.program=null;this.page='Overview';this.raf=0;this.started=false;this.enabled=true;this.impact=0;this.motion=1;this.last=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}
    init(){
      if(this.started)return;this.started=true;
      const c=document.createElement('canvas');c.id='deadlockGpuStage';c.className='deadlock-gpu-stage';c.setAttribute('aria-hidden','true');
      document.body.prepend(c);this.canvas=c;
      const gl=c.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
      if(!gl){c.classList.add('gpu-fallback');return;}
      this.gl=gl;
      try{this.program=this.makeProgram(VERT,FRAG);}catch(e){console.warn('Deadlock GPU disabled',e);c.classList.add('gpu-fallback');return;}
      const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const loc=gl.getAttribLocation(this.program,'a_position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      this.u={res:gl.getUniformLocation(this.program,'u_resolution'),time:gl.getUniformLocation(this.program,'u_time'),theme:gl.getUniformLocation(this.program,'u_theme'),impact:gl.getUniformLocation(this.program,'u_impact'),motion:gl.getUniformLocation(this.program,'u_motion')};
      addEventListener('resize',()=>this.resize(),{passive:true});this.resize();
      document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.raf);this.raf=0}else if(!this.raf)this.loop(performance.now())});
      this.loop(performance.now());
    }
    makeShader(type,src){const gl=this.gl,s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    makeProgram(v,f){const gl=this.gl,p=gl.createProgram();gl.attachShader(p,this.makeShader(gl.VERTEX_SHADER,v));gl.attachShader(p,this.makeShader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));gl.useProgram(p);return p;}
    resize(){if(!this.gl||!this.canvas)return;const q=document.body?.dataset?.graphics||'high';const cap=q==='performance'?1:q==='balanced'?1.5:2;const dpr=Math.min(devicePixelRatio||1,cap);const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);const rw=Math.round(w*dpr),rh=Math.round(h*dpr);if(this.canvas.width!==rw||this.canvas.height!==rh){this.canvas.width=rw;this.canvas.height=rh;this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';this.gl.viewport(0,0,rw,rh);}}
    setPage(page){this.page=page||'Overview';this.motion=['Combat','Dogfight'].includes(this.page)?2.2:this.page==='Galaxy'?1.35:.8;}
    setEnabled(v){this.enabled=v!==false;if(this.canvas)this.canvas.style.display=this.enabled?'block':'none';}
    pulse(kind='impact'){this.impact=Math.max(this.impact,kind==='critical'?1.8:1);}
    loop(now){if(!this.gl||!this.program||document.hidden)return;this.raf=requestAnimationFrame(t=>this.loop(t));const dt=Math.min(.05,(now-this.last)/1000||.016);this.last=now;this.impact=Math.max(0,this.impact-dt*1.8);if(!this.enabled)return;const gl=this.gl;gl.useProgram(this.program);const th=THEME[this.page]||[.02,.14,.18,.55];gl.uniform2f(this.u.res,this.canvas.width,this.canvas.height);gl.uniform1f(this.u.time,now/1000);gl.uniform4f(this.u.theme,...th);gl.uniform1f(this.u.impact,this.impact);gl.uniform1f(this.u.motion,this.reduced?0.08:this.motion);gl.drawArrays(gl.TRIANGLES,0,3);}
  }
  window.DeadlockGPU=new GPURuntime();
  const boot=()=>window.DeadlockGPU.init();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
