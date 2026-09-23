import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedFields = [
  "order_number", "customer_name", "phone", "email", "address",
  "vehicle_make", "vehicle_model", "vehicle_year", "registration",
  "vehicle_size", "condition_level", "condition_flags", "condition_notes",
  "package_id", "addons", "preferred_date", "preferred_time",
  "payment_method", "estimated_total", "review_url",
];

const requiredFields = [
  "order_number", "customer_name", "phone", "email", "address",
  "vehicle_make", "vehicle_model", "vehicle_size", "condition_level",
  "package_id", "preferred_date", "preferred_time", "payment_method",
];

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : value;
}

export default {
async fetch(request: Request) {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
  }

  try {
    const raw = await request.json();
    const booking: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (raw[field] === undefined) continue;
      booking[field] = Array.isArray(raw[field])
        ? raw[field].slice(0, 20).map((item: unknown) => clean(item, 100))
        : clean(raw[field]);
    }

    for (const field of requiredFields) {
      if (!booking[field]) {
        return Response.json({ error: `Missing ${field}` }, { status: 400, headers: cors });
      }
    }

    booking.status = "Awaiting confirmation";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase
      .from("bookings")
      .insert(booking)
      .select("id,order_number")
      .single();

    if (error) throw error;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    const businessEmail = Deno.env.get("BUSINESS_EMAIL");
    if (resendKey && fromEmail) {
      const total = booking.estimated_total ? `$${booking.estimated_total}` : "Custom quote";
      const html = `<h2>Booking request ${booking.order_number}</h2>
        <p>Hi ${booking.customer_name}, we received your request for your ${booking.vehicle_make} ${booking.vehicle_model}.</p>
        <p>Your appointment is awaiting confirmation.</p>
        <p>Package: ${booking.package_id}<br>Estimated starting total: ${total}<br>Preferred date: ${booking.preferred_date}</p>
        <p>Peak Finish Automotive</p>`;
      const recipients = [booking.email, businessEmail].filter(Boolean);
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromEmail,
          to: recipients,
          subject: `Peak Finish booking ${booking.order_number}`,
          html,
        }),
      });
    }

    return Response.json(data, { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unable to create booking" }, { status: 400, headers: cors });
  }
}
};
