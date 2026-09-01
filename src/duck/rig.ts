import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import type { MaterialSpec } from "./materials";

const MODEL_DIR = "/microduck-3d/robot/mjlab";
const GLB_URL = `${MODEL_DIR}/microduck.glb?v=11`;
const CREASE = Math.PI / 5;
const JAW_MESHES = new Set(["jaw.stl", "jaw_soft.stl"]);
const JAW_ORIGIN = new THREE.Vector3(0, 4e-5, 0.0075);

export const JAW_MAX_OPEN = 0.32;

export const CLIP_JOINTS = [
  "left_hip_yaw",
  "left_hip_roll",
  "left_hip_pitch",
  "left_knee",
  "left_ankle",
  "neck_pitch",
  "head_pitch",
  "head_yaw",
  "head_roll",
  "right_hip_yaw",
  "right_hip_roll",
  "right_hip_pitch",
  "right_knee",
  "right_ankle",
] as const;

export const SITTING_POSE: Record<string, number> = {
  left_hip_yaw: 0,
  left_hip_roll: 0,
  left_hip_pitch: -0.5236,
  left_knee: 1.0472,
  left_ankle: 0,
  neck_pitch: 1.02,
  head_pitch: 0.9,
  head_yaw: 0,
  head_roll: 0,
  right_hip_yaw: 0,
  right_hip_roll: 0,
  right_hip_pitch: 0.5236,
  right_knee: -1.0472,
  right_ankle: 0,
};

type Geom = {
  type?: string;
  mesh?: string;
  pos?: number[];
  quat?: number[];
  color?: number[];
};

type BodyDef = {
  name: string;
  parent: string | null;
  pos: number[];
  quat: number[];
  geoms: Geom[];
  joint?: {
    name: string;
    axis: number[];
    type?: string;
    pos?: number[];
    range?: [number, number] | null;
  };
};

export type Kinematics = {
  bodies: BodyDef[];
  actuated_joints: string[];
  mesh_dir: string;
};

export type JointState = {
  body: THREE.Object3D;
  axis: THREE.Vector3;
  baseQuat: THREE.Quaternion;
  range: [number, number] | null;
};

export type DuckRig = {
  placer: THREE.Group;
  root: THREE.Group;
  bodies: Map<string, THREE.Group>;
  joints: Map<string, JointState>;
  _jawPivot?: THREE.Object3D | null;
};

let meshCache: Promise<Map<string, THREE.BufferGeometry>> | null = null;

function meshKey(mesh: THREE.Mesh) {
  const data = mesh.userData as { meshFile?: string };
  return data.meshFile || mesh.name || mesh.geometry.name;
}

function loadMeshGeometries() {
  if (!meshCache) {
    meshCache = new GLTFLoader().loadAsync(GLB_URL).then((gltf) => {
      const map = new Map<string, THREE.BufferGeometry>();
      gltf.scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh) || !obj.geometry) return;
        const name = meshKey(obj);
        if (!name || map.has(name)) return;
        const geo = obj.geometry as THREE.BufferGeometry;
        geo.deleteAttribute("normal");
        geo.scale(1000, 1000, 1000);
        const creased = toCreasedNormals(geo, CREASE);
        creased.scale(0.001, 0.001, 0.001);
        map.set(name, creased);
        if (obj.name && obj.name !== name) map.set(obj.name, creased);
      });
      return map;
    });
  }
  return meshCache;
}

export async function loadKinematics(): Promise<Kinematics> {
  const res = await fetch(`${MODEL_DIR}/kinematics.json?v=11`, { cache: "force-cache" });
  if (!res.ok) throw new Error(`kinematics fetch ${res.status}`);
  const data = (await res.json()) as Kinematics;
  data.mesh_dir = `${MODEL_DIR}/meshes`;
  return data;
}

const scratchQuat = new THREE.Quaternion();
const scratchAxis = new THREE.Vector3();
const bounds = new THREE.Box3();

function applyWxyz(target: THREE.Quaternion, quat: number[]) {
  target.set(quat[1], quat[2], quat[3], quat[0]);
}

function attachJaw(rig: DuckRig) {
  const meshes: THREE.Mesh[] = [];
  rig.root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && JAW_MESHES.has(obj.userData.meshName as string)) {
      meshes.push(obj);
    }
  });
  if (!meshes.length) return;
  const parent = meshes[0].parent;
  if (!parent) return;
  rig.placer.updateWorldMatrix(true, true);
  const jaw = meshes.find((mesh) => mesh.userData.meshName === "jaw.stl") ?? meshes[0];
  const world = jaw.localToWorld(JAW_ORIGIN.clone());
  const localAxis = new THREE.Vector3(0, 0, -1);
  const inv = parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  const localPos = parent.worldToLocal(world.clone());
  localAxis.applyQuaternion(inv).normalize();
  const pivot = new THREE.Group();
  pivot.name = "jaw_pivot";
  pivot.position.copy(localPos);
  pivot.userData.jawAxis = localAxis.toArray();
  parent.add(pivot);
  for (const mesh of meshes) {
    mesh.position.sub(localPos);
    pivot.add(mesh);
  }
}

export async function buildRig(
  kinematics: Kinematics,
  opts: { materialForMesh?: (meshName: string) => MaterialSpec } = {},
): Promise<DuckRig> {
  const placer = new THREE.Group();
  placer.name = "duck_placer";
  const root = new THREE.Group();
  root.name = "duck_root";
  root.rotation.x = -Math.PI / 2;
  placer.add(root);

  const bodies = new Map<string, THREE.Group>();
  const joints = new Map<string, JointState>();
  const geos = await loadMeshGeometries();
  const getGeo = (name: string) => {
    const geo = geos.get(name);
    if (!geo) return Promise.reject(new Error(`missing mesh ${name} in GLB`));
    return Promise.resolve(geo);
  };

  for (const body of kinematics.bodies) {
    const group = new THREE.Group();
    group.name = body.name;
    group.position.set(body.pos[0], body.pos[1], body.pos[2]);
    applyWxyz(group.quaternion, body.quat);
    bodies.set(body.name, group);
  }
  for (const body of kinematics.bodies) {
    const group = bodies.get(body.name)!;
    if (body.parent && bodies.has(body.parent)) bodies.get(body.parent)!.add(group);
    else root.add(group);
  }
  for (const body of kinematics.bodies) {
    if (!body.joint || (body.joint.type && body.joint.type !== "hinge")) continue;
    const group = bodies.get(body.name)!;
    joints.set(body.joint.name, {
      body: group,
      axis: new THREE.Vector3(...body.joint.axis).normalize(),
      baseQuat: group.quaternion.clone(),
      range: body.joint.range ?? null,
    });
  }

  const matCache = new Map<string, THREE.MeshStandardMaterial>();
  const materialOf = (spec: MaterialSpec) => {
    const opacity = spec.opacity ?? 1;
    const key = `${spec.color.join(",")}|${spec.roughness}|${spec.metalness}|${opacity}`;
    const hit = matCache.get(key);
    if (hit) return hit;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(...spec.color),
      roughness: spec.roughness,
      metalness: spec.metalness,
      transparent: opacity < 1,
      opacity,
    });
    matCache.set(key, mat);
    return mat;
  };
  const resolveSpec = (hook: MaterialSpec | number[] | undefined, fallback: number[]): MaterialSpec => {
    if (!hook) return { color: [fallback[0], fallback[1], fallback[2]], roughness: 0.5, metalness: 0, opacity: fallback[3] ?? 1 };
    if (Array.isArray(hook)) {
      return { color: [hook[0], hook[1], hook[2]], roughness: 0.5, metalness: 0, opacity: hook[3] ?? 1 };
    }
    return { ...hook, opacity: hook.opacity ?? 1 };
  };

  const seen = new Set<string>();
  const pending: Promise<void>[] = [];
  for (const body of kinematics.bodies) {
    const group = bodies.get(body.name);
    if (!group) continue;
    for (const geom of body.geoms) {
      if ((geom.type && geom.type !== "mesh") || !geom.mesh) continue;
      const token = `${body.name}|${geom.mesh}|${geom.pos}|${geom.quat}`;
      if (seen.has(token)) continue;
      seen.add(token);
      pending.push(
        getGeo(geom.mesh).then((geo) => {
          const fallback = geom.color ? [geom.color[0], geom.color[1], geom.color[2], geom.color[3] ?? 1] : [0.85, 0.85, 0.85, 1];
          const spec = resolveSpec(opts.materialForMesh?.(geom.mesh!), fallback);
          const mesh = new THREE.Mesh(geo, materialOf(spec));
          mesh.userData.meshName = geom.mesh;
          if (geom.pos) mesh.position.set(geom.pos[0], geom.pos[1], geom.pos[2]);
          if (geom.quat) applyWxyz(mesh.quaternion, geom.quat);
          group.add(mesh);
        }),
      );
    }
  }
  await Promise.all(pending);

  const rig: DuckRig = { placer, root, bodies, joints };
  attachJaw(rig);
  return rig;
}

export function setJoint(rig: DuckRig, name: string, value: number) {
  const joint = rig.joints.get(name);
  if (!joint) return;
  let next = value;
  if (joint.range) next = Math.min(joint.range[1], Math.max(joint.range[0], next));
  scratchQuat.setFromAxisAngle(joint.axis, next);
  joint.body.quaternion.copy(joint.baseQuat).multiply(scratchQuat);
}

export function applyPose(rig: DuckRig, pose: Record<string, number>) {
  for (const [name, value] of Object.entries(pose)) setJoint(rig, name, value);
}

export function setJawOpen(rig: DuckRig, amount: number) {
  if (rig._jawPivot === undefined) {
    rig._jawPivot = rig.placer.getObjectByName("jaw_pivot") ?? null;
  }
  const pivot = rig._jawPivot;
  if (!pivot) return;
  const axis = (pivot.userData.jawAxis as number[]) ?? [0, 0, -1];
  scratchAxis.fromArray(axis);
  pivot.quaternion.setFromAxisAngle(scratchAxis, JAW_MAX_OPEN * amount);
}

export function groundFullBody(rig: DuckRig, y = 0) {
  rig.placer.updateWorldMatrix(true, true);
  bounds.setFromObject(rig.placer);
  if (!Number.isFinite(bounds.min.y)) return 0;
  rig.placer.position.y += y - bounds.min.y;
  return y - bounds.min.y;
}
