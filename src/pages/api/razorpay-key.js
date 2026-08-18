import { env } from "cloudflare:workers";

export const prerender = false;

export async function GET() {
  try {
    /* =========================
       GET RAZORPAY KEY ID
    ========================= */

    const keyId = env.RAZORPAY_KEY_ID;


    /* =========================
       CHECK KEY
    ========================= */

    if (!keyId) {
      console.error(
        "RAZORPAY_KEY_ID is missing"
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: "Razorpay Key ID is missing."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
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
        keyId: keyId
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );


  } catch (error) {

    console.error(
      "Razorpay key error:",
      error
    );


    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Unable to load Razorpay Key ID."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}