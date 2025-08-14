// komomood App - Main JavaScript
class KomomoodApp {
    constructor() {
        this.entries = [];
        this.tooltip = document.getElementById('tooltip');
        this.loading = document.getElementById('loading');
        this.heatmapGrid = document.getElementById('heatmapGrid');
        // Check-in modal elements
        this.checkinModal = document.getElementById('checkinModal');
        this.checkinForm = document.getElementById('checkinForm');
        this.checkinError = document.getElementById('checkinError');
        this.checkinDate = document.getElementById('ci_date');
        this.checkinKoko = document.getElementById('ci_koko');
        this.checkinMomo = document.getElementById('ci_momo');
        this.checkinKomo = document.getElementById('ci_komo');
        this.checkinNote = document.getElementById('ci_note');

        // Tooltip interaction state for mobile usability
        this.tooltipLocked = false;
        this.activeCellKey = null; // date string for the active cell

		// GAS Web App configuration for direct submission
		this.gasConfig = {
			webAppUrl: 'https://script.google.com/macros/s/AKfycbyhidnIIYzdn0fZCt3W9VDyixqTamz6lqlVhXHK_mum5zUB8Z8aAtlNr1uyq39nIa3aJg/exec'
		};

		// Google Form prefill config (fallback option)
		// Note: 'note' is optional. 'passphrase' will be auto-included if configured.
		this.googleFormConfig = {
			prefillBaseUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSf8XZ0Wp3NgCKBAbBY63KTC6wzyTnfa0sYZFYH7CQHZ1iffXA/viewform?usp=pp_url',
			fieldMap: {
				date: 'entry.171852347',
				kokoMood: 'entry.1537924001',
				momoMood: 'entry.1625555189',
				komoScore: 'entry.1362123046',
				note: 'entry.103218744'
			},
			optional: {
				passphrase: { param: 'entry.1162583406', value: '0317' }
			}
		};

        // Environment flag: production domain check
        this.isProduction = (typeof window !== 'undefined') && (window.location.hostname === 'us-south.20011112.xyz');
        
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.renderHeatmap();
            this.setupEventListeners();
            this.updateStats();
            this.hideLoading();
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('数据加载失败，请稍后重试');
        }
    }

    async loadData() {
        try {
            const response = await fetch('/komomood/api/entries', { headers: { 'Accept': 'application/json' } });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const raw = await response.json();
            // Normalize backend schema → frontend schema
            this.entries = (Array.isArray(raw) ? raw : []).map(row => ({
                date: row.entry_date || row.date,
                kokoMood: Number(row.koko_mood ?? row.kokoMood ?? 0),
                momoMood: Number(row.momo_mood ?? row.momoMood ?? 0),
                komoScore: Number(row.komo_score ?? row.komoScore ?? 0),
                note: row.note || ''
            }));
            console.log(`成功通过 /komomood/api 加载 ${this.entries.length} 条心情记录`);
        } catch (error) {
            console.error('加载数据失败（API）:', error);
            // Fallback: try local static JSON for resilience in dev/transition
            try {
                const fallbackResp = await fetch('data/entries.json');
                if (fallbackResp.ok) {
                    const raw = await fallbackResp.json();
                    this.entries = (Array.isArray(raw) ? raw : []);
                    console.warn(`已使用本地 JSON 作为后备，记录数：${this.entries.length}`);
                } else {
                    this.entries = [];
                }
            } catch (_) {
                // Final fallback to empty
                this.entries = [];
            }
        }
    }

    generateDateGrid() {
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setDate(today.getDate() - 365);
        
        const dates = [];
        const currentDate = new Date(oneYearAgo);
        
        // Start from the Sunday of the week containing oneYearAgo
        const startDay = currentDate.getDay(); // 0 = Sunday
        currentDate.setDate(currentDate.getDate() - startDay);
        
        // Generate 52 weeks * 7 days = 364 days, but in column-major order
        for (let day = 0; day < 7; day++) {
            for (let week = 0; week < 52; week++) {
                const dateIndex = week * 7 + day;
                const date = new Date(currentDate);
                date.setDate(date.getDate() + dateIndex);
                dates[dateIndex] = date;
            }
        }
        
        return dates;
    }

    getEntryForDate(date) {
        const dateStr = this.formatDate(date);
        return this.entries.find(entry => entry.date === dateStr);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    getColorLevel(entry) {
        if (!entry) return 0;
        
        // Use komoScore as primary indicator, clamp to 1-5
        const score = Math.max(1, Math.min(5, entry.komoScore || 1));
        return score;
    }

    renderHeatmap() {
        const dates = this.generateDateGrid();
        this.heatmapGrid.innerHTML = '';
        
        dates.forEach(date => {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            
            const entry = this.getEntryForDate(date);
            const level = this.getColorLevel(entry);
            
            cell.classList.add(`level-${level}`);
            cell.dataset.date = this.formatDate(date);
            cell.dataset.entry = entry ? JSON.stringify(entry) : '';
            
            // Add hover events
            cell.addEventListener('mouseenter', (e) => this.showTooltip(e, date, entry));
            cell.addEventListener('mouseleave', () => this.hideTooltipIfNotLocked());
            cell.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));

            // Add click/tap events for mobile usability
            cell.addEventListener('click', (e) => this.onCellClick(e, date, entry));
            cell.addEventListener('touchstart', (e) => {
                // Prevent synthetic mouse events after touch
                e.preventDefault();
                this.onCellClick(e, date, entry);
            }, { passive: false });
            
            this.heatmapGrid.appendChild(cell);
        });

        this.renderMonthLabels(dates);
    }

    renderMonthLabels(dates) {
        const monthLabelsContainer = document.getElementById('month-labels');
        monthLabelsContainer.innerHTML = '';
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let lastMonth = -1;

        for (let i = 0; i < 52; i++) {
            const date = dates[i * 7];
            const month = date.getMonth();
            if (month !== lastMonth) {
                const monthLabel = document.createElement('span');
                monthLabel.textContent = monthNames[month];
                monthLabel.className = 'absolute';
                // Approximate position based on week number
                monthLabel.style.left = `${(i * 100 / 52)}%`;
                monthLabelsContainer.appendChild(monthLabel);
            }
            lastMonth = month;
        }
    }

    showTooltip(event, date, entry) {
        const dateStr = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        let content = `<div class="font-semibold text-gray-800 mb-2">${dateStr}</div>`;
        
        if (entry) {
            content += `
                <div class="space-y-1 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Koko 心情:</span>
                        <span class="font-medium">${entry.kokoMood}/5</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Momo 心情:</span>
                        <span class="font-medium">${entry.momoMood}/5</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">关系分值:</span>
                        <span class="font-medium text-pink-500">${entry.komoScore}/5</span>
                    </div>
                    ${entry.note ? `<div class="mt-2 pt-2 border-t border-gray-200 text-gray-700">${entry.note}</div>` : ''}
                </div>
            `;
        } else {
            content += `<div class="text-gray-500 text-sm">暂无打卡记录</div>`;
        }

        this.tooltip.innerHTML = content;
        this.tooltip.style.display = 'block';
        this.updateTooltipPosition(event);
    }

    updateTooltipPosition(event) {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = event.pageX + 10;
        let top = event.pageY - tooltipRect.height - 10;

        // Adjust if tooltip goes off screen
        if (left + tooltipRect.width > viewportWidth) {
            left = event.pageX - tooltipRect.width - 10;
        }
        if (top < 0) {
            top = event.pageY + 10;
        }

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    hideTooltipIfNotLocked() {
        if (!this.tooltipLocked) {
            this.hideTooltip();
        }
    }

    onCellClick(event, date, entry) {
        const dateKey = this.formatDate(date);
        // Toggle behavior: if clicking the same active cell while locked, unlock and hide
        if (this.tooltipLocked && this.activeCellKey === dateKey) {
            this.tooltipLocked = false;
            this.activeCellKey = null;
            this.hideTooltip();
            return;
        }
        // Lock tooltip to this cell and show/update its position
        this.tooltipLocked = true;
        this.activeCellKey = dateKey;
        this.showTooltip(event, date, entry);
    }

    clampScore(value) {
        const num = Number(value);
        if (Number.isNaN(num)) return 0;
        return Math.max(1, Math.min(5, Math.trunc(num)));
    }

    updateStats() {
        const totalDays = this.entries.length;
        const avgKomoScore = totalDays > 0 
            ? (this.entries.reduce((sum, entry) => sum + (entry.komoScore || 0), 0) / totalDays).toFixed(1)
            : 0;
        
        // Calculate current streak
        const currentStreak = this.calculateCurrentStreak();

        document.getElementById('totalDays').textContent = totalDays;
        document.getElementById('avgKomoScore').textContent = avgKomoScore;
        document.getElementById('currentStreak').textContent = currentStreak;
    }

    calculateCurrentStreak() {
        if (this.entries.length === 0) return 0;
        
        // Sort entries by date descending
        const sortedEntries = [...this.entries].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let streak = 0;
        const today = new Date();
        let currentDate = new Date(today);
        
        for (let i = 0; i < sortedEntries.length; i++) {
            const entryDate = new Date(sortedEntries[i].date);
            const expectedDate = new Date(currentDate);
            
            // Check if there's an entry for current expected date
            if (this.formatDate(entryDate) === this.formatDate(expectedDate)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                // If we're checking today and there's no entry, check yesterday
                if (i === 0 && this.formatDate(entryDate) === this.formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000))) {
                    streak++;
                    currentDate.setDate(currentDate.getDate() - 2);
                } else {
                    break;
                }
            }
        }
        
        return streak;
    }

    setupEventListeners() {
        const checkinBtn = document.getElementById('checkinBtn');
        if (checkinBtn) {
            checkinBtn.addEventListener('click', () => this.openCheckinModal());
        }

        // Close modal via overlay or close button(s)
        document.querySelectorAll('[data-modal-close]').forEach(el => {
            el.addEventListener('click', () => this.closeCheckinModal());
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeCheckinModal();
        });

        // Close tooltip when clicking outside of any heatmap cell
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (this.tooltipLocked && !(target && target.closest && target.closest('.heatmap-cell'))) {
                this.tooltipLocked = false;
                this.activeCellKey = null;
                this.hideTooltip();
            }
        });

        // Same for touch interactions
        document.addEventListener('touchstart', (e) => {
            const target = e.target;
            if (this.tooltipLocked && !(target && target.closest && target.closest('.heatmap-cell'))) {
                this.tooltipLocked = false;
                this.activeCellKey = null;
                this.hideTooltip();
            }
        });

        // Default date = today
        if (this.checkinDate) {
            this.checkinDate.value = new Date().toISOString().split('T')[0];
        }

        // Submit handler
        if (this.checkinForm) {
            this.checkinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitCheckinForm();
            });
        }
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    openCheckinModal() {
        if (!this.checkinModal) return;
        this.checkinError?.classList.add('hidden');
        this.checkinModal.classList.remove('hidden');
        // Focus first field
        setTimeout(() => this.checkinDate?.focus(), 0);
    }

    closeCheckinModal() {
        if (!this.checkinModal) return;
        this.checkinModal.classList.add('hidden');
    }

    async submitCheckinForm() {
        // Get form values
        const date = this.checkinDate?.value?.trim();
        const kokoMood = this.clampScore(this.checkinKoko?.value);
        const momoMood = this.clampScore(this.checkinMomo?.value);
        const komoScore = this.clampScore(this.checkinKomo?.value);
        const note = (this.checkinNote?.value || '').trim();
        const passphrase = document.getElementById('ci_passphrase')?.value?.trim();

        // Validate
        const errorMessages = [];
        if (!date) errorMessages.push('请选择日期');
        if (!(kokoMood >= 1 && kokoMood <= 5)) errorMessages.push('Koko 心情需为 1-5');
        if (!(momoMood >= 1 && momoMood <= 5)) errorMessages.push('Momo 心情需为 1-5');
        if (!(komoScore >= 1 && komoScore <= 5)) errorMessages.push('关系分值需为 1-5');
        
        // Validate passphrase format (4 digits)
        if (!passphrase || !/^\d{4}$/.test(passphrase)) {
            errorMessages.push('通行码必须为四位数字格式（MMDD）');
        }

        if (errorMessages.length > 0) {
            this.showCheckinError(errorMessages.join('；'));
            return;
        }

        // Hide error and show loading state
        this.hideCheckinError();
        this.hideCheckinSuccess();
        
        // Disable submit button and show loading
        const submitBtn = document.querySelector('#checkinForm button[type="submit"]');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>提交中...';
        }

        try {
            // 1) Try backend API directly
            const backendResult = await this.submitToBackend({
                date, kokoMood, momoMood, komoScore, note
            });

            if (backendResult.success) {
                this.showCheckinSuccess('✅ 提交成功！已保存至本地后端。');
                // Refresh in-memory data and UI
                try {
                    await this.loadData();
                    this.renderHeatmap();
                    this.updateStats();
                } catch (_) {}
                setTimeout(() => {
                    this.closeCheckinModal();
                }, 2000);
                return;
            }

            // 2) If backend reports conflict, ask whether to overwrite
            if (backendResult && backendResult.status === 409) {
                const confirmed = window.confirm('今天已打卡。是否覆盖今天的记录？');
                if (confirmed) {
                    const overwriteResult = await this.submitToBackend({
                        date, kokoMood, momoMood, komoScore, note, overwrite: true
                    });
                    if (overwriteResult.success) {
                        this.showCheckinSuccess('✅ 已更新今天的记录。');
                        try {
                            await this.loadData();
                            this.renderHeatmap();
                            this.updateStats();
                        } catch (_) {}
                        setTimeout(() => { this.closeCheckinModal(); }, 1500);
                        return;
                    }
                    // If overwrite failed, show error and stop
                    this.showCheckinError(`覆盖失败：${overwriteResult.error || '未知错误'}`);
                    return;
                }
                // User canceled overwrite
                this.showCheckinWarning('已取消覆盖，未修改数据。');
                return;
            }

            // 3) Fallback policy
            // In production: skip GAS to avoid CORS; directly use Google Form as last resort
            if (this.isProduction) {
                this.showCheckinWarning('⚠️ 后端暂不可用，正在使用备用方案（Google Form）...');
                setTimeout(() => this.fallbackToGoogleForm({ date, kokoMood, momoMood, komoScore, note, passphrase }), 1200);
                return;
            }

            // In non-production environments, allow GAS fallback for testing
            const gasResult = await this.submitToGAS({ date, kokoMood, momoMood, komoScore, note, passphrase });
            if (gasResult.success) {
                this.showCheckinSuccess('✅ 提交成功！数据将在1-2分钟内自动同步到热力图。');
                setTimeout(() => { this.closeCheckinModal(); }, 2500);
                return;
            }
            const errorMessage = `GAS 提交失败: ${gasResult.error || '未知错误'}`;
            console.warn(errorMessage);
            this.showCheckinError(errorMessage + ' 将尝试备用方案...');
            setTimeout(() => this.fallbackToGoogleForm({ date, kokoMood, momoMood, komoScore, note, passphrase }), 2000);
        } catch (error) {
            console.error('Error during submission:', error);
            // Fallback to Google Form with specific error message
            const errorMessage = `网络请求失败: ${error.message || '请检查网络连接'}`;
            this.showCheckinError(errorMessage + ' 将尝试备用方案...');
            setTimeout(() => this.fallbackToGoogleForm({ date, kokoMood, momoMood, komoScore, note, passphrase }), 2000);
        } finally {
            // Restore submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }

    async submitToBackend({ date, kokoMood, momoMood, komoScore, note, overwrite = false }) {
        try {
            const url = overwrite ? '/komomood/api/entries?overwrite=true' : '/komomood/api/entries';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    entry_date: date,
                    koko_mood: Number(kokoMood),
                    momo_mood: Number(momoMood),
                    komo_score: Number(komoScore),
                    note: note || '',
                    overwrite: overwrite === true
                })
            });

            const contentType = response.headers.get('content-type') || '';
            const isJson = contentType.includes('application/json');
            const payload = isJson ? await response.json() : await response.text();

            if (response.status === 201 || response.status === 200) {
                console.log('后端保存成功:', payload);
                return { success: true, data: payload };
            }

            const errorMessage = (isJson && payload && payload.error) ? payload.error : (response.statusText || '提交失败');
            console.warn('后端保存失败:', response.status, errorMessage);
            return { success: false, error: errorMessage, status: response.status };
        } catch (error) {
            console.error('submitToBackend error:', error);
            return { success: false, error: error.message };
        }
    }

    async submitToGAS({ date, kokoMood, momoMood, komoScore, note, passphrase }) {
        const { webAppUrl } = this.gasConfig;
        
        if (!webAppUrl) {
            return { success: false, error: 'GAS Web App URL not configured' };
        }

        try {
            const params = new URLSearchParams({
                date,
                kokoMood: String(kokoMood),
                momoMood: String(momoMood), 
                komoScore: String(komoScore),
                note,
                passphrase
            });

            const response = await fetch(webAppUrl, {
                method: 'POST',
                mode: 'cors', // 明确指定CORS模式
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            return {
                success: result.ok === true,
                error: result.error || null
            };
        } catch (error) {
            console.error('submitToGAS error:', error);
            return { success: false, error: error.message };
        }
    }

    fallbackToGoogleForm({ date, kokoMood, momoMood, komoScore, note, passphrase }) {
        console.log('Falling back to Google Form...');
        
        const { prefillBaseUrl, fieldMap } = this.googleFormConfig;
        
        if (!prefillBaseUrl || !fieldMap) {
            this.showCheckinError('❌ GAS 提交失败，且 Google Form 备用方案未配置');
            return;
        }

        // Build prefilled URL
        const params = new URLSearchParams();
        params.set(fieldMap.date, date);
        params.set(fieldMap.kokoMood, String(kokoMood));
        params.set(fieldMap.momoMood, String(momoMood));
        params.set(fieldMap.komoScore, String(komoScore));
        if (note) params.set(fieldMap.note, note);
        
        // Add passphrase if configured
        const pp = this.googleFormConfig.optional?.passphrase;
        if (pp?.param) {
            params.set(pp.param, passphrase);
        }

        // Common param often present in prefill URLs
        if (!prefillBaseUrl.includes('usp=')) params.set('usp', 'pp_url');

        const finalUrl = prefillBaseUrl.includes('?')
            ? `${prefillBaseUrl}&${params.toString()}`
            : `${prefillBaseUrl}?${params.toString()}`;

        this.showCheckinWarning('⚠️ 正在使用备用方案，即将跳转到 Google Form...');
        
        setTimeout(() => {
            window.open(finalUrl, '_blank');
            this.closeCheckinModal();
        }, 1500);
    }

    showCheckinError(message) {
        const errorDiv = this.checkinError;
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            errorDiv.classList.remove('bg-green-100', 'text-green-800');
            errorDiv.classList.add('bg-red-100', 'text-red-800');
        }
    }

    hideCheckinError() {
        const errorDiv = this.checkinError;
        if (errorDiv) {
            errorDiv.classList.add('hidden');
            errorDiv.classList.remove('bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');
        }
    }

    showCheckinSuccess(message) {
        const successDiv = document.getElementById('checkinSuccess');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
            successDiv.classList.add('bg-green-100', 'text-green-800');
            successDiv.classList.remove('bg-yellow-100', 'text-yellow-800');
        }
    }

    hideCheckinSuccess() {
        const successDiv = document.getElementById('checkinSuccess');
        if (successDiv) {
            successDiv.classList.add('hidden');
            successDiv.classList.remove('bg-green-100', 'text-green-800', 'bg-yellow-100', 'text-yellow-800');
        }
    }

    showCheckinWarning(message) {
        const successDiv = document.getElementById('checkinSuccess');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
            successDiv.classList.remove('bg-green-100', 'text-green-800');
            successDiv.classList.add('bg-yellow-100', 'text-yellow-800');
        }
    }

    showError(message) {
        this.loading.innerHTML = `
            <div class="bg-white rounded-lg p-6 text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                <p class="text-gray-600">${message}</p>
                <button onclick="location.reload()" class="mt-4 bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600">
                    重试
                </button>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KomomoodApp();
});

// Export for potential testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KomomoodApp;
}
