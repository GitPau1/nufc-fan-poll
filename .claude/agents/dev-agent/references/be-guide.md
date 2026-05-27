# BE 구현 가이드

> 이 파일은 개발 에이전트의 BE 단계에서만 로드된다.
> 프로젝트 시작 시 기술 스택에 맞게 내용을 채운다.

---

## 프레임워크 및 라이브러리

- **언어/런타임**: (예: Node.js / Python / Go)
- **프레임워크**: (예: Express / FastAPI / Gin)
- **ORM**: (예: Prisma / SQLAlchemy / GORM)
- **인증**: (예: JWT / NextAuth / Passport.js)
- **유효성 검사**: (예: Zod / Pydantic / go-playground/validator)

---

## DB 스키마 원칙

- (예: 마이그레이션 파일은 `/backend/migrations/` 에 저장)
- (예: 모델 파일명은 snake_case)
- (예: 소프트 딜리트 사용 시 `deleted_at` 컬럼 포함)

---

## API 작성 원칙

- RESTful 컨벤션 준수
- 응답 형식 통일:
  ```json
  { "data": ..., "error": null }
  { "data": null, "error": { "code": "...", "message": "..." } }
  ```
- 인증이 필요한 라우트는 미들웨어 명시

---

## 폴더 구조 컨벤션

```
/backend
  ├── /routes
  ├── /controllers
  ├── /models (또는 /schemas)
  ├── /middlewares
  ├── /migrations
  └── /utils
```

---

## 환경변수 관리

- `.env.example`에 필요한 변수 목록 기록
- 실제 값은 `.env`에 (gitignore 처리)
