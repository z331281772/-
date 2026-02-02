
import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, Stars, Float, Sparkles, Environment, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import NPC from './NPC';
import BlockyAvatar from './BlockyAvatar';
import { AppState, UserAppearance } from '../types';

interface SceneProps {
  appState: AppState;
  isSpeaking: boolean;
  appearance?: UserAppearance | null;
}

// Global mouse hook helper
const useGlobalMouse = () => {
    const mouseRef = useRef({ x: 0, y: 0 });
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
          mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);
    return mouseRef;
};

// Sky Style: White Ancient Ruins with Gold Accents
const SkyRuins = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mouse = useGlobalMouse(); 
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Very gentle parallax
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, -mouse.current.x * 1.5, 0.05);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, mouse.current.y * 0.5 + Math.sin(t * 0.5) * 0.1, 0.05);
  });

  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: '#F0F0F0',
    roughness: 0.8,
    metalness: 0.1,
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: '#FFD700',
    emissive: '#FFA500',
    emissiveIntensity: 0.2,
    roughness: 0.3,
    metalness: 1,
  });

  return (
    <group ref={groupRef} position={[0, -2, -15]}>
       {/* Left Broken Arch */}
       <Float speed={1} rotationIntensity={0.05} floatIntensity={0.2}>
        <group position={[-8, 4, -5]} rotation={[0, 0.3, 0.1]}>
            <mesh position={[0, 0, 0]} material={stoneMaterial} castShadow>
                <boxGeometry args={[2, 10, 2]} />
            </mesh>
            {/* Gold Inlay */}
            <mesh position={[0.5, 2, 1.01]} material={goldMaterial}>
                <boxGeometry args={[0.5, 2, 0.1]} />
            </mesh>
            {/* Floating Top Piece */}
            <mesh position={[0, 6.5, 0]} rotation={[0.2, 0.2, 0.1]} material={stoneMaterial}>
                <boxGeometry args={[1.8, 1.8, 1.8]} />
            </mesh>
        </group>
       </Float>

       {/* Right Monolith */}
       <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.3} floatingRange={[-0.5, 0.5]}>
        <group position={[8, 3, -2]} rotation={[0, -0.4, -0.05]}>
            <mesh material={stoneMaterial} castShadow>
                <boxGeometry args={[2.5, 8, 2.5]} />
            </mesh>
             <mesh position={[-1.26, 0, 0]} material={goldMaterial}>
                <boxGeometry args={[0.1, 8, 0.5]} />
            </mesh>
        </group>
       </Float>

       {/* Distant Floating Islands */}
       <mesh position={[0, 8, -25]} material={stoneMaterial} rotation={[0,0,0.5]}>
           <coneGeometry args={[3, 4, 4]} />
       </mesh>
       <mesh position={[-15, -5, -20]} material={stoneMaterial}>
           <dodecahedronGeometry args={[4]} />
       </mesh>
    </group>
  );
};

// "Light Creature" particles / Motes of light
const SpiritMotes = () => {
    return (
        <group>
            {/* High up "Stars" or "Light Birds" */}
            <Sparkles count={50} scale={[20, 10, 10]} position={[0, 5, -5]} size={6} speed={0.4} opacity={0.8} color="#FFD700" />
            {/* Ambient dust */}
            <Sparkles count={100} scale={[15, 10, 10]} position={[0, 0, 0]} size={2} speed={0.2} opacity={0.4} color="#FFF" />
        </group>
    );
};

// Analysis Effect: Instead of a Vortex, it's a "Memory Replay" or "Candle Light" convergence
const MemoryLight = () => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        groupRef.current.rotation.y = t * 0.5;
    });

    return (
        <group position={[2.5, 1, 0]} ref={groupRef}> 
            {/* Converging Rings */}
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[1.5, 0.02, 16, 100]} />
                <meshBasicMaterial color="#FFD700" transparent opacity={0.5} />
            </mesh>
            <mesh rotation={[Math.PI/2, 0.5, 0]}>
                <torusGeometry args={[1.2, 0.02, 16, 100]} />
                <meshBasicMaterial color="#FFA500" transparent opacity={0.4} />
            </mesh>
            {/* Rising Light */}
            <Sparkles count={30} scale={[1, 4, 1]} size={10} speed={2} opacity={0.8} color="#FFD700" />
            <pointLight distance={4} intensity={2} color="#FFA500" decay={2} />
        </group>
    );
};

const SceneContent: React.FC<SceneProps> = ({ appState, isSpeaking, appearance }) => {
    const mouse = useGlobalMouse();
    const npcGroupRef = useRef<THREE.Group>(null);
    const avatarGroupRef = useRef<THREE.Group>(null);

    const isSplitComposition = [
      AppState.MIRRORING, 
      AppState.TRANSITIONING, 
      AppState.TRANSFORMED, 
      AppState.CHOOSING_PROBLEM, 
      AppState.NPC_ASKING_DETAIL, 
      AppState.LISTENING_TO_USER, 
      AppState.PROCESSING_REPLY,
      AppState.REFINING,
      AppState.CONCLUSION 
    ].includes(appState);

    useFrame((state, delta) => {
        const { camera } = state;
        // Smoother, dreamier camera movement
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 0.3, 0.02);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2 + mouse.current.y * 0.1, 0.02);
        camera.lookAt(0, 1.5, 0);

        // Animation logic
        if (npcGroupRef.current) {
             const targetX = isSplitComposition ? -2.0 : 0;
             const targetZ = isSplitComposition ? 0 : 0;
             const targetRot = isSplitComposition ? 0.3 : 0;
             
             npcGroupRef.current.position.x = THREE.MathUtils.lerp(npcGroupRef.current.position.x, targetX, delta * 2);
             npcGroupRef.current.position.z = THREE.MathUtils.lerp(npcGroupRef.current.position.z, targetZ, delta * 2);
             npcGroupRef.current.rotation.y = THREE.MathUtils.lerp(npcGroupRef.current.rotation.y, targetRot, delta * 2);
        }

        if (avatarGroupRef.current) {
             const targetX = isSplitComposition ? 2.0 : 0;
             const targetRot = isSplitComposition ? -0.3 : 0;
             // Avatar floats slightly
             avatarGroupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;

             avatarGroupRef.current.position.x = THREE.MathUtils.lerp(avatarGroupRef.current.position.x, targetX, delta * 2);
             avatarGroupRef.current.rotation.y = THREE.MathUtils.lerp(avatarGroupRef.current.rotation.y, targetRot, delta * 2);
        }
    });

    return (
        <>
            {/* Sky Style Lighting: Warm Sun, Bright Ambient */}
            <Environment preset="sunset" blur={0.8} />
            <ambientLight intensity={1.5} color="#E6E6FA" />
            
            {/* The "Sun" */}
            <directionalLight 
                position={[5, 10, -5]} 
                intensity={2.5} 
                color="#FFD699" 
                castShadow 
                shadow-bias={-0.0001}
            />
            {/* Fill Light (Blue Sky Reflection) */}
            <pointLight position={[-10, 5, 5]} intensity={1} color="#87CEEB" distance={20} decay={2} />
            
            <SkyRuins />
            <SpiritMotes />

            {/* VOLUMETRIC CLOUDS - The essence of "Sky" */}
            <group position={[0, -2, -5]}>
                <Cloud opacity={0.5} speed={0.2} bounds={[10, 2, 1.5]} segments={20} color="#FFFFFF" />
            </group>
            <group position={[8, 0, -10]}>
                 <Cloud opacity={0.4} speed={0.1} bounds={[8, 2, 1]} segments={15} color="#FFE4E1" />
            </group>
            <group position={[-8, 2, -12]}>
                 <Cloud opacity={0.4} speed={0.15} bounds={[8, 2, 1]} segments={15} color="#E0FFFF" />
            </group>

            <group ref={npcGroupRef}>
                <NPC appState={appState} isSpeaking={isSpeaking} />
            </group>

            {appState === AppState.ANALYZING && (
                <MemoryLight />
            )}

            <group ref={avatarGroupRef}>
                <BlockyAvatar appState={appState} appearance={appearance || null} />
            </group>

            {/* Cloud Floor Reflection/Mist */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
                <planeGeometry args={[100, 100]} />
                <MeshReflectorMaterial
                    blur={[300, 100]}
                    resolution={1024}
                    mixBlur={1}
                    mixStrength={30}
                    roughness={1}
                    depthScale={1.2}
                    minDepthThreshold={0.4}
                    maxDepthThreshold={1.4}
                    color="#f5f5f5" 
                    metalness={0.1}
                    mirror={0.5}
                />
            </mesh>
            
            {/* Distance Fog - Matches background */}
            <fog attach="fog" args={['#FFFFFF', 5, 35]} />
        </>
    );
}

const Scene: React.FC<SceneProps> = ({ appState, isSpeaking, appearance }) => {
  return (
    <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ position: [0, 2, 8], fov: 40 }} // Tighter FOV for cinematic feel
        gl={{ 
            alpha: true, 
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2
        }} 
    >
        <SceneContent appState={appState} isSpeaking={isSpeaking} appearance={appearance} />
    </Canvas>
  );
};

export default Scene;
