(async () => {
    try {
      const res = await fetch('/api/github-updates');
      const { updates } = await res.json();
      const u = updates[0];
      const commitUrl = `https://github.com/xojw/waves/commit/${u.sha}`;
      document.getElementById('lastest-commit').innerHTML =
        `<a href="${commitUrl}" class="hover-link" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-code-commit"></i> ${u.sha}</a>`;
    } catch {
      document.getElementById('lastest-commit').textContent =
        'Failed to load lastest commit';
    }
})();