import Razorpay from "razorpay";

export async function POST({ request, locals }) {
  try {
    const rawBody = await request.text();

    if (!rawBody) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Request body is empty"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const body = JSON.parse(rawBody);
    const amount = Number(body.amount);

    if (!amount || amount <= 0) {
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

    const runtimeEnv = locals?.runtime?.env;

    const keyId = runtimeEnv?.RAZORPAY_KEY_ID;
    const keySecret = runtimeEnv?.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Razorpay environment variables are missing"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `sravs_${Date.now()}`
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: order.id,
        amount: order.amount,
        currency: order.currency
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error?.error?.description ||
          error?.message ||
          "Order creation failed"
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