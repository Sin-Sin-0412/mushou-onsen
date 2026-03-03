import * as THREE from "three";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FilmPass } from "three/addons/postprocessing/FilmPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { AfterimagePass } from "three/addons/postprocessing/AfterimagePass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { ColorCorrectionShader } from "three/addons/shaders/ColorCorrectionShader.js";
import { HueSaturationShader } from "three/addons/shaders/HueSaturationShader.js";
import { initWorld, updateWorld, camera, scene } from "./world.js";

let renderer, composer;
export let colorCorrectionPass;
let clock;
const isMobile = window.innerWidth <= 768;
let bokehPass;

function init() {
  const canvas = document.querySelector("#canvas");

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    stencil: false,
    depth: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  clock = new THREE.Clock();

  initWorld(renderer.domElement);

  composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const hueSaturationPass = new ShaderPass(HueSaturationShader);
  hueSaturationPass.uniforms.saturation.value = -0.1;
  composer.addPass(hueSaturationPass);

  colorCorrectionPass = new ShaderPass(ColorCorrectionShader);

  colorCorrectionPass.uniforms.powRGB.value.set(1.6, 1.6, 1.6);

  colorCorrectionPass.uniforms.mulRGB.value.set(1, 1, 1);

  colorCorrectionPass.uniforms.addRGB.value.set(0.003, 0.05, 0.0);

  composer.addPass(colorCorrectionPass);

  const afterimagePass = new AfterimagePass();
  afterimagePass.damp = 0.5;
  composer.addPass(afterimagePass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.35, //* しきいち
    0.1, //* 強度
    0.85, //* 半径
  );
  composer.addPass(bloomPass);

  if (!isMobile) {
    bokehPass = new BokehPass(scene, camera, {
      focus: 5,
      aperture: 0.0005,
      maxblur: 0.009,
    });
    composer.addPass(bokehPass);
  }

  if (bokehPass) {
    const dof = 1.5 + Math.random() * 10;

    gsap.to(bokehPass.uniforms["focus"], {
      value: 2,
      duration: dof,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  const filmPass = new FilmPass(
    1.2, //* ノイズ強度
    false,
  );
  composer.addPass(filmPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);
  window.addEventListener("resize", onWindowResize);
  adjustCamera(window.innerWidth, window.innerHeight);
  onWindowResize();
  animate();
}

function adjustCamera(width, height) {
  const aspect = width / height;
  camera.aspect = aspect;

  const config = {
    mobile: {
      fov: 57,
      x: 10,
      y: 2.1,
      z: 6.25,
    },

    desktop: {
      fov: 55,
      x: 7,
      y: 2.1,
      z: 6.25,
    },

    ultrawide: {
      fov: 50,
      x: 7,
      y: 2.1,
      z: 6.25,
    },
  };

  const minAspect = 1.77;
  const maxAspect = 2.5;

  let targetFov, targetX, targetY, targetZ;
  let targetLookX, targetLookY, targetLookZ;

  if (aspect < 1) {
    targetFov = config.mobile.fov;
    targetX = config.mobile.x;
    targetY = config.mobile.y;
    targetZ = config.mobile.z;
  } else if (aspect <= minAspect) {
    targetFov = config.desktop.fov;
    targetX = config.desktop.x;
    targetY = config.desktop.y;
    targetZ = config.desktop.z;
  } else if (aspect >= maxAspect) {
    targetFov = config.ultrawide.fov;
    targetX = config.ultrawide.x;
    targetY = config.ultrawide.y;
    targetZ = config.ultrawide.z;
  } else {
    const t = (aspect - minAspect) / (maxAspect - minAspect);

    const lerp = (start, end, t) => start + (end - start) * t;

    targetFov = lerp(config.desktop.fov, config.ultrawide.fov, t);
    targetX = lerp(config.desktop.x, config.ultrawide.x, t);
    targetY = lerp(config.desktop.y, config.ultrawide.y, t);
    targetZ = lerp(config.desktop.z, config.ultrawide.z, t);
  }

  if (aspect > 2.5) {
    const vFovRad = (config.ultrawide.fov * Math.PI) / 180;
    const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * maxAspect);

    targetFov = (2 * Math.atan(Math.tan(hFovRad / 2) / aspect) * 180) / Math.PI;

    targetX = config.ultrawide.x;
    targetY = config.ultrawide.y;
    targetZ = config.ultrawide.z;
  }

  camera.fov = targetFov;
  camera.position.set(targetX, targetY, targetZ);

  camera.updateProjectionMatrix();
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  adjustCamera(width, height);
  renderer.setSize(window.innerWidth, window.innerHeight);

  composer.setSize(window.innerWidth * 0.7, window.innerHeight * 0.7);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  updateWorld(delta);

  composer.render();
}

init();
