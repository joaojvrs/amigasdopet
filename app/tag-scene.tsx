"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import Image from "next/image";
import * as THREE from "three";

type TagSceneProps = {
  progress: MutableRefObject<number>;
};

function createFrontTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");

  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillStyle = "#f7e8ed";
  const toes = [
    [405, 423, 35],
    [477, 381, 38],
    [552, 391, 37],
    [616, 438, 34],
  ];
  toes.forEach(([x, y, radius]) => {
    context.beginPath();
    context.ellipse(x, y, radius, radius * 1.08, -.12, 0, Math.PI * 2);
    context.fill();
  });
  context.beginPath();
  context.moveTo(512, 603);
  context.bezierCurveTo(401, 603, 386, 522, 443, 483);
  context.bezierCurveTo(480, 458, 505, 485, 512, 514);
  context.bezierCurveTo(521, 483, 549, 461, 585, 487);
  context.bezierCurveTo(638, 528, 613, 607, 512, 603);
  context.fill();
  context.fillStyle = "rgba(255,255,255,.88)";
  context.font = "700 30px Arial, sans-serif";
  context.letterSpacing = "8px";
  context.fillText("CUIDADO POR INTEIRO", 512, 744);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

// Crops the real brand mark into a circular, transparent-background decal so the
// tag's back face shows the exact same artwork as the header logo it flips into,
// instead of a lookalike drawn from scratch.
function createCircularLogoTexture(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.beginPath();
  context.arc(512, 512, 500, 0, Math.PI * 2);
  context.clip();
  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export default function TagScene({ progress }: TagSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isNarrowViewport = window.matchMedia("(max-width: 600px)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
    // Closer than a plain "fit the viewport" distance would give — the medallion
    // now lives in its own (narrower) column, so it needs to read as bigger and
    // more present than when it used to fill the whole screen.
    camera.position.set(0, 0, 9.4);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      container.classList.add("is-fallback");
      const fallback = container.querySelector<HTMLElement>(".tag-fallback-object");
      let fallbackFrame = 0;
      const animateFallback = () => {
        if (fallback) {
          const turn = prefersReducedMotion ? 0 : progress.current * (isNarrowViewport ? 450 : 540);
          const tilt = prefersReducedMotion ? -4 : -4 + Math.sin(progress.current * Math.PI * 3) * 9;
          const roll = prefersReducedMotion ? -2 : -2 + Math.sin(progress.current * Math.PI * 2) * 3;
          fallback.style.transform = `rotateX(${tilt}deg) rotateY(${turn}deg) rotateZ(${roll}deg)`;
        }
        fallbackFrame = window.requestAnimationFrame(animateFallback);
      };
      animateFallback();
      return () => {
        window.cancelAnimationFrame(fallbackFrame);
        container.classList.remove("is-fallback");
      };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isNarrowViewport ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const tagGroup = new THREE.Group();
    tagGroup.rotation.set(-.04, 0, -.035);
    scene.add(tagGroup);

    const tagShape = new THREE.Shape();
    tagShape.moveTo(0, 1.12);
    tagShape.bezierCurveTo(.72, 1.12, 1.04, .68, 1.04, .06);
    tagShape.bezierCurveTo(1.04, -.61, .63, -1.06, 0, -1.14);
    tagShape.bezierCurveTo(-.63, -1.06, -1.04, -.61, -1.04, .06);
    tagShape.bezierCurveTo(-1.04, .68, -.72, 1.12, 0, 1.12);
    const geometry = new THREE.ExtrudeGeometry(tagShape, {
      depth: .22,
      bevelEnabled: true,
      bevelSegments: 6,
      bevelSize: .055,
      bevelThickness: .045,
      curveSegments: 72,
      steps: 1,
    });
    geometry.translate(0, 0, -.11);

    const faceMaterial = new THREE.MeshPhysicalMaterial({
      color: "#b84f72",
      roughness: .22,
      metalness: .12,
      clearcoat: 1,
      clearcoatRoughness: .12,
    });
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      color: "#6a3045",
      roughness: .2,
      metalness: .82,
      clearcoat: .72,
    });
    const tag = new THREE.Mesh(geometry, [faceMaterial, edgeMaterial]);
    tag.castShadow = true;
    tag.receiveShadow = true;
    tagGroup.add(tag);

    const frontTexture = createFrontTexture();
    const decalGeometry = new THREE.PlaneGeometry(1.85, 2.08);
    const logoDecalGeometry = new THREE.PlaneGeometry(1.92, 1.92);

    if (frontTexture) {
      const front = new THREE.Mesh(
        decalGeometry,
        new THREE.MeshBasicMaterial({ map: frontTexture, transparent: true, depthWrite: false }),
      );
      front.position.z = .158;
      tagGroup.add(front);
    }

    let cancelled = false;
    let logoTexture: THREE.CanvasTexture | null = null;
    const logoImage = new Image();
    logoImage.onload = () => {
      if (cancelled) return;
      logoTexture = createCircularLogoTexture(logoImage);
      if (!logoTexture) return;
      const back = new THREE.Mesh(
        logoDecalGeometry,
        new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, depthWrite: false }),
      );
      back.position.z = -.158;
      back.rotation.y = Math.PI;
      tagGroup.add(back);
    };
    logoImage.src = "/logo-amigas-do-pet.jpeg";

    const connectorMaterial = new THREE.MeshPhysicalMaterial({
      color: "#b6768b",
      roughness: .16,
      metalness: .9,
      clearcoat: .78,
    });
    const eyelet = new THREE.Mesh(
      new THREE.TorusGeometry(.115, .035, 18, 64),
      connectorMaterial,
    );
    eyelet.position.set(0, .98, .17);
    tagGroup.add(eyelet);

    const ringPivot = new THREE.Group();
    ringPivot.position.y = 1.34;
    tagGroup.add(ringPivot);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(.235, .042, 20, 72),
      connectorMaterial,
    );
    ringPivot.add(ring);

    scene.add(new THREE.HemisphereLight("#ffffff", "#d9b4ba", 2.25));
    const key = new THREE.DirectionalLight("#ffffff", 4.8);
    key.position.set(-3.2, 4.4, 6);
    scene.add(key);
    const pink = new THREE.PointLight("#f095ad", 28, 10);
    pink.position.set(3.5, -1, 3.2);
    scene.add(pink);
    const green = new THREE.PointLight("#87a78a", 24, 10);
    green.position.set(-3.7, 1, 2.6);
    scene.add(green);

    const pointer = new THREE.Vector2();
    const targetPointer = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      targetPointer.x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
      targetPointer.y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    };
    const onPointerLeave = () => targetPointer.set(0, 0);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    // The spin is driven directly by scroll progress (no easing lag) so it always
    // finishes exactly on cue — no drifting behind and getting cut off mid-turn.
    // SPIN_END must match the same constant in amigas-experience.tsx: the reveal
    // (dissolve into the standalone logo) starts right when the spin locks flat.
    // TOTAL_TURNS is a number ending in .5 so the final angle lands on the back
    // face (the real logo texture) facing the camera, not the front paw art.
    // Computed once (not per frame): fewer turns on small screens (performance)
    // and under prefers-reduced-motion (still resolves to the logo, just calmer).
    const SPIN_END = .94;
    const TOTAL_TURNS = prefersReducedMotion ? 0 : (isNarrowViewport ? 0.5 : 1.5);
    const BASE_SCALE = isNarrowViewport ? 1.12 : 1;

    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const time = clock.getElapsedTime();
      const currentProgress = progress.current;
      pointer.lerp(targetPointer, .055);

      const spinProgress = Math.min(currentProgress / SPIN_END, 1);
      const easedSpinProgress = THREE.MathUtils.smoothstep(spinProgress, 0, 1);
      const rotationY = easedSpinProgress * TOTAL_TURNS * Math.PI * 2;

      const settle = THREE.MathUtils.smoothstep(spinProgress, .8, 1);
      const stillness = prefersReducedMotion ? 0 : 1 - settle;

      // A very small, progress-derived scale drift — never time/random-driven —
      // so the object gains a touch of depth as it spins without ever reading
      // as an uncontrolled floating object.
      tagGroup.scale.setScalar(BASE_SCALE * (prefersReducedMotion ? 1 : 1 + spinProgress * .05));

      tagGroup.rotation.y = rotationY;
      tagGroup.rotation.x += ((-.04 + Math.sin(rotationY) * .16 * stillness + pointer.y * .035 * stillness) - tagGroup.rotation.x) * .07;
      tagGroup.rotation.z += ((-.035 + Math.sin(time * .72) * .025 * stillness - pointer.x * .025 * stillness) - tagGroup.rotation.z) * .06;
      tagGroup.position.y = Math.sin(time * .82) * .055 * stillness;
      tagGroup.position.x = pointer.x * .055 * stillness;
      ringPivot.rotation.z = (Math.sin(time * .9) * .08 - pointer.x * .045) * stillness;
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      frontTexture?.dispose();
      logoTexture?.dispose();
      decalGeometry.dispose();
      logoDecalGeometry.dispose();
      geometry.dispose();
      faceMaterial.dispose();
      edgeMaterial.dispose();
      connectorMaterial.dispose();
      renderer.dispose();
    };
  }, [progress]);

  return (
    <>
      <canvas ref={canvasRef} className="tag-canvas" aria-label="Plaquinha 3D da Amigas do Pet" />
      <div className="tag-fallback" aria-hidden="true">
        <div className="tag-fallback-object">
          <div className="tag-fallback-ring" />
          <div className="tag-fallback-face tag-fallback-front">
            <div className="tag-fallback-paw"><span>●</span><span>●</span><span>●</span><span>●</span><b>♥</b></div>
            <small>Cuidado por inteiro</small>
          </div>
          <div className="tag-fallback-face tag-fallback-back">
            <Image
              className="tag-fallback-logo"
              src="/logo-amigas-do-pet.jpeg"
              width={180}
              height={180}
              unoptimized
              alt=""
            />
          </div>
        </div>
      </div>
    </>
  );
}
