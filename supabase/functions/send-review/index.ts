import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return Response.json({ error: "Not authorised" }, { status: 401, headers: cors });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    const email = user?.email?.toLowerCase();
    const { data: admin } = await supabase
      .from("admin_users")
      .select("email")
      .eq("email", email || "")
      .maybeSingle();

    if (!admin) return Response.json({ error: "Not authorised" }, { status: 403, headers: cors });

    const { bookingId } = await request.json();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();
    if (error || !booking) {
      return Response.json({ error: "Booking not found" }, { status: 404, headers: cors });
    }

    const reviewUrl = Deno.env.get("GOOGLE_REVIEW_URL") || booking.review_url;
    const message = `Hi ${booking.customer_name}, thank you for choosing Peak Finish Automotive for your ${booking.vehicle_make} ${booking.vehicle_model}. We hope you're happy with the result! Your feedback helps our small local business grow. Please leave us a Google review: ${reviewUrl}`;
    let sent = false;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    if (resendKey && fromEmail && booking.email) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromEmail,
          to: booking.email,
          subject: "How did we do? – Peak Finish Automotive",
          html: `<p>${message.replace(reviewUrl, `<a href="${reviewUrl}">Leave a Google review</a>`)}</p>`,
        }),
      });
      sent = response.ok;
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromPhone = Deno.env.get("TWILIO_FROM_NUMBER");
    if (accountSid && authToken && fromPhone && booking.phone) {
      const body = new URLSearchParams({ To: booking.phone, From: fromPhone, Body: message });
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      sent = sent || response.ok;
    }

    if (!sent) {
      return Response.json({ error: "No notification provider is configured" }, { status: 503, headers: cors });
    }

    await supabase
      .from("bookings")
      .update({ review_sent_at: new Date().toISOString() })
      .eq("id", bookingId);
    return Response.json({ ok: true }, { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unable to send review request" }, { status: 400, headers: cors });
  }
});
