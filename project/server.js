
const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 3000;

// Настройки EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Главная страница
app.get("/", async (req, res) => {
    try {
        const places = await db.getCollection("places")
            .find({})
            .sort({ id: 1 })
            .toArray();

        res.render("index", {
            title: "Тур-гид по Астане",
            places: places
        });
    } catch (error) {
        console.error("Ошибка загрузки мест:", error.message);
        res.status(500).send(
            "Не удалось загрузить достопримечательности. Проверьте подключение к базе."
        );
    }
});

// Страница добавления
app.get("/add", (req, res) => {
    res.render("add", {
        title: "Добавить место",
        errors: [],
        formData: {}
    });
});

// Добавление места в MongoDB
app.post("/add", async (req, res) => {
    try {
        const { title, description, category, time, image } = req.body;
        const errors = [];

        if (!title || title.trim().length < 8) {
            errors.push("Название должно содержать минимум 8 символов.");
        }

        if (!description || description.trim().length < 10) {
            errors.push("Описание должно содержать минимум 10 символов.");
        }

        if (!category || category.trim() === "") {
            errors.push("Укажите категорию.");
        }

        if (!time || time.trim() === "") {
            errors.push("Укажите время посещения.");
        }

        if (errors.length > 0) {
            return res.status(400).render("add", {
                title: "Добавить место",
                errors: errors,
                formData: req.body
            });
        }

        const placesCollection = db.getCollection("places");

        // Находим последний ID
        const lastPlace = await placesCollection
            .find({})
            .sort({ id: -1 })
            .limit(1)
            .toArray();

        const newId = lastPlace.length > 0
            ? Number(lastPlace[0].id) + 1
            : 1;

        const newPlace = {
            id: newId,
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            time: time.trim(),
            image: image ? image.trim() : ""
        };

        // Сохраняем запись в облачную базу
        await placesCollection.insertOne(newPlace);

        res.redirect("/");
    } catch (error) {
        console.error("Ошибка сохранения:", error.message);
        res.status(500).send(
            "Не удалось сохранить место. Попробуйте позже."
        );
    }
});

// Страница отдельной достопримечательности
app.get("/place/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        const place = await db.getCollection("places").findOne({
            id: id
        });

        if (!place) {
            return res.status(404).render("404", {
                title: "Страница не найдена"
            });
        }

        res.render("place", {
            title: place.title,
            place: place
        });
    } catch (error) {
        console.error("Ошибка загрузки места:", error.message);
        res.status(500).send("Не удалось загрузить страницу.");
    }
});

// Страница «О проекте»
app.get("/about", (req, res) => {
    res.render("about", {
        title: "О проекте"
    });
});

// Страница 404
app.use((req, res) => {
    res.status(404).render("404", {
        title: "Страница не найдена"
    });
});

// Подключаем базу перед запуском сервера
async function startServer() {
    try {
        await db.connect();

        app.listen(PORT, () => {
            console.log("Облачная база подключена!");
            console.log(`Сайт запущен: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Ошибка запуска сервера:", error.message);
    }
}

startServer();
