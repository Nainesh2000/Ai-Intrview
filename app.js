// ==========================================
// 1. INITIALIZE RADAR CHART (Chart.js)
// ==========================================
const ctx = document.getElementById('radarChart').getContext('2d');
const radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
        labels: ['Content Relevance', 'Communication', 'Problem Solving', 'Structure', 'Impact'],
        datasets: [{
            label: 'Current Score',
            data: [85, 90, 80, 75, 88],
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: 'rgba(99, 102, 241, 1)',
            pointBackgroundColor: 'rgba(129, 140, 248, 1)',
            borderWidth: 2
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: { color: '#94a3b8', font: { size: 10 } },
                ticks: { display: false, backdropColor: 'transparent' },
                min: 0,
                max: 100
            }
        },
        plugins: {
            legend: { display: false }
        }
    }
});

// ==========================================
// 2. WEBCAM & EYE CONTACT TRACKING (MediaPipe)
// ==========================================
const videoElement = document.getElementById('webcam');
const eyeContactVal = document.getElementById('eyeContactVal');
const eyeContactStatus = document.getElementById('eyeContactStatus');

const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults((results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Calculate relative position of face landmarks to infer gaze facing camera
        const noseTip = landmarks[1];
        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];

        const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
        const noseOffset = Math.abs(noseTip.x - (leftCheek.x + rightCheek.x) / 2);

        // Simple Gaze Ratio Logic
        if (noseOffset / faceWidth < 0.08) {
            eyeContactVal.innerText = '92%';
            eyeContactStatus.innerText = 'Good';
            eyeContactStatus.className = 'text-[10px] text-green-400';
        } else {
            eyeContactVal.innerText = '54%';
            eyeContactStatus.innerText = 'Looking Away';
            eyeContactStatus.className = 'text-[10px] text-yellow-400';
        }
    } else {
        eyeContactVal.innerText = '--%';
        eyeContactStatus.innerText = 'No Face Detected';
        eyeContactStatus.className = 'text-[10px] text-red-400';
    }
});

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({ image: videoElement });
    },
    width: 640,
    height: 480
});
camera.start();

// ==========================================
// 3. SPEECH ANALYSIS & FILLER WORD DETECTION
// ==========================================
const paceVal = document.getElementById('paceVal');
const fillerVal = document.getElementById('fillerVal');
const transcriptPreview = document.getElementById('transcriptPreview');

let fillerCount = 0;
let startTime = null;
let totalWords = 0;

const fillerWordsList = ['um', 'uh', 'like', 'actually', 'basically', 'you know'];

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        startTime = new Date();
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
        }

        transcriptPreview.innerText = `"${transcript}"`;

        // Calculate WPM Pace
        const words = transcript.trim().split(/\s+/);
        totalWords = words.length;
        const timeElapsedMinutes = (new Date() - startTime) / 60000;
        
        if (timeElapsedMinutes > 0) {
            const wpm = Math.round(totalWords / timeElapsedMinutes);
            paceVal.innerText = wpm > 0 ? wpm : 0;
        }

        // Count Filler Words
        let currentFillerCount = 0;
        words.forEach(word => {
            if (fillerWordsList.includes(word.toLowerCase())) {
                currentFillerCount++;
            }
        });
        fillerVal.innerText = currentFillerCount;
    };

    recognition.start();

    document.getElementById('toggleMicBtn').addEventListener('click', () => {
        recognition.stop();
        document.getElementById('toggleMicBtn').innerText = '🎤 Microphone Off';
    });
} else {
    transcriptPreview.innerText = "Speech Recognition API not supported in this browser. Try Chrome.";
}
