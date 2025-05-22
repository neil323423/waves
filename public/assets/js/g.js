document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('gameSearchInput');
  const grid        = document.querySelector('.games-grid');
  let gamesData     = [];
  let filteredData  = [];
  const BATCH_SIZE  = 50;
  let renderedCount = 0;

  const sentinel = document.createElement('div');
  sentinel.className = 'sentinel';
  grid.after(sentinel);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        renderNextBatch();
      }
    });
  }, { rootMargin: '200px', threshold: 0.1 });

  function debounce(fn, wait = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  fetch('/assets/data/g.json')
    .then(r => r.json())
    .then(data => {
      gamesData    = data;
      filteredData = data;
      searchInput.placeholder = `Search through ${data.length} Games…`;

      observer.observe(sentinel);
      renderNextBatch();

      searchInput.addEventListener('input', debounce(() => {
        const q = searchInput.value.trim().toLowerCase();
        filteredData = gamesData.filter(g =>
          (g.name || '').toLowerCase().includes(q)
        );
        resetRendering();
      }, 250));
    })
    .catch(console.error);

  function resetRendering() {
    grid.innerHTML = '';
    renderedCount  = 0;
    observer.observe(sentinel);
    renderNextBatch();
  }

  function renderNextBatch() {
    const batch = filteredData.slice(renderedCount, renderedCount + BATCH_SIZE);
    if (!batch.length) {
      observer.unobserve(sentinel);
      return;
    }

    const frag = document.createDocumentFragment();
    batch.forEach(game => {
      const card = document.createElement('div');
      card.className = 'game-card';
      card.innerHTML = `
        <img
          loading="lazy"
          src="/assets/g/${game.directory}/${game.image}"
          alt="${game.name} Icon"
        />
        <h2>${game.name}</h2>
      `;
      card.addEventListener('click', () => {
        window.handleSearch(`/assets/g/${game.directory}`);
      });
      frag.appendChild(card);
    });

    grid.appendChild(frag);
    renderedCount += batch.length;

    preloadNextImages(5);

    if (renderedCount >= filteredData.length) {
      observer.unobserve(sentinel);
    }
  }

  function preloadNextImages(limit = 3) {
    const next = filteredData.slice(renderedCount, renderedCount + limit);
    next.forEach(({ directory, image }) => {
      const img = new Image();
      img.src = `/assets/g/${directory}/${image}`;
    });
  }
});