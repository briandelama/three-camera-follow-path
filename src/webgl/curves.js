import * as THREE from "three";
const format = (points) => {
  for (var i = 0; i < points.length; i++) {
    var x = points[i][0];
    var y = points[i][1];
    var z = points[i][2];
    points[i] = new THREE.Vector3(x, z, -y);
  }
  return points;
};

export const BezierCurve = () => {
  const points = [
    [0.447, -12.842, 15.459],
    [-20.794, 2.39, 5.008],
    [17.893, 5.266, 11.749],
    [-2.196, -76.704, 0.981],
  ];

  return format(points);
};
