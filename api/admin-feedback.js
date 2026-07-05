function reply(res, code, body) {
  return res.status(code).json(body);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} 환경변수가 없습니다.`);
  return value;
}

function checkToken(req) {
  const saved = process.env.ADMIN_TOKEN;
  const given = req.body?.adminToken;
  return Boolean(saved && given && String(saved).trim() === String(given).trim());
}

async function fetchFromSupabase() {
  const url = requireEnv('SUPABASE_URL').replace(/\/$/, '');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const response = await fetch(
    `${url}/rest/v1/qr_feedback?select=id,visit_purpose,satisfaction,inconvenience,opinion,page_path,qr_source,user_agent,created_at&order=created_at.desc&limit=500`,
    {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase 조회 실패: ${response.status} ${text}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return reply(res, 405, { ok: false, message: 'POST만 지원합니다.' });
    }

    if (!checkToken(req)) {
      return reply(res, 401, { ok: false, message: '관리자 비밀번호가 올바르지 않습니다.' });
    }

    const items = await fetchFromSupabase();
    return reply(res, 200, { ok: true, items });
  } catch (error) {
    console.error(error);
    return reply(res, 500, { ok: false, message: '관리자 조회 중 오류가 발생했습니다.' });
  }
}
