document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('gameSearchInput');
    const grid = document.querySelector('.games-grid');
    let gamesData = [];

    fetch('/assets/data/g.json')
        .then(response => response.json())
        .then(data => {
            const games = Array.isArray(data.games) ? data.games : [];

            gamesData = games;
            searchInput.placeholder = `Search through ${games.length} Games…`;
            displayGames(games);

            searchInput.addEventListener('input', function() {
                const query = searchInput.value.toLowerCase();
                const filteredGames = gamesData.filter(game => {
                    return game.title.toLowerCase().includes(query);
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
                <img src="${game.icon}" alt="${game.title} Icon" />
                <h2>${game.title}</h2>
            `;
            card.addEventListener('click', async function() {
                await handleSearch(game.link); 
            });
            grid.appendChild(card);
        });
    }
});
