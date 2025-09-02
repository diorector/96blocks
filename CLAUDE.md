# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

15분 단위 시간 관리 플래너 웹 애플리케이션 - Next.js 15와 Supabase를 기반으로 한 PWA

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS
- **Backend/Auth**: Supabase
- **Language**: TypeScript
- **Date Handling**: date-fns

## Development Commands

```bash
# Development
npm run dev          # Start development server

# Build & Production  
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Project Architecture

### Key Directories
- `/app` - Next.js App Router pages and layouts
  - `/auth` - Authentication pages (login, sign-up)
- `/components` - React components
  - `/ui` - Reusable UI components (shadcn/ui)
  - Core components: TimeSlotPlanner, TimeSlotGrid, DayControls, NotificationManager, DataAnalytics
- `/lib` - Utility functions and configurations
  - `/supabase` - Supabase client/server/middleware setup
- `/hooks` - Custom React hooks

### Core Features
1. **Time Tracking**: 15분 단위로 하루를 나누어 활동 기록
2. **Authentication**: Supabase Auth 기반 사용자 인증
3. **Data Persistence**: Supabase Database로 사용자 데이터 저장
4. **Analytics**: 시간 사용 패턴 분석 및 시각화
5. **Notifications**: 브라우저 알림으로 시간 관리 리마인더

### Main Components Flow
- `TimeSlotPlanner` (main container) → manages authentication state and daily sessions
- `DayControls` → handles start/end of day tracking
- `TimeSlotGrid` → displays 96 time slots (15min each) for activity recording
- `DataAnalytics` → analyzes and visualizes time usage patterns

### Database Schema (Supabase)
- `daily_sessions` - 일별 세션 (start_time, end_time)
- `time_slots` - 15분 단위 활동 기록
- User authentication handled by Supabase Auth

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Important Configuration Notes

- TypeScript/ESLint errors are ignored during build (see next.config.mjs)
- PWA manifest configuration in public/manifest.json
- Uses Korean locale (ko) for date formatting