import { env } from "cloudflare:workers";

export const prerender = false;

export async function POST({ request }) {

  try {

    const body =
      await request.json();


    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = body;


    /* =========================
       CHECK PAYMENT DETAILS
    ========================= */

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {

      return new Response(
        JSON.stringify({

          success: false,

          error:
            "Missing payment details"

        }),
        {
          status: 400,

          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );

    }


    /* =========================
       GET SECRET
    ========================= */

    const secret =
      env.RAZORPAY_KEY_SECRET;


    if (!secret) {

      return new Response(
        JSON.stringify({

          success: false,

          error:
            "Razorpay secret is missing."

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
       HMAC SHA256
       CLOUDFLARE WEB CRYPTO
    ========================= */

    const encoder =
      new TextEncoder();


    const keyData =
      encoder.encode(secret);


    const message =
      encoder.encode(
        `${razorpay_order_id}|${razorpay_payment_id}`
      );


    const cryptoKey =
      await crypto.subtle.importKey(

        "raw",

        keyData,

        {
          name:
            "HMAC",

          hash:
            "SHA-256"
        },

        false,

        ["sign"]

      );


    const signatureBuffer =
      await crypto.subtle.sign(

        "HMAC",

        cryptoKey,

        message

      );


    const generatedSignature =
      Array.from(
        new Uint8Array(
          signatureBuffer
        )
      )
        .map(
          (byte) =>
            byte
              .toString(16)
              .padStart(2, "0")
        )
        .join("");


    /* =========================
       VERIFY
    ========================= */

    const isValid =
      generatedSignature ===
      razorpay_signature;


    if (!isValid) {

      return new Response(
        JSON.stringify({

          success: false,

          error:
            "Payment signature verification failed"

        }),
        {
          status: 400,

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

        message:
          "Payment verified successfully",

        paymentId:
          razorpay_payment_id,

        orderId:
          razorpay_order_id

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
      "Payment verification error:",
      error
    );


    return new Response(
      JSON.stringify({

        success: false,

        error:
          error?.message ||
          "Server error while verifying payment"

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