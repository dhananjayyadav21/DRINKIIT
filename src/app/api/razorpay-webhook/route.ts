import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/services/razorpayService';
import { markOrderPaid } from '@/services/botService';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-razorpay-signature');
  const rawBody = await req.text(); // raw string - needed as-is for HMAC verification

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new NextResponse('Invalid signature', { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody);

    if (event.event === 'payment_link.paid') {
      const paymentLinkEntity = event.payload?.payment_link?.entity;
      const paymentEntity = event.payload?.payment?.entity;
      const orderId = paymentLinkEntity?.reference_id;

      if (orderId) {
        await markOrderPaid(orderId, paymentEntity?.id);
      }
    }
  } catch (err) {
    console.error('Error handling Razorpay webhook:', err);
  }

  return new NextResponse(null, { status: 200 });
}
