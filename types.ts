
import React from 'react';

export enum AppState {
  FOGGY = 'FOGGY',
  CLEARING = 'CLEARING',
  AWAKENED = 'AWAKENED',
  RECORDING = 'RECORDING', // Camera active
  ANALYZING = 'ANALYZING', // Processing image with Gemini
  MIRRORING = 'MIRRORING', // Avatar active, mirroring user
  TRANSITIONING = 'TRANSITIONING', // Final speech
  TRANSFORMED = 'TRANSFORMED', // Ready for Phase 2
  CHOOSING_PROBLEM = 'CHOOSING_PROBLEM', // Showing cards
  NPC_ASKING_DETAIL = 'NPC_ASKING_DETAIL', // NPC asking follow-up
  LISTENING_TO_USER = 'LISTENING_TO_USER', // Recording user voice
  PROCESSING_REPLY = 'PROCESSING_REPLY', // Analyzing user voice
  REFINING = 'REFINING', // NPC gives feedback and Avatar transforms
  CONCLUSION = 'CONCLUSION' // Final state
}

export interface UserAppearance {
  skinColor: string;
  hairColor: string;
  clothingColor: string;
}

export interface Coordinates {
  x: number;
  y: number;
}

// Fix: Augmenting the global JSX namespace to include Three.js elements.
// This is necessary for React Three Fiber to work correctly with TypeScript.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      sphereGeometry: any;
      meshPhysicalMaterial: any;
      cylinderGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      coneGeometry: any;
      pointLight: any;
      ambientLight: any;
      boxGeometry: any;
      dodecahedronGeometry: any;
      planeGeometry: any;
      fog: any;
      [elemName: string]: any;
    }
  }
}
