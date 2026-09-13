const App = {
    lessons: [],
    currentLesson: null,

    async init() {
        try {
            const response = await fetch("data/lessons.json");

            if (!response.ok) {
                throw new Error("Не удалось загрузить lessons.json");
            }

            const data = await response.json();

            this.lessons = Array.isArray(data)
                ? data
                : (data.lessons || []);

            this.handleRoute();

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

    handleRoute() {
        const hash = window.location.hash;

        if (hash.startsWith("#lesson/")) {
            const lessonId = hash.replace("#lesson/", "");
            this.openLesson(lessonId);
        } else {
            this.renderHome();
        }
    },

    // =========================================================
    // ГЛАВНАЯ СТРАНИЦА
    // =========================================================

    renderHome() {
        const app = document.getElementById("app");

        const upcomingLesson = this.getUpcomingLesson();

        app.innerHTML = `
            <div class="page">

                <header class="site-header">
                    <div class="brand">
                        <div class="brand-mark">EDUMSK</div>

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

                    ${upcomingLesson
                ? this.renderUpcomingLesson(upcomingLesson)
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
                            ${this.lessons.length
                ? this.lessons
                    .slice()
                    .sort((a, b) =>
                        a.date.localeCompare(b.date)
                    )
                    .map(lesson =>
                        this.renderLessonCard(lesson)
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
                    onclick="App.openLesson('${lesson.id}')"
                >

                    <div class="upcoming-date">
                        ${this.formatDateLong(lesson.date)}
                    </div>

                    <h1>
                        ${this.escapeHtml(lesson.title)}
                    </h1>

                    ${lesson.subtitle
                ? `
                                <p>
                                    ${this.escapeHtml(lesson.subtitle)}
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
        const status = this.getLessonStatus(lesson);

        return `
            <article
                class="lesson-card"
                onclick="App.openLesson('${lesson.id}')"
            >

                <div class="lesson-card-top">

                    <div class="lesson-date">
                        ${this.formatDateShort(lesson.date)}
                    </div>

                    <div class="lesson-status ${status.className}">
                        ${status.label}
                    </div>

                </div>

                <h2>
                    ${this.escapeHtml(lesson.title)}
                </h2>

                ${lesson.subtitle
                ? `
                            <p>
                                ${this.escapeHtml(lesson.subtitle)}
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
        const lesson = this.lessons.find(item => item.id === id);

        if (!lesson) {
            this.showNotFound();
            return;
        }

        this.currentLesson = lesson;
        this.renderLesson(lesson);
    },

    renderLesson(lesson) {
        const app = document.getElementById("app");

        const lessonMaterials = (lesson.materials || []).filter(
            material => material.section !== "teacher"
        );

        const teacherMaterials = (lesson.materials || []).filter(
            material => material.section === "teacher"
        );

        app.innerHTML = `
            <div class="page">

                <header class="site-header">
                    <div class="brand">
                        <button
                            class="back-button"
                            onclick="App.goHome()"
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
                            ${this.formatDateLong(lesson.date)}
                        </div>

                        <h1>
                            ${this.escapeHtml(lesson.title)}
                        </h1>

                        ${lesson.subtitle
                ? `
                                    <p class="lesson-subtitle">
                                        ${this.escapeHtml(lesson.subtitle)}
                                    </p>
                                `
                : ""
            }

                    </div>

                    ${lessonMaterials.length
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
                    .map(material =>
                        this.renderMaterial(material)
                    )
                    .join("")}
                                    </div>

                                </section>
                            `
                : ""
            }

                    ${teacherMaterials.length
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
                    .map(material =>
                        this.renderMaterial(material)
                    )
                    .join("")}
                                    </div>

                                </section>
                            `
                : ""
            }

                    ${lesson.adminFolder
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

    renderMaterial(material) {
        const action = this.getMaterialAction(material);

        return `
            <article class="material-card">

                <div class="material-icon">
                    ${this.getMaterialIcon(material.type)}
                </div>

                <div class="material-content">

                    <h3>
                        ${this.escapeHtml(material.title)}
                    </h3>

                    ${material.description
                ? `
                                <p>
                                    ${this.escapeHtml(material.description)}
                                </p>
                            `
                : ""
            }

                </div>

                ${action}

            </article>
        `;
    },

    getMaterialAction(material) {
        let url = null;

        if (material.url) {
            url = material.url;
        }

        if (
            material.source === "google-drive" &&
            material.driveId
        ) {
            url =
                `https://drive.google.com/file/d/` +
                `${material.driveId}/view`;
        }

        if (material.source === "local" && material.path) {
            url = material.path;
        }

        if (!url) {
            return `
                <div class="material-button disabled">
                    Ссылка пока не добавлена
                </div>
            `;
        }

        return `
            <a
                class="material-button"
                href="${this.escapeAttribute(url)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Открыть →
            </a>
        `;
    },

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
    // СТАТУСЫ
    // =========================================================

    getUpcomingLesson() {
        const today = this.getTodayString();

        return this.lessons
            .filter(lesson => lesson.date >= today)
            .sort((a, b) =>
                a.date.localeCompare(b.date)
            )[0] || null;
    },

    getLessonStatus(lesson) {
        const today = this.getTodayString();

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
        const date = new Date();

        const year = date.getFullYear();
        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    },

    // =========================================================
    // ДАТЫ
    // =========================================================

    formatDateShort(dateString) {
        const date = new Date(
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
        const date = new Date(
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
    // НАВИГАЦИЯ
    // =========================================================

    goHome() {
        window.location.hash = "";
    },

    // =========================================================
    // ОШИБКИ
    // =========================================================

    showError(title, message) {
        const app = document.getElementById("app");

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
        const app = document.getElementById("app");

        app.innerHTML = `
            <div class="error-page">

                <div class="error-icon">
                    🔎
                </div>

                <h1>
                    Урок не найден
                </h1>

                <p>
                    Возможно, ссылка устарела или урок был удалён.
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
    // БЕЗОПАСНЫЙ ВЫВОД ТЕКСТА
    // =========================================================

    escapeHtml(value) {
        if (value === undefined || value === null) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    escapeAttribute(value) {
        return this.escapeHtml(value);
    }
};


// Запуск приложения
document.addEventListener("DOMContentLoaded", () => {
    App.init();
}); ww