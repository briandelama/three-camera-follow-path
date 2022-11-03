import * as THREE from "three";
import Stats from "stats.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { BezierCurve } from "./curves";

import model from "../model/skinned-character.glb";
import animation from "../model/animation.glb";

gsap.registerPlugin(ScrollTrigger);

const stats = new Stats();
stats.showPanel(1); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export class Canvas {
  constructor(canvas) {
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({
      canvas,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setClearColor(0x000000);

    this.curve = new THREE.CatmullRomCurve3(BezierCurve());
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(this.ambientLight);

    this.spotLight = new THREE.SpotLight(0xffffff, 17, 80, Math.PI * 0.25, 0.2, 3);

    this.spotLight.position.set(0, 30, 0);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.camera.near = 0.5;
    this.spotLight.shadow.camera.far = 40;

    this.scene.add(this.spotLight);

    const near = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, near, 0.1, 10000);

    this.clock = new THREE.Clock();

    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    this.init();
    this.progress = 0;

    this.scrollTrigger = ScrollTrigger.create({
      trigger: "#container",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      markers: true,
      onUpdate: (v) => {
        this.progress = v.progress;
      },
    });
  }

  init = () => {
    this.createFloor();
    this.animate();
    this.handleResize();

    this.gltfLoader.load(model, (gltf) => {
      this.handleGltf(gltf);
    });

    this.gltfLoader.load(animation, (gltf) => {
      this.clip = gltf.animations[0];
    });
  };

  setCameraPosition = () => {
    const percentage = this.progress;

    if (percentage) {
      const position = this.curve.getPointAt(percentage);

      return position;
    }
  };

  setPointInModel = (rangeX, rangeY, rangeZ) => {
    if (!this.boundingBoxFinal) {
      return;
    }

    const minArray = [];
    const maxArray = [];

    this.boundingBoxFinal.min.toArray(minArray);
    this.boundingBoxFinal.max.toArray(maxArray);

    const xOut = THREE.MathUtils.lerp(minArray[0], maxArray[0], rangeX);
    const yOut = THREE.MathUtils.lerp(minArray[1], maxArray[1], rangeY);
    const zOut = THREE.MathUtils.lerp(minArray[2], maxArray[2], rangeZ);

    const output = new THREE.Vector3(xOut, yOut, zOut);
    return output;
  };

  handleGltf = (gltf) => {
    this.model = gltf.scene;

    const mesh = this.model.children[0].children[1];
    mesh.material = new THREE.MeshPhongMaterial({ color: 0x042351 });
    this.mixer = new THREE.AnimationMixer(this.model);

    if (this.clip) {
      this.action = this.mixer.clipAction(this.clip);

      this.action.play();
    }

    window.scrollTo(0, 10);

    this.boundingBox = new THREE.Box3().setFromObject(this.model);
    let boxCenter = this.boundingBox.getCenter(new THREE.Vector3());
    this.model.position.x += this.model.position.x - boxCenter.x;
    this.model.position.y += this.model.position.y - boxCenter.y;
    this.model.position.z += this.model.position.z - boxCenter.z;
    this.boundingBoxFinal = this.boundingBox.setFromObject(this.model);

    const helper = new THREE.Box3Helper(this.boundingBoxFinal, 0xff0000);
    this.scene.add(helper);

    this.scene.add(this.model);
  };

  handleResize = () => {
    window.addEventListener("resize", () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;

      this.camera.aspect = sizes.width / sizes.height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(sizes.width, sizes.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  };

  createFloor = () => {
    const material = new THREE.MeshStandardMaterial({
      color: 0x000000,
    });

    const geometry = new THREE.CircleGeometry(50, 50);
    const plane = new THREE.Mesh(geometry, material);

    this.scene.add(plane);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -15.5;
    plane.receiveShadow = true;
  };

  animate = () => {
    stats.begin();

    if (!this.curve) {
      return;
    }

    const delta = this.clock.getDelta();

    if (this.mixer) {
      this.mixer.update(delta);
    }

    const pos = this.setCameraPosition();
    const lookAt = this.setPointInModel(0.5, 1.0, 0.5);
    if (pos) {
      this.camera.position.copy(pos);
    }

    if (this.model && lookAt) {
      this.camera.lookAt(lookAt);
    }

    this.renderer.render(this.scene, this.camera);
    stats.end();

    requestAnimationFrame(() => this.animate());
  };
}
