"use client";

// Elementos decorativos que le dan "vida" a la sala. Todo es animación pura:
// no hay luces nuevas (son caras en celulares) y los pulsos usan una sola
// malla instanciada. No afecta colisiones ni datos.

import { useMemo, useRef } from "react";
import { Billboard, Sparkles, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MONUMENT, galleryBounds } from "@/lib/layout";

const CYAN = "#2dd4ff";
const MAGENTA = "#e45cff";

const BANNER_TEXTS = [
  "BIENVENIDO AL CAMPUS",
  "EXPLORA LOS PROYECTOS",
  "DESCUBRE IDEAS NUEVAS",
  "INSPÍRATE CON TUS COMPAÑEROS",
];

// ---------------------------------------------------------------- Pulsos en el pasillo
// Pequeñas luces que corren por las dos líneas neón del suelo, de la entrada al fondo.

function AisleLights({ frontZ, backZ }: { frontZ: number; backZ: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const perLine = 5;
  const length = frontZ - backZ - 1.5;

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    let n = 0;
    for (const x of [-1.85, 1.85]) {
      for (let i = 0; i < perLine; i++) {
        const d = (t * 6 + (i * length) / perLine) % length;
        dummy.position.set(x, 0.07, frontZ - 0.5 - d);
        dummy.updateMatrix();
        m.setMatrixAt(n++, dummy.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, perLine * 2]}
      frustumCulled={false}
      raycast={() => null}
    >
      <boxGeometry args={[0.1, 0.04, 0.9]} />
      <meshBasicMaterial color="#9ff0ff" toneMapped={false} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------- Drones guía
// Patrullan lentamente por encima de los stands (y = 4.6, por encima de todo).

type DroneProps = { cx: number; cz: number; ax: number; az: number; seed: number };

function Drone({ cx, cz, ax, az, seed }: DroneProps) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ahead = useMemo(() => new THREE.Vector3(), []);

  const pathAt = (t: number, out: THREE.Vector3) =>
    out.set(
      cx + Math.sin(t * 0.21 + seed) * ax,
      4.6 + Math.sin(t * 1.7 + seed) * 0.25,
      cz + Math.sin(t * 0.13 + seed * 2) * az,
    );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    pathAt(t, g.position);
    pathAt(t + 0.2, ahead);
    g.lookAt(ahead); // el "ojo" mira hacia donde vuela
    if (ring.current) ring.current.rotation.z = t * 3;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color="#16233f" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.17]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>
      {/* halo con una cuenta que orbita */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh ref={ring}>
          <torusGeometry args={[0.32, 0.012, 8, 32]} />
          <meshBasicMaterial color={CYAN} toneMapped={false} />
          <mesh position={[0.32, 0, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color={MAGENTA} toneMapped={false} />
          </mesh>
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------- Carteles holográficos
// Pantallas flotantes en las paredes laterales, con una línea de escaneo.

type BannerProps = {
  position: [number, number, number];
  rotationY: number;
  text: string;
};

function Banner({ position, rotationY, text }: BannerProps) {
  const scan = useRef<THREE.Mesh>(null);
  const seed = Math.abs(position[2]) * 0.13;

  useFrame((state) => {
    if (!scan.current) return;
    const p = (state.clock.elapsedTime * 0.4 + seed) % 1;
    scan.current.position.y = p * 1.5 - 0.75;
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh raycast={() => null}>
        <planeGeometry args={[4.6, 1.7]} />
        <meshBasicMaterial color="#07203a" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* marco neón */}
      {[-0.85, 0.85].map((y) => (
        <mesh key={y} position={[0, y, 0.01]} raycast={() => null}>
          <boxGeometry args={[4.6, 0.04, 0.02]} />
          <meshBasicMaterial color={CYAN} toneMapped={false} />
        </mesh>
      ))}
      {[-2.3, 2.3].map((x) => (
        <mesh key={x} position={[x, 0, 0.01]} raycast={() => null}>
          <boxGeometry args={[0.04, 1.7, 0.02]} />
          <meshBasicMaterial color={CYAN} toneMapped={false} />
        </mesh>
      ))}
      <Text
        position={[0, 0, 0.03]}
        fontSize={0.28}
        maxWidth={4.2}
        color="#bff6ff"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
      >
        {text}
      </Text>
      {/* línea de escaneo */}
      <mesh ref={scan} position={[0, 0, 0.02]} raycast={() => null}>
        <planeGeometry args={[4.5, 0.05]} />
        <meshBasicMaterial
          color={CYAN}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- Vida en la plaza
// Ondas que salen del monumento, satélites orbitando y un título que siempre mira al jugador.

function PlazaLife() {
  const ripples = useRef<(THREE.Mesh | null)[]>([]);
  const sats = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ripples.current.forEach((m, i) => {
      if (!m) return;
      const p = (t / 3.2 + i / 2) % 1;
      m.scale.setScalar(1.6 + p * 4.6); // de 1.6 a 6.2 (la plaza llega a 6.4)
      (m.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - p);
    });
    if (sats.current) sats.current.rotation.y = t * 0.7;
  });

  return (
    <group position={[MONUMENT.x, 0, MONUMENT.z]}>
      {[0, 1].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            ripples.current[i] = el;
          }}
          position={[0, 0.14, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <ringGeometry args={[0.97, 1, 64]} />
          <meshBasicMaterial
            color={CYAN}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      <group position={[0, 1.9, 0]} rotation={[0.35, 0, 0]}>
        <group ref={sats}>
          {[0, 1, 2].map((i) => {
            const a = (i * Math.PI * 2) / 3;
            return (
              <mesh key={i} position={[Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9]} raycast={() => null}>
                <octahedronGeometry args={[0.14]} />
                <meshBasicMaterial color={i % 2 ? CYAN : MAGENTA} toneMapped={false} />
              </mesh>
            );
          })}
        </group>
      </group>

      <Billboard position={[0, 4.6, 0]}>
        <Text
          fontSize={0.55}
          color="#ffffff"
          outlineWidth={0.02}
          outlineColor={CYAN}
          anchorX="center"
          anchorY="middle"
        >
          CAMPUS VIRTUAL 3D
        </Text>
        <Text position={[0, -0.55, 0]} fontSize={0.2} color="#9bd9ff" anchorX="center" anchorY="middle">
          Galería de proyectos
        </Text>
      </Billboard>
    </group>
  );
}

// ---------------------------------------------------------------- Cortina de energía en la entrada
// Un velo muy tenue que respira entre los pilares de la entrada a la galería.

function EntranceVeil({ z }: { z: number }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (mat.current) mat.current.opacity = 0.05 + Math.sin(state.clock.elapsedTime * 1.4) * 0.02;
  });

  return (
    <mesh position={[0, 4.15, z]} raycast={() => null}>
      <planeGeometry args={[10.9, 8.1]} />
      <meshBasicMaterial
        ref={mat}
        color={CYAN}
        transparent
        opacity={0.05}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------- Conjunto

export default function AmbientLife({ projectCount }: { projectCount: number }) {
  const b = useMemo(() => galleryBounds(projectCount), [projectCount]);

  // Carteles a mitad de camino entre dos costillas de la pared (z = 4, -4, -12, ...).
  const bannerZs = useMemo(() => {
    const zs: number[] = [];
    for (let z = b.frontZ - 7; z > b.backZ + 4; z -= 8) zs.push(z);
    return zs;
  }, [b]);

  const patrolZ = Math.max(4, b.length / 2 - 5);

  return (
    <group>
      <AisleLights frontZ={b.frontZ} backZ={b.backZ} />
      <EntranceVeil z={b.frontZ} />
      <PlazaLife />

      <Drone cx={0} cz={b.centerZ} ax={8} az={patrolZ} seed={0} />
      <Drone cx={0} cz={b.centerZ} ax={5} az={patrolZ} seed={2.1} />
      <Drone cx={0} cz={b.centerZ} ax={10} az={patrolZ} seed={4.2} />

      {bannerZs.map((z, i) => (
        <group key={z}>
          <Banner
            position={[-(b.halfWidth - 0.7), 4.6, z]}
            rotationY={Math.PI / 2}
            text={BANNER_TEXTS[i % BANNER_TEXTS.length]}
          />
          <Banner
            position={[b.halfWidth - 0.7, 4.6, z]}
            rotationY={-Math.PI / 2}
            text={BANNER_TEXTS[(i + 2) % BANNER_TEXTS.length]}
          />
        </group>
      ))}

      {/* polvo luminoso en toda la galería */}
      <Sparkles
        count={70}
        position={[0, 4.5, b.centerZ]}
        scale={[b.halfWidth * 2 - 2, 8, b.length - 2]}
        size={1.8}
        speed={0.15}
        opacity={0.35}
        color="#9bd9ff"
      />
    </group>
  );
}