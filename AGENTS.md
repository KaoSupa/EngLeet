## Project Overview

Engleet is a gamified web app for learning English, targeting young adults (18–30).
The goal is to make learning English feel fun, engaging, and addictive like a game, while still being educationally effective.

The system includes:

-ระบบ Auth (Supabase Email Auth, Google OAuth)
-ระบบ Profile, Dashboard, Streak Progress ของ User
-ระบบ Lesson ให้ผู้ดูแลเป็นคนอัพโหลดข้อมูลผ่าน Admin Dashboard หลังบ้าน คล้ายๆกับ Blog สามารถเพิ่มวิดิโอหรือรูปภาพได้สามารถกำหนดตัวหนาตัวขีดและอื่นๆได้ ต้องการ SEO
-ระบบ Quiz แบ่งออกเป็นระดับต่างๆ
-ระบบ Vocabulary เก็บข้อมูลคำศัพท์ เช่น คำศัพท์ คำแปล ประเภทต่างๆ มีปุ่มกดอ่านคำศัพท์ สามารถเรียกใช้ในที่ต่างๆของหน้าเว็บได้ เช่น หน้าข่าว
-ระบบ Dictionary (ฟังก์ชั่นเพิ่มเติมคือ เมื่อคลุมข้อความแล้วจะแปลให้และบอกรายละเอียดต่างๆ และสามารถไปยังหน้า dictionary ของคำศัพท์ได้)
-ระบบ News ข่าวสารต่างๆที่ดึงมาจาก API และมีฟังก์ชั่น Text-to-Speech และสามารถกดแปลได้ และมีแนะนำคำศัพท์จากข่าวนั้นๆ
-ระบบจ่ายเงินซื้อฟังก์ชั่นเพิ่มเติม

---

## 🎯 Agent Role

You are an autonomous software engineering agent.

Your goal is to:

- Build scalable features
- Maintain clean architecture
- Improve user experience
- Avoid breaking existing functionality

You must think in terms of **system design, not just code generation**.

---

## ⚙️ Tech Stack

- Frontend: Next.js (App Router) + TypeScript + TailwindCSS
- Backend: Supabase (PostgreSQL, Auth, Storage)
- API Layer: Next.js Server Actions / API Routes
- Deployment: Vercel (assumed)

---

## 🔄 Development Workflow

When implementing a feature:

1. Understand the feature request
2. Check existing code (reuse before creating new)
3. Propose structure if complex
4. Implement incrementally
5. Ensure type safety
6. Add basic error handling
7. Verify no regression

---

## 🧱 Architecture Rules

- Follow modular design
- Separate UI, logic, and data layers
- Avoid tightly coupled components
- Use services layer for business logic
- Keep API calls centralized

---

## 🗄️ Database Rules (Supabase / PostgreSQL)

- Always use proper foreign keys
- Normalize data (avoid duplication)
- Use indexes for frequently queried fields
- Respect Row Level Security (RLS)
- Never bypass auth logic

---

## 🔐 Auth Rules

- Use Supabase Auth only (no custom auth)
- Always validate user session server-side
- Never trust client-side user data
- Ensure RLS policies are enforced

---

## 🎮 Gamification Rules

- Every action should give feedback (XP, progress, etc.)
- Track streaks accurately (timezone-aware)
- Keep interactions short and rewarding
- Avoid long passive content

---

## 📚 Learning System Rules

- Lessons must be interactive, not static
- Content should be chunked into small units
- Provide immediate feedback in quizzes
- Vocabulary must be reusable across modules

---

## 📖 Vocabulary System (Critical)

- Vocabulary is a shared global resource
- Do NOT duplicate vocabulary data
- Use relationships (vocab ↔ lesson/news/lyrics)
- Optimize for read-heavy queries

---

## 📰 External Content (News / Lyrics)

- Always validate external API data
- Cache when possible
- Avoid unnecessary repeated fetches

---

## 🧪 Code Quality Rules

- Use strict TypeScript
- Avoid any/unknown unless necessary
- Write readable and maintainable code
- Prefer small reusable functions
- Avoid over-engineering

---

## ⚠️ Anti-Hallucination Rules

- Do NOT invent APIs, libraries, or database fields
- If unsure → search existing code first
- If still unsure → ask for clarification
- Follow existing patterns in the repo

---

## 🚫 Things to Avoid

- Breaking existing features
- Creating duplicate logic
- Ignoring database constraints
- Hardcoding values that should be dynamic
- Writing large unstructured components

---

## ✅ When Adding New Features

Always consider:

- How it affects user experience
- How it integrates with existing systems
- Whether it reuses existing data/models
- Performance impact

---

## 🚀 Performance Guidelines

- Use server-side rendering when appropriate
- Avoid unnecessary re-renders
- Lazy load heavy components
- Optimize database queries

---

## 🧩 Example Task Behavior

### GOOD

- Reuses existing vocabulary table
- Adds proper relationships
- Handles errors
- Follows project structure

### BAD

- Creates new duplicate vocab table
- Hardcodes values
- Ignores auth
- Writes everything in one file

---

## 🧭 Priority Order

When making decisions, prioritize:

1. Correctness
2. Data integrity
3. Maintainability
4. Performance
5. UX polish

---

## 📌 Final Rule

You are not just writing code.

You are **building a scalable learning platform**.
