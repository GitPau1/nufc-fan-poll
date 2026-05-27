# 디자인 시스템 인덱스

> 전체 상세: `docs/specs/11-design-system.md`
> LDSG 원본 연구: `design.md`
> 와이어프레임 레퍼런스: `wireframes/prototype.html`

---

## 핵심 토큰 요약

### 색상
```
Primary:        #41b6e6   (Newcastle 하늘색)
Primary dim:    rgba(65,182,230,0.12)
Primary dark:   #1a9fd4
Background:     #f2f3f5   (전체 배경)
Surface:        #ffffff   (카드·헤더)
Black:          #111111
Gray-2:         #666666   (설명 텍스트)
Gray-3:         #a8a8a8   (힌트·메타)
Gray-4:         #d4d4d4   (테두리)
Disabled:       #ebebeb
Positive:       #2e9e4f / dim: #e6f4ea
Negative:       #d93025 / dim: #fce8e6
```

### Radius
```
3px  — 스켈레톤 등 소형
5px  — 버튼, 입력창, 옵션 버튼  ← 가장 많이 사용
7px  — 카드 (poll-card, 결과 카드)
12px — Bottom Sheet 상단, 모달
pill — Chip, dot 인디케이터, 플로팅 버튼
```

### Shadow (배경별 분리)
```
on-gray 배경(#f2f3f5) 위:
  g200: 0px 1px 4px rgba(0,0,0,.06)  ← 카드에 사용

on-white(#fff) 배경 위:
  w100: 0px 0px 2px rgba(0,0,0,.07), 0px 1px 2px rgba(0,0,0,.07)  ← 헤더
  w200: 0px 1px 6px rgba(0,0,0,.12)   ← contained 버튼
  w300: 0px 1px 20px rgba(0,0,0,.07)  ← Bottom Sheet
```

### 타이포그래피
```
폰트: 'Pretendard Variable', Pretendard, -apple-system, sans-serif

title-m  16px / lh 1.3  — 서브헤더, 모달 타이틀
title-s  14px / lh 1.35 — 카드 제목, 리스트 아이템
text-m   15px / lh 1.6  — 버튼 라벨, 옵션 텍스트
text-s   14px / lh 1.65 — 본문, 댓글
text-xs  12px / lh 1.5  — 메타, 부제
text-xxs 11px / lh 1.45 — section-label, 뱃지
```

---

## 컴포넌트 목록

| 컴포넌트 | 설명 | 상세 위치 |
|---------|------|----------|
| `radio-button` | 투표 옵션 선택. 왼쪽 원형 인디케이터 + 라벨. 선택 시 primary-dim 배경 + dot 표시 | 11-design-system.md |
| `btn-contained` | 1차 CTA. primary 배경, radius 5px, shadow w200 | 11-design-system.md |
| `btn-outlined` | 취소·로그아웃. 투명 배경, gray-4 테두리 | 11-design-system.md |
| `btn-ghost` | 닫기 등 서브 액션 | 11-design-system.md |
| `btn-destructive` | 탈퇴·삭제. negative-dim 배경 | 11-design-system.md |
| `btn-full-bleed` | 투표 상세 하단 고정 제출 버튼. border-radius 0, 전체 너비 | 11-design-system.md |
| `chip` | 뱃지·태그. pill radius. 9종 (eval/select/closed/deadline/primary/done/vote/vote-neg/vote-neutral) | 11-design-system.md |
| `poll-card` | 투표 목록 카드. surface 배경, radius 7px, shadow g200 | 11-design-system.md |
| `list-group` / `list-item` | 마이페이지·댓글 목록. 0.5px divider | 11-design-system.md |
| `modal-sheet` | Bottom Sheet. radius 12px top, shadow w300 | 11-design-system.md |
| `text-input` | 댓글 입력창. 1px gray-4 테두리, focus 시 primary border | 11-design-system.md |
| `avatar` | 32px 원형, primary 배경 | 11-design-system.md |
| `section-label` | 섹션 구분 레이블. 11px / 600 / uppercase / gray-3 | 11-design-system.md |

---

## 상태 처리 원칙

색상 변경 없이 **opacity**로만 처리:
- Hover: `opacity: 0.7`
- Pressed: `opacity: 0.5`
- Disabled: `--c-disabled` 배경 + `--c-gray-3` 텍스트

---

## Tailwind 설정 포인트

```js
// tailwind.config.js 핵심 override
colors: { primary: '#41b6e6', 'primary-dark': '#1a9fd4', ... }
borderRadius: { 'sm': '5px', 'md': '7px', 'lg': '12px' }
boxShadow: { 'g200': '0px 1px 4px rgba(0,0,0,.06)', ... }
fontFamily: { sans: ['Pretendard Variable', 'Pretendard', ...] }
```
