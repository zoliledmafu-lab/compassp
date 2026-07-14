# Compass — User Guide

## Getting Started

### Creating an Account

1. Go to **https://compassp.vercel.app**
2. Click **Create an account** on the login screen.
3. Enter your name, email, school name, and choose your curriculum (ZIMSEC or Cambridge).
4. Select your role: **Student** or **Teacher/Admin**.
5. Click **Sign up**. You will be taken through a short welcome tour.

### Logging In

- Enter your email and password, then click **Sign in**.
- Use **Continue with Google** to sign in with your school Google account.
- Tick **Remember me** to stay logged in across sessions.

### Demo Access (no account needed)

Click **Student Demo** or **Admin Demo** on the login screen to instantly fill demo credentials. This mode uses local storage — no data is saved to the server.

---

## For Students

### Starting a Tutoring Session

1. From the **Dashboard**, click a subject tile (e.g., Mathematics, Science, History).
2. Select your level (O-Level, A-Level, etc.).
3. Type your question in the chat box and press **Send** or hit Enter.

### How the AI Tutor Works

Compass uses a **four-level Socratic approach** — it guides you to the answer rather than giving it directly:

| Level | What happens |
|-------|-------------|
| 1 | Clarifying question — checks what you already know |
| 2 | Hint — points you in the right direction |
| 3 | Partial worked example — shows one step |
| 4 | Full worked example — only after three failed attempts |

If you type "just give me the answer," the AI will give you a hint instead and explain why working through it yourself leads to better understanding.

### Changing Language

Click the language selector in the top navigation bar to switch between:
- English
- Shona (ChiShona)
- Ndebele (isiNdebele)

The AI tutor will respond in your chosen language.

### Offline Mode

If you lose internet connection, Compass automatically switches to **Offline Mode** using a smaller AI model that runs entirely in your browser. Note: offline responses are lower quality than online responses. A banner is displayed when offline mode is active.

On first use, the offline model (230 MB) is downloaded and cached — this requires a one-time internet connection.

### Voice Feature

Click the microphone icon in the chat bar to hear the AI tutor's response read aloud. Requires a live internet connection.

---

## Study Canvas

### Opening the Canvas

Click **Canvas** in the left sidebar (or bottom navigation on mobile) to open the Study Canvas.

### First-Time Tour

A 6-step guided tour appears on your first visit to the Canvas. Follow the arrows to learn the basic controls. To replay the tour, click **Help → Restart Tour** (if available).

### Adding Widgets

Click the **+** button or the widget palette to add a widget:

| Widget | Use |
|--------|-----|
| Note | Free-form text note |
| Flashcard | Front/back revision card |
| Mindmap | Branching idea map |
| Equation | LaTeX maths rendering |
| Timer | Study countdown timer |
| Formula | Chemistry / physics formula |
| Checklist | To-do list |
| … | 20+ more widget types |

### Moving and Resizing

- **Drag** a widget to reposition it.
- **Drag the bottom-right corner** of a widget to resize.
- **Double-click** a widget to edit its content.

### Connecting Widgets

Click the small dot on the edge of one widget and drag to another widget to draw a connection line.

### Saving

The canvas saves automatically after each change. Your layout is synced to your account and available on any device.

---

## For Admins / Teachers

### Managing Rules

Go to **Admin → Rules** to create pedagogical rules that apply to all AI tutoring sessions at your school. Rules are plain-English instructions (e.g., "Always use ZIMSEC marking scheme terminology").

### Viewing Analytics

Go to **Admin → Analytics** to see:
- Number of active students this week
- Total tutoring sessions
- Most-used subjects
- Students who attempted to bypass the Socratic method

### Managing Students

Go to **Admin → Students** to view all students registered under your school.

---

## Privacy and Safety

- Compass does not ask students for personal information (home address, phone number, photos).
- All AI responses are filtered for inappropriate content before display.
- If a student appears distressed, the AI redirects them to speak to a trusted adult.
- Student data is stored in Supabase and is only visible to the student and their school's admin.

See [CHILD_SAFETY.md](CHILD_SAFETY.md) for the full child safety architecture.
