import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { generateSystemPrompt } from '../utils/generateSystemPrompt';
import { generateResponse, Message } from '../utils/groq';
import twilio from 'twilio';
import { sendNewAppointmentEmail } from '../utils/email';
import { createNotification } from './notifications';
import { isCompanyAccessActive } from '../utils/access';

const router = Router();

// Validate Twilio signature for security
function validateTwilioRequest(req: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true;

  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const twilioSignature = req.headers['x-twilio-signature'] as string;
  const url = `${process.env.BACKEND_URL}/api/whatsapp/webhook`;
  
  return twilio.validateRequest(authToken, twilioSignature, url, req.body);
}

/**
 * POST /api/whatsapp/webhook
 * Handles incoming WhatsApp messages via Twilio
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    if (!validateTwilioRequest(req)) {
      return res.status(403).send('Forbidden');
    }

    const from: string = req.body.From || ''; // e.g., "whatsapp:+5215512345678"
    const to: string = req.body.To || '';     // your Twilio WhatsApp number
    const body: string = req.body.Body || '';

    console.log(`[whatsapp] Message from ${from}: ${body}`);

    if (!from || !body) {
      return res.status(400).send('Bad Request');
    }

    // Find company by WhatsApp number (To field)
    const normalizedTo = to.replace('whatsapp:', '');
    const { data: phoneRecord } = await supabase
      .from('phone_numbers')
      .select('company_id')
      .eq('twilio_number', normalizedTo)
      .single();

    // Fallback: find by TWILIO_WHATSAPP_NUMBER env
    let companyId: string | null = phoneRecord?.company_id || null;

    if (!companyId) {
      // Try to find first active company (demo mode)
      const { data: firstCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('onboarding_completed', true)
        .limit(1)
        .single();
      companyId = firstCompany?.id || null;
    }

    let responseText = 'Hola! Gracias por contactarnos. En este momento no puedo atenderte, pero pronto alguien de nuestro equipo te responderá.';

    if (companyId) {
      // Get company and assistant
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      const { data: assistant } = await supabase
        .from('assistants')
        .select('*')
        .eq('company_id', companyId)
        .eq('active', true)
        .single();

      // Block if trial expired / plan not active
      const hasAccess = await isCompanyAccessActive(companyId);
      if (company && !hasAccess) {
        responseText = `Hola, gracias por escribirnos. En este momento el servicio de ${company.name} no está disponible. Por favor intenta más tarde.`;
        const blockedResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message>
</Response>`;
        res.set('Content-Type', 'text/xml');
        return res.send(blockedResponse);
      }

      if (company && assistant) {
        // Get or create conversation history
        const phoneClean = from.replace('whatsapp:', '');
        const { data: conversation } = await supabase
          .from('whatsapp_conversations')
          .select('*')
          .eq('company_id', companyId)
          .eq('phone_from', phoneClean)
          .single();

        const history: Message[] = conversation?.messages || [];
        const systemPrompt = generateSystemPrompt(assistant, company);

        // Build messages array for Groq
        const messages: Message[] = [
          { role: 'system', content: systemPrompt },
          ...history.slice(-10), // Keep last 10 messages for context
          { role: 'user', content: body },
        ];

        // Generate response
        responseText = await generateResponse(messages, { maxTokens: 300, temperature: 0.7 });

        // Update conversation history
        const newHistory = [
          ...history,
          { role: 'user' as const, content: body },
          { role: 'assistant' as const, content: responseText },
        ];

        if (conversation) {
          await supabase
            .from('whatsapp_conversations')
            .update({
              messages: newHistory,
              last_message_at: new Date().toISOString(),
            })
            .eq('id', conversation.id);
        } else {
          await supabase.from('whatsapp_conversations').insert({
            company_id: companyId,
            phone_from: phoneClean,
            messages: newHistory,
          });
        }

        // Check if appointment was booked in this message
        if (responseText.toLowerCase().includes('cita confirmada') ||
            responseText.toLowerCase().includes('te agendamos')) {
          await supabase
            .from('whatsapp_conversations')
            .update({ appointment_created: true })
            .eq('company_id', companyId)
            .eq('phone_from', phoneClean);

          // Try to extract appointment details from conversation
          const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
          if (lastUserMsg) {
            createNotification(companyId, 'appointment',
              'Posible cita agendada por WhatsApp',
              `Cliente (${phoneClean}): ${lastUserMsg.content.substring(0, 100)}`,
              { phone_from: phoneClean }
            ).catch(() => {});
            sendNewAppointmentEmail(companyId, {
              patient_name: phoneClean,
              patient_phone: phoneClean,
              service: 'Consulta',
              date: new Date().toISOString(),
            }).catch(e => console.error('[email] Error sending:', e));
          }
        }
      }
    }

    // Respond via Twilio TwiML
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Message>
</Response>`;

    res.set('Content-Type', 'text/xml');
    return res.send(twimlResponse);
  } catch (err) {
    console.error('[whatsapp/webhook] Error:', err);
    const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Lo sentimos, ocurrió un error. Por favor intenta de nuevo en unos minutos.</Message>
</Response>`;
    res.set('Content-Type', 'text/xml');
    return res.send(errorResponse);
  }
});

export default router;
