import { NextResponse } from 'next/server';
import crypto from 'crypto';

function utcDateString(date: Date) {
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${date.getUTCFullYear()}/${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+00:00`;
}

export async function POST(req: Request) {
  const authKey = process.env.TRANSLOADIT_KEY;
  const authSecret = process.env.TRANSLOADIT_SECRET;
  
  const { fileType } = await req.json().catch(() => ({ fileType: 'image' }));

  if (!authKey || !authSecret) {
    return NextResponse.json({ signature: "dev_signature", params: "{}" });
  }

  const expires = new Date();
  expires.setHours(expires.getHours() + 2); 
  
  const steps: any = {
    "processed": {
      robot: "/file/filter",
      use: ":original",
      result: true
    }
  };

  const params = JSON.stringify({
    auth: {
      key: authKey,
      expires: utcDateString(expires),
    },
    steps
  });

  const hmac = crypto.createHmac('sha384', authSecret);
  hmac.update(Buffer.from(params, 'utf-8'));
  const signature = `sha384:${hmac.digest('hex')}`;

  return NextResponse.json({ signature, params });
}
