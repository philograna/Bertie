import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Firma Stripe mancante', { status: 400 })
  }

  const stripeKey     = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-04-10',
    httpClient: Stripe.createFetchHttpClient(),
  })

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  // ── Pagamento avvenuto → attiva Supporter ────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session        = event.data.object as Stripe.Checkout.Session
    const userId         = session.client_reference_id
    const customerId     = session.customer as string
    const subscriptionId = session.subscription as string

    if (userId) {
      const now         = new Date()
      const expiresDate = new Date(now)
      expiresDate.setFullYear(expiresDate.getFullYear() + 1)

      await supabase.from('profiles').update({
        supporter:          true,
        supporter_since:    now.toISOString(),
        supporter_expires:  expiresDate.toISOString(),
        stripe_customer_id: customerId,
      }).eq('id', userId)

      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        await supabase.from('supporter_subscriptions').upsert({
          user_id:                userId,
          stripe_customer_id:     customerId,
          stripe_subscription_id: subscriptionId,
          status:                 sub.status,
          current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' })
      }
    }
  }

  // ── Rinnovo annuale → aggiorna expiry ────────────────────────────────────
  if (event.type === 'invoice.payment_succeeded') {
    const invoice        = event.data.object as Stripe.Invoice
    const subscriptionId = invoice.subscription as string
    if (subscriptionId && invoice.billing_reason === 'subscription_cycle') {
      const sub        = await stripe.subscriptions.retrieve(subscriptionId)
      const customerId = sub.customer as string
      const newExpiry  = new Date(sub.current_period_end * 1000)

      await supabase.from('profiles').update({
        supporter:         true,
        supporter_expires: newExpiry.toISOString(),
      }).eq('stripe_customer_id', customerId)

      await supabase.from('supporter_subscriptions').update({
        status:             sub.status,
        current_period_end: newExpiry.toISOString(),
      }).eq('stripe_subscription_id', subscriptionId)
    }
  }

  // ── Cancellazione → revoca Supporter ─────────────────────────────────────
  if (
    event.type === 'customer.subscription.deleted' ||
    event.type === 'customer.subscription.paused'
  ) {
    const sub        = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string

    await supabase.from('profiles').update({
      supporter:         false,
      supporter_expires: null,
    }).eq('stripe_customer_id', customerId)

    await supabase.from('supporter_subscriptions').update({
      status: sub.status,
    }).eq('stripe_subscription_id', sub.id)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
