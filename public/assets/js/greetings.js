window.onload = function() {
    const storedName = localStorage.getItem('userName');
    const path = window.location.pathname;
    if (!storedName) {
        document.getElementById('overlay').style.display = 'block';
        document.getElementById('namePrompt').style.display = 'block';
        const nameInput = document.getElementById('userName');
        const doneButton = document.getElementById('doneButton');
        doneButton.disabled = true;
        nameInput.addEventListener('input', () => {
            doneButton.disabled = nameInput.value.trim() === '';
        });
        return;
    }
    const welcomeMsg = getWelcomeMessage(storedName);
    const iconType = getIconType(path);
    showToast(welcomeMsg, 'success', iconType);
    const greetingElement = document.getElementById('greeting');
    if (greetingElement) {
        updateGreeting(storedName);
    }
};

function submitName() {
    const name = document.getElementById('userName').value.trim();
    if (!name) return;
    localStorage.setItem('userName', name);
    updateGreeting(name);
    document.getElementById('namePrompt').classList.add('fade-out');
    showToast(`Hey, ${name}! Welcome to Waves!`, 'success', 'wave');
    const path = window.location.pathname;

    setTimeout(() => {
        document.getElementById('namePrompt').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    }, 300);
}

function getWelcomeMessage(name) {
    const path = window.location.pathname;
    if (path === '/g') {
        return `Have fun playing games, ${name}!`;
    } else if (path === '/a') {
        return `Enjoy our collection of apps, ${name}!`;
    } else {
        return `Welcome back, ${name}!`;
    }
}

function getIconType(path) {
    if (path === '/g') return 'game';
    if (path === '/a') return 'apps';
    return 'wave';
}

function updateGreeting(name) {
    const { text, icon } = getGreeting();

    const el = document.getElementById('greeting');
    if (el) {
        if (text === 'Hope you enjoy Waves') {
            el.innerHTML = `${icon} ${text}, ${name} <3`;
        } else {
            el.innerHTML = `${icon} ${text}, ${name}!`;
        }
        el.style.opacity = 1;
    }
}

function showToast(message, type = 'success', iconType = 'wave') {
    const toast = document.createElement('div');
    toast.className = `toast show ${type}`;

    const icons = {
        success: '<i class="fas fa-check-circle" style="margin-right: 8px;"></i>',
        error:   '<i class="fas fa-times-circle" style="margin-right: 8px;"></i>',
        info:    '<i class="fas fa-info-circle" style="margin-right: 8px;"></i>',
        warning: '<i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>',
        wave:    '<i class="fa-regular fa-hand-wave" style="margin-right: 8px;"></i>',
        game:    '<i class="fa-regular fa-gamepad" style="margin-right: 8px;"></i>',
        apps:    '<i class="fa-regular fa-th" style="margin-right: 8px;"></i>',
    };

    toast.innerHTML = `${icons[iconType] || icons.wave}${message}`;

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    toast.appendChild(progressBar);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '<i class="fas fa-xmark" style="margin-left: 8px; font-size: 0.8em;"></i>';
    closeBtn.addEventListener('click', () => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 500);
    });
    toast.appendChild(closeBtn);

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function getGreeting() {
    const now = new Date();
    const hour = now.getHours();

    const timeGreetings = [];
    const generalGreetings = [
        { text: 'Welcome aboard', icon: '<i class="fa-regular fa-rocket"></i>' },
        { text: 'Let’s do something great', icon: '<i class="fa-regular fa-lightbulb"></i>' },
        { text: 'Hope you enjoy Waves', icon: '<i class="fa-regular fa-heart"></i>' },
        { text: 'Time to explore', icon: '<i class="fa-regular fa-compass"></i>' },
        { text: 'Let’s roll', icon: '<i class="fa-regular fa-tire"></i>' },
        { text: 'Another great visit', icon: '<i class="fa-regular fa-thumbs-up"></i>' },
        { text: 'The adventure continues', icon: '<i class="fa-regular fa-map"></i>' }
    ];

    if (hour >= 5 && hour < 12) {
        timeGreetings.push(
            { text: 'Good morning, sunshine', icon: '<i class="fa-regular fa-sun"></i>' },
            { text: 'Here’s to a bright morning', icon: '<i class="fa-regular fa-cloud-sun"></i>' },
            { text: 'Enjoy your morning', icon: '<i class="fa-regular fa-mug-hot"></i>' },
            { text: 'Your day starts here', icon: '<i class="fa-regular fa-star"></i>' }
        );
    } else if (hour < 17) {
        timeGreetings.push(
            { text: 'Good afternoon', icon: '<i class="fa-regular fa-leaf"></i>' },
            { text: 'Hope your day is going well', icon: '<i class="fa-regular fa-coffee"></i>' },
            { text: 'Keep up the pace', icon: '<i class="fa-regular fa-book"></i>' },
            { text: 'Stay on track today', icon: '<i class="fa-regular fa-sun"></i>' }
        );
    } else if (hour < 21) {
        timeGreetings.push(
            { text: 'Good evening', icon: '<i class="fa-regular fa-cloud-moon"></i>' },
            { text: 'Time to unwind', icon: '<i class="fa-regular fa-fire"></i>' },
            { text: 'Evening’s here—relax', icon: '<i class="fa-regular fa-star"></i>' },
            { text: 'Breathe and recharge', icon: '<i class="fa-regular fa-moon"></i>' }
        );
    } else {
        timeGreetings.push(
            { text: 'Good night', icon: '<i class="fa-regular fa-bed"></i>' },
            { text: 'Rest well', icon: '<i class="fa-regular fa-blanket"></i>' },
            { text: 'Sweet dreams', icon: '<i class="fa-regular fa-star-and-crescent"></i>' },
            { text: 'See you tomorrow', icon: '<i class="fa-regular fa-moon"></i>' }
        );
    }

    const useGeneral = Math.random() < 0.5;
    const pool = useGeneral ? generalGreetings : timeGreetings;

    return pool[Math.floor(Math.random() * pool.length)];
}