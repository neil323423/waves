document.addEventListener('DOMContentLoaded', function() {
	const searchInput = document.getElementById('shortcutSearchInput');
	const grid = document.querySelector('.shortcuts-grid');
	let shortcutsData = [];

	fetch('/assets/data/s.json')
		.then(response => response.json())
		.then(data => {
			shortcutsData = data.shortcuts;

			searchInput.placeholder = `Search through ${shortcutsData.length} Shortcuts...`;

			displayShortcuts(shortcutsData);

			searchInput.addEventListener('input', function() {
				const query = searchInput.value.toLowerCase();
				const filteredShortcuts = shortcutsData.filter(shortcut => {
					const title = shortcut.title ? shortcut.title.toLowerCase() : '';
					const description = shortcut.description ? shortcut.description.toLowerCase() : '';
					return title.includes(query) || description.includes(query);
				});
				displayShortcuts(filteredShortcuts);
			});
		})
		.catch(err => console.error('Error loading shortcuts data:', err));

	function displayShortcuts(shortcuts) {
		grid.innerHTML = '';
		if (shortcuts.length === 0) {
			grid.innerHTML = '<p>Zero shortcuts were found matching your search :(</p>';
		}
		shortcuts.forEach(shortcut => {
			const card = document.createElement('div');
			card.classList.add('shortcut-card');
			card.innerHTML = `
        <img src="${shortcut.icon}" alt="${shortcut.title} Icon" />
        <h2>${shortcut.title}</h2>
      `;
			card.addEventListener('click', function() {
				APP.handleSearch(shortcut.link);
			});
			grid.appendChild(card);
		});
	}
});