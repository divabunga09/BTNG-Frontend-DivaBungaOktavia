'use strict';

// API resmi dari panitia
const API_URL = 'https://api-web.dnccudinus.org/api/mobil';

// Mengambil elemen HTML
const carGrid = document.getElementById('carGrid');
const apiNotice = document.getElementById('apiNotice');
const noticeText = document.getElementById('noticeText');
const collectionStatus = document.getElementById('collectionStatus');
const heroCarCount = document.getElementById('heroCarCount');
const emptyState = document.getElementById('emptyState');
const loadError = document.getElementById('loadError');
const errorMessage = document.getElementById('errorMessage');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-button');
const retryButton = document.getElementById('retryButton');
const resetFilters = document.getElementById('resetFilters');
const carDialog = document.getElementById('carDialog');
const dialogContent = document.getElementById('dialogContent');

let allCars = [];
let activeFilter = 'all';

// Mengambil nilai dari beberapa kemungkinan nama properti API
function getValue(object, keys) {
    if (!object || typeof object !== 'object') {
        return '';
    }

    for (const key of keys) {
        const value = object[key];

        if (
            value !== undefined &&
            value !== null &&
            typeof value !== 'object' &&
            String(value).trim() !== ''
        ) {
            return String(value).trim();
        }
    }

    return '';
}

// Mencari daftar mobil dalam respons API
function findCarArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (!data || typeof data !== 'object') {
        return [];
    }

    const possibleKeys = [
        'data',
        'mobil',
        'mobils',
        'cars',
        'vehicles',
        'kendaraan',
        'result',
        'results',
        'items'
    ];

    for (const key of possibleKeys) {
        if (Array.isArray(data[key])) {
            return data[key];
        }

        if (data[key] && typeof data[key] === 'object') {
            const result = findCarArray(data[key]);

            if (result.length > 0) {
                return result;
            }
        }
    }

    for (const value of Object.values(data)) {
        if (
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === 'object'
        ) {
            return value;
        }
    }

    return [];
}

// Mengambil informasi mobil
function getBrand(car) {
    return getValue(car, [
        'merek',
        'merk',
        'brand',
        'manufacturer',
        'nama_merek',
        'namaMerek'
    ]) || 'Mobil';
}

function getCarName(car) {
    return getValue(car, [
        'nama_mobil',
        'namaMobil',
        'nama',
        'name',
        'model',
        'tipe',
        'title'
    ]) || getBrand(car);
}

function getYear(car) {
    return getValue(car, [
        'tahun',
        'year',
        'tahun_produksi',
        'tahunProduksi',
        'production_year'
    ]);
}

function getCategory(car) {
    return getValue(car, [
        'kategori',
        'category',
        'jenis',
        'tipe_mobil',
        'tipeMobil',
        'body_type',
        'bodyType',
        'type'
    ]).toLowerCase();
}

function getCategoryLabel(car) {
    const category = getCategory(car);

    if (category.includes('suv')) {
        return 'SUV';
    }

    if (category.includes('sedan')) {
        return 'Sedan';
    }

    if (category.includes('sport')) {
        return 'Sport';
    }

    if (category.includes('mpv')) {
        return 'MPV';
    }

    if (category.includes('pickup')) {
        return 'Pickup';
    }

    if (category.includes('hatch')) {
        return 'Hatchback';
    }

    if (category) {
        return category
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, letter => letter.toUpperCase());
    }

    return 'Kendaraan';
}

function getPrice(car) {
    return getValue(car, [
        'harga',
        'price',
        'harga_jual',
        'hargaJual',
        'price_idr',
        'nominal'
    ]);
}

function getImage(car) {
    return getValue(car, [
        'gambar',
        'image',
        'foto',
        'foto_mobil',
        'fotoMobil',
        'image_url',
        'imageUrl',
        'url_gambar',
        'urlGambar',
        'thumbnail',
        'photo'
    ]);
}

function getTransmission(car) {
    return getValue(car, [
        'transmisi',
        'transmission',
        'gearbox'
    ]);
}

function getFuel(car) {
    return getValue(car, [
        'bahan_bakar',
        'bahanBakar',
        'fuel',
        'fuel_type',
        'fuelType'
    ]);
}

function getMileage(car) {
    return getValue(car, [
        'kilometer',
        'mileage',
        'km',
        'jarak_tempuh',
        'jarakTempuh'
    ]);
}

// Mengubah teks agar aman saat ditampilkan sebagai HTML
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => {
        const replacements = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return replacements[character];
    });
}

// Menampilkan harga dalam format rupiah
function formatPrice(price) {
    if (!price) {
        return 'Hubungi showroom';
    }

    const digits = String(price).replace(/[^\d]/g, '');

    if (!digits) {
        return price;
    }

    const number = Number(digits);

    if (!Number.isFinite(number) || number === 0) {
        return 'Hubungi showroom';
    }

    return 'Rp ' + number.toLocaleString('id-ID');
}

// Gambar pengganti jika API tidak menyediakan gambar mobil
function placeholderImage() {
    return `
        <div class="car-placeholder">
            <svg viewBox="0 0 300 130" aria-hidden="true">
                <path
                    d="M24 86 L42 59 Q48 51 69 49
                    L106 25 Q114 20 132 20
                    L188 23 Q202 24 215 42
                    L245 57 Q260 61 269 75
                    L276 91 L267 101 L26 101 Z"
                    fill="#b88d3c"
                    stroke="#f0d28b"
                    stroke-width="2"
                />
                <path
                    d="M78 48 L112 29 Q118 26 133 26
                    L148 27 L151 49 Z"
                    fill="#26303a"
                />
                <path
                    d="M159 27 L187 29 Q196 31 205 44
                    L211 49 L159 49 Z"
                    fill="#26303a"
                />
                <g fill="#0b0d10" stroke="#777" stroke-width="4">
                    <circle cx="78" cy="99" r="19"/>
                    <circle cx="226" cy="99" r="19"/>
                </g>
                <g fill="#aaa">
                    <circle cx="78" cy="99" r="8"/>
                    <circle cx="226" cy="99" r="8"/>
                </g>
            </svg>
        </div>
    `;
}

// Mengatur pesan status API
function setNotice(type, message) {
    apiNotice.className = 'api-notice';

    if (type) {
        apiNotice.classList.add(type);
    }

    noticeText.textContent = message;

    const spinner = apiNotice.querySelector('.spinner');

    if (spinner) {
        spinner.hidden = type !== 'loading';
    }
}

// Memeriksa apakah mobil sesuai pencarian dan kategori
function matchesFilter(car) {
    const query = searchInput.value.trim().toLowerCase();
    const name = getCarName(car).toLowerCase();
    const category = getCategory(car).toLowerCase();
    const brand = getBrand(car).toLowerCase();

    let categoryMatches = activeFilter === 'all';

    if (activeFilter === 'suv') {
        categoryMatches =
            category.includes('suv') ||
            name.includes('fortuner') ||
            name.includes('cr-v') ||
            name.includes('rocky') ||
            name.includes('jimny') ||
            name.includes('pajero') ||
            name.includes('zenix');
    } else if (activeFilter === 'sedan') {
        categoryMatches =
            category.includes('sedan') ||
            name.includes('byd seal') ||
            name.includes('civic') ||
            name.includes('mazda 3');
    } else if (activeFilter === 'sport') {
        categoryMatches =
            category.includes('sport') ||
            name.includes('sport') ||
            name.includes('civic rs') ||
            name.includes('byd seal');
    }

    const searchableText = [
        brand,
        name,
        getYear(car),
        getCategoryLabel(car),
        getPrice(car),
        getTransmission(car),
        getFuel(car)
    ].join(' ').toLowerCase();

    const searchMatches =
        query === '' || searchableText.includes(query);

    return categoryMatches && searchMatches;
}
// Membuat kartu mobil
function createCarCard(car, index) {
    const brand = getBrand(car);
    const name = getCarName(car);
    const image = getImage(car);

    const specifications = [
        getYear(car),
        getTransmission(car),
        getFuel(car)
    ].filter(Boolean);

    let imageHTML;

    if (image) {
        imageHTML = `
            <img
                class="car-image"
                src="${escapeHTML(image)}"
                alt="${escapeHTML(brand + ' ' + name)}"
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.hidden=false"
            >
            <div hidden>
                ${placeholderImage()}
            </div>
        `;
    } else {
        imageHTML = placeholderImage();
    }

    return `
        <article class="car-card">
            <div class="car-image-wrap">
                ${imageHTML}

                <span class="car-category">
                    ${escapeHTML(getCategoryLabel(car))}
                </span>
            </div>

            <div class="car-info">
                <p class="car-brand">
                    ${escapeHTML(brand)}
                </p>

                <h3 class="car-name">
                    ${escapeHTML(name)}
                </h3>

                <div class="car-specs">
                    ${
                        specifications.length > 0
                            ? specifications.map(specification => `
                                <span>${escapeHTML(specification)}</span>
                            `).join('')
                            : '<span>Informasi kendaraan</span>'
                    }
                </div>

                <div class="card-bottom">
                    <div>
                        <span class="price-label">Harga</span>
                        <div class="car-price">
                            ${escapeHTML(formatPrice(getPrice(car)))}
                        </div>
                    </div>

                    <button
                        class="detail-button"
                        type="button"
                        data-car-index="${index}"
                    >
                        Detail ↗️
                    </button>
                </div>
            </div>
        </article>
    `;
}

// Menampilkan mobil berdasarkan hasil filter
function renderCars() {
    const filteredCars = allCars
        .map((car, index) => ({ car, index }))
        .filter(item => matchesFilter(item.car));

    carGrid.innerHTML = filteredCars
        .map(item => createCarCard(item.car, item.index))
        .join('');

    carGrid.hidden = filteredCars.length === 0;
    emptyState.hidden = filteredCars.length !== 0;
    loadError.hidden = true;

    heroCarCount.textContent = String(allCars.length);

    collectionStatus.textContent =
       ` ${filteredCars.length} dari ${allCars.length} mobil ditampilkan`;
}

// Mengambil data dari API
async function loadCars() {
    setNotice(
        'loading',
        'Memuat data kendaraan dari API resmi panitia...'
    );

    collectionStatus.textContent = 'Menghubungkan ke API resmi...';

    loadError.hidden = true;
    emptyState.hidden = true;
    carGrid.hidden = true;

    retryButton.disabled = true;
    retryButton.textContent = 'Memuat...';

    const controller = new AbortController();

    // Menghindari halaman terus menunggu jika API tidak merespons
    const timeout = setTimeout(() => {
        controller.abort();
    }, 15000);

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(
                `Server mengirim status ${response.status}.`
            );
        }

        const result = await response.json();
        const cars = findCarArray(result);

        if (cars.length === 0) {
            throw new Error(
                'Respons API diterima, tetapi daftar mobil tidak ditemukan. Format data perlu dicocokkan dengan respons API panitia.'
            );
        }

        allCars = cars;

        setNotice(
            'success',
            `Berhasil memuat ${allCars.length} data mobil dari API resmi.`
        );

        renderCars();

    } catch (error) {
        allCars = [];

        heroCarCount.textContent = '—';
        carGrid.innerHTML = '';
        carGrid.hidden = true;
        emptyState.hidden = true;
        loadError.hidden = false;

        setNotice(
            'error',
            `Data API belum berhasil dimuat.`
        );

        if (error.name === 'AbortError') {
            errorMessage.textContent =
                'Permintaan API melebihi 15 detik. Periksa koneksi internet atau coba lagi.';
        } else if (error instanceof TypeError) {
            errorMessage.textContent =
                'Koneksi ke API gagal. Pastikan internet aktif dan halaman dibuka melalui Live Server. Jika masih gagal, server API mungkin membatasi akses dari browser.';
        } else {
            errorMessage.textContent =
                error.message ||
                'Terjadi kesalahan saat membaca data API.';
        }

        collectionStatus.textContent = 'API belum terhubung';

    } finally {
        clearTimeout(timeout);

        retryButton.disabled = false;
        retryButton.textContent = 'Coba Lagi ↻';
    }
}

// FILTER KATEGORI
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        activeFilter = button.dataset.filter || 'all';

        filterButtons.forEach(item => {
            const isActive = item === button;

            item.classList.toggle('active', isActive);
            item.setAttribute(
                'aria-pressed',
                String(isActive)
            );
        });

        if (allCars.length > 0) {
            renderCars();
        }
    });
});

// PENCARIAN MOBIL
searchInput.addEventListener('input', () => {
    if (allCars.length > 0) {
        renderCars();
    }
});

// RESET PENCARIAN
resetFilters.addEventListener('click', () => {
    searchInput.value = '';
    activeFilter = 'all';

    filterButtons.forEach(button => {
        const isActive = button.dataset.filter === 'all';

        button.classList.toggle('active', isActive);
        button.setAttribute(
            'aria-pressed',
            String(isActive)
        );
    });

    if (allCars.length > 0) {
        renderCars();
    }
});

// MENCOBA MEMUAT API KEMBALI
retryButton.addEventListener('click', loadCars);

// MEMBUKA DETAIL MOBIL
carGrid.addEventListener('click', event => {
    const button = event.target.closest('[data-car-index]');

    if (!button) {
        return;
    }

    const index = Number(button.dataset.carIndex);
    const car = allCars[index];

    if (car) {
        showCarDetails(car);
    }
});

function getCategory(car) {
    const category = getValue(car, [
        'kategori',
        'category',
        'jenis',
        'tipe_mobil',
        'tipeMobil',
        'body_type',
        'bodyType',
        'type'
    ]).toLowerCase();

    if (category) {
        return category;
    }

    const name = getCarName(car).toLowerCase();

    if (
        name.includes('fortuner') ||
        name.includes('cr-v') ||
        name.includes('rocky') ||
        name.includes('jimny') ||
        name.includes('pajero') ||
        name.includes('zenix')
    ) {
        return 'suv';
    }

    if (
        name.includes('civic') ||
        name.includes('mazda 3') ||
        name.includes('byd seal')
    ) {
        return 'sedan';
    }

    if (
        name.includes('sport') ||
        name.includes('gr sport') ||
        name.includes('civic rs') ||
        name.includes('byd seal')
    ) {
        return 'sport';
    }

    return 'lainnya';
}

function showCarDetails(car) {
    const brand = getBrand(car);
    const name = getCarName(car);
    const image = getImage(car);

    const details = [
        ['Tahun', getYear(car)],
        ['Transmisi', getTransmission(car)],
        ['Bahan bakar', getFuel(car)],
        ['Status', getValue(car, ['status'])],
        ['ID mobil', getValue(car, ['id'])]
    ].filter(item => item[1]);

    dialogContent.innerHTML = `
        ${image ? `
            <img
                class="dialog-image"
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
            >
        ` : ''}

        <p class="dialog-brand">${escapeHTML(brand)}</p>
        <h2>${escapeHTML(name)}</h2>

        <div class="dialog-price">
            ${escapeHTML(formatPrice(getPrice(car)))}
        </div>

        <div class="dialog-details">
            ${details.map(item => `
                <div class="dialog-detail">
                    <span>${escapeHTML(item[0])}</span>
                    <strong>${escapeHTML(item[1])}</strong>
                </div>
            `).join('')}
        </div>
    `;

    carDialog.showModal();
}

// MENUTUP DETAIL MOBIL
function closeDialog() {
    if (typeof carDialog.close === 'function') {
        carDialog.close();
    } else {
        carDialog.removeAttribute('open');
    }

    document.body.classList.remove('dialog-open');
}

document.getElementById('dialogClose').addEventListener(
    'click',
    closeDialog
);

carDialog.addEventListener('click', event => {
    if (event.target === carDialog) {
        closeDialog();
    }
});

carDialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
});

// MENU RESPONSIF DI HP
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

menuToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');

    menuToggle.setAttribute(
        'aria-expanded',
        String(isOpen)
    );
});

navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('open');

        menuToggle.setAttribute(
            'aria-expanded',
            'false'
        );
    });
});

// MEMBUKA PENCARIAN DENGAN CTRL + K
document.addEventListener('keydown', event => {
    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k'
    ) {
        event.preventDefault();

        searchInput.focus();

        document.getElementById('koleksi').scrollIntoView({
            behavior: 'smooth'
        });
    }

    if (event.key === 'Escape' && carDialog.open) {
        closeDialog();
    }
});

// MEMPERBARUI NAVIGASI SESUAI BAGIAN YANG DIBUKA
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.classList.toggle(
                            'active',
                            link.getAttribute('href') ===
                                '#' + entry.target.id
                        );
                    });
                }
            });
        },
        {
            rootMargin: '-30% 0px -60% 0px'
        }
    );

    document.querySelectorAll('main section[id]').forEach(section => {
        observer.observe(section);
    });
}

// MENJALANKAN PEMUATAN API SAAT HALAMAN DIBUKA
loadCars();