
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float, Sphere, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';
import { AppState, UserAppearance } from '../types';

interface BlockyAvatarProps {
  appState: AppState;
  appearance: UserAppearance | null;
}

// "Moth" Form - The Beginner Look in Sky
const RudimentaryForm: React.FC<{ appearance: UserAppearance | null }> = ({ appearance }) => {
    // Default Moth Colors if analysis fails, otherwise adapt slightly
    const skin = "#404040"; // Shadowy skin
    const cape = appearance ? "#8B4513" : "#8B4513"; // Brown Cape (Default Moth)
    const hair = "#D3D3D3"; // Moth hair is usually light/beige

    return (
        <group>
            {/* HEAD */}
            <mesh position={[0, 1.5, 0]}>
                <sphereGeometry args={[0.3, 32, 32]} />
                <meshStandardMaterial color={skin} roughness={0.9} />
            </mesh>
            {/* HAIR (Simple Bob) */}
            <mesh position={[0, 1.6, -0.05]}>
                <sphereGeometry args={[0.32, 32, 32, 0, Math.PI * 2, 0, Math.PI/2]} />
                <meshStandardMaterial color={hair} roughness={1} />
            </mesh>
            {/* EYES (Glowing Yellow for Moth) */}
            <mesh position={[-0.1, 1.5, 0.25]}>
                <circleGeometry args={[0.06, 16]} />
                <meshBasicMaterial color="#FFD700" />
            </mesh>
            <mesh position={[0.1, 1.5, 0.25]}>
                <circleGeometry args={[0.06, 16]} />
                <meshBasicMaterial color="#FFD700" />
            </mesh>

            {/* BODY (Tunnic) */}
            <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.1, 0.3, 1.0, 32]} />
                <meshStandardMaterial color="#D2B48C" roughness={0.9} />
            </mesh>

            {/* CAPE (Brown Moth Cape) */}
            <mesh position={[0, 0.9, -0.2]} rotation={[0.2, 0, 0]}>
                <coneGeometry args={[0.5, 1.2, 32, 1, true, 0, Math.PI]} />
                <meshStandardMaterial color={cape} side={THREE.DoubleSide} roughness={1} />
            </mesh>
            {/* Cape Star (Wing Light) */}
             <mesh position={[0, 1.0, -0.25]} rotation={[0.2, 0, 0]}>
                <boxGeometry args={[0.15, 0.15, 0.05]} />
                <meshBasicMaterial color="#FFD700" opacity={0.5} transparent />
            </mesh>

            {/* LEGS */}
            <mesh position={[-0.15, 0.2, 0]}>
                <cylinderGeometry args={[0.06, 0.05, 0.4]} />
                <meshStandardMaterial color={skin} />
            </mesh>
            <mesh position={[0.15, 0.2, 0]}>
                <cylinderGeometry args={[0.06, 0.05, 0.4]} />
                <meshStandardMaterial color={skin} />
            </mesh>
        </group>
    );
};

// "Ascended" Form - Glowing Spirit Look
const RefinedForm: React.FC<{ appearance: UserAppearance | null }> = ({ appearance }) => {
    const groupRef = useRef<THREE.Group>(null);
    
    // Adapt user colors to a glowing pastel palette
    const skin = appearance ? appearance.skinColor : "#FFFFFF";
    // Force colors towards light/gold spectrum
    const glowColor = "#FFD700";

    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        groupRef.current.position.y = Math.sin(t * 1) * 0.05;
    });

    return (
        <group ref={groupRef}>
             {/* Inner Glow Core */}
             <pointLight position={[0, 1.2, 0]} intensity={2} distance={4} color={glowColor} />

            {/* HEAD: Pure Light */}
            <mesh position={[0, 1.6, 0]}>
                <sphereGeometry args={[0.32, 64, 64]} />
                <meshPhysicalMaterial 
                    color={skin}
                    emissive={skin}
                    emissiveIntensity={0.5}
                    roughness={0}
                    transmission={0.4}
                    thickness={1}
                />
            </mesh>
            
            {/* CROWN / HALO */}
            <mesh position={[0, 2.0, 0]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.25, 0.01, 16, 100]} />
                <meshBasicMaterial color="#FFF" />
            </mesh>
             <mesh position={[0, 2.0, 0]} rotation={[Math.PI/2, 0, 0]}>
                <torusGeometry args={[0.25, 0.01, 16, 100]} />
                <meshBasicMaterial color="#FFF" />
            </mesh>

            {/* BODY: Floating Spirit Robes */}
            <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.1, 0.4, 1.2, 32, 1, true]} />
                 <meshPhysicalMaterial 
                    color={glowColor}
                    emissive="#FFA500"
                    emissiveIntensity={0.2}
                    transparent
                    opacity={0.8}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* WINGS: Translucent Energy */}
            <group position={[0, 1.0, -0.1]}>
                <Float speed={3} rotationIntensity={0.5} floatIntensity={0}>
                    <mesh rotation={[0, 0, 0.5]} position={[-0.6, 0, 0]}>
                         <planeGeometry args={[1, 1.5]} />
                         <meshBasicMaterial color={glowColor} transparent opacity={0.3} side={THREE.DoubleSide} />
                    </mesh>
                </Float>
                <Float speed={3} rotationIntensity={0.5} floatIntensity={0}>
                    <mesh rotation={[0, 0, -0.5]} position={[0.6, 0, 0]}>
                         <planeGeometry args={[1, 1.5]} />
                         <meshBasicMaterial color={glowColor} transparent opacity={0.3} side={THREE.DoubleSide} />
                    </mesh>
                </Float>
            </group>

            {/* HEART: The Diamond Shape */}
            <mesh position={[0, 1.0, 0.15]} rotation={[0, Math.PI/4, 0]}>
                <octahedronGeometry args={[0.1]} />
                <meshBasicMaterial color="#FFF" />
            </mesh>
        </group>
    );
};

const BlockyAvatar: React.FC<BlockyAvatarProps> = ({ appState, appearance }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const isActive = [
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

  const isRefined = appState === AppState.REFINING || appState === AppState.CONCLUSION;

  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Visibility Scale
    const targetScale = isActive ? 1 : 0;
    const currentScale = groupRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.08);
    groupRef.current.scale.set(newScale, newScale, newScale);

    // Look at mouse
    if (isActive) {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouseRef.current.x * 0.4, 0.1);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseRef.current.y * 0.2, 0.1);
    }
  });

  const rudimentaryScale = useRef(1);
  const refinedScale = useRef(0);

  useFrame(() => {
      const targetRudimentary = isRefined ? 0 : 1;
      const targetRefined = isRefined ? 1 : 0;
      
      rudimentaryScale.current = THREE.MathUtils.lerp(rudimentaryScale.current, targetRudimentary, 0.05);
      refinedScale.current = THREE.MathUtils.lerp(refinedScale.current, targetRefined, 0.05);
  });

  if (appState === AppState.FOGGY || appState === AppState.CLEARING || appState === AppState.AWAKENED) return null;

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={groupRef} position={[0, 0, 0]}>
        
        {isRefined && (
            <Sparkles count={50} scale={3} size={6} speed={2} opacity={0.8} color="#FFF" />
        )}

        {/* 1. Moth Form (Beginner) */}
        <group scale={[rudimentaryScale.current, rudimentaryScale.current, rudimentaryScale.current]}>
            <RudimentaryForm appearance={appearance} />
        </group>

        {/* 2. Ascended Form (Final) */}
        <group scale={[refinedScale.current, refinedScale.current, refinedScale.current]}>
            <RefinedForm appearance={appearance} />
        </group>

      </group>
    </Float>
  );
};

export default BlockyAvatar;
