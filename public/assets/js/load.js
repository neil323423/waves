document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      setTimeout(() => searchInput.classList.add('expanded'), 200);
    }
  });
  