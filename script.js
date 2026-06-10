document.addEventListener('DOMContentLoaded', () => {
    // Parallax effect for floating pills and images
    const hero = document.querySelector('.hero');
    const pills = document.querySelectorAll('.floating-pill, .hero-image-wrapper');

    if (hero && pills.length > 0) {
        if (!window.Matter) return;
        const Engine = Matter.Engine,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite,
            Body = Matter.Body;

        const engine = Engine.create();
        engine.world.gravity.y = 1.2; // 稍微增加重力，讓掉落更真實

        let bodiesMap = new Map(); // 綁定 DOM 元素與物理剛體
        let physicsBounds = { width: 1000, height: 1000, groundY: 1000, ceilingY: 0, wallLeftX: 0, wallRightX: 1000 };

        const titleImg = document.querySelector('.hero-title img');
        const container = document.querySelector('.hero-content');
        const header = document.querySelector('.header');

        setTimeout(() => {
            if (!titleImg || !container) return;

            const containerRect = container.getBoundingClientRect();
            const titleRect = titleImg.getBoundingClientRect();
            const headerRect = header ? header.getBoundingClientRect() : { bottom: 0 };

            // 計算 Y 座標相對於 .hero-content 的位置
            physicsBounds.width = containerRect.width;
            physicsBounds.height = containerRect.height;
            physicsBounds.groundY = titleRect.top - containerRect.top - 30; // 減去 30x 創造留白
            physicsBounds.ceilingY = headerRect.bottom - containerRect.top;

            const imgRatio = 3584 / 698;
            let expectedWidth = titleRect.height * imgRatio;
            let wallLeftX = 0;
            let wallRightX = physicsBounds.width;
            if (expectedWidth < titleRect.width) {
                wallLeftX = (titleRect.width - expectedWidth) / 2;
                wallRightX = titleRect.width - (titleRect.width - expectedWidth) / 2;
            }
            wallLeftX += 10;
            wallRightX -= 10;
            physicsBounds.wallLeftX = wallLeftX;
            physicsBounds.wallRightX = wallRightX;

            // 建立隱形物理邊界 (加厚至 2000px 防止快速拋擲穿透)
            const thickness = 2000;
            const ground = Bodies.rectangle(physicsBounds.width / 2, physicsBounds.groundY + thickness / 2, physicsBounds.width * 2, thickness, {
                isStatic: true
            });
            const ceiling = Bodies.rectangle(physicsBounds.width / 2, physicsBounds.ceilingY - thickness / 2, physicsBounds.width * 2, thickness, {
                isStatic: true
            });
            const leftWall = Bodies.rectangle(physicsBounds.wallLeftX - thickness / 2, physicsBounds.height / 2, thickness, physicsBounds.height * 2, { isStatic: true });
            const rightWall = Bodies.rectangle(physicsBounds.wallRightX + thickness / 2, physicsBounds.height / 2, thickness, physicsBounds.height * 2, { isStatic: true });

            const leftCorner = Bodies.rectangle(physicsBounds.wallLeftX - 10, physicsBounds.groundY + 10, 100, 100, { isStatic: true, angle: Math.PI / 4 });
            const rightCorner = Bodies.rectangle(physicsBounds.wallRightX + 10, physicsBounds.groundY + 10, 100, 100, { isStatic: true, angle: Math.PI / 4 });

            Composite.add(engine.world, [ground, ceiling, leftWall, rightWall, leftCorner, rightCorner]);

            // 響應視窗縮放 (RWD) 以動態更新邊界，加入 debounce 避免頻繁觸發擠出標籤
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    const newContainerRect = container.getBoundingClientRect();
                    const newTitleRect = titleImg.getBoundingClientRect();
                    const newHeaderRect = header ? header.getBoundingClientRect() : { bottom: 0 };

                    physicsBounds.width = newContainerRect.width;
                    physicsBounds.height = newContainerRect.height;
                    physicsBounds.groundY = newTitleRect.top - newContainerRect.top - 15; // 減去 15px 創造留白
                    physicsBounds.ceilingY = newHeaderRect.bottom - newContainerRect.top;

                    let newExpectedWidth = newTitleRect.height * imgRatio;
                    let newWallLeftX = 0;
                    let newWallRightX = physicsBounds.width;
                    if (newExpectedWidth < newTitleRect.width) {
                        newWallLeftX = (newTitleRect.width - newExpectedWidth) / 2;
                        newWallRightX = newTitleRect.width - (newTitleRect.width - newExpectedWidth) / 2;
                    }
                    newWallLeftX += 10;
                    newWallRightX -= 10;
                    physicsBounds.wallLeftX = newWallLeftX;
                    physicsBounds.wallRightX = newWallRightX;

                    Body.setPosition(ground, { x: physicsBounds.width / 2, y: physicsBounds.groundY + thickness / 2 });
                    Body.setPosition(ceiling, { x: physicsBounds.width / 2, y: physicsBounds.ceilingY - thickness / 2 });
                    Body.setPosition(leftWall, { x: physicsBounds.wallLeftX - thickness / 2, y: physicsBounds.height / 2 });
                    Body.setPosition(rightWall, { x: physicsBounds.wallRightX + thickness / 2, y: physicsBounds.height / 2 });
                    Body.setPosition(leftCorner, { x: physicsBounds.wallLeftX - 10, y: physicsBounds.groundY + 10 });
                    Body.setPosition(rightCorner, { x: physicsBounds.wallRightX + 10, y: physicsBounds.groundY + 10 });

                    // RWD 縮放時，重新建立所有的標籤剛體，確保大小與 CSS 縮放同步
                    bodiesMap.forEach((body) => {
                        Composite.remove(engine.world, body);
                    });
                    bodiesMap.clear();
                    createPills();
                }, 200);
            });

            // 建立標籤剛體的函數
            function createPills() {
                pills.forEach((pill) => {
                    // 暫時移除 transform 以取得真實未旋轉尺寸，避免剛體越變越大
                    const oldTransform = pill.style.transform;
                    pill.style.transform = 'none';
                    const rect = pill.getBoundingClientRect();
                    pill.style.transform = oldTransform;
                    
                    // 讓它們從天花板附近隨機位置掉落
                    const startX = physicsBounds.width * 0.2 + (Math.random() * (physicsBounds.width * 0.6));
                    const startY = physicsBounds.ceilingY + rect.height + (Math.random() * 50);

                    let body;
                    if (pill.classList.contains('pill-2')) {
                        // 三角形 (3邊)，縮小半徑比例至 0.42 以完美貼合 SVG 視覺寬度，避免無形空氣牆
                        body = Bodies.polygon(startX, startY, 3, Math.max(rect.width, rect.height) * 0.42, {
                            restitution: 0.7,
                            friction: 0.1,
                            frictionAir: 0.015,
                            chamfer: { radius: 30 }, // 配合視覺加大的圓角
                            angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.2 // 初始設為尖端向上 (-90度)
                        });
                    } else if (pill.classList.contains('pill-3') || pill.classList.contains('pill-1') && pill.innerText.includes('In Progress')) {
                        // 圓形
                        body = Bodies.circle(startX, startY, rect.width / 2, {
                            restitution: 0.7,
                            friction: 0.1,
                            frictionAir: 0.015,
                            angle: (Math.random() - 0.5) * 0.2
                        });
                    } else if (pill.classList.contains('hero-image-wrapper')) {
                        // 圖片的方塊
                        body = Bodies.rectangle(startX, startY, rect.width, rect.height, {
                            restitution: 0.6,
                            friction: 0.2,
                            frictionAir: 0.02,
                            chamfer: { radius: 20 },
                            angle: (Math.random() - 0.5) * 0.1
                        });
                    } else {
                        // 膠囊 (預設)
                        body = Bodies.rectangle(startX, startY, rect.width, rect.height, {
                            restitution: 0.7,
                            friction: 0.1,
                            frictionAir: 0.015,
                            chamfer: { radius: Math.min(rect.width, rect.height) / 2 },
                            angle: (Math.random() - 0.5) * 0.2
                        });
                    }

                    Composite.add(engine.world, body);
                    bodiesMap.set(pill, body);
                    pill.style.cursor = 'grab';
                });
            }

            // 初始化時建立標籤
            createPills();

            const runner = Runner.create();
            Runner.run(runner, engine);

            // 限制旋轉角度，防止上下顛倒
            Matter.Events.on(engine, 'beforeUpdate', function () {
                bodiesMap.forEach((body, pill) => {
                    let maxAngle = 0.3; // 約 17 度
                    let currentAngle = body.angle;
                    let targetZero = 0;

                    // 三角形的預設向上角度是 -Math.PI / 2 (-90度)
                    if (pill.classList.contains('pill-2')) {
                        targetZero = -Math.PI / 2;
                    }

                    if (currentAngle > targetZero + maxAngle) {
                        Body.setAngle(body, targetZero + maxAngle);
                        Body.setAngularVelocity(body, 0);
                    } else if (currentAngle < targetZero - maxAngle) {
                        Body.setAngle(body, targetZero - maxAngle);
                        Body.setAngularVelocity(body, 0);
                    }
                });
            });

            // 每幀同步物理座標到 DOM
            Matter.Events.on(engine, 'afterUpdate', function () {
                bodiesMap.forEach((body, pill) => {
                    // 安全機制：如果標籤被物理引擎擠出牆外（例如 RWD 縮放視窗時），將其傳送回天花板重新掉落
                    if (
                        body.position.y > physicsBounds.groundY + 100 ||
                        body.position.y < physicsBounds.ceilingY - 100 ||
                        body.position.x < physicsBounds.wallLeftX - 100 ||
                        body.position.x > physicsBounds.wallRightX + 100
                    ) {
                        Body.setPosition(body, {
                            x: physicsBounds.width / 2 + (Math.random() * 50 - 25),
                            y: physicsBounds.ceilingY + 100
                        });
                        Body.setVelocity(body, { x: 0, y: 0 });
                    }

                    if (!pill.isDragging) {
                        const x = body.position.x - pill.offsetWidth / 2;
                        const y = body.position.y - pill.offsetHeight / 2;
                        
                        let renderAngle = body.angle;
                        // 三角形在物理世界預設向右 (0度)，我們讓它向上 (-90度)，所以視覺上要補 +90度 才能對齊 DOM
                        if (pill.classList.contains('pill-2')) {
                            renderAngle += Math.PI / 2;
                        }
                        
                        pill.style.transform = `translate(${x}px, ${y}px) rotate(${renderAngle}rad)`;
                    }
                });
            });

        }, 300); // 延遲等待圖片與排版載入完成

        // 自訂拖曳與拋擲邏輯，綁定剛體座標
        pills.forEach(pill => {
            let startX, startY;
            let startBodyX, startBodyY;
            let lastX, lastY;
            let lastTime;
            let vx = 0, vy = 0;

            const dragStart = (e) => {
                pill.isDragging = true;
                const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
                const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

                const body = bodiesMap.get(pill);
                if (body) {
                    Body.setVelocity(body, { x: 0, y: 0 });
                    Body.setAngularVelocity(body, 0);
                    startBodyX = body.position.x;
                    startBodyY = body.position.y;
                }

                startX = clientX;
                startY = clientY;
                lastX = clientX;
                lastY = clientY;
                lastTime = Date.now();

                pill.style.zIndex = '1000';
                pill.style.cursor = 'grabbing';

                document.addEventListener('mousemove', drag);
                document.addEventListener('touchmove', drag, { passive: false });
                document.addEventListener('mouseup', dragEnd);
                document.addEventListener('touchend', dragEnd);
            };

            const drag = (e) => {
                if (!pill.isDragging) return;
                if (e.type === "touchmove") e.preventDefault(); // 防止手機滾動

                const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
                const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

                const dx = clientX - startX;
                const dy = clientY - startY;

                const body = bodiesMap.get(pill);
                if (body) {
                    let targetX = startBodyX + dx;
                    let targetY = startBodyY + dy;

                    // 限制拖曳範圍，不讓滑鼠把標籤強制拉出邊界外
                    const padX = pill.offsetWidth / 2;
                    const padY = pill.offsetHeight / 2;
                    targetX = Math.max(physicsBounds.wallLeftX + padX, Math.min(physicsBounds.wallRightX - padX, targetX));
                    targetY = Math.max(physicsBounds.ceilingY + padY, Math.min(physicsBounds.groundY - padY, targetY));

                    // 更新剛體座標
                    Body.setPosition(body, { x: targetX, y: targetY });

                    // 計算瞬間速度，供拋擲使用
                    const now = Date.now();
                    const dt = now - lastTime;
                    if (dt > 0) {
                        vx = (clientX - lastX) / dt;
                        vy = (clientY - lastY) / dt;
                    }
                    lastX = clientX;
                    lastY = clientY;
                    lastTime = now;

                    // 拖曳時手動同步畫面
                    const px = body.position.x - pill.offsetWidth / 2;
                    const py = body.position.y - pill.offsetHeight / 2;
                    
                    let renderAngle = body.angle;
                    if (pill.classList.contains('pill-2')) {
                        renderAngle += Math.PI / 2;
                    }
                    
                    pill.style.transform = `translate(${px}px, ${py}px) rotate(${renderAngle}rad)`;
                }
            };

            const dragEnd = () => {
                if (!pill.isDragging) return;
                pill.isDragging = false;
                pill.style.zIndex = '';
                pill.style.cursor = 'grab';

                const body = bodiesMap.get(pill);
                if (body) {
                    // 賦予拋擲速度 (vx, vy 為每毫秒像素，乘以 16.6 轉為每幀像素)
                    Body.setVelocity(body, { x: vx * 16.6, y: vy * 16.6 });
                }

                document.removeEventListener('mousemove', drag);
                document.removeEventListener('touchmove', drag);
                document.removeEventListener('mouseup', dragEnd);
                document.removeEventListener('touchend', dragEnd);
            };

            pill.addEventListener('mousedown', dragStart);
            pill.addEventListener('touchstart', dragStart, { passive: false });
        });
    }
});

function adjustEnglishSpacing() {
    // 鎖定想要調整的內文區塊
    const containers = document.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, span, div, a, button, label');

    // 正則表達式：找出英文單字、數字及常用半形符號
    const regex = /([a-zA-Z0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]+)/g;

    containers.forEach(container => {
        // 避免重複處理
        if (container.dataset.spacingAdjusted) return;

        // Skip elements that contain other elements to avoid destroying DOM structure
        if (container.children.length > 0) return;

        container.innerHTML = container.innerHTML.replace(regex, (match) => {
            // 排除掉原本就是 HTML 標籤的內容
            if (match.trim().length === 0) return match;
            return `<span class="en-text">${match}</span>`;
        });

        container.dataset.spacingAdjusted = "true";
    });
}

function setupSliderPagination() {
    const galleries = document.querySelectorAll('.gallery-container');

    galleries.forEach(container => {
        const slider = container.querySelector('.horizontal-slider');
        const track = container.querySelector('.slider-track');
        const items = track.querySelectorAll('.slide-item');
        const pagination = container.querySelector('.slider-pagination');
        const scrollbar = container.querySelector('.slider-scrollbar');
        const scrollbarThumb = container.querySelector('.slider-scrollbar-thumb');

        if (!slider || items.length === 0) return;

        // Make slider keyboard-focusable and accessible
        slider.setAttribute('tabindex', '0');
        slider.setAttribute('aria-label', '專案圖片藝廊，使用鍵盤左右方向鍵捲動');

        // --- DOTS (tablet/mobile) ---
        const dots = pagination ? pagination.querySelectorAll('.dot') : [];
        dots.forEach((dot, index) => {
            dot.setAttribute('aria-label', `投影片第 ${index + 1} 頁`);
        });

        // --- SCROLLBAR (desktop) ---
        function updateScrollbar() {
            if (!scrollbar || !scrollbarThumb) return;
            const maxScroll = slider.scrollWidth - slider.clientWidth;
            if (maxScroll <= 0) {
                scrollbar.style.display = 'none';
                return;
            }
            const scrollRatio = slider.scrollLeft / maxScroll;
            const thumbWidth = Math.max(
                30,
                (slider.clientWidth / slider.scrollWidth) * scrollbar.clientWidth
            );
            const thumbLeft = scrollRatio * (scrollbar.clientWidth - thumbWidth);
            scrollbarThumb.style.width = thumbWidth + 'px';
            scrollbarThumb.style.marginLeft = thumbLeft + 'px';
        }

        // --- SCROLL EVENT: update dots + scrollbar ---
        slider.addEventListener('scroll', () => {
            // Update dots
            if (dots.length > 0) {
                let closestIndex = 0;
                let minDistance = Infinity;
                const sliderLeft = slider.scrollLeft;

                items.forEach((item, index) => {
                    const distance = Math.abs(item.offsetLeft - track.offsetLeft - sliderLeft);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestIndex = index;
                    }
                });

                dots.forEach((dot, index) => {
                    dot.classList.toggle('active', index === closestIndex);
                });
            }

            // Update scrollbar
            updateScrollbar();
        });

        // --- CLICK DOTS to scroll ---
        // --- CLICK DOTS to scroll ---
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const item = items[index];
                slider.scrollTo({
                    left: item.offsetLeft - track.offsetLeft,
                    behavior: 'smooth'
                });
            });
        });

        // --- CLICK SLIDE ITEM to scroll (and update scrollbar) ---
        items.forEach((item, idx) => {
            item.addEventListener('click', () => {
                slider.scrollTo({
                    left: item.offsetLeft - track.offsetLeft,
                    behavior: 'smooth'
                });
            });
        });

        // --- CLICK SCROLLBAR to jump ---
        if (scrollbar) {
            scrollbar.addEventListener('click', (e) => {
                const rect = scrollbar.getBoundingClientRect();
                const clickRatio = (e.clientX - rect.left) / rect.width;
                const maxScroll = slider.scrollWidth - slider.clientWidth;
                slider.scrollTo({
                    left: clickRatio * maxScroll,
                    behavior: 'smooth'
                });
            });
        }

        // Initial render
        updateScrollbar();
    });
}

function loadFirstImages(container, count) {
    const lazyImages = container.querySelectorAll('img.lazy-gallery-img');
    for (let i = 0; i < Math.min(lazyImages.length, count); i++) {
        const image = lazyImages[i];
        if (image.dataset.src) {
            image.src = image.dataset.src;
            image.removeAttribute('data-src');
            image.addEventListener('load', () => {
                image.classList.add('loaded');
            });
            if (image.complete) {
                image.classList.add('loaded');
            }
        }
    }
}

function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy-gallery-img');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    if (image.dataset.src) {
                        image.src = image.dataset.src;
                        image.removeAttribute('data-src');
                        image.addEventListener('load', () => {
                            image.classList.add('loaded');
                        });
                        if (image.complete) {
                            image.classList.add('loaded');
                        }
                    }
                    observer.unobserve(image);
                }
            });
        }, {
            rootMargin: '300px 500px 300px 500px' // Start loading earlier, especially horizontally
        });

        lazyImages.forEach(image => {
            imageObserver.observe(image);
        });

        // Observe the archive items to eager load their images before they are opened
        const archiveItems = document.querySelectorAll('.archive-item');
        const itemObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Load all images in this item
                    loadFirstImages(entry.target, 20);
                    // Stop observing this item once triggered
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '1000px 0px 1000px 0px' // Trigger when within 1000px vertically
        });
        
        archiveItems.forEach(item => {
            itemObserver.observe(item);
        });

    } else {
        // Fallback for browsers without IntersectionObserver
        lazyImages.forEach(image => {
            if (image.dataset.src) {
                image.src = image.dataset.src;
                image.removeAttribute('data-src');
                image.classList.add('loaded');
            }
        });
    }
}

// 網頁載入後執行
window.addEventListener('DOMContentLoaded', () => {
    adjustEnglishSpacing();
    setupSliderPagination();
    initLazyLoading();

    // Make scrollable containers keyboard-accessible
    const scrollableContainers = document.querySelectorAll('.scrollable-container');
    scrollableContainers.forEach(container => {
        if (!container.hasAttribute('tabindex')) {
            container.setAttribute('tabindex', '0');
        }
        if (!container.hasAttribute('aria-label')) {
            container.setAttribute('aria-label', '水平捲動以檢視完整內容');
        }
    });
});

// ==============================
// Custom Desktop Cursor Interaction (active state)
// ==============================
document.addEventListener('mousedown', (e) => {
    const cursor = document.querySelector('.custom-cursor');
    if (cursor && window.innerWidth >= 1025) {
        cursor.classList.add('active');
    }
});

document.addEventListener('mouseup', (e) => {
    const cursor = document.querySelector('.custom-cursor');
    if (cursor && window.innerWidth >= 1025) {
        cursor.classList.remove('active');
    }
});

// ==============================
// Custom Desktop Cursor Logic
// ==============================
(function () {
    const isDesktop = () => window.innerWidth >= 1025;
    const cursor = document.querySelector('.custom-cursor') || document.createElement('div');
    if (!cursor.classList.contains('custom-cursor')) {
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);
    }

    if (isDesktop()) {
        document.body.classList.add('has-custom-cursor');
    }

    // Update cursor position
    document.addEventListener('mousemove', (e) => {
        if (!isDesktop()) return;
        if (!document.body.classList.contains('has-custom-cursor')) {
            document.body.classList.add('has-custom-cursor');
        }
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Fallback: hide custom cursor and show system cursor on Tab navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.remove('has-custom-cursor');
        }
    });

    // Elements that should trigger hover effect
    const interactiveSelectors = 'a, button, [role="button"], .project-nav-item, .slide-item, .dot, .work-card-wrapper';
    const syncCursorHover = (target) => {
        const interactiveElement = target && target.closest ? target.closest(interactiveSelectors) : null;
        cursor.classList.toggle('hover', Boolean(interactiveElement));
    };

    document.addEventListener('mousemove', (e) => {
        if (!isDesktop() || !document.body.classList.contains('has-custom-cursor')) {
            cursor.classList.remove('hover');
            return;
        }
        syncCursorHover(e.target);
    });

    document.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
    });
})();

// ==============================
// Project Grid Filtering & Interactive Overlay Logic
// ==============================
(function () {
    const filterPills = document.querySelectorAll('.custom-filter-pill');
    const cards = document.querySelectorAll('.work-card-wrapper');

    if (filterPills.length > 0 && cards.length > 0) {
        // Map filter button texts to card data-tags categories
        const filterMap = {
            "全部": "all",
            "UX / UI 設計": "UI/UX",
            "服務設計": "服務設計",
            "永續設計": "永續設計",
            "地方議題研究": "地方議題研究",
            "參與式設計": "參與式設計"
        };

        // Add fade-in class on initial load with a slight delay offset
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 100);
        });

        // Filter click events
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                // Update active state of pills
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');

                const filterText = pill.textContent.trim();
                const targetTag = filterMap[filterText] || 'all';

                cards.forEach(card => {
                    const cardTags = card.getAttribute('data-tags') ? card.getAttribute('data-tags').split(',') : [];
                    const isMatch = (targetTag === 'all' || cardTags.includes(targetTag));

                    if (isMatch) {
                        card.style.display = 'block';
                        card.classList.remove('fade-in');
                        void card.offsetWidth; // force layout reflow
                        card.classList.add('fade-in');
                    } else {
                        card.style.display = 'none';
                        card.classList.remove('fade-in');
                    }
                });
            });
        });
        
        // Coming Soon Toggle for Mobile / Touch
        const comingSoonCard = document.querySelector('.work-card-wrapper.coming-soon');
        if (comingSoonCard) {
            comingSoonCard.addEventListener('click', (e) => {
                // Prevent event bubbling so click listener doesn't trigger immediately
                e.stopPropagation();
                comingSoonCard.classList.toggle('active');
                
                // Add event listener to remove active class when clicking outside
                const closeOverlay = (event) => {
                    if (!comingSoonCard.contains(event.target)) {
                        comingSoonCard.classList.remove('active');
                        document.removeEventListener('click', closeOverlay);
                    }
                };
                document.addEventListener('click', closeOverlay);
            });
        }
    }
    
    // Archive List Accordion Toggle
    const archiveHeaders = document.querySelectorAll('.archive-item-header');
    if (archiveHeaders.length > 0) {
        const setArchivePanelState = (item, isOpen) => {
            const content = item.querySelector('.archive-item-content');
            if (!content) return;

            content.toggleAttribute('inert', !isOpen);
            content.setAttribute('aria-hidden', String(!isOpen));
        };

        archiveHeaders.forEach(header => {
            header.setAttribute('aria-expanded', 'false');
            setArchivePanelState(header.parentElement, false);
            
            const toggleAccordion = () => {
                const currentItem = header.parentElement;
                const isActive = currentItem.classList.contains('active');
                
                // Close all other items and set expanded to false
                document.querySelectorAll('.archive-item').forEach(item => {
                    item.classList.remove('active');
                    const h = item.querySelector('.archive-item-header');
                    if (h) h.setAttribute('aria-expanded', 'false');
                    setArchivePanelState(item, false);
                });
                
                // Toggle the clicked item
                if (!isActive) {
                    currentItem.classList.add('active');
                    header.setAttribute('aria-expanded', 'true');
                    setArchivePanelState(currentItem, true);
                    // Actively trigger loading of all images in this expanded panel immediately
                    loadFirstImages(currentItem, 20);
                } else {
                    header.setAttribute('aria-expanded', 'false');
                    setArchivePanelState(currentItem, false);
                }
            };

            header.addEventListener('click', toggleAccordion);
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent scrolling on Space
                    toggleAccordion();
                }
            });
        });
    }

    // Image Lightbox Logic
    let lightbox = document.getElementById('image-lightbox');
    let lightboxImg = document.getElementById('lightbox-img');
    let lightboxClose = document.querySelector('.lightbox-close');
    let lightboxPrev = document.querySelector('.lightbox-nav.prev');
    let lightboxNext = document.querySelector('.lightbox-nav.next');
    const slideImages = document.querySelectorAll('.slide-item img');

    if (slideImages.length > 0) {
        // Dynamically create lightbox if it doesn't exist on the current page
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'image-lightbox';
            lightbox.className = 'lightbox';
            lightbox.setAttribute('role', 'dialog');
            lightbox.setAttribute('aria-modal', 'true');
            lightbox.setAttribute('aria-label', '圖片檢視器');

            lightboxClose = document.createElement('button');
            lightboxClose.className = 'lightbox-close';
            lightboxClose.setAttribute('aria-label', '關閉畫廊');
            lightboxClose.innerHTML = '&times;';

            lightboxPrev = document.createElement('button');
            lightboxPrev.className = 'lightbox-nav prev';
            lightboxPrev.setAttribute('aria-label', 'Previous image');
            lightboxPrev.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            `;

            lightboxImg = document.createElement('img');
            lightboxImg.id = 'lightbox-img';
            lightboxImg.className = 'lightbox-content';
            lightboxImg.setAttribute('alt', '放大的專案圖片');

            lightboxNext = document.createElement('button');
            lightboxNext.className = 'lightbox-nav next';
            lightboxNext.setAttribute('aria-label', 'Next image');
            lightboxNext.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            `;

            lightbox.appendChild(lightboxClose);
            lightbox.appendChild(lightboxPrev);
            lightbox.appendChild(lightboxImg);
            lightbox.appendChild(lightboxNext);
            document.body.appendChild(lightbox);
        } else {
            // Set references if lightbox exists statically
            if (!lightboxPrev) lightboxPrev = lightbox.querySelector('.lightbox-nav.prev');
            if (!lightboxNext) lightboxNext = lightbox.querySelector('.lightbox-nav.next');
        }

        let currentGalleryImages = [];
        let currentImageIndex = 0;
        let lastActiveElement = null; // Store trigger element to restore focus on close

        const updateLightboxContent = () => {
            if (currentGalleryImages.length > 0 && currentImageIndex >= 0 && currentImageIndex < currentGalleryImages.length) {
                const currentImg = currentGalleryImages[currentImageIndex];
                lightboxImg.src = currentImg.src;

                // Hide/show navigation buttons based on current index bounds
                if (lightboxPrev) {
                    if (currentImageIndex === 0) {
                        lightboxPrev.classList.add('hidden');
                    } else {
                        lightboxPrev.classList.remove('hidden');
                    }
                }

                if (lightboxNext) {
                    if (currentImageIndex === currentGalleryImages.length - 1) {
                        lightboxNext.classList.add('hidden');
                    } else {
                        lightboxNext.classList.remove('hidden');
                    }
                }
            }
        };

        // Initialize slide images for keyboard accessibility (role, tabindex, labels, enter/space trigger)
        slideImages.forEach(img => {
            img.setAttribute('tabindex', '0');
            img.setAttribute('role', 'button');
            const parentItem = img.closest('.slide-item');
            const caption = parentItem ? parentItem.querySelector('.slide-caption') : null;
            const captionText = caption ? caption.textContent.trim() : (img.alt || '作品圖片');
            img.setAttribute('aria-label', `放大圖片：${captionText}`);

            const openHandler = (e) => {
                e.stopPropagation(); // Prevent trigger parent slide-item scroll click
                lastActiveElement = img; // Remember which image triggered the lightbox
                
                // Identify the sibling images inside the same slider track
                const parentTrack = img.closest('.slider-track') || img.closest('.horizontal-slider') || img.parentElement;
                currentGalleryImages = Array.from(parentTrack.querySelectorAll('img'));
                currentImageIndex = currentGalleryImages.indexOf(img);
                
                updateLightboxContent();
                lightbox.classList.add('show');

                // Shift focus to the close button inside the modal for keyboard accessibility
                setTimeout(() => {
                    if (lightboxClose) lightboxClose.focus();
                }, 100);
            };

            img.addEventListener('click', openHandler);
            img.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); // Prevent scrolling on Space
                    openHandler(e);
                }
            });
        });

        // Close lightbox function
        const closeLightbox = () => {
            lightbox.classList.remove('show');
            setTimeout(() => {
                lightboxImg.src = '';
                // Restore focus to the triggering image element
                if (lastActiveElement) {
                    lastActiveElement.focus();
                }
            }, 300); // Clear src after transition ends
        };

        // Close when clicking X
        if (lightboxClose) {
            lightboxClose.addEventListener('click', closeLightbox);
        }

        // Close when clicking outside the image
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Navigation button event listeners
        if (lightboxPrev) {
            lightboxPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentImageIndex > 0) {
                    currentImageIndex--;
                    updateLightboxContent();
                    lightboxPrev.focus();
                }
            });
        }

        if (lightboxNext) {
            lightboxNext.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentImageIndex < currentGalleryImages.length - 1) {
                    currentImageIndex++;
                    updateLightboxContent();
                    lightboxNext.focus();
                }
            });
        }
        
        // Keyboard navigation (Escape to close, Left/Right arrows to navigate)
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('show')) return;
            
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                if (currentImageIndex > 0) {
                    currentImageIndex--;
                    updateLightboxContent();
                }
            } else if (e.key === 'ArrowRight') {
                if (currentImageIndex < currentGalleryImages.length - 1) {
                    currentImageIndex++;
                    updateLightboxContent();
                }
            }
        });

        // Focus Trap: restrict tab navigation within the open lightbox modal
        lightbox.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('show')) return;
            if (e.key !== 'Tab') return;

            // Collect currently visible and focusable modal controls
            const focusableElements = [];
            if (lightboxClose && window.getComputedStyle(lightboxClose).display !== 'none') {
                focusableElements.push(lightboxClose);
            }
            if (lightboxPrev && !lightboxPrev.classList.contains('hidden') && window.getComputedStyle(lightboxPrev).display !== 'none') {
                focusableElements.push(lightboxPrev);
            }
            if (lightboxNext && !lightboxNext.classList.contains('hidden') && window.getComputedStyle(lightboxNext).display !== 'none') {
                focusableElements.push(lightboxNext);
            }

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) { // Shift + Tab: wrap around from first to last
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else { // Tab: wrap around from last to first
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }

    /* =========================================
       Hover Image Preview (Archive List)
       ========================================= */
    const hoverPreviewContainer = document.getElementById('hover-preview-container');
    const hoverPreviewImg = document.getElementById('hover-preview-img');
    
    if (hoverPreviewContainer && hoverPreviewImg) {
        const archiveHeaders = document.querySelectorAll('.archive-item-header');
        
        archiveHeaders.forEach(header => {
            // Find the first image in the associated content
            const item = header.closest('.archive-item');
            const firstImg = item.querySelector('.archive-item-content img');
            
            if (firstImg || header.dataset.preview) {
                // When mouse enters the header
                header.addEventListener('mouseenter', (e) => {
                    // Only show if the item is NOT expanded and screen is desktop
                    if (!item.classList.contains('active') && window.innerWidth > 1024) {
                        // Use data-preview if available, otherwise fallback to first image in gallery
                        hoverPreviewImg.src = header.dataset.preview || (firstImg ? (firstImg.dataset.src || firstImg.src) : '');
                        hoverPreviewContainer.classList.add('active');
                        // Add a random slight rotation for dynamic feel
                        const randomRotation = Math.random() * 8 - 4; // between -4 and 4 degrees
                        hoverPreviewContainer.style.transform = `translateY(-50%) scale(1) rotate(${randomRotation}deg)`;
                    }
                });

                // Hide on mouseleave
                header.addEventListener('mouseleave', () => {
                    hoverPreviewContainer.classList.remove('active');
                    hoverPreviewContainer.style.transform = `translateY(-50%) scale(0.9) rotate(0deg)`;
                });
                
                // Hide immediately if clicked to expand
                header.addEventListener('click', () => {
                    hoverPreviewContainer.classList.remove('active');
                    hoverPreviewContainer.style.transform = `translateY(-50%) scale(0.9) rotate(0deg)`;
                });
            }
        });
    }

})();
