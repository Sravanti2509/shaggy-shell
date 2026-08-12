import crypto from "crypto";

export async function POST({ request }) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing payment details",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const secret =
      import.meta.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "RAZORPAY_KEY_SECRET is missing in .env",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const generatedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    const isValid =
      generatedSignature === razorpay_signature;

    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Payment signature verification failed",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,

        message:
          "Payment verified successfully",

        paymentId:
          razorpay_payment_id,

        orderId:
          razorpay_order_id,

      }),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/json",
        },
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
          "Server error while verifying payment",

      }),
      {
        status: 500,

        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );
  }
}