import './main.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { DragControls } from 'three/addons/controls/DragControls';
import { matrix, zeros } from "mathjs";
import { construct_mask, coons } from './coons';
import { GUI } from 'dat.gui'



// init
const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 20); // increased far plane
camera.position.z = 2;
camera.position.y = 2;
camera.lookAt(0,0,0);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 5, 20); // add fog starting at 1 unit and ending at 15 units

// Add lighting
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(0, 1, 1);
scene.add(dirLight);
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

function createControlPoints(m: number, n: number, top_left: THREE.Vector3, top_right: THREE.Vector3, bottom_left: THREE.Vector3, bottom_right: THREE.Vector3) {
  const geometry = new THREE.SphereGeometry(0.02);
  const material = new THREE.MeshBasicMaterial({ color: 0xff00ffff });
  
  const controlPoints = {
    m, n,
    top: [] as THREE.Mesh[],
    right: [] as THREE.Mesh[],
    bottom: [] as THREE.Mesh[],
    left: [] as THREE.Mesh[]
  };
  for(let j=0; j<n-1; j++) {
    let s = new THREE.Mesh(geometry, material)
    s.position.copy(new THREE.Vector3().lerpVectors(top_left, top_right, j/(n-1)))
    controlPoints.top.push(s);
    let t = new THREE.Mesh(geometry, material)
    t.position.copy(new THREE.Vector3().lerpVectors(bottom_right, bottom_left, j/(n-1)))
    controlPoints.bottom.push(t);
  }
  for(let i=0; i<m-1; i++) {
    let s = new THREE.Mesh(geometry, material)
    s.position.copy(new THREE.Vector3().lerpVectors(bottom_left, top_left, i/(m-1)))
    controlPoints.left.push(s);
    let t = new THREE.Mesh(geometry, material)
    t.position.copy(new THREE.Vector3().lerpVectors(top_right, bottom_right, i/(m-1)))
    controlPoints.right.push(t);
  }
  return controlPoints;
}

const controlPoints = createControlPoints(6, 6, new THREE.Vector3(-1,1,1), new THREE.Vector3(1,1,1), new THREE.Vector3(-1,1,-1), new THREE.Vector3(1,1,-1));
const spheres = controlPoints.top.concat(controlPoints.right).concat(controlPoints.bottom).concat(controlPoints.left);
spheres.forEach(s => scene.add(s));

// Add border lines
const borderLines = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffffff }));
scene.add(borderLines);

// Add coons mesh
const coonsMesh = new THREE.Mesh(
  new THREE.BufferGeometry(), 
  new THREE.MeshPhongMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    specular: 0xffffff,
    shininess: 10,
  })
)
const coonsWireframe = new THREE.Mesh(
  new THREE.BufferGeometry(),
  new THREE.MeshBasicMaterial({color: 0xff00ffff, wireframe: true})
)
scene.add(coonsWireframe)
scene.add(coonsMesh)

// Add grid floor
const gridSize = 10*5;
const gridDivisions = 100;
const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x404040, 0x404040);
scene.add(gridHelper);

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Add the GUI
const coonsParameters = {
  alpha: -0.25,
  beta: 0.5
}
const gui = new GUI();
const cubeFolder = gui.addFolder('Discrete Coons Patch');
cubeFolder.add(coonsParameters, 'alpha', -1, 1).name('Alpha');
// cubeFolder.add(coonsParameters, 'beta', -1, 1).name('Beta');
cubeFolder.open();

const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.PAN
};
controls.enableDamping = false;

// Add control point drag controls
const dragControls = new DragControls(spheres, camera, renderer.domElement);
dragControls.addEventListener('dragstart', () => controls.enabled = false);
dragControls.addEventListener('dragend', () => controls.enabled = true);


// animation
function animate( time: number ) {
  controls.update();
  
  // Update control border lines
  borderLines.geometry.setFromPoints(spheres.map(s => s.position).concat(spheres[0].position));

  // Compute discrete coons patch
  const {m, n, top, right, bottom, left} = controlPoints;
  let points_x = zeros([m, n]) as number[][]
  let points_y = zeros([m, n]) as number[][]
  let points_z = zeros([m, n]) as number[][]

  for(let j=0; j<m-1; j++){
    points_x[0][j] = top[j].position.x
    points_y[0][j] = top[j].position.y
    points_z[0][j] = top[j].position.z

    points_x[m-1][m-j-1] = bottom[j].position.x
    points_y[m-1][m-j-1] = bottom[j].position.y
    points_z[m-1][m-j-1] = bottom[j].position.z
  }
  for(let i=0; i<n-1; i++){
    points_x[i][n-1] = right[i].position.x
    points_y[i][n-1] = right[i].position.y
    points_z[i][n-1] = right[i].position.z

    points_x[n-i-1][0] = left[i].position.x
    points_y[n-i-1][0] = left[i].position.y
    points_z[n-i-1][0] = left[i].position.z
  }

  let mx = matrix(points_x)
  let my = matrix(points_y)
  let mz = matrix(points_z)

  const mask = construct_mask(coonsParameters.alpha, 0.25 - coonsParameters.alpha)
  coons(mx, mask)
  coons(my, mask)
  coons(mz, mask)

  // Create geometry from computed points
  const geometry = new THREE.BufferGeometry();
  
  // Create vertices array from points matrices
  const vertices = [];
  for(let i = 0; i < m; i++) {
    for(let j = 0; j < n; j++) {
      vertices.push(mx.get([i,j]), my.get([i,j]), mz.get([i,j]))
    }
  }
  
  // Create faces (triangles)
  const indices = [];
  for(let i = 0; i < m-1; i++) {
    for(let j = 0; j < n-1; j++) {
      const v0 = i*n + j;
      const v1 = i*n + j+1;
      const v2 = (i+1)*n + j;
      const v3 = (i+1)*n + j+1;
      
      indices.push(v0, v1, v2); // First triangle
      indices.push(v1, v3, v2); // Second triangle
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  coonsWireframe.geometry = geometry;
  coonsMesh.geometry = geometry;

  renderer.render(scene, camera);
}

function resize() {  
  camera.aspect = window.innerWidth / window.innerHeight;
  window.addEventListener('resize', resize);
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

window.addEventListener('resize', resize);

resize();