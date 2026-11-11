/**
 * GoHighLevel (GHL) API v2 Integration Service
 * Soporta sincronización bidireccional de contactos, oportunidades y turnos.
 */

export class GHLService {
  static getBaseUrl(config) {
    return config.baseUrl || 'https://services.leadconnectorhq.com';
  }

  static getHeaders(config) {
    return {
      'Authorization': `Bearer ${config.apiKey || config.token}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Sincroniza un contacto hacia GoHighLevel
   */
  static async upsertContact(config, { firstName, lastName, phone, email, tags = ['clinic-os'] }) {
    if (!config || !config.apiKey || !config.locationId) {
      return { success: false, reason: 'GHL no configurado' };
    }

    const url = `${this.getBaseUrl(config)}/contacts/upsert`;
    const payload = {
      locationId: config.locationId,
      firstName,
      lastName,
      phone,
      email: email || undefined,
      tags
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(config),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('[GHL] Error upserting contact:', data);
        return { success: false, error: data };
      }
      return { success: true, contact: data.contact || data };
    } catch (err) {
      console.error('[GHL] Exception:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Sincroniza un turno hacia el calendario de GoHighLevel
   */
  static async bookAppointment(config, { calendarId, contactId, startTime, title = 'Consulta Médica' }) {
    if (!config || !config.apiKey || !config.locationId) {
      return { success: false, reason: 'GHL no configurado' };
    }

    const url = `${this.getBaseUrl(config)}/calendars/events/appointments`;
    const payload = {
      calendarId: calendarId || config.calendarId,
      locationId: config.locationId,
      contactId,
      startTime,
      title,
      appointmentStatus: 'confirmed'
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(config),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data };
      return { success: true, appointment: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Procesa un webhook entrante desde GoHighLevel
   */
  static async handleWebhook(payload, { onLeadCreated, onAppointmentUpdated }) {
    if (!payload || typeof payload !== 'object') return { received: false };

    const type = payload.type || payload.event;
    console.log('[GHL Webhook] Evento recibido:', type);

    if (type === 'ContactCreate' || type === 'ContactUpdate' || payload.contact_id) {
      const contact = payload.contact || payload;
      const leadData = {
        name: [contact.first_name || contact.firstName, contact.last_name || contact.lastName].filter(Boolean).join(' ') || 'Contacto GHL',
        phone: contact.phone || '+541100000000',
        source: 'GoHighLevel CRM',
        interest: contact.notes || 'Consulta importada de pipeline GHL'
      };
      if (onLeadCreated) onLeadCreated(leadData);
      return { received: true, action: 'LEAD_SYNCED' };
    }

    return { received: true, status: 'UNHANDLED_EVENT' };
  }
}
