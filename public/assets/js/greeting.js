window.onload = function () {
    var storedName = localStorage.getItem('userName');
    var greetingElement = document.getElementById('greeting');
    
    // If no name is stored, show the name prompt.
    if (!storedName) {
        document.getElementById('overlay').style.display = 'block';
        document.getElementById('namePrompt').style.display = 'block';
    } else if (greetingElement) {
        // If a name exists and there's a greeting div, update it.
        updateGreeting(storedName);
    }

    var nameInput = document.getElementById('userName');
    var doneButton = document.getElementById('doneButton');

    // Enable/disable the button based on input.
    doneButton.disabled = nameInput.value.trim() === '';
    nameInput.addEventListener('input', function () {
        doneButton.disabled = nameInput.value.trim() === '';
    });
};

function submitName() {
    var nameInput = document.getElementById('userName');
    var name = nameInput.value.trim();

    if (name) {
        // Save the name to localStorage.
        localStorage.setItem('userName', name);

        // Check if a greeting element exists before updating it.
        var greetingElement = document.getElementById('greeting');
        if (greetingElement) {
            updateGreeting(name);
        }

        // Hide the name prompt and overlay.
        document.getElementById('namePrompt').classList.add('fade-out');
        showToast(`Hey, ${name}! Welcome to Waves!`);

        setTimeout(function () {
            document.getElementById('namePrompt').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
        }, 300);
    }
}

function updateGreeting(name) {
    var greeting = getGreeting();
    var greetingElement = document.getElementById('greeting');
    
    if (greetingElement) {
        greetingElement.innerHTML = `<i class="${greeting.iconClass}"></i> ${greeting.text}, ${name}!`;
        greetingElement.style.opacity = 1;
    }
}

function showToast(message, type = "success", iconType = "check") {
    const toast = document.createElement("div");
    toast.className = `toast show ${type}`;
    
    const icons = {
        success: '<i class="fas fa-check-circle" style="margin-right: 8px;"></i>',
        error: '<i class="fas fa-times-circle" style="margin-right: 8px;"></i>',
        info: '<i class="fas fa-info-circle" style="margin-right: 8px;"></i>',
        warning: '<i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>',
        smile: '<i class="fas fa-smile" style="margin-right: 8px;"></i>'
    };

    const icon = icons[iconType] || icons['smile'];
    toast.innerHTML = `${icon}${message} `;
    
    const closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    closeBtn.innerHTML = '<i class="fas fa-xmark" style="margin-left: 8px; font-size: 0.8em;"></i>';
    closeBtn.addEventListener("click", () => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 500);
    });
    toast.appendChild(closeBtn);
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function getGreeting() {
    var hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return { text: 'Good morning', iconClass: 'fas fa-cloud-sun' };
    } else if (hour >= 12 && hour < 17) {
        return { text: 'Good afternoon', iconClass: 'fas fa-sun' };
    } else if (hour >= 17 && hour < 21) {
        return { text: 'Good evening', iconClass: 'fas fa-cloud-moon' };
    } else {
        return { text: 'Good night', iconClass: 'fas fa-moon' };
    }
}
