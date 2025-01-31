document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.querySelector("#proxy-iframe");
    const searchContainer = document.querySelector(".search-container");
    const navBar = document.querySelector(".navbar");
    const topBar = document.querySelector(".top-bar");
    const searchInput1 = document.getElementById("searchInput");
    const searchInput2 = document.getElementById("searchInputt");
    const loadingScreen = document.querySelector(".loading-screen");
    const gamesIcon = document.getElementById("games-icon");
    const chatIcon = document.getElementById("chat-icon");
    const navbarToggle = document.getElementById("navbar-toggle");

    const savedNavbarState = localStorage.getItem('navbarToggled');
    navbarToggle.checked = savedNavbarState === null ? true : savedNavbarState === 'true';

    navBar.style.display = navbarToggle.checked ? "block" : "none";

    navbarToggle.addEventListener("change", () => {
        const isToggled = navbarToggle.checked;
        localStorage.setItem('navbarToggled', isToggled);
        handleNavbarVisibility(isToggled);
    });

    iframe.style.display = "none";
    loadingScreen.style.display = "none";
    navBar.style.display = "none";

    const searchInputs = [searchInput1, searchInput2];
    searchInputs.forEach((input) => {
        input.addEventListener("keyup", (event) => {
            if (event.key === "Enter") {
                handleSearch(input.value);
            }
        });
    });

    gamesIcon.addEventListener("click", (event) => {
        event.preventDefault();
        handleSearch("https://selenite.cc/projects.html");
    });

    chatIcon.addEventListener("click", (event) => {
        event.preventDefault();
        handleSearch("https://waves-chat.pages.dev/");
    });

    async function handleSearch(query) {
        const searchURL = generateSearchUrl(query);
        preloadResources(searchURL);

        showLoadingScreen();
        searchContainer.style.display = "none";
        iframe.style.display = "block";
        topBar.style.display = "none";

        document.getElementById('backIcon').disabled = true;
        document.getElementById('forwardIcon').disabled = true;

        iframe.src = await getUrl(searchURL);

        // Add the new URL to the custom history stack
        window.addToHistory(iframe.src);

        iframe.onload = () => {
            hideLoadingScreen();
            if (navbarToggle.checked) {
                navBar.style.display = "block";
            }
            generateRandomId();
        };

        iframe.onerror = () => {
            hideLoadingScreen();
            alert('Failed to load the content.');
        };
    }

    function generateSearchUrl(query) {
        try {
            const url = new URL(query);
            return url.toString();
        } catch {
            try {
                const url = new URL(`https://${query}`);
                if (url.hostname.includes(".")) return url.toString();
            } catch {}
        }
        return `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    }

    function showLoadingScreen() {
        loadingScreen.style.display = "flex";
        loadingScreen.querySelector(".loading-text").textContent = "Almost ready, just waiting for everything to load...";
    }

    function hideLoadingScreen() {
        loadingScreen.querySelector(".loading-text").textContent = "Ready!";
        setTimeout(() => {
            loadingScreen.style.display = "none";
        }, 200);
    }

    function preloadResources(url) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = url;
        link.as = "fetch";
        document.head.appendChild(link);
    }

    function getUrl(url) {
        return Promise.resolve(__uv$config.prefix + __uv$config.encodeUrl(url));
    }

    function generateRandomId() {
        const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
        let randomId = '';

        for (let i = 0; i < 5; i++) {
            randomId += characters.charAt(Math.floor(Math.random() * 36));
        }

        history.replaceState({}, '', '/course?id=' + randomId);
    }

    function handleNavbarVisibility(isVisible) {
        if (isVisible) {
            navBar.style.display = "none";
        }
    }
});