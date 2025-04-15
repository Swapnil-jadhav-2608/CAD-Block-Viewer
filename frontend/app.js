// DOM Elements
const messageEl = document.getElementById('message');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const blockPropertiesEl = document.getElementById('blockProperties');

// Three.js variables
let scene, camera, renderer, controls;
let cadObjects = [];
let currentFileData = null;
const scaleFactor = 0.01; // Adjust this based on your DXF units

// Initialize Three.js scene
function initScene() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 50;

  // Renderer setupdocument.addEventListener('DOMContentLoaded', ()
  renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('cadCanvas'), 
    antialias: true,
    preserveDrawingBuffer: true // Allows for screenshot functionality
  });
  renderer.setSize(document.getElementById('canvasContainer').clientWidth, 600);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = true;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Add axes helper (visible reference)
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
  cadObjects.push(axesHelper);

  // Grid helper
  const gridHelper = new THREE.GridHelper(50, 50);
  scene.add(gridHelper);
  cadObjects.push(gridHelper);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Window resize handler
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  const container = document.getElementById('canvasContainer');
  const aspectRatio = container.clientWidth / container.clientHeight;
  camera.aspect = aspectRatio;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function onCanvasClick(event) {
  // 1. Get mouse coordinates
  const mouse = new THREE.Vector2();
  const canvasBounds = renderer.domElement.getBoundingClientRect();
  
  mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
  mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

  // 2. Setup raycaster
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  raycaster.params.Line.threshold = 0.5; // Easier line clicking

  // 3. Find all objects with blockName
  const intersectableObjects = [];
  scene.traverse(obj => {
    if (obj.userData?.blockName) intersectableObjects.push(obj);
  });

  // 4. Check intersections
  const intersects = raycaster.intersectObjects(intersectableObjects, true);
  console.log('Intersected objects:', intersects); // Debug

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    const blockName = clickedObject.userData.blockName;
    
    if (blockName && currentFileData?.blocks?.[blockName]) {
      // 5. Reset previous highlights
      scene.traverse(obj => {
        if (obj.userData?.isHighlighted) {
          obj.material.color.setHex(0x0000ff);
          obj.userData.isHighlighted = false;
        }
      });

      // 6. Highlight and show properties
      clickedObject.material.color.setHex(0xff0000);
      clickedObject.userData.isHighlighted = true;
      displayBlockProperties(currentFileData.blocks[blockName]);
    }
  } else {
    console.log('No block clicked'); // Debug
  }
}

// Display block properties
function displayBlockProperties(block) {
  let propertiesHTML = `<h4>${block.name}</h4>`;
  propertiesHTML += `<p><strong>Entities:</strong> ${block.entities.length}</p>`;
  
  if (block.position) {
    propertiesHTML += `<p><strong>Position:</strong> X: ${block.position.x.toFixed(2)}, Y: ${block.position.y.toFixed(2)}</p>`;
  }
  
  // Add entity details
  propertiesHTML += `<h5>Entity Types:</h5>`;
  propertiesHTML += `<ul>`;
  
  // Count entity types
  const typeCount = {};
  block.entities.forEach(entity => {
    typeCount[entity.type] = (typeCount[entity.type] || 0) + 1;
  });
  
  Object.entries(typeCount).forEach(([type, count]) => {
    propertiesHTML += `<li>${type}: ${count}</li>`;
  });
  
  propertiesHTML += `</ul>`;
  blockPropertiesEl.innerHTML = propertiesHTML;
}

// Show status message
function showMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className = type;
  if (type !== 'error') {
    setTimeout(() => messageEl.textContent = '', 5000);
  }
}

// Upload DXF file
async function uploadFile() {
  if (!fileInput.files[0]) {
    showMessage('Please choose a DXF file.', 'error');
    return;
  }

  const file = fileInput.files[0];
  if (!file.name.toLowerCase().endsWith('.dxf')) {
    showMessage('Please upload a DXF file.', 'error');
    return;
  }

  showMessage('Uploading and processing file...', 'info');
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to upload file');
    }

    showMessage('File uploaded successfully! Rendering...', 'success');
    
    // Get the parsed data
    const dataResponse = await fetch('/api/files/entities');
    currentFileData = await dataResponse.json();
    console.log('Parsed DXF data:', currentFileData);
    
    // Render the DXF content
    renderDXFContent(currentFileData);
    
  } catch (err) {
    console.error('Upload error:', err);
    showMessage(`Error: ${err.message}`, 'error');
  }
}

// In renderDXFContent function
function renderDXFContent(data) {
  console.log('Rendering data:', data); // Debug log

  // Clear previous objects
  cadObjects.forEach(obj => scene.remove(obj));
  cadObjects = [];

  // Show message if no blocks found
  if (Object.keys(data.blocks).length === 0) {
    showMessage('No blocks found in file. Showing entities only.', 'info');
    blockPropertiesEl.innerHTML = '<p>No block definitions found in this file</p>';
  }

  // Create a group for all CAD objects
  const cadGroup = new THREE.Group();
  cadGroup.userData.isCADContent = true;
  
  // Process entities
  if (data.entities?.length) {
    console.log(`Processing ${data.entities.length} entities`);
    data.entities.forEach(entity => {
      try {
        const geometry = createGeometryFromEntity(entity);
        if (geometry) {
          const material = new THREE.LineBasicMaterial({ 
            color: 0x333333,
            linewidth: 2
          });
          const mesh = new THREE.Line(geometry, material);
    
          // ✅ Attach metadata to userData
          mesh.userData = {
            entityType: entity.type,
            layer: entity.layer,
            color: entity.color,
            handle: entity.handle,
            isEntity: true
          };
    
          cadGroup.add(mesh);
        }
      } catch (e) {
        console.warn('Failed to process entity:', entity, e);
      }
    });    
  }

  // Process blocks
  if (data.blocks && Object.keys(data.blocks).length > 0) {
    console.log(`Processing ${Object.keys(data.blocks).length} blocks`);
    Object.values(data.blocks).forEach(block => {
      block.entities?.forEach(entity => {
        try {
          const geometry = createGeometryFromEntity(entity);
          if (geometry) {
            const material = new THREE.LineBasicMaterial({ 
              color: 0x0066cc,
              linewidth: 2
            });
            const mesh = new THREE.Line(geometry, material);
    
            // ✅ Attach metadata to userData
            mesh.userData = {
              entityType: entity.type,
              layer: entity.layer,
              color: entity.color,
              handle: entity.handle,
              blockName: block.name,
              isBlock: true
            };
    
            cadGroup.add(mesh);
          }
        } catch (e) {
          console.warn(`Failed to process entity in block ${block.name}:`, entity, e);
        }
      });
    });
    
  }

  if (cadGroup.children.length > 0) {
    scene.add(cadGroup);
    cadObjects.push(cadGroup);
    fitCameraToObject(cadGroup);
    console.log(`Successfully rendered ${cadGroup.children.length} objects`);
  } else {
    showMessage('No renderable content found in file', 'error');
    console.warn('No valid geometry was created from DXF data');
  }
}

// Helper to create Three.js geometry from DXF entity
function createGeometryFromEntity(entity) {
  if (!entity || !entity.type || !entity.properties) return null;

  try {
    switch (entity.type.toUpperCase()) {
      case 'LINE':
        if (!entity.properties.start || !entity.properties.end) return null;
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setFromPoints([
          new THREE.Vector3(
            (entity.properties.start.x || 0) * scaleFactor,
            (entity.properties.start.y || 0) * scaleFactor,
            0
          ),
          new THREE.Vector3(
            (entity.properties.end.x || 0) * scaleFactor,
            (entity.properties.end.y || 0) * scaleFactor,
            0
          )
        ]);
        return lineGeometry;
        
      case 'LWPOLYLINE':
        if (!entity.properties.vertices?.length) return null;
        const polyGeometry = new THREE.BufferGeometry();
        const points = entity.properties.vertices.map(v => 
          new THREE.Vector3(
            (v.x || 0) * scaleFactor,
            (v.y || 0) * scaleFactor,
            0
          )
        );
        if (entity.properties.closed && points.length > 0) {
          points.push(points[0].clone());
        }
        polyGeometry.setFromPoints(points);
        return polyGeometry;
        
      case 'CIRCLE':
        if (!entity.properties.center || entity.properties.radius == null) return null;
        const circleGeometry = new THREE.BufferGeometry();
        const circlePoints = [];
        const segments = 32;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          circlePoints.push(new THREE.Vector3(
            (entity.properties.center.x + Math.cos(angle) * entity.properties.radius) * scaleFactor,
            (entity.properties.center.y + Math.sin(angle) * entity.properties.radius) * scaleFactor,
            0
          ));
        }
        circleGeometry.setFromPoints(circlePoints);
        return circleGeometry;
        
      case 'ARC':
        if (!entity.properties.center || entity.properties.radius == null) return null;
        const arcGeometry = new THREE.BufferGeometry();
        const arcPoints = [];
        const startAngle = entity.properties.startAngle || 0;
        const endAngle = entity.properties.endAngle || Math.PI * 2;
        const arcSegments = Math.max(16, Math.floor((endAngle - startAngle) / (Math.PI / 16)));
        for (let i = 0; i <= arcSegments; i++) {
          const angle = startAngle + (i / arcSegments) * (endAngle - startAngle);
          arcPoints.push(new THREE.Vector3(
            (entity.properties.center.x + Math.cos(angle) * entity.properties.radius) * scaleFactor,
            (entity.properties.center.y + Math.sin(angle) * entity.properties.radius) * scaleFactor,
            0
          ));
        }
        arcGeometry.setFromPoints(arcPoints);
        return arcGeometry;

      case 'ELLIPSE':
          if (!entity.properties.center || !entity.properties.majorAxisEnd) return null;
          
          const ellipseGeometry = new THREE.BufferGeometry();
          const ellipsePoints = [];
          const ellipseSegments = 64;
        
          const ratio = entity.properties.axisRatio || 1;
          const startAng = (entity.properties.startAngle || 0) * Math.PI / 180;
          const endAng = (entity.properties.endAngle || 360) * Math.PI / 180;
        
          const major = entity.properties.majorAxisEnd;
          const radiusX = Math.sqrt(major.x * major.x + major.y * major.y);
          const radiusY = radiusX * ratio;
        
          for (let i = 0; i <= ellipseSegments; i++) {
            const angle = startAng + (i / ellipseSegments) * (endAng - startAng);
            ellipsePoints.push(new THREE.Vector3(
              (entity.properties.center.x + Math.cos(angle) * radiusX) * scaleFactor,
              (entity.properties.center.y + Math.sin(angle) * radiusY) * scaleFactor,
              0
            ));
          }
          ellipseGeometry.setFromPoints(ellipsePoints);
          return ellipseGeometry;        
        
      case 'SPLINE':
        if (!entity.properties.controlPoints?.length) return null;
        if (entity.properties.controlPoints.length < 2) return null;
        
        // Convert control points to Three.js vectors
        const controlPoints = entity.properties.controlPoints.map(p => 
          new THREE.Vector3(
            (p.x || 0) * scaleFactor,
            (p.y || 0) * scaleFactor,
            0
          )
        );
        
        // Create a smooth curve through the points
        const curve = new THREE.CatmullRomCurve3(
          controlPoints,
          entity.properties.closed || false
        );
        
        // Generate enough points for smooth rendering
        const splinePoints = curve.getPoints(controlPoints.length * 10);
        const splineGeometry = new THREE.BufferGeometry().setFromPoints(splinePoints);
        
        return splineGeometry;
        
      default:
        console.warn(`Unsupported entity type: ${entity.type}`);
        return null;
    }
  } catch (e) {
    console.error(`Error processing ${entity.type} entity:`, e);
    return null;
  }
}

// Auto-zoom to fit the content
function fitCameraToObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2)) * 1.5;

  camera.position.copy(center);
  camera.position.z += cameraZ;
  
  controls.target.copy(center);
  controls.update();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  try {
    initScene();
    uploadBtn.addEventListener('click', uploadFile);

    // ✅ ADDED: Make canvas clickable for selecting blocks
    document.getElementById('cadCanvas').addEventListener('click', onCanvasClick);

    console.log('Three.js initialized:', THREE.REVISION);
  } catch (e) {
    console.error('Initialization failed:', e);
    showMessage('Failed to initialize 3D viewer', 'error');
  }
});
