(async () => {
    try {
      const res = await fetch('/api/github-updates');
      const { updates } = await res.json();
      const u = updates[0];
      const commitUrl = `https://github.com/xojw/waves/commit/${u.sha}`;
      document.getElementById('last-updated').innerHTML =
        `<span class="last-updated"><i class="fa-regular fa-hammer"></i> Last updated ${u.ago}</span> ~ <a href="${commitUrl}" class="hover-link" target="_blank" rel="noopener noreferrer">${u.sha} (Github)</a>`;
    } catch {
      document.getElementById('last-update').textContent =
        'Failed to load last update';
    }
})();