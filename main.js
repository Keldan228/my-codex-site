const container = document.getElementById('canvas-container');
const tooltip = document.getElementById('tooltip');
const button = document.getElementById('toggle-markers');
let showMarkers = true;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Add lights
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(5, 3, 5);
scene.add(pointLight);

// Controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// Moon
const RADIUS = 5;
const textureLoader = new THREE.TextureLoader();
// NASA surface texture
const texture = textureLoader.load('https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/moonmap1k.jpg');
const geometry = new THREE.SphereGeometry(RADIUS, 64, 64);
const material = new THREE.MeshStandardMaterial({ map: texture });
const moon = new THREE.Mesh(geometry, material);
scene.add(moon);

camera.position.set(0, 0, 10);
controls.update();

// Marker data
const spots = [
  { name: 'Apollo 11', year: 1969, fact: 'Первая высадка людей на Луне', lat: 0.67416, lon: 23.47297, link: 'apollo-11.html' },
  { name: 'Apollo 12', year: 1969, fact: 'Вторая высадка людей', lat: -3.01239, lon: -23.42157, link: 'apollo-12.html' },
  { name: 'Apollo 17', year: 1972, fact: 'Последняя миссия Apollo', lat: 20.1908, lon: 30.7717, link: 'apollo-17.html' },
  { name: 'Luna 2', year: 1959, fact: 'Первая ударная миссия СССР', lat: 29.1, lon: 0, link: 'luna-2.html' }
];

const markers = new THREE.Group();
spots.forEach(s => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const pos = latLonToVector3(s.lat, s.lon, RADIUS + 0.1);
  m.position.copy(pos);
  m.userData = s;
  markers.add(m);
});
scene.add(markers);

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Raycaster for interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hovered = null;

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(markers.children);
  if (hovered && (intersects.length === 0 || intersects[0].object !== hovered)) {
    hovered.material.color.set(0xffffff);
    hovered = null;
  }
  if (intersects.length > 0) {
    const d = intersects[0].object.userData;
    hovered = intersects[0].object;
    hovered.material.color.set(0xffff00);
    tooltip.textContent = `${d.name} (${d.year})\n${d.fact}`;
    tooltip.style.left = event.clientX + 'px';
    tooltip.style.top = event.clientY + 'px';
    tooltip.classList.remove('hidden');
  } else {
    tooltip.classList.add('hidden');
  }
}

function onClick(event) {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(markers.children);
  if (intersects.length > 0) {
    window.location.href = intersects[0].object.userData.link;
  }
}

renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('click', onClick);

button.addEventListener('click', () => {
  showMarkers = !showMarkers;
  markers.visible = showMarkers;
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
