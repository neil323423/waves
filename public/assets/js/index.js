document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.querySelector("iframe");
    const div = document.querySelector(".search-container");
    const navbar = document.querySelector(".navbar");
    const searchInput1 = document.getElementById("searchInput");
    const searchInput2 = document.getElementById("searchInputt");

    navbar.style.display = "none";
    iframe.style.display = "none";
    searchInput2.style.display = "block";

    const searchInputs = [searchInput1, searchInput2];
    searchInputs.forEach((input) => {
        input.addEventListener("keyup", (event) => {
            if (event.key === "Enter") {
                handleSearch(input.value);
            }
        });
    });

    async function handleSearch(query) {
        const searchURL = search(query);
        preloadResources(searchURL);

        div.style.display = "none";
        iframe.style.display = "block";
        
        iframe.src = await getUrlWithDelay(searchURL);

        iframe.onload = () => {
            navbar.style.display = "block";
            generateRandomId();  
        };
    }

    function search(input) {
        const url = `https://duckduckgo.com/?q=${encodeURIComponent(input)}`;
        return url;
    }

    function preloadResources(url) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = url;
        link.as = "fetch";
        document.head.appendChild(link);
    }

    function getUrlWithDelay(url) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(__uv$config.prefix + __uv$config.encodeUrl(url));
            }, 0);
        });
    }

    function generateRandomId() {
        var randomId = '';
        var characters = '0123456789abcdefghijklmnopqrstuvwxyz';

        for (var i = 0; i < 5; i++) { 
            randomId += characters.charAt(Math.floor(Math.random() * 36)); 
        }

        history.replaceState({}, '', '/course?id=' + randomId); 
    }
});
