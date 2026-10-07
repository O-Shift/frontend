"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Scattered points orbit a physical lens. Rendering parks offscreen and when paused. */
export default function SignalLens({
  paused,
  rotation,
  variant = "hero",
}: {
  paused: boolean;
  rotation: number;
  variant?: "hero" | "cursor";
}) {
  const mount = useRef<HTMLDivElement>(null);
  const controls = useRef({ paused, rotation });
  useEffect(() => {
    controls.current = { paused, rotation };
  }, [paused, rotation]);
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0x111110, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.z = variant === "cursor" ? 5.6 : 9.3;
    const group = new THREE.Group();
    scene.add(group);
    const geometry = new THREE.TorusGeometry(
      1.62,
      variant === "cursor" ? 0.12 : 0.56,
      64,
      240,
    );
    const positions = geometry.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      v.fromBufferAttribute(positions, i);
      const a = Math.atan2(v.y, v.x);
      const radius = Math.hypot(v.x, v.y);
      const ripple = (variant === "cursor" ? 0.001 : 0.012) * Math.cos(a * 160);
      positions.setXYZ(
        i,
        v.x + (v.x / radius) * ripple,
        v.y + (v.y / radius) * ripple,
        v.z + (variant === "cursor" ? 0 : 0.16) * Math.sin(a * 3),
      );
    }
    geometry.computeVertexNormals();
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xff5a17,
      metalness: 0.48,
      roughness: variant === "cursor" ? 0.12 : 0.34,
      clearcoat: variant === "cursor" ? 1 : 0.3,
      clearcoatRoughness: variant === "cursor" ? 0.06 : 0.35,
      transparent: variant === "cursor",
      opacity: variant === "cursor" ? 0.82 : 1,
    });
    group.add(new THREE.Mesh(geometry, material));
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x713019,
      metalness: 0.7,
      roughness: 0.28,
    });
    const innerGeometry = new THREE.TorusGeometry(1.08, 0.055, 14, 160);
    const inner = new THREE.Mesh(innerGeometry, innerMaterial);
    inner.position.z = -0.11;
    group.add(inner);
    inner.visible = variant !== "cursor";
    const handleGeometry = new THREE.CylinderGeometry(0.115, 0.16, 1.25, 24);
    const handle = new THREE.Mesh(handleGeometry, innerMaterial);
    handle.position.set(1.68, -1.68, 0);
    handle.rotation.z = Math.PI / 4;
    handle.visible = variant === "cursor";
    group.add(handle);
    scene.add(new THREE.AmbientLight(0xffe2cd, 1.1));
    const key = new THREE.DirectionalLight(0xfff4df, 4.5);
    key.position.set(-3, 4, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xff742f, 3);
    fill.position.set(4, -2, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffe4b8, 3);
    rim.position.set(2, 4, -3);
    scene.add(rim);
    const particleGeometry = new THREE.BufferGeometry();
    const particles = new Float32Array(65 * 3);
    for (let i = 0; i < 65; i++) {
      const a = i * 2.39996;
      const r = 2.45 + (i % 7) * 0.09;
      particles[i * 3] = Math.cos(a) * r;
      particles[i * 3 + 1] = Math.sin(a) * r;
      particles[i * 3 + 2] = Math.sin(i * 1.3) * 0.8;
    }
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particles, 3),
    );
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xd6b09a,
      size: 0.024,
      transparent: true,
      opacity: 0.65,
    });
    const points = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(points);
    points.visible = variant !== "cursor";
    let visible = false,
      frame = 0,
      time = 0,
      last = 0;
    let pointerX = 0,
      pointerY = 0,
      currentX = 0,
      currentY = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const render = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      const dt = last ? Math.min((now - last) / 1000, 0.04) : 0;
      last = now;
      if (!controls.current.paused && !motion.matches) time += dt;
      currentX += (pointerX - currentX) * 0.06;
      currentY += (pointerY - currentY) * 0.06;
      group.rotation.y =
        -0.5 +
        Math.sin(time * 0.26) * 0.28 +
        (controls.current.rotation * Math.PI) / 180 +
        (motion.matches ? 0 : currentX * 0.15);
      group.rotation.x =
        0.5 +
        Math.cos(time * 0.23) * 0.08 +
        (motion.matches ? 0 : currentY * 0.12);
      group.rotation.z = -0.38 + Math.sin(time * 0.2) * 0.1;
      if (variant === "cursor") group.rotation.set(0.08, -0.08, 0);
      group.position.y = Math.sin(time * 0.65) * 0.05;
      points.rotation.z = time * 0.018;
      renderer.render(scene, camera);
      if (host.dataset.ready !== "true") host.dataset.ready = "true";
      if (
        (!controls.current.paused && !motion.matches) ||
        Math.abs(currentX - pointerX) + Math.abs(currentY - pointerY) > 0.002
      )
        frame = requestAnimationFrame(render);
    };
    const requestRender = () => {
      if (!frame && visible && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(render);
      }
    };
    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      requestRender();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestRender();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(host);
    const pointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || motion.matches) return;
      const bounds = host.getBoundingClientRect();
      pointerX = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointerY = ((e.clientY - bounds.top) / bounds.height) * 2 - 1;
      requestRender();
    };
    const leave = () => {
      pointerX = 0;
      pointerY = 0;
      requestRender();
    };
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else requestRender();
    };
    const wake = () => requestRender();
    host.addEventListener("pointermove", pointer);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("lens-update", wake);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", wake);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", pointer);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("lens-update", wake);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", wake);
      geometry.dispose();
      material.dispose();
      innerGeometry.dispose();
      handleGeometry.dispose();
      innerMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      delete host.dataset.ready;
    };
  }, [variant]);
  useEffect(() => {
    mount.current?.dispatchEvent(new Event("lens-update"));
  }, [paused, rotation]);
  return (
    <div ref={mount} className="signal-lens" aria-hidden="true">
      <div className="lens-fallback" />
    </div>
  );
}
