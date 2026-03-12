import { Fn, float, vec2, vec3, sin, cos } from "three/tsl";

// Hash function for pseudo-random numbers
// Same seed always returns same "random" value
export const hash = Fn(([seed]) => {
  const h = seed.fract().mul(0.1031);
  return h.mul(h.add(33.33)).mul(h.add(h)).fract();
});

// 2D rotation in the XZ plane
export const rotateXZ = Fn(([p, angle]) => {
  const cosA = cos(angle);
  const sinA = sin(angle);
  return vec3(
    p.x.mul(cosA).sub(p.z.mul(sinA)),
    p.y,
    p.x.mul(sinA).add(p.z.mul(cosA)),
  );
});
