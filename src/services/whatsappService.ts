import { env } from '@/config/env';
import { Order } from '@/types/order';
import * as templates from './messageTemplates';

async function sendText(to: string, body: string): Promise<void> {
  const url = `https://graph.facebook.com/${env.whatsapp.meta.apiVersion}/${env.whatsapp.meta.phoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsapp.meta.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new Error(`Meta API error (${res.status}): ${errorBody}`);
    }
  } catch (err) {
    console.error(`WhatsApp send error (to ${to}):`, err instanceof Error ? err.message : err);
  }
}

// Sends Meta's interactive "catalog_message" - a message with a button that
// opens the full WhatsApp Commerce catalog linked to this business account.
async function sendCatalogViaMeta(to: string, bodyText: string): Promise<void> {
  const url = `https://graph.facebook.com/${env.whatsapp.meta.apiVersion}/${env.whatsapp.meta.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsapp.meta.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'catalog_message',
        body: { text: bodyText },
        action: { name: 'catalog_message' },
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Meta API error (${res.status}): ${errorBody}`);
  }
}

// Meta's interactive reply-button message (max 3 buttons, id + title only -
// a tap comes back through the webhook as a normal message whose text is the
// button's id).
async function sendButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<void> {
  const url = `https://graph.facebook.com/${env.whatsapp.meta.apiVersion}/${env.whatsapp.meta.phoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsapp.meta.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: bodyText },
          action: {
            buttons: buttons.map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
          },
        },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new Error(`Meta API error (${res.status}): ${errorBody}`);
    }
  } catch (err) {
    console.error(`WhatsApp buttons send error (to ${to}):`, err instanceof Error ? err.message : err);
  }
}

// Meta's "call to action URL" button - a single button that opens a link
// directly (used for the payment link, so tapping it goes straight to
// checkout instead of the customer having to copy/paste a URL).
async function sendCtaUrl(to: string, bodyText: string, buttonText: string, url: string): Promise<void> {
  const apiUrl = `https://graph.facebook.com/${env.whatsapp.meta.apiVersion}/${env.whatsapp.meta.phoneNumberId}/messages`;
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsapp.meta.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: { text: bodyText },
          action: {
            name: 'cta_url',
            parameters: { display_text: buttonText, url },
          },
        },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new Error(`Meta API error (${res.status}): ${errorBody}`);
    }
  } catch (err) {
    console.error(`WhatsApp CTA URL send error (to ${to}):`, err instanceof Error ? err.message : err);
    await sendText(to, `${bodyText}\n\n${url}`);
  }
}

export function sendWelcome(to: string, name?: string | null): Promise<void> {
  return sendText(to, templates.welcomeMessage(name));
}

export const catalogInteractiveEnabled = !!env.whatsapp.meta.catalogId;

// Sends the price list as one message with a real "View catalog" button
// attached (Meta's catalog_message), so the customer can tap straight into
// the photo catalog and build a cart from there. Falls back to a plain-text
// price list if no catalog is configured.
export async function sendCatalog(to: string): Promise<void> {
  const bodyText = templates.catalogMessage();

  if (!catalogInteractiveEnabled) {
    await sendText(to, bodyText);
    return;
  }

  try {
    await sendCatalogViaMeta(to, bodyText);
  } catch (err) {
    console.error(`WhatsApp catalog send error (to ${to}):`, err instanceof Error ? err.message : err);
    await sendText(to, bodyText);
  }
}

export function sendHelp(to: string): Promise<void> {
  return sendText(to, templates.helpMessage());
}

export function sendNoPendingOrder(to: string): Promise<void> {
  return sendText(to, templates.noPendingOrderMessage());
}

export function sendCartUnresolved(to: string): Promise<void> {
  return sendText(to, templates.cartUnresolvedMessage());
}

export const PAYMENT_CHOICE_BUTTONS = {
  cod: { id: 'PAY_COD', title: 'Cash on Delivery' },
  online: { id: 'PAY_ONLINE', title: 'Pay Online' },
} as const;

export function sendPaymentChoice(to: string, order: Order): Promise<void> {
  return sendButtons(to, templates.paymentChoiceMessage(order), [
    PAYMENT_CHOICE_BUTTONS.cod,
    PAYMENT_CHOICE_BUTTONS.online,
  ]);
}

// Meta's native "Send Address" form (India only) - opens a structured form
// (name, phone, house/floor/tower, pin code, landmark, city) inside WhatsApp
// instead of asking the customer to type a free-text address.
async function sendAddressRequest(to: string, bodyText: string): Promise<void> {
  const url = `https://graph.facebook.com/${env.whatsapp.meta.apiVersion}/${env.whatsapp.meta.phoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.whatsapp.meta.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'address_message',
          body: { text: bodyText },
          action: {
            name: 'address_message',
            parameters: { country: 'IN' },
          },
        },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '');
      throw new Error(`Meta API error (${res.status}): ${errorBody}`);
    }
  } catch (err) {
    console.error(`WhatsApp address request send error (to ${to}):`, err instanceof Error ? err.message : err);
    await sendText(to, `${bodyText}\n\n_Please reply with your full delivery address._`);
  }
}

export function sendAskAddress(to: string, order: Order): Promise<void> {
  return sendAddressRequest(to, templates.askAddressMessage(order));
}

export function sendCodConfirmation(to: string, order: Order): Promise<void> {
  return sendText(to, templates.codConfirmationMessage(order));
}

export function sendPaymentLinkError(to: string): Promise<void> {
  return sendText(to, templates.paymentLinkErrorMessage());
}

export function sendPaymentLink(to: string, order: Order, link: string): Promise<void> {
  return sendCtaUrl(to, templates.paymentLinkMessage(order), 'Pay Now', link);
}

export function sendPaidConfirmation(to: string, order: Order): Promise<void> {
  return sendText(to, templates.paidConfirmationMessage(order));
}

// "Contact Us" CTA button - opens the customer's dialer straight to the
// business number (tel: URL) when tapped.
export function sendOrderInProgress(to: string, order: Order): Promise<void> {
  const phone = env.business.contactPhone || env.business.whatsappNumber;
  const body = templates.orderInProgressMessage(order);
  if (!phone) return sendText(to, body);
  return sendCtaUrl(to, body, 'Contact Us', `tel:+${phone}`);
}

export function sendOrderDelivered(to: string, order: Order): Promise<void> {
  return sendText(to, templates.orderDeliveredMessage(order));
}
