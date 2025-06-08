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
    const iconType   = getIconType(path);
    showToast(welcomeMsg, 'success', iconType);

    const greetingElement = document.getElementById('greeting');
    if (greetingElement) {
        updateGreeting(storedName);
    }

    updateHi(storedName);
};

function submitName() {
    const name = document.getElementById('userName').value.trim();
    if (!name) return;

    localStorage.setItem('userName', name);
    updateGreeting(name);
    updateHi(name);

    document.getElementById('namePrompt').classList.add('fade-out');
    showToast(`Hey, ${name}! Welcome to Waves!`, 'success', 'wave');
    setTimeout(() => {
        document.getElementById('namePrompt').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    }, 300);
}

function getWelcomeMessage(name) {
    const path = window.location.pathname;
    if (path === '/g') {
        return `Have fun playing games, ${name}!`;
    } else if (path === '/s') {
        return `Enjoy our collection of, ${name}!`;
    } else {
        return `Welcome back, ${name}!`;
    }
}

function getIconType(path) {
    if (path === '/g') return 'game';
    if (path === '/s') return 'shortcuts';
    return 'wave';
}

const generalGreetings = [
    { text: 'Have fun', icon: '<i class="fa-regular fa-party-horn"></i>', suffix: '!' },
    { text: 'Hope you enjoy Waves', icon: '<i class="fa-solid fa-heart"></i>', suffix: ' <3' },
    { text: 'Join discord.gg/dJvdkPRheV', icon: '<i class="fa-brands fa-discord"></i>', suffix: '!' },
    { text: 'How you doing today', icon: '<i class="fa-regular fa-question"></i>', suffix: '?' }
];

const timeGreetings = [];

timeGreetings.push(
    { text: 'Good morning, sunshine', icon: '<i class="fa-regular fa-sun"></i>', suffix: ' :D' },
    { text: 'Here’s to a bright morning', icon: '<i class="fa-regular fa-cloud-sun"></i>', suffix: '.' },
    { text: 'Enjoy your morning', icon: '<i class="fa-regular fa-mug-hot"></i>', suffix: '!' },
    { text: 'Your day starts here', icon: '<i class="fa-regular fa-star"></i>', suffix: '!' }
);
timeGreetings.push(
    { text: 'Good afternoon', icon: '<i class="fa-regular fa-leaf"></i>', suffix: '!' },
    { text: 'Hope your day is going well', icon: '<i class="fa-regular fa-coffee"></i>', suffix: '.' },
    { text: 'Keep up the pace', icon: '<i class="fa-regular fa-book"></i>', suffix: '!' },
    { text: 'Stay on track today', icon: '<i class="fa-regular fa-sun"></i>', suffix: '.' }
);
timeGreetings.push(
    { text: 'Good evening', icon: '<i class="fa-regular fa-cloud-moon"></i>', suffix: '!' },
    { text: 'Time to unwind', icon: '<i class="fa-regular fa-fire"></i>', suffix: '.' },
    { text: 'Evening’s here—relax', icon: '<i class="fa-regular fa-star"></i>', suffix: '.' },
    { text: 'Breathe and recharge', icon: '<i class="fa-regular fa-moon"></i>', suffix: '…' }
);
timeGreetings.push(
    { text: 'Good night', icon: '<i class="fa-regular fa-bed"></i>', suffix: '!' },
    { text: 'Rest well', icon: '<i class="fa-regular fa-blanket"></i>', suffix: '.' },
    { text: 'Sweet dreams', icon: '<i class="fa-regular fa-star-and-crescent"></i>', suffix: '!' },
    { text: 'See you tomorrow', icon: '<i class="fa-regular fa-moon"></i>', suffix: '!' }
);

function getGreeting() {
    const now = new Date();
    const hour = now.getHours();
    let pool = [];

    if (hour >= 5 && hour < 12) {
        pool = timeGreetings.slice(0, 4);
    } else if (hour < 17) {
        pool = timeGreetings.slice(4, 8);
    } else if (hour < 21) {
        pool = timeGreetings.slice(8, 12);
    } else {
        pool = timeGreetings.slice(12, 16);
    }

    if (Math.random() < 0.5) {
        pool = generalGreetings;
    }

    return pool[Math.floor(Math.random() * pool.length)];
}

function updateGreeting(name) {
    const { text, icon, suffix } = getGreeting();
    const el = document.getElementById('greeting');
    if (!el) return;

    el.innerHTML = `${icon} ${text}, ${name}${suffix}`;
    el.style.opacity = 1;
}

function updateHi(name) {
    const hiEl = document.getElementById('hi');
    if (hiEl) {
        hiEl.textContent = `Hii, ${name}!!`;
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
        apps:    '<i class="fa-regular fa-th" style="margin-right: 8px;"></i>'
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