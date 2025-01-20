const originPosition = { x: 0, y: 0 };

const last = {
  mousePosition: originPosition
};

const config = {
  glowDuration: 75,
  maximumGlowPointSpacing: 10,
  fadeOutDuration: 1000,   
};

const px = value => `${value}px`;

const calcDistance = (a, b) => {
  const diffX = b.x - a.x,
        diffY = b.y - a.y;
  return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
};

const determinePointQuantity = distance => Math.max(
  Math.floor(distance / config.maximumGlowPointSpacing),
  1
);

const appendElement = element => document.body.appendChild(element);
const removeElement = (element, delay) => setTimeout(() => document.body.removeChild(element), delay);

const createGlowPoint = (position) => {
  // Retrieve the saved glow style (box-shadow) from localStorage
  const savedGlowStyle = localStorage.getItem('glowPointStyle') || '0rem 0rem 1.2rem 0.6rem #443ab6'; // Default glow style

  const glow = document.createElement("div");
  glow.className = "glow-point";
  glow.style.left = px(position.x);
  glow.style.top = px(position.y);
  glow.style.transition = `opacity ${config.fadeOutDuration}ms ease`;  

  // Apply the box-shadow from the saved glow style
  glow.style.boxShadow = savedGlowStyle;

  appendElement(glow);

  setTimeout(() => glow.style.opacity = 0, 0); 
  removeElement(glow, config.fadeOutDuration); 
};

const adjustLastMousePosition = position => {
  if(last.mousePosition.x === 0 && last.mousePosition.y === 0) {
    last.mousePosition = position;
  }
};

const createGlow = (last, current) => {
  const distance = calcDistance(last, current);
  const quantity = determinePointQuantity(distance);
  const dx = (current.x - last.x) / quantity;
  const dy = (current.y - last.y) / quantity;

  Array.from(Array(quantity)).forEach((_, index) => { 
    const x = last.x + dx * index, 
          y = last.y + dy * index;
    createGlowPoint({ x, y });
  });
};

const updateLastMousePosition = position => last.mousePosition = position;

const handleOnMove = e => {
  const mousePosition = { x: e.clientX, y: e.clientY };
  
  adjustLastMousePosition(mousePosition);
  createGlow(last.mousePosition, mousePosition);
  updateLastMousePosition(mousePosition);
};

window.onmousemove = e => handleOnMove(e);
window.ontouchmove = e => handleOnMove(e.touches[0]);

document.body.onmouseleave = () => updateLastMousePosition(originPosition);

let moveTimeout;
document.body.onmousemove = () => {
  clearTimeout(moveTimeout);
  moveTimeout = setTimeout(() => {
    const glowPoints = document.querySelectorAll('.glow-point');
    glowPoints.forEach(point => point.style.opacity = 0);  
  }, config.fadeOutDuration);
};
