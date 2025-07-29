import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Circuit } from '../types/quantum'; // Assuming Circuit type is correctly defined

interface BlochSphereProps {
  circuit: Circuit; // This prop is used in calculateQubitState
  numQubits: number; // This prop is used in calculateQubitState and qubit selector
  className?: string;
  // These props are from the user's provided file and are passed to SphereComponent
  theta?: number; 
  phi?: number;
  amplitude?: [number, number];
  showLabels?: boolean;
  autoRotate?: boolean;
  showProbabilities?: boolean;
  animationSpeed?: number;
}

// Main Sphere Component for Three.js rendering
const SphereComponent: React.FC<{
  theta: number;
  phi: number;
  amplitude?: [number, number];
  showLabels: boolean;
  showProbabilities: boolean;
}> = ({ theta, phi, amplitude, showLabels, showProbabilities }) => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const vectorRef = useRef<THREE.Group>(null);

  // Convert spherical coordinates to Cartesian
  // Note: The user's provided file uses Y as Z-axis (vertical) and Z as Y-axis (depth)
  // I will stick to this convention for minimal changes to their provided code.
  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.cos(theta); // This is the vertical axis in the provided code
  const z = Math.sin(theta) * Math.sin(phi); // This is the depth axis in the provided code

  // Calculate probabilities
  const prob0 = Math.cos(theta / 2) ** 2;
  const prob1 = Math.sin(theta / 2) ** 2;

  useFrame(() => {
    if (vectorRef.current) {
      // Optional rotation animation from user's original code
    }
  });

  return (
    <group>
      {/* Main Bloch Sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1, 64, 32]} /> {/* Increased segments for smoother sphere */}
        <meshPhongMaterial
          color="#1E40AF"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe - Keeping as per user's provided code */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} /> {/* Adjusted segments to match main sphere for consistency */}
        <meshBasicMaterial
          color="#3B82F6"
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Equatorial circle */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.005, 8, 64]} />
        <meshBasicMaterial color="#6B7280" />
      </mesh>

      {/* Coordinate axes */}
      <Line
        points={[[-1.2, 0, 0], [1.2, 0, 0]]}
        color="#EF4444" // Red for X
        lineWidth={2}
      />
      <Line
        points={[[0, -1.2, 0], [0, 1.2, 0]]}
        color="#10B981" // Green for Y (vertical in user's code)
        lineWidth={2}
      />
      <Line
        points={[[0, 0, -1.2], [0, 0, 1.2]]}
        color="#8B5CF6" // Purple for Z (depth in user's code)
        lineWidth={2}
      />

      {/* State vector */}
      <group ref={vectorRef}>
        <Line
          points={[[0, 0, 0], [x, y, z]]}
          color="#F59E0B" // Orange for vector
          lineWidth={4}
        />
        
        {/* Vector tip */}
        <mesh position={[x, y, z]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>

        {/* Arrow head - corrected rotation */}
        <mesh position={[x * 1.05, y * 1.05, z * 1.05]} rotation={[0, Math.atan2(x, z), -Math.atan2(y, Math.sqrt(x*x + z*z))]}>
          <coneGeometry args={[0.03, 0.1, 8]} />
          <meshBasicMaterial color="#F59E0B" />
        </mesh>

        {/* Projection lines - Keeping as per user's provided code */}
        <Line
          points={[[x, y, z], [x, y, 0]]}
          color="#F59E0B"
          lineWidth={1}
          transparent
          opacity={0.5}
        />
        <Line
          points={[[x, y, 0], [0, 0, 0]]}
          color="#F59E0B"
          lineWidth={1}
          transparent
          opacity={0.5}
        />
      </group>

      {/* Axis labels */}
      {showLabels && (
        <>
          <Text
            position={[1.3, 0, 0]}
            fontSize={0.12} // Slightly increased font size
            color="#EF4444"
            anchorX="center"
            anchorY="middle"
          >
            X
          </Text>
          <Text
            position={[0, 1.3, 0]}
            fontSize={0.12} // Slightly increased font size
            color="#10B981"
            anchorX="center"
            anchorY="middle"
          >
            Y
          </Text>
          <Text
            position={[0, 0, 1.3]}
            fontSize={0.12} // Slightly increased font size
            color="#8B5CF6"
            anchorX="center"
            anchorY="middle"
          >
            $|0⟩$
          </Text>
          <Text
            position={[0, 0, -1.3]}
            fontSize={0.12} // Slightly increased font size
            color="#8B5CF6"
            anchorX="center"
            anchorY="middle"
          >
            $|1⟩$
          </Text>
          
          {/* Angle labels - Adjusted positions to prevent overlap, increased font size */}
          <Text
            position={[1.5, -0.3, 0]}
            fontSize={0.1} // Slightly increased font size
            color="#FFFFFF"
            anchorX="left"
            anchorY="middle"
          >
            $\phi = {(phi * 180 / Math.PI).toFixed(1)}°$
          </Text>
          <Text
            position={[1.5, -0.5, 0]}
            fontSize={0.1} // Slightly increased font size
            color="#FFFFFF"
            anchorX="left"
            anchorY="middle"
          >
            $\theta = {(theta * 180 / Math.PI).toFixed(1)}°$
          </Text>
        </>
      )}

      {/* Amplitude display - Adjusted position, increased font size */}
      {amplitude && (
        <Text
          position={[-1.5, 1.2, 0]}
          fontSize={0.1} // Slightly increased font size
          color="#FFFFFF"
          anchorX="left"
          anchorY="top"
          maxWidth={2} // Added maxWidth to help with potential overflow in 3D space
          lineHeight={1.2}
          textAlign="left"
        >
          {`$\\alpha = ${amplitude[0].toFixed(3)} + ${amplitude[1].toFixed(3)}i$`}
        </Text>
      )}

      {/* Probability display - Adjusted position, increased font size */}
      {showProbabilities && (
        <>
          <Text
            position={[-1.5, 0.8, 0]}
            fontSize={0.1} // Slightly increased font size
            color="#FFFFFF"
            anchorX="left"
            anchorY="top"
            maxWidth={2} // Added maxWidth
            lineHeight={1.2}
            textAlign="left"
          >
            $P(|0⟩) = ${prob0.toFixed(3)}$
          </Text>
          <Text
            position={[-1.5, 0.6, 0]}
            fontSize={0.1} // Slightly increased font size
            color="#FFFFFF"
            anchorX="left"
            anchorY="top"
            maxWidth={2} // Added maxWidth
            lineHeight={1.2}
            textAlign="left"
          >
            $P(|1⟩) = ${prob1.toFixed(3)}$
          </Text>
        </>
      )}
    </group>
  );
};

const BlochSphere: React.FC<BlochSphereProps> = ({ 
  circuit, // Keep circuit and numQubits as they are used for state calculation
  numQubits,
  theta = Math.PI / 4, 
  phi = 0, 
  amplitude,
  showLabels = true,
  autoRotate = false,
  showProbabilities = true,
  animationSpeed = 0.5,
  className = ''
}) => {
  const orbitControlsRef = useRef<any>(null); // Ref for OrbitControls

  // This state is for the *calculated* qubit state based on the circuit
  const [calculatedQubitState, setCalculatedQubitState] = useState<{ theta: number; phi: number; amplitudes?: { '0': string; '1': string } } | null>(null);
  const [selectedQubitIndex, setSelectedQubitIndex] = useState<number>(0);

  // Calculate quantum states whenever circuit changes or numQubits changes
  useEffect(() => {
    // Only calculate if circuit is provided and valid
    if (circuit && circuit.gates) {
      const state = calculateQubitState(circuit, selectedQubitIndex);
      setCalculatedQubitState(state);
    } else {
      // If no circuit, default to |0> state for visualization
      setCalculatedQubitState({
        theta: 0, // |0> state
        phi: 0,
        amplitudes: { '0': '1.000', '1': '0.000 + i0.000' }
      });
    }
  }, [circuit, numQubits, selectedQubitIndex]);


  // Simplified Bloch Sphere state calculation (from previous version, adapted for this component)
  const calculateQubitState = (circuit: Circuit, qubitIndex: number) => {
    // Initialize state vector in Cartesian coordinates for |0⟩
    let x = 0;
    let y = 0;
    let z = 1; // |0⟩ is at (0,0,1) on Bloch sphere

    const gatesOnQubit = circuit.gates
      .filter(gate => gate.qubits.includes(qubitIndex))
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    gatesOnQubit.forEach(gate => {
      const isTargetQubit = gate.qubits.length > 0 && gate.qubits[gate.qubits.length - 1] === qubitIndex;
      // Simplified control logic: assume control is active if it's in |1> state
      let controlActive = false;
      if (gate.qubits.length > 1 && isTargetQubit) {
        const controlQubitsForThisGate = gate.qubits.slice(0, -1);
        controlActive = controlQubitsForThisGate.every(cqIndex => {
          const prevQubitState = calculateQubitState({
            gates: circuit.gates.filter(g => 
              g.qubits.includes(cqIndex) && 
              (g.position || 0) < (gate.position || 0)
            ),
            measurements: []
          }, cqIndex);
          // A qubit is "active" if its Z-component is negative (closer to |1>)
          const prevZ = Math.cos(prevQubitState.theta);
          return prevZ < 0.1; // Check if it's closer to |1> (south pole)
        });
      }

      let newX = x, newY = y, newZ = z;

      switch (gate.name.toUpperCase()) {
        case 'H': // Hadamard
          // H = 1/sqrt(2) * [[1, 1], [1, -1]]
          // Effectively rotates X to Z, and Z to X (with sign change for Z)
          // On Bloch sphere: rotate by PI around Y, then by PI around X.
          // Or, direct transformation:
          newX = z;
          newY = -y; // Y-axis flips
          newZ = x;
          break;
          
        case 'X': // Pauli-X (NOT gate)
          newX = x;
          newY = -y;
          newZ = -z;
          break;
          
        case 'Y': // Pauli-Y
          newX = -x;
          newY = y;
          newZ = -z;
          break;
          
        case 'Z': // Pauli-Z
          newX = -x;
          newY = -y;
          newZ = z;
          break;
          
        case 'S': // Phase gate (sqrt(Z))
          // S = [[1, 0], [0, i]]
          // Rotates around Z-axis by pi/2
          newX = x * Math.cos(Math.PI / 2) - y * Math.sin(Math.PI / 2); // x cos(phi) - y sin(phi)
          newY = x * Math.sin(Math.PI / 2) + y * Math.cos(Math.PI / 2); // x sin(phi) + y cos(phi)
          newZ = z;
          break;
          
        case 'SDG': // S-dagger
          // S-dagger = [[1, 0], [0, -i]]
          // Rotates around Z-axis by -pi/2
          newX = x * Math.cos(-Math.PI / 2) - y * Math.sin(-Math.PI / 2);
          newY = x * Math.sin(-Math.PI / 2) + y * Math.cos(-Math.PI / 2);
          newZ = z;
          break;
          
        case 'T': // Pi/8 gate
          // T = [[1, 0], [0, e^(i*pi/4)]]
          // Rotates around Z-axis by pi/4
          newX = x * Math.cos(Math.PI / 4) - y * Math.sin(Math.PI / 4);
          newY = x * Math.sin(Math.PI / 4) + y * Math.cos(Math.PI / 4);
          newZ = z;
          break;
          
        case 'TDG': // T-dagger
          // T-dagger = [[1, 0], [0, e^(-i*pi/4)]]
          // Rotates around Z-axis by -pi/4
          newX = x * Math.cos(-Math.PI / 4) - y * Math.sin(-Math.PI / 4);
          newY = x * Math.sin(-Math.PI / 4) + y * Math.cos(-Math.PI / 4);
          newZ = z;
          break;
          
        case 'RX':
          const angleX = gate.params?.theta || gate.parameters?.[0] || 0;
          newX = x;
          newY = y * Math.cos(angleX) - z * Math.sin(angleX);
          newZ = y * Math.sin(angleX) + z * Math.cos(angleX);
          break;
          
        case 'RY':
          const angleY = gate.params?.theta || gate.parameters?.[0] || 0;
          newX = x * Math.cos(angleY) + z * Math.sin(angleY);
          newY = y;
          newZ = -x * Math.sin(angleY) + z * Math.cos(angleY);
          break;
          
        case 'RZ':
          const angleZ = gate.params?.theta || gate.parameters?.[0] || 0;
          newX = x * Math.cos(angleZ) - y * Math.sin(angleZ);
          newY = x * Math.sin(angleZ) + y * Math.cos(angleZ);
          newZ = z;
          break;
          
        case 'U3': // Universal U3 gate (theta, phi, lambda)
          // U3(theta, phi, lambda) = Rz(phi)Ry(theta)Rz(lambda)
          const u3Theta = gate.params?.theta || gate.parameters?.[0] || 0;
          const u3Phi = gate.params?.phi || gate.parameters?.[1] || 0;
          const u3Lambda = gate.params?.lambda || gate.parameters?.[2] || 0;

          // Apply Rz(lambda)
          let tempX = x * Math.cos(u3Lambda) - y * Math.sin(u3Lambda);
          let tempY = x * Math.sin(u3Lambda) + y * Math.cos(u3Lambda);
          let tempZ = z;

          // Apply Ry(theta)
          x = tempX * Math.cos(u3Theta) + tempZ * Math.sin(u3Theta);
          y = tempY;
          z = -tempX * Math.sin(u3Theta) + tempZ * Math.cos(u3Theta);

          // Apply Rz(phi)
          newX = x * Math.cos(u3Phi) - y * Math.sin(u3Phi);
          newY = x * Math.sin(u3Phi) + y * Math.cos(u3Phi);
          newZ = z;
          break;

        case 'CX': // CNOT
          if (isTargetQubit && controlActive) {
            newX = x;
            newY = -y;
            newZ = -z;
          }
          break;
          
        case 'CZ': // Controlled-Z
          if (isTargetQubit && controlActive) {
            newX = -x;
            newY = -y;
            newZ = z;
          }
          break;

        case 'SWAP':
            // SWAP is tricky for individual Bloch spheres.
            // In a multi-qubit system, SWAP exchanges the states of two qubits.
            // For a single Bloch sphere visualization, it's hard to represent this
            // without knowing the full joint state. We'll leave it as no-op here.
            newX = x; newY = y; newZ = z;
            break;
        case 'CCX': // Toffoli
            if (isTargetQubit && controlActive) {
                newX = x;
                newY = -y;
                newZ = -z;
            }
            break;
      }
      x = newX; y = newY; z = newZ;
    });

    // Convert Cartesian (x, y, z) back to spherical (theta, phi)
    // theta = arccos(z)
    // phi = atan2(y, x)
    let theta = Math.acos(z);
    let phi = Math.atan2(y, x);

    // Normalize phi to be within [0, 2*PI)
    if (phi < 0) phi += 2 * Math.PI;

    // Calculate probability amplitudes from theta and phi
    const alphaMagnitude = Math.cos(theta / 2);
    const betaMagnitude = Math.sin(theta / 2);

    const amp0 = `${alphaMagnitude.toFixed(3)}`;
    const amp1 = `${(betaMagnitude * Math.cos(phi)).toFixed(3)} ${betaMagnitude * Math.sin(phi) >= 0 ? '+' : '-'} i${Math.abs(betaMagnitude * Math.sin(phi)).toFixed(3)}`;

    return { theta, phi, amplitudes: { '0': amp0, '1': amp1 } };
  };

  return (
    <div className={`p-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg bg-gray-100 dark:bg-gray-800 flex flex-col items-center ${className}`}> {/* Added boundary styling */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        3D Bloch Sphere Visualization
      </h2>

      <div className="w-full h-96 bg-gradient-to-br from-slate-900 to-blue-900 rounded-lg relative">
        <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          
          <SphereComponent 
            theta={calculatedQubitState?.theta ?? theta} // Use calculated state if available, else prop
            phi={calculatedQubitState?.phi ?? phi} // Use calculated state if available, else prop
            amplitude={calculatedQubitState?.amplitudes ? [parseFloat(calculatedQubitState.amplitudes['0']), parseFloat(calculatedQubitState.amplitudes['1'].split(' ')[0])] : amplitude} // Pass calculated amplitudes if available
            showLabels={showLabels}
            showProbabilities={showProbabilities}
          />
          
          <OrbitControls 
            ref={orbitControlsRef} // Attach ref here
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={animationSpeed}
          />
        </Canvas>
        {/* Reset button placed outside the Canvas, but within the main container */}
        <button
          onClick={() => {
            if (orbitControlsRef.current) {
              orbitControlsRef.current.reset(); // OrbitControls has a reset method
            }
          }}
          className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white rounded-md text-sm shadow-md hover:bg-blue-700 transition-colors z-10"
        >
          Reset View
        </button>
      </div>

      {/* Qubit Selection Buttons */}
      {numQubits > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {Array.from({ length: numQubits }, (_, i) => (
            <button
              key={i}
              onClick={() => setSelectedQubitIndex(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedQubitIndex === i
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Qubit {i}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlochSphere;
