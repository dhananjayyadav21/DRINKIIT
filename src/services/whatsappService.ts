import twilio from 'twilio';
import { env } from '@/config/env';
import { Order } from '@/types/order';
import * as templates from './messageTemplates';

const twilioClient =
  env.whatsapp.provider === 'twilio' ? twilio(env.whatsapp.twilio.accountSid, env.whatsapp.twilio.authToken) : null;

function toWhatsAppAddress(waId: string): string {
  return waId.startsWith('whatsapp:') ? waId : `whatsapp:${waId}`;
}

async function sendViaMeta(to: string, body: string): Promise<void> {
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
      type: 'text',
      text: { body },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    throw new Error(`Meta API error (${res.status}): ${errorBody}`);
  }
}

async function sendViaTwilio(to: string, body: string): Promise<void> {
  await twilioClient!.messages.create({
    from: env.whatsapp.twilio.fromNumber,
    to: toWhatsAppAddress(to),
    contentSid: env.whatsapp.twilio.contentSid,
    contentVariables: JSON.stringify({ 1: body }),
  });
}

async function sendText(to: string, body: string): Promise<void> {
  try {
    if (env.whatsapp.provider === 'meta') {
      await sendViaMeta(to, body);
    } else {
      await sendViaTwilio(to, body);
    }
  } catch (err) {
    console.error(`WhatsApp send error (to ${to}):`, err instanceof Error ? err.message : err);
  }
}

export function sendWelcome(to: string, name?: string | null): Promise<void> {
  return sendText(to, templates.welcomeMessage(name));
}

export function sendCatalog(to: string): Promise<void> {
  return sendText(to, templates.catalogMessage());
}

export function sendMenu(to: string): Promise<void> {
  return sendText(to, templates.menuMessage());
}

export function sendAskQuantity(to: string, code: '1L' | '500ML'): Promise<void> {
  return sendText(to, templates.askQuantityMessage(code));
}

export function sendHelp(to: string): Promise<void> {
  return sendText(to, templates.helpMessage());
}

export function sendOtp(to: string, otp: string, order: Order): Promise<void> {
  return sendText(to, templates.otpMessage(otp, order));
}

export function sendOtpExpired(to: string): Promise<void> {
  return sendText(to, templates.otpExpiredMessage());
}

export function sendOtpIncorrect(to: string): Promise<void> {
  return sendText(to, templates.otpIncorrectMessage());
}

export function sendNoPendingOrder(to: string): Promise<void> {
  return sendText(to, templates.noPendingOrderMessage());
}

export function sendPaymentChoice(to: string, order: Order): Promise<void> {
  return sendText(to, templates.paymentChoiceMessage(order));
}

export function sendCodConfirmation(to: string, order: Order): Promise<void> {
  return sendText(to, templates.codConfirmationMessage(order));
}

export function sendPaymentLinkError(to: string): Promise<void> {
  return sendText(to, templates.paymentLinkErrorMessage());
}

export function sendPaymentLink(to: string, order: Order, link: string): Promise<void> {
  return sendText(to, templates.paymentLinkMessage(order, link));
}

export function sendPaidConfirmation(to: string, order: Order): Promise<void> {
  return sendText(to, templates.paidConfirmationMessage(order));
}
