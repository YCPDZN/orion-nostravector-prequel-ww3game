/* ORION ENGINE — tiny dependency-free WebGL2 renderer for "Orion: The Third World War"
   GPU skinning, PBR-ish shading, normal maps, triplanar world materials, PCF shadows,
   HDR bloom, ACES tonemapping, procedural sky, particles. */
(function () {
'use strict';
const OE = window.OE = {};

/* ---------------- math ---------------- */
const M4 = OE.M4 = {
  create() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  identity(m) { m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  mul(o, a, b) {
    const a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7],a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
    for (let i = 0; i < 4; i++) {
      const b0=b[i*4],b1=b[i*4+1],b2=b[i*4+2],b3=b[i*4+3];
      o[i*4]=b0*a00+b1*a10+b2*a20+b3*a30; o[i*4+1]=b0*a01+b1*a11+b2*a21+b3*a31;
      o[i*4+2]=b0*a02+b1*a12+b2*a22+b3*a32; o[i*4+3]=b0*a03+b1*a13+b2*a23+b3*a33;
    }
    return o;
  },
  perspective(o, fovy, asp, n, f) {
    const t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f); o.fill(0);
    o[0] = t / asp; o[5] = t; o[10] = (f + n) * nf; o[11] = -1; o[14] = 2 * f * n * nf; return o;
  },
  ortho(o, l, r, b, t, n, f) {
    const lr = 1 / (l - r), bt = 1 / (b - t), nf = 1 / (n - f); o.fill(0);
    o[0] = -2 * lr; o[5] = -2 * bt; o[10] = 2 * nf; o[12] = (l + r) * lr; o[13] = (t + b) * bt; o[14] = (f + n) * nf; o[15] = 1; return o;
  },
  lookAt(o, e, c, up) {
    let zx=e[0]-c[0], zy=e[1]-c[1], zz=e[2]-c[2]; let l=Math.hypot(zx,zy,zz)||1; zx/=l; zy/=l; zz/=l;
    let xx=up[1]*zz-up[2]*zy, xy=up[2]*zx-up[0]*zz, xz=up[0]*zy-up[1]*zx; l=Math.hypot(xx,xy,xz)||1; xx/=l; xy/=l; xz/=l;
    const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
    o[0]=xx;o[1]=yx;o[2]=zx;o[3]=0;o[4]=xy;o[5]=yy;o[6]=zy;o[7]=0;o[8]=xz;o[9]=yz;o[10]=zz;o[11]=0;
    o[12]=-(xx*e[0]+xy*e[1]+xz*e[2]);o[13]=-(yx*e[0]+yy*e[1]+yz*e[2]);o[14]=-(zx*e[0]+zy*e[1]+zz*e[2]);o[15]=1; return o;
  },
  invert(o, a) {
    const a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7],a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
    const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,
      b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
    let d=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06; if(!d) return null; d=1/d;
    o[0]=(a11*b11-a12*b10+a13*b09)*d;o[1]=(a02*b10-a01*b11-a03*b09)*d;o[2]=(a31*b05-a32*b04+a33*b03)*d;o[3]=(a22*b04-a21*b05-a23*b03)*d;
    o[4]=(a12*b08-a10*b11-a13*b07)*d;o[5]=(a00*b11-a02*b08+a03*b07)*d;o[6]=(a32*b02-a30*b05-a33*b01)*d;o[7]=(a20*b05-a22*b02+a23*b01)*d;
    o[8]=(a10*b10-a11*b08+a13*b06)*d;o[9]=(a01*b08-a00*b10-a03*b06)*d;o[10]=(a30*b04-a31*b02+a33*b00)*d;o[11]=(a21*b02-a20*b04-a23*b00)*d;
    o[12]=(a11*b07-a10*b09-a12*b06)*d;o[13]=(a00*b09-a01*b07+a02*b06)*d;o[14]=(a31*b01-a30*b03-a32*b00)*d;o[15]=(a20*b03-a21*b01+a22*b00)*d; return o;
  },
  fromRTS(o, q, t, s) {
    const x=q[0],y=q[1],z=q[2],w=q[3],x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;
    const sx=s?s[0]:1, sy=s?s[1]:1, sz=s?s[2]:1;
    o[0]=(1-(yy+zz))*sx;o[1]=(xy+wz)*sx;o[2]=(xz-wy)*sx;o[3]=0;o[4]=(xy-wz)*sy;o[5]=(1-(xx+zz))*sy;o[6]=(yz+wx)*sy;o[7]=0;
    o[8]=(xz+wy)*sz;o[9]=(yz-wx)*sz;o[10]=(1-(xx+yy))*sz;o[11]=0;o[12]=t[0];o[13]=t[1];o[14]=t[2];o[15]=1; return o;
  },
  point(o, m, p) { const x=p[0],y=p[1],z=p[2]; o[0]=m[0]*x+m[4]*y+m[8]*z+m[12]; o[1]=m[1]*x+m[5]*y+m[9]*z+m[13]; o[2]=m[2]*x+m[6]*y+m[10]*z+m[14]; return o; },
  dir(o, m, p) { const x=p[0],y=p[1],z=p[2]; o[0]=m[0]*x+m[4]*y+m[8]*z; o[1]=m[1]*x+m[5]*y+m[9]*z; o[2]=m[2]*x+m[6]*y+m[10]*z; return o; },
};
const Q = OE.Q = {
  create() { return new Float32Array([0, 0, 0, 1]); },
  euler(o, x, y, z) { // degrees, q = qY*qX*qZ (matches rig authoring)
    const cx=Math.cos(x*Math.PI/360), sx=Math.sin(x*Math.PI/360), cy=Math.cos(y*Math.PI/360), sy=Math.sin(y*Math.PI/360), cz=Math.cos(z*Math.PI/360), sz=Math.sin(z*Math.PI/360);
    // qy*qx
    const ax=cy*sx, ay=sy*cx, az=-sy*sx, aw=cy*cx;
    o[0]=aw*0+ax*cz+ay*sz-az*0; o[0]=ax*cz+ay*sz; o[1]=ay*cz-ax*sz; o[2]=aw*sz+az*cz; o[3]=aw*cz-az*sz; return o;
  },
  yaw(o, a) { o[0]=0; o[1]=Math.sin(a/2); o[2]=0; o[3]=Math.cos(a/2); return o; },
  axis(o, ax, a) { const s=Math.sin(a/2); o[0]=ax[0]*s; o[1]=ax[1]*s; o[2]=ax[2]*s; o[3]=Math.cos(a/2); return o; },
  mul(o, a, b) {
    const ax=a[0],ay=a[1],az=a[2],aw=a[3],bx=b[0],by=b[1],bz=b[2],bw=b[3];
    o[0]=aw*bx+ax*bw+ay*bz-az*by; o[1]=aw*by-ax*bz+ay*bw+az*bx; o[2]=aw*bz+ax*by-ay*bx+az*bw; o[3]=aw*bw-ax*bx-ay*by-az*bz; return o;
  },
  slerp(o, a, b, t) {
    let bx=b[0],by=b[1],bz=b[2],bw=b[3]; let c=a[0]*bx+a[1]*by+a[2]*bz+a[3]*bw;
    if (c < 0) { c=-c; bx=-bx; by=-by; bz=-bz; bw=-bw; }
    let s0=1-t, s1=t;
    if (c < 0.9995) { const om=Math.acos(c), so=Math.sin(om); s0=Math.sin((1-t)*om)/so; s1=Math.sin(t*om)/so; }
    o[0]=s0*a[0]+s1*bx; o[1]=s0*a[1]+s1*by; o[2]=s0*a[2]+s1*bz; o[3]=s0*a[3]+s1*bw;
    const l=Math.hypot(o[0],o[1],o[2],o[3])||1; o[0]/=l;o[1]/=l;o[2]/=l;o[3]/=l; return o;
  },
};
OE.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
OE.lerp = (a, b, t) => a + (b - a) * t;
OE.angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2*Math.PI; while (d < -Math.PI) d += 2*Math.PI; return d; };

/* ---------------- shaders ---------------- */
const COMMON_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec4 aTan;
layout(location=3) in vec2 aUV; layout(location=4) in vec4 aCol; layout(location=5) in vec4 aJoints; layout(location=6) in vec4 aWeights;
uniform mat4 uVP, uModel; uniform mat4 uBones[24]; uniform bool uSkinned; uniform mat4 uLightVP;
out vec3 vWPos; out vec3 vNrm; out vec4 vTan; out vec2 vUV; out vec4 vCol; out vec4 vLPos;
void main(){
  mat4 M = uModel;
  if (uSkinned) {
    mat4 S = uBones[int(aJoints.x)]*aWeights.x + uBones[int(aJoints.y)]*aWeights.y + uBones[int(aJoints.z)]*aWeights.z + uBones[int(aJoints.w)]*aWeights.w;
    M = uModel * S;
  }
  vec4 wp = M * vec4(aPos,1.0);
  vWPos = wp.xyz; vNrm = normalize(mat3(M)*aNrm); vTan = vec4(normalize(mat3(M)*aTan.xyz), aTan.w);
  vUV = aUV; vCol = aCol; vLPos = uLightVP * wp;
  gl_Position = uVP * wp;
}`;
const LIT_FS = `#version 300 es
precision highp float; precision highp sampler2DShadow;
in vec3 vWPos; in vec3 vNrm; in vec4 vTan; in vec2 vUV; in vec4 vCol; in vec4 vLPos;
uniform int uMode; uniform sampler2D uBase, uNrmTex, uMR; uniform bool uHasNrm;
uniform sampler2D uTriA, uTriN; uniform float uTriScale;
uniform vec3 uColor, uEmissive; uniform float uRough, uMetal, uRim, uAlpha;
uniform vec3 uCam, uSunDir, uSunCol, uSky, uGround, uFogCol; uniform float uFogDen;
uniform sampler2DShadow uShadow; uniform float uShadowTexel; uniform bool uShadowOn;
uniform vec4 uPL[12]; uniform vec4 uPLc[12]; uniform int uPLn; uniform float uFlash;
out vec4 frag;
const float PI=3.14159265;
float shadowF(){
  if(!uShadowOn) return 1.0;
  vec3 p = vLPos.xyz/vLPos.w*0.5+0.5;
  if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0) return 1.0;
  float s=0.0; float b=0.0012;
  for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) s+=texture(uShadow, vec3(p.xy+vec2(x,y)*uShadowTexel, p.z-b));
  return s/9.0;
}
vec3 triSample(sampler2D t, vec3 p, vec3 w){
  return texture(t,p.zy*uTriScale).rgb*w.x + texture(t,p.xz*uTriScale).rgb*w.y + texture(t,p.xy*uTriScale).rgb*w.z;
}
void main(){
  vec3 N = normalize(vNrm); vec3 albedo; float rough=uRough, metal=uMetal, ao=1.0;
  if(uMode==0){
    vec4 b = texture(uBase,vUV); albedo = b.rgb*uColor;
    vec3 mr = texture(uMR,vUV).rgb; rough = clamp(mr.g*uRough,0.08,1.0); metal = mr.b*uMetal;
    if(uHasNrm){
      vec3 Tr = vTan.xyz - N*dot(N,vTan.xyz);
      if(dot(Tr,Tr)>1e-6){ vec3 T = normalize(Tr); vec3 B = cross(N,T)*vTan.w;
        vec3 tn = texture(uNrmTex,vUV).xyz*2.0-1.0; tn.xy*=0.9; vec3 Nn = mat3(T,B,N)*tn; if(dot(Nn,Nn)>1e-6) N = normalize(Nn); }
    }
  } else if(uMode==1){
    vec3 w = pow(abs(N), vec3(4.0)); w/=dot(w,vec3(1.0));
    vec3 a = triSample(uTriA, vWPos, w);
    albedo = a*vCol.rgb*uColor;
    // bump from triplanar normal-height texture (rg = slope)
    vec3 nx = texture(uTriN, vWPos.zy*uTriScale).xyz*2.0-1.0;
    vec3 ny = texture(uTriN, vWPos.xz*uTriScale).xyz*2.0-1.0;
    vec3 nz = texture(uTriN, vWPos.xy*uTriScale).xyz*2.0-1.0;
    vec3 an = sign(N);
    vec3 n1 = vec3(nx.z*an.x, nx.y, nx.x); vec3 n2 = vec3(ny.x, ny.z*an.y, ny.y); vec3 n3 = vec3(nz.x, nz.y, nz.z*an.z);
    N = normalize(mix(N, normalize(n1*w.x+n2*w.y+n3*w.z), 0.65));
    ao = mix(0.55,1.0,vCol.a);
    rough = uRough; metal=uMetal;
  } else {
    albedo = uColor*vCol.rgb;
  }
  vec3 V = normalize(uCam - vWPos);
  // safety: a shading normal pointing away from the viewer (thin cloth, merged geometry) is pulled back
  // towards the real face normal, so it can't catch rim/specular light and sparkle
  if (uMode == 0) {
    vec3 Ng = normalize(cross(dFdx(vWPos), dFdy(vWPos))); if (dot(Ng, V) < 0.0) Ng = -Ng;
    float nv = dot(N, V); if (nv < 0.15) N = normalize(mix(N, Ng, clamp((0.15 - nv) * 4.0, 0.0, 1.0)));
  }
  vec3 F0 = mix(vec3(0.04), albedo, metal);
  vec3 col = vec3(0.0);
  // sun / moon
  {
    vec3 L = normalize(uSunDir); vec3 H = normalize(L+V);
    float NL = max(dot(N,L),0.0), NH=min(max(dot(N,H),0.0),0.9999), NV=max(dot(N,V),1e-3), VH=max(dot(V,H),0.0);
    float a2 = rough*rough*rough*rough; float d = NH*NH*(a2-1.0)+1.0; float D = a2/(PI*d*d);
    float k = (rough+1.0)*(rough+1.0)/8.0; float G = NL/(NL*(1.0-k)+k) * NV/(NV*(1.0-k)+k);
    vec3 F = F0 + (1.0-F0)*pow(1.0-VH,5.0);
    vec3 spec = D*G*F/max(4.0*NL*NV,1e-3);
    vec3 kd = (1.0-F)*(1.0-metal);
    col += (kd*albedo/PI + spec) * uSunCol * NL * shadowF();
  }
  for(int i=0;i<12;i++){
    if(i>=uPLn) break;
    vec3 lp = uPL[i].xyz - vWPos; float dist=length(lp); float r=uPL[i].w;
    if(dist>r) continue;
    vec3 L = lp/dist; vec3 H=normalize(L+V);
    float NL=max(dot(N,L),0.0); float att = pow(clamp(1.0-dist/r,0.0,1.0),2.0)/(1.0+dist*dist*0.15);
    float NH=max(dot(N,H),0.0); float sp = pow(NH, mix(8.0,96.0,1.0-rough))*(1.0-rough)*0.6;
    col += (albedo*(1.0-metal)/PI*3.0 + F0*sp*4.0) * uPLc[i].rgb*uPLc[i].a * NL * att;
  }
  float hemi = N.y*0.5+0.5;
  vec3 amb = mix(uGround, uSky, hemi);
  col += amb*albedo*ao*(1.0-metal*0.6) + amb*F0*0.4*(1.0-rough);
  float rim = pow(1.0-max(dot(N,V),0.0),3.0)*uRim;
  col += rim*vec3(0.55,0.62,0.8)*0.6 + uEmissive;
  col += albedo*uFlash;
  float dist = length(uCam - vWPos);
  float fog = 1.0-exp(-dist*uFogDen);
  fog *= clamp(1.0 - (vWPos.y-2.0)*0.03, 0.4, 1.0);
  col = mix(col, uFogCol, clamp(fog,0.0,0.97));
  if(any(isnan(col))||any(isinf(col))) col=vec3(0.0);
  frag = vec4(max(col,vec3(0.0)), uAlpha);
}`;
const DEPTH_FS = `#version 300 es
precision mediump float; out vec4 frag; void main(){ frag=vec4(1.0); }`;
const FSQ_VS = `#version 300 es
layout(location=0) in vec2 aP; out vec2 vUV; void main(){ vUV=aP*0.5+0.5; gl_Position=vec4(aP,0.0,1.0); }`;
const SKY_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 frag;
uniform mat4 uInvVP; uniform vec3 uSunDir; uniform float uTime; uniform vec3 uFogCol; uniform float uFlash;
float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=0.5;} return s; }
void main(){
  vec4 p = uInvVP*vec4(vUV*2.0-1.0, 1.0, 1.0); vec3 d = normalize(p.xyz/p.w);
  float y = d.y;
  vec3 top = vec3(0.012,0.014,0.03); vec3 hor = vec3(0.32,0.11,0.05);
  vec3 c = mix(hor, top, smoothstep(-0.05,0.45,y));
  c = mix(c, uFogCol, smoothstep(0.08,-0.1,y));
  // fire glow along horizon in a few directions
  float az = atan(d.x,d.z);
  float glow = (0.5+0.5*sin(az*3.0+1.3))*(0.5+0.5*sin(az*7.0)) ;
  c += vec3(0.55,0.18,0.04)*glow*exp(-max(y,0.0)*9.0)*0.8;
  // clouds / smoke
  vec2 cp = d.xz/(max(y,0.04)+0.12)*1.3 + vec2(uTime*0.01,uTime*0.004);
  float cl = fbm(cp); cl = smoothstep(0.35,0.85,cl);
  vec3 ccol = mix(vec3(0.05,0.03,0.03), vec3(0.35,0.13,0.06), exp(-max(y,0.0)*4.0));
  c = mix(c, ccol, cl*smoothstep(-0.02,0.15,y)*0.85);
  // moon
  vec3 s = normalize(uSunDir); float md = dot(d,s);
  c += vec3(0.75,0.8,0.95)*smoothstep(0.9993,0.9997,md)*(1.0-cl*0.8)*3.0;
  c += vec3(0.25,0.3,0.45)*pow(max(md,0.0),60.0)*0.6*(1.0-cl*0.6);
  // stars
  vec2 sp = d.xz/(y+1.0)*300.0; float st = step(0.9975,h(floor(sp)))*smoothstep(0.1,0.5,y)*(1.0-cl);
  c += vec3(st)*0.6;
  c += vec3(1.0,0.85,0.7)*uFlash*0.25*smoothstep(0.4,-0.1,y);
  frag = vec4(c,1.0);
}`;
const BRIGHT_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 frag; uniform sampler2D uTex;
void main(){ vec3 c=texture(uTex,vUV).rgb; float l=max(max(c.r,c.g),c.b); frag=vec4(c*smoothstep(0.75,1.6,l),1.0); }`;
const BLUR_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 frag; uniform sampler2D uTex; uniform vec2 uDir;
void main(){ vec3 c=texture(uTex,vUV).rgb*0.227;
 c+=texture(uTex,vUV+uDir*1.385).rgb*0.316; c+=texture(uTex,vUV-uDir*1.385).rgb*0.316;
 c+=texture(uTex,vUV+uDir*3.23).rgb*0.07; c+=texture(uTex,vUV-uDir*3.23).rgb*0.07; frag=vec4(c,1.0); }`;
const COMP_FS = `#version 300 es
precision highp float; in vec2 vUV; out vec4 frag;
uniform sampler2D uTex, uBloom; uniform float uExposure, uTime, uVig, uHurt, uDesat, uBloomOn;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
void main(){
  vec3 c = texture(uTex,vUV).rgb;
  if(uBloomOn>0.5) c += texture(uBloom,vUV).rgb*0.55;
  c *= uExposure;
  c = aces(c);
  // grade: cool shadows, warm highlights
  float l = dot(c,vec3(0.299,0.587,0.114));
  c = mix(c, c*vec3(0.9,0.97,1.08), (1.0-l)*0.5);
  c = mix(c, c*vec3(1.06,1.0,0.9), l*0.5);
  c = mix(c, vec3(l), uDesat);
  vec2 q = vUV-0.5; float v = 1.0-dot(q,q)*uVig; c*=v;
  c = mix(c, c*vec3(1.4,0.35,0.3), uHurt*smoothstep(0.15,0.75,length(q)));
  float g = fract(sin(dot(vUV*vec2(1000.0,800.0)+uTime,vec2(12.9898,78.233)))*43758.5453);
  c += (g-0.5)*0.014;
  frag = vec4(pow(max(c,0.0),vec3(1.0/2.2)),1.0);
}`;
const PART_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos; layout(location=1) in vec4 aCol; layout(location=2) in vec4 aData; layout(location=3) in vec3 aVel;
uniform mat4 uVP; uniform vec3 uRight, uUp, uCam;
out vec4 vCol; out vec2 vQ; out float vSoft;
void main(){
  int c = gl_VertexID % 6; vec2 q = c==0?vec2(-1,-1):c==1?vec2(1,-1):c==2?vec2(1,1):c==3?vec2(-1,-1):c==4?vec2(1,1):vec2(-1,1);
  float s=aData.x, rot=aData.y, stretch=aData.z;
  vec3 p;
  if(stretch>0.0){
    vec3 vd = normalize(aVel+vec3(1e-5)); vec3 side = normalize(cross(vd, normalize(uCam-aPos)));
    p = aPos + side*q.x*s + vd*q.y*(s+stretch);
  } else {
    float cr=cos(rot), sr=sin(rot); vec2 r = vec2(q.x*cr-q.y*sr, q.x*sr+q.y*cr);
    p = aPos + (uRight*r.x + uUp*r.y)*s;
  }
  vCol=aCol; vQ=q; vSoft=aData.w; gl_Position = uVP*vec4(p,1.0);
}`;
const PART_FS = `#version 300 es
precision highp float; in vec4 vCol; in vec2 vQ; in float vSoft; out vec4 frag;
void main(){ float d=length(vQ); float a = 1.0-smoothstep(vSoft,1.0,d); if(a<=0.0) discard; frag = vec4(vCol.rgb*vCol.a*a, vCol.a*a); }`;

function compile(gl, vs, fs) {
  const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) + '\n' + s.split('\n').map((l,i)=>(i+1)+': '+l).join('\n')); return sh; };
  const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const nm = info.name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, info.name); }
  return { p, u };
}

/* ---------------- renderer ---------------- */
let gl, R;
OE.init = function (canvas, quality) {
  gl = OE.gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) throw new Error('WebGL2 not supported on this device/browser.');
  const hf = !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float');
  gl.getExtension('OES_texture_float_linear');
  R = OE.R = {
    canvas, quality, hf,
    lit: compile(gl, COMMON_VS, LIT_FS), depth: compile(gl, COMMON_VS, DEPTH_FS),
    skyP: compile(gl, FSQ_VS, SKY_FS), bright: compile(gl, FSQ_VS, BRIGHT_FS), blur: compile(gl, FSQ_VS, BLUR_FS), comp: compile(gl, FSQ_VS, COMP_FS),
    part: compile(gl, PART_VS, PART_FS),
    vp: M4.create(), view: M4.create(), proj: M4.create(), invVP: M4.create(), lightVP: M4.create(), ident: M4.create(),
    sunDir: [-0.35, 0.62, -0.45], sunCol: [0.55, 0.62, 0.85], sky: [0.07, 0.075, 0.11], ground: [0.09, 0.05, 0.035],
    fogCol: [0.12, 0.06, 0.04], fogDen: 0.028, exposure: 1.25, time: 0, hurt: 0, desat: 0, flash: 0,
    lights: [], post: {},
  };
  // full screen quad
  R.fsq = gl.createVertexArray(); gl.bindVertexArray(R.fsq);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
  // shadow map
  R.shadowSize = quality.shadow;
  R.shadowTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, R.shadowTex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, R.shadowSize, R.shadowSize);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  R.shadowFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, R.shadowFB);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, R.shadowTex, 0);
  gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  R.white = OE.texFromData(1, 1, new Uint8Array([255, 255, 255, 255]));
  R.flatN = OE.texFromData(1, 1, new Uint8Array([128, 128, 255, 255]));
  R.mr = OE.texFromData(1, 1, new Uint8Array([255, 200, 0, 255]));
  // particles
  R.pMax = quality.particles; R.pData = new Float32Array(R.pMax * 6 * 14);
  R.pVAO = gl.createVertexArray(); gl.bindVertexArray(R.pVAO); R.pBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, R.pBuf);
  gl.bufferData(gl.ARRAY_BUFFER, R.pData.byteLength, gl.DYNAMIC_DRAW);
  const st = 14 * 4;
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, st, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, st, 28);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 3, gl.FLOAT, false, st, 44);
  gl.bindVertexArray(null);
  OE.resize();
};

function mkTarget(w, h, fmt) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texStorage2D(gl.TEXTURE_2D, 1, fmt, w, h);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  return { t, fb, w, h };
}
OE.resize = function () {
  const c = R.canvas, dpr = Math.min(window.devicePixelRatio || 1, R.quality.dpr);
  const w = Math.max(2, Math.floor(c.clientWidth * dpr)), h = Math.max(2, Math.floor(c.clientHeight * dpr));
  if (c.width === w && c.height === h && R.post.main) return;
  c.width = w; c.height = h; R.w = w; R.h = h;
  const P = R.post; const fmt = R.hf ? gl.RGBA16F : gl.RGBA8;
  for (const k in P) { if (P[k] && P[k].fb) { gl.deleteFramebuffer(P[k].fb); gl.deleteTexture(P[k].t); } }
  if (P.msFB) { gl.deleteFramebuffer(P.msFB); gl.deleteRenderbuffer(P.msColor); gl.deleteRenderbuffer(P.msDepth); }
  P.main = mkTarget(w, h, fmt);
  const samples = Math.min(R.quality.msaa, gl.getParameter(gl.MAX_SAMPLES));
  P.msFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, P.msFB);
  P.msColor = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, P.msColor);
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, fmt, w, h);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, P.msColor);
  P.msDepth = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, P.msDepth);
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, P.msDepth);
  const bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2);
  P.b1 = mkTarget(bw, bh, fmt); P.b2 = mkTarget(bw, bh, fmt);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};

OE.texFromData = function (w, h, data, opts = {}) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, opts.srgb ? gl.SRGB8_ALPHA8 : gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  setTexParams(t, opts); return t;
};
OE.texFromImage = function (img, opts = {}) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, opts.srgb ? gl.SRGB8_ALPHA8 : gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
  setTexParams(t, opts); return t;
};
function setTexParams(t, opts) {
  const wrap = opts.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  const an = gl.getExtension('EXT_texture_filter_anisotropic');
  if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, R.quality.aniso || 4);
}

/* ---------------- meshes ---------------- */
OE.Mesh = class {
  constructor(d) {
    this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao);
    const n = d.pos.length / 3;
    const attr = (loc, arr, size, type = gl.FLOAT, norm = false) => {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      if (type === gl.FLOAT || norm) gl.vertexAttribPointer(loc, size, type, norm, 0, 0); else gl.vertexAttribPointer(loc, size, type, false, 0, 0);
    };
    attr(0, d.pos, 3); attr(1, d.nrm, 3);
    if (d.tan) attr(2, d.tan, 4); else gl.vertexAttrib4f(2, 1, 0, 0, 1);
    if (d.uv) attr(3, d.uv, 2); else gl.vertexAttrib2f(3, 0, 0);
    if (d.col) attr(4, d.col, 4); else gl.vertexAttrib4f(4, 1, 1, 1, 1);
    if (d.joints) attr(5, d.joints, 4, gl.UNSIGNED_BYTE, false); else gl.vertexAttrib4f(5, 0, 0, 0, 0);
    if (d.weights) attr(6, d.weights, 4); else gl.vertexAttrib4f(6, 1, 0, 0, 0);
    if (d.idx) {
      const b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, d.idx, gl.STATIC_DRAW);
      this.count = d.idx.length; this.itype = d.idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
    } else { this.count = n; }
    this.indexed = !!d.idx;
    gl.bindVertexArray(null);
    // bounds
    let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (let i = 0; i < d.pos.length; i += 3) for (let k = 0; k < 3; k++) { const v = d.pos[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
    this.center = [(mn[0]+mx[0])/2, (mn[1]+mx[1])/2, (mn[2]+mx[2])/2];
    this.radius = Math.hypot(mx[0]-mn[0], mx[1]-mn[1], mx[2]-mn[2]) / 2;
  }
  draw() { gl.bindVertexArray(this.vao); if (this.indexed) gl.drawElements(gl.TRIANGLES, this.count, this.itype, 0); else gl.drawArrays(gl.TRIANGLES, 0, this.count); }
};

/* Geometry builder: merges transformed primitives with vertex colours (rgb + ao in alpha) */
OE.Geo = class {
  constructor() { this.p = []; this.n = []; this.c = []; this.i = []; }
  _xf(m, x, y, z) { return [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]]; }
  _xn(m, x, y, z) { const v = [m[0]*x+m[4]*y+m[8]*z, m[1]*x+m[5]*y+m[9]*z, m[2]*x+m[6]*y+m[10]*z]; const l = Math.hypot(...v) || 1; return [v[0]/l, v[1]/l, v[2]/l]; }
  quad(m, a, b, c, d, n, col) {
    const base = this.p.length / 3;
    for (const v of [a, b, c, d]) { this.p.push(...this._xf(m, ...v)); this.n.push(...this._xn(m, ...n)); this.c.push(col[0], col[1], col[2], v[3] !== undefined ? v[3] : (col[3] ?? 1)); }
    this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  box(pos, size, opts = {}) {
    const m = M4.create(); const q = Q.create();
    Q.euler(q, opts.rx || 0, opts.ry || 0, opts.rz || 0);
    M4.fromRTS(m, q, pos, size);
    const col = opts.col || [1, 1, 1, 1]; const aoB = opts.aoBottom ?? 0.35;
    const h = 0.5;
    // vertex 4th component = ao: darker towards bottom
    const F = (x, y, z) => [x, y, z, y < 0 ? aoB : 1];
    this.quad(m, F(-h,-h,h), F(h,-h,h), F(h,h,h), F(-h,h,h), [0,0,1], col);
    this.quad(m, F(h,-h,-h), F(-h,-h,-h), F(-h,h,-h), F(h,h,-h), [0,0,-1], col);
    this.quad(m, F(h,-h,h), F(h,-h,-h), F(h,h,-h), F(h,h,h), [1,0,0], col);
    this.quad(m, F(-h,-h,-h), F(-h,-h,h), F(-h,h,h), F(-h,h,-h), [-1,0,0], col);
    this.quad(m, F(-h,h,h), F(h,h,h), F(h,h,-h), F(-h,h,-h), [0,1,0], col);
    if (!opts.noBottom) this.quad(m, F(-h,-h,-h), F(h,-h,-h), F(h,-h,h), F(-h,-h,h), [0,-1,0], col);
  }
  cyl(pos, r, hgt, seg, opts = {}) {
    const m = M4.create(); const q = Q.create(); Q.euler(q, opts.rx || 0, opts.ry || 0, opts.rz || 0);
    M4.fromRTS(m, q, pos, [1, 1, 1]); const col = opts.col || [1, 1, 1, 1]; const r2 = opts.r2 ?? r;
    for (let s = 0; s < seg; s++) {
      const a0 = s / seg * Math.PI * 2, a1 = (s + 1) / seg * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const base = this.p.length / 3;
      const vs = [[c0*r,0,s0*r,opts.aoB??0.4],[c1*r,0,s1*r,opts.aoB??0.4],[c1*r2,hgt,s1*r2,1],[c0*r2,hgt,s0*r2,1]];
      const ns = [[c0,0,s0],[c1,0,s1],[c1,0,s1],[c0,0,s0]];
      for (let k = 0; k < 4; k++) { this.p.push(...this._xf(m, vs[k][0], vs[k][1], vs[k][2])); this.n.push(...this._xn(m, ...ns[k])); this.c.push(col[0], col[1], col[2], vs[k][3]); }
      this.i.push(base, base + 2, base + 1, base, base + 3, base + 2);
      if (!opts.open) { // caps
        const cb = this.p.length / 3;
        this.p.push(...this._xf(m, 0, hgt, 0), ...this._xf(m, c1*r2, hgt, s1*r2), ...this._xf(m, c0*r2, hgt, s0*r2));
        const nu = this._xn(m, 0, 1, 0); this.n.push(...nu, ...nu, ...nu); for (let k = 0; k < 3; k++) this.c.push(col[0], col[1], col[2], 1);
        this.i.push(cb, cb + 1, cb + 2);
      }
    }
  }
  sphere(pos, r, seg, opts = {}) {
    const col = opts.col || [1, 1, 1, 1]; const sy = opts.sy || 1;
    const base = this.p.length / 3;
    for (let y = 0; y <= seg; y++) for (let x = 0; x <= seg * 2; x++) {
      const th = y / seg * Math.PI, ph = x / (seg * 2) * Math.PI * 2;
      const nx = Math.sin(th) * Math.cos(ph), ny = Math.cos(th), nz = Math.sin(th) * Math.sin(ph);
      this.p.push(pos[0] + nx * r, pos[1] + ny * r * sy, pos[2] + nz * r); this.n.push(nx, ny, nz); this.c.push(col[0], col[1], col[2], 0.5 + 0.5 * ny);
    }
    const W = seg * 2 + 1;
    for (let y = 0; y < seg; y++) for (let x = 0; x < seg * 2; x++) {
      const a = base + y * W + x; this.i.push(a, a + 1, a + W + 1, a, a + W + 1, a + W);
    }
  }
  build() {
    const n = this.p.length / 3;
    return new OE.Mesh({ pos: new Float32Array(this.p), nrm: new Float32Array(this.n), col: new Float32Array(this.c),
      idx: n > 65535 ? new Uint32Array(this.i) : new Uint16Array(this.i) });
  }
};

/* ---------------- scene nodes ---------------- */
OE.Node = class {
  constructor(mesh, mat) {
    this.pos = [0, 0, 0]; this.rot = Q.create(); this.scl = [1, 1, 1]; this.children = []; this.parent = null;
    this.mesh = mesh || null; this.mat = mat || null; this.world = M4.create(); this.local = M4.create();
    this.visible = true; this.castShadow = true; this.skin = null; this.attach = null;
  }
  add(c) { c.parent = this; this.children.push(c); return c; }
  remove(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parent = null; }
  update(parentWorld) {
    M4.fromRTS(this.local, this.rot, this.pos, this.scl);
    if (this.attach) { M4.mul(this.world, this.attach(), this.local); }
    else if (parentWorld) M4.mul(this.world, parentWorld, this.local); else this.world.set(this.local);
    for (const c of this.children) c.update(this.world);
  }
};
OE.scene = null;

/* ---------------- GLB loading & skinned characters ---------------- */
OE.loadGLB = async function (buffer) {
  const dv = new DataView(buffer);
  const jl = dv.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jl)));
  const binOff = 20 + jl + 8;
  const CT = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array };
  const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const acc = (i) => { const a = json.accessors[i], bv = json.bufferViews[a.bufferView];
    const T = CT[a.componentType]; const off = binOff + (bv.byteOffset || 0) + (a.byteOffset || 0);
    return new T(buffer.slice(off, off + a.count * NC[a.type] * T.BYTES_PER_ELEMENT)); };
  const prim = json.meshes[0].primitives[0], A = prim.attributes;
  const mesh = new OE.Mesh({ pos: acc(A.POSITION), nrm: acc(A.NORMAL), tan: A.TANGENT !== undefined ? acc(A.TANGENT) : null,
    uv: acc(A.TEXCOORD_0), joints: A.JOINTS_0 !== undefined ? acc(A.JOINTS_0) : null, weights: A.WEIGHTS_0 !== undefined ? acc(A.WEIGHTS_0) : null, idx: acc(prim.indices) });
  const imgs = await Promise.all(json.images.map(async (im) => {
    const bv = json.bufferViews[im.bufferView]; const blob = new Blob([new Uint8Array(buffer, binOff + (bv.byteOffset || 0), bv.byteLength)], { type: im.mimeType });
    if (window.createImageBitmap) return await createImageBitmap(blob);
    return await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = URL.createObjectURL(blob); });
  }));
  const mat = json.materials[0], pbr = mat.pbrMetallicRoughness;
  const texOf = (ti, srgb) => OE.texFromImage(imgs[json.textures[ti].source], { srgb });
  const textures = { base: texOf(pbr.baseColorTexture.index, true), nrm: mat.normalTexture ? texOf(mat.normalTexture.index, false) : null,
    mr: pbr.metallicRoughnessTexture ? texOf(pbr.metallicRoughnessTexture.index, false) : null };
  const skin = json.skins[0];
  const joints = skin.joints; const ibm = acc(skin.inverseBindMatrices);
  const nodes = json.nodes.map((n) => ({ name: n.name, t: n.translation || [0, 0, 0], r: n.rotation || [0, 0, 0, 1], children: n.children || [] }));
  const parent = new Array(nodes.length).fill(-1); nodes.forEach((n, i) => n.children.forEach((c) => parent[c] = i));
  const bones = joints.map((ni, k) => ({ name: nodes[ni].name, node: ni, parent: joints.indexOf(parent[ni]), t: Float32Array.from(nodes[ni].t), r: Float32Array.from(nodes[ni].r) }));
  const clips = {};
  for (const an of json.animations || []) {
    const clip = { name: an.name, loop: !!(an.extras && an.extras.loop), dur: 0, rot: {}, tr: {} };
    for (const ch of an.channels) {
      const s = an.samplers[ch.sampler]; const times = acc(s.input), vals = acc(s.output);
      const bi = joints.indexOf(ch.target.node); clip.dur = Math.max(clip.dur, times[times.length - 1]);
      const tr = { times, vals, dt: times.length > 1 ? times[1] - times[0] : 1 };
      if (ch.target.path === 'rotation') clip.rot[bi] = tr; else if (ch.target.path === 'translation') clip.tr[bi] = tr;
    }
    clips[an.name] = clip;
  }
  return { mesh, textures, bones, ibm, clips };
};

const _q1 = Q.create(), _q2 = Q.create();
function sampleTrack(tr, t, n, out) {
  const f = t / tr.dt; let i = Math.floor(f); const last = tr.times.length - 1;
  if (i >= last) { for (let k = 0; k < n; k++) out[k] = tr.vals[last * n + k]; return out; }
  if (i < 0) i = 0; const u = f - i; const a = i * n, b = (i + 1) * n;
  if (n === 4) {
    _q1[0]=tr.vals[a];_q1[1]=tr.vals[a+1];_q1[2]=tr.vals[a+2];_q1[3]=tr.vals[a+3];
    _q2[0]=tr.vals[b];_q2[1]=tr.vals[b+1];_q2[2]=tr.vals[b+2];_q2[3]=tr.vals[b+3];
    return Q.slerp(out, _q1, _q2, u);
  }
  for (let k = 0; k < n; k++) out[k] = tr.vals[a + k] + (tr.vals[b + k] - tr.vals[a + k]) * u; return out;
}

OE.Character = class {
  constructor(asset, opts = {}) {
    this.a = asset; this.node = new OE.Node(asset.mesh, { mode: 0, base: asset.textures.base, nrm: asset.textures.nrm, mr: asset.textures.mr,
      color: opts.color || [1, 1, 1], rough: 1.0, metal: 1.0, rim: opts.rim ?? 0.35 });
    const nb = asset.bones.length;
    this.local = asset.bones.map((b) => ({ t: Float32Array.from(b.t), r: Float32Array.from(b.r) }));
    this.worldB = asset.bones.map(() => M4.create()); this.boneMats = new Float32Array(24 * 16);
    this.node.skin = this;
    this.cur = null; this.prev = null; this.t = 0; this.pt = 0; this.fade = 0; this.fadeDur = 0.2; this.speed = 1;
    this.tmpQ = Q.create(); this.tmpT = new Float32Array(3); this.tmpQ2 = Q.create(); this.tmpT2 = new Float32Array(3);
    this.boneIndex = {}; asset.bones.forEach((b, i) => this.boneIndex[b.name] = i);
    this.override = {}; // bone -> quat applied after anim (local, post-multiplied)
    this.finished = false;
  }
  play(name, fade = 0.18, speed = 1, restart = false) {
    const c = this.a.clips[name]; if (!c) return;
    if (this.cur === c && !restart) { this.speed = speed; return; }
    this.prev = this.cur; this.pt = this.t; this.cur = c; this.t = 0; this.fade = this.prev ? fade : 0; this.fadeDur = fade; this.speed = speed; this.finished = false;
  }
  get progress() { return this.cur ? Math.min(1, this.t / this.cur.dur) : 0; }
  update(dt) {
    if (!this.cur) return;
    this.t += dt * this.speed;
    if (this.t >= this.cur.dur) { if (this.cur.loop) this.t %= this.cur.dur; else { this.t = this.cur.dur; this.finished = true; } }
    if (this.prev) { this.pt += dt; if (this.prev.loop) this.pt %= this.prev.dur; else this.pt = Math.min(this.pt, this.prev.dur); }
    this.fade = Math.max(0, this.fade - dt);
    const w = this.fadeDur > 0 && this.prev ? this.fade / this.fadeDur : 0;
    const bones = this.a.bones;
    for (let i = 0; i < bones.length; i++) {
      const L = this.local[i];
      const rt = this.cur.rot[i]; if (rt) sampleTrack(rt, this.t, 4, L.r);
      const tt = this.cur.tr[i]; if (tt) sampleTrack(tt, this.t, 3, L.t);
      if (w > 0) {
        const pr = this.prev.rot[i]; if (pr) { sampleTrack(pr, this.pt, 4, this.tmpQ); Q.slerp(L.r, L.r, this.tmpQ, w); }
        const ptr = this.prev.tr[i]; if (ptr) { sampleTrack(ptr, this.pt, 3, this.tmpT); for (let k = 0; k < 3; k++) L.t[k] += (this.tmpT[k] - L.t[k]) * w; }
      }
      const ov = this.override[bones[i].name]; if (ov) Q.mul(L.r, L.r, ov);
    }
  }
  computeBones(modelWorld) {
    const bones = this.a.bones, m = M4.create();
    for (let i = 0; i < bones.length; i++) {
      M4.fromRTS(m, this.local[i].r, this.local[i].t, null);
      const p = bones[i].parent; if (p >= 0) M4.mul(this.worldB[i], this.worldB[p], m); else this.worldB[i].set(m);
    }
    const tmp = M4.create();
    for (let i = 0; i < bones.length; i++) { M4.mul(tmp, this.worldB[i], this.a.ibm.subarray(i * 16, i * 16 + 16)); this.boneMats.set(tmp, i * 16); }
  }
  boneWorld(name, out) { // in world space (requires node.world)
    return M4.mul(out || M4.create(), this.node.world, this.worldB[this.boneIndex[name]]);
  }
};

/* ---------------- model-space pose & two-bone IK ---------------- */
const qmul = (a, b) => [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1], a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0], a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3], a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const qinv = (q) => [-q[0], -q[1], -q[2], q[3]];
const qrot = (q, v) => { const r = qmul(qmul(q, [v[0], v[1], v[2], 0]), qinv(q)); return [r[0], r[1], r[2]]; };
const vsub = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]], vadd = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]], vsc = (a, s) => [a[0]*s, a[1]*s, a[2]*s];
const vlen = (a) => Math.hypot(a[0], a[1], a[2]), vnorm = (a) => { const l = vlen(a) || 1; return [a[0]/l, a[1]/l, a[2]/l]; };
const vdot = (a, b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2], vcross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
function qfromTo(a, b) {
  a = vnorm(a); b = vnorm(b); const d = vdot(a, b);
  if (d < -0.9999) { let ax = vcross([1, 0, 0], a); if (vlen(ax) < 1e-3) ax = vcross([0, 1, 0], a); ax = vnorm(ax); return [ax[0], ax[1], ax[2], 0]; }
  const c = vcross(a, b); const q = [c[0], c[1], c[2], 1 + d]; const l = Math.hypot(...q); return q.map((x) => x / l);
}
OE.V = { sub: vsub, add: vadd, sc: vsc, len: vlen, norm: vnorm, dot: vdot, cross: vcross, qrot, qmul };
OE.Character.prototype.modelPose = function () {
  const b = this.a.bones; this.mR = this.mR || []; this.mP = this.mP || [];
  for (let i = 0; i < b.length; i++) {
    const L = this.local[i], p = b[i].parent;
    if (p >= 0) { this.mR[i] = qmul(this.mR[p], L.r); this.mP[i] = vadd(this.mP[p], qrot(this.mR[p], L.t)); }
    else { this.mR[i] = [L.r[0], L.r[1], L.r[2], L.r[3]]; this.mP[i] = [L.t[0], L.t[1], L.t[2]]; }
  }
};
// bend a 3-joint chain (e.g. upper arm, forearm, hand) so the last joint reaches target (model space)
OE.Character.prototype.ik = function (names, target, pole, w) {
  if (w <= 0) return;
  const bi = this.boneIndex, b = this.a.bones; const u = bi[names[0]], f = bi[names[1]], h = bi[names[2]];
  const A = this.mP[u], Bp = this.mP[f], C = this.mP[h]; const l1 = vlen(vsub(Bp, A)), l2 = vlen(vsub(C, Bp));
  let dv = vsub(target, A); let d = vlen(dv); const dir = vnorm(dv);
  d = Math.min(Math.max(d, Math.abs(l1 - l2) + 1e-3), (l1 + l2) * 0.999);
  const T = vadd(A, vsc(dir, d));
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let pn = vsub(pole, A); pn = vnorm(vsub(pn, vsc(dir, vdot(pn, dir))));
  const E = vadd(vadd(A, vsc(dir, a)), vsc(pn, hh));
  const Pw = b[u].parent >= 0 ? this.mR[b[u].parent] : [0, 0, 0, 1];
  const qU = qfromTo(vsub(Bp, A), vsub(E, A));
  const newU = qmul(qU, this.mR[u]);
  const locU = qmul(qinv(Pw), newU);
  const newF0 = qmul(newU, this.local[f].r);
  const C1 = vadd(E, qrot(newF0, this.local[h].t));
  const qF = qfromTo(vsub(C1, E), vsub(T, E));
  const newF = qmul(qF, newF0); const locF = qmul(qinv(newU), newF);
  const sl = (dst, q) => { const tmp = new Float32Array(q); Q.slerp(dst, dst, tmp, w); };
  sl(this.local[u].r, locU); sl(this.local[f].r, locF); sl(this.local[h].r, [0, 0, 0, 1]);
};

/* ---------------- particles ---------------- */
OE.Particles = class {
  constructor(max) { this.list = []; this.max = max; }
  emit(o) { if (this.list.length >= this.max) this.list.shift(); this.list.push(Object.assign({ age: 0, life: 1, size: 0.2, grow: 0, rot: 0, spin: 0, drag: 0, grav: 0, stretch: 0, soft: 0.0, add: true,
    col: [1, 1, 1, 1], fade: 1, vel: [0, 0, 0] }, o)); }
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i]; p.age += dt; if (p.age >= p.life) { L.splice(i, 1); continue; }
      p.vel[1] -= p.grav * dt; const d = Math.max(0, 1 - p.drag * dt); p.vel[0] *= d; p.vel[1] *= d; p.vel[2] *= d;
      p.pos[0] += p.vel[0] * dt; p.pos[1] += p.vel[1] * dt; p.pos[2] += p.vel[2] * dt; p.rot += p.spin * dt;
      if (p.floor !== undefined && p.pos[1] < p.floor) { p.pos[1] = p.floor; p.vel[1] *= -0.3; p.vel[0] *= 0.6; p.vel[2] *= 0.6; }
    }
  }
};

/* ---------------- frame rendering ---------------- */
const matDefaults = { mode: 2, color: [1, 1, 1], rough: 0.8, metal: 0, emissive: [0, 0, 0], rim: 0, triScale: 0.25, alpha: 1 };
function setMat(u, m, flash) {
  m = m || matDefaults;
  gl.uniform1i(u.uMode, m.mode ?? 2);
  gl.uniform3fv(u.uColor, m.color || matDefaults.color); gl.uniform1f(u.uRough, m.rough ?? 0.8); gl.uniform1f(u.uMetal, m.metal ?? 0);
  gl.uniform3fv(u.uEmissive, m.emissive || matDefaults.emissive); gl.uniform1f(u.uRim, m.rim || 0); gl.uniform1f(u.uAlpha, m.alpha ?? 1);
  gl.uniform1f(u.uFlash, (m.flash || 0) + (flash || 0));
  if (m.mode === 0) {
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, m.base || R.white);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, m.nrm || R.flatN);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, m.mr || R.mr);
    gl.uniform1i(u.uHasNrm, m.nrm ? 1 : 0);
  } else if (m.mode === 1) {
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, m.triA);
    gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, m.triN);
    gl.uniform1f(u.uTriScale, m.triScale || 0.25);
  }
}
function collect(node, list) {
  if (!node.visible) return;
  if (node.mesh) list.push(node);
  for (const c of node.children) collect(c, list);
}

OE.render = function (cam, particles) {
  const P = R.post; R.time += 1 / 60;
  const list = []; collect(OE.scene, list);
  for (const n of list) if (n.skin) n.skin.computeBones();
  OE.scene.update(null);
  // camera
  M4.perspective(R.proj, cam.fov, R.w / R.h, 0.1, 400);
  M4.lookAt(R.view, cam.pos, cam.target, [0, 1, 0]);
  M4.mul(R.vp, R.proj, R.view); M4.invert(R.invVP, R.vp);
  // shadow pass
  const sc = cam.shadowCenter || cam.target; const ext = R.quality.shadowExt;
  const sd = R.sunDir; const sl = Math.hypot(...sd);
  const texelWorld = ext * 2 / R.shadowSize;
  const lv = M4.create(), lp = M4.create();
  const cx = Math.round(sc[0] / texelWorld) * texelWorld, cz = Math.round(sc[2] / texelWorld) * texelWorld;
  M4.lookAt(lv, [cx + sd[0] / sl * 60, sd[1] / sl * 60, cz + sd[2] / sl * 60], [cx, 0, cz], [0, 1, 0]);
  M4.ortho(lp, -ext, ext, -ext, ext, 1, 140); M4.mul(R.lightVP, lp, lv);
  gl.bindFramebuffer(gl.FRAMEBUFFER, R.shadowFB); gl.viewport(0, 0, R.shadowSize, R.shadowSize);
  gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.disable(gl.BLEND);
  const D = R.depth; gl.useProgram(D.p); gl.uniformMatrix4fv(D.u.uVP, false, R.lightVP); gl.uniformMatrix4fv(D.u.uLightVP, false, R.lightVP);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(2.0, 4.0); gl.disable(gl.CULL_FACE);
  for (const n of list) {
    if (!n.castShadow || (n.mat && n.mat.alpha < 1)) continue;
    gl.uniformMatrix4fv(D.u.uModel, false, n.world);
    gl.uniform1i(D.u.uSkinned, n.skin ? 1 : 0); if (n.skin) gl.uniformMatrix4fv(D.u.uBones, false, n.skin.boneMats);
    n.mesh.draw();
  }
  gl.disable(gl.POLYGON_OFFSET_FILL);
  // main pass
  gl.bindFramebuffer(gl.FRAMEBUFFER, P.msFB); gl.viewport(0, 0, R.w, R.h);
  gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // sky
  gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
  gl.useProgram(R.skyP.p); gl.uniformMatrix4fv(R.skyP.u.uInvVP, false, R.invVP); gl.uniform3fv(R.skyP.u.uSunDir, R.sunDir);
  gl.uniform1f(R.skyP.u.uTime, R.time); gl.uniform3fv(R.skyP.u.uFogCol, R.fogCol); gl.uniform1f(R.skyP.u.uFlash, R.flash);
  gl.bindVertexArray(R.fsq); gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
  const L = R.lit, u = L.u; gl.useProgram(L.p);
  gl.uniformMatrix4fv(u.uVP, false, R.vp); gl.uniformMatrix4fv(u.uLightVP, false, R.lightVP);
  gl.uniform3fv(u.uCam, cam.pos); gl.uniform3fv(u.uSunDir, R.sunDir); gl.uniform3fv(u.uSunCol, R.sunCol);
  gl.uniform3fv(u.uSky, R.sky); gl.uniform3fv(u.uGround, R.ground); gl.uniform3fv(u.uFogCol, R.fogCol); gl.uniform1f(u.uFogDen, R.fogDen);
  gl.uniform1i(u.uBase, 0); gl.uniform1i(u.uNrmTex, 1); gl.uniform1i(u.uMR, 2); gl.uniform1i(u.uTriA, 3); gl.uniform1i(u.uTriN, 4); gl.uniform1i(u.uShadow, 5);
  gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, R.shadowTex); gl.uniform1f(u.uShadowTexel, 1 / R.shadowSize); gl.uniform1i(u.uShadowOn, 1);
  // point lights: nearest to camera target
  const tgt = cam.target;
  const pls = R.lights.filter(l => l.intensity > 0.01).sort((a, b) => (Math.hypot(a.pos[0]-tgt[0], a.pos[2]-tgt[2]) - a.range) - (Math.hypot(b.pos[0]-tgt[0], b.pos[2]-tgt[2]) - b.range)).slice(0, 12);
  const plA = new Float32Array(48), plC = new Float32Array(48);
  pls.forEach((l, i) => { plA.set([l.pos[0], l.pos[1], l.pos[2], l.range], i * 4); plC.set([l.color[0], l.color[1], l.color[2], l.intensity], i * 4); });
  gl.uniform4fv(u.uPL, plA); gl.uniform4fv(u.uPLc, plC); gl.uniform1i(u.uPLn, pls.length);
  const transparent = [];
  // frustum-ish culling by distance
  for (const n of list) {
    if (n.mat && n.mat.alpha < 1) { transparent.push(n); continue; }
    drawNode(n, u, cam);
  }
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  for (const n of transparent) drawNode(n, u, cam);
  gl.depthMask(true); gl.disable(gl.BLEND);
  // particles
  if (particles && particles.list.length) drawParticles(particles, cam);
  // resolve MSAA
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, P.msFB); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, P.main.fb);
  gl.blitFramebuffer(0, 0, R.w, R.h, 0, 0, R.w, R.h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.bindVertexArray(R.fsq);
  const bloom = R.quality.bloom;
  if (bloom) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, P.b1.fb); gl.viewport(0, 0, P.b1.w, P.b1.h);
    gl.useProgram(R.bright.p); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, P.main.t); gl.uniform1i(R.bright.u.uTex, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(R.blur.p); gl.uniform1i(R.blur.u.uTex, 0);
    for (let it = 0; it < 2; it++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, P.b2.fb); gl.bindTexture(gl.TEXTURE_2D, P.b1.t); gl.uniform2f(R.blur.u.uDir, 1 / P.b1.w * (1 + it), 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, P.b1.fb); gl.bindTexture(gl.TEXTURE_2D, P.b2.t); gl.uniform2f(R.blur.u.uDir, 0, 1 / P.b1.h * (1 + it)); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, R.w, R.h);
  const C = R.comp; gl.useProgram(C.p);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, P.main.t); gl.uniform1i(C.u.uTex, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, P.b1.t); gl.uniform1i(C.u.uBloom, 1);
  gl.uniform1f(C.u.uExposure, R.exposure); gl.uniform1f(C.u.uTime, R.time % 100); gl.uniform1f(C.u.uVig, 1.1);
  gl.uniform1f(C.u.uHurt, R.hurt); gl.uniform1f(C.u.uDesat, R.desat); gl.uniform1f(C.u.uBloomOn, bloom ? 1 : 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
};
function drawNode(n, u, cam) {
  if (!n.skin && n.mesh.radius < 30) {
    const w = n.world; const dx = w[12] - cam.pos[0], dz = w[14] - cam.pos[2];
    if (dx * dx + dz * dz > (R.quality.drawDist + n.mesh.radius) ** 2) return;
  }
  if (n.mat && n.mat.doubleSided) gl.disable(gl.CULL_FACE); else { gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); }
  setMat(u, n.mat, 0);
  gl.uniformMatrix4fv(u.uModel, false, n.world);
  gl.uniform1i(u.uSkinned, n.skin ? 1 : 0); if (n.skin) gl.uniformMatrix4fv(u.uBones, false, n.skin.boneMats);
  n.mesh.draw();
}
function drawParticles(ps, cam) {
  const view = R.view; const right = [view[0], view[4], view[8]], up = [view[1], view[5], view[9]];
  const Pr = R.part; gl.useProgram(Pr.p); gl.uniformMatrix4fv(Pr.u.uVP, false, R.vp); gl.uniform3fv(Pr.u.uRight, right); gl.uniform3fv(Pr.u.uUp, up); gl.uniform3fv(Pr.u.uCam, cam.pos);
  gl.enable(gl.BLEND); gl.depthMask(false); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
  for (const additive of [false, true]) {
    let n = 0; const d = R.pData;
    for (const p of ps.list) {
      if (p.add !== additive) continue; if (n >= R.pMax) break;
      const u = p.age / p.life; const a = p.col[3] * (p.fade ? (u < 0.1 ? u / 0.1 : 1 - Math.pow(u, 1.5)) : 1);
      const s = p.size + p.grow * p.age;
      for (let v = 0; v < 6; v++) {
        const o = (n * 6 + v) * 14;
        d[o] = p.pos[0]; d[o+1] = p.pos[1]; d[o+2] = p.pos[2]; d[o+3] = p.col[0]; d[o+4] = p.col[1]; d[o+5] = p.col[2]; d[o+6] = a;
        d[o+7] = s; d[o+8] = p.rot; d[o+9] = p.stretch; d[o+10] = p.soft; d[o+11] = p.vel[0]; d[o+12] = p.vel[1]; d[o+13] = p.vel[2];
      }
      n++;
    }
    if (!n) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER, R.pBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, R.pData, 0, n * 6 * 14);
    if (additive) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(R.pVAO); gl.drawArrays(gl.TRIANGLES, 0, n * 6);
  }
  gl.depthMask(true); gl.disable(gl.BLEND);
}

/* ---------------- procedural textures ---------------- */
OE.proceduralTex = function (kind, size = 512) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const img = x.createImageData(size, size); const H = new Float32Array(size * size);
  const rnd = mulberry(kind.length * 977 + 13);
  // tileable value-noise fbm
  const grid = (g) => { const a = new Float32Array(g * g); for (let i = 0; i < a.length; i++) a[i] = rnd(); return a; };
  const octs = [4, 8, 16, 32, 64, 128].map(g => ({ g, a: grid(g) }));
  const vn = (o, u, v) => { const g = o.g, fx = u * g, fy = v * g, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const sx = tx*tx*(3-2*tx), sy = ty*ty*(3-2*ty); const A = o.a;
    const i0 = ((iy % g) * g), i1 = (((iy + 1) % g) * g), x0 = ix % g, x1 = (ix + 1) % g;
    return (A[i0+x0]*(1-sx)+A[i0+x1]*sx)*(1-sy)+(A[i1+x0]*(1-sx)+A[i1+x1]*sx)*sy; };
  const P = { concrete: [0.42, 0.40, 0.38], ground: [0.26, 0.22, 0.19], metal: [0.30, 0.28, 0.26], brick: [0.36, 0.22, 0.17] }[kind];
  for (let y = 0; y < size; y++) for (let xx = 0; xx < size; xx++) {
    const u = xx / size, v = y / size; let n = 0, amp = 0.5;
    for (const o of octs) { n += vn(o, u, v) * amp; amp *= 0.55; }
    let h = n;
    let col = P.slice(); let ao = 1;
    if (kind === 'concrete') {
      const pores = vn(octs[5], u, v) > 0.82 ? -0.25 : 0; h += pores * 0.4;
      const stain = Math.pow(vn(octs[1], u, v), 2) * 0.6;
      col = col.map(c => c * (0.75 + n * 0.5) * (1 - stain * 0.5));
      // panel seams
      if ((y % 256) < 3 || (xx % 256) < 3) { h -= 0.35; col = col.map(c => c * 0.55); }
    } else if (kind === 'ground') {
      const pebble = vn(octs[4], u, v); const p2 = vn(octs[5], u, v);
      h = n * 0.6 + Math.max(0, pebble - 0.55) * 1.5 + p2 * 0.15;
      const wet = Math.max(0, vn(octs[1], u, v) - 0.55) * 2;
      col = [col[0] * (0.7 + n * 0.6) * (1 - wet * 0.4), col[1] * (0.7 + n * 0.55) * (1 - wet * 0.35), col[2] * (0.7 + n * 0.5) * (1 - wet * 0.2)];
      if (pebble > 0.62) col = col.map(c => c * 1.25);
    } else if (kind === 'metal') {
      const rust = Math.max(0, vn(octs[2], u, v) - 0.45) * 2.2 + Math.max(0, vn(octs[4], u, v) - 0.6);
      col = [col[0] * (0.8 + n * 0.4) + rust * 0.22, col[1] * (0.8 + n * 0.4) + rust * 0.08, col[2] * (0.8 + n * 0.4) - rust * 0.02];
      if ((y % 128) < 2) { h -= 0.4; col = col.map(c => c * 0.5); }
      const rv = ((xx % 64) - 32) ** 2 + ((y % 128) - 64) ** 2; if (rv < 18) { h += 0.4; }
      h += rust * 0.2;
    } else if (kind === 'brick') {
      const row = Math.floor(v * 16), off = (row % 2) * 0.5; const bu = (u * 8 + off) % 1, bv = (v * 16) % 1;
      const mortar = bu < 0.06 || bv < 0.1; const bid = Math.floor(u * 8 + off) * 31 + row * 7;
      const tint = 0.8 + ((bid * 9301 + 49297) % 233280) / 233280 * 0.4;
      if (mortar) { col = [0.3, 0.29, 0.27].map(c => c * (0.8 + n * 0.4)); h = 0.2 + n * 0.1; }
      else { col = col.map(c => c * tint * (0.75 + n * 0.5)); h = 0.6 + n * 0.3; }
      const soot = Math.max(0, vn(octs[1], u, v) - 0.5) * 1.6; col = col.map(c => c * (1 - soot * 0.7));
    }
    H[y * size + xx] = h;
    const o = (y * size + xx) * 4;
    img.data[o] = Math.min(255, Math.max(0, Math.pow(col[0], 1 / 2.2) * 255));
    img.data[o + 1] = Math.min(255, Math.max(0, Math.pow(col[1], 1 / 2.2) * 255));
    img.data[o + 2] = Math.min(255, Math.max(0, Math.pow(col[2], 1 / 2.2) * 255)); img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const albedo = OE.texFromImage(c, { srgb: true, repeat: true });
  // normal from height
  const nimg = x.createImageData(size, size); const str = kind === 'brick' ? 5 : 3.5;
  for (let y = 0; y < size; y++) for (let xx = 0; xx < size; xx++) {
    const hL = H[y * size + ((xx - 1 + size) % size)], hR = H[y * size + ((xx + 1) % size)], hD = H[((y - 1 + size) % size) * size + xx], hU = H[((y + 1) % size) * size + xx];
    let nx = (hL - hR) * str, ny = (hD - hU) * str, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const o = (y * size + xx) * 4; nimg.data[o] = (nx * 0.5 + 0.5) * 255; nimg.data[o + 1] = (ny * 0.5 + 0.5) * 255; nimg.data[o + 2] = (nz * 0.5 + 0.5) * 255; nimg.data[o + 3] = 255;
  }
  x.putImageData(nimg, 0, 0);
  const normal = OE.texFromImage(c, { repeat: true });
  return { albedo, normal };
};
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
OE.rng = mulberry;
})();
