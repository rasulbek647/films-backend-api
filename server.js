const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

const CATEGORIES_FILE = path.join(__dirname, 'data', 'categories.json');
const FILMS_FILE = path.join(__dirname, 'data', 'films.json');

// Yordamchi funksiyalar: Ma'lumotlarni o'qish
async function readData(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Faylni o'qishda xatolik (${filePath}):`, error);
    return [];
  }
}

// 1. Filmlar ro'yxati API: GET /api/films
app.get('/api/films', async (req, res) => {
  try {
    const [films, categories] = await Promise.all([
      readData(FILMS_FILE),
      readData(CATEGORIES_FILE)
    ]);

    // Har bir filmga uning to'liq kategoriyasini bog'lash
    const populatedFilms = films.map(film => {
      const category = categories.find(cat => cat.id === film.category_id) || null;
      
      // Yangi obyekt qaytaramiz (redunant category_id maydonini o'chirib)
      const { category_id, ...filmWithoutCategoryId } = film;
      return {
        ...filmWithoutCategoryId,
        category: category
      };
    });

    res.json(populatedFilms);
  } catch (error) {
    res.status(500).json({ error: "Filmlarni yuklashda xatolik yuz berdi" });
  }
});

// 2. Film kategoriyalari API: GET /api/categories
app.get('/api/categories', async (req, res) => {
  try {
    const [films, categories] = await Promise.all([
      readData(FILMS_FILE),
      readData(CATEGORIES_FILE)
    ]);

    // Har bir kategoriya uchun unga tegishli filmlar sonini hisoblash
    const categoriesWithCount = categories.map(category => {
      const filmsCount = films.filter(film => film.category_id === category.id).length;
      return {
        ...category,
        films_count: filmsCount
      };
    });

    res.json(categoriesWithCount);
  } catch (error) {
    res.status(500).json({ error: "Kategoriyalarni yuklashda xatolik yuz berdi" });
  }
});

// Serverni ishga tushirish
app.listen(PORT, () => {
  console.log(`Server muvaffaqiyatli ishga tushdi.`);
  console.log(`Filmlar API: http://localhost:${PORT}/api/films`);
  console.log(`Kategoriyalar API: http://localhost:${PORT}/api/categories`);
});
