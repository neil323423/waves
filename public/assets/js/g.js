document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('gameSearchInput');
  const grid = document.querySelector('.games-grid');
  const sentinel = document.createElement('div');
  let allGames = [];
  let filteredGames = [];
  let renderedCount = 0;
  const BATCH_SIZE = 20;

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) loadNextBatch();
  }, { rootMargin: '500px' });

  fetch('/assets/data/g.json')
    .then(res => res.json())
    .then(data => {
      allGames = data;
      filteredGames = data;
      searchInput.placeholder = `Search through ${allGames.length} Games…`;
      grid.parentNode.appendChild(sentinel);
      observer.observe(sentinel);
      resetAndRender();
    })
    .catch(err => console.error(err));

  searchInput.addEventListener('input', function() {
    const q = this.value.toLowerCase();
    filteredGames = allGames.filter(game =>
      (game.name || '').toLowerCase().includes(q)
    );
    resetAndRender();
  });

  function resetAndRender() {
    grid.innerHTML = '';
    renderedCount = 0;
    if (filteredGames.length === 0) {
      grid.innerHTML = '<p>Zero games were found matching your search :(</p>';
      observer.unobserve(sentinel);
      return;
    }
    observer.observe(sentinel);
    loadNextBatch();
  }

  function loadNextBatch() {
    const nextCount = Math.min(renderedCount + BATCH_SIZE, filteredGames.length);
    for (let i = renderedCount; i < nextCount; i++) {
      const game = filteredGames[i];
      const card = document.createElement('div');
      card.classList.add('game-card');
      card.innerHTML = `
        <img src="/assets/g/${game.directory}/${game.image}" alt="${game.name} Icon" />
        <h2>${game.name}</h2>
      `;
      card.addEventListener('click', () => {
        const gameUrl = window.location.origin + `/assets/g/${game.directory}`;
        APP.handleSearch(gameUrl);
      });
      grid.appendChild(card);
    }
    renderedCount = nextCount;
    if (renderedCount >= filteredGames.length) {
      observer.unobserve(sentinel);
    } else {
      grid.parentNode.appendChild(sentinel);
    }
  }
});