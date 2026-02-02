
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { AppState } from '../types';

interface NPCProps {
  appState: AppState;
  isSpeaking: boolean;
}

const NPC: React.FC<NPCProps> = ({ appState, isSpeaking }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const soulLightRef = useRef<THREE.PointLight>(null);
  const candleFlameRef = useRef<THREE.Mesh>(null);
  
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const isAwakened = appState === AppState.AWAKENED;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // 1. Position: Hover logic
    const targetZ = isAwakened ? 3.5 : 0;
    const baseY = isAwakened ? 0.5 : 0.3; 
    
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.03);
    groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y, 
        baseY + Math.sin(t * 1) * 0.05, 
        0.05
    );
    
    // 2. Head Tracking
    if (headGroupRef.current) {
        let targetHeadRotY = 0;
        let targetHeadRotX = 0;

        if (isAwakened) {
            targetHeadRotY = mouseRef.current.x * 0.5; 
            targetHeadRotX = -mouseRef.current.y * 0.3; 
        } else {
            targetHeadRotY = Math.sin(t * 0.5) * 0.1;
            targetHeadRotX = 0.2; // Head bowed down
        }
        
        headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, targetHeadRotY, 0.1);
        headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, targetHeadRotX, 0.1);
    }

    // 3. Candle/Soul Light Animation
    if (soulLightRef.current && candleFlameRef.current) {
        let targetIntensity = 1.5;
        let targetScale = 1;

        if (isSpeaking) {
            // Flicker when speaking
            const pulse = Math.sin(t * 20) * 0.5 + 0.5;
            targetIntensity = 2 + pulse * 1.5; 
            targetScale = 1 + pulse * 0.3; 
        } else {
            // Gentle candle flicker
            const flicker = Math.sin(t * 10) * 0.1;
            targetIntensity = 1.5 + flicker;
        }

        soulLightRef.current.intensity = THREE.MathUtils.lerp(soulLightRef.current.intensity, targetIntensity, 0.2);
        
        const s = 0.15 * targetScale;
        candleFlameRef.current.scale.set(s, s*1.5, s);
        candleFlameRef.current.position.y = 0.5 + Math.sin(t * 2) * 0.02; // Hand float
    }
  });

  // Sky Aesthetic Colors
  const ROBE_COLOR = "#E6E6FA"; // Lavenderish White
  const MASK_COLOR = "#FFFFFF"; // Pure White
  const GOLD_ACCENT = "#FFD700";

  return (
      <group ref={groupRef} position={[0, 0.5, 0]}>
        
        {/* Ambient Spirit Particles */}
        <Sparkles count={30} scale={2.5} size={3} speed={0.4} opacity={0.5} color="#FFD700" />
        
        {/* --- HEAD GROUP --- */}
        <group ref={headGroupRef} position={[0, 1.4, 0]}>
            {/* 1. Hair / Hood (Smooth White Shape) */}
            <mesh position={[0, 0.1, -0.05]}>
                <sphereGeometry args={[0.32, 32, 32]} />
                <meshStandardMaterial color="#F0F0F0" roughness={0.9} />
            </mesh>
            
            {/* 2. The Mask (Sky Style - Glowing White Face) */}
            <mesh position={[0, 0, 0.22]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.15, 0.35, 32, 1, false, 0, Math.PI * 2]} />
                 <meshPhysicalMaterial 
                    color={MASK_COLOR}
                    roughness={0.2}
                    metalness={0.1}
                    emissive={MASK_COLOR}
                    emissiveIntensity={0.2}
                />
            </mesh>

            {/* 3. Eyes (Glowing Slits) */}
            <mesh position={[-0.08, 0.05, 0.36]} rotation={[0.1, 0, 0]}>
                 <capsuleGeometry args={[0.02, 0.08, 4, 8]} />
                 <meshBasicMaterial color={GOLD_ACCENT} />
            </mesh>
            <mesh position={[0.08, 0.05, 0.36]} rotation={[0.1, 0, 0]}>
                 <capsuleGeometry args={[0.02, 0.08, 4, 8]} />
                 <meshBasicMaterial color={GOLD_ACCENT} />
            </mesh>

            {/* 4. Forehead Glyph */}
            <mesh position={[0, 0.18, 0.32]} rotation={[-0.2, 0, 0]}>
                 <boxGeometry args={[0.08, 0.08, 0.02]} />
                 <meshBasicMaterial color={GOLD_ACCENT} />
            </mesh>
        </group>

        {/* --- BODY --- */}
        {/* Robe / Poncho */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.1, 0.45, 1.4, 32]} />
          <MeshDistortMaterial
            color={ROBE_COLOR}
            speed={0.5} 
            distort={0.1} 
            radius={1}
            roughness={0.8}
          />
        </mesh>

        {/* Cape (Back) */}
        <mesh position={[0, 0.7, -0.25]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.6, 1.2, 0.05]} />
             <meshStandardMaterial color="#B0C4DE" roughness={0.8} />
        </mesh>
        {/* Cape Pattern (Gold) */}
        <mesh position={[0, 0.9, -0.27]} rotation={[0.2, 0, 0]}>
             <boxGeometry args={[0.2, 0.2, 0.06]} />
             <meshBasicMaterial color={GOLD_ACCENT} />
        </mesh>

        {/* --- HANDS & CANDLE --- */}
        {/* Right Hand holding Candle */}
        <group position={[0.3, 0.6, 0.3]}>
            <mesh>
                 <sphereGeometry args={[0.07, 16, 16]} />
                 <meshStandardMaterial color="#333" />
            </mesh>
            {/* Candle Stick */}
            <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.4, 16]} />
                <meshStandardMaterial color="#FFF" />
            </mesh>
            {/* FLAME (The Soul Light) */}
            <mesh ref={candleFlameRef} position={[0, 0.5, 0]}>
                 <dodecahedronGeometry args={[0.15, 0]} />
                 <meshBasicMaterial color="#FFA500" />
            </mesh>
            <pointLight ref={soulLightRef} distance={4} intensity={2} color="#FF8C00" decay={2} position={[0, 0.5, 0]} />
        </group>

        {/* Left Hand relaxed */}
        <mesh position={[-0.35, 0.5, 0.1]}>
             <sphereGeometry args={[0.07, 16, 16]} />
             <meshStandardMaterial color="#333" />
        </mesh>

      </group>
  );
};

export default NPC;
