"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles, Stars, Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Project } from "@/data/projects";
import type { InputState } from "@/lib/input";
import {
  INTERACT_DISTANCE,
  MONUMENT,
  PLAYER_RADIUS,
  STAND_RADIUS,
  galleryBounds,
  standPosition,
  worldBounds,
} from "@/lib/layout";

// ---------------------------------------------------------------- Suelo

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#060a14" />
      </mesh>
      <gridHelper args={[200, 100, "#10334d", "#0b1c31"]} position={[0, 0.01, 0]} />
    </group>
  );
}

// ---------------------------------------------------------------- Galería de memorias

function Gallery({ projectCount }: { projectCount: number }) {
  const bounds = useMemo(() => galleryBounds(projectCount), [projectCount]);
  const ribPositions: number[] = [];
  const floorMarkers: number[] = [];

  for (let z = bounds.frontZ - 3; z > bounds.backZ + 2; z -= 8) {
    ribPositions.push(z);
  }
  for (let z = bounds.frontZ - 4; z > bounds.backZ + 2; z -= 7) {
    floorMarkers.push(z);
  }

  return (
    <group>
      {/* Suelo, paredes laterales y fondo: la entrada queda abierta hacia la plaza. */}
      <mesh position={[0, -0.22, bounds.centerZ]}>
        <boxGeometry args={[bounds.halfWidth * 2, 0.44, bounds.length]} />
        <meshStandardMaterial color="#0b1428" metalness={0.45} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.015, bounds.centerZ]}>
        <boxGeometry args={[3.2, 0.025, bounds.length - 1]} />
        <meshStandardMaterial color="#101f3a" metalness={0.25} roughness={0.65} />
      </mesh>
      {[-1.85, 1.85].map((x) => (
        <mesh key={x} position={[x, 0.035, bounds.centerZ]}>
          <boxGeometry args={[0.045, 0.025, bounds.length - 1]} />
          <meshStandardMaterial
            color="#2dd4ff"
            emissive="#2dd4ff"
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}
      {floorMarkers.map((z) => (
        <mesh key={z} position={[0, 0.04, z]}>
          <boxGeometry args={[0.65, 0.025, 0.16]} />
          <meshStandardMaterial
            color="#e45cff"
            emissive="#e45cff"
            emissiveIntensity={0.85}
          />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * bounds.halfWidth, 4.7, bounds.centerZ]}>
            <boxGeometry args={[0.6, 9.4, bounds.length]} />
            <meshStandardMaterial color="#101c35" metalness={0.35} roughness={0.7} />
          </mesh>
          {[1.2, 7.8].map((y) => (
            <mesh key={y} position={[side * (bounds.halfWidth - 0.31), y, bounds.centerZ]}>
              <boxGeometry args={[0.08, 0.08, bounds.length - 1]} />
              <meshStandardMaterial
                color="#2dd4ff"
                emissive="#2dd4ff"
                emissiveIntensity={0.8}
              />
            </mesh>
          ))}
          {ribPositions.map((z) => (
            <mesh key={z} position={[side * (bounds.halfWidth - 0.45), 4.6, z]}>
              <boxGeometry args={[0.24, 8.8, 0.45]} />
              <meshStandardMaterial color="#1b2c4c" metalness={0.45} roughness={0.55} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh position={[0, 9.7, bounds.centerZ]}>
        <boxGeometry args={[bounds.halfWidth * 2, 0.5, bounds.length]} />
        <meshStandardMaterial
          color="#3a6a8a"
          metalness={0.25}
          roughness={0.32}
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 4.7, bounds.backZ]}>
        <boxGeometry args={[bounds.halfWidth * 2, 9.4, 0.6]} />
        <meshStandardMaterial color="#101c35" metalness={0.35} roughness={0.7} />
      </mesh>

      {/* Pórticos que marcan el recorrido y dan escala de biblioteca. */}
      {ribPositions.map((z) => (
        <group key={z}>
          <mesh position={[0, 9.05, z]}>
            <boxGeometry args={[bounds.halfWidth * 2 - 0.8, 0.28, 0.5]} />
            <meshStandardMaterial color="#1b2c4c" metalness={0.45} roughness={0.55} />
          </mesh>
          <mesh position={[0, 8.88, z + 0.28]}>
            <boxGeometry args={[bounds.halfWidth * 2 - 1.4, 0.05, 0.05]} />
            <meshStandardMaterial
              color="#e45cff"
              emissive="#e45cff"
              emissiveIntensity={0.75}
            />
          </mesh>
          <pointLight position={[0, 7.8, z]} color="#2dd4ff" intensity={12} distance={18} />
        </group>
      ))}

      {/* Umbral reconocible entre la plaza y el archivo. */}
      {[-5.8, 5.8].map((x) => (
        <mesh key={x} position={[x, 4.15, bounds.frontZ]}>
          <boxGeometry args={[0.65, 8.3, 0.8]} />
          <meshStandardMaterial color="#1b2c4c" metalness={0.45} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 8.4, bounds.frontZ]}>
        <boxGeometry args={[12.2, 0.55, 0.8]} />
        <meshStandardMaterial color="#1b2c4c" metalness={0.45} roughness={0.5} />
      </mesh>
      <Sparkles
        count={32}
        position={[0, 4, bounds.frontZ - 1.2]}
        scale={[10, 6, 4]}
        size={1.4}
        speed={0.18}
        color="#7be7ff"
        opacity={0.45}
      />
    </group>
  );
}

// ---------------------------------------------------------------- Plaza central

function Plaza() {
  const crystal = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (crystal.current) crystal.current.rotation.y += delta * 0.6;
  });

  return (
    <group position={[0, 0, 18]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[7, 7, 0.1, 64]} />
        <meshStandardMaterial color="#0c1a33" />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.4, 6.8, 64]} />
        <meshStandardMaterial
          color="#2dd4ff"
          emissive="#2dd4ff"
          emissiveIntensity={1.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[1.0, 1.3, 0.8, 6]} />
        <meshStandardMaterial color="#10203d" />
      </mesh>
      <mesh ref={crystal} position={[0, 1.9, 0]}>
        <octahedronGeometry args={[0.9]} />
        <meshStandardMaterial color="#e45cff" emissive="#e45cff" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- Stand de proyecto

type StandProps = {
  project: Project;
  number: number;
  position: [number, number, number];
  rotation: number;
  highlighted: boolean;
  onSelect: (id: string) => void;
};

function StandArtwork({ src }: { src: string }) {
  const texture = useTexture(src);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh position={[0, 1.6, -0.78]}>
      <planeGeometry args={[2.95, 1.9]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function Stand({ project, number, position, rotation, highlighted, onSelect }: StandProps) {
  const glow = useRef(0); // 0 = apagado, 1 = jugador cerca (cambia suavemente)
  const float = useRef<THREE.Group>(null);
  const gem = useRef<THREE.Mesh>(null);
  const orbit = useRef<THREE.Group>(null);

  // Un solo material compartido para todos los bordes neón del stand:
  // al cambiar su brillo una vez, se enciende todo el stand a la vez.
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: project.color,
        emissive: project.color,
        emissiveIntensity: 0.6,
        metalness: 0.2,
        roughness: 0.35,
      }),
    [project.color],
  );
  // Haz de luz falso (más barato que una luz real, importante en celulares).
  const beamMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: project.color,
        transparent: true,
        opacity: 0.07,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [project.color],
  );
  useEffect(
    () => () => {
      glowMaterial.dispose();
      beamMaterial.dispose();
    },
    [glowMaterial, beamMaterial],
  );

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime + number; // "number" desfasa cada stand

    glow.current += ((highlighted ? 1 : 0) - glow.current) * Math.min(1, dt * 6);
    const pulse = highlighted ? Math.sin(t * 5) * 0.3 : 0;
    glowMaterial.emissiveIntensity = 0.6 + glow.current * (1.8 + pulse);
    beamMaterial.opacity = 0.07 + glow.current * 0.1;

    if (float.current) {
      float.current.position.y = 2.55 + Math.sin(t * 1.5) * 0.08;
      float.current.scale.setScalar(1 + glow.current * 0.25);
    }
    if (gem.current) gem.current.rotation.y += dt * (0.8 + glow.current * 2.2);
    if (orbit.current) orbit.current.rotation.y += dt * 1.1;
  });

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(project.id);
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "default")}
    >
      {/* plataforma */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[3.8, 0.3, 2.5]} />
        <meshStandardMaterial color="#11182b" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* contorno neón de la plataforma */}
      {[-1.2, 1.2].map((z) => (
        <mesh key={z} position={[0, 0.305, z]} material={glowMaterial}>
          <boxGeometry args={[3.7, 0.02, 0.05]} />
        </mesh>
      ))}
      {[-1.85, 1.85].map((x) => (
        <mesh key={x} position={[x, 0.305, 0]} material={glowMaterial}>
          <boxGeometry args={[0.05, 0.02, 2.45]} />
        </mesh>
      ))}

      {/* Marco de vitrina */}
      {[-1.72, 1.72].map((x) => (
        <mesh key={x} position={[x, 1.65, -0.92]}>
          <boxGeometry args={[0.14, 2.65, 0.24]} />
          <meshStandardMaterial color="#263957" metalness={0.55} roughness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 2.95, -0.92]}>
        <boxGeometry args={[3.55, 0.14, 0.24]} />
        <meshStandardMaterial color="#263957" metalness={0.55} roughness={0.45} />
      </mesh>
      {/* líneas neón del marco */}
      {[-1.72, 1.72].map((x) => (
        <mesh key={x} position={[x, 1.65, -0.795]} material={glowMaterial}>
          <boxGeometry args={[0.03, 2.5, 0.02]} />
        </mesh>
      ))}
      <mesh position={[0, 2.9, -0.795]} material={glowMaterial}>
        <boxGeometry args={[3.3, 0.035, 0.02]} />
      </mesh>

      {/* panel de fondo + portada */}
      <mesh position={[0, 1.6, -0.9]}>
        <boxGeometry args={[3.2, 2.2, 0.15]} />
        <meshStandardMaterial color="#101a30" metalness={0.25} roughness={0.55} />
      </mesh>
      {project.coverUrl ? (
        <StandArtwork src={project.coverUrl} />
      ) : (
        <>
          <mesh position={[0, 1.6, -0.8]}>
            <boxGeometry args={[2.95, 1.9, 0.035]} />
            <meshStandardMaterial
              color={project.color}
              emissive={project.color}
              emissiveIntensity={highlighted ? 1.15 : 0.55}
              metalness={0.2}
              roughness={0.45}
            />
          </mesh>
          <Text
            position={[0, 1.88, -0.76]}
            fontSize={0.27}
            maxWidth={2.8}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            textAlign="center"
          >
            {project.title}
          </Text>
          <Text
            position={[0, 1.25, -0.76]}
            fontSize={0.14}
            maxWidth={2.8}
            color="#e6f1ff"
            anchorX="center"
            anchorY="middle"
          >
            {project.category}
          </Text>
        </>
      )}
      <Text
        position={[0, 3.14, -0.72]}
        fontSize={0.13}
        maxWidth={3}
        color="#d9f7ff"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
      >
        {`MEMORIA ${String(number).padStart(2, "0")}`}
      </Text>

      {/* mostrador con placa de nombre (el título solo se repite si hay portada) */}
      <mesh position={[0, 0.75, 0.5]}>
        <boxGeometry args={[2.4, 0.9, 0.6]} />
        <meshStandardMaterial color="#1a2542" metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.27, 0.5]} material={glowMaterial}>
        <boxGeometry args={[2.05, 0.07, 0.48]} />
      </mesh>
      {project.coverUrl && (
        <Text
          position={[0, 0.9, 0.81]}
          fontSize={0.15}
          maxWidth={2.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
        >
          {project.title}
        </Text>
      )}
      <Text
        position={[0, project.coverUrl ? 0.62 : 0.75, 0.81]}
        fontSize={0.11}
        maxWidth={2.2}
        color="#9bd9ff"
        anchorX="center"
        anchorY="middle"
      >
        {`por ${project.author}`}
      </Text>

      {/* cristal flotante con anillo orbital */}
      <group ref={float} position={[0, 2.55, 0.18]}>
        <mesh ref={gem} rotation={[0.2, 0.4, 0]}>
          <octahedronGeometry args={[0.32]} />
          <meshStandardMaterial
            color={project.color}
            emissive={project.color}
            emissiveIntensity={highlighted ? 2 : 1}
            metalness={0.2}
            roughness={0.3}
          />
        </mesh>
        <group ref={orbit}>
          <mesh rotation={[1.1, 0, 0.3]} material={glowMaterial} raycast={() => null}>
            <torusGeometry args={[0.55, 0.012, 8, 40]} />
          </mesh>
        </group>
      </group>

      {/* haz de luz que cae sobre el mostrador */}
      <mesh position={[0, 1.95, 0.35]} material={beamMaterial} raycast={() => null}>
        <cylinderGeometry args={[0.12, 1.1, 3.3, 24, 1, true]} />
      </mesh>

      {/* partículas flotando dentro del haz */}
      <Sparkles
        count={10}
        scale={[2.4, 2.4, 1.6]}
        position={[0, 1.7, 0.35]}
        size={3}
        speed={0.4}
        color={project.color}
      />
    </group>
  );
}



const SKIN = "#e2b99f";

function FirstPersonHands({
  color,
  input,
}: {
  color: string;
  input: MutableRefObject<InputState>;
}) {
  const root = useRef<THREE.Group>(null);
  const arms = useRef<(THREE.Group | null)[]>([null, null]);
  const walk = useRef(0); // 0 = quieto, 1 = caminando (cambia suavemente)
  const camera = useThree((state) => state.camera);

  useFrame((state, rawDelta) => {
    const group = root.current;
    if (!group) return;
    const dt = Math.min(rawDelta, 0.05);

    // Las manos viajan pegadas a la cámara, como antes.
    group.position.copy(camera.position);
    group.quaternion.copy(camera.quaternion);
    group.translateY(-0.42);
    group.translateZ(-1.45);

    // ¿Se está moviendo? Suavizamos el cambio para que no sea brusco.
    const i = input.current;
    const moving = Math.hypot(i.kx + i.tx, i.kz + i.tz) > 0.01 ? 1 : 0;
    walk.current += (moving - walk.current) * Math.min(1, dt * 8);

    const t = state.clock.elapsedTime;
    [-1, 1].forEach((side, n) => {
      const arm = arms.current[n];
      if (!arm) return;
      const step = Math.sin(t * 10 + (side > 0 ? Math.PI : 0)); // manos alternadas
      const breathe = Math.sin(t * 1.6 + n) * 0.006;
      arm.position.set(
        side * 0.3,
        -0.1 + breathe + step * 0.025 * walk.current,
        step * 0.04 * walk.current,
      );
      arm.rotation.set(0.2 + step * 0.08 * walk.current, 0, side * -0.18);
    });
  });

  return (
    <group ref={root}>
      {[-1, 1].map((side, n) => (
        <group
          key={side}
          ref={(el) => {
            arms.current[n] = el;
          }}
        >
          {/* manga (usa el color elegido) */}
          <mesh>
            <capsuleGeometry args={[0.085, 0.34, 4, 12]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.15}
              roughness={0.55}
              metalness={0.15}
            />
          </mesh>
          {/* puño luminoso */}
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.09, 0.013, 8, 24]} />
            <meshStandardMaterial color="#2dd4ff" emissive="#2dd4ff" emissiveIntensity={1.8} />
          </mesh>
          {/* palma */}
          <mesh position={[0, 0.27, 0]} scale={[1, 1.1, 0.7]}>
            <sphereGeometry args={[0.075, 14, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.8} />
          </mesh>
          {/* cuatro dedos, ligeramente curvados */}
          {[-0.045, -0.015, 0.015, 0.045].map((x) => (
            <mesh key={x} position={[x, 0.35, -0.01]} rotation={[-0.25, 0, 0]}>
              <capsuleGeometry args={[0.017, 0.05, 3, 6]} />
              <meshStandardMaterial color={SKIN} roughness={0.8} />
            </mesh>
          ))}
          {/* pulgar, apuntando hacia el centro */}
          <mesh position={[-side * 0.075, 0.28, -0.01]} rotation={[0, 0, side * 0.6]}>
            <capsuleGeometry args={[0.019, 0.045, 3, 6]} />
            <meshStandardMaterial color={SKIN} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------- Avatar + cámara

type AvatarProps = {
  input: MutableRefObject<InputState>;
  projects: Project[];
  color: string;
  resetKey: number;
  lookResetKey: number;
  onNearbyChange: (id: string | null) => void;
  onPositionChange: (x: number, z: number) => void;
};

const SPEED = 6;

function Avatar({
  input,
  projects,
  color,
  resetKey,
  lookResetKey,
  onNearbyChange,
  onPositionChange,
}: AvatarProps) {
  const { camera, gl } = useThree();
  const pos = useRef(new THREE.Vector3(0, 0, 9));
  const yaw = useRef(0);
  const pitch = useRef(-0.04);
  const nearby = useRef<string | null>(null);
  const previousResetKey = useRef(resetKey);
  const previousLookResetKey = useRef(lookResetKey);
  const positionReportTimer = useRef(0);
  const lastReportedPosition = useRef(new THREE.Vector2(0, 9));
  const drag = useRef<{ pointerId: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const cameraLookTarget = useMemo(() => new THREE.Vector3(), []);

  const bounds = useMemo(() => worldBounds(projects.length), [projects.length]);

  useEffect(() => {
    const resetPlayer = previousResetKey.current !== resetKey;
    const resetLook = previousLookResetKey.current !== lookResetKey;
    if (!resetPlayer && !resetLook) return;

    previousResetKey.current = resetKey;
    previousLookResetKey.current = lookResetKey;
    if (resetPlayer) {
      input.current.kx = 0;
      input.current.kz = 0;
      input.current.tx = 0;
      input.current.tz = 0;
      pos.current.set(4, 0, 18);
      nearby.current = null;
      lastReportedPosition.current.set(4, 18);
      onNearbyChange(null);
      onPositionChange(4, 18);
    }
    if (resetPlayer || resetLook) {
      yaw.current = 0;
      pitch.current = -0.04;
    }
  }, [input, lookResetKey, onNearbyChange, onPositionChange, resetKey]);

  useEffect(() => {
    const element = gl.domElement;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target !== element || event.button !== 0) return;
      drag.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
      };
    };
    const onPointerMove = (event: PointerEvent) => {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - current.x;
      const deltaY = event.clientY - current.y;
      if (Math.hypot(deltaX, deltaY) > 2) current.moved = true;
      yaw.current += deltaX * 0.003;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - deltaY * 0.0025,
        -0.75,
        0.65,
      );
      current.x = event.clientX;
      current.y = event.clientY;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (drag.current?.pointerId !== event.pointerId) return;
      suppressClick.current = drag.current.moved;
      drag.current = null;
    };
    const onClick = (event: MouseEvent) => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("click", onClick, true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("click", onClick, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [gl]);

  const stands = useMemo(
    () => projects.map((p, i) => ({ id: p.id, pos: standPosition(i) })),
    [projects],
  );

  // Todo lo que bloquea el paso: el monumento y cada stand.
  const obstacles = useMemo(
    () => [
      { x: MONUMENT.x, z: MONUMENT.z, r: MONUMENT.radius },
      ...stands.map((s) => ({
        x: s.pos.position[0],
        z: s.pos.position[2],
        r: STAND_RADIUS,
      })),
    ],
    [stands],
  );

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05); // evita saltos si la pestaña se pausa
    const i = input.current;

    // 1) dirección deseada (teclado + táctil), normalizada
    let localX = i.kx + i.tx;
    let localZ = i.kz + i.tz;
    const len = Math.hypot(localX, localZ);
    if (len > 1) {
      localX /= len;
      localZ /= len;
    }
    const sinYaw = Math.sin(yaw.current);
    const cosYaw = Math.cos(yaw.current);
    const dx = localX * cosYaw - localZ * sinYaw;
    const dz = localX * sinYaw + localZ * cosYaw;

    // 2) nueva posición
    let nx = pos.current.x + dx * SPEED * dt;
    let nz = pos.current.z + dz * SPEED * dt;

    // 3) límites del escenario
    nx = THREE.MathUtils.clamp(nx, bounds.minX, bounds.maxX);
    nz = THREE.MathUtils.clamp(nz, bounds.minZ, bounds.maxZ);

    // 4) colisiones: si entramos en un círculo, nos empujan hacia afuera
    for (const o of obstacles) {
      const ox = nx - o.x;
      const oz = nz - o.z;
      const d = Math.hypot(ox, oz);
      const min = o.r + PLAYER_RADIUS;
      if (d < min && d > 0.0001) {
        nx = o.x + (ox / d) * min;
        nz = o.z + (oz / d) * min;
      }
    }

    pos.current.set(nx, 0, nz);
    positionReportTimer.current += dt;
    if (
      positionReportTimer.current >= 0.12 &&
      Math.hypot(
        nx - lastReportedPosition.current.x,
        nz - lastReportedPosition.current.y,
      ) >= 0.4
    ) {
      positionReportTimer.current = 0;
      lastReportedPosition.current.set(nx, nz);
      onPositionChange(nx, nz);
    }

    const bob = len > 0.01 ? Math.sin(state.clock.elapsedTime * 10) * 0.035 : 0;
    camera.position.set(pos.current.x, 1.62 + bob, pos.current.z);
    cameraLookTarget.set(
      pos.current.x + Math.sin(yaw.current) * Math.cos(pitch.current),
      1.62 + bob + Math.sin(pitch.current),
      pos.current.z - Math.cos(yaw.current) * Math.cos(pitch.current),
    );
    camera.lookAt(cameraLookTarget);

    // ¿Hay una vitrina cerca? Solo avisamos a React cuando cambia.
    let nearest: string | null = null;
    let best = INTERACT_DISTANCE;
    for (const s of stands) {
      const d = Math.hypot(nx - s.pos.position[0], nz - s.pos.position[2]);
      if (d < best) {
        best = d;
        nearest = s.id;
      }
    }
    if (nearest !== nearby.current) {
      nearby.current = nearest;
      onNearbyChange(nearest);
    }
  });

    return <FirstPersonHands color={color} input={input} />;
}

// ---------------------------------------------------------------- Escena completa

type CampusSceneProps = {
  projects: Project[];
  input: MutableRefObject<InputState>;
  nearbyId: string | null;
  avatarColor: string;
  resetKey: number;
  lookResetKey: number;
  onNearbyChange: (id: string | null) => void;
  onPositionChange: (x: number, z: number) => void;
  onSelect: (id: string) => void;
};

export default function CampusScene({
  projects,
  input,
  nearbyId,
  avatarColor,
  resetKey,
  lookResetKey,
  onNearbyChange,
  onPositionChange,
  onSelect,
}: CampusSceneProps) {
  const bounds = galleryBounds(projects.length);

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [3, 7, bounds.frontZ + 1.5], fov: 45 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#05070f"]} />
      <fog attach="fog" args={["#05070f", 55, 120]} />

      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#b9e8ff", "#11162a", 0.75]} />
      <directionalLight position={[10, 20, 10]} intensity={1.35} />
      <pointLight position={[0, 8, 0]} color="#2dd4ff" intensity={36} distance={38} />

      <Stars radius={90} depth={40} count={1100} factor={3} fade />

      <Ground />
      <Plaza />
      <Gallery projectCount={projects.length} />

      {projects.map((p, i) => (
        <Stand
          key={p.id}
          project={p}
          number={i + 1}
          {...standPosition(i)}
          highlighted={nearbyId === p.id}
          onSelect={onSelect}
        />
      ))}

      <Avatar
        input={input}
        projects={projects}
        color={avatarColor}
        resetKey={resetKey}
        lookResetKey={lookResetKey}
        onNearbyChange={onNearbyChange}
        onPositionChange={onPositionChange}
      />
    </Canvas>
  );
}
