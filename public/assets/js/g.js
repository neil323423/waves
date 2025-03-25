document.addEventListener('DOMContentLoaded', function() {
	const searchInput = document.getElementById('gameSearchInput');
	const grid = document.querySelector('.games-grid');
	let gamesData = [];
  
	fetch('/assets/data/g.json')
	  .then(response => response.json())
	  .then(data => {
		gamesData = data;

		searchInput.placeholder = `Search through ${gamesData.length} Games…`;
  
		displayGames(gamesData);
  
		searchInput.addEventListener('input', function() {
		  const query = searchInput.value.toLowerCase();
		  const filteredGames = gamesData.filter(game => {
			const name = game.name ? game.name.toLowerCase() : '';
			return name.includes(query);
		  });
		  displayGames(filteredGames);
		});
	  })
	  .catch(err => console.error('Error loading games data:', err));
  
	function displayGames(games) {
	  grid.innerHTML = '';
	  if (games.length === 0) {
		grid.innerHTML = '<p>Zero games were found matching your search :(</p>';
		return;
	  }
	  games.forEach(game => {
		const card = document.createElement('div');
		card.classList.add('game-card');
		card.innerHTML = `
		  <img src="/assets/g/${game.directory}/${game.image}" alt="${game.name} Icon" />
		  <h2>${game.name}</h2>
		`;
		card.addEventListener('click', async function() {
		  const url = `${location.origin}/assets/g/${game.directory}`;
		  await handleSearch(url);
		});
		grid.appendChild(card);
	  });
	}
  });
