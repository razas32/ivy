# Ivy - AI Study Assistant

A modern, enterprise-grade web application built with Next.js 16 and React 19 that helps students manage their academic life with AI-powered study tools.

## Features

### Dashboard
- **Academic Overview**: Visual stats showing tasks completed, upcoming deadlines, and active courses
- **Course Management**: Full CRUD operations for courses with color-coded organization
- **Responsive Design**: Clean, modern UI following enterprise design principles

### Course Management (CRUD)
- **Create**: Add new courses with custom colors, deadlines, and task tracking
- **Read**: View all courses in an organized grid layout with progress indicators
- **Update**: Edit course details, colors, and schedules
- **Delete**: Remove courses with confirmation dialog

### AI Study Assistant (Chatbot)
- **Collapsible Interface**: Fixed bottom position that expands on demand
- **Multiple Modes**:
  - Chat: Conversational AI assistance
  - Flashcards: Generate study cards (placeholder)
  - Quizzes: Create practice tests (placeholder)
- **Quick Actions**: One-click buttons for common tasks
- **Privacy-Focused**: Built with user privacy in mind

## Tech Stack

- **Framework**: Next.js 16.0.1 with App Router
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4.1.16
- **Language**: TypeScript 5.9.3
- **Build Tool**: Turbopack (Next.js default)

## Project Structure

```
Ivy/
├── app/
│   ├── layout.tsx          # Root layout with fonts and metadata
│   ├── page.tsx             # Main dashboard page
│   └── globals.css          # Global styles and Tailwind directives
├── components/
│   ├── Sidebar.tsx          # Navigation sidebar with course list
│   ├── StatsCard.tsx        # Reusable stats display component
│   ├── CourseCard.tsx       # Individual course card with CRUD actions
│   ├── CourseModal.tsx      # Modal for creating/editing courses
│   └── ChatBot.tsx          # AI assistant interface
├── lib/
│   └── mockData.ts          # Mock data for courses and stats
├── types/
│   └── index.ts             # TypeScript type definitions
└── public/                  # Static assets
```

## Design System

### Colors
- **Primary**: Green (#008050) - Main brand color
- **Course Colors**: Blue, Purple, Green, Orange, Red, Pink
- **Surface**: Light gray backgrounds for depth
- **Text**: Gray scale for hierarchy

### Components
- **Cards**: Elevated surfaces with hover effects
- **Buttons**: Primary (green) and secondary (gray) variants
- **Inputs**: Clean, focused states with ring effects
- **Modal**: Centered overlay with backdrop blur

### Typography
- **Font**: Inter (loaded from Google Fonts)
- **Hierarchy**: Semibold headings, regular body text
- **Scale**: Responsive sizing for all screen sizes

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd Ivy
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Usage

### Managing Courses

**Add a Course:**
1. Click "Add New Course" button
2. Fill in course code, name, color, total tasks, and due date
3. Click "Add Course"

**Edit a Course:**
1. Hover over a course card
2. Click the edit icon
3. Modify details
4. Click "Save Changes"

**Delete a Course:**
1. Hover over a course card
2. Click the delete icon
3. Confirm deletion

### Using the AI Assistant

1. Click the floating chat button in the bottom-right
2. The chatbot interface expands from the bottom
3. Switch between Chat, Flashcards, and Quizzes tabs
4. Use quick action buttons or type a message
5. Click the down arrow to minimize

## State Management

Currently using React's `useState` for local state management. The application maintains:
- Course list with full CRUD operations
- Dashboard statistics (auto-updated on course changes)
- Modal state for create/edit operations
- Chatbot visibility and tab selection

## Future Enhancements

- [ ] Backend integration with API
- [ ] User authentication
- [ ] Real AI chatbot integration (Claude API)
- [ ] Flashcard generation functionality
- [ ] Quiz generation functionality
- [ ] Task management within courses
- [ ] Calendar view for deadlines
- [ ] File upload for lecture notes
- [ ] Progress tracking and analytics
- [ ] Mobile app version

## Design Philosophy

This project follows enterprise-grade design principles:
- **Component Modularity**: Reusable, single-responsibility components
- **Type Safety**: Full TypeScript coverage
- **Accessibility**: Semantic HTML and keyboard navigation
- **Performance**: Optimized rendering with React best practices
- **Maintainability**: Clear folder structure and naming conventions
- **User Experience**: Intuitive interactions with visual feedback

## License

This project is for educational purposes.

## Acknowledgments

- Design inspired by modern academic management platforms
- Icons from Heroicons (via inline SVG)
- Fonts from Google Fonts (Inter)
