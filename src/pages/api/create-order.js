import { env } from "cloudflare:workers";

export const prerender = false;

export async function POST({ request }) {
  try {

    const body = await request.json();

    const amount = Number(body.amount);

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({
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
       CLOUDFLARE ENVIRONMENT
    ========================= */

    const keyId =
      env.RAZORPAY_KEY_ID;

    const keySecret =
      env.RAZORPAY_KEY_SECRET;


    if (!keyId || !keySecret) {

      console.error(
        "Razorpay environment variables are missing."
      );

      return new Response(
        JSON.stringify({
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
       RAZORPAY AUTH
    ========================= */

    const credentials =
      btoa(
        `${keyId}:${keySecret}`
      );


    /* =========================
       CREATE RAZORPAY ORDER
    ========================= */

    const razorpayResponse =
      await fetch(
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

            amount:
              Math.round(
                amount * 100
              ),

            currency:
              "INR",

            receipt:
              `sravs_${Date.now()}`

          })
        }
      );


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
          error:
            data.error?.description ||
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
      JSON.stringify(data),
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