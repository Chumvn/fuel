/* ============================================
   CHUM Fuel - Application Logic
   ============================================ */

// State variables for custom vehicle settings
let customConsumption = 8.0; // L/100km
let customTankSize = 55; // Liters

// State
let currentMethod = 'trip';

// DOM Elements
const elements = {
    methodSelector: document.getElementById('methodSelector'),
    fuelPrice: document.getElementById('fuelPrice'),
    fuelConsumption: document.getElementById('fuelConsumption'),
    tankSize: document.getElementById('tankSize'),
    condCity: document.getElementById('condCity'),
    condHighway: document.getElementById('condHighway'),
    condAC: document.getElementById('condAC'),

    // Trip method
    tripKm: document.getElementById('tripKm'),
    tripError: document.getElementById('tripError'),

    // Distance method
    distanceKm: document.getElementById('distanceKm'),

    // Fuel method
    fuelLiters: document.getElementById('fuelLiters'),
    fuelKmDriven: document.getElementById('fuelKmDriven'),

    // Gauge method
    gaugeStart: document.getElementById('gaugeStart'),
    gaugeEnd: document.getElementById('gaugeEnd'),
    gaugeTotalMarks: document.getElementById('gaugeTotalMarks'),
    gaugeInfo: document.getElementById('gaugeInfo'),
    gaugeKmDriven: document.getElementById('gaugeKmDriven'),

    // Results
    resultFuelCost: document.getElementById('resultFuelCost'),
    resultPerKm: document.getElementById('resultPerKm'),
    resultLiters: document.getElementById('resultLiters'),
    resultEfficiency: document.getElementById('resultEfficiency'),
    rentalCost: document.getElementById('rentalCost'),
    totalCost: document.getElementById('totalCost'),

    // Actions
    btnExport: document.getElementById('btnExport'),

    // Modal
    exportModal: document.getElementById('exportModal'),
    closeModal: document.getElementById('closeModal'),
    exportPreview: document.getElementById('exportPreview'),
    btnCopyText: document.getElementById('btnCopyText'),
    btnSaveImage: document.getElementById('btnSaveImage')
};

// ============================================
// Initialize
// ============================================
function init() {
    setupMethodSelector();
    setupStepperButtons();
    setupInputListeners();
    setupActionButtons();
    updateGaugeInfo();
    calculate();
}

// ============================================
// Method Selector
// ============================================
function setupMethodSelector() {
    const segments = elements.methodSelector.querySelectorAll('.segment');
    segments.forEach(segment => {
        segment.addEventListener('click', () => {
            segments.forEach(s => s.classList.remove('active'));
            segment.classList.add('active');

            currentMethod = segment.dataset.method;
            showMethodForm(currentMethod);
            calculate();
        });
    });
}

function showMethodForm(method) {
    document.querySelectorAll('.method-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`form-${method}`).classList.add('active');
}

// ============================================
// Stepper Buttons
// ============================================
function setupStepperButtons() {
    document.querySelectorAll('.stepper-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const step = parseFloat(btn.dataset.step) || 1;
            const action = btn.dataset.action;
            const input = document.getElementById(targetId);

            let value = parseFloat(input.value) || 0;
            if (action === 'increase') {
                value += step;
            } else {
                value -= step;
            }

            // Respect min/max
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);
            if (!isNaN(min)) value = Math.max(min, value);
            if (!isNaN(max)) value = Math.min(max, value);

            input.value = value;
            input.dispatchEvent(new Event('input'));
        });
    });
}

// ============================================
// Input Listeners
// ============================================
function setupInputListeners() {
    // All inputs trigger calculation
    const allInputs = document.querySelectorAll('input, select');
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            updateGaugeInfo();
            calculate();
        });
        input.addEventListener('change', () => {
            updateGaugeInfo();
            calculate();
        });
    });

    // Fuel consumption and tank size updates
    elements.fuelConsumption.addEventListener('input', () => {
        customConsumption = parseFloat(elements.fuelConsumption.value) || 8.0;
        calculate();
    });

    elements.tankSize.addEventListener('input', () => {
        customTankSize = parseFloat(elements.tankSize.value) || 55;
        updateGaugeInfo();
        calculate();
    });
}

// ============================================
// Gauge Info Update
// ============================================
function updateGaugeInfo() {
    const tankSize = parseFloat(elements.tankSize.value) || 55;
    const totalMarks = parseFloat(elements.gaugeTotalMarks.value) || 8;
    const start = parseFloat(elements.gaugeStart.value) || 0;
    const end = parseFloat(elements.gaugeEnd.value) || 0;

    const litersPerMark = tankSize / totalMarks;
    const litersUsed = Math.max(0, (start - end) * litersPerMark);

    elements.gaugeInfo.textContent = `Bình ${tankSize}L ÷ ${totalMarks} vạch = ${litersPerMark.toFixed(1)}L/vạch • Hao ${start - end} vạch = ${litersUsed.toFixed(1)}L`;
}

// ============================================
// Calculation Logic
// ============================================
function calculate() {
    const fuelPrice = parseFloat(elements.fuelPrice.value) || 20000;
    const consumption = parseFloat(elements.fuelConsumption.value) || 8.0; // L/100km

    // Condition modifiers
    let modifier = 1;
    if (elements.condCity.checked) modifier *= 1.10;
    if (elements.condHighway.checked) modifier *= 0.90;
    if (elements.condAC.checked) modifier *= 1.05;

    let litersUsed = 0;
    let kmDriven = 0;
    let fuelCost = 0;

    switch (currentMethod) {
        case 'trip': {
            const km = parseFloat(elements.tripKm.value) || 0;
            const errorPercent = parseFloat(elements.tripError.value) || 0;
            const adjustedKm = km * (1 + errorPercent / 100);
            kmDriven = adjustedKm;
            litersUsed = (adjustedKm * consumption / 100) * modifier;
            fuelCost = litersUsed * fuelPrice;
            break;
        }

        case 'distance': {
            const km = parseFloat(elements.distanceKm.value) || 0;
            kmDriven = km;
            litersUsed = (km * consumption / 100) * modifier;
            fuelCost = litersUsed * fuelPrice;
            break;
        }

        case 'fuel': {
            const liters = parseFloat(elements.fuelLiters.value) || 0;
            const km = parseFloat(elements.fuelKmDriven.value) || 0;
            litersUsed = liters;
            kmDriven = km;
            fuelCost = liters * fuelPrice;
            break;
        }

        case 'gauge': {
            // Use tank size from common settings
            const tankSize = parseFloat(elements.tankSize.value) || 55;
            const totalMarks = parseFloat(elements.gaugeTotalMarks.value) || 8;
            const start = parseFloat(elements.gaugeStart.value) || 0;
            const end = parseFloat(elements.gaugeEnd.value) || 0;

            const litersPerMark = tankSize / totalMarks;
            litersUsed = Math.max(0, (start - end) * litersPerMark);
            kmDriven = parseFloat(elements.gaugeKmDriven?.value) || 0;
            fuelCost = litersUsed * fuelPrice;
            break;
        }

    }

    // Calculate derived values
    const perKm = kmDriven > 0 ? fuelCost / kmDriven : 0;
    const efficiency = litersUsed > 0 && kmDriven > 0 ? kmDriven / litersUsed : 0;

    // Update display
    elements.resultFuelCost.textContent = formatNumber(Math.round(fuelCost));
    elements.resultPerKm.textContent = formatNumber(Math.round(perKm));
    elements.resultLiters.textContent = litersUsed.toFixed(1);
    elements.resultEfficiency.textContent = efficiency.toFixed(1);

    // Total cost
    const rental = parseFloat(elements.rentalCost.value) || 0;
    const total = fuelCost + rental;
    elements.totalCost.textContent = formatNumber(Math.round(total)) + ' VND';
}

// ============================================
// Format Numbers
// ============================================
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ============================================
// Action Buttons & Modal
// ============================================
function setupActionButtons() {
    // Open modal
    elements.btnExport.addEventListener('click', openExportModal);

    // Close modal
    elements.closeModal.addEventListener('click', closeExportModal);
    elements.exportModal.addEventListener('click', (e) => {
        if (e.target === elements.exportModal) closeExportModal();
    });

    // Copy Text
    elements.btnCopyText.addEventListener('click', copyMarkdownText);

    // Save Image
    elements.btnSaveImage.addEventListener('click', saveAsImage);
}

function openExportModal() {
    const markdown = generateMarkdown();
    elements.exportPreview.textContent = markdown;
    elements.exportModal.classList.add('show');
}

function closeExportModal() {
    elements.exportModal.classList.remove('show');
}

function generateMarkdown() {
    const data = getExportData();

    const methodEN = {
        'Trip A/B': 'Trip Meter',
        'Quãng đường': 'Distance',
        'Xăng thực tế': 'Actual Fuel',
        'Vạch taplo': 'Fuel Gauge'
    };

    return `## ⛽ CHUM Fuel Report

📅 **Date:** ${data.date}

---

### 📋 Information
| Item | Value |
|------|-------|
| 📊 Method | ${methodEN[data.method] || data.method} |
| ⛽ Fuel Price | ${data.fuelPrice} |
| 🚗 Consumption | ${data.consumption} |

---

### 💰 Results
| Item | Value |
|------|-------|
| 💵 Fuel Cost | ${data.fuelCost} |
| 🛢️ Liters Used | ${data.liters} |
| 📏 Cost per km | ${data.perKm} |
| ⚡ Efficiency | ${data.efficiency} |
| 🚙 Rental Fee | ${data.rental} |

---

### 🏆 TOTAL: ${data.total}

---
*Generated by CHUM Fuel ❤️*`;
}

function copyMarkdownText() {
    const markdown = generateMarkdown();
    navigator.clipboard.writeText(markdown).then(() => {
        elements.btnCopyText.textContent = '✅ Copied!';
        setTimeout(() => {
            elements.btnCopyText.textContent = '📋 Copy Text';
        }, 2000);
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        elements.btnCopyText.textContent = '✅ Copied!';
        setTimeout(() => {
            elements.btnCopyText.textContent = '📋 Copy Text';
        }, 2000);
    });
}

async function saveAsImage() {
    try {
        elements.btnSaveImage.textContent = '⏳ Loading...';

        const data = getExportData();
        const methodEN = {
            'Trip A/B': 'Trip Meter',
            'Quãng đường': 'Distance',
            'Xăng thực tế': 'Actual Fuel',
            'Vạch taplo': 'Fuel Gauge'
        };

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 600;
        const height = 700;
        canvas.width = width;
        canvas.height = height;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // White card
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, 30, 30, width - 60, height - 60, 20, true);

        // Header
        ctx.fillStyle = '#0984e3';
        roundRectTop(ctx, 30, 30, width - 60, 100, 20);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CHUM Fuel', width / 2, 85);
        ctx.font = '14px Arial';
        ctx.fillText('Fuel Cost Report - ' + data.date, width / 2, 115);

        // Info section
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('INFORMATION', 60, 170);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#636e72';
        ctx.fillText('Method: ' + (methodEN[data.method] || data.method), 60, 200);
        ctx.fillText('Fuel Price: ' + data.fuelPrice, 60, 225);
        ctx.fillText('Consumption: ' + data.consumption, 60, 250);

        // Results section
        ctx.fillStyle = '#f8f9fa';
        roundRect(ctx, 50, 280, width - 100, 200, 15, true);

        ctx.fillStyle = '#0984e3';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CALCULATION RESULTS', width / 2, 315);

        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        const col1 = 80;
        const col2 = width / 2 + 20;

        ctx.fillStyle = '#636e72';
        ctx.fillText('Fuel Cost:', col1, 350);
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(data.fuelCost, col1, 372);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#636e72';
        ctx.fillText('Liters Used:', col2, 350);
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(data.liters, col2, 372);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#636e72';
        ctx.fillText('Cost/km:', col1, 405);
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(data.perKm, col1, 427);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#636e72';
        ctx.fillText('Efficiency:', col2, 405);
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(data.efficiency, col2, 427);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#636e72';
        ctx.fillText('Rental Fee:', col1, 460);
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(data.rental, col1, 482);

        // Total box
        ctx.fillStyle = '#0984e3';
        roundRect(ctx, 50, 510, width - 100, 60, 15, true);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TOTAL: ' + data.total, width / 2, 550);

        // Footer
        ctx.fillStyle = '#b2bec3';
        ctx.font = '12px Arial';
        ctx.fillText('Generated by CHUM Fuel', width / 2, 620);

        // Download
        const link = document.createElement('a');
        link.download = `chum-fuel-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        elements.btnSaveImage.textContent = '✅ Saved!';
        setTimeout(() => {
            elements.btnSaveImage.textContent = '🖼️ Lưu ảnh';
            closeExportModal();
        }, 1500);
    } catch (err) {
        elements.btnSaveImage.textContent = '🖼️ Lưu ảnh';
        alert('Error: ' + err.message);
    }
}






// ============================================
// Export Functions
// ============================================
function getExportData() {
    const methodNames = {
        trip: 'Trip A/B',
        distance: 'Quãng đường',
        fuel: 'Xăng thực tế',
        gauge: 'Vạch taplo'
    };

    return {
        title: 'CHUM Fuel - Kết quả tính xăng',
        date: new Date().toLocaleString('vi-VN'),
        method: methodNames[currentMethod],
        fuelPrice: elements.fuelPrice.value + ' VND/L',
        consumption: elements.fuelConsumption.value + ' L/100km',
        fuelCost: elements.resultFuelCost.textContent + ' VND',
        liters: elements.resultLiters.textContent + ' L',
        perKm: elements.resultPerKm.textContent + ' VND/km',
        efficiency: elements.resultEfficiency.textContent + ' km/L',
        rental: elements.rentalCost.value ? formatNumber(elements.rentalCost.value) + ' VND' : '0 VND',
        total: elements.totalCost.textContent
    };
}

async function exportPNG() {
    try {
        const data = getExportData();

        // Tạo canvas đẹp
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 600;
        const height = 700;
        canvas.width = width;
        canvas.height = height;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // White card
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, 30, 30, width - 60, height - 60, 20, true);

        // Header
        ctx.fillStyle = '#0984e3';
        roundRectTop(ctx, 30, 30, width - 60, 100, 20);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CHUM Fuel', width / 2, 85);
        ctx.font = '14px Arial';
        ctx.fillText('Bao cao chi phi xang dau - ' + data.date, width / 2, 115);

        // Info section
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('THONG TIN', 60, 170);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#636e72';
        ctx.fillText('Phuong phap: ' + data.method, 60, 200);
        ctx.fillText('Gia xang: ' + data.fuelPrice, 60, 225);
        ctx.fillText('Tieu hao: ' + data.consumption, 60, 250);

        // Results section
        ctx.fillStyle = '#f8f9fa';
        roundRect(ctx, 50, 280, width - 100, 200, 15, true);

        ctx.fillStyle = '#0984e3';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KET QUA TINH TOAN', width / 2, 315);

        // Result items
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        const col1 = 80;
        const col2 = width / 2 + 20;

        ctx.fillStyle = '#636e72';
        ctx.fillText('Tien xang:', col1, 350);
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(data.fuelCost, col1, 372);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#636e72';
        ctx.fillText('Lit tieu hao:', col2, 350);
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(data.liters, col2, 372);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#636e72';
        ctx.fillText('Chi phi/km:', col1, 405);
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(data.perKm, col1, 427);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#636e72';
        ctx.fillText('Hieu suat:', col2, 405);
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(data.efficiency, col2, 427);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#636e72';
        ctx.fillText('Tien thue xe:', col1, 460);
        ctx.fillStyle = '#2d3436';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(data.rental, col1, 482);

        // Total box
        ctx.fillStyle = '#0984e3';
        roundRect(ctx, 50, 510, width - 100, 60, 15, true);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TONG: ' + data.total, width / 2, 550);

        // Footer
        ctx.fillStyle = '#b2bec3';
        ctx.font = '12px Arial';
        ctx.fillText('Tao boi CHUM Fuel', width / 2, 620);

        // Download
        const link = document.createElement('a');
        link.download = `chum-fuel-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        alert('Da xuat PNG!');
    } catch (err) {
        alert('Loi xuat PNG: ' + err.message);
    }
}

// Helper function for rounded rectangle
function roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
}

function roundRectTop(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
}

async function exportPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const data = getExportData();

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(9, 132, 227);
        doc.rect(0, 0, pageWidth, 45, 'F');

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.text('CHUM Fuel', pageWidth / 2, 22, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Bao cao chi phi xang dau', pageWidth / 2, 33, { align: 'center' });
        doc.setFontSize(10);
        doc.text(data.date, pageWidth / 2, 42, { align: 'center' });

        // Reset text color
        doc.setTextColor(45, 52, 54);

        // Info section
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('THONG TIN', 20, 60);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text('Phuong phap: ' + data.method, 25, 72);
        doc.text('Gia xang: ' + data.fuelPrice, 25, 82);
        doc.text('Tieu hao: ' + data.consumption, 25, 92);

        // Results box
        doc.setFillColor(240, 242, 245);
        doc.roundedRect(15, 102, pageWidth - 30, 75, 5, 5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(9, 132, 227);
        doc.text('KET QUA TINH TOAN', pageWidth / 2, 118, { align: 'center' });

        doc.setTextColor(45, 52, 54);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        const col1 = 25;
        const col2 = pageWidth / 2 + 10;

        doc.text('Tien xang: ' + data.fuelCost, col1, 135);
        doc.text('Lit tieu hao: ' + data.liters, col2, 135);
        doc.text('Chi phi/km: ' + data.perKm, col1, 150);
        doc.text('Hieu suat: ' + data.efficiency, col2, 150);
        doc.text('Tien thue xe: ' + data.rental, col1, 165);

        // Total box
        doc.setFillColor(9, 132, 227);
        doc.roundedRect(15, 190, pageWidth - 30, 25, 5, 5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('TONG: ' + data.total, pageWidth / 2, 207, { align: 'center' });

        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Tao boi CHUM Fuel', pageWidth / 2, 235, { align: 'center' });

        doc.save(`chum-fuel-${Date.now()}.pdf`);
        alert('Da xuat PDF!');
    } catch (err) {
        alert('Loi xuat PDF: ' + err.message);
    }
}

function copyMarkdown() {
    try {
        const data = getExportData();

        const methodEN = {
            'Trip A/B': 'Trip Meter',
            'Quãng đường': 'Distance',
            'Xăng thực tế': 'Actual Fuel',
            'Vạch taplo': 'Fuel Gauge'
        };

        const markdown = `
## ⛽ CHUM Fuel Report

📅 **Date:** ${data.date}

---

### 📋 Information
| Item | Value |
|------|-------|
| 📊 Method | ${methodEN[data.method] || data.method} |
| ⛽ Fuel Price | ${data.fuelPrice} |
| 🚗 Consumption | ${data.consumption} |

---

### 💰 Results
| Item | Value |
|------|-------|
| 💵 Fuel Cost | ${data.fuelCost} |
| 🛢️ Liters Used | ${data.liters} |
| 📏 Cost per km | ${data.perKm} |
| ⚡ Efficiency | ${data.efficiency} |
| 🚙 Rental Fee | ${data.rental} |

---

### 🏆 TOTAL: ${data.total}

---
*Generated by CHUM Fuel ❤️*
`.trim();

        navigator.clipboard.writeText(markdown).then(() => {
            alert('✅ Copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = markdown;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('✅ Copied to clipboard!');
        });
    } catch (err) {
        alert('❌ Error: ' + err.message);
    }
}

// ============================================
// Service Worker Registration
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW registration failed:', err));
    });
}

// ============================================
// Start
// ============================================
document.addEventListener('DOMContentLoaded', init);
