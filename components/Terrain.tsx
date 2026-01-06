
import React, { useMemo } from 'react';
import { BufferGeometry, BufferAttribute } from 'three';
import { getTerrainHeight } from '../utils/helpers';
import { SandMaterial } from './materials/SandMaterial';
import { IceMaterial } from './materials/IceMaterial';
import { CanyonMaterial } from './materials/CanyonMaterial';
import { CrystalMaterial } from './materials/CrystalMaterial';
import { TerrainType } from '../types';

interface TerrainProps {
  color?: string;
  type?: TerrainType;
}

const Terrain: React.FC<TerrainProps> = ({ color = "#f4a460", type = 'sand' }) => {
  const size = 480;
  // OPTIMIZATION: Reduced segments to 128.
  // 128 segments = ~32k tris. This is very lightweight for a modern GPU.
  const segments = 128;

  const geometry = useMemo(() => {
    const positions = [];
    const indices = [];
    const uvs = [];

    const halfSize = size / 2;
    const segmentSize = size / segments;

    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const x = i * segmentSize - halfSize;
        const z = j * segmentSize - halfSize;
        
        // Pass the Type to the height generator
        const y = getTerrainHeight(x, z, type as TerrainType);

        positions.push(x, y, z);
        uvs.push(i / segments, j / segments);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = i * (segments + 1) + j + 1;
        const c = (i + 1) * (segments + 1) + j;
        const d = (i + 1) * (segments + 1) + j + 1;

        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    geo.setIndex(indices);
    
    // For crystal, we might want flat shading which re-calcs normals per face in the shader,
    // but computing vertex normals here gives a good base for other types.
    geo.computeVertexNormals();

    return geo;
  }, [type]); // Re-generate geometry when type changes

  if (type === 'grid') {
      return (
        <group>
            {/* Solid Dark Base to block view below */}
            <mesh receiveShadow castShadow>
              <primitive object={geometry} attach="geometry" />
              <meshStandardMaterial color="#050508" roughness={0.9} />
            </mesh>

            {/* Wireframe Overlay */}
            <mesh position={[0, 0.02, 0]}>
                <primitive object={geometry} attach="geometry" />
                <meshBasicMaterial 
                    wireframe 
                    color={color} 
                    transparent 
                    opacity={0.3} 
                />
            </mesh>
        </group>
      );
  }

  if (type === 'ice') {
    return (
        <group>
            <mesh receiveShadow castShadow>
                <primitive object={geometry} attach="geometry" />
                <IceMaterial color={color} />
            </mesh>
        </group>
    );
  }

  if (type === 'canyon') {
    return (
        <group>
            <mesh receiveShadow castShadow>
                <primitive object={geometry} attach="geometry" />
                <CanyonMaterial color={color} />
            </mesh>
        </group>
    );
  }

  if (type === 'crystal') {
      return (
        <group>
            <mesh receiveShadow castShadow>
                <primitive object={geometry} attach="geometry" />
                <CrystalMaterial color={color} />
            </mesh>
        </group>
      );
  }

  // Default: Sand
  return (
    <group>
        <mesh receiveShadow castShadow>
          <primitive object={geometry} attach="geometry" />
          <SandMaterial color={color} />
        </mesh>
    </group>
  );
};

export default Terrain;
