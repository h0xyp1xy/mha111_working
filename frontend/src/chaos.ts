// CHAOS MODE: Maximum erratic behavior for all elements
// This will make the website completely unpredictable

interface ChaosState {
  scale: number;
  rotation: number;
  translateX: number;
  translateY: number;
  removed: boolean;
  hue: number;
}

const chaosStates = new WeakMap<HTMLElement, ChaosState>();

function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1));
}

function getOrCreateState(element: HTMLElement): ChaosState {
  if (!chaosStates.has(element)) {
    chaosStates.set(element, {
      scale: 1,
      rotation: 0,
      translateX: 0,
      translateY: 0,
      removed: false,
      hue: random(0, 360),
    });
  }
  return chaosStates.get(element)!;
}

function applyChaosTransform(element: HTMLElement, state: ChaosState) {
  if (state.removed) {
    element.style.display = 'none';
    return;
  }
  
  element.style.transform = `
    translate(${state.translateX}px, ${state.translateY}px)
    scale(${state.scale})
    rotate(${state.rotation}deg)
  `;
  element.style.filter = `hue-rotate(${state.hue}deg)`;
  element.style.transition = 'none';
}

function chaoticHover(event: MouseEvent) {
  const element = event.target as HTMLElement;
  if (!element || element === document.body || element === document.documentElement) return;
  
  const state = getOrCreateState(element);
  
  // Random translation (more extreme)
  state.translateX = random(-500, 500);
  state.translateY = random(-500, 500);
  
  // Random rotation (more extreme)
  state.rotation = random(-1440, 1440);
  
  // Random scale (more extreme)
  const scaleChange = random(0.1, 5);
  state.scale = scaleChange;
  
  // Random color shift
  state.hue = random(0, 360);
  
  // Random z-index
  element.style.zIndex = randomInt(1000, 9999).toString();
  
  // Random opacity
  element.style.opacity = random(0.05, 1).toString();
  
  // Random blur sometimes
  if (Math.random() > 0.6) {
    element.style.filter = `hue-rotate(${state.hue}deg) blur(${random(0, 20)}px) brightness(${random(0.5, 2)})`;
  } else {
    element.style.filter = `hue-rotate(${state.hue}deg) brightness(${random(0.5, 2)})`;
  }
  
  applyChaosTransform(element, state);
  
  // Sometimes add random border
  if (Math.random() > 0.7) {
    element.style.border = `${randomInt(1, 30)}px ${['solid', 'dashed', 'dotted', 'double'][randomInt(0, 3)]} hsl(${random(0, 360)}, 100%, 50%)`;
  }
  
  // Sometimes flip element
  if (Math.random() > 0.8) {
    element.style.transform += ` scaleX(${Math.random() > 0.5 ? -1 : 1}) scaleY(${Math.random() > 0.5 ? -1 : 1})`;
  }
  
  // Sometimes change text content randomly
  if (element.textContent && Math.random() > 0.85 && element.children.length === 0) {
    const originalText = element.textContent;
    const scrambled = originalText.split('').map(() => String.fromCharCode(randomInt(33, 126))).join('');
    element.textContent = scrambled;
    setTimeout(() => {
      if (Math.random() > 0.5) {
        element.textContent = originalText;
      }
    }, random(100, 1000));
  }
  
  // Sometimes make element position absolute and move it
  if (Math.random() > 0.9) {
    element.style.position = 'absolute';
    element.style.left = random(0, window.innerWidth) + 'px';
    element.style.top = random(0, window.innerHeight) + 'px';
  }
}

function chaoticClick(event: MouseEvent) {
  const element = event.target as HTMLElement;
  if (!element || element === document.body || element === document.documentElement) return;
  
  const state = getOrCreateState(element);
  
  // 30% chance to permanently remove element
  if (Math.random() < 0.3) {
    state.removed = true;
    element.style.display = 'none';
    element.style.pointerEvents = 'none';
    return;
  }
  
  // 20% chance to permanently scale to massive size
  if (Math.random() < 0.2) {
    state.scale = random(5, 20);
    applyChaosTransform(element, state);
    return;
  }
  
  // 20% chance to permanently scale to tiny size
  if (Math.random() < 0.2) {
    state.scale = random(0.01, 0.1);
    applyChaosTransform(element, state);
    return;
  }
  
  // 15% chance to teleport to random position
  if (Math.random() < 0.15) {
    state.translateX = random(-window.innerWidth, window.innerWidth);
    state.translateY = random(-window.innerHeight, window.innerHeight);
    applyChaosTransform(element, state);
    return;
  }
  
  // 10% chance to spin forever
  if (Math.random() < 0.1) {
    state.rotation = random(-3600, 3600);
    applyChaosTransform(element, state);
    element.style.animation = `spin ${random(0.1, 5)}s linear infinite`;
    return;
  }
  
  // 10% chance to duplicate element (increased)
  if (Math.random() < 0.1) {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = random(0, window.innerWidth) + 'px';
    clone.style.top = random(0, window.innerHeight) + 'px';
    clone.style.zIndex = randomInt(1000, 9999).toString();
    clone.style.transform = `rotate(${random(-360, 360)}deg) scale(${random(0.5, 2)})`;
    document.body.appendChild(clone);
    
    // Add chaos to clone too
    setTimeout(() => {
      attachChaosToElement(clone);
    }, 100);
  }
  
  // 5% chance to swap with random sibling
  if (Math.random() < 0.05 && element.parentElement) {
    const siblings = Array.from(element.parentElement.children).filter(el => el !== element);
    if (siblings.length > 0) {
      const randomSibling = siblings[randomInt(0, siblings.length - 1)] as HTMLElement;
      const temp = element.style.cssText;
      element.style.cssText = randomSibling.style.cssText;
      randomSibling.style.cssText = temp;
    }
  }
  
  // Random permanent transformation
  state.scale = random(0.1, 5);
  state.rotation = random(-180, 180);
  state.translateX = random(-500, 500);
  state.translateY = random(-500, 500);
  state.hue = random(0, 360);
  
  // Random background color
  element.style.backgroundColor = `hsl(${random(0, 360)}, ${random(50, 100)}%, ${random(30, 70)}%)`;
  
  // Random text color
  element.style.color = `hsl(${random(0, 360)}, ${random(50, 100)}%, ${random(30, 70)}%)`;
  
  // Random font size
  element.style.fontSize = random(5, 100) + 'px';
  
  // Random font weight
  element.style.fontWeight = randomInt(100, 900).toString();
  
  applyChaosTransform(element, state);
}

function attachChaosToElement(element: HTMLElement) {
  if (element === document.body || element === document.documentElement) return;
  
  element.addEventListener('mouseenter', chaoticHover, { passive: true });
  element.addEventListener('mouseleave', () => {
    // Sometimes don't reset on mouse leave for extra chaos
    if (Math.random() > 0.3) {
      const state = getOrCreateState(element);
      applyChaosTransform(element, state);
    }
  }, { passive: true });
  
  element.addEventListener('click', chaoticClick, { passive: true });
  
  // Sometimes add random movement on mouse move (more frequent)
  element.addEventListener('mousemove', (e) => {
    if (Math.random() > 0.9) {
      const state = getOrCreateState(element);
      state.translateX += random(-100, 100);
      state.translateY += random(-100, 100);
      state.rotation += random(-45, 45);
      applyChaosTransform(element, state);
    }
  }, { passive: true });
  
  // Random periodic chaos even without interaction
  const chaosInterval = setInterval(() => {
    if (Math.random() > 0.95 && document.body.contains(element)) {
      const state = getOrCreateState(element);
      state.translateX += random(-200, 200);
      state.translateY += random(-200, 200);
      state.rotation += random(-180, 180);
      state.scale = random(0.2, 3);
      applyChaosTransform(element, state);
    }
  }, random(500, 3000));
  
  // Clean up interval if element is removed (though it might not happen in chaos mode!)
  element.addEventListener('remove', () => clearInterval(chaosInterval), { once: true });
}

function addSpinAnimation() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes shake {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(-10px, -10px); }
      50% { transform: translate(10px, 10px); }
      75% { transform: translate(-10px, 10px); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.5); }
    }
  `;
  document.head.appendChild(style);
}

export function enableChaosMode() {
  addSpinAnimation();
  
  // Attach chaos to all existing elements
  const allElements = document.querySelectorAll('*');
  allElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      attachChaosToElement(el);
    }
  });
  
  // Watch for new elements and attach chaos to them too
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          attachChaosToElement(node);
          
          // Also attach to children
          const children = node.querySelectorAll('*');
          children.forEach((child) => {
            if (child instanceof HTMLElement) {
              attachChaosToElement(child);
            }
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
  
  // Randomly shake the entire page sometimes (more frequent)
  setInterval(() => {
    if (Math.random() > 0.9) {
      document.body.style.animation = `shake ${random(0.1, 1)}s`;
      document.body.style.transform = `translate(${random(-20, 20)}px, ${random(-20, 20)}px) rotate(${random(-5, 5)}deg)`;
      setTimeout(() => {
        document.body.style.animation = '';
        document.body.style.transform = '';
      }, 1000);
    }
  }, 500);
  
  // Randomly change background color (more frequent)
  setInterval(() => {
    if (Math.random() > 0.95) {
      document.body.style.backgroundColor = `hsl(${random(0, 360)}, ${random(20, 100)}%, ${random(20, 90)}%)`;
      document.documentElement.style.backgroundColor = `hsl(${random(0, 360)}, ${random(20, 100)}%, ${random(20, 90)}%)`;
    }
  }, 300);
  
  // Randomly invert colors
  setInterval(() => {
    if (Math.random() > 0.97) {
      document.body.style.filter = 'invert(1)';
      setTimeout(() => {
        document.body.style.filter = '';
      }, random(200, 1000));
    }
  }, 1000);
  
  // Randomly add cursor chaos
  setInterval(() => {
    if (Math.random() > 0.98) {
      document.body.style.cursor = ['crosshair', 'grab', 'help', 'move', 'not-allowed', 'pointer', 'progress', 'text', 'wait', 'zoom-in', 'zoom-out'][randomInt(0, 10)];
      setTimeout(() => {
        document.body.style.cursor = '';
      }, random(500, 2000));
    }
  }, 800);
  
  console.log('🔥 CHAOS MODE ENABLED 🔥');
}

