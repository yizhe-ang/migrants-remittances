import * as THREE from "three/webgpu";
import { Canvas, extend } from "@react-three/fiber";
import Scene from "@/components/three/Scene";

extend(THREE);

export default () => (
  <Canvas
    gl={async (props) => {
      const renderer = new THREE.WebGPURenderer({ ...props, alpha: true });
      await renderer.init();
      return renderer;
    }}
  >
    <Scene />
  </Canvas>
);
