import * as THREE from "three";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { colorCorrectionPass } from "./main.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import { loadingFinished } from "./animation.js";


export let scene, camera;
let dirLight;
let mixer;
let steamGroup;
const lightBasePos = { x: -16.4, y: 35.58, z: 18.52 };

export function initWorld(canvas) {
  scene = new THREE.Scene();

  scene.fog = new THREE.FogExp2(0xdcfce7, 0.0065);

  camera = new THREE.PerspectiveCamera(
    
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(7, 2.1, 6.25);
  camera.lookAt(-3, 4.5, -7.3);

  
  gsap.to(camera.position, {
    y: "+=0.03",
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });


  const ambientLight = new THREE.AmbientLight(0xfff0e0, 0.48);
  scene.add(ambientLight);

  const ambient = 2 + Math.random() * 10;

  function animateLight() {
    gsap.to(ambientLight, {
      intensity: 0.55,
      duration: ambient,
      repeat: 1,
      yoyo: true,
      ease: "sine.inOut",
      onComplete: ()=>{
        const nextDelay = gsap.utils.random(10, 20);
        gsap.delayedCall(nextDelay, animateLight);
      }
    });
  }

  animateLight();


  const hemiLight = new THREE.HemisphereLight(0xdcfce7, 0xbbf7d0, 0.3);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xf0fff4, 8.4);
  dirLight.position.set(lightBasePos.x, lightBasePos.y, lightBasePos.z);
  dirLight.castShadow = true;
  dirLight.shadow.normalBias = 0.02;
  dirLight.shadow.bias = -0.0001;
  dirLight.shadow.radius = 1.5;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.top = 10;
  dirLight.shadow.camera.bottom = -10;
  dirLight.shadow.camera.left = -10;
  dirLight.shadow.camera.right = 10;

  scene.add(dirLight);

  const textureLoader = new THREE.TextureLoader();

  textureLoader.load("image/mountain2.jpg", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.environment = texture;

    const aspect = texture.image.height / texture.image.width;
    texture.colorSpace = THREE.SRGBColorSpace;
    const bgWidth = 240;
    const bgHeight = bgWidth * aspect;

    const bgGeometry = new THREE.PlaneGeometry(bgWidth, bgHeight);
    const bgMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      fog: true,
      color: new THREE.Color(1.2, 1.2, 1.2),
    });

    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.position.set(-45, bgHeight / 2 - 20, -70);
    bgMesh.rotation.y = Math.PI / 5;
    scene.add(bgMesh);
  });


  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
  );


  const dodaiNormal = textureLoader.load("image/Asphalt2.jpg");
  dodaiNormal.wrapS = dodaiNormal.wrapT = THREE.RepeatWrapping;
  dodaiNormal.repeat.set(25, 25);



  const manager = new THREE.LoadingManager();

  manager.onLoad = () => {
    loadingFinished(); 
  };

  const gltfLoader = new GLTFLoader(manager);
  gltfLoader.setDRACOLoader(dracoLoader);

  gltfLoader.load("model/summer00-v3.glb", (gltf) => {
    const model = gltf.scene;
    const scale = 0.5;
    model.scale.set(scale, scale, scale);
    model.position.set(0, 0, 0);
    model.rotation.y = -Math.PI;

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

      
        if (child.name.includes("armature")) {
          child.material = child.material.clone();
          child.material.flatShading = false; 
          child.material.roughness = 0.8;

          
          child.geometry = BufferGeometryUtils.mergeVertices(child.geometry);

          child.geometry.computeVertexNormals();

          child.material.needsUpdate = true;
        }


        if (child.name.includes("k_wall")) {
          child.material = child.material.clone();
          child.material.roughness = 1.0;
          child.material.metalness = 0.1;
        }

        if (child.name.includes("roof")) {
          child.material = child.material.clone();
          child.material.roughness = 0.9;
          child.material.metalness = 0.2;
        }

        if (child.name.includes("guard")) {
          child.material = child.material.clone();
          child.material.roughness = 0.7;
          child.material.metalness = 0.2;
        }

        if (child.name.includes("renga")) {
          child.material = child.material.clone();
          child.material.roughness = 0.7;
          child.material.metalness = 0.3;
        }

        if (child.name.includes("alumi")) {
          child.material = child.material.clone();
          child.material.roughness = 0.4;
          child.material.metalness = 0.6;
        }

        if (child.name.includes("a_door")) {
          child.material = child.material.clone();
          child.material.roughness = 0.3;
          child.material.metalness = 0.8;
        }

        if (child.name.includes("dodai")) {
          child.material = child.material.clone();
          child.material.roughness = 1;
          child.material.roughnessMap = dodaiNormal;
          child.material.normalMap = dodaiNormal;
          child.material.normalScale.set(0.2, 0.2);
        }

        if (child.name.includes("s_glass")) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.8;
          child.material.roughness = 0.05;
          child.material.metalness = 0.1;
        }

        if (child.name.includes("k_glass")) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.75;
          child.material.roughness = 0.8;
          child.material.metalness = 0.5;
        }
      }
    });

    scene.add(model);

    const ventMesh = model.getObjectByName("yuge");

    if (ventMesh) {
      const worldPos = new THREE.Vector3();
      ventMesh.getWorldPosition(worldPos);
      initVentSteam(scene, worldPos);
    }

    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);

      const animationNames = ["utiwa", "shide", "plant"];

      animationNames.forEach((name) => {
        const clip = THREE.AnimationClip.findByName(gltf.animations, name);
        if (clip) {
          const action = mixer.clipAction(clip);
          action.play();
        } else {
          console.warn(`Animation "${name}" not found`);
        }
      });
    }
  });
}


/**
 * 湯気の初期化
 * @param {THREE.Scene} scene
 * @param {THREE.Vector3} position 
 */

export function initVentSteam(scene, position) {
  const loader = new THREE.TextureLoader();
  const steamTexture = loader.load("image/circle.png");

  steamGroup = new THREE.Group();
  scene.add(steamGroup);

  const particleCount = 30;

  for (let i = 0; i < particleCount; i++) {
    createParticle(steamTexture, position, i * 0.1);
  }
}

function createParticle(texture, startPos, delay) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(material);

  sprite.position.set(startPos.x, startPos.y, startPos.z);
  sprite.scale.set(0.3, 0.3, 0.3);
  steamGroup.add(sprite);


  const lifeTime = 1.5 + Math.random() * 10; 
  const driftDistance = 1.0 + Math.random() * 1.0; 
  const jumpRight = 0.2 + Math.random() * 0.4; 

  const tl = gsap.timeline({
    repeat: -1,
    repeatDelay: Math.random() * 2.0,
    delay: delay,
  });

  tl.to(sprite.scale, {
    x: 2.8,
    y: 2.8,
    duration: 0.6,
    ease: "power1.out",
  });

  tl.to(
    material,
    {
      opacity: 0.1,
      duration: 0.4,
    },
    0,
  );

  tl.to(
    sprite.position,
    {
      x: startPos.x + jumpRight,
      y: startPos.y + 0.5,
      z: startPos.z + (Math.random() - 0.5) * 0.4,
      duration: 0.6,
      ease: "power1.out",
    },
    0,
  );

  tl.to(
    sprite.position,
    {
      x: startPos.x - driftDistance,
      y: startPos.y + 2.0,
      duration: lifeTime,
      ease: "power1.in",
    },
    0.6,
  );

  tl.to(
    sprite.scale,
    {
      x: 2.5,
      y: 2.5,
      duration: lifeTime,
    },
    0.6,
  );

  tl.to(
    material,
    {
      opacity: 0,
      duration: lifeTime * 0.7,
    },
    0.6 + lifeTime * 0.3,
  );

  tl.eventCallback("onRepeat", () => {
    sprite.position.set(startPos.x, startPos.y, startPos.z);
  });
}

export function updateWorld(delta) {
  if (mixer) {
    mixer.update(delta);
  }

  if(dirLight){
    const now = new Date();
    const timeRatio = (now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) / 24;
    const angle = timeRatio * Math.PI * 2;
    const range = 2.0;

    dirLight.position.x = lightBasePos.x + Math.cos(angle) * range;
    dirLight.position.z = lightBasePos.z + Math.sin(angle) * range;

    dirLight.position.y = lightBasePos.y;
  }
}
