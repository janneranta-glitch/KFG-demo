window.init3DPreview = function(){
  const s = document.getElementById('preview3d-section');
  s.innerHTML = `<button id="show-3d">Näytä 3D-esikatselu</button><canvas id="preview3d-canvas" width="600" height="300"></canvas>`;
  document.getElementById("show-3d").onclick=function(){
    let canvas=document.getElementById("preview3d-canvas");
    let renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.setClearColor(0xe6e9ef);
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(45, 600/300, 0.1, 1000);
    camera.position.set(2,1.2,5);
    let ambientLight = new THREE.AmbientLight(0xffffff,1.2); scene.add(ambientLight);

    let height=1.0, width=2.4, numPinnat=Math.round(width/0.13);
    const lattaGeo=new THREE.BoxGeometry(width,0.04,0.006);
    const lattaMat=new THREE.MeshStandardMaterial({color:0x333333});
    let ylatanko=new THREE.Mesh(lattaGeo, lattaMat); ylatanko.position.set(0,height,0); scene.add(ylatanko);
    let alatanko=new THREE.Mesh(lattaGeo, lattaMat); alatanko.position.set(0,0,0); scene.add(alatanko);
    const pinnaGeo=new THREE.CylinderGeometry(0.012,0.012,height,16);
    for(let i=0;i<numPinnat;i++) {
      let x=-width/2+0.06+i*0.13;
      let pinna=new THREE.Mesh(pinnaGeo, lattaMat);
      pinna.position.set(x,height/2,0); scene.add(pinna);
    }
    renderer.render(scene,camera);
  }
};
