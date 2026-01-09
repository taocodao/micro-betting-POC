// ===== State =====
let token = localStorage.getItem('token');
let user = null;
let currentEventId = null;
let currentMarketId = null;
let currentOdds = null;
let pollInterval = null;

// ===== API Helper =====
async function api(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Auth =====
async function login(email, password) {
    try {
        const data = await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        token = data.data.token;
        user = data.data.user;
        localStorage.setItem('token', token);

        showDashboard();
        showToast('Logged in successfully!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function register(email, password) {
    try {
        const data = await api('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        token = data.data.token;
        user = data.data.user;
        localStorage.setItem('token', token);

        showDashboard();
        showToast('Account created! You have R$ 1000 to play with.', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function logout() {
    token = null;
    user = null;
    localStorage.removeItem('token');
    showAuthPanel();
}

async function loadProfile() {
    try {
        const data = await api('/auth/profile');
        user = data.data;
        updateUserInfo();
    } catch (error) {
        logout();
    }
}

function updateUserInfo() {
    if (user) {
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-balance').textContent = `R$ ${user.balance.toFixed(2)}`;
        document.getElementById('user-info').classList.remove('hidden');
    }
}

// ===== UI Navigation =====
function showAuthPanel() {
    document.getElementById('auth-panel').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('user-info').classList.add('hidden');
    if (pollInterval) clearInterval(pollInterval);
}

function showDashboard() {
    document.getElementById('auth-panel').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadProfile();
    loadEvents();
    loadBets();
}

// ===== Events =====
async function loadEvents() {
    try {
        const data = await api('/events');
        renderEvents(data.data);
    } catch (error) {
        console.error('Failed to load events:', error);
    }
}

function renderEvents(events) {
    const list = document.getElementById('events-list');

    if (!events.length) {
        list.innerHTML = '<p class="empty">No events. Create a test event to start!</p>';
        return;
    }

    list.innerHTML = events.map(event => `
    <div class="event-card ${event.id === currentEventId ? 'active' : ''}" 
         onclick="selectEvent('${event.id}')">
      <div class="event-name">${event.name}</div>
      <div class="event-status ${event.status}">${event.status.toUpperCase()}</div>
    </div>
  `).join('');
}

async function createTestEvent() {
    try {
        const data = await api('/admin/create-test-event', {
            method: 'POST',
            body: JSON.stringify({ name: `Match ${Date.now()}` }),
        });

        showToast(`Event created with ${data.data.markets.length} markets!`, 'success');
        loadEvents();
        selectEvent(data.data.event.id);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function selectEvent(eventId) {
    currentEventId = eventId;
    currentMarketId = null;

    // Highlight selected event
    document.querySelectorAll('.event-card').forEach(el => {
        el.classList.toggle('active', el.onclick.toString().includes(eventId));
    });

    // Load stream
    try {
        const streamData = await api(`/events/${eventId}/stream`);
        const video = document.getElementById('video-player');
        video.src = streamData.data.videoUrl;
        document.getElementById('video-container').classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load stream:', error);
    }

    // Load markets
    loadMarkets(eventId);

    // Start polling for updates
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => {
        loadMarkets(eventId);
        loadMetrics(eventId);
    }, 2000);

    // Load metrics
    loadMetrics(eventId);
}

// ===== Markets =====
async function loadMarkets(eventId) {
    try {
        const data = await api(`/markets/event/${eventId}`);
        renderMarkets(data.data);
    } catch (error) {
        console.error('Failed to load markets:', error);
    }
}

function renderMarkets(markets) {
    const list = document.getElementById('markets-list');

    if (!markets.length) {
        list.innerHTML = '<p class="empty">No markets available</p>';
        return;
    }

    list.innerHTML = markets.map(market => `
    <div class="market-card ${market.id === currentMarketId ? 'selected' : ''}" 
         onclick="selectMarket('${market.id}', '${market.market_type}', ${market.current_odds})">
      <div>
        <div class="market-type">${market.market_type.replace('_', ' ')}</div>
        <div class="market-status">${market.status}</div>
      </div>
      <div class="market-odds">${market.current_odds.toFixed(2)}</div>
    </div>
  `).join('');
}

function selectMarket(marketId, marketType, odds) {
    currentMarketId = marketId;
    currentOdds = odds;

    document.querySelectorAll('.market-card').forEach(el => {
        el.classList.toggle('selected', el.onclick.toString().includes(marketId));
    });

    document.getElementById('selected-market-type').textContent = marketType.replace('_', ' ');
    document.getElementById('selected-odds').textContent = odds.toFixed(2);
    document.getElementById('betting-form-container').classList.remove('hidden');

    updatePotentialReturn();
}

function updatePotentialReturn() {
    const amount = parseFloat(document.getElementById('bet-amount').value) || 0;
    const potential = amount * (currentOdds || 1);
    document.getElementById('potential-return').textContent = `R$ ${potential.toFixed(2)}`;
}

// ===== Betting =====
async function placeBet() {
    if (!currentMarketId || !currentOdds) {
        showToast('Please select a market first', 'error');
        return;
    }

    const amount = parseFloat(document.getElementById('bet-amount').value);

    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
    }

    try {
        const clientPlacedAt = new Date().toISOString();

        const data = await api('/bets/place', {
            method: 'POST',
            body: JSON.stringify({
                marketId: currentMarketId,
                amount,
                odds: currentOdds,
                clientPlacedAt,
            }),
        });

        const result = data.data;

        if (result.status === 'accepted') {
            showToast(`Bet accepted! Latency: ${result.latency_ms}ms`, 'success');

            // Simulate settlement confirmation after a delay
            setTimeout(() => simulateSettlement(result.trace_id), 3000);
        } else {
            showToast(`Bet rejected: ${data.message}`, 'error');
        }

        loadBets();
        loadProfile();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function simulateSettlement(traceId) {
    try {
        await api(`/admin/simulate-settlement/${traceId}`, { method: 'POST' });
        showToast('Payment confirmed! Access upgraded to FULL.', 'success');
        loadBets();
    } catch (error) {
        console.error('Settlement simulation failed:', error);
    }
}

// ===== Bets List =====
async function loadBets() {
    try {
        const data = await api('/bets');
        renderBets(data.data);
    } catch (error) {
        console.error('Failed to load bets:', error);
    }
}

function renderBets(bets) {
    const list = document.getElementById('bets-list');

    if (!bets.length) {
        list.innerHTML = '<p class="empty">No bets yet</p>';
        return;
    }

    list.innerHTML = bets.map(bet => `
    <div class="bet-card">
      <div class="bet-card-header">
        <span class="bet-amount">R$ ${bet.amount.toFixed(2)} @ ${bet.odds.toFixed(2)}</span>
        <span class="bet-status ${bet.status}">${bet.status.toUpperCase()}</span>
      </div>
      <div class="bet-latency">Latency: ${bet.latency_ms || 0}ms</div>
      ${bet.status === 'rejected' ? `
        <div class="bet-actions">
          <button class="btn btn-sm btn-outline" onclick="openDisputeModal('${bet.bet_id}', ${bet.amount}, ${bet.odds})">
            Dispute
          </button>
        </div>
      ` : ''}
      ${bet.trace_id ? `<div class="bet-latency">Trace: ${bet.trace_id.slice(0, 20)}...</div>` : ''}
    </div>
  `).join('');
}

// ===== Disputes =====
let currentDisputeBetId = null;

function openDisputeModal(betId, amount, odds) {
    currentDisputeBetId = betId;
    document.getElementById('dispute-bet-info').textContent =
        `Bet: R$ ${amount.toFixed(2)} @ ${odds.toFixed(2)}`;
    document.getElementById('dispute-result').classList.add('hidden');
    document.getElementById('dispute-reason').value = '';
    document.getElementById('dispute-modal').classList.remove('hidden');
}

function closeDisputeModal() {
    document.getElementById('dispute-modal').classList.add('hidden');
    currentDisputeBetId = null;
}

async function submitDispute() {
    if (!currentDisputeBetId) return;

    const reason = document.getElementById('dispute-reason').value || 'No reason provided';

    try {
        const data = await api('/disputes/create', {
            method: 'POST',
            body: JSON.stringify({
                betId: currentDisputeBetId,
                reason,
            }),
        });

        const result = data.data;

        document.getElementById('dispute-verdict').textContent = result.verdict;
        document.getElementById('dispute-verdict').className = result.verdict;
        document.getElementById('dispute-details').textContent = result.details;
        document.getElementById('dispute-attestation').textContent =
            `Attestation: ${result.attestation?.slice(0, 32)}...`;
        document.getElementById('dispute-result').classList.remove('hidden');

        showToast(`Dispute resolved: ${result.verdict}`, result.verdict === 'INCORRECT' ? 'success' : 'info');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ===== Metrics =====
async function loadMetrics(eventId) {
    if (!eventId) return;

    try {
        const data = await api(`/metrics/event/${eventId}`);
        const m = data.data;

        document.getElementById('metric-total-bets').textContent = m.total_bets;
        document.getElementById('metric-acceptance-rate').textContent =
            `${(m.acceptance_rate * 100).toFixed(0)}%`;
        document.getElementById('metric-avg-latency').textContent = `${m.avg_latency_ms}ms`;
        document.getElementById('metric-handle').textContent = `R$ ${m.total_handle.toFixed(2)}`;
        document.getElementById('metric-disputes').textContent = m.total_disputes;
    } catch (error) {
        console.error('Failed to load metrics:', error);
    }
}

// ===== Panel Tabs =====
function switchPanelTab(tabName) {
    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.panel === tabName);
    });

    document.querySelectorAll('.panel-content').forEach(panel => {
        panel.classList.toggle('hidden', panel.id !== `${tabName}-panel`);
    });
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
    // Auth tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const isLogin = tab.dataset.tab === 'login';
            document.getElementById('login-form').classList.toggle('hidden', !isLogin);
            document.getElementById('register-form').classList.toggle('hidden', isLogin);
        });
    });

    // Login form
    document.getElementById('login-form').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        login(email, password);
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        register(email, password);
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Create event
    document.getElementById('create-event-btn').addEventListener('click', createTestEvent);

    // Bet amount change
    document.getElementById('bet-amount').addEventListener('input', updatePotentialReturn);

    // Place bet
    document.getElementById('place-bet-btn').addEventListener('click', placeBet);

    // Panel tabs
    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.addEventListener('click', () => switchPanelTab(tab.dataset.panel));
    });

    // Dispute modal
    document.getElementById('submit-dispute-btn').addEventListener('click', submitDispute);
    document.getElementById('close-dispute-modal').addEventListener('click', closeDisputeModal);

    // Check if already logged in
    if (token) {
        showDashboard();
    } else {
        showAuthPanel();
    }
});
