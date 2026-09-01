export type MaterialSpec = {
  color: [number, number, number];
  roughness: number;
  metalness: number;
  opacity?: number;
};

export type VariantName = "classic" | "charcoal" | "purple" | "blue";

const orange: MaterialSpec = { color: [0.93, 0.3, 0.002], roughness: 0.4, metalness: 0 };
const orangeHot: MaterialSpec = { color: [0.95, 0.15, 0.003], roughness: 0.45, metalness: 0 };
const amber: MaterialSpec = { color: [0.92, 0.6, 0.05], roughness: 0.4, metalness: 0 };
const cream: MaterialSpec = { color: [0.95, 0.79, 0.58], roughness: 0.35, metalness: 0 };
const mechDark: MaterialSpec = { color: [0.012, 0.012, 0.014], roughness: 0.55, metalness: 0.3 };
const mechGray: MaterialSpec = { color: [0.256, 0.256, 0.279], roughness: 0.5, metalness: 0.35 };
const lens: MaterialSpec = { color: [0.01, 0.012, 0.02], roughness: 0.05, metalness: 0 };
const face: MaterialSpec = { color: [0.328, 0.312, 0.283], roughness: 0.35, metalness: 0 };
const charcoalBody: MaterialSpec = { color: [0.11, 0.11, 0.118], roughness: 0.5, metalness: 0 };
const plum: MaterialSpec = { color: [0.36, 0.23, 0.48], roughness: 0.45, metalness: 0 };
const sky: MaterialSpec = { color: [0.32, 0.73, 0.86], roughness: 0.35, metalness: 0 };
const lavender: MaterialSpec = { color: [0.52, 0.38, 0.66], roughness: 0.35, metalness: 0 };

export type VariantKit = {
  headDome: MaterialSpec;
  facePlate: MaterialSpec;
  trim: MaterialSpec;
  beakUpper: MaterialSpec;
  beakLower: MaterialSpec;
  tongue: MaterialSpec;
  eyeRing: MaterialSpec;
  lens: MaterialSpec;
  bodyShell: MaterialSpec;
  sideShells: MaterialSpec;
  legShells: MaterialSpec;
  feet: MaterialSpec;
  soles: MaterialSpec;
  hips: MaterialSpec;
  mechDark: MaterialSpec;
  mechGray: MaterialSpec;
};

export const VARIANTS: Record<VariantName, VariantKit> = {
  classic: {
    headDome: cream,
    facePlate: face,
    trim: orangeHot,
    beakUpper: orange,
    beakLower: orangeHot,
    tongue: orange,
    eyeRing: orange,
    lens,
    bodyShell: cream,
    sideShells: cream,
    legShells: cream,
    feet: orangeHot,
    soles: amber,
    hips: mechGray,
    mechDark,
    mechGray,
  },
  charcoal: {
    headDome: { color: [0.15, 0.144, 0.14], roughness: 0.5, metalness: 0 },
    facePlate: { color: [0.185, 0.178, 0.172], roughness: 0.5, metalness: 0 },
    trim: amber,
    beakUpper: plum,
    beakLower: amber,
    tongue: plum,
    eyeRing: { color: [0.28, 0.15, 0.55], roughness: 0.4, metalness: 0 },
    lens,
    bodyShell: charcoalBody,
    sideShells: charcoalBody,
    legShells: charcoalBody,
    feet: amber,
    soles: plum,
    hips: mechGray,
    mechDark,
    mechGray,
  },
  purple: {
    headDome: lavender,
    facePlate: face,
    trim: amber,
    beakUpper: plum,
    beakLower: amber,
    tongue: plum,
    eyeRing: sky,
    lens,
    bodyShell: lavender,
    sideShells: lavender,
    legShells: lavender,
    feet: amber,
    soles: plum,
    hips: mechGray,
    mechDark,
    mechGray,
  },
  blue: {
    headDome: sky,
    facePlate: face,
    trim: orangeHot,
    beakUpper: orange,
    beakLower: orangeHot,
    tongue: orange,
    eyeRing: orange,
    lens,
    bodyShell: sky,
    sideShells: sky,
    legShells: sky,
    feet: orangeHot,
    soles: amber,
    hips: mechGray,
    mechDark,
    mechGray,
  },
};

export const DEFAULT_VARIANT: VariantName = "classic";

export const VARIANT_SWATCH_HEX: Record<VariantName, string> = {
  classic: "#f7e6cb",
  charcoal: "#6c6a68",
  purple: "#bfa9cf",
  blue: "#a9dbe8",
};

export function meshMaterialsFor(kit: VariantKit): Record<string, MaterialSpec> {
  return {
    "top_head_shell.stl": kit.headDome,
    "bottom_head_shell.stl": kit.trim,
    "face_part.stl": kit.facePlate,
    "noenoeil.stl": kit.eyeRing,
    "lens.stl": kit.lens,
    "m12_lens_holder.stl": kit.mechDark,
    "soft_mouth_top.stl": kit.beakUpper,
    "jaw.stl": kit.beakLower,
    "jaw_soft.stl": kit.tongue,
    "trunk_base.stl": kit.bodyShell,
    "left_shell.stl": kit.sideShells,
    "right_shell.stl": kit.sideShells,
    "upper_leg_left.stl": kit.legShells,
    "upper_leg_right.stl": kit.legShells,
    "hip_l.stl": kit.hips,
    "foot_left.stl": kit.feet,
    "foot_right.stl": kit.feet,
    "ankle_left.stl": kit.feet,
    "ankle_right.stl": kit.feet,
    "sole_left.stl": kit.soles,
    "sole_right.stl": kit.soles,
    "xl330.stl": kit.mechDark,
    "leg.stl": kit.mechGray,
    "seeed_bearing__configuration_default.stl": kit.mechDark,
    "yaw2roll.stl": kit.mechDark,
    "bearing_roll.stl": kit.mechDark,
    "neck.stl": kit.mechGray,
    "np_f970.stl": kit.mechDark,
    "pcb__raspberry_pi_zero_2_w.stl": kit.mechDark,
    "elec_rpi_robot_hat_pcb.stl": kit.mechDark,
    "banana_pcb_locker.stl": kit.mechDark,
    "speaker.stl": kit.mechDark,
    "upper_leg_rigidity_plate.stl": kit.mechGray,
    "yaw_roll_motion.stl": kit.mechGray,
    "neck_pitch.stl": kit.mechGray,
    "motor_support.stl": kit.mechGray,
    "power_support.stl": kit.mechGray,
    "seeed_bearing__configuration__22x16x4.stl": kit.mechGray,
  };
}

export function materialHookFor(kit: VariantKit) {
  const map = meshMaterialsFor(kit);
  return (meshName: string) => map[meshName] ?? kit.mechGray;
}
