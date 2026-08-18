import { env } from "cloudflare:workers";

export const prerender = false;

export async function POST({ request }) {
  try {

    // =========================
    // GET PAYMENT DETAILS
    // =========================

    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = body;


    // =========================
    // VALIDATE
    // =========================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing payment details"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }


    // =========================
    // GET SECRET
    // =========================

    const secret =
      env.RAZORPAY_KEY_SECRET;

    if (!secret) {

      console.error(
        "RAZORPAY_KEY_SECRET is missing"
      );

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


    // =========================
    // CREATE HMAC SHA256
    // =========================

    const encoder =
      new TextEncoder();

    const message =
      encoder.encode(
        `${razorpay_order_id}|${razorpay_payment_id}`
      );


    const key =
      await crypto.subtle.importKey(
        "raw",

        encoder.encode(secret),

        {
          name: "HMAC",
          hash: "SHA-256"
        },

        false,

        ["sign"]
      );


    // =========================
    // GENERATE SIGNATURE
    // =========================

    const signatureBuffer =
      await crypto.subtle.sign(
        "HMAC",
        key,
        message
      );


    const generatedSignature =
      Array.from(
        new Uint8Array(
          signatureBuffer
        )
      )
        .map((byte) =>
          byte
            .toString(16)
            .padStart(2, "0")
        )
        .join("");


    // =========================
    // COMPARE
    // =========================

    if (
      generatedSignature !==
      razorpay_signature
    ) {

      console.error(
        "Invalid Razorpay payment signature"
      );

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


    // =========================
    // VERIFIED
    // =========================

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