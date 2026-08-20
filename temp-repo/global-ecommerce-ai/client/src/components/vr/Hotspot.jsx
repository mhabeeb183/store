import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';

const Hotspot = ({ pitch, yaw, onClick, themeColor = "#3b82f6", label = "" }) => {
  const ringRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Convert Pitch & Yaw (spherical coordinates) to Cartesian X, Y, Z
  const radius = 9.5; // Slightly closer than sphere background
  const x = radius * Math.cos(pitch) * Math.sin(yaw);
  const y = radius * Math.sin(pitch);
  const z = radius * Math.cos(pitch) * Math.cos(yaw);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 6) * 0.25;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  return (
    <Billboard position={[x, y, z]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {/* Pulsing Outer Neon Ring */}
        <mesh ref={ringRef}>
          <ringGeometry args={[0.1, 0.22, 32]} />
          <meshBasicMaterial color={themeColor} transparent opacity={0.8} depthWrite={false} />
        </mesh>
        
        {/* Inner Solid White Dot */}
        <mesh scale={hovered ? 1.3 : 1}>
          <circleGeometry args={[0.065, 32]} />
          <meshBasicMaterial color="#ffffff" depthWrite={false} />
        </mesh>
      </group>
    </Billboard>
  );
};

export default Hotspot;
