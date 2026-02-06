export const calculateOrbitPosition = (
  index: number,
  total: number,
  radius: number,
) => {
  // Distribute cards evenly around the circle
  const angleStep = (Math.PI * 2) / total;
  const angle = index * angleStep;

  // Calculate position
  // sin/cos for X/Z plane
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;

  // Rotation to face outward from center
  // Convert radians to degrees
  const rotationY = angle * (180 / Math.PI);

  return { x, z, rotationY };
};
