# Graph Report - .  (2026-08-19)

## Corpus Check
- Corpus is ~5,951 words - fits in a single context window. You may not need a graph.

## Summary
- 36 nodes · 48 edges · 7 communities
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- package.json Metadata
- Server Entry Point
- External Dependencies
- DB Module Setup
- Post/Comment Read Ops
- Post/Comment Write Ops
- Post Query Helpers

## God Nodes (most connected - your core abstractions)
1. `readJson()` - 8 edges
2. `writeJson()` - 4 edges
3. `getAllPosts()` - 4 edges
4. `createPost()` - 4 edges
5. `addComment()` - 4 edges
6. `nextId()` - 3 edges
7. `deletePost()` - 3 edges
8. `scripts` - 3 edges
9. `getPostById()` - 2 edges
10. `searchPosts()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `addComment()` --calls--> `readJson()`  [EXTRACTED]
  lib/db.js → lib/db.js  _Bridges community 4 → community 5_
- `getAllPosts()` --calls--> `readJson()`  [EXTRACTED]
  lib/db.js → lib/db.js  _Bridges community 4 → community 6_

## Import Cycles
- None detected.

## Communities (7 total, 0 thin omitted)

### Community 0 - "package.json Metadata"
Cohesion: 0.25
Nodes (7): description, main, name, scripts, dev, start, version

### Community 1 - "Server Entry Point"
Cohesion: 0.33
Nodes (4): app, db, express, path

### Community 2 - "External Dependencies"
Cohesion: 0.40
Nodes (5): ejs, express, dependencies, ejs, express

### Community 3 - "DB Module Setup"
Cohesion: 0.40
Nodes (4): COMMENTS_FILE, fs, path, POSTS_FILE

### Community 4 - "Post/Comment Read Ops"
Cohesion: 0.40
Nodes (5): deletePost(), getCommentCounts(), getCommentsByPostId(), getPostById(), readJson()

### Community 5 - "Post/Comment Write Ops"
Cohesion: 0.67
Nodes (4): addComment(), createPost(), nextId(), writeJson()

### Community 6 - "Post Query Helpers"
Cohesion: 0.67
Nodes (3): getAllPosts(), getPostsByDate(), searchPosts()

## Knowledge Gaps
- **16 isolated node(s):** `fs`, `path`, `POSTS_FILE`, `COMMENTS_FILE`, `name` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `External Dependencies` to `package.json Metadata`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `POSTS_FILE` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._