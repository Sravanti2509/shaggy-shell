import { env } from "cloudflare:workers";

export const prerender = false;

export async function POST({ request }) {
  try {
    /* =========================
       GET REQUEST BODY
    ========================= */

    const body = await request.json();

    const amount = Number(body.amount);


    /* =========================
       VALIDATE AMOUNT
    ========================= */

    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid amount"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }


    /* =========================
       GET RAZORPAY CREDENTIALS
    ========================= */

    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;


    if (!keyId || !keySecret) {
      console.error(
        "Razorpay environment variables are missing."
      );

      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Razorpay environment variables are missing."
        }),
        {
          status: 500,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }


    /* =========================
       BASIC AUTH
    ========================= */

    const credentials = btoa(
      `${keyId}:${keySecret}`
    );


    /* =========================
       CREATE RAZORPAY ORDER
    ========================= */

    const razorpayResponse = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            `Basic ${credentials}`
        },

        body: JSON.stringify({
          amount: Math.round(amount * 100),

          currency: "INR",

          receipt:
            `sravs_${Date.now()}`
        })
      }
    );


    /* =========================
       READ RESPONSE
    ========================= */

    const data =
      await razorpayResponse.json();


    /* =========================
       RAZORPAY ERROR
    ========================= */

    if (!razorpayResponse.ok) {
      console.error(
        "Razorpay order error:",
        data
      );

      return new Response(
        JSON.stringify({
          success: false,
          error:
            data?.error?.description ||
            "Razorpay order creation failed."
        }),
        {
          status:
            razorpayResponse.status,

          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }


    /* =========================
       SUCCESS
    ========================= */

    return new Response(
      JSON.stringify({
        success: true,

        id: data.id,

        entity: data.entity,

        amount: data.amount,

        amount_paid:
          data.amount_paid,

        amount_due:
          data.amount_due,

        currency:
          data.currency,

        receipt:
          data.receipt,

        status:
          data.status
      }),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );


  } catch (error) {

    console.error(
      "Create order error:",
      error
    );


    return new Response(
      JSON.stringify({
        success: false,

        error:
          error?.message ||
          "Unable to create Razorpay order."
      }),
      {
        status: 500,

        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );
  }
}