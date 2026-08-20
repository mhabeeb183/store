import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import { DoubleSide } from 'three';

const playSound = (type) => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'hover') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    }
  } catch (e) {}
};

const TeleportRing = ({ pitch, yaw, label, onClick, themeColor = "#10b981" }) => {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef();

  // Camera is at y = 1.7, floor is at y = 0.
  // We project the spherical ray onto the floor plane (y = 0) if pitch is pointing downwards (< -0.15).
  // Otherwise, we float the teleport icon in space.
  const isFloorProjected = pitch < -0.15;
  
  let position = [0, 0, 0];
  let rotation = [0, 0, 0];

  if (isFloorProjected) {
    // Project ray from y = 1.7 to y = 0
    const targetY = -1.69; // relative to camera height of 1.7
    const currentY = Math.sin(pitch);
    const scale = targetY / currentY;
    
    const x = scale * Math.cos(pitch) * Math.sin(yaw);
    const z = scale * Math.cos(pitch) * Math.cos(yaw);
    
    // Limit teleport distance to within 10 meters so it's readable
    const dist = Math.sqrt(x*x + z*z);
    const maxDist = 9.0;
    if (dist > maxDist) {
      const clampX = (x / dist) * maxDist;
      const clampZ = (z / dist) * maxDist;
      position = [clampX, 0.015, clampZ];
    } else {
      position = [x, 0.015, z];
    }
    rotation = [-Math.PI / 2, 0, 0];
  } else {
    // Render as a floating ring in space
    const radius = 8.5;
    const x = radius * Math.cos(pitch) * Math.sin(yaw);
    const y = radius * Math.sin(pitch);
    const z = radius * Math.cos(pitch) * Math.cos(yaw);
    position = [x, y, z];
  }

  useFrame(({ clock }) => {
    if (ringRef.current) {
      if (isFloorProjected) {
        ringRef.current.rotation.z = clock.getElapsedTime() * 0.35;
      } else {
        ringRef.current.rotation.y = clock.getElapsedTime() * 0.5;
      }
    }
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
    playSound('hover');
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  if (isFloorProjected) {
    return (
      <group position={position}>
        {/* Floor teleport circle */}
        <mesh 
          ref={ringRef}
          rotation={rotation}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <ringGeometry args={[0.45, 0.58, 32]} />
          <meshBasicMaterial 
            color={hovered ? '#ffffff' : themeColor} 
            transparent 
            opacity={hovered ? 0.95 : 0.65} 
            side={DoubleSide} 
          />
        </mesh>
        
        {/* Clickable floor circle */}
        <mesh 
          rotation={rotation}
          visible={false}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <circleGeometry args={[0.58]} />
        </mesh>

        {/* Floor Teleport Label Html */}
        <Html position={[0, 0.7, 0]} center distanceFactor={8}>
          <div className="bg-zinc-950/95 border border-zinc-800 text-white px-3.5 py-1.5 rounded-xl shadow-2xl flex flex-col items-center gap-0.5 font-sans pointer-events-none select-none">
            <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">{label}</span>
            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">⚡ Teleport</span>
          </div>
        </Html>
      </group>
    );
  }

  // Floating teleport ring in space
  return (
    <group position={position}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Rotating ring */}
        <mesh ref={ringRef}>
          <ringGeometry args={[0.15, 0.25, 4, 1, 0, Math.PI * 2]} />
          <meshBasicMaterial color={themeColor} transparent opacity={0.7} side={DoubleSide} wireframe />
        </mesh>
        {/* Glowing diamond center */}
        <mesh rotation={[0, 0, Math.PI / 4]} scale={hovered ? 1.3 : 1}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        
        {/* Label */}
        <Html position={[0, 0.5, 0]} center distanceFactor={8}>
          <div className="bg-zinc-950/95 border border-zinc-800 text-white px-3.5 py-1.5 rounded-xl shadow-2xl flex flex-col items-center gap-0.5 font-sans pointer-events-none select-none">
            <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">{label}</span>
            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">⚡ Teleport</span>
          </div>
        </Html>
      </group>
    </group>
  );
};

export default TeleportRing;
