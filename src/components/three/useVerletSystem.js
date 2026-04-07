import { useFrame } from "@react-three/fiber";
import { folder, useControls } from "leva";
import { useEffect, useMemo, useRef } from "react";
import {
  attribute,
  cross,
  Fn,
  If,
  instancedArray,
  instanceIndex,
  Loop,
  mix,
  Return,
  select,
  time,
  transformNormalToView,
  triNoise3D,
  uint,
  uniform,
  vec3,
} from "three/tsl";
import * as THREE from "three/webgpu";

// TODO: To change these?
const clothWidth = 1;
const clothHeight = 1;
// const clothWidth = 360;
// const clothHeight = 360;

const clothNumSegmentsX = 30;
const clothNumSegmentsY = 30;

let flatVertexPositionBuffer, vertexPositionBuffer, vertexForceBuffer, vertexParamsBuffer;
let springVertexIdBuffer, springRestLengthBuffer, springForceBuffer;
let springListBuffer;
let computeSpringForces, computeVertexForces, resetVertexForces;
let dampeningUniform, stiffnessUniform, windUniform, simulationMixUniform;
let clothMesh, clothMaterial;
let timeSinceLastStep = 0;
let timestamp = 0;
const verletVertices = [];
const verletSprings = [];
const verletVertexColumns = [];

export default function () {
  const simulationWasActiveRef = useRef(true);

  const mesh = useMemo(() => {
    return setupCloth();
  }, []);

  const { stiffness, wind, simulationMix } = useControls({
    verlet: folder({
      stiffness: {
        value: 0.9,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      wind: {
        value: 1,
        min: 0,
        max: 5,
        step: 0.1,
      },
      simulationMix: {
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
      },
    }),
  });

  useEffect(() => {
    if (stiffnessUniform) {
      stiffnessUniform.value = stiffness;
    }

    if (windUniform) {
      windUniform.value = wind;
    }

    if (simulationMixUniform) {
      simulationMixUniform.value = simulationMix;
    }
  }, [simulationMix, stiffness, wind]);

  useFrame(({ gl: renderer }, delta) => {
    const currentSimulationMix = simulationMixUniform?.value ?? simulationMix;
    const simulationActive = currentSimulationMix > 0;

    if (!simulationActive) {
      timeSinceLastStep = 0;

      if (simulationWasActiveRef.current && resetVertexForces) {
        renderer.compute(resetVertexForces);
      }

      simulationWasActiveRef.current = false;
      return;
    }

    simulationWasActiveRef.current = true;

    const deltaTime = Math.min(delta, 1 / 60); // don't advance the time too far, for example when the window is out of focus
    const stepsPerSecond = 360; // ensure the same amount of simulation steps per second on all systems, independent of refresh rate
    const timePerStep = 1 / stepsPerSecond;

    timeSinceLastStep += deltaTime;

    while (timeSinceLastStep >= timePerStep) {
      // run a verlet system simulation step
      timestamp += timePerStep;
      timeSinceLastStep -= timePerStep;

      renderer.compute(computeSpringForces);
      renderer.compute(computeVertexForces);
    }
  });

  return { mesh, simulationMix };
}

function setupVerletGeometry() {
  // this function sets up the geometry of the verlet system, a grid of vertices connected by springs

  const addVerletVertex = (x, y, z, isFixed) => {
    const id = verletVertices.length;
    const vertex = {
      id,
      position: new THREE.Vector3(x, y, z),
      isFixed,
      springIds: [],
    };
    verletVertices.push(vertex);
    return vertex;
  };

  const addVerletSpring = (vertex0, vertex1) => {
    const id = verletSprings.length;
    const spring = {
      id,
      vertex0,
      vertex1,
    };
    vertex0.springIds.push(id);
    vertex1.springIds.push(id);
    verletSprings.push(spring);
    return spring;
  };

  // create the cloth's verlet vertices
  for (let x = 0; x <= clothNumSegmentsX; x++) {
    const column = [];
    for (let y = 0; y <= clothNumSegmentsY; y++) {
      const posX = x * (clothWidth / clothNumSegmentsX) - clothWidth * 0.5;
      // const posZ = y * (clothHeight / clothNumSegmentsY);
      const posY = y * (clothHeight / clothNumSegmentsY) - clothHeight * 0.5;

      // const isFixed = y === 0 && x % 5 === 0; // make some of the top vertices' positions fixed
      const isFixed = y === clothNumSegmentsY && x % 5 === 0; // make some of the top vertices' positions fixed

      // const vertex = addVerletVertex(posX, clothHeight * 0.5, posZ, isFixed);
      const vertex = addVerletVertex(posX, posY, 0, isFixed);
      column.push(vertex);
    }

    verletVertexColumns.push(column);
  }

  // create the cloth's verlet springs
  for (let x = 0; x <= clothNumSegmentsX; x++) {
    for (let y = 0; y <= clothNumSegmentsY; y++) {
      const vertex0 = verletVertexColumns[x][y];
      if (x > 0) addVerletSpring(vertex0, verletVertexColumns[x - 1][y]);
      if (y > 0) addVerletSpring(vertex0, verletVertexColumns[x][y - 1]);
      if (x > 0 && y > 0)
        addVerletSpring(vertex0, verletVertexColumns[x - 1][y - 1]);
      if (x > 0 && y < clothNumSegmentsY)
        addVerletSpring(vertex0, verletVertexColumns[x - 1][y + 1]);

      // You can make the cloth more rigid by adding more springs between further apart vertices
      //if (x > 1) addVerletSpring(vertex0, verletVertexColumns[x - 2][y]);
      //if (y > 1) addVerletSpring(vertex0, verletVertexColumns[x][y - 2]);
    }
  }
}

function setupVerletVertexBuffers() {
  // setup the buffers holding the vertex data for the compute shaders

  const vertexCount = verletVertices.length;

  const springListArray = [];
  // this springListArray will hold a list of spring ids, ordered by the id of the vertex affected by that spring.
  // this is so the compute shader that accumulates the spring forces for each vertex can efficiently iterate over all springs affecting that vertex

  const vertexPositionArray = new Float32Array(vertexCount * 3);
  const vertexParamsArray = new Uint32Array(vertexCount * 3);
  // the params Array holds three values for each verlet vertex:
  // x: isFixed, y: springCount, z: springPointer
  // isFixed is 1 if the verlet is marked as immovable, 0 if not
  // springCount is the number of springs connected to that vertex
  // springPointer is the index of the first spring in the springListArray that is connected to that vertex

  for (let i = 0; i < vertexCount; i++) {
    const vertex = verletVertices[i];

    vertexPositionArray[i * 3] = vertex.position.x;
    vertexPositionArray[i * 3 + 1] = vertex.position.y;
    vertexPositionArray[i * 3 + 2] = vertex.position.z;
    vertexParamsArray[i * 3] = vertex.isFixed ? 1 : 0;

    if (!vertex.isFixed) {
      vertexParamsArray[i * 3 + 1] = vertex.springIds.length;
      vertexParamsArray[i * 3 + 2] = springListArray.length;
      springListArray.push(...vertex.springIds);
    }
  }

  flatVertexPositionBuffer = instancedArray(
    new Float32Array(vertexPositionArray),
    "vec3",
  ).setPBO(true);
  vertexPositionBuffer = instancedArray(
    new Float32Array(vertexPositionArray),
    "vec3",
  ).setPBO(true); // setPBO(true) is only important for the WebGL Fallback
  vertexForceBuffer = instancedArray(vertexCount, "vec3");
  vertexParamsBuffer = instancedArray(vertexParamsArray, "uvec3");

  springListBuffer = instancedArray(
    new Uint32Array(springListArray),
    "uint",
  ).setPBO(true);
}

function setupVerletSpringBuffers() {
  // setup the buffers holding the spring data for the compute shaders

  const springCount = verletSprings.length;

  const springVertexIdArray = new Uint32Array(springCount * 2);
  const springRestLengthArray = new Float32Array(springCount);

  for (let i = 0; i < springCount; i++) {
    const spring = verletSprings[i];
    springVertexIdArray[i * 2] = spring.vertex0.id;
    springVertexIdArray[i * 2 + 1] = spring.vertex1.id;
    springRestLengthArray[i] = spring.vertex0.position.distanceTo(
      spring.vertex1.position,
    );
  }

  springVertexIdBuffer = instancedArray(springVertexIdArray, "uvec2").setPBO(
    true,
  );
  springRestLengthBuffer = instancedArray(springRestLengthArray, "float");
  springForceBuffer = instancedArray(springCount * 3, "vec3").setPBO(true);
}

function setupUniforms() {
  dampeningUniform = uniform(0.99);
  windUniform = uniform(1.0);
  stiffnessUniform = uniform(0.2);
  simulationMixUniform = uniform(1.0);
}

function setupComputeShaders() {
  // This function sets up the compute shaders for the verlet simulation
  // There are two shaders that are executed for each simulation step

  const vertexCount = verletVertices.length;
  const springCount = verletSprings.length;

  // 1. computeSpringForces:
  // This shader computes a force for each spring, depending on the distance between the two vertices connected by that spring and the targeted rest length
  computeSpringForces = new Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(springCount)), () => {
      // compute Shaders are executed in groups of 64, so instanceIndex might be bigger than the amount of springs.
      // in that case, return.
      Return();
    });

    const vertexIds = springVertexIdBuffer.element(instanceIndex);
    const restLength = springRestLengthBuffer.element(instanceIndex);

    const vertex0Position = vertexPositionBuffer.element(vertexIds.x);
    const vertex1Position = vertexPositionBuffer.element(vertexIds.y);

    const delta = vertex1Position.sub(vertex0Position).toVar();
    const dist = delta.length().max(0.000001).toVar();
    const force = dist
      .sub(restLength)
      .mul(stiffnessUniform)
      .mul(delta)
      .mul(0.5)
      .div(dist);
    springForceBuffer.element(instanceIndex).assign(force);
  })()
    .compute(springCount)
    .setName("Spring Forces");

  // 2. computeVertexForces:
  // This shader accumulates the force for each vertex.
  // First it iterates over all springs connected to this vertex and accumulates their forces.
  // Then it adds a gravital force, wind force, and the collision with the sphere.
  // In the end it adds the force to the vertex' position.
  computeVertexForces = Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(vertexCount)), () => {
      // compute Shaders are executed in groups of 64, so instanceIndex might be bigger than the amount of vertices.
      // in that case, return.
      Return();
    });

    const params = vertexParamsBuffer.element(instanceIndex).toVar();
    const isFixed = params.x;
    const springCount = params.y;
    const springPointer = params.z;

    If(isFixed, () => {
      // don't need to calculate vertex forces if the vertex is set as immovable
      Return();
    });

    const position = vertexPositionBuffer
      .element(instanceIndex)
      .toVar("vertexPosition");
    const force = vertexForceBuffer.element(instanceIndex).toVar("vertexForce");

    force.mulAssign(dampeningUniform);

    const ptrStart = springPointer.toVar("ptrStart");
    const ptrEnd = ptrStart.add(springCount).toVar("ptrEnd");

    Loop(
      { start: ptrStart, end: ptrEnd, type: "uint", condition: "<" },
      ({ i }) => {
        const springId = springListBuffer.element(i).toVar("springId");
        const springForce = springForceBuffer.element(springId);
        const springVertexIds = springVertexIdBuffer.element(springId);
        const factor = select(
          springVertexIds.x.equal(instanceIndex),
          1.0,
          -1.0,
        );
        force.addAssign(springForce.mul(factor));
      },
    );

    // gravity
    force.y.subAssign(0.00005);

    // wind
    const noise = triNoise3D(position, 1, time).sub(0.2).mul(0.0001);
    const windForce = noise.mul(windUniform);
    // force.z.subAssign(windForce);
    force.z.addAssign(windForce);

    // collision with sphere
    // const deltaSphere = position.add( force ).sub( spherePositionUniform );
    // const dist = deltaSphere.length();
    // const sphereForce = float( sphereRadius ).sub( dist ).max( 0 ).mul( deltaSphere ).div( dist ).mul( sphereUniform );
    // force.addAssign( sphereForce );

    vertexForceBuffer.element(instanceIndex).assign(force);
    vertexPositionBuffer.element(instanceIndex).addAssign(force);
  })()
    .compute(vertexCount)
    .setName("Vertex Forces");

  resetVertexForces = new Fn(() => {
    If(instanceIndex.greaterThanEqual(uint(vertexCount)), () => {
      Return();
    });

    vertexForceBuffer.element(instanceIndex).assign(vec3(0, 0, 0));
  })()
    .compute(vertexCount)
    .setName("Reset Vertex Forces");
}

function setupClothMesh() {
  // This function generates a three Geometry and Mesh to render the cloth based on the verlet systems position data.
  // Therefore it creates a plane mesh, in which each vertex will be centered in the center of 4 verlet vertices.

  const vertexCount = clothNumSegmentsX * clothNumSegmentsY;
  const geometry = new THREE.BufferGeometry();

  // verletVertexIdArray will hold the 4 verlet vertex ids that contribute to each geometry vertex's position
  const verletVertexIdArray = new Uint32Array(vertexCount * 4);
  const indices = [];

  const uvArray = new Float32Array(vertexCount * 2);

  const getIndex = (x, y) => {
    return y * clothNumSegmentsX + x;
  };

  for (let x = 0; x < clothNumSegmentsX; x++) {
    for (let y = 0; y < clothNumSegmentsY; y++) {
      const index = getIndex(x, y);

      uvArray[index * 2 + 0] = x / (clothNumSegmentsX - 1); // u: 0 -> 1
      uvArray[index * 2 + 1] = y / (clothNumSegmentsY - 1); // v: 0 -> 1

      verletVertexIdArray[index * 4] = verletVertexColumns[x][y].id;
      verletVertexIdArray[index * 4 + 1] = verletVertexColumns[x + 1][y].id;
      verletVertexIdArray[index * 4 + 2] = verletVertexColumns[x][y + 1].id;
      verletVertexIdArray[index * 4 + 3] = verletVertexColumns[x + 1][y + 1].id;

      if (x > 0 && y > 0) {
        indices.push(
          getIndex(x, y),
          getIndex(x - 1, y),
          getIndex(x - 1, y - 1),
        );
        indices.push(
          getIndex(x, y),
          getIndex(x - 1, y - 1),
          getIndex(x, y - 1),
        );
      }
    }
  }

  const verletVertexIdBuffer = new THREE.BufferAttribute(
    verletVertexIdArray,
    4,
    false,
  );
  const positionBuffer = new THREE.BufferAttribute(
    new Float32Array(vertexCount * 3),
    3,
    false,
  );
  geometry.setAttribute("position", positionBuffer);
  geometry.setAttribute("vertexIds", verletVertexIdBuffer);
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvArray, 2));

  geometry.setIndex(indices);

  // FIXME:
  // clothMaterial = new THREE.MeshPhysicalNodeMaterial({
  clothMaterial = new THREE.MeshBasicNodeMaterial({
    // color: new THREE.Color().setHex(API.color),
    side: THREE.DoubleSide,
    transparent: true,
    // opacity: 0.85,
    // sheen: 1.0,
    // sheenRoughness: 0.5,
    // sheenColor: new THREE.Color().setHex(API.sheenColor),
  });

  clothMaterial.positionNode = Fn(({ material }) => {
    // gather the position of the 4 verlet vertices and calculate the center position and normal from that
    const vertexIds = attribute("vertexIds");
    const flatV0 = flatVertexPositionBuffer.element(vertexIds.x).toVar();
    const flatV1 = flatVertexPositionBuffer.element(vertexIds.y).toVar();
    const flatV2 = flatVertexPositionBuffer.element(vertexIds.z).toVar();
    const flatV3 = flatVertexPositionBuffer.element(vertexIds.w).toVar();
    const simV0 = vertexPositionBuffer.element(vertexIds.x).toVar();
    const simV1 = vertexPositionBuffer.element(vertexIds.y).toVar();
    const simV2 = vertexPositionBuffer.element(vertexIds.z).toVar();
    const simV3 = vertexPositionBuffer.element(vertexIds.w).toVar();

    const v0 = mix(flatV0, simV0, simulationMixUniform).toVar();
    const v1 = mix(flatV1, simV1, simulationMixUniform).toVar();
    const v2 = mix(flatV2, simV2, simulationMixUniform).toVar();
    const v3 = mix(flatV3, simV3, simulationMixUniform).toVar();

    const top = v0.add(v1);
    const right = v1.add(v3);
    const bottom = v2.add(v3);
    const left = v0.add(v2);

    const tangent = right.sub(left).normalize();
    const bitangent = bottom.sub(top).normalize();

    const normal = cross(tangent, bitangent);

    // send the normalView from the vertex shader to the fragment shader
    material.normalNode = transformNormalToView(normal).toVarying();

    return v0.add(v1).add(v2).add(v3).mul(0.25);
  })();

  clothMesh = new THREE.Mesh(geometry, clothMaterial);

  clothMesh.frustumCulled = false;

  return clothMesh;
}

function setupCloth() {
  verletVertices.length = 0;
  verletSprings.length = 0;
  verletVertexColumns.length = 0;
  timeSinceLastStep = 0;
  timestamp = 0;
  setupVerletGeometry();
  setupVerletVertexBuffers();
  setupVerletSpringBuffers();
  setupUniforms();
  setupComputeShaders();
  const mesh = setupClothMesh();

  return mesh;
}
