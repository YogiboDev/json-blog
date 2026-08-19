const fs = require('fs');
const path = require('path');

const POSTS_FILE = path.join(__dirname, '..', 'data', 'posts.json');
const COMMENTS_FILE = path.join(__dirname, '..', 'data', 'comments.json');

function readJson(file) {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, 'utf-8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(items) {
  const max = items.reduce((m, item) => {
    const n = parseInt(item.id, 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return String(max + 1);
}

// --- Posts ---

function getAllPosts() {
  const posts = readJson(POSTS_FILE);
  return posts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getPostById(id) {
  return readJson(POSTS_FILE).find((p) => p.id === String(id)) || null;
}

function createPost({ title, content, author, tags }) {
  const posts = readJson(POSTS_FILE);
  const post = {
    id: nextId(posts),
    title: title.trim(),
    content: content.trim(),
    author: (author && author.trim()) || '匿名',
    date: new Date().toISOString(),
    tags: (tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  };
  posts.push(post);
  writeJson(POSTS_FILE, posts);
  return post;
}

function deletePost(id) {
  const posts = readJson(POSTS_FILE).filter((p) => p.id !== String(id));
  writeJson(POSTS_FILE, posts);
  const comments = readJson(COMMENTS_FILE).filter((c) => c.postId !== String(id));
  writeJson(COMMENTS_FILE, comments);
}

function searchPosts(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return getAllPosts().filter((p) => {
    const haystack = `${p.title} ${p.content} ${(p.tags || []).join(' ')}`.toLowerCase();
    return haystack.includes(q);
  });
}

function getPostsByDate(dateStr) {
  return getAllPosts().filter((p) => p.date.slice(0, 10) === dateStr);
}

// --- Comments ---

function getCommentsByPostId(postId) {
  return readJson(COMMENTS_FILE)
    .filter((c) => c.postId === String(postId))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function addComment(postId, { name, message }) {
  const comments = readJson(COMMENTS_FILE);
  const comment = {
    id: nextId(comments),
    postId: String(postId),
    name: (name && name.trim()) || '匿名',
    message: message.trim(),
    date: new Date().toISOString(),
  };
  comments.push(comment);
  writeJson(COMMENTS_FILE, comments);
  return comment;
}

function getCommentCounts() {
  const comments = readJson(COMMENTS_FILE);
  return comments.reduce((counts, c) => {
    counts[c.postId] = (counts[c.postId] || 0) + 1;
    return counts;
  }, {});
}

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  deletePost,
  searchPosts,
  getPostsByDate,
  getCommentsByPostId,
  addComment,
  getCommentCounts,
};
