// komomood App - Main JavaScript
class KomomoodApp {
    constructor() {
        this.entries = [];
        this.tooltip = document.getElementById('tooltip');
        this.loading = document.getElementById('loading');
        this.heatmapGrid = document.getElementById('heatmapGrid');
        
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
            const response = await fetch('data/entries.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.entries = await response.json();
            console.log(`成功加载 ${this.entries.length} 条心情记录`);
        } catch (error) {
            console.error('加载数据失败:', error);
            // Fallback to empty array for development
            this.entries = [];
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
        
        // Generate 52 weeks * 7 days = 364 days
        for (let week = 0; week < 52; week++) {
            for (let day = 0; day < 7; day++) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
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
            cell.addEventListener('mouseleave', () => this.hideTooltip());
            cell.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
            
            this.heatmapGrid.appendChild(cell);
        });
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
        checkinBtn.addEventListener('click', () => {
            // For now, link to the data file for manual editing
            // Later this will be replaced with Google Forms integration
            window.open('https://github.com/your-username/komomood/edit/main/data/entries.json', '_blank');
        });
    }

    hideLoading() {
        this.loading.style.display = 'none';
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
