import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { ColourId } from "../data";
import { DEFAULT_VARIANT, materialHookFor, meshMaterialsFor, VARIANTS, type VariantName } from "./materials";
import {
  applyPose,
  buildRig,
  CLIP_JOINTS,
  groundFullBody,
  loadKinematics,
  setJawOpen,
  setJoint,
  SITTING_POSE,
} from "./rig";
import { createWireframeFx } from "./wireframe";

export type DuckPolicy = "aim" | "walk";

export type DuckHandle = {
  setVariant: (name: VariantName) => void;
  setPolicy: (name: DuckPolicy) => void;
  dispose: () => void;
};

function walkJoints(phase: number, joints: Record<string, number>) {
  const swing = Math.sin(phase);
  joints.left_hip_pitch = 0.3 * swing;
  joints.right_hip_pitch = 0.3 * swing;
  const leftLift = Math.max(0, Math.sin(phase + 0.9));
  const rightLift = Math.max(0, Math.sin(phase + Math.PI + 0.9));
  joints.left_knee = 0.35 * leftLift;
  joints.right_knee = -0.35 * rightLift;
  joints.left_ankle = -0.15 * Math.sin(phase + 0.9) * 0.7 - 0.045 * swing;
  joints.right_ankle = -0.15 * Math.sin(phase + Math.PI + 0.9) * 0.7 + 0.045 * swing;
  joints.left_hip_roll = 0.08 * swing;
  joints.right_hip_roll = -0.08 * swing;
  return joints;
}

const walkBob = (phase: number) => 0.004 * Math.sin(2 * phase);

type PoseFrame = {
  joints: Record<string, number>;
  pos: [number, number, number];
  yaw: number;
  roll: number;
};

function lerpAngle(from: number, to: number, t: number) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * t;
}

type MovesClip = {
  rate: number;
  stride: number;
  channels: string[];
  segments: Record<string, [number, number]>;
  frames: number[];
  data: Float32Array;
};

const COLOUR_VARIANT: Record<ColourId, VariantName> = {
  classic: "classic",
  charcoal: "charcoal",
  lavender: "purple",
  sky: "blue",
};

export function colourToVariant(id: ColourId): VariantName {
  return COLOUR_VARIANT[id] ?? DEFAULT_VARIANT;
}

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function lights(scene: THREE.Scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 1.25);
  key.position.set(2, 4, 2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.4);
  fill.position.set(-2, 2, 1.5);
  scene.add(fill);
  const warm = new THREE.DirectionalLight(0xffb366, 0.7);
  warm.position.set(0, 3, -2);
  scene.add(warm);
}

function makeRenderer(host: HTMLElement) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.style.opacity = "0";
  renderer.domElement.style.transition = "opacity 0.45s ease";
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envRT = pmrem.fromScene(room);
  room.dispose();
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.25;
  lights(scene);

  const resizeFns: Array<() => void> = [];
  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    for (const fn of resizeFns) fn();
  };
  const ro = new ResizeObserver(resize);

  return {
    scene,
    renderer,
    envRT,
    pmrem,
    ro,
    resize,
    onResize(fn: () => void) {
      resizeFns.push(fn);
    },
    mount() {
      host.appendChild(renderer.domElement);
      ro.observe(host);
      resize();
    },
  };
}

async function loadMovesClip(): Promise<MovesClip> {
  const res = await fetch("/microduck-3d/moves-clip.json?v=1", { cache: "force-cache" });
  if (!res.ok) throw new Error(`moves clip fetch ${res.status}`);
  const clip = (await res.json()) as MovesClip;
  const expected = ["trunk_z", "trunk_roll", "trunk_pitch", "trunk_yaw", ...CLIP_JOINTS];
  if (clip.stride !== 18 || clip.channels.join() !== expected.join()) {
    throw new Error("moves clip channel layout mismatch");
  }
  clip.data = Float32Array.from(clip.frames);
  return clip;
}

type HeadLook = { az: number; el: number; attention: number; o1: number; o2: number };

function makeHeadLook(focused: boolean, present: boolean): HeadLook {
  return { az: 0, el: 0, attention: focused && present ? 1 : 0, o1: rand(0, 6.3), o2: rand(0, 6.3) };
}

export async function createShowcaseScene(host: HTMLElement): Promise<DuckHandle> {
  THREE.Cache.enabled = true;
  const view = makeRenderer(host);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 20);
  view.onResize(() => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    view.renderer.setSize(w, h);
    fitCamera?.();
  });

  const [kinematics, clip] = await Promise.all([loadKinematics(), loadMovesClip()]);
  const rig = await buildRig(kinematics, { materialForMesh: materialHookFor(VARIANTS[DEFAULT_VARIANT]) });
  for (const name of CLIP_JOINTS) {
    if (!rig.joints.has(name)) throw new Error(`rig is missing clip joint ${name}`);
  }
  rig.placer.rotation.y = -Math.PI / 2;
  view.scene.add(rig.placer);
  const trunk = rig.bodies.get("trunk_base");
  if (!trunk) throw new Error("rig is missing trunk_base");
  const trunkEuler = new THREE.Euler();
  const applyTrunk = (z: number, roll: number, pitch: number, yaw: number) => {
    trunk.position.set(0, 0, z);
    trunkEuler.set(roll, pitch, yaw, "ZYX");
    trunk.quaternion.setFromEuler(trunkEuler);
  };
  const segOf = (name: string) => {
    const [at, end] = clip.segments[name];
    return { at, len: end - at };
  };
  const meanZ = (name: string) => {
    const { at, len } = segOf(name);
    let sum = 0;
    for (let i = 0; i < len; i++) sum += clip.data[(at + i) * 18];
    return sum / len;
  };
  const sitZ = meanZ("sitHold");
  const runZ = meanZ("run");
  const box = new THREE.Box3();
  const sample = new Float32Array(18);
  const poseFrame = (frame: Float32Array) => {
    applyTrunk(frame[0], frame[1], frame[2], frame[3]);
    for (let i = 0; i < CLIP_JOINTS.length; i++) setJoint(rig, CLIP_JOINTS[i], frame[4 + i]);
  };

  let minY = Infinity;
  let maxY = 0;
  let maxR = 0;
  let sitMaxY = 0;
  let sitMaxR = 0;
  const nFrames = clip.frames.length / 18;
  const [sitAt, sitEnd] = clip.segments.sitHold;
  for (let i = 0; i < nFrames; i += 3) {
    sample.set(clip.data.subarray(18 * i, (i + 1) * 18));
    poseFrame(sample);
    rig.placer.position.y = 0;
    rig.placer.updateWorldMatrix(true, true);
    box.setFromObject(rig.placer);
    minY = Math.min(minY, box.min.y);
    maxY = Math.max(maxY, box.max.y);
    const r = Math.max(Math.abs(box.min.x), Math.abs(box.max.x), Math.abs(box.min.z), Math.abs(box.max.z));
    maxR = Math.max(maxR, r);
    if (i >= sitAt && i < sitEnd) {
      sitMaxY = Math.max(sitMaxY, box.max.y);
      sitMaxR = Math.max(sitMaxR, r);
    }
  }
  const groundY = -Math.min(0, minY);
  rig.placer.position.y = groundY;
  const standH = maxY + groundY;
  const sitH = sitMaxY + groundY;
  const sitFocus = (sitH + 0.015) / 2;
  const standFocus = (standH + 0.015) / 2;
  const look = new THREE.Vector3(0, sitFocus, 0);
  const camDir = new THREE.Vector3(0.53, 0.27, 0.81).normalize();
  let sitDist = 0;
  let standDist = 0;
  let camDist = 0;
  let gait = 0;
  const placeCam = () => {
    camera.position.copy(look).addScaledVector(camDir, camDist);
    camera.lookAt(look);
  };
  let fitCamera: (() => void) | undefined;
  fitCamera = () => {
    const tan = Math.tan((camera.fov * Math.PI) / 360);
    const dist = (h: number, r: number) =>
      Math.max((h + 0.03) / (2 * tan * 0.9), (2 * (r + 0.015)) / (2 * tan * camera.aspect * 0.92));
    sitDist = dist(sitH, sitMaxR);
    standDist = dist(standH, maxR);
    camDist = sitDist + (standDist - sitDist) * gait;
    placeCam();
  };

  const headBody = rig.joints.get("head_yaw")!.body;
  const pointer = new THREE.Vector2(0, 0);
  let now = 0;
  let lastMove = -Infinity;
  let focused = document.hasFocus();
  let present = true;
  const onMove = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -2, 2);
    pointer.y = clamp(-((event.clientY - rect.top) / rect.height) * 2 - 1, -2, 2);
    lastMove = now;
    present = true;
  };
  window.addEventListener("pointermove", onMove);
  const onBlur = () => {
    focused = false;
  };
  const onFocus = () => {
    focused = true;
  };
  const onLeave = () => {
    present = false;
  };
  const onEnter = () => {
    present = true;
  };
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);
  document.addEventListener("mouseleave", onLeave);
  document.addEventListener("mouseenter", onEnter);

  let quackUntil = -Infinity;
  let jaw = 0;
  const onDown = () => {
    quackUntil = now + 0.3;
  };
  host.addEventListener("pointerdown", onDown);
  const onPageClick = (event: MouseEvent) => {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button, input, select, textarea, label, [role="button"], header, nav')) {
      return;
    }
    window.dispatchEvent(new CustomEvent("microduck:quack"));
  };
  let visible = true;
  const onQuack = () => {
    if (visible) quackUntil = now + 0.3;
  };
  document.addEventListener("click", onPageClick);
  window.addEventListener("microduck:quack", onQuack);

  const lookState = makeHeadLook(focused, present);
  const headPos = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  const machine = {
    sit: { seg: "sitHold", looping: true, next: "standUp" },
    standUp: { seg: "standUp", looping: false, next: "run" },
    run: { seg: "run", looping: true, next: "sitDown" },
    sitDown: { seg: "sitDown", looping: false, next: "sit" },
  } as const;
  let mode: keyof typeof machine = "sit";
  let cursor = 0;
  let loopLeft = rand(4.2, 5.8);
  const frameA = new Float32Array(18);
  const frameB = new Float32Array(18);
  let blendFrom: Float32Array | null = null;
  let blendAt = -Infinity;
  const advanceMode = (t: number) => {
    blendFrom = frameB.slice();
    blendAt = t;
    mode = machine[mode].next as keyof typeof machine;
  };

  const sampleSeg = (seg: string, t: number, looping: boolean, out: Float32Array) => {
    const { at, len } = segOf(seg);
    let i = Math.floor(t);
    let f = t - i;
    let j = i + 1;
    if (looping) {
      i %= len;
      j = (i + 1) % len;
    } else if (i >= len - 1) {
      j = i = len - 1;
      f = 0;
    }
    const a = (at + i) * 18;
    const b = (at + j) * 18;
    for (let k = 0; k < 18; k++) out[k] = clip.data[a + k] + (clip.data[b + k] - clip.data[a + k]) * f;
  };

  const joints: Record<string, number> = {};
  const step = (dt: number, t: number) => {
    const node = machine[mode];
    const { len } = segOf(node.seg);
    cursor += dt * clip.rate;
    if (node.looping) {
      loopLeft -= dt;
      if (cursor >= len) {
        cursor -= len;
        if (loopLeft <= 0) advanceMode(t);
      }
    } else if (cursor >= len - 1) {
      const extra = cursor - (len - 1);
      advanceMode(t);
      cursor = extra;
      loopLeft = rand(4.2, 5.8);
    }
    const next = machine[mode];
    sampleSeg(next.seg, cursor, next.looping, frameA);
    const blendT = (t - blendAt) / 0.15;
    if (blendFrom && blendT < 1) {
      const u = clamp(blendT, 0, 1);
      for (let i = 0; i < 18; i++) frameA[i] = blendFrom[i] + (frameA[i] - blendFrom[i]) * u;
    } else {
      blendFrom = null;
    }
    frameB.set(frameA);

    const w = clamp((frameA[0] - sitZ) / (runZ - sitZ), 0, 1);
    for (let i = 0; i < CLIP_JOINTS.length; i++) joints[CLIP_JOINTS[i]] = frameA[4 + i];
    const followScale = 1 - 0.35 * w;
    headBody.getWorldPosition(headPos);
    toCam.copy(camera.position).sub(headPos);
    const baseYaw = Math.atan2(toCam.x, toCam.z);
    const basePitch = Math.atan2(toCam.y, Math.hypot(toCam.x, toCam.z));
    const recent = t - lastMove < 3;
    const attending = focused && present && recent;
    lookState.attention += (Number(attending) - lookState.attention) * (1 - Math.exp(-dt / 0.3));
    const a = lookState.attention;
    const targetYaw = baseYaw + 0.55 * pointer.x * followScale;
    const targetPitch = 0.5 * basePitch + 0.32 * pointer.y * followScale;
    const idleYaw = baseYaw + 0.45 * Math.sin(0.21 * t + lookState.o1) * Math.sin(0.09 * t + lookState.o2) * 2;
    const idlePitch = 0.5 * basePitch + 0.1 * Math.sin(0.4 * t + lookState.o2);
    const k = 1 - Math.exp(-dt * (2.5 + 7.5 * a));
    lookState.az += (idleYaw + (targetYaw - idleYaw) * a - lookState.az) * k;
    lookState.el += (idlePitch + (targetPitch - idlePitch) * a - lookState.el) * k;
    joints.head_yaw += lookState.az;
    joints.head_pitch += -lookState.el;
    joints.head_roll += 0.3 * (lookState.az - baseYaw) * (1 - 0.5 * w);
    applyTrunk(frameA[0], frameA[1], frameA[2], frameA[3]);
    gait = w;
    const camK = 1 - Math.exp(-dt / 0.45);
    const focusY = sitFocus + (standFocus - sitFocus) * w;
    look.y += (focusY - look.y) * camK;
    const dist = sitDist + (standDist - sitDist) * w;
    camDist += (dist - camDist) * camK;
    placeCam();
    const want = Number(t < quackUntil);
    const jawK = want > jaw ? 0.04 : 0.09;
    jaw += (want - jaw) * (1 - Math.exp(-dt / jawK));
    setJawOpen(rig, jaw);
    for (const name of CLIP_JOINTS) setJoint(rig, name, joints[name]);
  };

  step(0, 0);
  let fx: ReturnType<typeof createWireframeFx> | null = createWireframeFx();
  fx.init({ root: rig.placer, hidden: true });

  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  }, { threshold: 0 });
  io.observe(host);

  const clock = new THREE.Clock();
  let raf = 0;
  let stopped = false;
  let shown = false;
  view.mount();
  fitCamera();
  const tick = () => {
    if (stopped) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta());
    if (!visible) return;
    now = performance.now() / 1000;
    step(dt, now);
    if (fx) {
      fx.start();
      fx.update(dt);
      if (fx.isDone()) {
        fx.dispose();
        fx = null;
      }
    }
    view.renderer.render(view.scene, camera);
    if (!shown) {
      shown = true;
      view.renderer.domElement.style.opacity = "1";
    }
  };
  raf = requestAnimationFrame(tick);

  return {
    setVariant() {},
    setPolicy() {},
    dispose() {
      stopped = true;
      cancelAnimationFrame(raf);
      fx?.dispose();
      fx = null;
      io.disconnect();
      view.ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      host.removeEventListener("pointerdown", onDown);
      document.removeEventListener("click", onPageClick);
      window.removeEventListener("microduck:quack", onQuack);
      view.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.Material) obj.material.dispose();
      });
      view.envRT.dispose();
      view.pmrem.dispose();
      view.renderer.dispose();
      view.renderer.domElement.remove();
    },
  };
}

export async function createColourwaysScene(host: HTMLElement, variant: VariantName): Promise<DuckHandle> {
  const view = makeRenderer(host);
  const camSit: [number, number, number] = [0.28, 0.2, 0.43];
  const camWalk: [number, number, number] = [1.2 * camSit[0], 1.2 * camSit[1] + 0.05, 1.2 * camSit[2]];
  const lookSit: [number, number, number] = [0, 0.1, 0];
  const lookWalk: [number, number, number] = [0, 0.15, 0];
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 20);
  camera.position.set(...camSit);
  camera.lookAt(...lookSit);
  view.onResize(() => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    view.renderer.setSize(w, h);
  });

  const kinematics = await loadKinematics();
  const rig = await buildRig(kinematics, { materialForMesh: materialHookFor(VARIANTS[variant]) });
  rig.placer.rotation.y = -Math.PI / 2;
  rig.placer.rotation.order = "YXZ";
  view.scene.add(rig.placer);
  applyPose(rig, SITTING_POSE);
  const sitGround0 = groundFullBody(rig);
  const box = new THREE.Box3();
  let minWalkY = Infinity;
  for (let i = 0; i < 24; i++) {
    const phase = (i / 24) * Math.PI * 2;
    applyPose(rig, walkJoints(phase, { ...SITTING_POSE, ...Object.fromEntries([...rig.joints.keys()].map((name) => [name, 0])) }));
    rig.placer.position.y = sitGround0 + walkBob(phase);
    rig.placer.updateWorldMatrix(true, true);
    box.setFromObject(rig.placer);
    minWalkY = Math.min(minWalkY, box.min.y);
  }
  const walkGround = sitGround0 - Math.min(0, minWalkY);
  applyPose(rig, SITTING_POSE);
  rig.placer.position.y = 0;
  const sitGround = groundFullBody(rig);
  rig.root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.userData.meshName && obj.material instanceof THREE.Material) {
      obj.material = obj.material.clone();
    }
  });

  const tweens = new Map<
    THREE.MeshStandardMaterial,
    { fromColor: THREE.Color; toColor: THREE.Color; fromRough: number; toRough: number; fromMetal: number; toMetal: number; start: number }
  >();

  const jointNames = [...rig.joints.keys()];
  const headBody = rig.joints.get("head_yaw")!.body;
  const pointer = new THREE.Vector2(0, 0);
  let now = 0;
  let lastMove = -Infinity;
  let focused = document.hasFocus();
  let present = true;
  const onMove = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -2, 2);
    pointer.y = clamp(-((event.clientY - rect.top) / rect.height) * 2 - 1, -2, 2);
    lastMove = now;
    present = true;
  };
  window.addEventListener("pointermove", onMove);
  const onBlur = () => {
    focused = false;
  };
  const onFocus = () => {
    focused = true;
  };
  const onLeave = () => {
    present = false;
  };
  const onEnter = () => {
    present = true;
  };
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);
  document.addEventListener("mouseleave", onLeave);
  document.addEventListener("mouseenter", onEnter);

  let quackUntil = -Infinity;
  let jaw = 0;
  let visible = true;
  const onDown = () => {
    quackUntil = now + 0.3;
  };
  host.addEventListener("pointerdown", onDown);
  const onQuack = () => {
    if (visible) quackUntil = now + 0.3;
  };
  window.addEventListener("microduck:quack", onQuack);

  const lookState = makeHeadLook(focused, present);
  const headPos = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  const walkState = { stepFreq: rand(2, 2.5), phase: rand(0, Math.PI * 2), hf1: rand(0.15, 0.35), ho1: rand(0, 6.3), hf2: rand(0.06, 0.14), ho2: rand(0, 6.3) };

  const blankFrame = (): PoseFrame => {
    const joints: Record<string, number> = {};
    for (const name of jointNames) joints[name] = 0;
    return { joints, pos: [0, sitGround, 0], yaw: -Math.PI / 2, roll: 0 };
  };

  const policies: Record<DuckPolicy, { cam: [number, number, number]; look: [number, number, number]; enter: () => void; update: (dt: number, t: number, out: PoseFrame) => void }> = {
    aim: {
      cam: camSit,
      look: lookSit,
      enter() {
        lookState.az = 0;
        lookState.el = 0;
        lookState.attention = focused && present ? 1 : 0;
        lookState.o1 = rand(0, 6.3);
        lookState.o2 = rand(0, 6.3);
      },
      update(dt, t, out) {
        Object.assign(out.joints, SITTING_POSE);
        headBody.getWorldPosition(headPos);
        toCam.copy(camera.position).sub(headPos);
        const baseYaw = Math.atan2(toCam.x, toCam.z);
        const basePitch = Math.atan2(toCam.y, Math.hypot(toCam.x, toCam.z));
        const attending = focused && present && t - lastMove < 3;
        lookState.attention += (Number(attending) - lookState.attention) * (1 - Math.exp(-dt / 0.3));
        const a = lookState.attention;
        const targetYaw = baseYaw + 0.55 * pointer.x;
        const targetPitch = 0.5 * basePitch + 0.32 * pointer.y;
        const idleYaw = baseYaw + 0.45 * Math.sin(0.21 * t + lookState.o1) * Math.sin(0.09 * t + lookState.o2) * 2;
        const idlePitch = 0.5 * basePitch + 0.1 * Math.sin(0.4 * t + lookState.o2);
        const k = 1 - Math.exp(-dt * (2.5 + 7.5 * a));
        lookState.az += (idleYaw + (targetYaw - idleYaw) * a - lookState.az) * k;
        lookState.el += (idlePitch + (targetPitch - idlePitch) * a - lookState.el) * k;
        out.joints.neck_pitch = SITTING_POSE.neck_pitch + 0.025 * Math.sin(1.4 * t);
        out.joints.head_yaw = (SITTING_POSE.head_yaw ?? 0) + lookState.az;
        out.joints.head_pitch = SITTING_POSE.head_pitch + -lookState.el;
        out.joints.head_roll = (SITTING_POSE.head_roll ?? 0) + 0.3 * (lookState.az - baseYaw);
        out.pos = [0, sitGround, 0];
        out.yaw = -Math.PI / 2;
        out.roll = 0;
      },
    },
    walk: {
      cam: camWalk,
      look: lookWalk,
      enter() {
        walkState.stepFreq = rand(2, 2.5);
        walkState.phase = rand(0, Math.PI * 2);
        walkState.hf1 = rand(0.15, 0.35);
        walkState.ho1 = rand(0, 6.3);
        walkState.hf2 = rand(0.06, 0.14);
        walkState.ho2 = rand(0, 6.3);
      },
      update(_dt, t, out) {
        const phase = t * walkState.stepFreq * Math.PI * 2 + walkState.phase;
        walkJoints(phase, out.joints);
        out.joints.neck_pitch = 0.08 * Math.sin(phase);
        out.joints.head_yaw = 0.6 * Math.sin(walkState.hf1 * t + walkState.ho1) * Math.sin(walkState.hf2 * t + walkState.ho2) * 2;
        out.joints.head_roll = 0.03 * Math.sin(0.5 * phase + walkState.phase);
        out.pos = [0, walkGround + walkBob(phase), 0];
        out.yaw = -Math.PI / 2;
        out.roll = 0.04 * Math.sin(phase);
      },
    },
  };

  let current: DuckPolicy = "aim";
  let blendFrom: PoseFrame | null = null;
  let blendAt = -Infinity;
  let lastFrame: PoseFrame | null = null;
  const camTarget = new THREE.Vector3(...camSit);
  const lookTarget = new THREE.Vector3(...lookSit);
  const lookNow = new THREE.Vector3(...lookSit);
  policies.aim.enter();

  const setPolicy = (name: DuckPolicy) => {
    if (name === current || !policies[name]) return;
    blendFrom = lastFrame
      ? {
          joints: { ...lastFrame.joints },
          pos: [lastFrame.pos[0], lastFrame.pos[1], lastFrame.pos[2]],
          yaw: lastFrame.yaw,
          roll: lastFrame.roll,
        }
      : null;
    blendAt = now;
    quackUntil = now + 0.3;
    current = name;
    policies[current].enter();
    camTarget.set(...policies[current].cam);
    lookTarget.set(...policies[current].look);
  };

  let fx: ReturnType<typeof createWireframeFx> | null = createWireframeFx();
  fx.init({ root: rig.placer, hidden: true });

  const io = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  }, { threshold: 0 });
  io.observe(host);

  const clock = new THREE.Clock();
  let raf = 0;
  let stopped = false;
  let shown = false;
  view.mount();

  const tick = () => {
    if (stopped) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, clock.getDelta());
    if (!visible) return;
    now = performance.now() / 1000;
    const frame = blankFrame();
    policies[current].update(dt, now, frame);
    const blendT = (now - blendAt) / 0.6;
    if (blendFrom && blendT < 1) {
      const u = easeInOutCubic(clamp(blendT, 0, 1));
      for (const name of jointNames) {
        const from = blendFrom.joints[name] ?? 0;
        frame.joints[name] = from + (frame.joints[name] - from) * u;
      }
      for (let i = 0; i < 3; i++) frame.pos[i] = blendFrom.pos[i] + (frame.pos[i] - blendFrom.pos[i]) * u;
      frame.yaw = lerpAngle(blendFrom.yaw, frame.yaw, u);
      frame.roll = blendFrom.roll + (frame.roll - blendFrom.roll) * u;
    } else {
      blendFrom = null;
    }
    const want = Number(now < quackUntil);
    const jawK = want > jaw ? 0.04 : 0.09;
    jaw += (want - jaw) * (1 - Math.exp(-dt / jawK));
    setJawOpen(rig, jaw);
    for (const name of jointNames) setJoint(rig, name, frame.joints[name] ?? 0);
    rig.placer.position.set(frame.pos[0], frame.pos[1], frame.pos[2]);
    rig.placer.rotation.x = frame.roll;
    rig.placer.rotation.y = frame.yaw;
    lastFrame = frame;
    const camK = 1 - Math.exp(-(2.5 * dt));
    camera.position.lerp(camTarget, camK);
    lookNow.lerp(lookTarget, camK);
    camera.lookAt(lookNow);

    if (tweens.size) {
      for (const [mat, tween] of tweens) {
        const u = clamp((now - tween.start) / 0.35, 0, 1);
        const s = easeInOutCubic(u);
        mat.color.lerpColors(tween.fromColor, tween.toColor, s);
        mat.roughness = tween.fromRough + (tween.toRough - tween.fromRough) * s;
        mat.metalness = tween.fromMetal + (tween.toMetal - tween.fromMetal) * s;
        if (u >= 1) tweens.delete(mat);
      }
    }
    if (fx) {
      fx.start();
      fx.update(dt);
      if (fx.isDone()) {
        fx.dispose();
        fx = null;
      }
    }
    view.renderer.render(view.scene, camera);
    if (!shown) {
      shown = true;
      view.renderer.domElement.style.opacity = "1";
    }
  };
  raf = requestAnimationFrame(tick);

  return {
    setVariant(name) {
      const kit = VARIANTS[name];
      if (!kit) return;
      const map = meshMaterialsFor(kit);
      rig.root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh) || !obj.userData.meshName) return;
        const spec = map[obj.userData.meshName as string] ?? kit.mechGray;
        const mat = (obj.userData.fxBaseMaterial ?? obj.material) as THREE.MeshStandardMaterial;
        if (!(mat instanceof THREE.MeshStandardMaterial)) return;
        tweens.set(mat, {
          fromColor: mat.color.clone(),
          toColor: new THREE.Color(...spec.color),
          fromRough: mat.roughness,
          toRough: spec.roughness ?? 0.5,
          fromMetal: mat.metalness,
          toMetal: spec.metalness ?? 0,
          start: now,
        });
      });
      quackUntil = now + 0.3;
    },
    setPolicy,
    dispose() {
      stopped = true;
      cancelAnimationFrame(raf);
      fx?.dispose();
      fx = null;
      io.disconnect();
      view.ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("microduck:quack", onQuack);
      view.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material instanceof THREE.Material) obj.material.dispose();
      });
      view.envRT.dispose();
      view.pmrem.dispose();
      view.renderer.dispose();
      view.renderer.domElement.remove();
    },
  };
}

export function createDuckScene(host: HTMLElement, mode: "showcase" | "colourways", colour: ColourId) {
  return mode === "showcase" ? createShowcaseScene(host) : createColourwaysScene(host, colourToVariant(colour));
}
