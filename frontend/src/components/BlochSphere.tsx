import React, { useRef, useEffect, useState } from 'react';
import { Circuit } from '../types/quantum';
import * as THREE from 'three';

interface BlochSphereProps {
  circuit: Circuit;
  numQubits: number;
  className?: string;
}

export const BlochSphere: React.FC<BlochSphereProps> = ({ circuit, numQubits, className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const frameRef = useRef<number>();
  const [qubitStates, setQubitStates] = useState<Array<{ theta: number; phi: number }>>([]);

  // Calculate quantum states whenever circuit changes
  useEffect(() => {
    const newStates = Array.from({ length: numQubits }, (_, i) => 
      calculateQubitState(circuit, i)
    );
    setQubitStates(newStates);
  }, [circuit, numQubits]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Controls for rotation
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      mouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      mouseDown = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!mouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      camera.position.x = camera.position.x * Math.cos(deltaX * 0.01) - camera.position.z * Math.sin(deltaX * 0.01);
      camera.position.z = camera.position.x * Math.sin(deltaX * 0.01) + camera.position.z * Math.cos(deltaX * 0.01);
      camera.position.y += deltaY * 0.01;

      camera.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    mount.addEventListener('mousedown', handleMouseDown);
    mount.addEventListener('mouseup', handleMouseUp);
    mount.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      mount.removeEventListener('mousedown', handleMouseDown);
      mount.removeEventListener('mouseup', handleMouseUp);
      mount.removeEventListener('mousemove', handleMouseMove);
      
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, []);

  // Update spheres when states change
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;

    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    // Clear existing spheres
    const spheresToRemove = scene.children.filter(child => child.userData.isSphere);
    spheresToRemove.forEach(sphere => scene.remove(sphere));

    // Create spheres for each qubit
    const spheresPerRow = Math.ceil(Math.sqrt(numQubits));
    const spacing = 3;

    qubitStates.forEach((state, index) => {
      const row = Math.floor(index / spheresPerRow);
      const col = index % spheresPerRow;
      const offsetX = (col - (spheresPerRow - 1) / 2) * spacing;
      const offsetZ = (row - (Math.ceil(numQubits / spheresPerRow) - 1) / 2) * spacing;

      const sphereGroup = createBlochSphere(state, index, offsetX, offsetZ);
      scene.add(sphereGroup);
    });

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();
  }, [qubitStates, numQubits]);

  const createBlochSphere = (
    state: { theta: number; phi: number },
    qubitIndex: number,
    offsetX: number,
    offsetZ: number
  ) => {
    const group = new THREE.Group();
    group.position.set(offsetX, 0, offsetZ);
    group.userData.isSphere = true;

    // Main sphere (wireframe)
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xe5e7eb,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);

    // Equator circle
    const equatorGeometry = new THREE.RingGeometry(0.99, 1.01, 64);
    const equatorMaterial = new THREE.MeshBasicMaterial({
      color: 0xd1d5db,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const equator = new THREE.Mesh(equatorGeometry, equatorMaterial);
    equator.rotation.x = Math.PI / 2;
    group.add(equator);

    // Meridian circle
    const meridianGeometry = new THREE.RingGeometry(0.99, 1.01, 64);
    const meridian = new THREE.Mesh(meridianGeometry, equatorMaterial);
    group.add(meridian);

    // Axes
    const axesMaterial = new THREE.LineBasicMaterial({ color: 0x9ca3af });
    
    // X-axis
    const xAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.2, 0, 0),
      new THREE.Vector3(1.2, 0, 0)
    ]);
    const xAxis = new THREE.Line(xAxisGeometry, axesMaterial);
    group.add(xAxis);

    // Y-axis
    const yAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.2, 0),
      new THREE.Vector3(0, 1.2, 0)
    ]);
    const yAxis = new THREE.Line(yAxisGeometry, axesMaterial);
    group.add(yAxis);

    // Z-axis
    const zAxisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -1.2),
      new THREE.Vector3(0, 0, 1.2)
    ]);
    const zAxis = new THREE.Line(zAxisGeometry, axesMaterial);
    group.add(zAxis);

    // State vector
    const x = Math.sin(state.theta) * Math.cos(state.phi);
    const y = Math.cos(state.theta);
    const z = Math.sin(state.theta) * Math.sin(state.phi);

    // Vector arrow
    const vectorGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(x, y, z)
    ]);
    const vectorMaterial = new THREE.LineBasicMaterial({ 
      color: 0x3b82f6, 
      linewidth: 3 
    });
    const vector = new THREE.Line(vectorGeometry, vectorMaterial);
    group.add(vector);

    // State point
    const pointGeometry = new THREE.SphereGeometry(0.05, 16, 8);
    const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.set(x, y, z);
    group.add(point);

    // Arrowhead
    const arrowGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    arrow.position.set(x, y, z);
    arrow.lookAt(new THREE.Vector3(x * 1.2, y * 1.2, z * 1.2));
    group.add(arrow);

    // Labels (using sprites for text)
    const createTextSprite = (text: string, position: THREE.Vector3, color: string = '#6b7280') => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 128;
      canvas.height = 64;
      
      context.fillStyle = color;
      context.font = 'Bold 24px Arial';
      context.textAlign = 'center';
      context.fillText(text, 64, 40);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(0.5, 0.25, 1);
      
      return sprite;
    };

    // Axis labels
    group.add(createTextSprite('|0⟩', new THREE.Vector3(0, 1.4, 0)));
    group.add(createTextSprite('|1⟩', new THREE.Vector3(0, -1.4, 0)));
    group.add(createTextSprite('|+⟩', new THREE.Vector3(1.4, 0, 0)));
    group.add(createTextSprite('|-⟩', new THREE.Vector3(-1.4, 0, 0)));

    // Qubit label
    group.add(createTextSprite(`q${qubitIndex}`, new THREE.Vector3(0, -1.8, 0), '#1f2937'));

    return group;
  };

  const calculateQubitState = (circuit: Circuit, qubitIndex: number) => {
    // Initialize state to |0⟩ (north pole)
    let theta = 0; // Polar angle (0 = |0⟩, π = |1⟩)
    let phi = 0;   // Azimuthal angle

    // Get gates applied to this qubit in order
    const gatesOnQubit = circuit.gates
      .filter(gate => gate.qubits.includes(qubitIndex))
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    gatesOnQubit.forEach(gate => {
      const isControlQubit = gate.qubits.length > 1 && gate.qubits[0] === qubitIndex;
      const isTargetQubit = gate.qubits.length > 1 && gate.qubits[1] === qubitIndex;
      
      switch (gate.name) {
        case 'H':
          // Hadamard: |0⟩ → |+⟩, |1⟩ → |-⟩
          if (Math.abs(theta) < 0.1) { // Was |0⟩
            theta = Math.PI / 2;
            phi = 0;
          } else if (Math.abs(theta - Math.PI) < 0.1) { // Was |1⟩
            theta = Math.PI / 2;
            phi = Math.PI;
          } else {
            // If already in superposition, rotate
            theta = theta < Math.PI / 2 ? 0 : Math.PI;
          }
          break;
          
        case 'X':
          // Pauli-X: bit flip
          theta = Math.PI - theta;
          break;
          
        case 'Y':
          // Pauli-Y: bit flip + phase flip
          theta = Math.PI - theta;
          phi = phi + Math.PI;
          break;
          
        case 'Z':
          // Pauli-Z: phase flip
          if (theta > Math.PI / 2) {
            phi = phi + Math.PI;
          }
          break;
          
        case 'S':
          // S gate: phase gate
          if (theta > Math.PI / 2) {
            phi = phi + Math.PI / 2;
          }
          break;
          
        case 'T':
          // T gate: π/8 phase gate
          if (theta > Math.PI / 2) {
            phi = phi + Math.PI / 4;
          }
          break;
          
        case 'RX':
          // Rotation around X-axis
          const angleX = gate.parameters?.[0] || Math.PI / 2;
          theta = theta + angleX;
          break;
          
        case 'RY':
          // Rotation around Y-axis
          const angleY = gate.parameters?.[0] || Math.PI / 2;
          const newTheta = Math.acos(Math.cos(angleY/2) * Math.cos(theta/2) - Math.sin(angleY/2) * Math.sin(theta/2) * Math.cos(phi));
          theta = newTheta;
          break;
          
        case 'RZ':
          // Rotation around Z-axis
          const angleZ = gate.parameters?.[0] || Math.PI / 2;
          phi = phi + angleZ;
          break;
          
        case 'CX':
          // CNOT gate - only affects target if control is |1⟩
          if (isTargetQubit) {
            // Simplified: assume control is in |1⟩ state for demonstration
            const controlQubitState = calculateQubitState({
              gates: circuit.gates.filter(g => 
                g.qubits.includes(gate.qubits[0]) && 
                (g.position || 0) < (gate.position || 0)
              ),
              measurements: []
            }, gate.qubits[0]);
            
            // If control qubit is closer to |1⟩ state, apply X to target
            if (controlQubitState.theta > Math.PI / 2) {
              theta = Math.PI - theta;
            }
          }
          break;
          
        case 'CZ':
          // Controlled-Z gate
          if (isTargetQubit) {
            const controlQubitState = calculateQubitState({
              gates: circuit.gates.filter(g => 
                g.qubits.includes(gate.qubits[0]) && 
                (g.position || 0) < (gate.position || 0)
              ),
              measurements: []
            }, gate.qubits[0]);
            
            if (controlQubitState.theta > Math.PI / 2 && theta > Math.PI / 2) {
              phi = phi + Math.PI;
            }
          }
          break;
      }
      
      // Normalize angles
      theta = theta % (2 * Math.PI);
      phi = phi % (2 * Math.PI);
      if (theta > Math.PI) theta = 2 * Math.PI - theta;
    });

    return { theta, phi };
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-3 overflow-auto ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          3D Bloch Sphere Visualization
        </h2>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Real-time 3D quantum state • {circuit.gates.length} gates applied • Drag to rotate
        </div>
      </div>
      
      <div 
        ref={mountRef}
        className="bg-gray-50 dark:bg-gray-900 rounded-lg mb-3"
        style={{ height: '350px', width: '100%' }}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
            3D Bloch Sphere Guide
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-0.5">
            <li>• Red sphere shows current qubit state</li>
            <li>• Blue arrow is the state vector</li>
            <li>• |0⟩ and |1⟩ are at north/south poles</li>
            <li>• |+⟩ and |-⟩ are on the equator</li>
            <li>• Drag to rotate and explore in 3D</li>
          </ul>
        </div>
        
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h3 className="text-xs font-medium text-green-900 dark:text-green-300 mb-1">
            Quantum State Info
          </h3>
          <ul className="text-xs text-green-800 dark:text-green-400 space-y-0.5">
            <li>• θ: polar angle (0 = |0⟩, π = |1⟩)</li>
            <li>• φ: azimuthal angle (phase)</li>
            <li>• Real-time updates with circuit changes</li>
            <li>• Multiple qubits shown in grid layout</li>
            <li>• Interactive 3D visualization</li>
          </ul>
        </div>
      </div>
    </div>
  );
};