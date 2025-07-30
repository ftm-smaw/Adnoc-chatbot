// Global variables
let currentDomain = 'material';
let isUploading = false;
let isChatting = false;

// DOM elements
const domainBtns = document.querySelectorAll('.domain-btn');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const pdfList = document.getElementById('pdfList');
const clearBtn = document.getElementById('clearBtn');
const chatTitle = document.getElementById('chatTitle');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const status = document.getElementById('status');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadPDFs();
    updateChatTitle();
});

// Event listeners
function initializeEventListeners() {
    // Domain switching
    domainBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            switchDomain(this.dataset.domain);
        });
    });

    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);

    // Clear PDFs
    clearBtn.addEventListener('click', clearPDFs);

    // Chat
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Domain switching
function switchDomain(domain) {
    currentDomain = domain;

    // Update active button
    domainBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.domain === domain);
    });

    // Clear chat messages
    clearChatMessages();

    // Update chat title and welcome message
    updateChatTitle();

    // Load PDFs for this domain
    loadPDFs();

    // Update status
    updateStatus('Ready');
}

function updateChatTitle() {
    const titles = {
        'material': 'Material Specification Assistant',
        'electrical': 'Electrical Specification Assistant'
    };

    const welcomeMessages = {
        'material': 'Hello! I\'m your Material Specification Assistant. Upload PDF documents and ask me questions about material properties, grades, and specifications.',
        'electrical': 'Hello! I\'m your Electrical Specification Assistant. Upload PDF documents and ask me questions about electrical components, ratings, and compliance.'
    };

    chatTitle.textContent = titles[currentDomain];

    // Add welcome message
    addMessage(welcomeMessages[currentDomain], 'bot');
}

function clearChatMessages() {
    chatMessages.innerHTML = '';
}

// File upload handling
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length > 0) {
        uploadFiles(pdfFiles);
    } else {
        showNotification('Please upload PDF files only', 'error');
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        uploadFiles(files);
    }
}

async function uploadFiles(files) {
    if (isUploading) return;

    isUploading = true;
    updateStatus('Uploading...', 'processing');

    for (const file of files) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('domain', currentDomain);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showNotification(`${file.name} uploaded successfully`, 'success');
            } else {
                showNotification(`Error uploading ${file.name}: ${result.error}`, 'error');
            }
        } catch (error) {
            showNotification(`Error uploading ${file.name}: ${error.message}`, 'error');
        }
    }

    // Clear file input
    fileInput.value = '';

    // Reload PDF list
    await loadPDFs();

    isUploading = false;
    updateStatus('Ready');
}

// PDF management
async function loadPDFs() {
    try {
        const response = await fetch(`/api/pdfs/${currentDomain}`);
        const result = await response.json();

        if (response.ok) {
            displayPDFs(result.pdfs);
        } else {
            console.error('Error loading PDFs:', result.error);
        }
    } catch (error) {
        console.error('Error loading PDFs:', error);
    }
}

function displayPDFs(pdfs) {
    if (pdfs.length === 0) {
        pdfList.innerHTML = '<p class="no-pdfs">No documents uploaded yet</p>';
    } else {
        pdfList.innerHTML = pdfs.map(pdf => `
            <div class="pdf-item">
                <div class="filename">${pdf.filename}</div>
                <div class="upload-time">${formatDate(pdf.upload_time)}</div>
            </div>
        `).join('');
    }
}

async function clearPDFs() {
    if (confirm('Are you sure you want to clear all PDFs for this domain?')) {
        try {
            updateStatus('Clearing...', 'processing');

            const response = await fetch(`/api/clear/${currentDomain}`);
            const result = await response.json();

            if (response.ok) {
                showNotification('All PDFs cleared', 'success');
                loadPDFs();
            } else {
                showNotification(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
        }

        updateStatus('Ready');
    }
}

// Chat functionality
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isChatting) return;

    // Add user message
    addMessage(message, 'user');
    messageInput.value = '';

    // Set chatting state
    isChatting = true;
    sendBtn.disabled = true;
    updateStatus('Processing...', 'processing');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                domain: currentDomain
            })
        });

        const result = await response.json();

        if (response.ok) {
            addMessage(result.response, 'bot');
        } else {
            addMessage(`Error: ${result.error}`, 'bot');
        }
    } catch (error) {
        addMessage(`Error: ${error.message}`, 'bot');
    }

    // Reset chatting state
    isChatting = false;
    sendBtn.disabled = false;
    updateStatus('Ready');
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const icon = sender === 'bot' ? 'fas fa-robot' : 'fas fa-user';

    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="${icon}"></i>
            <div class="text">${text}</div>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Utility functions
function updateStatus(text, type = '') {
    status.textContent = text;
    status.className = `status ${type}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Handle window resize
window.addEventListener('resize', function() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let stream;

const voiceBtn = document.getElementById("voiceBtn");

voiceBtn.addEventListener("click", async () => {
  if (!isRecording) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch("/speech", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      console.log("Transcription:", data);
    };

    mediaRecorder.start();
    voiceBtn.classList.add("active");
    isRecording = true;
  } else {
    mediaRecorder.stop();
    voiceBtn.classList.remove("active");
    isRecording = false;
  }
});