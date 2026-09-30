import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Digits, Place } from '../game/logic';

type Props = {
  mode: 'forest' | 'blocks';
  counts?: Digits;
  onBlock?: (place: Place) => void;
  completed?: number;
};

const palette = {
  grass: '#a9c594',
  earth: '#dbbc8f',
  dark: '#345945',
  green: '#729c72',
  pale: '#cedaa8',
  cream: '#fff0cb',
  orange: '#db874b',
};

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      (Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((m) => materials.add(m));
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}

function material(color: string) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
}
function mesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  color: string,
  position: number[],
  scale?: number[],
) {
  const object = new THREE.Mesh(geometry, material(color));
  object.position.set(position[0], position[1], position[2]);
  if (scale) object.scale.set(scale[0], scale[1], scale[2]);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
function sphere(
  parent: THREE.Object3D,
  color: string,
  p: number[],
  s: number[],
) {
  return mesh(parent, new THREE.SphereGeometry(1, 24, 16), color, p, s);
}
function box(parent: THREE.Object3D, color: string, p: number[], s: number[]) {
  return mesh(parent, new THREE.BoxGeometry(1, 1, 1), color, p, s);
}
function cylinder(
  parent: THREE.Object3D,
  color: string,
  p: number[],
  top: number,
  bottom: number,
  height: number,
) {
  return mesh(
    parent,
    new THREE.CylinderGeometry(top, bottom, height, 48),
    color,
    p,
  );
}

function tree(
  parent: THREE.Object3D,
  x: number,
  z: number,
  size = 1,
  pine = false,
) {
  const group = new THREE.Group();
  group.position.set(x, 0.03, z);
  group.scale.setScalar(size);
  parent.add(group);
  cylinder(group, '#957052', [0, 0.65, 0], 0.13, 0.2, 1.3);
  if (pine) {
    for (let i = 0; i < 3; i++)
      mesh(
        group,
        new THREE.ConeGeometry(1.05 - i * 0.2, 1.6, 32),
        [palette.dark, palette.green, '#91b581'][i],
        [0, 1.5 + i * 0.6, 0],
      );
  } else {
    sphere(group, palette.green, [0, 1.85, 0], [0.9, 1.2, 0.8]);
    sphere(group, '#86aa7b', [-0.47, 1.65, 0.24], [0.65, 0.8, 0.67]);
    sphere(group, '#a2bf89', [0.33, 2.15, 0.1], [0.64, 0.85, 0.64]);
  }
}

function flower(
  parent: THREE.Object3D,
  x: number,
  z: number,
  color = '#fff0ca',
) {
  cylinder(parent, palette.dark, [x, 0.18, z], 0.018, 0.018, 0.36);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    sphere(
      parent,
      color,
      [x + Math.cos(angle) * 0.09, 0.35, z + Math.sin(angle) * 0.09],
      [0.075, 0.04, 0.075],
    );
  }
  sphere(parent, '#e9b65c', [x, 0.38, z], [0.045, 0.035, 0.045]);
}

function fox(parent: THREE.Object3D, x: number, z: number) {
  const group = new THREE.Group();
  group.position.set(x, 0.12, z);
  group.rotation.y = 0.16;
  parent.add(group);
  const orange = '#de8849';
  sphere(group, orange, [0, 0.63, 0], [0.46, 0.6, 0.36]);
  sphere(group, '#fff2d5', [0, 0.62, 0.28], [0.29, 0.4, 0.12]);
  sphere(group, orange, [0, 1.35, 0], [0.64, 0.53, 0.46]);
  for (const sign of [-1, 1]) {
    const ear = mesh(group, new THREE.ConeGeometry(0.26, 0.67, 3), orange, [
      sign * 0.39,
      1.88,
      -0.02,
    ]);
    ear.rotation.z = -sign * 0.17;
    mesh(group, new THREE.ConeGeometry(0.13, 0.4, 3), '#6e4e39', [
      sign * 0.39,
      1.92,
      0.115,
    ]);
    sphere(group, '#fff2d5', [sign * 0.26, 1.19, 0.34], [0.33, 0.24, 0.2]);
    sphere(group, '#353d34', [sign * 0.25, 1.43, 0.41], [0.045, 0.067, 0.04]);
    sphere(group, '#e5a17b', [sign * 0.39, 1.24, 0.49], [0.09, 0.045, 0.024]);
    sphere(group, '#684837', [sign * 0.23, 0.15, 0.16], [0.19, 0.14, 0.23]);
  }
  sphere(group, '#353d34', [0, 1.2, 0.55], [0.075, 0.055, 0.055]);
  const tail = sphere(group, orange, [0.64, 0.6, -0.12], [0.25, 0.65, 0.25]);
  tail.rotation.z = -0.85;
  sphere(group, '#fff2d5', [0.98, 0.94, -0.12], [0.2, 0.21, 0.2]);
  box(group, '#8daa83', [0, 0.96, 0.25], [0.66, 0.15, 0.4]);
  const scarf = box(group, '#8daa83', [0.22, 0.79, 0.38], [0.16, 0.36, 0.08]);
  scarf.rotation.z = -0.15;
  return group;
}

function makeForest(parent: THREE.Object3D, completed: number) {
  cylinder(parent, palette.earth, [0, -0.72, 0], 5.95, 5.25, 1.3);
  cylinder(parent, '#e8d4ae', [0, -0.14, 0], 6, 5.95, 0.27);
  cylinder(parent, palette.grass, [0, 0.02, 0], 5.95, 5.95, 0.1);
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.5, -0.32, 5.65),
    new THREE.Vector3(1.2, -0.32, 3.8),
    new THREE.Vector3(-0.6, -0.32, 2.6),
    new THREE.Vector3(-1.8, -0.32, 1),
    new THREE.Vector3(-1, -0.32, -0.6),
    new THREE.Vector3(0.1, -0.32, -1.5),
  ]);
  mesh(
    parent,
    new THREE.TubeGeometry(path, 50, 0.52, 12, false),
    '#f3dfb9',
    [0, 0, 0],
  );
  const pond = cylinder(parent, '#83b7ae', [3.2, 0.07, 1], 1.2, 1.2, 0.07);
  pond.scale.set(1, 1, 1.6);
  for (let i = 0; i < 5; i++)
    sphere(
      parent,
      '#d5d1b0',
      [3.2 + Math.cos(i * 1.3) * 1.2, 0.15, 1 + Math.sin(i * 1.3) * 1.8],
      [0.24, 0.18, 0.22],
    );
  const house = new THREE.Group();
  house.position.set(0.1, 0.08, -1.8);
  parent.add(house);
  box(house, '#f9e9c8', [0, 1, 0], [2.3, 2, 1.9]);
  const roof = mesh(
    house,
    new THREE.ConeGeometry(2, 1.65, 4),
    '#b96e45',
    [0, 2.65, 0],
    [1, 1, 0.9],
  );
  roof.rotation.y = Math.PI / 4;
  box(house, '#8b6850', [0.85, 2.7, -0.35], [0.32, 1, 0.35]);
  box(house, '#507662', [0, 0.6, 0.971], [0.62, 1.18, 0.08]);
  sphere(house, '#efc97f', [0.17, 0.62, 1.03], [0.055, 0.055, 0.055]);
  for (const side of [-1, 1]) {
    box(house, '#b38259', [side * 0.75, 1.13, 0.98], [0.53, 0.63, 0.1]);
    box(house, '#a8c7b3', [side * 0.75, 1.13, 1.04], [0.41, 0.5, 0.03]);
    box(house, '#fff0cb', [side * 0.75, 1.13, 1.07], [0.04, 0.5, 0.03]);
    box(house, '#fff0cb', [side * 0.75, 1.13, 1.07], [0.41, 0.04, 0.03]);
  }
  cylinder(house, '#e3c49b', [0, 0.08, 1.25], 0.62, 0.7, 0.12);
  tree(parent, -3.3, -2.5, 1.1, true);
  tree(parent, -4.4, -0.6, 0.95);
  tree(parent, 2.7, -3.3, 1.15, true);
  tree(parent, 4.4, -1.2, 0.83);
  tree(parent, -2.8, 3.1, 0.64);
  tree(parent, -1.5, -4.4, 0.7);
  tree(parent, 1, -4.7, 0.72, true);
  for (let i = 0; i < 17 + completed * 4; i++) {
    const angle = i * 2.4;
    const radius = 2.8 + (i % 4) * 0.55;
    flower(
      parent,
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      ['#fff2ce', '#e9ae88', '#e8d8b3'][i % 3],
    );
  }
  for (const [x, z, s] of [
    [-3, 0.7, 0.65],
    [-3.5, 1, 0.4],
    [1.7, 3.1, 0.38],
  ]) {
    cylinder(parent, '#faeacb', [x, s * 0.3, z], s * 0.13, s * 0.17, s * 0.6);
    sphere(parent, '#c67954', [x, s * 0.64, z], [s * 0.5, s * 0.28, s * 0.5]);
    sphere(
      parent,
      '#f6ddb9',
      [x + s * 0.18, s * 0.86, z],
      [s * 0.08, s * 0.045, s * 0.08],
    );
  }
  for (let i = 0; i < 5; i++) {
    box(parent, '#ecdcbb', [-3.8 + i * 0.47, 0.43, -3.2], [0.11, 0.8, 0.13]);
  }
  box(parent, '#ecdcbb', [-2.85, 0.57, -3.2], [2.15, 0.1, 0.13]);
  const character = fox(parent, -0.7, 2.3);
  const basket = cylinder(
    parent,
    '#b68a57',
    [0.55, 0.32, 2.6],
    0.33,
    0.28,
    0.5,
  );
  basket.rotation.z = -0.07;
  for (let i = 0; i < 3; i++)
    sphere(parent, '#76583e', [0.4 + i * 0.15, 0.64, 2.6], [0.13, 0.17, 0.12]);
  return character;
}

function makeBlocks(parent: THREE.Object3D, counts: Digits) {
  const group = new THREE.Group();
  parent.add(group);
  const colors = ['#dfaf5e', '#81ad9c', '#8dadd0'];
  const unitGeometry = new THREE.BoxGeometry(0.178, 0.178, 0.178);
  const dummy = new THREE.Object3D();
  for (const place of [0, 1, 2] as Place[]) {
    const x = (1 - place) * 3.6;
    const count = counts[place];
    const cells = [1, 10, 100][place];
    if (count === 0) continue;
    const blocks = new THREE.InstancedMesh(
      unitGeometry,
      material(colors[place]),
      count * cells,
    );
    blocks.castShadow = true;
    blocks.receiveShadow = true;
    blocks.userData.place = place;
    for (let n = 0; n < count; n++) {
      for (let cell = 0; cell < cells; cell++) {
        if (place === 2)
          dummy.position.set(
            x - 0.855 + (cell % 10) * 0.19,
            0.44 + n * 0.22,
            -0.855 + Math.floor(cell / 10) * 0.19,
          );
        else if (place === 1)
          dummy.position.set(
            x - 0.92 + (n % 9) * 0.23,
            0.44 + Math.floor(n / 9) * 0.25,
            -0.855 + cell * 0.19,
          );
        else
          dummy.position.set(
            x - 0.65 + (n % 5) * 0.33,
            0.44,
            -0.62 + Math.floor(n / 5) * 0.37,
          );
        dummy.updateMatrix();
        blocks.setMatrixAt(n * cells + cell, dummy.matrix);
      }
    }
    blocks.instanceMatrix.needsUpdate = true;
    group.add(blocks);
  }
  // Empty inventories still release the shared geometry.
  if (group.children.length === 0) unitGeometry.dispose();
  return group;
}

export default function ForestScene({
  mode,
  counts = [5, 6, 3],
  onBlock,
  completed = 0,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    group: THREE.Group;
    render: () => void;
  } | null>(null);
  const action = useRef(onBlock);
  const currentCounts = useRef(counts);
  const [failed, setFailed] = useState(false);
  action.current = onBlock;
  currentCounts.current = counts;

  useEffect(() => {
    const container = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    setFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor('#edf2df', 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-9, 9, 7, -7, 0.1, 100);
    camera.position.set(
      ...((mode === 'forest' ? [12, 10, 15] : [2.8, 9, 14]) as [
        number,
        number,
        number,
      ]),
    );
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, mode === 'forest' ? 0.4 : 0.25, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.4;
    controls.maxPolarAngle = 1.25;
    controls.minAzimuthAngle = -0.6;
    controls.maxAzimuthAngle = 0.85;
    controls.update();
    scene.add(new THREE.HemisphereLight('#fff9eb', '#8d9f85', 2.8));
    const sun = new THREE.DirectionalLight('#fff4d8', 4);
    sun.position.set(-5, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.normalBias = 0.035;
    scene.add(sun);
    let blockGroup = new THREE.Group();
    if (mode === 'forest') makeForest(scene, completed);
    else {
      for (let i = 0; i < 3; i++) {
        const x = (1 - i) * 3.6;
        const tray = box(
          scene,
          ['#f1e1bf', '#d4e5d4', '#dce5e9'][i],
          [x, 0.17, 0],
          [3.23, 0.28, 3.1],
        );
        tray.userData.place = i;
        box(scene, '#e9d8b7', [x, -0.02, 0], [3.08, 0.15, 2.98]);
      }
      blockGroup = makeBlocks(scene, currentCounts.current);
    }
    const render = () => renderer.render(scene, camera);
    sceneRef.current = { scene, group: blockGroup, render };
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      const aspect = width / height;
      const halfWidth = mode === 'forest' ? Math.max(7.9, 6 * aspect) : 6.4;
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfWidth / aspect;
      camera.bottom = -halfWidth / aspect;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    controls.addEventListener('change', render);
    resize();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down = [0, 0];
    function pointerDown(event: PointerEvent) {
      down = [event.clientX, event.clientY];
    }
    function pointerUp(event: PointerEvent) {
      if (
        mode !== 'blocks' ||
        Math.hypot(event.clientX - down[0], event.clientY - down[1]) > 6
      )
        return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster
        .intersectObjects(scene.children, true)
        .find((item) => item.object.userData.place !== undefined);
      if (hit) action.current?.(hit.object.userData.place as Place);
    }
    function contextLost(event: Event) {
      event.preventDefault();
      setFailed(true);
    }
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    return () => {
      observer.disconnect();
      controls.removeEventListener('change', render);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      disposeObject(scene);
      sun.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      sceneRef.current = null;
    };
  }, [mode, completed]);

  useEffect(() => {
    if (mode !== 'blocks' || !sceneRef.current) return;
    const state = sceneRef.current;
    state.scene.remove(state.group);
    disposeObject(state.group);
    state.group = makeBlocks(state.scene, counts);
    state.render();
  }, [mode, counts]);

  return (
    <div className={`three-scene ${mode}`} ref={host}>
      {failed && (
        <div className="scene-fallback">
          <span>森林正在休息</span>
          <p>這台裝置暫時無法顯示 3D。下方的數量和按鈕一樣可以動手學習喔。</p>
        </div>
      )}
    </div>
  );
}
