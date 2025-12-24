// Public Dashboard Module - Dark Theme Version
class PublicDashboard {
    constructor() {
        this.lastUpdate = null;
        this.latestTransactionDate = null; // Tambah properti baru
        this.autoRefreshInterval = null;
        this.isDarkTheme = true;
        this.init();
    }
    
    init() {
        console.log('Public Dashboard (Dark Theme) initialized');
        this.setupAutoRefresh();
        this.loadData();
        
        // Setup theme
        this.setupTheme();
        
        // Add event listener for visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadData();
            }
        });
    }
    
    setupTheme() {
        // Set dark theme on body
        document.body.setAttribute('data-bs-theme', 'dark');
        
        // Add dark theme class to all cards
        setTimeout(() => {
            document.querySelectorAll('.card, .stat-card').forEach(card => {
                card.classList.add('dark-theme');
            });
        }, 100);
    }
    
    setupAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.autoRefreshInterval = setInterval(() => {
            this.loadData();
            this.showNotification('Data diperbarui otomatis', 'info');
        }, 300000);
    }
    
    async loadData() {
        try {
            this.showLoadingState();
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const data = await this.fetchFromGoogleSheets();
            
            if (data && Array.isArray(data) && data.length > 0) {
                this.processData(data);
                this.showSuccessState();
            } else {
                this.showNoDataState();
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showErrorState(error.message || 'Gagal memuat data');
        }
    }
    
    async fetchFromGoogleSheets() {
        try {
            if (CONFIG.API_KEY && CONFIG.API_KEY !== 'YOUR_API_KEY' && 
                CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID') {
                
                const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SPREADSHEET_ID}/values/${CONFIG.SHEETS.DANA}!A2:G?key=${CONFIG.API_KEY}`;
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const json = await response.json();
                return json.values || [];
            } else {
                console.log('Using sample data');
                return this.getSampleData();
            }
            
        } catch (error) {
            console.error('Fetch error:', error);
            return this.getSampleData();
        }
    }
    
    getSampleData() {
        return [
            ['2024-01-15', 'Budi Santoso', 'Pendidikan', '500000', 'Yayasan Pintar', 'Tunai', 'Donasi rutin'],
            ['2024-01-14', 'Sari Wijaya', 'Kesehatan', '1000000', 'RS Sehat', 'Transfer', 'Bantuan operasi'],
            ['2024-01-13', 'PT Maju Jaya', 'Bencana Alam', '5000000', 'Korban banjir', 'Transfer', 'Tanggap darurat'],
            ['2024-01-12', 'Anonim', 'Pendidikan', '250000', 'Sekolah Darurat', 'Tunai', 'Buku pelajaran'],
            ['2024-01-11', 'Rina Melati', 'Kesehatan', '750000', 'Klinik Gratis', 'Transfer', 'Obat-obatan'],
            ['2024-01-10', 'Komunitas Peduli', 'Bencana Alam', '3000000', 'Pengungsi gempa', 'Transfer', 'Tenda dan makanan'],
            ['2024-01-09', 'Ahmad Fauzi', 'Pendidikan', '1000000', 'Beasiswa', 'Transfer', 'Beasiswa mahasiswa'],
            ['2024-01-08', 'CV Sejahtera', 'Kesehatan', '2000000', 'Rumah Sakit', 'Transfer', 'Alat kesehatan'],
            ['2024-01-07', 'Donatur Anonim', 'Bencana Alam', '1500000', 'Banjir', 'Tunai', 'Bantuan banjir'],
            ['2024-01-06', 'Budi Santoso', 'Pendidikan', '750000', 'Sekolah', 'Transfer', 'Donasi bulanan'],
            ['2024-01-05', 'Sari Wijaya', 'Kesehatan', '1250000', 'Klinik', 'Transfer', 'Bantuan obat'],
            ['2024-01-04', 'PT Jaya Abadi', 'Sosial', '3000000', 'Panti Asuhan', 'Transfer', 'Bantuan sosial'],
            ['2024-01-03', 'Anonim', 'Keagamaan', '1000000', 'Masjid', 'Tunai', 'Infaq masjid'],
            ['2024-01-02', 'Rina Melati', 'Kesehatan', '800000', 'RS Umum', 'Transfer', 'Bantuan pasien'],
            ['2024-01-01', 'Komunitas Peduli', 'Bencana Alam', '2500000', 'Gempa', 'Transfer', 'Bantuan gempa']
        ];
    }
    
    processData(data) {
        console.log('Processing data:', data.length, 'rows');
        
        try {
            let total = 0;
            let transactionCount = 0;
            const donorSet = new Set();
            const kategoriMap = {};
            let latestTransactionDate = null; // Tambah variabel baru
            
            data.forEach((row, index) => {
                try {
                    if (!Array.isArray(row)) return;
                    
                    const donor = row[1] ? String(row[1]).trim() : '';
                    const kategori = row[2] ? String(row[2]).trim() : 'Lainnya';
                    const amount = utils.parseAmount(row[3]);
                    const dateStr = row[0]; // Tanggal transaksi
                    
                    if (amount > 0) {
                        total += amount;
                        transactionCount++;
                    }
                    
                    if (donor && donor !== 'Anonim' && donor !== '-') {
                        donorSet.add(donor);
                    }
                    
                    if (!kategoriMap[kategori]) {
                        kategoriMap[kategori] = { count: 0, total: 0 };
                    }
                    
                    if (amount > 0) {
                        kategoriMap[kategori].count++;
                        kategoriMap[kategori].total += amount;
                    }
                    
                    // Cari tanggal terbaru
                    if (dateStr) {
                        try {
                            const transactionDate = new Date(dateStr);
                            if (!latestTransactionDate || transactionDate > latestTransactionDate) {
                                latestTransactionDate = transactionDate;
                            }
                        } catch (dateError) {
                            console.warn('Invalid date format:', dateStr);
                        }
                    }
                    
                } catch (rowError) {
                    console.error(`Error processing row ${index}:`, rowError);
                }
            });
            
            const uniqueDonors = donorSet.size;
            const uniqueCategories = Object.keys(kategoriMap).length;
            
            console.log('Calculated stats:', { total, transactionCount, uniqueDonors, uniqueCategories });
            
            // Simpan tanggal terbaru
            this.latestTransactionDate = latestTransactionDate;
            
            this.updateStatistics(total, transactionCount, uniqueDonors, uniqueCategories);
            this.updateKategoriBreakdown(kategoriMap, total);
            this.updateRecentTransactions(data);
            this.updateTopDonations(data);
            
            // Update last updated berdasarkan data terbaru
            this.updateLastUpdatedBasedOnData();
            
            const kategoriSection = document.getElementById('kategori-section');
            if (kategoriSection && uniqueCategories > 0) {
                kategoriSection.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error in processData:', error);
            throw error;
        }
    }
    
    updateStatistics(total, transactions, donors, categories) {
        try {
            // Animate total dana
            this.animateCounter('total-dana', total, utils.formatCurrency, 1500);
            
            // Update other stats
            const transaksiElement = document.getElementById('total-transaksi');
            const donaturElement = document.getElementById('total-donatur');
            const kategoriElement = document.getElementById('total-kategori');
            
            if (transaksiElement) {
                transaksiElement.textContent = utils.formatNumber(transactions);
            }
            
            if (donaturElement) {
                donaturElement.textContent = utils.formatNumber(donors);
            }
            
            if (kategoriElement) {
                kategoriElement.textContent = utils.formatNumber(categories);
            }
            
            // Update transaction count badge
            const transactionCountElement = document.getElementById('transaction-count');
            if (transactionCountElement) {
                transactionCountElement.textContent = `${utils.formatNumber(transactions)} transaksi`;
            }
            
            // Add animation
            setTimeout(() => {
                const statElements = ['total-dana', 'total-transaksi', 'total-donatur', 'total-kategori'];
                statElements.forEach((id, index) => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.classList.add('animate__animated', 'animate__pulse');
                        setTimeout(() => {
                            el.classList.remove('animate__animated', 'animate__pulse');
                        }, 1000);
                    }
                });
            }, 100);
            
        } catch (error) {
            console.error('Error in updateStatistics:', error);
        }
    }
    
    animateCounter(elementId, targetValue, formatter, duration) {
        try {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            const startValue = 0;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
                
                if (element) {
                    element.textContent = formatter ? formatter(currentValue) : currentValue.toLocaleString();
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    if (element) {
                        element.textContent = formatter ? formatter(targetValue) : targetValue.toLocaleString();
                    }
                }
            };
            
            requestAnimationFrame(animate);
            
        } catch (error) {
            console.error('Error in animateCounter:', error);
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = formatter ? formatter(targetValue) : targetValue.toLocaleString();
            }
        }
    }
    
    updateKategoriBreakdown(kategoriMap, total) {
        const container = document.getElementById('kategori-breakdown');
        if (!container) return;
        
        const sorted = Object.entries(kategoriMap)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 15);
        
        const rows = sorted.map(([kategori, data], index) => {
            const percentage = total > 0 ? ((data.total / total) * 100).toFixed(1) : 0;
            const colorClass = this.getCategoryColorClass(index);
            
            return `
                <tr class="animate__animated animate__fadeInUp" style="animation-delay: ${index * 0.05}s">
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="rounded-circle p-2 me-3" style="background: rgba(59, 130, 246, 0.1);">
                                <i class="fas fa-folder text-primary"></i>
                            </div>
                            <span class="fw-semibold text-light">${kategori}</span>
                        </div>
                    </td>
                    <td class="text-center">
                        <span class="badge bg-secondary">${utils.formatNumber(data.count)}</span>
                    </td>
                    <td>
                        <span class="fw-bold text-light">${utils.formatCurrency(data.total)}</span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="progress flex-grow-1 me-3" style="height: 8px;">
                                <div class="progress-bar ${colorClass}" 
                                     style="width: ${percentage}%"
                                     role="progressbar">
                                </div>
                            </div>
                            <span class="text-nowrap fw-semibold" style="min-width: 50px;">${percentage}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        container.innerHTML = rows || `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <i class="fas fa-inbox fa-2x text-secondary mb-3"></i>
                    <p class="text-secondary mb-0">Belum ada data kategori</p>
                </td>
            </tr>
        `;
    }
    
    updateRecentTransactions(data) {
        const container = document.getElementById('recent-transactions');
        if (!container) return;
        
        try {
            // 1. Urutkan data berdasarkan tanggal DESCENDING (terbaru ke terlama)
            const sortedData = [...data].sort((a, b) => {
                // Pastikan kolom tanggal ada di index 0
                const dateA = new Date(a[0] || 0);
                const dateB = new Date(b[0] || 0);
                return dateB - dateA; // DESC: terbaru dulu
            });
            
            console.log('Data diurutkan dari terbaru:', sortedData.length, 'transaksi');
            
            // Tampilkan semua data yang sudah diurutkan
            this.renderSortedTransactions(sortedData, container);
            
        } catch (error) {
            console.error('Error sorting transactions:', error);
            // Fallback: tampilkan data asli
            this.renderSortedTransactions([...data].reverse(), container);
        }
    }
    
    renderSortedTransactions(sortedData, container) {
        if (!sortedData || sortedData.length === 0) {
            container.innerHTML = this.getNoDataHTML();
            return;
        }
        
        const items = sortedData.map((row, index) => {
            return this.createTransactionHTML(row, index);
        }).join('');
        
        const dataCount = sortedData.length;
        const summaryHtml = this.getSummaryHTML(dataCount);
        
        container.innerHTML = summaryHtml + items + this.getFooterHTML(dataCount);
    }
    
    createTransactionHTML(row, index) {
        const waktu = utils.getTimeAgo(row[0]);
        const donorName = PUBLIC_CONFIG.SHOW_DONOR_NAMES ? (row[1] || 'Donatur Anonim') : 'Donatur Anonim';
        const kategori = row[2] || 'Umum';
        const jumlah = utils.formatCurrency(row[3]);
        const metode = row[5] || '-';
        const keterangan = utils.truncateText(row[6] || 'Donasi kemanusiaan', 50);
        const tanggal = utils.formatDate(row[0]);
        
        const metodeColor = this.getMetodeColor(metode);
        const kategoriColor = this.getKategoriColorClass(kategori);
        
        // Beri badge "NEW" untuk transaksi hari ini
        const isToday = this.isToday(row[0]);
        const newBadge = isToday ? 
            '<span class="badge bg-danger ms-2"><i class="fas fa-star me-1"></i>Baru</span>' : '';
        
        return `
            <div class="recent-transaction animate__animated animate__fadeInRight" 
                 style="animation-delay: ${index * 0.02}s">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <h6 class="mb-0 me-2 fw-semibold text-light">${donorName}</h6>
                            ${newBadge}
                        </div>
                        <div class="d-flex align-items-center mb-2">
                            <span class="badge ${kategoriColor} me-2">${kategori}</span>
                            <span class="badge bg-${metodeColor} me-2">${metode}</span>
                            <span class="text-secondary small">
                                <i class="fas fa-calendar me-1"></i>${tanggal}
                            </span>
                        </div>
                        <p class="mb-2 small text-secondary">
                            <i class="fas fa-comment me-1"></i>${keterangan}
                        </p>
                        <div class="small text-secondary">
                            <i class="fas fa-user me-1"></i>${row[4] || '-'}
                            <span class="mx-2">•</span>
                            <i class="fas fa-clock me-1"></i>${waktu}
                        </div>
                    </div>
                    <div class="text-end ms-3">
                        <h5 class="mb-0 text-success fw-bold">${jumlah}</h5>
                        <small class="text-secondary">Donasi</small>
                    </div>
                </div>
            </div>
        `;
    }
    
    getSummaryHTML(dataCount) {
        return `
            <div class="list-group-item bg-dark border-bottom sticky-top" style="top: 56px; z-index: 10;">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-sort-amount-down me-2 text-primary"></i>
                        <span class="fw-semibold text-light">Transaksi Terbaru (${utils.formatNumber(dataCount)})</span>
                        <small class="text-secondary ms-2">• Urut: Terbaru ke Terlama</small>
                    </div>
                </div>
            </div>
        `;
    }
    
    getFooterHTML(dataCount) {
        return `
            <div class="list-group-item bg-dark">
                <div class="text-center small text-secondary py-3">
                    <i class="fas fa-filter me-1"></i>
                    Menampilkan ${utils.formatNumber(dataCount)} transaksi terbaru
                </div>
            </div>
        `;
    }
    
    getNoDataHTML() {
        return `
            <div class="list-group-item text-center py-5 animate__animated animate__fadeIn">
                <i class="fas fa-inbox fa-2x text-secondary mb-2"></i>
                <h6 class="text-secondary">Belum ada transaksi</h6>
                <p class="small text-secondary mb-0">Data akan muncul setelah ada donasi pertama</p>
            </div>
        `;
    }
    
    isToday(dateString) {
        try {
            const today = new Date();
            const date = new Date(dateString);
            
            return date.getDate() === today.getDate() &&
                   date.getMonth() === today.getMonth() &&
                   date.getFullYear() === today.getFullYear();
        } catch (error) {
            return false;
        }
    }
    
    updateTopDonations(data) {
        if (data.length === 0) {
            this.showNoTopDonations();
            return;
        }
        
        // Ambil 3 donasi tertinggi berdasarkan nominal
        const topDonations = this.getTopDonations(data);
        this.renderTopDonations(topDonations);
    }
    
    getTopDonations(data) {
        // Filter dan sort berdasarkan nominal tertinggi
        const validData = data.filter(row => {
            const amount = utils.parseAmount(row[3]);
            return amount > 0 && row[1]; // Pastikan ada nominal dan nama
        });
        
        // Sort dari nominal tertinggi ke terendah
        const sorted = validData.sort((a, b) => {
            const amountA = utils.parseAmount(a[3]);
            const amountB = utils.parseAmount(b[3]);
            return amountB - amountA; // DESC: tertinggi dulu
        });
        
        // Ambil 3 besar
        return sorted.slice(0, 3);
    }
    
    renderTopDonations(topDonations) {
        const latestUpdate = document.getElementById('latest-update');
        if (!latestUpdate) return;
        
        if (topDonations.length === 0) {
            this.showNoTopDonations();
            return;
        }
        
        const rankings = ['🥇', '🥈', '🥉'];
        
        const donationsHTML = topDonations.map((donation, index) => {
            const donorName = PUBLIC_CONFIG.SHOW_DONOR_NAMES 
                ? (donation[1] || 'Anonim') 
                : 'Donatur Anonim';
            const kategori = donation[2] || 'Umum';
            const jumlah = utils.formatCurrency(utils.parseAmount(donation[3]));
            const penerima = donation[4] || '-';
            const metode = donation[5] || '-';
            const tanggal = utils.formatDate(donation[0]);
            const waktu = utils.getTimeAgo(donation[0]);
            
            // Format nominal untuk tampilan lebih baik
            const displayAmount = jumlah.replace('Rp ', '');
            
            // Warna ranking
            const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            
            return `
                <div class="top-donation-card mb-3 p-3 rounded" 
                     style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(30, 41, 59, 0.7)); 
                            border-left: 4px solid ${rankColors[index]};
                            border: 1px solid rgba(71, 85, 105, 0.5);">
                    <div class="d-flex justify-content-between align-items-start">
                        <!-- Left side: Ranking and donor info -->
                        <div class="flex-grow-1 me-3" style="min-width: 0;">
                            <div class="d-flex align-items-center mb-2">
                                <div class="rank-badge me-3 flex-shrink-0" style="
                                    width: 36px;
                                    height: 36px;
                                    border-radius: 50%;
                                    background: ${rankColors[index]};
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: bold;
                                    font-size: 1.2rem;
                                    color: white;
                                    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                ">
                                    ${rankings[index]}
                                </div>
                                <div class="flex-grow-1" style="min-width: 0;">
                                    <!-- Donor name with truncation -->
                                    <h6 class="text-light mb-0 text-truncate" 
                                        style="font-size: 0.95rem;"
                                        title="${donorName}">
                                        ${donorName}
                                    </h6>
                                    <!-- Penerima with truncation -->
                                    <small class="text-secondary text-truncate d-block" 
                                           style="font-size: 0.8rem;"
                                           title="${penerima}">
                                        ${penerima}
                                    </small>
                                </div>
                            </div>
                            
                            <!-- Category and method badges -->
                            <div class="mb-2 d-flex flex-wrap gap-1">
                                <span class="badge bg-primary" style="font-size: 0.75rem; padding: 3px 8px;">
                                    ${kategori.substring(0, 15)}${kategori.length > 15 ? '...' : ''}
                                </span>
                                <span class="badge bg-success" style="font-size: 0.75rem; padding: 3px 8px;">
                                    ${metode.substring(0, 10)}${metode.length > 10 ? '...' : ''}
                                </span>
                            </div>
                            
                            <!-- Date and time -->
                            <div class="d-flex align-items-center" style="font-size: 0.8rem;">
                                <span class="text-secondary">
                                    <i class="fas fa-calendar me-1"></i>${tanggal}
                                </span>
                                <span class="text-secondary ms-3">
                                    <i class="fas fa-clock me-1"></i>${waktu}
                                </span>
                            </div>
                        </div>
                        
                        <!-- Right side: Amount -->
                        <div class="flex-shrink-0" style="min-width: 100px;">
                            <div style="
                                padding: 8px 12px;
                                background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
                                border-radius: 8px;
                                border: 1px solid rgba(16, 185, 129, 0.3);
                                text-align: right;
                            ">
                                <div class="text-success fw-bold mb-0" 
                                     style="font-size: 1rem; line-height: 1.2;">
                                    Rp
                                </div>
                                <div class="text-success fw-bold" 
                                     style="font-size: 1.3rem; line-height: 1.2;">
                                    ${displayAmount}
                                </div>
                                <small class="text-secondary" style="font-size: 0.7rem;">
                                    Donasi
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        latestUpdate.innerHTML = `
            <div class="top-donations-container">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <small class="text-secondary" style="font-size: 0.9rem;">
                            Berdasarkan nominal sumbangan
                        </small>
                    </div>
                    <span class="badge bg-warning" style="font-size: 0.75rem; padding: 4px 8px;">
                        <i class="fas fa-crown me-1"></i>TERBESAR
                    </span>
                </div>
                
                ${donationsHTML}
                
                <div class="text-center mt-2 pt-2" style="border-top: 1px solid rgba(255,255,255,0.1);">
                    <small class="text-secondary" style="font-size: 0.75rem;">
                        <i class="fas fa-info-circle me-1"></i>
                        Menampilkan 3 donasi dengan nominal tertinggi
                    </small>
                </div>
            </div>
        `;
    }
    
    showNoTopDonations() {
        const latestUpdate = document.getElementById('latest-update');
        if (!latestUpdate) return;
        
        latestUpdate.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-trophy fa-2x text-secondary mb-3"></i>
                <h6 class="text-secondary">Belum ada data donasi</h6>
                <p class="small text-secondary mb-0">Donasi pertama akan muncul di sini</p>
            </div>
        `;
    }
    
    updateLastUpdatedBasedOnData() {
        // Gunakan tanggal transaksi terbaru jika ada
        if (this.latestTransactionDate) {
            this.lastUpdate = this.latestTransactionDate;
        } else {
            // Fallback ke waktu sekarang jika tidak ada data
            this.lastUpdate = new Date();
        }
        
        this.updateLastUpdateDisplay();
    }
    
    updateLastUpdateDisplay() {
        const timeElement = document.getElementById('last-updated-time');
        const textElement = document.getElementById('last-updated-text');
        const lastUpdateInfo = document.getElementById('last-update-info');
        
        if (!this.lastUpdate) {
            if (timeElement) timeElement.textContent = '-';
            if (textElement) textElement.textContent = 'Belum ada data';
            if (lastUpdateInfo) lastUpdateInfo.innerHTML = '-';
            return;
        }
        
        const now = new Date();
        const timeDiff = now - this.lastUpdate;
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        
        // Format tanggal lengkap
        const fullDate = this.lastUpdate.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Format singkat untuk badge
        const shortDate = this.lastUpdate.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Format relative time (berapa lama yang lalu)
        let relativeTime;
        if (timeDiff < 60000) { // Kurang dari 1 menit
            relativeTime = 'Baru saja';
        } else if (timeDiff < 3600000) { // Kurang dari 1 jam
            const minutes = Math.floor(timeDiff / 60000);
            relativeTime = `${minutes} menit yang lalu`;
        } else if (timeDiff < 86400000) { // Kurang dari 1 hari
            const hours = Math.floor(timeDiff / 3600000);
            relativeTime = `${hours} jam yang lalu`;
        } else {
            const days = Math.floor(timeDiff / 86400000);
            relativeTime = `${days} hari yang lalu`;
        }
        
        // Tentukan badge color berdasarkan berapa lama update
        let badgeColor = 'success';
        let badgeIcon = 'fa-check-circle';
        let statusText = 'Aktif';
        
        if (hoursDiff > 24) {
            badgeColor = 'warning';
            badgeIcon = 'fa-exclamation-triangle';
            statusText = 'Perlu update';
        }
        
        if (hoursDiff > 72) {
            badgeColor = 'danger';
            badgeIcon = 'fa-times-circle';
            statusText = 'Ketinggalan';
        }
        
        // Update footer
        if (timeElement) {
            timeElement.innerHTML = `
                <span class="fw-semibold">${shortDate}</span>
                <span class="badge bg-${badgeColor} ms-2" style="font-size: 0.7rem;">
                    <i class="fas ${badgeIcon} me-1"></i>${relativeTime}
                </span>
            `;
        }
        
        if (textElement) {
            textElement.innerHTML = `
                <i class="fas fa-history me-1"></i>
                Data terbaru: <span class="fw-semibold">${relativeTime}</span>
            `;
        }
        
        // Update info panel di sidebar
        if (lastUpdateInfo) {
            lastUpdateInfo.innerHTML = `
                <div class="mb-2">
                    <div class="d-flex align-items-center mb-1">
                        <i class="fas fa-clock me-2 text-primary"></i>
                        <span class="fw-semibold">Update Terakhir</span>
                    </div>
                    <div class="ms-4">
                        <p class="mb-1 small">${fullDate}</p>
                        <div class="d-flex align-items-center">
                            <span class="badge bg-${badgeColor} me-2">
                                <i class="fas ${badgeIcon} me-1"></i>${statusText}
                            </span>
                            <small class="text-secondary">${relativeTime}</small>
                        </div>
                    </div>
                </div>
                
                <div class="mt-3 pt-3 border-top border-dark">
                    <div class="d-flex align-items-center mb-1">
                        <i class="fas fa-database me-2 text-success"></i>
                        <span class="fw-semibold">Status Data</span>
                    </div>
                    <div class="ms-4">
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-${badgeColor}" 
                                 style="width: ${hoursDiff > 24 ? (hoursDiff > 72 ? '30%' : '60%') : '100%'}">
                            </div>
                        </div>
                        <small class="text-secondary d-block mt-1">
                            ${hoursDiff > 24 
                                ? (hoursDiff > 72 
                                    ? 'Data sudah lama tidak diperbarui' 
                                    : 'Data butuh update segera')
                                : 'Data terbaru tersedia'}
                        </small>
                    </div>
                </div>
            `;
        }
    }
    
    async checkForNewData() {
        try {
            const data = await this.fetchFromGoogleSheets();
            if (!data || data.length === 0) return false;
            
            // Ambil tanggal terbaru dari data
            let latestDateInData = null;
            data.forEach(row => {
                if (row[0]) {
                    try {
                        const rowDate = new Date(row[0]);
                        if (!latestDateInData || rowDate > latestDateInData) {
                            latestDateInData = rowDate;
                        }
                    } catch (e) {
                        console.warn('Invalid date in row:', row[0]);
                    }
                }
            });
            
            // Cek apakah ada data baru
            if (latestDateInData && this.latestTransactionDate) {
                if (latestDateInData > this.latestTransactionDate) {
                    console.log('Data baru ditemukan!');
                    return true;
                }
            } else if (latestDateInData && !this.latestTransactionDate) {
                // Ini data pertama kali
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('Error checking new data:', error);
            return false;
        }
    }
    
    getCategoryColorClass(index) {
        const colors = [
            'bg-primary', 'bg-success', 'bg-info', 
            'bg-warning', 'bg-danger', 'bg-secondary'
        ];
        return colors[index % colors.length];
    }
    
    getKategoriColorClass(kategori) {
        const colorMap = {
            'pendidikan': 'bg-info',
            'kesehatan': 'bg-danger',
            'bencana alam': 'bg-warning',
            'sosial': 'bg-success',
            'keagamaan': 'bg-primary',
            'umum': 'bg-secondary'
        };
        
        const lowerKategori = kategori.toLowerCase();
        for (const [key, color] of Object.entries(colorMap)) {
            if (lowerKategori.includes(key)) {
                return color;
            }
        }
        
        return 'bg-secondary';
    }
    
    getMetodeColor(metode) {
        const lowerMetode = metode.toLowerCase();
        if (lowerMetode.includes('tf') || lowerMetode.includes('transfer')) return 'success';
        if (lowerMetode.includes('cash') || lowerMetode.includes('tunai')) return 'primary';
        if (lowerMetode.includes('qris')) return 'warning';
        if (lowerMetode.includes('bank')) return 'info';
        return 'secondary';
    }
    
    showLoadingState() {
        const stats = ['total-dana', 'total-transaksi', 'total-donatur', 'total-kategori'];
        stats.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.innerHTML.includes('fa-spinner')) {
                el.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>';
            }
        });
    }
    
    showSuccessState() {
        const statsContainer = document.querySelector('.row.mb-4');
        if (statsContainer) {
            statsContainer.classList.add('animate__animated', 'animate__tada');
            setTimeout(() => {
                statsContainer.classList.remove('animate__animated', 'animate__tada');
            }, 1000);
        }
        
        this.showNotification('Data berhasil diperbarui', 'success');
    }
    
    showNoDataState() {
        const recentContainer = document.getElementById('recent-transactions');
        if (recentContainer) {
            recentContainer.innerHTML = `
                <div class="list-group-item text-center py-5 animate__animated animate__fadeIn">
                    <i class="fas fa-database fa-2x text-secondary mb-3"></i>
                    <h6 class="text-secondary">Belum ada data donasi</h6>
                    <p class="small text-secondary mb-0">Data akan muncul setelah ada donasi pertama</p>
                </div>
            `;
        }
        
        document.getElementById('total-dana').textContent = 'Rp 0';
        document.getElementById('total-transaksi').textContent = '0';
        document.getElementById('total-donatur').textContent = '0';
        document.getElementById('total-kategori').textContent = '0';
    }
    
    showErrorState(errorMessage) {
        const stats = ['total-dana', 'total-transaksi', 'total-donatur', 'total-kategori'];
        stats.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = '-';
                el.classList.add('text-danger');
            }
        });
        
        const recentContainer = document.getElementById('recent-transactions');
        if (recentContainer) {
            recentContainer.innerHTML = `
                <div class="list-group-item text-center py-5 animate__animated animate__shakeX">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-3"></i>
                    <h6 class="text-danger">Gagal memuat data</h6>
                    <p class="small text-secondary mb-0">${errorMessage || 'Kesalahan koneksi'}</p>
                    <button onclick="publicDashboard.loadData()" class="btn btn-outline-danger btn-sm mt-2">
                        Coba Lagi
                    </button>
                </div>
            `;
        }
        
        this.showNotification('Gagal memuat data', 'danger');
    }
    
    showNotification(message, type = 'info') {
        const colors = {
            'success': { bg: 'linear-gradient(135deg, #10b981, #34d399)', icon: 'fa-check-circle' },
            'info': { bg: 'linear-gradient(135deg, #3b82f6, #60a5fa)', icon: 'fa-info-circle' },
            'warning': { bg: 'linear-gradient(135deg, #f59e0b, #fbbf24)', icon: 'fa-exclamation-triangle' },
            'danger': { bg: 'linear-gradient(135deg, #ef4444, #f87171)', icon: 'fa-times-circle' }
        };
        
        const colorConfig = colors[type] || colors.info;
        
        const notification = document.createElement('div');
        notification.className = 'position-fixed bottom-0 end-0 m-3 animate__animated animate__fadeInUp';
        notification.style.zIndex = '1050';
        notification.innerHTML = `
            <div class="toast show" role="alert" style="background: ${colorConfig.bg}; border: none;">
                <div class="toast-header" style="background: transparent; color: white; border: none;">
                    <i class="fas ${colorConfig.icon} me-2"></i>
                    <strong class="me-auto">Notifikasi</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body text-white">
                    ${message}
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('animate__fadeOutDown');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }
    
    refreshData() {
        this.loadData();
        this.showNotification('Memperbarui data...', 'info');
    }
}

// Initialize dashboard
let publicDashboard;

document.addEventListener('DOMContentLoaded', function() {
    publicDashboard = new PublicDashboard();
    
    // Make functions globally available
    window.refreshData = () => publicDashboard.refreshData();
    window.publicDashboard = publicDashboard;
    
    // Initial load
    setTimeout(() => publicDashboard.loadData(), 500);
    
    // Add some dynamic effects
    setTimeout(() => {
        document.querySelectorAll('.stat-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('glowing');
                setTimeout(() => card.classList.remove('glowing'), 2000);
            }, index * 300);
        });
    }, 1000);
});