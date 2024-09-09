export const lerp = (x: number, a: number, b: number) => x * (b - a) + a;

export const clamp = (x: number, a: number, b: number) =>
  Math.min(Math.max(x, a), b);

export const sat = (x: number) => Math.min(Math.max(x, 0.0), 1.0);

export const rand_range = (a: number, b: number) => Math.random() * (b - a) + a;

export const rand_normalish = () => {
  const r = Math.random() + Math.random() + Math.random() + Math.random();
  return (r / 4.0) * 2.0 - 1;
};

export const dot = (a: number[], b: number[]) => {
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r += a[i] * b[i];
  }
  return r;
};

export const add = (a: number[], b: number[]) => {
  return a.map((v1, i) => v1 + b[i]);
};
