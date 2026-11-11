export async function sendWhatsAppMessage(to: string, message: string) {
  const token = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("⚠️ WhatsApp Meta credentials not configured. Message not sent:", message);
    return false;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("❌ Meta Graph API Error (WhatsApp):", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("❌ Failed to send WhatsApp message:", err);
    return false;
  }
}

export async function sendInstagramMessage(igUserId: string, message: string) {
  const token = process.env.META_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;

  if (!token || !pageId) {
    console.warn("⚠️ Instagram Meta credentials not configured. Message not sent:", message);
    return false;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: igUserId },
        message: { text: message },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("❌ Meta Graph API Error (Instagram):", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("❌ Failed to send Instagram message:", err);
    return false;
  }
}
