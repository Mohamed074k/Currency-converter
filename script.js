// By Mohamed Elsayed :[www.linkedin.com/in/mohamed-elsayed-2623602a1]

// API Configuration
const BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const converterForm = document.getElementById('converter-form');
const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const swapButton = document.getElementById('swap-currencies');
const resultAmount = document.querySelector('.result .amount');
const resultCurrency = document.querySelector('.result .currency-code');
const rateInfo = document.getElementById('rate-info');
const popularRates = document.getElementById('popular-rates');
const historicalChart = document.getElementById('historical-chart');
const timeRangeButtons = document.querySelectorAll('.time-range-btn');
const topGainers = document.getElementById('top-gainers');
const topLosers = document.getElementById('top-losers');
const loadingSpinner = document.getElementById('loading-spinner');
const themeDropdown = document.querySelector('.theme-dropdown');

// State
let currencies = [];
let currentChart = null;
let lastUsedCurrencies = JSON.parse(localStorage.getItem('lastUsedCurrencies')) || ['USD', 'EUR'];

// Currency data with names and flags
const currencyData = {
    USD: { name: 'US Dollar', flag: 'us' },
    EUR: { name: 'Euro', flag: 'eu' },
    GBP: { name: 'British Pound', flag: 'gb' },
    JPY: { name: 'Japanese Yen', flag: 'jp' },
    AUD: { name: 'Australian Dollar', flag: 'au' },
    CAD: { name: 'Canadian Dollar', flag: 'ca' },
    CHF: { name: 'Swiss Franc', flag: 'ch' },
    CNY: { name: 'Chinese Yuan', flag: 'cn' },
    INR: { name: 'Indian Rupee', flag: 'in' },
    SGD: { name: 'Singapore Dollar', flag: 'sg' },
    NZD: { name: 'New Zealand Dollar', flag: 'nz' },
    MXN: { name: 'Mexican Peso', flag: 'mx' },
    BRL: { name: 'Brazilian Real', flag: 'br' },
    ZAR: { name: 'South African Rand', flag: 'za' },
    RUB: { name: 'Russian Ruble', flag: 'ru' },
    AED: { name: 'UAE Dirham', flag: 'ae' },
    SAR: { name: 'Saudi Riyal', flag: 'sa' },
    TRY: { name: 'Turkish Lira', flag: 'tr' },
    KRW: { name: 'South Korean Won', flag: 'kr' },
    HKD: { name: 'Hong Kong Dollar', flag: 'hk' },
    SEK: { name: 'Swedish Krona', flag: 'se' },
    NOK: { name: 'Norwegian Krone', flag: 'no' },
    DKK: { name: 'Danish Krone', flag: 'dk' },
    PLN: { name: 'Polish Złoty', flag: 'pl' },
    HUF: { name: 'Hungarian Forint', flag: 'hu' },
    CZK: { name: 'Czech Koruna', flag: 'cz' },
    EGP: { name: 'Egyptian Pound', flag: 'eg' }, 
    PHP: { name: 'Philippine Peso', flag: 'ph' },
    THB: { name: 'Thai Baht', flag: 'th' },
    IDR: { name: 'Indonesian Rupiah', flag: 'id' },
    MYR: { name: 'Malaysian Ringgit', flag: 'my' }
};

// Initialize the application
async function init() {
    showLoading();
    try {
        await loadCurrencies();
        populateCurrencyDropdowns();
        await loadPopularRates();
        await loadHistoricalData('7d');
        await loadTrends();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize the application. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Load all available currencies
async function loadCurrencies() {
    try {
        const response = await fetch(`${BASE_URL}/USD`);
        const data = await response.json();
        
        if (data.rates) {
            currencies = Object.keys(data.rates)
                .filter(code => currencyData[code]) // Only include currencies we have data for
                .map(code => ({
                    code,
                    name: currencyData[code].name,
                    flag: currencyData[code].flag
                }));
        } else {
            throw new Error('Failed to load currencies');
        }
    } catch (error) {
        console.error('Error loading currencies:', error);
        showError('Failed to load currencies. Please try again later.');
    }
}

// Populate currency dropdowns
function populateCurrencyDropdowns() {
    const options = currencies.map(currency => `
        <option value="${currency.code}" data-flag="${currency.flag}">
            ${currency.code} - ${currency.name}
        </option>
    `).join('');

    fromCurrency.innerHTML = `<option value="">Select currency</option>${options}`;
    toCurrency.innerHTML = `<option value="">Select currency</option>${options}`;

    // Set last used currencies if available
    if (lastUsedCurrencies.length === 2) {
        fromCurrency.value = lastUsedCurrencies[0];
        toCurrency.value = lastUsedCurrencies[1];
    }

    // Add flag icons to the select elements
    [fromCurrency, toCurrency].forEach(select => {
        updateSelectFlag(select);
        select.addEventListener('change', () => updateSelectFlag(select));
    });
}

function updateSelectFlag(select) {
    const selectedOption = select.options[select.selectedIndex];
    const flag = selectedOption?.dataset.flag;
    
    if (flag) {
        select.style.backgroundImage = `url(https://flagcdn.com/24x18/${flag}.png)`;
        select.style.backgroundRepeat = 'no-repeat';
        select.style.backgroundPosition = 'left center';
        select.style.backgroundSize = '24px 18px';
        select.style.paddingLeft = '30px';
    } else {
        select.style.backgroundImage = 'none';
        select.style.paddingLeft = '10px';
    }
}

// Load popular exchange rates
async function loadPopularRates() {
    const popularPairs = [
        ['USD', 'EUR'],
        ['USD', 'GBP'],
        ['USD', 'JPY'],
        ['EUR', 'GBP'],
        ['EUR', 'JPY'],
        ['GBP', 'JPY'],
        ['USD', 'CAD'],
        ['USD', 'AUD'],
        ['USD', 'CHF'],
        ['EUR', 'CHF']
    ];

    try {
        const response = await fetch(`${BASE_URL}/USD`);
        const data = await response.json();
        
        if (data.rates) {
            const rates = data.rates;
            const rateCards = popularPairs.map(([from, to]) => {
                const rate = (rates[to] / rates[from]).toFixed(4);
                return `
                    <div class="rate-card">
                        <span class="flag">
                            <img src="https://flagcdn.com/24x18/${currencyData[from].flag}.png" alt="${from} flag">
                        </span>
                        <div class="rate-info">
                            <div class="pair">${from}/${to}</div>
                            <div class="rate">${rate}</div>
                        </div>
                    </div>
                `;
            }).join('');

            popularRates.innerHTML = rateCards;
        }
    } catch (error) {
        console.error('Error loading popular rates:', error);
    }
}

// Convert currency
async function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (!amount || !from || !to) return;

    try {
        showLoading();
        const response = await fetch(`${BASE_URL}/${from}`);
        const data = await response.json();

        if (data.rates) {
            const rate = data.rates[to];
            const result = (amount * rate).toFixed(2);
            
            resultAmount.textContent = result;
            resultCurrency.textContent = to;
            rateInfo.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
            
            // Save last used currencies
            lastUsedCurrencies = [from, to];
            localStorage.setItem('lastUsedCurrencies', JSON.stringify(lastUsedCurrencies));
        } else {
            throw new Error('Conversion failed');
        }
    } catch (error) {
        console.error('Error converting currency:', error);
        showError('Failed to convert currency. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Load historical data
async function loadHistoricalData(range) {
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (!from || !to) return;

    try {
        showLoading();
        const endDate = new Date();
        const startDate = new Date();
        
        // Set start date based on range
        switch (range) {
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '1m':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case '3m':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
        }

        const dates = [];
        const rates = [];
        let currentDate = new Date(startDate);

        // Fetch data for each day
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            try {
                const response = await fetch(`${BASE_URL}/${from}?date=${dateStr}`);
                if (!response.ok) continue;
                
                const data = await response.json();
                if (data.rates && data.rates[to]) {
                    dates.push(dateStr);
                    rates.push(data.rates[to]);
                }
            } catch (error) {
                console.error(`Error fetching data for ${dateStr}:`, error);
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (dates.length === 0) {
            throw new Error('No historical data available');
        }

        // Destroy existing chart if it exists
        if (currentChart) {
            currentChart.destroy();
        }

        // Create new chart
        const ctx = historicalChart.getContext('2d');
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: `${from}/${to} Exchange Rate`,
                    data: rates,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${from}/${to}: ${context.parsed.y.toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    } catch (error) {
        console.error('Error loading historical data:', error);
        showError('Failed to load historical data. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Load currency trends
async function loadTrends() {
    try {
        const response = await fetch(`${BASE_URL}/USD`);
        const data = await response.json();
        
        if (data.rates) {
            const rates = data.rates;
            const changes = Object.entries(rates)
                .filter(([code]) => currencyData[code]) // Only include currencies we have data for
                .map(([code, rate]) => {
                    // In a real app, you'd compare with previous day's rates
                    // For demo purposes, we'll generate random changes
                    const change = (Math.random() * 2 - 1).toFixed(2);
                    return { code, change: parseFloat(change) };
                });

            const sortedChanges = changes.sort((a, b) => b.change - a.change);
            const gainers = sortedChanges.slice(0, 5);
            const losers = sortedChanges.slice(-5).reverse();

            topGainers.innerHTML = gainers.map(({ code, change }) => `
                <div class="trend-item">
                    <div class="trend-currency">
                        <img src="https://flagcdn.com/24x18/${currencyData[code].flag}.png" alt="${code} flag" class="flag-icon">
                        <span>${code}</span>
                    </div>
                    <span class="positive">+${change.toFixed(2)}%</span>
                </div>
            `).join('');

            topLosers.innerHTML = losers.map(({ code, change }) => `
                <div class="trend-item">
                    <div class="trend-currency">
                        <img src="https://flagcdn.com/24x18/${currencyData[code].flag}.png" alt="${code} flag" class="flag-icon">
                        <span>${code}</span>
                    </div>
                    <span class="negative">${change.toFixed(2)}%</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading trends:', error);
    }
}

// Utility functions
function showLoading() {
    loadingSpinner.style.display = 'flex';
    document.body.style.pointerEvents = 'none';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
    document.body.style.pointerEvents = 'auto';
}

function showError(message) {
    alert(message);
}

// Theme handling
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        themeDropdown.classList.toggle('active');
    });

    document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            setTheme(theme);
            themeDropdown.classList.remove('active');
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!themeToggle.contains(e.target) && !themeDropdown.contains(e.target)) {
            themeDropdown.classList.remove('active');
        }
    });
}

function setTheme(theme) {
    const body = document.body;
    const themeIcon = themeToggle.querySelector('i');

    // Remove all theme classes
    body.classList.remove('light-mode', 'dark-mode');

    if (theme === 'system') {
        // Use system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.add('dark-mode');
            themeIcon.className = 'fas fa-desktop';
        } else {
            body.classList.add('light-mode');
            themeIcon.className = 'fas fa-desktop';
        }
    } else {
        // Use selected theme
        body.classList.add(`${theme}-mode`);
        themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // Save theme preference
    localStorage.setItem('theme', theme);
}

// Event listeners
function setupEventListeners() {
    converterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        convertCurrency();
    });

    swapButton.addEventListener('click', () => {
        const temp = fromCurrency.value;
        fromCurrency.value = toCurrency.value;
        toCurrency.value = temp;
        updateSelectFlag(fromCurrency);
        updateSelectFlag(toCurrency);
        convertCurrency();
    });

    timeRangeButtons.forEach(button => {
        button.addEventListener('click', () => {
            timeRangeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadHistoricalData(button.dataset.range);
        });
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupTheme();
});

// Preloader functionality
window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    
    // Add a small delay to ensure everything is loaded
    setTimeout(() => {
        preloader.classList.add('loaded');
        
        // Remove preloader from DOM after animation completes
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }, 1500); // Adjust this time if needed
});

// Show preloader when page is unloading (for page transitions)
window.addEventListener('beforeunload', function() {
    document.getElementById('preloader').classList.remove('loaded');
    document.getElementById('preloader').style.display = 'flex';
});

// Dynamic Footer
function updateFooter() {
    // Update current year
    document.getElementById('current-year').textContent = new Date().getFullYear();
 }

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', updateFooter);