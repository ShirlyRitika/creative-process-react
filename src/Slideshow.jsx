import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "@studio-freight/lenis";

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create("customEase", "M0,0 C0.86,0 0.07,1 1,1");

function splitWords(element) {
  const text = element.textContent.trim();
  element.innerHTML = "";
  const words = text.split(/\s+/).map((w) => {
    const span = document.createElement("span");
    span.className = "split-word";
    span.textContent = w + " ";
    const mask = document.createElement("span");
    mask.className = "word-mask";
    mask.appendChild(span);
    element.appendChild(mask);
    return span;
  });
  return words;
}

class SoundManager {
  constructor() {
    this.sounds = {};
    this.isEnabled = false;
    this.load(
      "hover",
      "https://assets.codepen.io/7558/click-reverb-001.mp3",
      0.15
    );
    this.load(
      "click",
      "https://assets.codepen.io/7558/shutter-fx-001.mp3",
      0.3
    );
    this.load(
      "textChange",
      "https://assets.codepen.io/7558/whoosh-fx-001.mp3",
      0.3
    );
  }
  load(name, url, volume = 0.3) {
    const a = new Audio(url);
    a.preload = "auto";
    a.volume = volume;
    this.sounds[name] = a;
  }
  enable() {
    this.isEnabled = true;
  }
  play(name, delay = 0) {
    if (!this.isEnabled || !this.sounds[name]) return;
    const a = this.sounds[name];
    const go = () => {
      a.currentTime = 0;
      a.play().catch(() => {});
    };
    delay > 0 ? setTimeout(go, delay) : go();
  }
}

export default function Slideshow() {
  const rootRef = useRef(null);
  const soundRef = useRef(null);

  useEffect(() => {
    soundRef.current = new SoundManager();

    const root = rootRef.current;
    const loadingOverlay = root.querySelector("#loading-overlay");
    const loadingCounter = root.querySelector("#loading-counter");
    const debugInfo = root.querySelector("#debug-info");
    const fixedContainer = root.querySelector("#fixed-container");
    const fixedSectionElement = root.querySelector(".fixed-section");
    const header = root.querySelector(".header");
    const content = root.querySelector(".content");
    const footer = root.querySelector("#footer");
    const leftColumn = root.querySelector("#left-column");
    const rightColumn = root.querySelector("#right-column");
    const featured = root.querySelector("#featured");
    const backgrounds = root.querySelectorAll(".background-image");
    const artists = root.querySelectorAll(".artist");
    const categories = root.querySelectorAll(".category");
    const featuredContents = root.querySelectorAll(".featured-content");
    const progressFill = root.querySelector("#progress-fill");
    const currentSectionDisplay = root.querySelector("#current-section");

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    let counter = 0;
    const interval = setInterval(() => {
      counter += Math.random() * 3 + 1;
      if (counter >= 100) {
        counter = 100;
        clearInterval(interval);
        gsap.to(loadingOverlay.querySelector(".loading-counter"), {
          opacity: 0,
          y: -20,
          duration: 0.6,
          ease: "power2.inOut",
        });
        gsap.to(loadingOverlay.childNodes[0], {
          opacity: 0,
          y: -20,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.to(loadingOverlay, {
              y: "-100%",
              duration: 1.2,
              ease: "power3.inOut",
              delay: 0.3,
              onComplete: () => {
                loadingOverlay.style.display = "none";
                animateColumns();
              },
            });
          },
        });
      }
      loadingCounter.textContent = `[${String(Math.floor(counter)).padStart(
        2,
        "0"
      )}]`;
    }, 30);

    function animateColumns() {
      artists.forEach((el, i) =>
        setTimeout(() => el.classList.add("loaded"), i * 60)
      );
      categories.forEach((el, i) =>
        setTimeout(() => el.classList.add("loaded"), i * 60 + 200)
      );
    }

    // Split featured headings into words
    const splits = {};
    featuredContents.forEach((fc, idx) => {
      const h3 = fc.querySelector("h3");
      if (!h3) return;
      const words = splitWords(h3);
      splits[`featured-${idx}`] = words;
      if (idx !== 0) {
        gsap.set(words, { yPercent: 100, opacity: 0 });
      } else {
        gsap.set(words, { yPercent: 0, opacity: 1 });
      }
    });

    const fixedSectionTop = fixedSectionElement.offsetTop;
    const fixedSectionHeight = fixedSectionElement.offsetHeight;
    let currentSection = 0;
    let isAnimating = false;
    let isSnapping = false;
    let lastProgress = 0;
    let scrollDirection = 0;
    const sectionPositions = [];
    for (let i = 0; i < 10; i++) {
      sectionPositions.push(fixedSectionTop + (fixedSectionHeight * i) / 10);
    }

    function updateProgressNumbers() {
      currentSectionDisplay.textContent = String(currentSection + 1).padStart(
        2,
        "0"
      );
    }
    updateProgressNumbers();

    artists.forEach((artist, idx) => {
      artist.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(idx);
      });
      artist.addEventListener("mouseenter", () => {
        soundRef.current.enable();
        soundRef.current.play("hover");
      });
    });
    categories.forEach((cat, idx) => {
      cat.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(idx);
      });
      cat.addEventListener("mouseenter", () => {
        soundRef.current.enable();
        soundRef.current.play("hover");
      });
    });
    document.addEventListener("click", () => soundRef.current.enable(), {
      once: true,
    });

    function navigateTo(index) {
      if (index === currentSection || isAnimating || isSnapping) return;
      soundRef.current.enable();
      soundRef.current.play("click");
      isSnapping = true;
      changeSection(index);
      lenis.scrollTo(sectionPositions[index], {
        duration: 0.8,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        lock: true,
        onComplete: () => {
          isSnapping = false;
        },
      });
    }

    gsap.set(fixedContainer, { height: "100vh" });
    ScrollTrigger.create({
      trigger: ".fixed-section",
      start: "top top",
      end: "bottom bottom",
      pin: ".fixed-container",
      pinSpacing: true,
      onUpdate: (self) => {
        if (isSnapping) return;
        const progress = self.progress;
        const delta = progress - lastProgress;
        if (Math.abs(delta) > 0.001) scrollDirection = delta > 0 ? 1 : -1;
        const target = Math.min(9, Math.floor(progress * 10));
        if (target !== currentSection && !isAnimating) {
          const next = currentSection + (target > currentSection ? 1 : -1);
          snapTo(next);
        }
        lastProgress = progress;
        progressFill.style.width = `${(currentSection / 9) * 100}%`;
        debugInfo.textContent = `Section: ${currentSection}, Target: ${target}, Progress: ${progress.toFixed(
          3
        )}, Direction: ${scrollDirection}`;
      },
    });

    function snapTo(target) {
      if (target < 0 || target > 9 || target === currentSection || isAnimating)
        return;
      isSnapping = true;
      changeSection(target);
      lenis.scrollTo(sectionPositions[target], {
        duration: 0.6,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        lock: true,
        onComplete: () => {
          isSnapping = false;
        },
      });
    }

    const duration = 0.64;
    const parallaxAmount = 5;

    function changeSection(newSection) {
      if (newSection === currentSection || isAnimating) return;
      isAnimating = true;
      const isDown = newSection > currentSection;
      const prev = currentSection;
      currentSection = newSection;
      updateProgressNumbers();
      progressFill.style.width = `${(currentSection / 9) * 100}%`;
      debugInfo.textContent = `Changing to Section: ${newSection} (${
        isDown ? "Down" : "Up"
      })`;

      featuredContents.forEach((fc, i) => {
        if (i !== newSection && i !== prev) {
          fc.classList.remove("active");
          gsap.set(fc, { visibility: "hidden", opacity: 0 });
        }
      });
      if (prev !== null) {
        const prevWords = splits[`featured-${prev}`];
        if (prevWords) {
          gsap.to(prevWords, {
            yPercent: isDown ? -100 : 100,
            opacity: 0,
            duration: duration * 0.6,
            stagger: isDown ? 0.03 : -0.03,
            ease: "customEase",
            onComplete: () => {
              featuredContents[prev].classList.remove("active");
              gsap.set(featuredContents[prev], { visibility: "hidden" });
            },
          });
        }
      }
      const newWords = splits[`featured-${newSection}`];
      if (newWords) {
        soundRef.current.play("textChange", 250);
        featuredContents[newSection].classList.add("active");
        gsap.set(featuredContents[newSection], {
          visibility: "visible",
          opacity: 1,
        });
        gsap.set(newWords, { yPercent: isDown ? 100 : -100, opacity: 0 });
        gsap.to(newWords, {
          yPercent: 0,
          opacity: 1,
          duration: duration,
          stagger: isDown ? 0.05 : -0.05,
          ease: "customEase",
        });
      }

      backgrounds.forEach((bg, i) => {
        bg.classList.remove("previous", "active");
        if (i === newSection) {
          if (isDown) {
            gsap.set(bg, { opacity: 1, y: 0, clipPath: "inset(100% 0 0 0)" });
            gsap.to(bg, {
              clipPath: "inset(0% 0 0 0)",
              duration: duration,
              ease: "customEase",
            });
          } else {
            gsap.set(bg, { opacity: 1, y: 0, clipPath: "inset(0 0 100% 0)" });
            gsap.to(bg, {
              clipPath: "inset(0 0 0% 0)",
              duration: duration,
              ease: "customEase",
            });
          }
          bg.classList.add("active");
        } else if (i === prev) {
          bg.classList.add("previous");
          gsap.to(bg, {
            y: isDown ? `${parallaxAmount}%` : `-${parallaxAmount}%`,
            duration: duration,
            ease: "customEase",
          });
          gsap.to(bg, {
            opacity: 0,
            delay: duration * 0.5,
            duration: duration * 0.5,
            ease: "customEase",
            onComplete: () => {
              bg.classList.remove("previous");
              gsap.set(bg, { y: 0 });
              isAnimating = false;
            },
          });
        } else {
          gsap.to(bg, {
            opacity: 0,
            duration: duration * 0.3,
            ease: "customEase",
          });
        }
      });

  
      artists.forEach((el, i) => {
        if (i === newSection) {
          el.classList.add("active");
          gsap.to(el, { opacity: 1, duration: 0.3, ease: "power2.out" });
        } else {
          el.classList.remove("active");
          gsap.to(el, { opacity: 0.3, duration: 0.3, ease: "power2.out" });
        }
      });
      categories.forEach((el, i) => {
        if (i === newSection) {
          el.classList.add("active");
          gsap.to(el, { opacity: 1, duration: 0.3, ease: "power2.out" });
        } else {
          el.classList.remove("active");
          gsap.to(el, { opacity: 0.3, duration: 0.3, ease: "power2.out" });
        }
      });
    }

    ScrollTrigger.create({
      trigger: ".end-section",
      start: "top center",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (self.progress > 0.1) {
          footer.classList.add("blur");
          leftColumn.classList.add("blur");
          rightColumn.classList.add("blur");
          featured.classList.add("blur");
        } else {
          footer.classList.remove("blur");
          leftColumn.classList.remove("blur");
          rightColumn.classList.remove("blur");
          featured.classList.remove("blur");
        }
        if (self.progress > 0.1) {
          const newH = Math.max(0, 100 - ((self.progress - 0.1) / 0.9) * 100);
          gsap.to(fixedContainer, {
            height: `${newH}vh`,
            duration: 0.1,
            ease: "power1.out",
          });
          const moveY = (-(self.progress - 0.1) / 0.9) * 200;
          gsap.to(header, {
            y: moveY * 1.5,
            duration: 0.1,
            ease: "power1.out",
          });
          gsap.to(content, {
            y: `calc(${moveY}px + (-50%))`,
            duration: 0.1,
            ease: "power1.out",
          });
          gsap.to(footer, {
            y: moveY * 0.5,
            duration: 0.1,
            ease: "power1.out",
          });
        } else {
          gsap.to(fixedContainer, {
            height: "100vh",
            duration: 0.1,
            ease: "power1.out",
          });
          gsap.to(header, { y: 0, duration: 0.1, ease: "power1.out" });
          gsap.to(content, { y: "-50%", duration: 0.1, ease: "power1.out" });
          gsap.to(footer, { y: 0, duration: 0.1, ease: "power1.out" });
        }
        debugInfo.textContent = `End Section - Height: ${
          fixedContainer.style.height
        }, Progress: ${self.progress.toFixed(2)}`;
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.globalTimeline.clear();
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={rootRef}>
      <div className="loading-overlay" id="loading-overlay">
        Loading{" "}
        <span className="loading-counter" id="loading-counter">
          [00]
        </span>
      </div>
      <div className="debug-info" id="debug-info">
        Current Section: 0
      </div>
      <div className="scroll-container" id="scroll-container">
        <div className="fixed-section" id="fixed-section">
          <div className="fixed-container" id="fixed-container">
            <div className="background-container" id="background-container">
              {Array.from({ length: 10 }).map((_, i) => {
                const n = String(i + 1).padStart(3, "0");
                const src = `https://assets.codepen.io/7558/flame-glow-blur-${n}.jpg`;
                const cls = "background-image" + (i === 0 ? " active" : "");
                return (
                  <img
                    key={i}
                    src={src}
                    alt={`Background ${i + 1}`}
                    className={cls}
                    id={`background-${i + 1}`}
                    crossOrigin="anonymous"
                  />
                );
              })}
            </div>
            <div className="grid-container">
              <div className="header">
                <div className="header-row">The Creative</div>
                <div className="header-row">Process</div>
              </div>
              <div className="content">
                <div className="left-column" id="left-column">
                  {[
                    "Silence",
                    "Meditation",
                    "Intuition",
                    "Authenticity",
                    "Presence",
                    "Listening",
                    "Curiosity",
                    "Patience",
                    "Surrender",
                    "Simplicity",
                  ].map((t, i) => (
                    <div
                      className={"artist" + (i === 0 ? " active" : "")}
                      id={`artist-${i}`}
                      data-index={i}
                      key={i}
                    >
                      {t}
                    </div>
                  ))}
                </div>
                <div className="featured" id="featured">
                  {[
                    "Creative Elements",
                    "Inner Stillness",
                    "Deep Knowing",
                    "True Expression",
                    "Now Moment",
                    "Deep Attention",
                    "Open Exploration",
                    "Calm Waiting",
                    "Let Go Control",
                    "Pure Essence",
                  ].map((t, i) => (
                    <div
                      className={
                        "featured-content" + (i === 0 ? " active" : "")
                      }
                      id={`featured-${i}`}
                      data-index={i}
                      key={i}
                    >
                      <h3>{t}</h3>
                    </div>
                  ))}
                </div>
                <div className="right-column" id="right-column">
                  {[
                    "Reduction",
                    "Essence",
                    "Space",
                    "Resonance",
                    "Truth",
                    "Feeling",
                    "Clarity",
                    "Emptiness",
                    "Awareness",
                    "Minimalism",
                  ].map((t, i) => (
                    <div
                      className={"category" + (i === 0 ? " active" : "")}
                      id={`category-${i}`}
                      data-index={i}
                      key={i}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
              <div className="footer" id="footer">
                <div className="header-row">Beyond</div>
                <div className="header-row">Thinking</div>
                <div className="progress-indicator">
                  <div className="progress-numbers">
                    <span id="current-section">01</span>
                    <span id="total-sections">10</span>
                  </div>
                  <div className="progress-fill" id="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="end-section">
          <p className="fin">fin</p>
        </div>
      </div>
    </div>
  );
}
