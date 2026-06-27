import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm";

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const soundBtn = document.querySelector('#js-sound-btn');
const soundLabel = soundBtn.querySelector('.sound-label');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioBuffer = null;
let gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination);
gainNode.gain.value = 0; 

let isPlaying = false;
let nextStartTime = 0;
let currentSource = null;

async function loadSound(path) {
  try {
    const response = await fetch(path);
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (e) {
    console.error("Audio failed:", e);
  }
}

function playNextBuffer() {
  if (!isPlaying || !audioBuffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(gainNode);

  const fadeDuration = 0.2; 
  const duration = audioBuffer.duration;
  if (nextStartTime === 0) nextStartTime = audioCtx.currentTime;
  
  source.start(nextStartTime);
  nextStartTime += duration - fadeDuration;

  setTimeout(() => {
    if (isPlaying) playNextBuffer();
  }, (duration - fadeDuration * 2) * 1000);

  currentSource = source;
}

const audioSrc = (new Audio()).canPlayType('audio/ogg')
  ? 'audio/river3.ogg'
  : 'audio/river3.mp3';
loadSound(audioSrc);

soundBtn.addEventListener('click', async () => {
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  if (!isPlaying) {
    isPlaying = true;
    nextStartTime = audioCtx.currentTime;
    playNextBuffer();
    gainNode.gain.setTargetAtTime(0.8, audioCtx.currentTime, 0.5);
    soundLabel.textContent = 'OFF';
  } else {
    isPlaying = false;
    gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
    soundLabel.textContent = 'ON';
  }
});


const panel = document.querySelector('#js-panel');
const menuItems = document.querySelectorAll('.menu-item');
const turb = document.querySelector('#distortion-filter feTurbulence');
const disp = document.querySelector('#distortion-filter feDisplacementMap');

let currentSectionId = 'mado'; 
let isPanelOpen = false;      
let isAnimating = false;       


let _lastRippleTime = 0;
const updateRipple = () => {
  if (isSafari) {
    const now = performance.now();
    if (now - _lastRippleTime < 33) return; 
    _lastRippleTime = now;
  }
  const val = parseFloat(disp.getAttribute('scale'));
  turb.setAttribute('baseFrequency', `0.01 ${0.01 + val * 0.0002}`);
};



gsap.to(panel, {
  y: "+=3", 
  duration: 2.5,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
  delay: 0.7
});


function switchSection(targetId) {
  
  if (isAnimating || targetId === currentSectionId) return;
  isAnimating = true;

  
  menuItems.forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-section="${targetId}"]`).classList.add('active');

  
  const tl = gsap.timeline({
    onComplete: () => { isAnimating = false; } 
  });

  
  if (targetId === 'mado') {
    const currentSectionEl = document.getElementById(currentSectionId);
    const currentWrapper = currentSectionEl.querySelector('.ripple-wrapper');
    
    gsap.set(currentWrapper, { filter: "url(#distortion-filter)" });
    tl.to(currentWrapper, { opacity: 0, duration: 0.8, ease: "power2.inOut" })
      .to(disp, { attr: { scale: 80 }, duration: 0.8, ease: "power2.inOut", onUpdate: updateRipple }, "<")
    
      .to(panel, { autoAlpha: 0, duration: 0.1, ease: "power2.out" })
      
      .call(() => {
        currentSectionEl.classList.remove('active');
        panel.classList.remove('active');
        gsap.set(currentWrapper, { filter: "none" });
        currentSectionId = 'mado';
        isPanelOpen = false;
      });


  } else if (!isPanelOpen) {
    const targetSectionEl = document.getElementById(targetId);
    const targetWrapper = targetSectionEl.querySelector('.ripple-wrapper');

    tl.call(() => {
      panel.classList.add('active');
      targetSectionEl.classList.add('active');
      document.querySelector('.panel-scroll-area').scrollTop = 0;
      gsap.set(targetWrapper, { filter: "url(#distortion-filter)", opacity: 0 });
      gsap.set(disp, { attr: { scale: 80 } }); 
    })

    .to(panel, { autoAlpha: 1, duration: 0.3, ease: "power2.out" })
    
    .to(targetWrapper, { opacity: 1, duration: 1.0, ease: "power2.out" }, "+=0.6")
    .to(disp, { attr: { scale: 0 }, duration: 1.0, ease: "power2.out", onUpdate: updateRipple }, "<")
    
    .call(() => {
      gsap.set(targetWrapper, { filter: "none" }); 
      currentSectionId = targetId;
      isPanelOpen = true;
    });


  } else {
    const currentSectionEl = document.getElementById(currentSectionId);
    const currentWrapper = currentSectionEl.querySelector('.ripple-wrapper');
    const targetSectionEl = document.getElementById(targetId);
    const targetWrapper = targetSectionEl.querySelector('.ripple-wrapper');

    tl.call(() => {
      gsap.set(currentWrapper, { filter: "url(#distortion-filter)" });
    })
    .to(currentWrapper, { opacity: 0, duration: 0.6, ease: "power2.inOut" })
    .to(disp, { attr: { scale: 80 }, duration: 0.6, ease: "power2.inOut", onUpdate: updateRipple }, "<")
    
    .call(() => {
      currentSectionEl.classList.remove('active');
      targetSectionEl.classList.add('active');
      document.querySelector('.panel-scroll-area').scrollTop = 0; 
      
      gsap.set(currentWrapper, { filter: "none" });
      gsap.set(targetWrapper, { filter: "url(#distortion-filter)", opacity: 0 });
      gsap.set(disp, { attr: { scale: 80 } });
    })
    
    .to(targetWrapper, { opacity: 1, duration: 0.8, ease: "power2.out" })
    .to(disp, { attr: { scale: 0 }, duration: 0.8, ease: "power2.out", onUpdate: updateRipple }, "<")
    
    .call(() => {
      gsap.set(targetWrapper, { filter: "none" });
      currentSectionId = targetId;
    });
  }
}

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = item.getAttribute('data-section');
    switchSection(target);
  });
});

document.addEventListener('click', (e) => {
  if (!isPanelOpen || isAnimating) return;
  if (isModalOpen) return;
  if (!panel.contains(e.target) && !e.target.closest('.fixed-ui')) {
    switchSection('mado');
  }
});

const copyBtn = document.querySelector('#js-copy-btn');
const emailText = document.querySelector('#js-email');
const copyFeedback = document.querySelector('.copy-feedback');

if (copyBtn && emailText) {
  copyBtn.addEventListener('click', () => {
    let textToCopy = emailText.textContent;
    textToCopy = textToCopy.replace(/\s?\[at\]\s?/, "@");
    navigator.clipboard.writeText(textToCopy).then(() => {

      const tl = gsap.timeline();
      
      tl.to(copyFeedback, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out"
      })
      .to(copyFeedback, {
        opacity: 0,
        y: -5,
        duration: 0.4,
        ease: "power2.in",
        delay: 1.0 
      });

      gsap.fromTo(copyBtn, 
        { color: "#fff" }, 
        { color: "rgba(255, 255, 255, 0.4)", duration: 0.6 }
      );
    }).catch(err => {
      console.error('Copy failed: ', err);
    });
  });
}


const tabBtns = document.querySelectorAll('.tab-btn');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTabId = btn.getAttribute('data-tab');
    const currentActiveTab = document.querySelector('.kiroku-list:not([hidden])');

    if (currentActiveTab && currentActiveTab.id === `tab-${targetTabId}`) return;

    const targetTab = document.getElementById(`tab-${targetTabId}`);
    if (!targetTab) return;

    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tl = gsap.timeline();

    if (currentActiveTab) {
      gsap.set(currentActiveTab, { filter: 'url(#distortion-filter)' });

      tl.to(currentActiveTab, { opacity: 0, duration: 0.5, ease: 'power2.inOut' })
        .to(disp, { attr: { scale: 80 }, duration: 0.5, ease: 'power2.inOut', onUpdate: updateRipple }, '<')
        .call(() => {
          currentActiveTab.hidden = true;
          gsap.set(currentActiveTab, { filter: 'none', opacity: 1 });
          targetTab.hidden = false;
          gsap.set(targetTab, { filter: 'url(#distortion-filter)', opacity: 0 });
          gsap.set(disp, { attr: { scale: 80 } });
        })
        .to(targetTab, { opacity: 1, duration: 0.6, ease: 'power2.out' })
        .to(disp, { attr: { scale: 0 }, duration: 0.6, ease: 'power2.out', onUpdate: updateRipple }, '<')
        .call(() => {
          gsap.set(targetTab, { filter: 'none' });
        });
    } else {
      targetTab.hidden = false;
      gsap.set(targetTab, { filter: 'url(#distortion-filter)', opacity: 0 });
      gsap.set(disp, { attr: { scale: 80 } });
      tl.to(targetTab, { opacity: 1, duration: 0.6, ease: 'power2.out' })
        .to(disp, { attr: { scale: 0 }, duration: 0.6, ease: 'power2.out', onUpdate: updateRipple }, '<')
        .call(() => {
          gsap.set(targetTab, { filter: 'none' });
        });
    }
  });
});


const modal         = document.querySelector('#js-model-modal');
const modalOverlay  = modal.querySelector('.model-modal-overlay');
const modalClose    = modal.querySelector('#js-modal-close');
const modalMainView = modal.querySelector('.modal-main-view');
const modalThumbs   = modal.querySelector('.modal-thumbs');

let isModalOpen = false;

function createThumbEl(file, index) {
  const item = document.createElement('div');
  item.className = 'modal-thumb-item';
  item.dataset.index = index;

  const img = document.createElement('img');
  img.src = file.thumb ?? file.src;
  img.alt = `file ${index + 1}`;
  item.appendChild(img);
  return item;
}

function switchMainView(file, thumbItems, index) {
  let newEl;

  if (file.type === 'video') {
    newEl = document.createElement('video');
    newEl.autoplay = true;
    newEl.loop = true;
    newEl.muted = true;
    newEl.playsInline = true;
    newEl.src = file.src; 
  } else {
    newEl = document.createElement('img');
    newEl.src = file.src;
    newEl.alt = '';
  }


  const currentHeight = modalMainView.offsetHeight;
  if (currentHeight > 0) {
    modalMainView.style.minHeight = `${currentHeight}px`;
  }

  const releaseMinHeight = () => { modalMainView.style.minHeight = ''; };
  if (file.type === 'video') {
    newEl.addEventListener('loadedmetadata', releaseMinHeight, { once: true });
  } else {
    newEl.addEventListener('load', releaseMinHeight, { once: true });
  }

  const oldVideo = modalMainView.querySelector('video');
  if (oldVideo) {
    oldVideo.pause();
    oldVideo.src = '';
  }
  modalMainView.replaceChildren(newEl);

  if (file.type === 'video') {
    newEl.play().catch(() => {});
  }

  thumbItems.forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
}

function openModal(itemEl) {
  if (isModalOpen) return;

  const files = JSON.parse(itemEl.dataset.files || '[]');

  if (files.length === 0) return;

  modalThumbs.innerHTML = '';
  const thumbItems = [];

  if (files.length > 1) {
    files.forEach((file, i) => {
      const thumb = createThumbEl(file, i);
      thumb.addEventListener('click', () => {
        switchMainView(file, thumbItems, i);
      });
      modalThumbs.appendChild(thumb);
      thumbItems.push(thumb);
    });
  }

  switchMainView(files[0], thumbItems, 0);

  isModalOpen = true;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  if (!isModalOpen) return;

  isModalOpen = false;

  const video = modalMainView.querySelector('video');
  if (video) {
    video.pause();
    video.src = '';
    video.load();
  }

  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('.model-item').forEach(item => {
  item.querySelector('.model-thumb-link')?.addEventListener('click', () => {
    openModal(item);
  });
});

modalClose.addEventListener('click', (e) => {
  e.stopPropagation();
  closeModal();
});


modalOverlay.addEventListener('click', (e) => {
  e.stopPropagation();
  closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isModalOpen) closeModal();
});


export function loadingFinished() {
  const loader = document.querySelector('#js-loader');
  const text = document.querySelector('.loader-text');
  const filter = document.querySelector('#loader-distortion feDisplacementMap');
  const turb = document.querySelector('#loader-distortion feTurbulence');

  const tl = gsap.timeline();

  tl.set(text, { filter: 'url(#loader-distortion)' })

  .to(filter, {
    attr: { scale: 100 }, 
    duration: 1.5,
    ease: "power2.in",
    onUpdate: () => {
     
      const val = parseFloat(filter.getAttribute('scale'));
      turb.setAttribute('baseFrequency', `${0.005 + val * 0.0005}`);
    }
  }, "<")
  .to(text, {
    opacity: 0,
    scale: 1.2,
    duration: 1.5,
    ease: "power2.in",
  }, "<") 

  .to(loader, {
    opacity: 0,
    duration: 0.8,
    ease: "power1.out"
  }, "-=0.5")
  
  .set(loader, { display: 'none' });
}