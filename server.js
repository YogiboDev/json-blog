const express = require('express');
const path = require('path');
const db = require('./lib/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
app.locals.formatDate = formatDate;

// --- Home: list all posts ---
app.get('/', (req, res) => {
  const posts = db.getAllPosts();
  const commentCounts = db.getCommentCounts();
  res.render('index', {
    posts,
    commentCounts,
    heading: '最新の投稿',
    emptyMessage: 'まだ投稿がありません。',
  });
});

// --- New post form ---
app.get('/new', (req, res) => {
  res.render('new-post', { error: null, categories: db.getCategories() });
});

app.post('/posts', (req, res) => {
  const { title, content, author, tags, category } = req.body;
  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).render('new-post', {
      error: 'タイトルと本文は必須です。',
      categories: db.getCategories(),
    });
  }
  const post = db.createPost({ title, content, author, tags, category });
  res.redirect(`/posts/${post.id}`);
});

// --- Categories ---
app.get('/categories', (req, res) => {
  res.render('categories', { categories: db.getCategories() });
});

app.get('/categories/:category', (req, res) => {
  const category = req.params.category;
  const posts = db.getPostsByCategory(category);
  const commentCounts = db.getCommentCounts();
  res.render('index', {
    posts,
    commentCounts,
    heading: `カテゴリー: 「${category}」`,
    emptyMessage: 'このカテゴリーの記事はまだありません。',
  });
});

// --- Tags ---
app.get('/tags', (req, res) => {
  res.render('tags', { tags: db.getTags() });
});

app.get('/tags/:tag', (req, res) => {
  const tag = req.params.tag;
  const posts = db.getPostsByTag(tag);
  const commentCounts = db.getCommentCounts();
  res.render('index', {
    posts,
    commentCounts,
    heading: `タグ: 「${tag}」`,
    emptyMessage: 'このタグの記事はまだありません。',
  });
});

// --- Search (must come before /posts/:id-like collisions; separate path anyway) ---
app.get('/search', (req, res) => {
  const q = (req.query.q || '').toString();
  const results = q.trim() ? db.searchPosts(q) : [];
  const commentCounts = db.getCommentCounts();
  res.render('index', {
    posts: results,
    commentCounts,
    heading: `検索結果: 「${q}」`,
    emptyMessage: q.trim()
      ? 'キーワードに一致する記事が見つかりませんでした。'
      : '検索キーワードを入力してください。',
    searchQuery: q,
  });
});

// --- Calendar ---
app.get('/calendar', (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = parseInt(req.query.month, 10) || now.getMonth() + 1; // 1-12

  const posts = db.getAllPosts();
  const postDates = new Set(posts.map((p) => p.date.slice(0, 10)));
  const countsByDate = posts.reduce((acc, p) => {
    const d = p.date.slice(0, 10);
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});

  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = firstOfMonth.getDay(); // 0=Sun

  const weeks = [];
  let week = new Array(startWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    week.push({ day, dateStr, count: countsByDate[dateStr] || 0 });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  let prevYear = year, prevMonth = month - 1;
  if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
  let nextYear = year, nextMonth = month + 1;
  if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }

  const selectedDate = (req.query.date || '').toString();
  const selectedPosts = selectedDate ? db.getPostsByDate(selectedDate) : [];
  const commentCounts = db.getCommentCounts();

  res.render('calendar', {
    year,
    month,
    weeks,
    prevYear,
    prevMonth,
    nextYear,
    nextMonth,
    selectedDate,
    selectedPosts,
    commentCounts,
    todayStr: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  });
});

// --- Single post + comments ---
app.get('/posts/:id', (req, res) => {
  const post = db.getPostById(req.params.id);
  if (!post) return res.status(404).render('404');
  const comments = db.getCommentsByPostId(post.id);
  res.render('post', { post, comments, error: null });
});

app.post('/posts/:id/comments', (req, res) => {
  const post = db.getPostById(req.params.id);
  if (!post) return res.status(404).render('404');
  const { name, message } = req.body;
  if (!message || !message.trim()) {
    const comments = db.getCommentsByPostId(post.id);
    return res.status(400).render('post', {
      post,
      comments,
      error: 'コメント内容を入力してください。',
    });
  }
  db.addComment(post.id, { name, message });
  res.redirect(`/posts/${post.id}#comments`);
});

app.post('/posts/:id/delete', (req, res) => {
  const post = db.getPostById(req.params.id);
  if (!post) return res.status(404).render('404');
  db.deletePost(post.id);
  res.redirect('/');
});

app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`Blog server running at http://localhost:${PORT}`);
});
