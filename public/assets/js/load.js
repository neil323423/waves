document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById('searchInput');
    const topBar = document.querySelector('.top-bar');
    const highlight = document.querySelector('.highlight');

    searchInput.classList.add('loaded');    
    topBar.classList.add('loaded')
    highlight.classList.add('loaded');
});
