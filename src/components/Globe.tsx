// @refresh reset
'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { drawWorldMapCanvas, makeLandSampler, makeCountryHighlighter, makeCountryIdSampler } from '@/lib/world-map';

const HIGHLIGHTED_COUNTRY_IDS = [818, 784, 682, 276, 826];

const COUNTRY_NAMES: Record<number, string> = {
  818: 'Egypt',
  784: 'United Arab Emirates',
  682: 'Saudi Arabia',
  276: 'Germany',
  826: 'United Kingdom',
};

type Marker = { lat: number; lng: number; kind: 'primary' | 'secondary'; label: string };

const MARKERS: Marker[] = [
  { lat: 30.0444, lng: 31.2357, kind: 'primary',   label: 'Cairo, Egypt' },
  { lat: 24.4539, lng: 54.3773, kind: 'primary',   label: 'Abu Dhabi, UAE' },
  { lat: 24.6877, lng: 46.7219, kind: 'secondary', label: 'Riyadh, Saudi Arabia' },
  { lat: 52.5200, lng: 13.4050, kind: 'secondary', label: 'Berlin, Germany' },
  { lat: 51.5074, lng: -0.1278, kind: 'secondary', label: 'London, UK' },
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Convert a globe-local 3D point back to lat/lng */
function vector3ToLatLng(v: THREE.Vector3, radius: number): [number, number] {
  const lat = Math.asin(v.y / radius) * (180 / Math.PI);
  const theta = Math.atan2(v.z, -v.x);
  const lng = theta * (180 / Math.PI) - 180;
  return [lat, lng];
}

export default function Globe({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const bgCss = getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim();
    const parsedBg = bgCss.startsWith('#') ? parseInt(bgCss.slice(1), 16) : null;
    const theme = document.documentElement.getAttribute('data-theme');
    const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const normalDotColor = isDark ? 0x3a2010 : (parsedBg ?? 0x8a7060);

    // ---------- Scene ----------
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 320);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    const GLOBE_RADIUS = 100;

    // ---------- Ocean ----------
    const oceanGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const oceanMat = new THREE.MeshPhongMaterial({ color: 0x0d0806, shininess: 4, specular: 0x110a05, emissive: 0x060402 });
    globeGroup.add(new THREE.Mesh(oceanGeo, oceanMat));

    // ---------- Land dots ----------
    const mapCanvas = drawWorldMapCanvas(1024, 512);
    const isLand = makeLandSampler(mapCanvas);
    const isHighlighted = makeCountryHighlighter(HIGHLIGHTED_COUNTRY_IDS);
    const getCountryId = makeCountryIdSampler(HIGHLIGHTED_COUNTRY_IDS);

    const normalPoints: THREE.Vector3[] = [];
    const highlightPoints: THREE.Vector3[] = [];
    const SAMPLE_COUNT = 18000;
    const phiInc = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const y = 1 - (i / (SAMPLE_COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phiInc * i;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const lat = (Math.asin(y) * 180) / Math.PI;
      const lng = (Math.atan2(z, x) * 180) / Math.PI;
      if (!isLand(lat, lng)) continue;
      const vec = new THREE.Vector3(-x * GLOBE_RADIUS, y * GLOBE_RADIUS, z * GLOBE_RADIUS);
      if (isHighlighted(lat, lng)) highlightPoints.push(vec);
      else normalPoints.push(vec);
    }

    const dummy = new THREE.Object3D();

    const normalDotGeo = new THREE.SphereGeometry(0.75, 6, 6);
    const normalDotMat = new THREE.MeshBasicMaterial({ color: normalDotColor });
    const normalDotMesh = new THREE.InstancedMesh(normalDotGeo, normalDotMat, normalPoints.length);
    normalPoints.forEach((p, i) => { dummy.position.copy(p).multiplyScalar(1.01); dummy.updateMatrix(); normalDotMesh.setMatrixAt(i, dummy.matrix); });
    normalDotMesh.instanceMatrix.needsUpdate = true;
    globeGroup.add(normalDotMesh);

    const hlDotGeo = new THREE.SphereGeometry(0.95, 6, 6);
    const hlDotMat = new THREE.MeshBasicMaterial({ color: 0xff5a00 });
    const hlDotMesh = new THREE.InstancedMesh(hlDotGeo, hlDotMat, highlightPoints.length);
    highlightPoints.forEach((p, i) => { dummy.position.copy(p).multiplyScalar(1.01); dummy.updateMatrix(); hlDotMesh.setMatrixAt(i, dummy.matrix); });
    hlDotMesh.instanceMatrix.needsUpdate = true;
    globeGroup.add(hlDotMesh);

    // ---------- Atmosphere ----------
    const atmGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.06, 64, 64);
    const atmMat = new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide,
      uniforms: { glowColor: { value: new THREE.Color(isDark ? 0xff6020 : 0xff8040) } },
      vertexShader: `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vNormal; uniform vec3 glowColor; void main() { float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.5); gl_FragColor = vec4(glowColor, 1.0) * intensity * 0.6; }`,
    });
    globeGroup.add(new THREE.Mesh(atmGeo, atmMat));

    // ---------- Hover ring (inside globeGroup, rotates with globe) ----------
    const ringGeo = new THREE.RingGeometry(4.5, 6.5, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff5a00, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const hoverRing = new THREE.Mesh(ringGeo, ringMat);
    globeGroup.add(hoverRing);

    // Pick sphere for raycasting — MUST be visible:true or Three.js skips it.
    // colorWrite:false means it writes depth but no color, so it's invisible.
    const pickSphere = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 32, 32),
      new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
    );
    globeGroup.add(pickSphere);

    // ---------- Markers ----------
    const markerGroup = new THREE.Group();
    globeGroup.add(markerGroup);
    const pulseRings: THREE.Mesh[] = [];
    const markerObjects: { mesh: THREE.Mesh; marker: Marker }[] = [];

    MARKERS.forEach((marker) => {
      const pos = latLngToVector3(marker.lat, marker.lng, GLOBE_RADIUS * 1.02);
      const color = marker.kind === 'primary' ? 0xff5a00 : 0xffffff;

      const inner = new THREE.Mesh(
        new THREE.SphereGeometry(marker.kind === 'primary' ? 2.4 : 1.8, 16, 16),
        new THREE.MeshBasicMaterial({ color })
      );
      inner.position.copy(pos);
      markerGroup.add(inner);

      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(marker.kind === 'primary' ? 4.5 : 3.0, 16, 16),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3 })
      );
      halo.position.copy(pos);
      markerGroup.add(halo);

      if (marker.kind === 'primary') {
        const pulse = new THREE.Mesh(
          new THREE.SphereGeometry(7, 16, 16),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.15 })
        );
        pulse.position.copy(pos);
        markerGroup.add(pulse);
        pulseRings.push(pulse);
      }
      markerObjects.push({ mesh: inner, marker });
    });

    // ---------- Lighting ----------
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const dirLight = new THREE.DirectionalLight(0xfff0e0, 0.9);
    dirLight.position.set(-200, 200, 200);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0xff6020, 0.2);
    rimLight.position.set(150, -50, -200);
    scene.add(rimLight);

    // ---------- Interaction ----------
    // Azimuth 4.168 = Cairo dead-center facing camera on load
    // Auto-rotate slowly (0.012 rad/s) so it takes ~130s for Cairo to rotate to back
    let targetAzimuth = 4.168;
    let targetPolar = Math.PI / 2 - 0.15;
    let azimuth = targetAzimuth;
    let polar = targetPolar;
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let autoRotate = true;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    // Raycaster for hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let ringTargetOpacity = 0;
    let ringCurrentOpacity = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true; autoRotate = false;
      if (resumeTimer) clearTimeout(resumeTimer);
      lastX = e.clientX; lastY = e.clientY;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      // Drag rotation
      if (isDragging) {
        targetAzimuth -= (e.clientX - lastX) * 0.005;
        targetPolar -= (e.clientY - lastY) * 0.005;
        targetPolar = Math.max(0.15, Math.min(Math.PI - 0.15, targetPolar));
        lastX = e.clientX; lastY = e.clientY;
      }

      // Hover raycasting
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Ensure globe world matrix is current before picking
      scene.updateMatrixWorld();

      const hits = raycaster.intersectObject(pickSphere);
      if (hits.length > 0) {
        // Convert world hit point to globe-local space
        const localPos = globeGroup.worldToLocal(hits[0].point.clone());
        const [lat, lng] = vector3ToLatLng(localPos, GLOBE_RADIUS);
        const countryId = getCountryId(lat, lng);

        if (countryId !== null) {
          const name = COUNTRY_NAMES[countryId] ?? '';
          // Use canvas-relative position for tooltip
          setHoveredCountry({ name, x: e.clientX - rect.left, y: e.clientY - rect.top });

          // Position ring at hit point on surface
          const surfacePos = localPos.clone().normalize().multiplyScalar(GLOBE_RADIUS * 1.015);
          hoverRing.position.copy(surfacePos);
          const normal = surfacePos.clone().normalize();
          hoverRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
          ringTargetOpacity = 0.85;
        } else {
          setHoveredCountry(null);
          ringTargetOpacity = 0;
        }
      } else {
        setHoveredCountry(null);
        ringTargetOpacity = 0;
      }
    };
    const onPointerUp = () => {
      isDragging = false;
      resumeTimer = setTimeout(() => { autoRotate = true; }, 2500);
    };
    const onPointerLeave = () => {
      setHoveredCountry(null);
      ringTargetOpacity = 0;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    // ---------- Resize ----------
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    // ---------- Animate ----------
    let frameId = 0;
    let lastTime = performance.now();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      const elapsed = now / 1000;
      lastTime = now;

      if (autoRotate && !isDragging) targetAzimuth += dt * 0.012;

      azimuth += (targetAzimuth - azimuth) * 0.1;
      polar += (targetPolar - polar) * 0.1;
      globeGroup.rotation.y = azimuth;
      globeGroup.rotation.x = polar - Math.PI / 2;

      // Animate hover ring opacity + gentle pulse scale
      ringCurrentOpacity += (ringTargetOpacity - ringCurrentOpacity) * 0.12;
      ringMat.opacity = ringCurrentOpacity;
      const pulse = 1 + Math.sin(elapsed * 4) * 0.08;
      hoverRing.scale.setScalar(ringCurrentOpacity > 0.01 ? pulse : 1);

      // Pulse markers
      pulseRings.forEach((ring, i) => {
        const phase = (elapsed * 0.9 + i * 0.5) % 1.6;
        ring.scale.setScalar(1 + phase * 0.8);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.3 - phase * 0.19);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      [normalDotGeo, normalDotMat, hlDotGeo, hlDotMat, oceanGeo, oceanMat, atmGeo, atmMat, ringGeo, ringMat].forEach((o: any) => o.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative', cursor: 'grab', touchAction: 'none' }}
    >
      {hoveredCountry && (
        <div
          style={{
            position: 'absolute',
            left: hoveredCountry.x + 16,
            top: hoveredCountry.y - 16,
            pointerEvents: 'none',
            background: 'rgba(8,4,2,0.82)',
            border: '1px solid rgba(255,90,0,0.5)',
            borderRadius: 4,
            padding: '6px 14px',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.15s',
          }}
        >
          <span style={{ color: '#ff5a00', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {hoveredCountry.name}
          </span>
        </div>
      )}
    </div>
  );
}
