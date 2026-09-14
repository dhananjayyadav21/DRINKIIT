import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { env } from '@/config/env';
import { handleIncomingMessage, IncomingMessage } from '@/services/botService';

// Next.js route handlers run on serverless functions when deployed - once a
// Response is returned, background work is not guaranteed to keep running
// (unlike the Express version's "ack immediately, process after"). So this
// handler awaits the full bot reply before responding; that's fine, since
// the whole flow (a couple of small API calls + a JSON file write) takes a
// few hundred ms, well under Meta/Twilio's webhook timeout.

function extractMetaMessage(body: any): IncomingMessage | null {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  if (!message) return null;

  const contact = value.contacts?.[0];
  const waId = message.from;
  const name = contact?.profile?.name;

  if (message.type === 'text') {
    return { waId, name, text: message.text.body };
  }

  return { waId, name, text: '' };
}

function stripWhatsAppPrefix(address: string | undefined): string | undefined {
  return address ? address.replace(/^whatsapp:/, '') : address;
}

function extractTwilioMessage(fields: Record<string, string>): IncomingMessage | null {
  if (!fields.From) return null;

  return {
    waId: stripWhatsAppPrefix(fields.From) as string,
    name: fields.ProfileName || undefined,
    text: fields.Body || '',
  };
}

// Reconstructs the public-facing URL from forwarded headers (set by ngrok,
// Vercel, etc.) rather than trusting NextRequest.url directly, since behind a
// tunnel/proxy the scheme/host Next.js sees locally can differ from what
// Twilio actually called - and the signature is computed over that public URL.
function getPublicUrl(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  return `${proto}://${host}${req.nextUrl.pathname}${req.nextUrl.search}`;
}

function validateTwilioRequest(req: NextRequest, fields: Record<string, string>): boolean {
  if (!env.whatsapp.twilio.validateSignature) return true;

  const signature = req.headers.get('X-Twilio-Signature');
  if (!signature) return false;

  return twilio.validateRequest(env.whatsapp.twilio.authToken, signature, getPublicUrl(req), fields);
}

// Meta calls this once when you configure the webhook URL in the App Dashboard.
export async function GET(req: NextRequest) {
  if (env.whatsapp.provider !== 'meta') {
    return new NextResponse(null, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === env.whatsapp.meta.verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse(null, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    let incoming: IncomingMessage | null = null;

    if (env.whatsapp.provider === 'meta') {
      const body = await req.json();
      incoming = extractMetaMessage(body);
    } else {
      const formData = await req.formData();
      const fields: Record<string, string> = {};
      for (const [key, value] of formData.entries()) {
        fields[key] = String(value);
      }

      if (!validateTwilioRequest(req, fields)) {
        console.error('Rejected WhatsApp webhook request with invalid Twilio signature.');
        return new NextResponse(null, { status: 403 });
      }

      incoming = extractTwilioMessage(fields);
    }

    if (incoming) {
      await handleIncomingMessage(incoming);
    }
  } catch (err) {
    console.error('Error handling WhatsApp webhook message:', err);
  }

  return new NextResponse(null, { status: 200 });
}
