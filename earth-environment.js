// Direction-space planet: camera translation is ignored, attitude is not.
// NASA Blue Marble January 2004. Radius/distance ratio represents a low orbit.
export const SUN_DIRECTION=[-22,15,28];
export const EARTH_DIRECTION=[0,-.78,-.63];
export function createEarthEnvironment(THREE, scene, ready=()=>{}, maxAnisotropy=4) {
 const mobile=matchMedia('(max-width: 820px)').matches;
 const fallback=new THREE.DataTexture(new Uint8Array([12,35,64,255]),1,1);
 fallback.needsUpdate=true;
 // Sub-spacecraft reference over the central Mediterranean, south of Sicily.
 const lat=35.5*Math.PI/180,lon=16*Math.PI/180;
 // Right-handed geographic frame: east × north points outward.
 // With north along +Y, east at zero longitude must point along -Z.
 const mapRotation=new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,.78,.63).normalize(),new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),-Math.cos(lat)*Math.sin(lon)))));
 const material=new THREE.ShaderMaterial({
  uniforms:{earthMap:{value:fallback},detailMap:{value:fallback},detailReady:{value:0},mapRotation:{value:mapRotation},sunDirection:{value:new THREE.Vector3(...SUN_DIRECTION).normalize()}},
  side:THREE.BackSide,depthWrite:false,depthTest:false,
  vertexShader:`varying vec3 direction;
   void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`precision highp float;
   varying vec3 direction;
   uniform sampler2D earthMap;
   uniform sampler2D detailMap;
   uniform float detailReady;
   uniform mat3 mapRotation;
   uniform vec3 sunDirection;
   float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
   void main(){
    vec3 ray=normalize(direction),centre=normalize(vec3(0.,-.78,-.63))*191.;
    float radius=180.,b=dot(ray,centre),disc=b*b-dot(centre,centre)+radius*radius;
    vec3 sun=sunDirection,color=vec3(.0003,.0005,.001);
    if(disc>0.&&b>0.){
     vec3 hit=ray*(b-sqrt(disc)),n=normalize(hit-centre);
     vec3 geographic=mapRotation*n;
     vec2 uv=vec2(fract(atan(-geographic.z,geographic.x)/6.28318530718+.5),asin(clamp(geographic.y,-1.,1.))/3.14159265359+.5);
     vec3 surface=texture2D(earthMap,uv).rgb;
     vec2 detailUV=(uv-vec2(168./360.,110./180.))/vec2(60./360.,35./180.);
     if(detailReady>.5&&all(greaterThan(detailUV,vec2(0.)))&&all(lessThan(detailUV,vec2(1.)))){
      vec2 edge=min(detailUV,1.-detailUV);
      float blend=smoothstep(0.,.035,min(edge.x,edge.y));
      surface=mix(surface,texture2D(detailMap,detailUV).rgb,blend);
     }
     float day=smoothstep(-.12,.35,dot(n,sun));
     float diffuse=max(dot(n,sun),0.);
     color=surface*(.055+.85*diffuse);
     float glint=pow(max(dot(reflect(-sun,n),-ray),0.),90.);
     float ocean=1.-smoothstep(.015,.09,surface.r);
     color+=vec3(.35,.39,.38)*glint*ocean;
     float grazing=pow(1.-max(dot(n,-ray),0.),4.);
     color=mix(color,vec3(.12,.32,.62)*(.12+.88*day),grazing*.7);
    }else{
     // Thin atmosphere outside the solid limb, with no rectangular image boundary.
     float miss=sqrt(max(dot(centre,centre)-b*b,0.))-radius;
     if(b>0.)color+=vec3(.08,.25,.58)*exp(-max(miss,0.)/.65)*.65;
     float star=hash(floor(ray*1800.));
     if(star>.99965)color+=vec3(.45,.52,.64)*pow((star-.99965)/.00035,5.);
     // Sun at infinity, sharing the spacecraft light direction. Approx. 0.53° diameter.
     // Integrated into this background pass: no sprite, texture or bloom render pass.
     float alignment=dot(ray,sun);
     if(alignment>.995){
      float angle=length(cross(ray,sun));
      float core=exp(-angle*angle/.000012);
      float halo=exp(-angle*angle/.00016);
      color+=vec3(1.,.86,.64)*(core*2.+halo*.28);
     }
    }
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`
 });
 const sky=new THREE.Mesh(new THREE.SphereGeometry(800,32,20),material);
 sky.frustumCulled=false;sky.renderOrder=-1000;
 sky.onBeforeRender=(_r,_s,camera)=>{sky.position.copy(camera.position);sky.updateMatrixWorld(true);};
 scene.add(sky);
 new THREE.TextureLoader().load('./assets/textures/earth-2k.webp',texture=>{
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.RepeatWrapping;texture.anisotropy=maxAnisotropy;
  material.uniforms.earthMap.value=texture;ready();
 },undefined,error=>{console.warn('Earth texture unavailable; using ocean fallback',error);ready();});
 new THREE.TextureLoader().load(mobile?'./assets/textures/med-mobile.webp':'./assets/textures/med-detail.webp',texture=>{
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=maxAnisotropy;
  material.uniforms.detailMap.value=texture;material.uniforms.detailReady.value=1;
 },undefined,()=>{});
 return sky;
}
