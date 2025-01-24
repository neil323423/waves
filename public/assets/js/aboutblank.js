window.addEventListener("load", function() 

            let inFrame;

            try {
                inFrame = window !== top;
            } catch (e) {
                inFrame = true;
            }

            if (inFrame) {
                return;
            }

            const defaultTitle = "🌊 Google";
            const defaultIcon = "https://www.google.com/favicon.ico";

            const title = localStorage.getItem("siteTitle") || defaultTitle;
            const icon = localStorage.getItem("faviconURL") || defaultIcon;

            const iframeSrc = "/";

            const popup = window.open("", "_blank");

            if (!popup || popup.closed) {
                alert("Failed to load automask. Please allow popups and try again.");
                return;
            }

            popup.document.head.innerHTML = `<title>${title}</title><link rel="icon" href="${icon}">`;
            popup.document.body.innerHTML = `<iframe style="height: 100%; width: 100%; border: none; position: fixed; top: 0; right: 0; left: 0; bottom: 0;" src="${iframeSrc}"></iframe>`;

            window.location.replace("https://bisd.schoology.com/home"); 
        });