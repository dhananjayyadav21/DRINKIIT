import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/config/env';
import { handleIncomingMessage, IncomingMessage } from '@/services/botService';

// Next.js route handlers run on serverless functions when deployed - once a
// Response is returned, background work is not guaranteed to keep running
// (unlike the Express version's "ack immediately, process after"). So this
// handler awaits the full bot reply before responding; that's fine, since
// the whole flow (a couple of small API calls + a JSON file write) takes a
// few hundred ms, well under Meta's webhook timeout.

// Formats Meta's structured "Send Address" form reply (India layout) into a
// single readable multi-line string, the same shape the rest of the app
// expects for `order.address`.
function formatAddressReply(values: Record<string, string>): string {
  const lines = [
    [values.house_number, values.floor_number && `Floor ${values.floor_number}`, values.tower_number]
      .filter(Boolean)
      .join(', '),
    values.building_name,
    values.address,
    values.landmark_area,
    [values.city, values.in_pin_code].filter(Boolean).join(' – '),
  ].filter((line): line is string => !!line && line.trim().length > 0);

  return lines.join('\n');
}

// Pulls the structured "Send Address" form values out of an interactive
// reply, whichever of Meta's shapes it arrives in (this has varied in
// practice: nfm_reply.response_json as a JSON string, or an address_message
// object with the fields already parsed).
function extractAddressFormValues(interactive: any): Record<string, string> | null {
  if (!interactive) return null;

  if (interactive.nfm_reply?.response_json) {
    try {
      return JSON.parse(interactive.nfm_reply.response_json);
    } catch (err) {
      console.error('Failed to parse nfm_reply.response_json:', err);
    }
  }

  if (interactive.address_message?.values) {
    return interactive.address_message.values;
  }

  if (interactive.address?.values) {
    return interactive.address.values;
  }

  return null;
}

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

  // A tap on one of our reply buttons (e.g. payment choice) - Meta sends the
  // button's `id` back, which we treat exactly like a typed command.
  if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
    return { waId, name, text: message.interactive.button_reply.id };
  }

  // A submission of the native "Send Address" form - Meta returns the
  // structured fields the customer filled in, which we flatten into the
  // same free-text address string the rest of the app stores.
  if (message.type === 'interactive') {
    const values = extractAddressFormValues(message.interactive);
    if (values) {
      const contactName = values.name || name;
      const contactPhone = values.phone_number;
      const addressText = formatAddressReply(values);
      const text = [addressText, contactPhone && `Phone: ${contactPhone}`].filter(Boolean).join('\n');
      return { waId, name: contactName, text };
    }

    // Unrecognized interactive reply shape - log it so we can add support
    // for it, instead of silently falling through to the generic help text.
    console.error('Unhandled interactive message payload:', JSON.stringify(message.interactive));
  }

  // A WhatsApp Commerce cart checkout - the customer picked items from the
  // catalog and hit "Send". See https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#order-messages
  if (message.type === 'order') {
    const items = message.order?.product_items || [];
    const cartItems = items.map((item: any) => ({
      retailerId: item.product_retailer_id,
      quantity: Number(item.quantity) || 0,
      itemPrice: Number(item.item_price) || 0,
    }));
    return { waId, name, text: '', cartItems };
  }

  return { waId, name, text: '' };
}

// Meta calls this once when you configure the webhook URL in the App Dashboard.
export async function GET(req: NextRequest) {
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
    const body = await req.json();
    const incoming = extractMetaMessage(body);

    if (incoming) {
      await handleIncomingMessage(incoming);
    }
  } catch (err) {
    console.error('Error handling WhatsApp webhook message:', err);
  }

  return new NextResponse(null, { status: 200 });
}
