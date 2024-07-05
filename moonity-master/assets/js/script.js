document.addEventListener('DOMContentLoaded', function() {
    const menuContainer = document.querySelector('.menu-container');
    const mainScreen = document.querySelector('.main-screen');
    const progressBar = document.querySelector('.progress-bar #slider');
    const timeElapsed = document.querySelector('#time-elapsed');
    const timeLeft = document.querySelector('#time-left');
    const messageBox = document.querySelector('.image-outer .message');
    const explicitSymbol = document.querySelector('.song-name .explicit');
    const loadingText = document.querySelector('.lyrics-container .loading-text');
    const lyricsContainer = document.querySelector('.lyrics-container');
    const lyricsWrapper = document.querySelector('.lyrics-wrapper');
    const waitDots = document.querySelector('.lyrics-wrapper #wait');

    const fullScreenButton = document.querySelector('.full-screen-button')
    const openMenuButton = document.querySelector('.open-menu-button');
    const previousButton = document.querySelector('.music-controls .previous');
    const lyricsButton = document.querySelector('.music-controls .lyrics');
    const pauseButton = document.querySelector('.music-controls .pause');
    const playButton = document.querySelector('.music-controls .play');
    const repeatButton = document.querySelector('.music-controls .repeat');

    let items;
    let data;
    let volume = .3;
    let audioPlayer = new Audio('assets/audios/audio.mp3');
    let lastLyric;
    let lastLyricIndex = 0;
    let currentItemIndex = 0;
    let isShowingMenu = false;
    let isPausedForInteraction = false;
    let isShowingLyrics = true;
    let isPlaying = false;
    let isRepeating = false;
    let isWaiting = true;

    messageBox.style.display = 'flex';
    explicitSymbol.style.display = '';
    loadingText.style.display = 'flex';

    window.addEventListener('load', async function() {
        await fetchData();
        appendLyrics();
        items = this.document.querySelectorAll('.lyrics-wrapper .item');
        loadingText.style.opacity = '0';
        updateTimes();
        updateItemPositions();
        setTimeout(function() {
            lyricsWrapper.style.opacity = '1';
        }, 300);
    });
    
    // Update positions on window resize
    window.addEventListener('resize', updateItemPositions);

    const pauseAudioWhileInteracting = () => {
        if (!audioPlayer.paused) {
            isPausedForInteraction = true;
            togglePlay();
        }
    };

    const resumeAudioAfterInteraction = () => {
        if (isPausedForInteraction) {
            isPausedForInteraction = false;
            togglePlay();
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const updateTimes = () => {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        timeElapsed.textContent = formatTime(currentTime);
        timeLeft.textContent = '-' + formatTime(duration - currentTime);
    };

    async function fetchData() {
        try {
            const response = await fetch('assets/data/audio-data.json');
            if (!response.ok) {
                throw new Error('Network responde was not ok');
            }
            const result = await response.json();
            console.log(result);
            data = result;
        } catch (error) {
            console.log('Error fetching data:', error);
        }
    }

    async function setData() {
        try {

        } catch (error) {

        }
    }

    async function appendLyrics() {
        if (!data || !data.lyrics) {
            console.log('No lyrics data found');
            return;
        }
        data.lyrics.forEach((lyric) => {
            if (lyric.line.startsWith('::')) {
                return;
            }
            const newParagraph = document.createElement('p');
            newParagraph.classList.add('item');
            newParagraph.innerText = lyric.line;
            lyricsWrapper.insertBefore(newParagraph, lyricsWrapper.lastElementChild);
        });
    }

    function updateProgressColor() {
        const progress = (progressBar.value / progressBar.max) * 100;
        progressBar.style.background = `linear-gradient(to right, rgba(255, 255, 255, .9) ${progress}%, rgba(255, 255, 255, .4) ${progress}%)`;
    }

    function updateItemPositions() {
        let translateY = 0; // Reset translateY on update
        items.forEach((item, index) => {
            if (item.id !== 'wait') {
                if (index === currentItemIndex) {
                    if (!isWaiting) {
                        item.id = 'active'; // Set current item id to 'active'
                        item.style.transform = `translateY(0px)`; // Reset current item position
                        item.style.opacity = '.9';
                        translateY += item.clientHeight + 30;
                    } else {
                        item.id = `over`; // Set ID to 'over' for items before current item
                        item.style.transform = `translateY(${-item.clientHeight - 30}px)`; // Move up previous items
                        item.style.opacity = '';
                    }
                } else {
                    if (index < currentItemIndex) {
                        item.id = `over`; // Set ID to 'over' for items before current item
                        item.style.transform = `translateY(${-item.clientHeight - 30}px)`; // Move up previous items
                        item.style.opacity = '';
                    } else {
                        if (index >= currentItemIndex && index < currentItemIndex + 6) {
                            item.id = `inactive${index - currentItemIndex}`; // Set ID to 'inactive1' to 'inactive5' based on index
                        } else {
                            item.id = 'inactive'; // Set ID to 'inactive' for other items
                        }
                        item.style.transform = `translateY(${translateY + (isWaiting ? 50 : 0)}px)`; // Move down next items
                        item.style.opacity = '';
                        translateY += item.clientHeight + 30; // Adding 30px gap (adjust as needed)
                    }
                }
            }
        });
        lastLyricIndex = currentItemIndex;
    }

    function findNearestLyric(currentTime) {
        if (!data || !data.lyrics) {
            return;
        }

        let line;
        let commands = -1;
        let nearestIndex = 0;
    
        data.lyrics.forEach((lyric, index) => {
            if (lyric.time <= currentTime) {
                if (lyric.line.startsWith('::')) {
                    commands++;
                }
                nearestIndex = index;
                line = lyric.line;
            }
        });

        currentItemIndex = nearestIndex - commands;

        if (lastLyric !== line) {
            if (line.startsWith('::wait')) {
                setWait(true);
            } else if (isWaiting) {
                setWait(false);
            } else if (line.startsWith('::end')) {
                currentItemIndex++;
            }
            updateItemPositions();
            lastLyricIndex = currentItemIndex;
            lastLyric = line;
        }
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    async function toggleMenu() {
        if (!isShowingMenu) {
            mainScreen.style.filter = 'blur(20px)';
            mainScreen.style.transform = 'translateY(20vh) scaleX(.9)';
            mainScreen.style.opacity = '0';
            menuContainer.style.filter = 'blur(0px)';
            menuContainer.style.bottom = '0%';
            menuContainer.style.transform = 'scaleX(1)';
            menuContainer.style.opacity = '1';
        } else {
            mainScreen.style.filter = '';
            mainScreen.style.transform = '';
            mainScreen.style.opacity = '';
            menuContainer.style.filter = '';
            menuContainer.style.bottom = '';
            menuContainer.style.transform = '';
            menuContainer.style.opacity = '';
        }
        isShowingMenu = !isShowingMenu;
    }

    function setWait(Boolean) {
        if (Boolean) {
            setTimeout(() => {
                waitDots.style.opacity = '1';
                waitDots.style.transform = `translateY(0px)`;
            }, 200);
        } else {
            waitDots.style.opacity = '0';
            waitDots.style.transform = `translateY(-50px)`;
            setTimeout(() => {
                waitDots.style.transform = `translateY(20px)`;
            }, 700);
        }
        isWaiting = Boolean;
    }

    function togglePlay() {
        if (!isPlaying) {
            audioPlayer.volume = volume;
            audioPlayer.play();
            pauseButton.style.display = 'flex';
            playButton.style.display = 'none';
        } else {
            audioPlayer.pause();
            pauseButton.style.display = 'none';
            playButton.style.display = 'flex';
        }
        isPlaying = !isPlaying;
    }

    document.addEventListener('keydown', function(event) {
        let code = event.keyCode;
        if (code === 32) {
            togglePlay();
        }
        if (code === 9) {
            event.preventDefault();
            toggleMenu();
        }
        if (code === 70) {
            event.preventDefault();
            toggleFullscreen();
        }
        if (code === 220) {
            event.preventDefault();
            console.log(audioPlayer.currentTime);
        }
        if (code === 219) {
            event.preventDefault();
            console.log(currentItemIndex);
        }
        if (code === 221) {
            event.preventDefault();
            console.log(lastLyricIndex);
        }
        if (code === 40) {
            event.preventDefault();
            console.log(lastLyric);
        }
    });

    mainScreen.addEventListener('wheel', function(event) {
        if (isPlaying) {
            return;
        }
        if (event.deltaY > 0) {
            if (currentItemIndex < items.length - 1) {
                currentItemIndex++;
            }
        } else if (currentItemIndex > 1 && !isWaiting) {
            currentItemIndex--;
        }
        if (isWaiting) {
            setWait(false);
        }
        updateItemPositions();
    });

    progressBar.addEventListener('input', function(event) {
        const percentage = event.target.value;
        audioPlayer.currentTime = (audioPlayer.duration * percentage) / 1000;
    });

    progressBar.addEventListener('mousedown', pauseAudioWhileInteracting);
    progressBar.addEventListener('mouseup', () => {
        progressBar.blur();
        resumeAudioAfterInteraction();
    });

    audioPlayer.addEventListener('timeupdate', () => {
        const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 1000;
        progressBar.value = percentage;
        updateProgressColor();
        updateTimes();
        if (isPlaying) {
            findNearestLyric(audioPlayer.currentTime);
        }
        if (lastLyricIndex !== currentItemIndex) {
            updateItemPositions();
        }
    });

    audioPlayer.addEventListener('play', () => {
        pauseButton.style.display = 'flex';
        playButton.style.display = 'none';
    });

    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        pauseButton.style.display = 'none';
        playButton.style.display = 'flex';
        if (isRepeating) {
            audioPlayer.currentTime = 0;
            togglePlay();
        }
    });

    openMenuButton.addEventListener('click', (event) => {
        event.preventDefault();
        toggleMenu();
    });

    fullScreenButton.addEventListener('click', (event) => {
        event.preventDefault();
        toggleFullscreen();
    })

    lyricsButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (isShowingLyrics) {
            lyricsContainer.style.display = 'none';
        } else {
            lyricsContainer.style.display = '';
            updateItemPositions();
        }
        isShowingLyrics = !isShowingLyrics;
    });

    previousButton.addEventListener('click', function(event) {
        event.preventDefault();
        audioPlayer.currentTime = 0;
    });

    pauseButton.addEventListener('click', function(event) {
        event.preventDefault();
        updateTimes();
        togglePlay();
    });

    playButton.addEventListener('click', function(event) {
        event.preventDefault();
        updateTimes();
        togglePlay();
    });

    repeatButton.addEventListener('click', function(event) {
        event.preventDefault();
        if (!isRepeating) {
            repeatButton.style.opacity = '.9';
            repeatButton.style.background = 'rgba(255, 255, 255, .1)'
        } else {
            repeatButton.style.opacity = '';
            repeatButton.style.background = ''
        }
        isRepeating = !isRepeating;
    });
});
