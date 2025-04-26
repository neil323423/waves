document.addEventListener('DOMContentLoaded', () => {
	const historyStack = []
	let currentIndex = -1
	const refreshIcon = document.getElementById('refreshIcon')
	const fullscreenIcon = document.getElementById('fullscreenIcon')
	const backIcon = document.getElementById('backIcon')
	const forwardIcon = document.getElementById('forwardIcon')
	const iframe = document.getElementById('cool-iframe')
	const erudaLoadingScreen = document.getElementById('erudaLoadingScreen')
	if (!refreshIcon || !fullscreenIcon || !backIcon || !forwardIcon || !iframe) return
	const originalTitle = document.title
	let loadingHidden = false
	function showLoadingScreen(withToast = true, showEruda = false) {
		loadingHidden = false
		NProgress.start()
		document.title = 'Loading... <3'
		if (withToast) {
			showToast(
				'Consider joining our <a href="https://discord.gg/dJvdkPRheV" target="_blank" class="hover-link">Discord</a>&nbsp;<3',
				'success',
				'heart'
			)
		}
	}
	function hideLoadingScreen() {
		if (loadingHidden) return
		loadingHidden = true
		NProgress.done()
		document.title = originalTitle
	}
	refreshIcon.addEventListener('click', () => {
		refreshIcon.classList.add('spin')
		if (iframe.tagName === 'IFRAME') {
			const currentUrl = iframe.contentWindow.location.href
			if (normalizeUrl(currentUrl) !== normalizeUrl(historyStack[currentIndex] || '')) {
				addToHistory(currentUrl)
			}
			iframe.contentWindow.location.reload(true)
		}
		setTimeout(() => refreshIcon.classList.remove('spin'), 300)
	})
	fullscreenIcon.addEventListener('click', () => {
		if (iframe.requestFullscreen) iframe.requestFullscreen()
		else if (iframe.mozRequestFullScreen) iframe.mozRequestFullScreen()
		else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen()
		else if (iframe.msRequestFullscreen) iframe.msRequestFullscreen()
	})
	backIcon.addEventListener('click', () => {
		if (currentIndex > 0) {
			currentIndex--
			iframe.src = historyStack[currentIndex]
			showLoadingScreen(false, false)
			updateNavButtons()
			updateDecodedSearchInput()
		}
	})
	forwardIcon.addEventListener('click', () => {
		if (currentIndex < historyStack.length - 1) {
			currentIndex++
			iframe.src = historyStack[currentIndex]
			showLoadingScreen(false, false)
			updateNavButtons()
			updateDecodedSearchInput()
		}
	})
	function normalizeUrl(urlStr) {
		try {
			const url = new URL(urlStr)
			url.searchParams.delete('ia')
			return url.toString()
		} catch {
			return urlStr
		}
	}
	function addToHistory(url) {
		const normalized = normalizeUrl(url)
		if (currentIndex >= 0 && normalizeUrl(historyStack[currentIndex]) === normalized) return
		if (currentIndex < historyStack.length - 1) historyStack.splice(currentIndex + 1)
		historyStack.push(url)
		currentIndex++
		updateNavButtons()
		updateDecodedSearchInput()
	}
	function updateNavButtons() {
		backIcon.disabled = currentIndex <= 0
		forwardIcon.disabled = currentIndex >= historyStack.length - 1
		backIcon.classList.toggle('disabled', currentIndex <= 0)
		forwardIcon.classList.toggle('disabled', currentIndex >= historyStack.length - 1)
	}
	function updateDecodedSearchInput() {
		const searchInput2 = document.getElementById('searchInputt')
		if (!searchInput2) return
		let url = ''
		if (currentIndex >= 0 && historyStack[currentIndex]) {
			url = historyStack[currentIndex]
		} else if (iframe.src) {
			url = iframe.src
		}
		searchInput2.value = decodeUrl(url)
		const lockIcon = document.getElementById('lockIcon')
		if (lockIcon) {
			lockIcon.className = decodeUrl(url).startsWith('https://') ?
				'fa-regular fa-lock' :
				'fa-regular fa-lock-open'
			lockIcon.style.color = ''
		}
	}
	iframe.addEventListener('load', () => {
		try {
			hideLoadingScreen()
		} catch {
			hideLoadingScreen()
		} finally {
			if (erudaLoadingScreen) erudaLoadingScreen.style.display = 'none'
		}
	})
	iframe.addEventListener('error', () => {
		hideLoadingScreen()
	})
	iframe.addEventListener('loadstart', () => {
		const navBar = document.querySelector('.navbar')
		const navbarToggle = document.getElementById('navbar-toggle')
		if (navbarToggle && navbarToggle.checked && navBar) navBar.style.display = 'block'
		showLoadingScreen(false, false)
	})
	const navBar = document.querySelector('.navbar')
	const topBar = document.querySelector('.topbar')
	const searchInput1 = document.getElementById('searchInput')
	const searchInput2 = document.getElementById('searchInputt')
	const movies = document.getElementById('movies')
	const ai = document.getElementById('ai')
	const navbarToggle = document.getElementById('navbar-toggle')
	if (navbarToggle && navBar) {
		const savedNavbarState = localStorage.getItem('navbarToggled')
		navbarToggle.checked = savedNavbarState === null ? true : savedNavbarState === 'true'
		navBar.style.display = iframe.style.display === 'block' && navbarToggle.checked ? 'block' : 'none'
		navbarToggle.addEventListener('change', () => {
			localStorage.setItem('navbarToggled', navbarToggle.checked)
			navBar.style.display = iframe.style.display === 'block' && navbarToggle.checked ? 'block' : 'none'
		})
	}
	iframe.style.display = 'none'
	window.addEventListener('load', hideLoadingScreen)
	;[searchInput1, searchInput2].forEach(input => {
		if (input) {
			input.addEventListener('keyup', e => {
				if (e.key === 'Enter') {
					const val = input.value.trim()
					if (val) handleSearch(val)
					else showToast('Please enter something in the Search Bar.', 'error', 'warning')
				}
			})
		}
	})
	if (movies) movies.addEventListener('click', e => {
		e.preventDefault()
		handleSearch('https://movies.usewaves.site/')
	})
	if (ai) ai.addEventListener('click', e => {
		e.preventDefault()
		handleSearch('https://ai.usewaves.site/')
	})
	function clearBackground() {
		const preserved = [
			document.querySelector('.navbar'),
			document.getElementById('cool-iframe'),
			document.querySelector('.loading-screen'),
			erudaLoadingScreen
		]
		Array.from(document.body.children).forEach(child => {
			if (!preserved.includes(child)) child.remove()
		})
	}
	async function handleSearch(query) {
		if (!query || !query.trim()) {
			showToast('Please enter something in the Search Bar.', 'error', 'warning')
			return
		}
		clearBackground()
		let searchURL
		if (
			query.startsWith('/assets/g/') ||
			query.startsWith(window.location.origin + '/assets/g/')
		) {
			searchURL = query
		} else {
			searchURL = generateSearchUrl(query)
		}
		if (searchInput2) searchInput2.value = searchURL
		historyStack.length = 0
		currentIndex = -1
		showLoadingScreen(true, false)
		iframe.style.display = 'block'
		if (topBar) topBar.style.display = 'none'
		backIcon.disabled = forwardIcon.disabled = true
		let finalUrl
		try {
			const u = new URL(searchURL, window.location.origin)
			if (u.origin === window.location.origin && u.pathname.startsWith('/assets/g/')) {
				finalUrl = u.href
			} else {
				finalUrl = await getUrl(searchURL)
			}
		} catch {
			finalUrl = await getUrl(searchURL)
		}
		iframe.src = finalUrl
		iframe.onload = () => {
			hideLoadingScreen()
			if (navbarToggle && navbarToggle.checked && navBar) navBar.style.display = 'block'
			generateSubject()
			updateDecodedSearchInput()
		}
		iframe.onerror = () => {
			hideLoadingScreen()
		}
	}
	window.handleSearch = handleSearch
	function generateSearchUrl(query) {
		try {
			return new URL(query).toString()
		} catch {
			try {
				const u = new URL(`https://${query}`)
				if (u.hostname.includes('.')) return u.toString()
			} catch {}
		}
		return `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`
	}
	function showToast(message, type = 'success', iconType = 'check') {
		const toast = document.createElement('div')
		toast.className = `toast show ${type}`
		const icons = {
			success: '<i class="fa-regular fa-check-circle" style="margin-right: 8px;"></i>',
			error: '<i class="fa-regular fa-times-circle" style="margin-right: 8px;"></i>',
			info: '<i class="fa-regular fa-info-circle" style="margin-right: 8px;"></i>',
			warning: '<i class="fa-regular fa-exclamation-triangle" style="margin-right: 8px;"></i>',
			heart: '<i class="fa-regular fa-heart" style="margin-right: 8px;"></i>'
		}
		const icon = icons[iconType] || icons.heart
		toast.innerHTML = `${icon}${message} `
		const progressBar = document.createElement('div')
		progressBar.className = 'progress-bar'
		toast.appendChild(progressBar)
		const closeBtn = document.createElement('button')
		closeBtn.className = 'toast-close'
		closeBtn.innerHTML = '<i class="fa-solid fa-xmark" style="margin-left: 8px; font-size: 0.8em;"></i>'
		closeBtn.addEventListener('click', () => {
			toast.classList.add('hide')
			setTimeout(() => toast.remove(), 500)
		})
		toast.appendChild(closeBtn)
		document.body.appendChild(toast)
		setTimeout(() => {
			toast.classList.add('hide')
			setTimeout(() => toast.remove(), 500)
		}, 3000)
	}
	function preloadResources(url) {
		if (!url) return
		try {
			const link = document.createElement('link')
			link.rel = 'preload'
			link.href = url
			link.as = 'fetch'
			link.crossOrigin = 'anonymous'
			document.head.appendChild(link)
		} catch {}
	}
	function getUrl(url) {
		return Promise.resolve(__uv$config.prefix + __uv$config.encodeUrl(url))
	}
	function generateSubject() {
		const subjects = ['math', 'science', 'history', 'art', 'programming', 'philosophy']
		const random = subjects[Math.floor(Math.random() * subjects.length)]
		history.replaceState({}, '', '/learning?subject=' + random)
	}
	function decodeUrl(enc) {
		try {
			const o = new URL(enc, window.location.origin)
			const p = (__uv$config && __uv$config.prefix) || '/wa/a/'
			if (o.pathname.startsWith(p)) {
				const part = o.pathname.slice(p.length)
				return (__uv$config.decodeUrl ? __uv$config.decodeUrl(part) : decodeURIComponent(part))
			}
		} catch {}
		return enc
	}
	window.decodeUrl = decodeUrl
	window.addToHistory = addToHistory
	window.updateDecodedSearchInput = updateDecodedSearchInput
	window.normalizeUrl = normalizeUrl
})