const App = {
    lessons: [],
    currentLesson: null,

    // =========================================================
    // ИНИЦИАЛИЗАЦИЯ
    // =========================================================

    async init() {
        try {
            const response = await fetch("data/lessons.json");

            if (!response.ok) {
                throw new Error("Не удалось загрузить lessons.json");
            }

            const data = await response.json();

            // Поддерживаем оба варианта:
            // [ ... ]
            // и
            // { version: 1, grade: 5, lessons: [ ... ] }

            this.lessons = Array.isArray(data)
                ? data
                : (data.lessons || []);

            // Первоначальная отрисовка по текущему URL
            this.handleRoute();

            // Следим за изменением hash
            window.addEventListener("hashchange", () => {
                this.handleRoute();
            });

        } catch (error) {
            console.error(error);

            this.showError(
                "Не удалось загрузить материалы",
                "Проверьте подключение к интернету и попробуйте обновить страницу."
            );
        }
    },


    // =========================================================
    // МАРШРУТИЗАЦИЯ
    // =========================================================

    handleRoute() {
        const hash = window.location.hash;

        console.log("EDUMSK route:", hash);

        // -----------------------------------------------------
        // ГЛАВНАЯ
        // -----------------------------------------------------

        if (!hash || hash === "#") {
            this.currentLesson = null;
            this.renderHome();
            return;
        }


        // -----------------------------------------------------
        // УРОКИ
        // -----------------------------------------------------

        if (hash.startsWith("#lesson/")) {

            const route = hash
                .replace("#lesson/", "")
                .split("/");

            const lessonId = route[0];


            // -------------------------------------------------
            // ПРОСТАЯ СТРАНИЦА УРОКА
            // #lesson/2026-09-14
            // -------------------------------------------------

            if (route.length === 1) {

                const lesson =
                    this.lessons.find(
                        item => item.id === lessonId
                    );

                if (!lesson) {
                    this.showNotFound();
                    return;
                }

                this.currentLesson = lesson;

                // ВАЖНО:
                // Здесь больше НЕ вызываем openLesson().
                // Иначе получится бесконечный цикл.
                this.renderLesson(lesson);

                return;
            }


            // -------------------------------------------------
            // МАТЕРИАЛ
            // #lesson/2026-09-14/material/video
            // -------------------------------------------------

            if (
                route.length >= 3 &&
                route[1] === "material"
            ) {

                const materialId =
                    route.slice(2).join("/");

                const lesson =
                    this.lessons.find(
                        item => item.id === lessonId
                    );

                if (!lesson) {
                    this.showNotFound();
                    return;
                }


                const material =
                    (lesson.materials || []).find(
                        item => item.id === materialId
                    );

                if (!material) {
                    this.showNotFound();
                    return;
                }


                this.currentLesson = lesson;

                // ВАЖНО:
                // Здесь тоже сразу рисуем viewer.
                this.renderMaterialViewer(
                    lesson,
                    material
                );

                return;
            }
        }


        // -----------------------------------------------------
        // НЕИЗВЕСТНЫЙ МАРШРУТ
        // -----------------------------------------------------

        this.showNotFound();
    },


    // =========================================================
    // ГЛАВНАЯ СТРАНИЦА
    // =========================================================

    renderHome() {
        const app =
            document.getElementById("app");

        if (!app) {
            return;
        }


        const upcomingLesson =
            this.getUpcomingLesson();


        app.innerHTML = `
            <div class="page">

                <header class="site-header">

                    <div class="brand">

                        <div class="brand-mark">
                            EDUMSK
                        </div>

                        <div class="brand-text">

                            <div class="brand-title">
                                Разговоры о важном
                            </div>

                            <div class="brand-subtitle">
                                Материалы для 5 класса
                            </div>

                        </div>

                    </div>

                </header>


                <main class="container">

                    ${
                        upcomingLesson
                            ? this.renderUpcomingLesson(
                                upcomingLesson
                            )
                            : ""
                    }


                    <section class="lessons-section">

                        <div class="section-heading">

                            <div>

                                <div class="section-title">
                                    Все уроки
                                </div>

                                <div class="section-description">
                                    Материалы занятий 5 класса
                                </div>

                            </div>

                        </div>


                        <div class="lessons-grid">

                            ${
                                this.lessons.length
                                    ? this.lessons
                                        .slice()
                                        .sort(
                                            (a, b) =>
                                                a.date.localeCompare(
                                                    b.date
                                                )
                                        )
                                        .map(
                                            lesson =>
                                                this.renderLessonCard(
                                                    lesson
                                                )
                                        )
                                        .join("")
                                    : `
                                        <div class="empty-state">
                                            Уроки пока не добавлены.
                                        </div>
                                    `
                            }

                        </div>

                    </section>

                </main>


                <footer class="site-footer">
                    EDUMSK · Разговоры о важном
                </footer>

            </div>
        `;
    },


    renderUpcomingLesson(lesson) {
        return `
            <section class="upcoming-section">

                <div class="upcoming-label">
                    Ближайший урок
                </div>

                <div
                    class="upcoming-card"
                    onclick="App.openLesson('${this.escapeAttribute(lesson.id)}')"
                >

                    <div class="upcoming-date">
                        ${this.formatDateLong(lesson.date)}
                    </div>

                    <h1>
                        ${this.escapeHtml(lesson.title)}
                    </h1>

                    ${
                        lesson.subtitle
                            ? `
                                <p>
                                    ${this.escapeHtml(
                                        lesson.subtitle
                                    )}
                                </p>
                            `
                            : ""
                    }

                    <div class="upcoming-button">
                        Открыть урок →
                    </div>

                </div>

            </section>
        `;
    },


    renderLessonCard(lesson) {
        const status =
            this.getLessonStatus(lesson);


        return `
            <article
                class="lesson-card"
                onclick="App.openLesson('${this.escapeAttribute(lesson.id)}')"
            >

                <div class="lesson-card-top">

                    <div class="lesson-date">
                        ${this.formatDateShort(lesson.date)}
                    </div>

                    <div
                        class="lesson-status ${status.className}"
                    >
                        ${status.label}
                    </div>

                </div>


                <h2>
                    ${this.escapeHtml(lesson.title)}
                </h2>


                ${
                    lesson.subtitle
                        ? `
                            <p>
                                ${this.escapeHtml(
                                    lesson.subtitle
                                )}
                            </p>
                        `
                        : ""
                }


                <div class="lesson-card-arrow">
                    →
                </div>

            </article>
        `;
    },


    // =========================================================
    // СТРАНИЦА УРОКА
    // =========================================================

    openLesson(id) {
        const lesson =
            this.lessons.find(
                item => item.id === id
            );


        if (!lesson) {
            this.showNotFound();
            return;
        }


        // Только меняем URL.
        // Отрисовку выполнит handleRoute().
        const newHash =
            `#lesson/${lesson.id}`;


        if (window.location.hash === newHash) {
            // Если мы уже на этом уроке,
            // просто перерисуем его.
            this.currentLesson = lesson;
            this.renderLesson(lesson);
            return;
        }


        window.location.hash =
            `lesson/${lesson.id}`;
    },


    renderLesson(lesson) {
        const app =
            document.getElementById("app");


        if (!app) {
            return;
        }


        this.currentLesson = lesson;


        const lessonMaterials =
            (lesson.materials || []).filter(
                material =>
                    material.section !== "teacher"
            );


        const teacherMaterials =
            (lesson.materials || []).filter(
                material =>
                    material.section === "teacher"
            );


        app.innerHTML = `
            <div class="page">

                <header class="site-header">

                    <div class="brand">

                        <button
                            class="back-button"
                            onclick="App.goHome()"
                            title="На главную"
                        >
                            ←
                        </button>

                        <div class="brand-text">

                            <div class="brand-title">
                                Разговоры о важном
                            </div>

                            <div class="brand-subtitle">
                                5 класс
                            </div>

                        </div>

                    </div>

                </header>


                <main class="container lesson-page">

                    <div class="lesson-header">

                        <div class="lesson-header-date">
                            ${this.formatDateLong(
                                lesson.date
                            )}
                        </div>

                        <h1>
                            ${this.escapeHtml(
                                lesson.title
                            )}
                        </h1>

                        ${
                            lesson.subtitle
                                ? `
                                    <p class="lesson-subtitle">
                                        ${this.escapeHtml(
                                            lesson.subtitle
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>


                    ${
                        lessonMaterials.length
                            ? `
                                <section class="materials-section">

                                    <div class="section-heading">

                                        <div class="section-icon lesson-icon">
                                            🎓
                                        </div>

                                        <div>

                                            <div class="section-title">
                                                Материалы для урока
                                            </div>

                                            <div class="section-description">
                                                Всё необходимое для проведения занятия
                                            </div>

                                        </div>

                                    </div>


                                    <div class="materials-grid">

                                        ${lessonMaterials
                                            .map(
                                                material =>
                                                    this.renderMaterial(
                                                        material,
                                                        lesson
                                                    )
                                            )
                                            .join("")}

                                    </div>

                                </section>
                            `
                            : ""
                    }


                    ${
                        teacherMaterials.length
                            ? `
                                <section class="materials-section teacher-section">

                                    <div class="section-heading">

                                        <div class="section-icon teacher-icon">
                                            📚
                                        </div>

                                        <div>

                                            <div class="section-title">
                                                Для подготовки учителя
                                            </div>

                                            <div class="section-description">
                                                Материалы, которые можно изучить до занятия
                                            </div>

                                        </div>

                                    </div>


                                    <div class="materials-grid">

                                        ${teacherMaterials
                                            .map(
                                                material =>
                                                    this.renderMaterial(
                                                        material,
                                                        lesson
                                                    )
                                            )
                                            .join("")}

                                    </div>

                                </section>
                            `
                            : ""
                    }


                    ${
                        lesson.adminFolder
                            ? `
                                <div class="admin-folder">

                                    <a
                                        href="${this.escapeAttribute(
                                            lesson.adminFolder
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        📁 Открыть папку урока на Google Drive
                                    </a>

                                </div>
                            `
                            : ""
                    }

                </main>


                <footer class="site-footer">
                    EDUMSK · Разговоры о важном
                </footer>

            </div>
        `;
    },


    // =========================================================
    // КАРТОЧКА МАТЕРИАЛА
    // =========================================================

    renderMaterial(material, lesson) {
        return `
            <article class="material-card">

                <div class="material-icon">
                    ${this.getMaterialIcon(
                        material.type
                    )}
                </div>


                <div class="material-content">

                    <h3>
                        ${this.escapeHtml(
                            material.title
                        )}
                    </h3>

                    ${
                        material.description
                            ? `
                                <p>
                                    ${this.escapeHtml(
                                        material.description
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>


                <button
                    class="material-button"
                    onclick="
                        event.stopPropagation();
                        App.openMaterial(
                            '${this.escapeAttribute(lesson.id)}',
                            '${this.escapeAttribute(material.id)}'
                        );
                    "
                >
                    Открыть →
                </button>

            </article>
        `;
    },


    // =========================================================
    // ОТКРЫТИЕ МАТЕРИАЛА ВНУТРИ EDUMSK
    // =========================================================

    openMaterial(lessonId, materialId) {

        const lesson =
            this.lessons.find(
                item => item.id === lessonId
            );


        if (!lesson) {
            this.showNotFound();
            return;
        }


        const material =
            (lesson.materials || []).find(
                item => item.id === materialId
            );


        if (!material) {
            this.showNotFound();
            return;
        }


        // Только меняем URL.
        // Реальную отрисовку сделает handleRoute().
        const newHash =
            `#lesson/${lessonId}/material/${materialId}`;


        if (window.location.hash === newHash) {
            this.currentLesson = lesson;

            this.renderMaterialViewer(
                lesson,
                material
            );

            return;
        }


        window.location.hash =
            `lesson/${lessonId}/material/${materialId}`;
    },


    // =========================================================
    // VIEWER МАТЕРИАЛА
    // =========================================================

    renderMaterialViewer(lesson, material) {
        const app =
            document.getElementById("app");


        if (!app) {
            return;
        }


        this.currentLesson = lesson;


        app.innerHTML = `
            <div class="material-viewer-page">

                <header class="viewer-header">

                    <button
                        class="viewer-back"
                        onclick="App.backToLesson()"
                    >
                        ←
                        <span>Назад к уроку</span>
                    </button>


                    <div class="viewer-title">

                        <div class="viewer-type">
                            ${this.getMaterialIcon(
                                material.type
                            )}
                        </div>

                        <div>
                            ${this.escapeHtml(
                                material.title
                            )}
                        </div>

                    </div>


                    <button
                        class="viewer-fullscreen"
                        onclick="App.toggleFullscreen()"
                        title="На весь экран"
                    >
                        ⛶
                    </button>

                </header>


                <main
                    id="viewer-content"
                    class="viewer-content"
                >
                    ${this.renderViewerContent(material)}
                </main>

            </div>
        `;


        this.setupViewer();
    },


    // =========================================================
    // СОДЕРЖИМОЕ VIEWER
    // =========================================================

    renderViewerContent(material) {

        // -----------------------------------------------------
        // ЛОКАЛЬНОЕ ВИДЕО
        // -----------------------------------------------------

        if (
            material.type === "video" &&
            material.source === "local" &&
            material.path
        ) {

            return `
                <div class="viewer-media video-container">

                    <video
                        id="main-video"
                        class="viewer-video"
                        controls
                        playsinline
                        preload="metadata"
                    >
                        <source
                            src="${this.escapeAttribute(
                                material.path
                            )}"
                            type="video/mp4"
                        >

                        Ваш браузер не поддерживает
                        воспроизведение видео.
                    </video>

                </div>
            `;
        }


        // -----------------------------------------------------
        // GOOGLE DRIVE ВИДЕО
        // -----------------------------------------------------

        if (
            material.type === "video" &&
            material.source === "google-drive" &&
            material.driveId
        ) {

            return `
                <div class="viewer-media">

                    <iframe
                        class="viewer-iframe"
                        src="https://drive.google.com/file/d/${this.escapeAttribute(
                            material.driveId
                        )}/preview"
                        allow="autoplay; fullscreen"
                        allowfullscreen
                        frameborder="0"
                    ></iframe>

                </div>
            `;
        }


        // -----------------------------------------------------
        // LOCAL GAME
        // -----------------------------------------------------

        if (
            material.type === "game" &&
            material.source === "local" &&
            material.path
        ) {

            return `
                <div class="viewer-media game-container">

                    <iframe
                        class="viewer-iframe"
                        src="${this.escapeAttribute(
                            material.path
                        )}"
                        allow="fullscreen"
                        allowfullscreen
                        frameborder="0"
                    ></iframe>

                </div>
            `;
        }


        // -----------------------------------------------------
        // LOCAL PDF / DOCUMENT / PRESENTATION
        // -----------------------------------------------------

        if (
            (
                material.type === "document" ||
                material.type === "presentation"
            ) &&
            material.source === "local" &&
            material.path
        ) {

            return `
                <div class="viewer-media">

                    <iframe
                        class="viewer-iframe"
                        src="${this.escapeAttribute(
                            material.path
                        )}"
                        frameborder="0"
                    ></iframe>

                </div>
            `;
        }


        // -----------------------------------------------------
        // GOOGLE DRIVE PDF / PRESENTATION / DOCUMENT
        // -----------------------------------------------------

        if (
            (
                material.type === "document" ||
                material.type === "presentation"
            ) &&
            material.source === "google-drive" &&
            material.driveId
        ) {

            return `
                <div class="viewer-media">

                    <iframe
                        class="viewer-iframe"
                        src="https://drive.google.com/file/d/${this.escapeAttribute(
                            material.driveId
                        )}/preview"
                        allow="autoplay; fullscreen"
                        allowfullscreen
                        frameborder="0"
                    ></iframe>

                </div>
            `;
        }


        // -----------------------------------------------------
        // LOCAL IMAGE / POSTER
        // -----------------------------------------------------

        if (
            material.type === "poster" &&
            material.source === "local" &&
            material.path
        ) {

            return `
                <div class="viewer-media image-container">

                    <img
                        class="viewer-image"
                        src="${this.escapeAttribute(
                            material.path
                        )}"
                        alt="${this.escapeAttribute(
                            material.title
                        )}"
                    >

                </div>
            `;
        }


        // -----------------------------------------------------
        // GOOGLE DRIVE IMAGE
        // -----------------------------------------------------

        if (
            material.type === "poster" &&
            material.source === "google-drive" &&
            material.driveId
        ) {

            return `
                <div class="viewer-media image-container">

                    <img
                        class="viewer-image"
                        src="https://drive.google.com/uc?export=view&id=${this.escapeAttribute(
                            material.driveId
                        )}"
                        alt="${this.escapeAttribute(
                            material.title
                        )}"
                    >

                </div>
            `;
        }


        // -----------------------------------------------------
        // LOCAL AUDIO
        // -----------------------------------------------------

        if (
            material.type === "audio" &&
            material.source === "local" &&
            material.path
        ) {

            return `
                <div class="audio-viewer">

                    <div class="audio-icon">
                        🔊
                    </div>

                    <audio
                        controls
                        class="viewer-audio"
                    >
                        <source
                            src="${this.escapeAttribute(
                                material.path
                            )}"
                        >
                    </audio>

                </div>
            `;
        }


        // -----------------------------------------------------
        // EXTERNAL
        // -----------------------------------------------------

        if (
            material.type === "external" &&
            material.url
        ) {

            return `
                <div class="viewer-media">

                    <iframe
                        class="viewer-iframe"
                        src="${this.escapeAttribute(
                            material.url
                        )}"
                        allow="fullscreen"
                        allowfullscreen
                        frameborder="0"
                    ></iframe>

                </div>
            `;
        }


        // -----------------------------------------------------
        // НЕИЗВЕСТНЫЙ МАТЕРИАЛ
        // -----------------------------------------------------

        return `
            <div class="viewer-error">

                <div class="viewer-error-icon">
                    ⚠️
                </div>

                <h2>
                    Не удалось открыть материал
                </h2>

                <p>
                    Для этого материала ещё не настроен
                    источник или формат просмотра.
                </p>

                <button
                    class="primary-button"
                    onclick="App.backToLesson()"
                >
                    Вернуться к уроку
                </button>

            </div>
        `;
    },


    // =========================================================
    // FULLSCREEN
    // =========================================================

    toggleFullscreen() {

        const element =
            document.getElementById(
                "viewer-content"
            );


        if (!element) {
            return;
        }


        if (!document.fullscreenElement) {

            if (element.requestFullscreen) {
                element.requestFullscreen();
            }

        } else {

            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    },


    // =========================================================
    // НАСТРОЙКА VIEWER
    // =========================================================

    setupViewer() {

        const video =
            document.getElementById(
                "main-video"
            );


        if (!video) {
            return;
        }


        video.addEventListener(
            "error",
            () => {

                console.error(
                    "Не удалось загрузить локальное видео:",
                    video.currentSrc
                );

            }
        );
    },


    // =========================================================
    // НАЗАД
    // =========================================================

    backToLesson() {

        if (!this.currentLesson) {
            this.goHome();
            return;
        }


        window.location.hash =
            `lesson/${this.currentLesson.id}`;
    },


    goHome() {
        window.location.hash = "";
    },


    // =========================================================
    // СТАТУСЫ
    // =========================================================

    getUpcomingLesson() {

        const today =
            this.getTodayString();


        return this.lessons
            .filter(
                lesson =>
                    lesson.date >= today
            )
            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
            )[0] || null;
    },


    getLessonStatus(lesson) {

        const today =
            this.getTodayString();


        if (lesson.date < today) {

            return {
                label: "Прошёл",
                className: "status-past"
            };

        }


        if (lesson.date === today) {

            return {
                label: "Сегодня",
                className: "status-today"
            };

        }


        return {
            label: "Предстоящий",
            className: "status-upcoming"
        };
    },


    getTodayString() {

        const date =
            new Date();


        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        return `${year}-${month}-${day}`;
    },


    // =========================================================
    // ДАТЫ
    // =========================================================

    formatDateShort(dateString) {

        const date =
            new Date(
                `${dateString}T00:00:00`
            );


        return new Intl.DateTimeFormat(
            "ru-RU",
            {
                day: "numeric",
                month: "long"
            }
        ).format(date);
    },


    formatDateLong(dateString) {

        const date =
            new Date(
                `${dateString}T00:00:00`
            );


        return new Intl.DateTimeFormat(
            "ru-RU",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(date);
    },


    // =========================================================
    // ИКОНКИ
    // =========================================================

    getMaterialIcon(type) {

        const icons = {

            video: "🎬",

            presentation: "🖥️",

            game: "🎮",

            document: "📄",

            poster: "🖼️",

            audio: "🔊",

            external: "🔗"

        };


        return icons[type] || "📎";
    },


    // =========================================================
    // ОШИБКИ
    // =========================================================

    showError(title, message) {

        const app =
            document.getElementById(
                "app"
            );


        if (!app) {
            return;
        }


        app.innerHTML = `

            <div class="error-page">

                <div class="error-icon">
                    ⚠️
                </div>

                <h1>
                    ${this.escapeHtml(title)}
                </h1>

                <p>
                    ${this.escapeHtml(message)}
                </p>

                <button
                    class="primary-button"
                    onclick="location.reload()"
                >
                    Обновить страницу
                </button>

            </div>

        `;
    },


    showNotFound() {

        const app =
            document.getElementById(
                "app"
            );


        if (!app) {
            return;
        }


        app.innerHTML = `

            <div class="error-page">

                <div class="error-icon">
                    🔎
                </div>

                <h1>
                    Урок или материал не найден
                </h1>

                <p>
                    Возможно, ссылка устарела
                    или материал был удалён.
                </p>

                <button
                    class="primary-button"
                    onclick="App.goHome()"
                >
                    На главную
                </button>

            </div>

        `;
    },


    // =========================================================
    // БЕЗОПАСНЫЙ ВЫВОД
    // =========================================================

    escapeHtml(value) {

        if (
            value === undefined ||
            value === null
        ) {
            return "";
        }


        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    },


    escapeAttribute(value) {
        return this.escapeHtml(value);
    }
};


// =============================================================
// ЗАПУСК
// =============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        App.init();
    }
);