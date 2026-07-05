# qr-guide2

COMWEL QR 방문 안내·만족도 조사 PoC 최종 통합 안정판입니다.

## 1. 목적

방문 민원인을 대상으로 방문 전 준비사항을 안내하고, 방문 후 만족도와 불편사항을 수집하여 관리자 화면에서 통계로 확인하는 개인 개발 및 시연용 PoC입니다.

- 방문 전 안내: `index.html`
- 방문 후 만족도 조사: `feedback.html`
- 관리자 통계: `admin.html`
- 설문 저장 API: `api/submit-feedback.js`
- 관리자 조회 API: `api/admin-feedback.js`

## 2. 파일 구조

```text
qr-guide2/
├─ index.html
├─ feedback.html
├─ admin.html
├─ README.md
└─ api/
   ├─ submit-feedback.js
   └─ admin-feedback.js
```

## 3. Supabase 테이블 생성 SQL

Supabase SQL Editor에서 아래 SQL을 실행합니다.

```sql
create table if not exists qr_feedback (
  id uuid primary key default gen_random_uuid(),
  visit_purpose text not null,
  satisfaction integer not null check (satisfaction between 1 and 5),
  inconvenience text,
  opinion text,
  page_path text,
  qr_source text,
  user_agent text,
  created_at timestamp with time zone default now()
);

alter table qr_feedback enable row level security;
```

이 PoC는 Vercel 서버 함수에서 `SUPABASE_SERVICE_ROLE_KEY`로 저장·조회하므로, service role key를 브라우저 코드에 노출하지 않습니다.

## 4. Vercel 환경변수

Vercel 프로젝트의 Settings → Environment Variables에 아래 값을 입력합니다.

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_TOKEN
```

환경변수를 추가하거나 수정한 뒤에는 반드시 Redeploy를 실행합니다.

## 5. 테스트 주소 예시

```text
방문 전 안내
https://프로젝트명.vercel.app/

방문 후 만족도 조사
https://프로젝트명.vercel.app/feedback.html?qr=counter

관리자 통계
https://프로젝트명.vercel.app/admin.html
```

## 6. QR 구분값 예시

```text
feedback.html?qr=entrance
feedback.html?qr=counter
feedback.html?qr=sanjae
feedback.html?qr=join
feedback.html?qr=certificate
```

## 7. 개인정보 보호 원칙

이 프로젝트는 개인정보를 수집하지 않습니다.

입력 금지 항목:

- 이름
- 전화번호
- 주민등록번호
- 주소
- 이메일
- 계좌번호
- 사업자번호

서버 함수에서 전화번호, 주민등록번호, 이메일, 사업자번호, 긴 숫자열, 일부 주소 표현을 1차 차단합니다. 다만 정규식 차단은 완벽하지 않으므로 실제 운영 전에는 기관 보안 기준과 담당자 검토가 필요합니다.

## 8. GitHub 반영 순서

1. GitHub에서 `qr-guide2` 저장소 생성
2. 이 파일들을 저장소에 업로드
3. Commit changes 실행
4. Vercel에서 새 프로젝트로 GitHub 저장소 연결
5. Supabase 테이블 생성
6. Vercel 환경변수 입력
7. Redeploy
8. `feedback.html?qr=counter`에서 설문 제출 테스트
9. `admin.html`에서 관리자 조회 테스트

## 9. 운영 한계

본 프로젝트는 개인 개발 및 시연용 PoC입니다. 공식 민원 접수, 처분 판단, 법적 판단, 상담 결과를 대체하지 않습니다. 모든 안내와 통계는 서비스 개선 참고자료이며, 담당자 최종 확인이 필요합니다.
