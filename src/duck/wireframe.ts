import * as THREE from "three";

const DURATION = 0.4 + 0.8;
let fxUid = 0;

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const easeOutQuad = (n: number) => 1 - (1 - n) * (1 - n);
const hash = (n: number) => {
  const t = 43758.5453 * Math.sin(127.1 * n);
  return t - Math.floor(t);
};

export function createWireframeFx() {
  const uScanY = { value: -1000 };
  const uSolidY = { value: -1000 };
  const uFlicker = { value: 1 };
  const uTime = { value: 0 };
  let root: THREE.Object3D | null = null;
  let elapsed = 0;
  let running = false;
  let done = false;
  let baseY = 0;
  let span = 0.3;
  const patched = new Map<string, THREE.Material>();
  let pairs: Array<[THREE.Mesh, THREE.Material, THREE.Material]> | null = null;
  let overlayMat: THREE.ShaderMaterial | null = null;
  const overlays: THREE.Mesh[] = [];

  const isBaseMesh = (obj: THREE.Object3D): obj is THREE.Mesh =>
    obj instanceof THREE.Mesh && !obj.userData.fxOverlay;

  function patchMaterial(source: THREE.Material) {
    const hit = patched.get(source.uuid);
    if (hit) return hit;
    const mat = source.clone();
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uFxSolidY = uSolidY;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vFxW;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvFxW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vFxW;\nuniform float uFxSolidY;")
        .replace(
          "#include <clipping_planes_fragment>",
          `#include <clipping_planes_fragment>
float fxEdge = 0.0;
if (vFxW.y > uFxSolidY) discard;
fxEdge = 1.0 - smoothstep(0.002, 0.018, uFxSolidY - vFxW.y);`,
        )
        .replace(
          "#include <dithering_fragment>",
          `#include <dithering_fragment>
gl_FragColor.rgb += fxEdge * vec3(0.95, 0.32, 0.05);`,
        );
    };
    const key = `microduck-fx-wireframe-${fxUid++}`;
    mat.customProgramCacheKey = () => key;
    mat.needsUpdate = true;
    patched.set(source.uuid, mat);
    return mat;
  }

  function applySolid() {
    if (pairs) return;
    if (!root) return;
    pairs = [];
    root.traverse((obj) => {
      if (!isBaseMesh(obj)) return;
      const base = obj.material as THREE.Material;
      const fx = patchMaterial(base);
      pairs!.push([obj, base, fx]);
      obj.userData.fxBaseMaterial = base;
      obj.material = fx;
    });
  }

  function restoreSolid() {
    if (!pairs) return;
    for (const [mesh, base, fx] of pairs) {
      if (mesh.material === fx) mesh.material = base;
      delete mesh.userData.fxBaseMaterial;
    }
    pairs = null;
  }

  function sample(t: number) {
    const rise = easeOutQuad(clamp01(t / 0.8));
    const solid = easeOutQuad(clamp01((t - 0.4) / 0.8));
    let flicker = 0.82 + 0.18 * hash(Math.floor(60 * t) + 0.5);
    if (hash(Math.floor(24 * t) + 7.7) < 0.12) flicker *= 0.5;
    uFlicker.value = flicker;
    uTime.value = t;
    const jitter = rise > 0 && rise < 1 ? (hash(41.3 * t) - 0.5) * 0.02 * span : 0;
    uScanY.value = baseY + span * rise + jitter;
    uSolidY.value = baseY + span * solid;
    const show = t > 0 && solid < 1;
    for (const overlay of overlays) overlay.visible = show;
  }

  function measure() {
    if (!root) return;
    root.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(root);
    baseY = Math.min(box.min.y, 0) - 0.025;
    span = 1.06 * Math.max(box.max.y - baseY, 0.04);
  }

  return {
    init({ root: next, hidden = true }: { root: THREE.Object3D; hidden?: boolean }) {
      root = next;
      measure();
      overlayMat = new THREE.ShaderMaterial({
        uniforms: { uScanY, uSolidY, uFlicker, uTime },
        vertexShader: `
          varying vec3 vW;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vW = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: `
          uniform float uScanY, uSolidY, uFlicker, uTime;
          varying vec3 vW;
          void main() {
            if (vW.y > uScanY || vW.y < uSolidY) discard;
            float lead = 1.0 - smoothstep(0.0, 0.06, uScanY - vW.y);
            float tail = smoothstep(0.0, 0.018, vW.y - uSolidY);
            float stripes = 0.7 + 0.3 * sin(vW.y * 900.0 - uTime * 45.0);
            vec3 c = vec3(1.0, 0.34, 0.06) * (0.55 + 1.6 * lead);
            float a = (0.10 + 0.40 * lead) * stripes * tail * uFlicker;
            gl_FragColor = vec4(c, a);
          }`,
        wireframe: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
      });
      root.traverse((obj) => {
        if (!isBaseMesh(obj) || !overlayMat) return;
        const overlay = new THREE.Mesh(obj.geometry, overlayMat);
        overlay.userData.fxOverlay = true;
        overlay.renderOrder = 5;
        overlay.visible = false;
        obj.add(overlay);
        overlays.push(overlay);
      });
      elapsed = 0;
      done = false;
      running = false;
      if (hidden) {
        applySolid();
        sample(0);
      }
    },
    start() {
      if (running || done) return;
      measure();
      applySolid();
      elapsed = 0;
      sample(0);
      running = true;
    },
    update(dt: number) {
      if (!running || done) return;
      elapsed += dt;
      if (elapsed >= DURATION) {
        sample(DURATION);
        restoreSolid();
        for (const overlay of overlays) overlay.visible = false;
        done = true;
        running = false;
        return;
      }
      sample(elapsed);
    },
    isDone() {
      return done;
    },
    dispose() {
      restoreSolid();
      for (const overlay of overlays) overlay.parent?.remove(overlay);
      overlays.length = 0;
      overlayMat?.dispose();
      overlayMat = null;
      for (const mat of patched.values()) mat.dispose();
      patched.clear();
      root = null;
      running = false;
      done = false;
    },
  };
}
