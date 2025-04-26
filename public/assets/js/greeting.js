window.onload = function() {
    const storedName = localStorage.getItem('userName');
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
    showToast(`Hey, ${storedName}! Welcome back to Waves!`, 'success', 'wave');
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
    setTimeout(() => {
        document.getElementById('namePrompt').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    }, 300);
}

function updateGreeting(name) {
    const { text, icon } = getGreeting();
    const el = document.getElementById('greeting');
    if (el) {
        el.innerHTML = `${icon} ${text}, ${name}!`;
        el.style.opacity = 1;
    }
}

function showToast(message, type = 'success', iconType = 'wave') {
    const toast = document.createElement('div');
    toast.className = `toast show ${type}`;
    const icons = {
        success: '<i class="fas fa-check-circle" style="margin-right: 8px;"></i>',
        error: '<i class="fas fa-times-circle" style="margin-right: 8px;"></i>',
        info: '<i class="fas fa-info-circle" style="margin-right: 8px;"></i>',
        warning: '<i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>',
        wave: '<i class="fa-regular fa-hand-wave" style="margin-right: 8px;"></i>'
    };
    toast.innerHTML = `${icons[iconType] || icons.wave}${message} `;
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
    const day = now.getDay();
    const options = [];

    if (hour >= 5 && hour < 12) {
        options.push(
            { text: 'Good morning, sunshine', icon: '<i class="fa-regular fa-sun"></i>' },
            { text: 'Here’s to a bright morning', icon: '<i class="fa-regular fa-cloud-sun"></i>' },
            { text: 'Morning vibes only', icon: '<i class="fa-regular fa-mug-hot"></i>' },
            { text: 'Your day starts here', icon: '<i class="fa-regular fa-star"></i>' }
        );
    } else if (hour < 17) {
        options.push(
            { text: 'Good afternoon', icon: '<i class="fa-regular fa-leaf"></i>' },
            { text: 'Hope your day is going well', icon: '<i class="fa-regular fa-coffee"></i>' },
            { text: 'Keep up the pace', icon: '<i class="fa-regular fa-book"></i>' },
            { text: 'Stay on track today', icon: '<i class="fa-regular fa-sun"></i>' }
        );
    } else if (hour < 21) {
        options.push(
            { text: 'Good evening', icon: '<i class="fa-regular fa-cloud-moon"></i>' },
            { text: 'Time to unwind', icon: '<i class="fa-regular fa-fire"></i>' },
            { text: 'Evening’s here—relax', icon: '<i class="fa-regular fa-star"></i>' },
            { text: 'Breathe and recharge', icon: '<i class="fa-regular fa-moon"></i>' }
        );
    } else {
        options.push(
            { text: 'Good night', icon: '<i class="fa-regular fa-bed"></i>' },
            { text: 'Rest well', icon: '<i class="fa-regular fa-blanket"></i>' },
            { text: 'Sweet dreams', icon: '<i class="fa-regular fa-star-and-crescent"></i>' },
            { text: 'See you tomorrow', icon: '<i class="fa-regular fa-moon"></i>' }
        );
    }

    if (day === 4) {
        options.push(
            { text: 'Thursday mode: engaged', icon: '<i class="fa-regular fa-party-popper"></i>' },
            { text: 'Almost Friday', icon: '<i class="fa-regular fa-music"></i>' },
            { text: 'Keep going', icon: '<i class="fa-regular fa-thumbs-up"></i>' }
        );
    }

    if (day === 0 || day === 6) {
        options.push(
            { text: 'Happy weekend', icon: '<i class="fa-regular fa-umbrella-beach"></i>' },
            { text: 'Enjoy some downtime', icon: '<i class="fa-regular fa-cocktail"></i>' }
        );
    } else {
        options.push(
            { text: 'You’ve got this', icon: '<i class="fa-regular fa-hand-holding-heart"></i>' },
            { text: 'One step at a time', icon: '<i class="fa-regular fa-walking"></i>' },
            { text: 'Summer is coming', icon: '<i class="fa-regular fa-umbrella-beach"></i>' }
        );
    }

    return options[Math.floor(Math.random() * options.length)];
}