/**
 * WhatsApp Business Cloud API Integration Service
 * Envío de notificaciones interactivas y procesamiento de confirmación de turnos.
 */

export class WhatsAppService {
  static getBaseUrl() {
    return 'https://graph.facebook.com/v21.0';
  }

  /**
   * Envía un mensaje de texto simple o interactivo a un paciente
   */
  static async sendMessage(config, { to, message }) {
    const cleanPhone = String(to).replace(/[\s()-]/g, '').replace('+', '');
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    if (!config || !config.phoneNumberId || !config.token) {
      return {
        success: true,
        cloudApi: false,
        waLink,
        message: 'Credenciales de Meta Cloud API no configuradas. Se generó enlace directo para envío inmediato vía WhatsApp.',
        to: cleanPhone
      };
    }
    const url = `${this.getBaseUrl()}/${config.phoneNumberId}/messages`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: message }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('[WhatsApp] Error enviando mensaje:', data);
        return { success: false, error: data };
      }
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (err) {
      console.error('[WhatsApp] Exception:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Envía un recordatorio de turno con opciones interactivas de respuesta
   */
  static async sendAppointmentReminder(config, { patientName, phone, dateFormatted, timeFormatted, doctorName }) {
    const text = `Hola ${patientName}, te escribimos de Abundance Clinic OS para recordarte tu turno con ${doctorName} el día ${dateFormatted} a las ${timeFormatted} hs.\n\nPor favor, responde:\n*1* para CONFIRMAR tu asistencia.\n*2* para CANCELAR o solicitar reprogramación.`;
    return await this.sendMessage(config, { to: phone, message: text });
  }

  /**
   * Procesa la respuesta entrante del webhook de WhatsApp (Meta Webhooks)
   */
  static async handleWebhook(payload, { onAppointmentConfirmed, onAppointmentCancelled }) {
    try {
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (!message) return { status: 'NO_MESSAGE' };

      const from = message.from; // Número de teléfono del paciente
      const text = (message.text?.body || '').trim().toLowerCase();

      console.log(`[WhatsApp Webhook] Mensaje recibido de ${from}: "${text}"`);

      if (['1', 'si', 'sí', 'confirmo', 'confirmar'].includes(text)) {
        if (onAppointmentConfirmed) {
          const updated = onAppointmentConfirmed(from);
          return { status: 'CONFIRMED', appointmentId: updated?.id };
        }
      } else if (['2', 'no', 'cancelo', 'cancelar', 'reprogramar'].includes(text)) {
        if (onAppointmentCancelled) {
          const updated = onAppointmentCancelled(from);
          return { status: 'CANCELLED', appointmentId: updated?.id };
        }
      }

      return { status: 'MESSAGE_PROCESSED', text };
    } catch (err) {
      console.error('[WhatsApp Webhook] Error:', err.message);
      return { status: 'ERROR', error: err.message };
    }
  }
}
