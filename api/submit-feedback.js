const SENSITIVE_PATTERNS = [
  /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/,          // 휴대폰 번호
  /\d{6}[-\s]?[1-4]\d{6}/,                       // 주민등록번호 형태
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,      // 이메일
  /\d{3}[-\s]?\d{2}[-\s]?\d{5}/,                 // 사업자번호 형태
  /\d{2,6}[-\s]?\d{2,6}[-\s]?\d{2,8}/,           // 계좌/긴 숫자열 후보
  /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주).{0,12}(시|군|구|동|로|길)/
];

function reply(res, code, body) {
  return res.status(code).json(body);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} 환경변수가 없습니다.`);
  return value;
}

function hasSensitiveInfo(text = '') {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(String(text)));
}

function cleanText(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

async function insertToSupabase(payload) {
  const url = requireEnv('SUPABASE_URL').replace(/\/$/, '');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const response = await fetch(`${url}/rest/v1/qr_feedback`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase 저장 실패: ${response.status} ${text}`);
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return reply(res, 405, { ok: false, message: 'POST만 지원합니다.' });
    }

    const body = req.body || {};
    const visit_purpose = cleanText(body.visit_purpose, 80);
    const satisfaction = Number(body.satisfaction);
    const inconvenience = cleanText(body.inconvenience || '없음', 80);
    const opinion = cleanText(body.opinion, 500);
    const page_path = cleanText(body.page_path, 300);
    const qr_source = cleanText(body.qr_source || 'unknown', 80);

    if (!visit_purpose) {
      return reply(res, 400, { ok: false, message: '방문 목적을 선택해 주세요.' });
    }

    if (!Number.isInteger(satisfaction) || satisfaction < 1 || satisfaction > 5) {
      return reply(res, 400, { ok: false, message: '만족도는 1~5점 사이여야 합니다.' });
    }

    const combined = `${visit_purpose} ${inconvenience} ${opinion}`;
    if (hasSensitiveInfo(combined)) {
      return reply(res, 400, {
        ok: false,
        message: '개인정보로 보이는 내용이 포함되어 저장하지 않았습니다. 이름, 전화번호, 주민등록번호, 주소, 이메일, 계좌번호 등은 제외해 주세요.'
      });
    }

    await insertToSupabase({
      visit_purpose,
      satisfaction,
      inconvenience,
      opinion,
      page_path,
      qr_source,
      user_agent: cleanText(req.headers['user-agent'], 300)
    });

    return reply(res, 200, { ok: true, message: '저장되었습니다.' });
  } catch (error) {
    console.error(error);
    return reply(res, 500, { ok: false, message: '서버 처리 중 오류가 발생했습니다.' });
  }
}
