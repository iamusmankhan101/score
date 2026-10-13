/**
 * Every new client gets a random UUID: unguessable, and never the same as another
 * salon's client (the old time-based ids could be both). Existing ids are kept —
 * appointments, invoices and wallet passes point at them.
 */
export const newClientId = () => `c_${crypto.randomUUID()}`;
