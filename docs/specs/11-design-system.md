# 11 — 디자인 시스템

LDSG(LINE Design System for Global Family Service) 기반으로,
Newcastle United 브랜드 색상을 적용한 커스텀 디자인 시스템.

> 레퍼런스: `design.md` (LDSG 원본 연구 자료)
> 와이어프레임: `wireframes/prototype.html`

---

## 브랜딩 결정사항

| 항목 | 결정 | 이유 |
|------|------|------|
| Primary 색 | `#41b6e6` (Newcastle 하늘색) | LDSG의 LINE Green 자리를 대체 |
| 테마 | 라이트 모드 우선 | 다크 모드는 MVP 이후 |
| 언어/폰트 | Pretendard Variable (한국어) | LDSG KR 폴백 권장 폰트 |
| 기본 배경 | `#fafafa` | LDSG on-gray 그룹 표면 |

---

## 색상 토큰

```css
/* Brand */
--c-primary:       #41b6e6;   /* Newcastle 하늘색 */
--c-primary-dim:   rgba(65,182,230,0.12);  /* 선택 배경, 강조 배경 */
--c-primary-dark:  #1a9fd4;   /* 텍스트·아이콘 위 primary */
--c-primary-on:    #ffffff;   /* primary 배경 위 텍스트 */

/* Neutral */
--c-black:         #111111;   /* 본문 텍스트 */
--c-gray-1:        #333333;
--c-gray-2:        #666666;   /* 부제, 설명 */
--c-gray-3:        #a8a8a8;   /* 힌트, 메타 */
--c-gray-4:        #e1e7ef;   /* 테두리, 구분선 */
--c-disabled:      #ebebeb;   /* 비활성 배경 */

/* Surface */
--c-bg:            #fafafa;   /* 전체 배경 (on-gray 표면) */
--c-surface:       #ffffff;   /* 카드, 입력창, 헤더 */

/* Role */
--c-positive:      #2e9e4f;
--c-positive-dim:  #e6f4ea;
--c-negative:      #d93025;
--c-negative-dim:  #fce8e6;
```

### 상태 처리 원칙 (LDSG)
색상을 바꾸지 않고 **opacity**로 표현:
- Normal: `opacity: 1`
- Hover: `opacity: 0.7`
- Pressed: `opacity: 0.5`
- Disabled: `--c-disabled` 배경 + `--c-gray-3` 텍스트

---

## 타이포그래피

폰트: `'Pretendard Variable', Pretendard, -apple-system, sans-serif`

LDSG 구분: **Title** (좁은 line-height, 제목·리스트 타이틀) / **Text** (넓은 line-height, 본문·버튼 라벨)

| 토큰 | px | line-height | 용도 |
|------|----|-------------|------|
| `title-xl` | 20px | 1.2 | 랜딩 헤드라인 |
| `title-l` | 18px | 1.25 | 섹션 제목, 모달 타이틀 |
| `title-m` | 16px | 1.3 | 서브 헤더, 카드 제목 |
| `title-s` | 14px | 1.35 | 리스트 아이템 제목, 카드 제목 |
| `title-xs` | 12px | 1.4 | 소형 라벨 |
| `text-m` | 15px | 1.6 | 버튼 라벨, 옵션 텍스트 |
| `text-s` | 14px | 1.65 | 본문, 댓글, 설명 |
| `text-xs` | 12px | 1.5 | 부제, 메타 정보 |
| `text-xxs` | 11px | 1.45 | section-label, 뱃지 |

---

## Radius 토큰 (LDSG ldsg-radius-* 스케일)

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| `--r-xs` | 8px | 스켈레톤 플레이스홀더, 작은 배지 |
| `--r-sm` | 10px | 버튼, 입력창, 옵션 버튼 |
| `--r-md` | 12px | 카드, 선수 정보 영역, 결과 카드 |
| `--r-lg` | 16px | Bottom Sheet, 모달 상단 |
| `--r-pill` | 9999px | Chip, Dot 인디케이터, 플로팅 버튼 |

---

## Shadow 토큰 (LDSG 배경별 분리)

배경색에 따라 그림자 그룹을 나눠 사용한다.

```css
/* On White (#ffffff) 배경 위 컴포넌트 */
--sh-w100: 0px 0px 2px rgba(0,0,0,.07), 0px 1px 2px rgba(0,0,0,.07);  /* 헤더, 소형 컴포넌트 */
--sh-w200: 0px 1px 6px rgba(0,0,0,.12);   /* 버튼 (contained), Google 로그인 버튼 */
--sh-w300: 0px 1px 20px rgba(0,0,0,.07);  /* Bottom Sheet, 대형 카드 */

/* On Gray (#fafafa) 배경 위 컴포넌트 */
--sh-g100: 0px 0px 1px rgba(0,0,0,.05), 0px 1px 1px rgba(0,0,0,.05);  /* 소형 */
--sh-g200: 0px 1px 4px rgba(0,0,0,.06);   /* 투표 카드, 결과 카드, 프로필 카드 */
--sh-g300: 0px 1px 15px rgba(0,0,0,.04);  /* 대형 시트 */
```

> 원칙: `--c-bg` (#fafafa) 배경이면 `sh-g*`, `--c-surface` (#ffffff) 배경이면 `sh-w*`

---

## 컴포넌트 패턴

### radio-button (투표 옵션 선택)

```
( ) 재계약    ← 미선택: 회색 테두리 원 + 회색 border
(●) 보류     ← 선택: primary 원 dot + primary border + primary-dim 배경
( ) 방출
```

```css
/* 컨테이너 */
border: 1px solid var(--c-gray-4);
border-radius: var(--r-sm);    /* 10px */
padding: 14px 16px;
background: var(--c-surface);

/* 선택 시 */
border-color: var(--c-primary);
background: var(--c-primary-dim);

/* 인디케이터 (20px 원) */
/* 선택 시: ::after { 9px dot, background: primary } */
```

### action-button 3종

| 타입 | 배경 | 텍스트 | 테두리 | 사용처 |
|------|------|--------|--------|--------|
| contained | `--c-primary` | `--c-primary-on` | 없음 | 1차 CTA |
| outlined | transparent | `--c-black` | `1px --c-gray-4` | 취소, 로그아웃 |
| ghost | transparent | `--c-gray-2` | 없음 | 닫기, 서브 액션 |
| destructive | `--c-negative-dim` | `--c-negative` | `1px rgba(negative,.2)` | 탈퇴, 삭제 |

공통: `border-radius: 10px`, `font-weight: 700`, `font-size: 15px`, `padding: 14px`

### action-button-full-bleed

```css
border-radius: 0;           /* LDSG full-bleed 규칙 */
width: 100%;
padding: 17px;
position: absolute;
bottom: 0; left: 0; right: 0;
background: var(--c-primary);
```

투표 상세 페이지 하단 고정 제출 버튼 전용. 화면 최하단 1차 액션에만 사용.

### chip (뱃지·태그)

```css
border-radius: var(--r-pill);
padding: 3px 9px;
font-size: 11px; font-weight: 600;
```

| 종류 | 배경 | 텍스트 | 사용처 |
|------|------|--------|--------|
| `chip-eval` | `#fff3e0` | `#d46a00` | Type A 투표 |
| `chip-select` | `positive-dim` | `positive` | Type B 투표 |
| `chip-closed` | `disabled` | `gray-3` | 마감 투표 |
| `chip-deadline` | `negative-dim` | `negative` | 마감 D-day |
| `chip-primary` | `primary-dim` | `primary-dark` | 내 선택, 강조 |
| `chip-done` | `positive-dim` | `positive` | 투표 완료 |
| `chip-vote` | `primary-dim` | `primary-dark` | 댓글 투표 뱃지 (재계약 계열) |
| `chip-vote-neg` | `negative-dim` | `negative` | 댓글 투표 뱃지 (방출 계열) |
| `chip-vote-neutral` | `disabled` | `gray-2` | 댓글 투표 뱃지 (보류 계열) |
| `chip-post-official` | `primary-dim` | `primary-dark` | 소식 게시글 유형 (오피셜) |
| `chip-post-info` | `positive-dim` | `positive` | 소식 게시글 유형 (정보) |
| `chip-post-free` | `disabled` | `gray-2` | 소식 게시글 유형 (자유) |

### list-group / list-item

```css
/* list-group */
background: var(--c-surface);
border-radius: var(--r-md);    /* 12px */
overflow: hidden;
box-shadow: var(--sh-g200);    /* on-gray 배경 위 */

/* list-item */
padding: 16px;
display: flex; align-items: center; gap: 12px;

/* 구분선 */
list-item + list-item {
  border-top: 0.5px solid var(--c-disabled);
}
```

마이페이지 참여 투표 목록, 댓글 목록에 사용.

### post-feed / post-card

소식 탭 전용 독립 피드 컴포넌트. 일반 `list-group`의 단순 확장이 아니라, 필터·정렬·작성 진입·임베드·반응을 포함하는 별도 패턴으로 관리한다.

```css
/* feed controls */
background: rgba(250,250,250,.96);
border-bottom: 1px solid rgba(225,231,239,.78);
backdrop-filter: blur(10px);

/* filter tab */
height: 44px;
font-size: 14px;
font-weight: 900;
color: var(--c-gray-2);

/* active filter tab */
color: var(--c-primary-dark);
border-bottom: 3px solid var(--c-primary);

/* sort select */
height: 32px;
border: 1px solid var(--c-gray-4);
border-radius: var(--r-pill);
background: var(--c-surface);

/* feed shell */
background: var(--c-surface);
border: 1px solid var(--c-gray-4);
border-radius: var(--r-md);
box-shadow: var(--sh-g200);

/* post-card */
padding: 16px;
border-bottom: 1px solid var(--c-gray-4);
background: var(--c-surface);
```

`post-card`는 작성자 라인, inline post type chip, 본문, URL 임베드, 반응 행, 작성자 전용 수정/삭제 컨트롤 순서로 배치한다. 작성자 표시는 카드 내부 전용 `post-avatar`를 사용하며, 일반 `avatar`보다 작은 20px 크기를 허용한다. 작성 시각과 수정됨 표시는 작성자 이름 오른쪽의 같은 줄에 둔다.

### post-composer-sheet

소식 작성 전용 Bottom Sheet. `modal-sheet`의 overlay, handle, top radius, shadow 규칙을 따른다.

```css
/* type segmented control */
display: inline-flex;
border: 1px solid var(--c-gray-4);
border-radius: var(--r-sm);
background: var(--c-bg);
padding: 3px;

/* segment */
height: 32px;
border-radius: var(--r-xs);
padding: 0 12px;
font-size: 12px;
font-weight: 700;

/* active segment */
background: var(--c-primary);
color: var(--c-primary-on);

/* textarea / url input */
border: 1px solid var(--c-gray-4);
border-radius: var(--r-sm);
background: var(--c-bg);

/* focus */
border-color: var(--c-primary);
background: var(--c-surface);
```

### post-reaction-chip

소식 카드 내 이모지 반응 버튼. 선택 상태는 contained 버튼처럼 강하게 채우지 않고 chip 계열의 낮은 강조 톤을 사용한다.

```css
height: 32px;
border: 1px solid var(--c-gray-4);
border-radius: var(--r-pill);
background: var(--c-bg);
color: var(--c-gray-2);
font-size: 12px;
font-weight: 900;

/* active */
border-color: rgba(65,182,230,.4);
background: var(--c-primary-dim);
color: var(--c-primary-dark);
```

### post-embed-card

소식 카드에 첨부된 URL 미리보기. 일반 링크, X, YouTube를 지원하되, 실패 시 일반 링크 카드로 대체한다.

```css
margin-top: 12px;
border: 1px solid var(--c-gray-4);
border-radius: var(--r-sm);
background: var(--c-bg);

/* YouTube */
aspect-ratio: 16 / 9;
background: #0c2340;
```

### post-fab

소식 작성 전용 플로팅 버튼. 화면 하단 내비게이션 위에 위치하며, 일반 contained button이나 Bottom Sheet shadow를 재사용하지 않고 FAB 전용 elevation을 사용한다.

```css
width: 54px;
height: 54px;
border-radius: var(--r-pill);
background: var(--c-primary);
color: var(--c-primary-on);
box-shadow: 0 8px 22px rgba(26,159,212,.36);
```

### modal-sheet (Bottom Sheet)

```css
border-radius: 16px 16px 0 0;   /* --r-lg top only */
padding: 20px 20px 40px;
box-shadow: var(--sh-w300);

/* handle bar */
width: 36px; height: 4px;
background: var(--c-gray-4);
border-radius: var(--r-pill);
```

딤드 오버레이 (`rgba(0,0,0,.46)`) + 하단 슬라이드업. 확인 모달, 로그인 유도, 탈퇴 확인에 공통 사용.

### text-input

```css
border: 1px solid var(--c-gray-4);
border-radius: var(--r-sm);    /* 10px */
padding: 11px 13px;
font-size: 14px;

/* focus */
border-color: var(--c-primary);   /* 테두리 색만 변경, glow 없음 */
outline: none;
```

### poll-card (목록 카드)

```css
background: var(--c-surface);
border-radius: var(--r-md);    /* 12px */
overflow: hidden;
box-shadow: var(--sh-g200);    /* on-gray 배경 위 */
```

### poll-carousel-card (투표 상세 캐러셀 카드)

`selection`, `question_targets`, `free_choice`처럼 카드를 넘겨 하나를 선택하는 투표 상세 화면에 사용한다.
사진 위 텍스트 오버레이를 금지하고, 텍스트는 항상 하단 `surface` 정보 패널에 배치한다.

공통 규칙:
- 이미지 영역은 항상 `1:1` 정사각형이다.
- 카드 표면은 `--c-surface`, `border: 1px solid --c-gray-4`, `border-radius: --r-md`, `box-shadow: --sh-g200`.
- 선택 상태는 `border-color: --c-primary` + `3px` inset ring + 우상단 primary check로 표시한다.
- 사이드 카드는 같은 구조를 유지하고 opacity/scale만 낮춘다.
- 이미지가 없으면 클럽 네이비 계열 fallback 배경과 2글자 이니셜을 사용한다.

선수 카드:
```css
/* image */
aspect-ratio: 1 / 1;

/* info */
min-height: 62px;
padding: 10px 12px;

/* title */
font-size: 15px;
font-weight: 900;
line-height: 1.22;
line-clamp: 1;

/* meta */
font-size: 12px;
font-weight: 700;
color: var(--c-gray-2);
```

- 표시 정보는 선수 이름과 포지션만 둔다.
- 등번호는 이미지 좌상단 pill chip에서 1회만 표시한다.
- 선수 후보에는 사용자가 추가로 작성하는 설명 문구가 없으므로 설명 영역을 만들지 않는다.

자유 입력 카드:
```css
/* image */
aspect-ratio: 1 / 1;

/* info */
min-height: 92px;
padding: 10px 12px;

/* title */
font-size: 15px;
font-weight: 900;
line-height: 1.22;
line-clamp: 2;

/* description */
margin-top: 6px;
font-size: 12px;
font-weight: 500;
line-height: 1.36;
line-clamp: 2;
color: var(--c-gray-2);
```

- `자유 선택` 같은 유형 라벨은 카드 내부에 노출하지 않는다.
- 사용자가 입력한 제목과 설명만 보여준다.

### progress

투표 결과 분포, 평점 진행률 등 비율을 표시할 때 사용한다.

```css
height: 8px;
border-radius: var(--r-pill);
background: var(--c-disabled);

/* indicator */
background: var(--c-primary);
transition: transform .2s;
```

### separator

목록 내부 또는 섹션 사이의 구분선. 새 색상을 만들지 않고 `--c-gray-4` 또는 `--c-disabled`를 사용한다.

```css
height: 1px;       /* 필요 시 0.5px border로 대체 */
background: var(--c-gray-4);
```

### app-header / bottom-nav

서비스 공통 내비게이션.

```css
/* app-header */
background: rgba(255,255,255,.95);
border-bottom: 1px solid var(--c-gray-4);
box-shadow: var(--sh-w100);

/* bottom-nav */
background: var(--c-surface);
border-top: 1px solid var(--c-gray-4);

/* active item */
color: var(--c-primary);
```

### transfer-item

이적 탭의 선수 카드. 방향 라벨, 선수 썸네일, 이름, 클럽 정보를 중앙 정렬로 표시한다.

```css
background: var(--c-surface);
border: 1px solid var(--c-gray-4);
border-radius: var(--r-md);
box-shadow: var(--sh-g200);
```

### farewell-card

작별/영입 카드. 이적 방향은 `chip` 톤으로 표현하고, 카드 자체는 `poll-card`와 같은 표면 규칙을 따른다.

```css
background: var(--c-surface);
border-radius: var(--r-md);
box-shadow: var(--sh-g200);
```

### season-stat-card

구단 정보 페이지의 시즌 대표 기록 3열 카드. `최다 출전`, `최다 득점`, `최다 어시`처럼 같은 구조의 요약 지표를 나란히 보여준다.

```css
/* grid */
display: grid;
grid-template-columns: repeat(3, minmax(0, 1fr));
gap: 8px;

/* card */
background: var(--c-surface);
border: 1px solid var(--c-gray-4);
border-radius: var(--r-md);
box-shadow: var(--sh-g200);
padding: 12px 10px;
text-align: center;

/* player image */
width: 64px;
height: 64px;
border-radius: var(--r-pill);
background: var(--c-primary-dim);
```

카드 내부 순서는 label, 선수 이미지, 선수 이름, 수치, 단위로 고정한다. 이름은 한 줄로 줄이고, 수치는 `primary` 색과 강한 weight를 사용한다.

### club-status-card

구단 현황처럼 브랜드가 강한 요약 카드. 예외적으로 클럽 네이비 배경 또는 `#0c2340 → #1a3a60` 그라디언트를 허용하되, 내부 보조 카드는 흰색 opacity 표면을 사용한다.

```css
background: #0c2340; /* or linear-gradient(135deg, #0c2340 0%, #1a3a60 100%) */
border-radius: var(--r-lg);
box-shadow: var(--sh-g200);
color: #fff;

/* inner panel */
background: rgba(255,255,255,.08);
border-radius: var(--r-lg);
```

### squad-list

스쿼드 목록은 소식 피드와 같은 underline tab, position header, player row로 구성한다.

```css
/* status tab row */
display: flex;
gap: 16px;
overflow-x: auto;
border-bottom: 1px solid var(--c-gray-4);

/* tab */
height: 44px;
font-size: 14px;
font-weight: 900;
color: var(--c-gray-2);

/* active tab */
color: var(--c-primary-dark);
border-bottom: 3px solid var(--c-primary);

/* group */
background: var(--c-surface);
border: 1px solid var(--c-gray-4);
border-radius: var(--r-md);
```

선수 행 hover/pressed는 색을 바꾸지 않고 opacity로만 표현한다.

### rating-matrix

전체 평가 투표의 반복 입력 패턴. 선수 행과 1-10점 선택 버튼을 묶는다.

```css
/* score option */
border: 1px solid var(--c-gray-4);
border-radius: var(--r-sm);

/* selected */
border-color: var(--c-primary);
background: var(--c-primary-dim);
color: var(--c-primary-dark);
```

### form-section / picker

투표 생성·관리자 폼의 기본 섹션. 선택형 picker는 dashed border를 사용한다.

```css
background: var(--c-surface);
border: 1px solid var(--c-gray-4);
border-radius: var(--r-md);
box-shadow: var(--sh-g200);

/* picker */
border-style: dashed;
```

---

## 아이콘

- LDSG 공식: LAICON 라이브러리 (Next.js 앱에서는 미적용)
- MVP 대체: Lucide React (shadcn/ui 번들 포함)
- 아이콘 크기 기준: 16px(인라인), 18px(버튼), 20px(헤더·강조)

---

## Tailwind 설정 방향

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#41b6e6',
      'primary-dark': '#1a9fd4',
      disabled: '#ebebeb',
      surface: '#ffffff',
      positive: '#2e9e4f',
      negative: '#d93025',
      // ... 위 토큰 그대로 매핑
    },
    borderRadius: {
      'xs': '8px', 'sm': '10px', 'md': '12px', 'lg': '16px',
    },
    boxShadow: {
      'w100': '0px 0px 2px rgba(0,0,0,.07), 0px 1px 2px rgba(0,0,0,.07)',
      'w200': '0px 1px 6px rgba(0,0,0,.12)',
      'g200': '0px 1px 4px rgba(0,0,0,.06)',
      // ...
    },
    fontFamily: {
      sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'sans-serif'],
    },
  },
}
```

shadcn/ui 컴포넌트는 이 토큰을 기반으로 커스터마이징하여 사용.
