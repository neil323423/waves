document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.querySelector("iframe");
    const searchContainer = document.querySelector(".search-container");
    const navBar = document.querySelector(".navbar");
    const topBar = document.querySelector(".top-bar");
    const searchInput1 = document.getElementById("searchInput");
    const searchInput2 = document.getElementById("searchInputt");
    const loadingScreen = document.querySelector(".loading-screen");
    const gamesIcon = document.getElementById("games-icon");
    const chatIcon = document.getElementById("chat-icon");
    const navbarToggle = document.getElementById("navbar-toggle");

    if (!navbarToggle) {
        console.error("Navbar toggle checkbox not found.");
        return;  
    }

    navBar.style.display = "none";

    const isNavbarToggled = localStorage.getItem('navbarToggled') === 'true';
    if (isNavbarToggled) {
        navbarToggle.checked = true;  
    } else {
        navbarToggle.checked = false;  
    }

    navbarToggle.addEventListener("change", () => {
        const isToggled = navbarToggle.checked;
        localStorage.setItem('navbarToggled', isToggled);
    });

    iframe.style.display = "none";
    loadingScreen.style.display = "none";

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
        handleSearch("https://shuttle.lol/");
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

        iframe.src = await getUrl(searchURL);

        iframe.onload = () => {
            hideLoadingScreen();
            if (navbarToggle.checked) {
                navBar.style.display = "block"; 
            }
            generateRandomId();
        };
    }

    function generateSearchUrl(query) {
        try {
            return new URL(query).toString();
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
        loadingScreen.querySelector(".loading-text").textContent = "Almost there! We're getting your content ready...";
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
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(__uv$config.prefix + __uv$config.encodeUrl(url));
            }, 0);
        });
    }

    function generateRandomId() {
        const characters = '0123456789abcdefghijklmnopqrstuvwxyz';
        let randomId = '';

        for (let i = 0; i < 5; i++) {
            randomId += characters.charAt(Math.floor(Math.random() * 36));
        }

        history.replaceState({}, '', '/course?id=' + randomId);
    }
});
