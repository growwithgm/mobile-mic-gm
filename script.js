let peer = null;
let conn = null;
let recognition = null;
let isRecording = false;

// --- Helper Functions to Switch Screens ---
function showScreen(id) {
    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('pc-screen').classList.add('hidden');
    document.getElementById('mobile-screen').classList.add('hidden');
    document.getElementById(id).classList.remove('hidden');
}

// ================= PC LOGIC (Receiver) =================
function startPCMode() {
    showScreen('pc-screen');
    
    // Generate a random 4-digit code
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const peerID = "voice-app-" + randomCode;

    // Initialize PeerJS
    peer = new Peer(peerID);

    peer.on('open', (id) => {
        // Show only the 4 digit code to user
        document.getElementById('my-peer-id').innerText = randomCode;
    });

    // Wait for connection from mobile
    peer.on('connection', (c) => {
        conn = c;
        document.getElementById('pc-status').innerText = "🟢 موبائل کنیکٹ ہو گیا ہے!";
        document.getElementById('pc-status').style.color = "green";

        // Receive Data
        conn.on('data', (data) => {
            const textField = document.getElementById('received-text');
            // Append new text
            if(textField.innerText === "...") textField.innerText = "";
            textField.innerText += " " + data;
        });
    });
}

// ================= MOBILE LOGIC (Sender) =================
function startMobileMode() {
    showScreen('mobile-screen');
    // Init PeerJS with random ID for mobile
    peer = new Peer(); 
}

function connectToPC() {
    const code = document.getElementById('conn-id').value;
    if (code.length < 4) {
        alert("براہ کرم درست 4 ہندسوں کا کوڈ لکھیں");
        return;
    }

    const targetPeerID = "voice-app-" + code;
    conn = peer.connect(targetPeerID);

    conn.on('open', () => {
        document.getElementById('mic-controls').classList.remove('hidden');
        document.querySelector('button[onclick="connectToPC()"]').classList.add('hidden');
        document.getElementById('conn-id').classList.add('hidden');
        setupSpeechRecognition();
    });

    conn.on('error', (err) => {
        alert("کنکشن فیل ہو گیا۔ کوڈ دوبارہ چیک کریں۔");
    });
}

// ================= SPEECH RECOGNITION LOGIC =================
function setupSpeechRecognition() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("آپ کا براؤزر اسپیچ ریکگنیشن کو سپورٹ نہیں کرتا۔ کروم (Chrome) استعمال کریں۔");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'ur-PK'; // Urdu Pakistan (Change to 'en-US' for English)
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const lastResult = event.results.length - 1;
        const text = event.results[lastResult][0].transcript;
        
        // Send text to PC
        if (conn && conn.open) {
            conn.send(text);
            document.getElementById('speech-status').innerText = "Sent: " + text;
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech Error:", event.error);
        isRecording = false;
        updateMicButton();
    };
    
    recognition.onend = () => {
        if(isRecording) recognition.start(); // Auto restart if it stops but flag is on
    };
}

function toggleMic() {
    if (!recognition) return;

    const btn = document.getElementById('mic-btn');
    const status = document.getElementById('speech-status');

    if (!isRecording) {
        recognition.start();
        isRecording = true;
        btn.innerText = "🛑 مائک بند کریں";
        btn.classList.add('recording');
        status.innerText = "بولیں، میں سن رہا ہوں...";
    } else {
        recognition.stop();
        isRecording = false;
        btn.innerText = "🎤 مائک آن کریں";
        btn.classList.remove('recording');
        status.innerText = "خاموش";
    }
}

function updateMicButton() {
    const btn = document.getElementById('mic-btn');
    if(isRecording) {
        btn.innerText = "🛑 مائک بند کریں";
        btn.classList.add('recording');
    } else {
        btn.innerText = "🎤 مائک آن کریں";
        btn.classList.remove('recording');
    }
}