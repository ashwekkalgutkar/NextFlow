import { NextResponse } from 'next/server';
import crypto from 'crypto';

function utcDateString(date: Date) {
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  return `${date.getUTCFullYear()}/${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+00:00`;
}

export async function POST() {
  const authKey = process.env.TRANSLOADIT_KEY;
  const authSecret = process.env.TRANSLOADIT_SECRET;

  if (!authKey || !authSecret) {
    // Graceful degradation for local development if keys are not set, return dummy
    return NextResponse.json({ signature: "dev_signature", params: "{}" });
  }

  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour expiry
  
  const params = JSON.stringify({
    auth: {
      key: authKey,
      expires: utcDateString(expires),
    },
  });

  // Transloadit signature generation using sha384
  const signature = crypto
    .createHmac('sha384', authSecret)
    .update(Buffer.from(params, 'utf-8'))
    .digest('hex');

  return NextResponse.json({ signature, params });
}
