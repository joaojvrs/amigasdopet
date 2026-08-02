"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import TagScene from "./tag-scene";

const WHATSAPP_URL = "https://wa.me/5513997454144";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Rua+Jo%C3%A3o+Roberto+Corr%C3%AAa+1884%2C+Praia+Grande%2C+SP%2C+11722-210";
const MAPS_EMBED_URL = "https://www.google.com/maps?q=Rua+Jo%C3%A3o+Roberto+Corr%C3%AAa+1884%2C+Praia+Grande%2C+SP%2C+11722-210&output=embed";

type NarrativeStep = {
  key: string;
  start: number;
  end: number;
  eyebrow?: string;
  heading?: string;
  brand?: string;
  lead?: string;
  body?: string;
  note?: string;
};

// Narrative steps for the opening scene, keyed to the same 0–1 scroll progress
// that drives the medallion (see SPIN_END below). Ranges leave a quiet gap
// between .76 and .88 on purpose — that's where the medallion locks flat and
// the canvas-to-logo crossfade happens, so the text gets out of the way.
const NARRATIVE_STEPS: NarrativeStep[] = [
  {
    key: "intro", start: 0, end: .18,
    eyebrow: "Clínica veterinária para cães e gatos",
    heading: "Seu pet merece se sentir bem desde o primeiro momento.",
    body: "Na Amigas do Pet, cuidado, acolhimento e atenção acompanham cada fase da vida.",
    note: "Cuidado veterinário com acolhimento e atenção em cada consulta.",
  },
  { key: "step1", start: .18, end: .38, lead: "Onde seu pet é recebido com carinho." },
  { key: "step2", start: .38, end: .58, lead: "Com estrutura, atenção e cuidado de verdade." },
  { key: "step3", start: .58, end: .84, lead: "Atendimento veterinário com carinho e cuidado de verdade." },
  {
    key: "final", start: .94, end: 1,
    brand: "Bem-vindo à Clínica Amigas do Pet",
    lead: "Cuidado completo para cada momento do seu pet.",
  },
];

const visualServices = [
  {
    eyebrow: "Avaliação e acompanhamento",
    title: "Consultas e cardiologia",
    description: "Cuidado clínico completo, do acompanhamento preventivo à investigação de alterações no coração.",
    whenToSeek: "Mudanças de comportamento, falta de apetite, tosse, cansaço, dificuldade para respirar ou check-up de rotina.",
    services: [
      { name: "Consultas", detail: "Avaliação do estado geral, investigação de sintomas e orientação para cada fase da vida." },
      { name: "Cardiologia", detail: "Acompanhamento do coração para prevenir, identificar e controlar alterações cardíacas." },
    ],
    image: "https://images.unsplash.com/photo-1725409796872-8b41e8eca929?auto=format&fit=crop&q=86&w=1800",
    tone: "rose",
  },
  {
    eyebrow: "Proteção em cada fase",
    title: "Vacinação",
    description: "Protocolos definidos de acordo com a espécie, a idade, o histórico e o estilo de vida do seu pet.",
    whenToSeek: "Filhotes iniciando o protocolo, reforços anuais, carteira atrasada ou dúvidas sobre quais vacinas são necessárias.",
    services: [
      { name: "Vacinas", detail: "Aplicação segura, orientação sobre reforços e organização do calendário vacinal." },
    ],
    image: "https://images.unsplash.com/photo-1770836037275-38b44e4b101f?auto=format&fit=crop&q=86&w=1800",
    tone: "cream",
  },
  {
    eyebrow: "Investigação e diagnóstico",
    title: "Exames e diagnóstico por imagem",
    description: "Recursos que ajudam o veterinário a compreender o que está acontecendo e escolher a conduta mais segura.",
    whenToSeek: "Quando houver sintomas persistentes, necessidade de confirmação diagnóstica ou acompanhamento solicitado pelo veterinário.",
    services: [
      { name: "Exames laboratoriais", detail: "Análises que auxiliam na avaliação de órgãos, infecções e alterações do organismo." },
      { name: "Ultrassonografia", detail: "Visualização em tempo real dos órgãos internos, de forma não invasiva." },
      { name: "Radiografia", detail: "Imagens para investigar ossos, articulações, tórax e outras estruturas." },
    ],
    image: "https://images.unsplash.com/photo-1770836037183-e0b4471fe2c0?auto=format&fit=crop&q=86&w=1800",
    tone: "green",
  },
  {
    eyebrow: "Suporte e recuperação",
    title: "Cirurgias e internação",
    description: "Estrutura para procedimentos e para animais que precisam permanecer sob cuidado e observação da equipe.",
    whenToSeek: "Procedimentos indicados pelo veterinário ou quadros que exigem medicação, monitoramento e cuidados contínuos.",
    services: [
      { name: "Cirurgias", detail: "Acompanhamento cuidadoso antes, durante e depois do procedimento." },
      { name: "Internação", detail: "Observação, medicação e suporte contínuo durante a recuperação." },
    ],
    image: "https://images.unsplash.com/photo-1599443015574-be5fe8a05783?auto=format&fit=crop&q=86&w=1800",
    tone: "dark",
  },
  {
    eyebrow: "Manejo especializado",
    title: "Atendimento de animais silvestres",
    description: "Avaliação responsável para aves e outros animais silvestres, respeitando o comportamento e as necessidades de cada espécie.",
    whenToSeek: "Alterações de alimentação, comportamento, respiração, plumagem, mobilidade ou para acompanhamento preventivo.",
    services: [
      { name: "Animais silvestres", detail: "Consulta com manejo atento às particularidades e ao bem-estar de cada animal." },
    ],
    image: "https://images.unsplash.com/photo-1742408812690-0879425fd452?auto=format&fit=crop&q=86&w=1800",
    tone: "rose",
  },
];

export default function AmigasExperience() {
  const root = useRef<HTMLDivElement>(null);
  const tagProgress = useRef(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // Defensive: under Vite/Next Fast Refresh, a stray ScrollTrigger from a
    // pre-edit version of this effect can otherwise survive a hot reload
    // and fight the freshly created pin (duplicate pin-spacer, wrong
    // start/end math) — killing everything before rebuilding guarantees a
    // clean slate on every (re)mount, not just a full page load.
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    let servicesResizeObserver: ResizeObserver | null = null;
    let servicesRefreshFrame = 0;
    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Shared with tag-scene.tsx: the spin locks flat on the back face (the
      // real logo texture) exactly at this progress value. The medallion never
      // leaves its column — TagScene's rotation is fully deterministic, driven
      // straight off this same progress, so it always lands on cue.
      const SPIN_END = .94;
      const REVEAL_CROSSFADE_END = .97; // canvas fades out / logo fades in, near-matched scale
      const REVEAL_GROW_END = 1; // logo takes over after the two-scroll reveal

      const stepEls = Array.from(
        root.current?.querySelectorAll<HTMLElement>(".tag-narrative-step") ?? [],
      );
      const steps = stepEls
        .map((el) => {
          const step = NARRATIVE_STEPS.find((s) => s.key === el.dataset.step);
          return step ? { el, step, margin: Math.min(.035, (step.end - step.start) / 2) } : null;
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      const promptEl = root.current?.querySelector<HTMLElement>(".tag-prompt") ?? null;
      const canvasWrapEl = root.current?.querySelector<HTMLElement>(".tag-canvas-wrap") ?? null;
      const revealLogoEl = root.current?.querySelector<HTMLElement>(".tag-reveal-logo") ?? null;
      const revealLogoFrameEl = root.current?.querySelector<HTMLElement>(".tag-reveal-logo-frame") ?? null;

      let hasPulsed = false;

      // Single per-frame driver, reusing the one scroll listener for every bit
      // of the opening narrative — no extra listeners, no React state, plain
      // style writes on cached elements (see section 12 of the brief: avoid
      // concurrent scroll listeners and per-frame re-renders).
      const applyProgress = (p: number) => {
        tagProgress.current = p;

        for (const { el, step, margin } of steps) {
          const fadeIn = step.start <= 0 ? 1 : gsap.utils.clamp(0, 1, (p - step.start) / margin);
          const fadeOut = step.end >= 1 ? 1 : gsap.utils.clamp(0, 1, (step.end - p) / margin);
          const o = Math.max(0, Math.min(fadeIn, fadeOut));
          el.style.opacity = String(o);
          if (prefersReducedMotion) {
            el.style.transform = "none";
            el.style.filter = "none";
          } else {
            el.style.transform = `translateY(${(1 - o) * 14}px)`;
            el.style.filter = `blur(${(1 - o) * 1.4}px)`;
          }
        }

        if (promptEl) {
          promptEl.style.opacity = String(1 - gsap.utils.clamp(0, 1, p / .22));
        }

        if (canvasWrapEl && revealLogoEl && revealLogoFrameEl) {
          const crossT = gsap.utils.clamp(0, 1, (p - SPIN_END) / (REVEAL_CROSSFADE_END - SPIN_END));
          const growT = gsap.utils.clamp(
            0, 1, (p - REVEAL_CROSSFADE_END) / (REVEAL_GROW_END - REVEAL_CROSSFADE_END),
          );

          // Canvas dissolves and shrinks only slightly during the crossfade
          // itself, so the two don't diverge in scale while both are visible.
          canvasWrapEl.style.opacity = String(1 - crossT);
          canvasWrapEl.style.transform = `scale(${1 - crossT * .05})`;

          // The logo is born close to the tag's own on-screen size (.62) and
          // only grows to full size (1) after the crossfade has finished.
          revealLogoEl.style.opacity = String(crossT);
          revealLogoFrameEl.style.transform = `scale(${.62 + .38 * growT})`;

          if (p >= SPIN_END && !hasPulsed) {
            hasPulsed = true;
            canvasWrapEl.style.filter = "brightness(1.16)";
            window.setTimeout(() => {
              canvasWrapEl.style.filter = "brightness(1)";
            }, 220);
          } else if (p < SPIN_END && hasPulsed) {
            hasPulsed = false;
            canvasWrapEl.style.filter = "brightness(1)";
          }
        }
      };

      const scrollTrigger = ScrollTrigger.create({
        trigger: ".tag-intro",
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => applyProgress(self.progress),
      });
      applyProgress(scrollTrigger.progress);

      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, {
          y: 60, opacity: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 84%", toggleActions: "play none none reverse" },
        });
      });
      gsap.to(".video-shell", {
        clipPath: "inset(0% 0% 0% 0% round 40px)", scale: 1,
        scrollTrigger: { trigger: ".care-film", start: "top 85%", end: "top 25%", scrub: 1 },
      });
      gsap.fromTo(".consultation-video", { scale: 1.16 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: ".consultation-film", start: "top bottom", end: "bottom top", scrub: 1 },
      });
      gsap.fromTo(".consultation-copy", { yPercent: 30, opacity: .2 }, {
        yPercent: -18, opacity: 1, ease: "none",
        scrollTrigger: { trigger: ".consultation-film", start: "top 75%", end: "bottom 35%", scrub: 1 },
      });
      // Desktop uses GSAP pinning. Mobile uses a tall vertical corridor with a
      // sticky viewport: the page keeps scrolling vertically while the track
      // moves horizontally. This avoids both native sideways dragging and the
      // mobile pin/normalizer deadlock.
      const servicesWindow = root.current?.querySelector<HTMLElement>("#services-hscroll");
      const servicesTrack = root.current?.querySelector<HTMLElement>(".visual-services");
      const isDesktop = window.matchMedia("(min-width: 901px)").matches;
      if (servicesWindow && servicesTrack && !prefersReducedMotion) {
        const getScroll = () => Math.max(0, servicesTrack.scrollWidth - servicesWindow.clientWidth);

        const addMediaParallax = (start: string) => {
          gsap.utils.toArray<HTMLElement>(".service-visual-media").forEach((img) => {
            gsap.fromTo(img, { xPercent: -6 }, {
              xPercent: 6, ease: "none",
              scrollTrigger: {
                trigger: servicesWindow,
                start,
                end: () => "+=" + getScroll(),
                scrub: true,
              },
            });
          });
        };

        if (isDesktop) {
          ScrollTrigger.config({ ignoreMobileResize: true });

          // Set before measuring so the desktop pinned sizing is active when
          // scrollWidth and clientWidth are read.
          servicesWindow.classList.add("is-pinned");

          gsap.to(servicesTrack, {
            x: () => -getScroll(),
            ease: "none",
            scrollTrigger: {
              trigger: servicesWindow,
              start: "top 12%",
              end: () => "+=" + getScroll(),
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
              anticipatePin: 1,
              fastScrollEnd: true,
            },
          });
          addMediaParallax("top 12%");
        } else {
          servicesWindow.classList.add("is-mobile-scroll");

          const updateMobileDistance = () => {
            servicesWindow.style.setProperty("--services-scroll-distance", `${getScroll()}px`);
          };
          updateMobileDistance();

          gsap.to(servicesTrack, {
            x: () => -getScroll(),
            ease: "none",
            scrollTrigger: {
              trigger: servicesWindow,
              start: "top 74px",
              end: () => "+=" + getScroll(),
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
          addMediaParallax("top 74px");

          if (typeof ResizeObserver !== "undefined") {
            const refreshMobileServices = () => {
              cancelAnimationFrame(servicesRefreshFrame);
              servicesRefreshFrame = requestAnimationFrame(() => {
                updateMobileDistance();
                ScrollTrigger.refresh();
              });
            };
            servicesResizeObserver = new ResizeObserver(refreshMobileServices);
            servicesResizeObserver.observe(servicesWindow);
            servicesResizeObserver.observe(servicesTrack);
          }
        }
      }
    }, root);
    return () => {
      servicesResizeObserver?.disconnect();
      cancelAnimationFrame(servicesRefreshFrame);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={root} className="site-shell">
      <header className="header">
        <a href="#inicio" className="brand" aria-label="Amigas do Pet — início">
          <Image unoptimized src="/logo-amigas-do-pet.jpeg" width={58} height={58} alt="Logo Amigas do Pet" priority />
          <span>Amigas do Pet<small>Veterinária</small></span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#cuidado">Nosso cuidado</a>
          <a href="#servicos">Serviços</a>
          <a className="nav-cta" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Agendar atendimento</a>
        </nav>
      </header>

      <section className="tag-intro" id="inicio" aria-label="Apresentação da Amigas do Pet">
        <div className="tag-sticky">
          <div className="tag-aura tag-aura-pink" aria-hidden="true" />
          <div className="tag-aura tag-aura-green" aria-hidden="true" />

          <div className="tag-narrative">
            {NARRATIVE_STEPS.map((step) => (
              // Server-rendered opacity: only the step that owns progress 0 is
              // visible in the first paint. Without this the whole stack renders
              // at full opacity until the scroll driver's first applyProgress()
              // call, and every step overlaps the others (they all sit at
              // inset: 0). With scripting disabled entirely, the
              // `scripting: none` block in globals.css un-stacks the steps into
              // normal flow so all of them stay legible.
              <div
                key={step.key}
                className="tag-narrative-step"
                data-step={step.key}
                style={{ opacity: step.start <= 0 ? 1 : 0 }}
              >
                {step.eyebrow && <p className="eyebrow">{step.eyebrow}</p>}
                {step.heading && <h1>{step.heading}</h1>}
                {step.brand && <p className="tag-narrative-brand">{step.brand}</p>}
                {step.lead && <p className="tag-narrative-lead">{step.lead}</p>}
                {step.body && <p className="tag-narrative-body">{step.body}</p>}
                {step.note && <p className="tag-narrative-note">{step.note}</p>}
                {step.key === "intro" && (
                  <div className="hero-actions">
                    <a className="hero-primary" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Agendar atendimento <span>↗</span></a>
                  </div>
                )}
              </div>
            ))}
            <div className="tag-prompt" aria-hidden="true">
              <span />
              Role para conhecer
            </div>
          </div>

          <div className="tag-stage">
            <div className="tag-stage-backdrop" aria-hidden="true" />
            <div className="tag-stage-ring" aria-hidden="true" />
            <div className="tag-canvas-wrap">
              <TagScene progress={tagProgress} />
            </div>
            <div className="tag-reveal-logo">
              <div className="tag-reveal-logo-frame">
                <Image
                  src="/logo-amigas-do-pet.jpeg"
                  width={460}
                  height={460}
                  sizes="(max-width: 600px) 48vw, (max-width: 900px) 36vw, 30vw"
                  alt="Amigas do Pet"
                  unoptimized
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main>
        <section id="cuidado" className="care-film">
          <div className="film-intro reveal">
            <p className="eyebrow">Diagnóstico com delicadeza</p>
            <h2>Tecnologia precisa.<br /><em>Afeto em cada gesto.</em></h2>
            <p className="film-description">O exame mais avançado ainda começa com uma coisa simples: fazer seu pet se sentir seguro.</p>
          </div>
          <div className="video-shell">
            <video autoPlay muted loop playsInline preload="metadata">
              <source src="/video/ultrasound.mp4" type="video/mp4" />
            </video>
          </div>
        </section>

        <section className="manifesto">
          <div className="manifesto-mark reveal">“</div>
          <p className="reveal">Eles não explicam onde dói.<br />Por isso, nós aprendemos a <em>observar, escutar e sentir.</em></p>
        </section>

        <section className="consultation-film" aria-label="Consulta veterinária">
          <div className="consultation-stage">
            <video className="consultation-video" autoPlay muted loop playsInline preload="metadata">
              <source src="/video/consultation.mp4" type="video/mp4" />
            </video>
            <div className="consultation-shade" />
            <div className="consultation-copy">
              <p className="eyebrow">A consulta por dentro</p>
              <h2>Presença para perceber<br />até o que <em>não é dito.</em></h2>
              <p>Olhar atento, mãos cuidadosas e tempo para que seu pet se sinta seguro.</p>
            </div>
          </div>
        </section>

        <section id="servicos" className="services">
          <div className="services-head reveal">
            <div className="services-kicker"><span className="services-number">01</span><p className="eyebrow">Especialistas em cães e gatos, muitas formas de cuidar</p></div>
            <div className="services-heading-copy">
              <h2>Nossos <em>serviços.</em></h2>
              <p>Encontre o cuidado indicado para cada momento — da prevenção ao diagnóstico, do tratamento à recuperação.</p>
            </div>
          </div>
          {/* The gallery advances with vertical scroll on every width now, so
              the hint must not tell people to swipe sideways. */}
          <div className="services-scroll-note"><span>Role para explorar</span><i>→</i></div>
          <div className="services-hscroll" id="services-hscroll">
            <div className="services-sticky">
              <div className="visual-services">
                {visualServices.map((item, index) => (
                  <motion.article key={item.title} whileHover={{ y: -8 }} transition={{ duration: .45, ease: "easeOut" }} className="service-visual">
                    <div className="service-visual-frame">
                      <Image
                        className="service-visual-media"
                        src={item.image}
                        alt=""
                        fill
                        unoptimized
                        sizes="(max-width: 600px) 76vw, 40vw"
                      />
                    </div>
                    <div className="service-visual-caption">
                      <span className="service-count">{String(index + 1).padStart(2, "0")}</span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contato" className="closing">
          <div className="clinic-map reveal">
            <iframe
              src={MAPS_EMBED_URL}
              title="Mapa da Clínica Amigas do Pet"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="closing-copy reveal">
            <p className="eyebrow">Onde nos encontrar</p>
            <h2>Venha cuidar<br />de quem você <em>ama.</em></h2>
            <p>Conte pra gente quem está precisando de atenção. Nossa equipe está pronta para acolher vocês.</p>
            <address className="clinic-address">
              Rua João Roberto Corrêa, 1884<br />
              Praia Grande, São Paulo — CEP 11722-210
            </address>
            <div className="closing-actions">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="primary">Agendar atendimento <span>↗</span></a>
              <a href={MAPS_URL} target="_blank" rel="noreferrer" className="maps-link">Como chegar no Google Maps <span>↗</span></a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="brand footer-brand">
          <Image unoptimized src="/logo-amigas-do-pet.jpeg" width={52} height={52} alt="" />
          <span>Amigas do Pet<small>Veterinária</small></span>
        </div>
        <div className="footer-contact">
          <strong>Contato</strong>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">WhatsApp: (13) 99745-4144</a>
          <a href={MAPS_URL} target="_blank" rel="noreferrer">Rua João Roberto Corrêa, 1884<br />Praia Grande — SP, CEP 11722-210</a>
        </div>
        <details className="visual-credits">
          <summary>Créditos visuais</summary>
          <div>
            <a href="https://www.pexels.com/video/doctor-checking-the-dog-6235188/" target="_blank" rel="noreferrer">Vídeo de ultrassonografia — Pexels</a>
            <a href="https://www.pexels.com/video/veterinarian-checking-dog-s-mouth-6235186/" target="_blank" rel="noreferrer">Vídeo de consulta — Pexels</a>
            <a href="https://unsplash.com/photos/5Bi6MWlWMbw" target="_blank" rel="noreferrer">Foto — Judy Beth Morris</a>
            <a href="https://unsplash.com/photos/fQeLC7WlNm8" target="_blank" rel="noreferrer">Foto — Alexander Mass</a>
            <a href="https://unsplash.com/photos/q-1iFFFN6ls" target="_blank" rel="noreferrer">Foto — Alexander Mass</a>
            <a href="https://unsplash.com/photos/2hc6ocDAsNY" target="_blank" rel="noreferrer">Foto — Priscilla Du Preez</a>
            <a href="https://unsplash.com/photos/a-cockatiel-perched-on-someones-knee-0f0SyZ-SH8U" target="_blank" rel="noreferrer">Foto — Anya Akbari</a>
          </div>
        </details>
        <a href="#inicio">Voltar ao início ↑</a>
      </footer>
    </div>
  );
}
