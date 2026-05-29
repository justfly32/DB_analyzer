# SQL AI Generator

PostgreSQL 데이터베이스 스키마 분석 및 AI 기반 SQL 쿼리 생성 도구.

## Features

- **DB 스키마 자동 탐색** — PostgreSQL `information_schema`에서 테이블/컬럼/타입/코멘트 자동 수집
- **테이블 정리** — 사용할 테이블 선택/필터링, 프리셋 저장/불러오기
- **SQL 생성** — 선택한 컬럼 기반 SELECT 쿼리 자동 생성 (멀티테이블)
- **데이터 미리보기** — 각 테이블의 첫 행 데이터 조회 및 CSV 저장
- **관계 분석** — FK 자동 탐지, 동일 컬럼명 분석, 값 중복 검증, JOIN SQL 생성
- **데이터 조회** — 생성된 SQL 실행, 결과 테이블 뷰 및 CSV 다운로드
- **관계 분석** — 테이블 간 FK 자동 탐지, 필드 유사도 분석, 값 중복 검증
- **AI 프롬프트 생성** — 전체 스키마 + 관계 정보를 포함한 분석 프롬프트 자동 구성

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, TailwindCSS 4
- **Backend**: Express 4, TypeScript (tsx)
- **Database**: PostgreSQL (pg), SQLite3 (설정/관계 저장)
- **AI**: Google Gemini API (옵션)

## Quick Start

```bash
# Install dependencies
npm install

# Set Gemini API key (optional — for AI features)
# Create .env.local with:
GEMINI_API_KEY=your_key_here

# Start dev server (backend + frontend)
npm run dev
```

Open http://localhost:5173

## Usage

1. **환경 설정** — DB 연결 정보 입력 후 연결
2. **테이블 정리** — 분석할 테이블 선택
3. **SQL 생성** — 컬럼 선택 후 SQL 자동 생성
4. **데이터 미리보기** — 각 테이블 데이터 확인
5. **관계 분석** — FK/유사도 기반 관계 탐색
6. **데이터 조회** — SQL 실행 및 결과 확인

## Project Structure

```
├── server.ts          # Express API (schema, query, FK, sample data, settings)
├── src/
│   ├── App.tsx        # Main React component (all UI + state)
│   ├── main.tsx       # Entry point
│   └── index.css      # Tailwind styles
├── workspace.db       # SQLite (settings, relationships, presets)
├── package.json
├── tsconfig.json
└── vite.config.ts
```
