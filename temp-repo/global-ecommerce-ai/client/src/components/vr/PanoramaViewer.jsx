import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useTexture, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { DoubleSide } from 'three';

import Hotspot from './Hotspot';
import TeleportRing from './TeleportRing';

// Camera controller to smoothly pan the camera to a target pitch/yaw (for Search Inside VR)
const CameraController = ({ lookAtCoords, controlsRef }) => {
  useFrame(() => {
    if (lookAtCoords && controlsRef.current) {
      const controls = controlsRef.current;
      
      // Calculate target azimuthal and polar angles
      // Azimuthal angle: yaw
      // Polar angle: PI / 2 - pitch
      const targetAzimuth = lookAtCoords.yaw;
      const targetPolar = Math.PI / 2 - lookAtCoords.pitch;

      // Smoothly lerp angles
      const currentAzimuth = controls.getAzimuthalAngle();
      const currentPolar = controls.getPolarAngle();
      
      controls.setAzimuthalAngle(THREE.MathUtils.lerp(currentAzimuth, targetAzimuth, 0.08));
      controls.setPolarAngle(THREE.MathUtils.lerp(currentPolar, targetPolar, 0.08));
      controls.update();
    }
  });

  return null;
};

// Panorama 360 projection mapping component
const PanoramaBackground = ({ panoramaUrl, onDoubleClick }) => {
  const texture = useTexture(panoramaUrl);

  const handleMeshDoubleClick = (e) => {
    if (!onDoubleClick) return;
    e.stopPropagation();
    
    const point = e.point;
    // Calculate distance from center to get sphere radius
    const radius = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
    
    // Azimuthal angle (yaw) around vertical axis (Y in Three.js)
    const yaw = Math.atan2(point.x, point.z);
    
    // Elevation angle (pitch) from horizontal plane
    const pitch = Math.asin(point.y / radius);

    // Call visual placement handler
    onDoubleClick(pitch, yaw);
  };

  return (
    <mesh 
      scale={[-1, 1, 1]} 
      rotation={[0, -Math.PI / 2, 0]}
      onDoubleClick={handleMeshDoubleClick}
    >
      <sphereGeometry args={[14, 60, 40]} />
      <meshBasicMaterial map={texture} side={DoubleSide} />
    </mesh>
  );
};

const PanoramaViewer = ({ 
  activeScene, 
  hotspots, 
  onHotspotClick, 
  onTeleportClick, 
  isEditingHotspots, 
  onVisualPlacement, 
  lookAtCoords,
  highlightedHotspotId,
  activeColor = "#3b82f6"
}) => {
  const controlsRef = useRef();

  // Reset OrbitControls center target to camera level
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 1.7, 0);
      controlsRef.current.update();
    }
  }, [activeScene]);

  return (
    <div className="w-full h-full">
      <Canvas 
        dpr={isMobile() ? 1 : [1, 1.5]} 
        camera={{ position: [0, 1.7, 0.1], fov: 60 }} // Camera set at human height
      >
        <ambientLight intensity={1.2} />
        
        {/* Render 360 Background */}
        {activeScene?.panoramaUrl && (
          <Suspense fallback={null}>
            <PanoramaBackground 
              panoramaUrl={activeScene.panoramaUrl} 
              onDoubleClick={isEditingHotspots ? onVisualPlacement : null}
            />
          </Suspense>
        )}

        {/* Ambient star particles for sky integration */}
        <Stars 
          radius={80} 
          depth={20} 
          count={500} 
          factor={4} 
          saturation={0.5} 
          fade 
          speed={1} 
        />

        {/* Render Hotspots & Teleport Rings dynamically */}
        <Suspense fallback={null}>
          {hotspots.map((hotspot) => {
            const isHighlighted = highlightedHotspotId === hotspot._id;
            
            if (hotspot.type === "product" && hotspot.productId) {
              return (
                <Hotspot
                  key={hotspot._id}
                  pitch={hotspot.pitch}
                  yaw={hotspot.yaw}
                  label={hotspot.label || hotspot.productId.name}
                  themeColor={isHighlighted ? "#fbbf24" : activeColor} // Gold if searched
                  onClick={() => onHotspotClick(hotspot.productId)}
                />
              );
            } else if (hotspot.type === "teleport" && hotspot.targetSceneId) {
              return (
                <TeleportRing
                  key={hotspot._id}
                  pitch={hotspot.pitch}
                  yaw={hotspot.yaw}
                  label={hotspot.label || `${hotspot.targetSceneId.name} Department`}
                  themeColor="#10b981"
                  onClick={() => onTeleportClick(hotspot.targetSceneId.name)}
                />
              );
            }
            return null;
          })}
        </Suspense>

        {/* Camera transition for search query */}
        <CameraController lookAtCoords={lookAtCoords} controlsRef={controlsRef} />

        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          enableZoom={true}
          minDistance={0.1}
          maxDistance={12}
          enablePan={false} // Lock position to standing center
          target={[0, 1.7, 0]} // Orbit around camera height
        />
      </Canvas>
    </div>
  );
};

// Utility function to check mobile status
const isMobile = () => {
  return typeof window !== "undefined" ? /Mobi|Android/i.test(navigator.userAgent) : false;
};

export default PanoramaViewer;
