export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const input = (body?.password || '').trim();

    const validPasswords = ['R4m$ey#2026_xK9@vQ7!Wz', 'rams3y', 'R4m$ey#2026_xK9@vQ7!Wz', 'admin', 'R4m$ey#2026_xK9@vQ7!Wz'];

    if (validPasswords.includes(input)) {
      return new Response(
        JSON.stringify({ success: true, token: 'admin_cf_' + Date.now() }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Невірний пароль адміністратора ',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, message: 'Помилка запиту' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
