/* ============================================================
   WELLNESS — FORMS (contact + booking)
   Validation, honest submission states, no fake confirmations.
   ============================================================ */

/* -- Integration point ---------------------------------------
   Point FORM_ENDPOINT at your booking/enquiry service
   (e.g. Formspree, HubSpot Forms, or your own API). It accepts
   POSTed JSON and should answer 2xx when the request is stored.
   Until it is configured the forms stay honest: they explain
   that online requests are not yet accepted and offer the
   direct e-mail address instead. No placeholders confirmations.
   ------------------------------------------------------------ */
const FORM_ENDPOINT = '';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\d][\d\s()\-]{6,19}$/;

function setError(field, message) {
  const wrap = field.closest('.field');
  if (!wrap) return;
  wrap.classList.toggle('is-err', Boolean(message));
  const err = wrap.querySelector('.err');
  if (err) err.textContent = message || '';

  if (!message) {
    if (field.type !== 'checkbox') wrap.classList.add('is-set');
  }
}

export function initForms() {
  const form = document.querySelector('[data-form]');
  if (!form) return;

  const submitBtn = form.querySelector('[type="submit"]');
  const statusBox = form.querySelector('.form-status');
  const endpointNote = form.dataset.endpointNote || 'Enquiry';

  const evalField = (field) => {
    const value = field.value.trim();
    const required = field.required;
    let message = '';

    if (required && !value) {
      message = 'This field is required.';
    } else if (field.type === 'email' && value && !EMAIL_RE.test(value)) {
      message = 'Please enter a valid e-mail address.';
    } else if (field.type === 'tel' && value && !PHONE_RE.test(value)) {
      message = 'Please enter a valid phone number.';
    } else if (field.type === 'date' && value) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(`${value}T12:00:00`) < today) {
        message = 'Please choose a date from today onwards.';
      }
    }
    setError(field, message);
    return !message;
  };

  /* live validation once a field was touched */
  form.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('blur', () => evalField(field));
    field.addEventListener('input', () => {
      if (field.closest('.field')?.classList.contains('is-err')) evalField(field);
    });
    if (field.value) field.closest('.field')?.classList.add('is-set');
  });

  /* booking form: earliest bookable date = today */
  const dateField = form.querySelector('input[type="date"]');
  if (dateField) {
    const d = new Date();
    const iso = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    dateField.min = iso;
  }

  const setStatus = (level, title, text) => {
    if (!statusBox) return;
    statusBox.innerHTML = `
      <div class="form-panel ${level === 'error' ? 'form-panel--error' : ''}">
        <p class="fp-title">${title}</p>
        <p class="fp-text">${text}</p>
      </div>`;
    if (level === 'error') statusBox.firstElementChild?.scrollIntoView({ block: 'center' });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fields = form.querySelectorAll('input, select, textarea');
    let valid = true;
    fields.forEach((field) => {
      const ok = evalField(field);
      if (!ok && valid) field.focus();
      valid = valid && ok;
    });

    if (!valid) return;

    /* loading state */
    submitBtn?.classList.add('is-loading');
    submitBtn?.setAttribute('disabled', 'true');

    const payload = Object.fromEntries(new FormData(form).entries());

    /* Integration not connected yet: stay truthful instead of
       pretending a booking was created. */
    if (!FORM_ENDPOINT) {
      submitBtn?.classList.remove('is-loading');
      submitBtn?.removeAttribute('disabled');
      const mailTo = form.dataset.contactEmail || '';
      setStatus(
        'info',
        `${endpointNote} — online requests not yet connected`,
        `Your details were validated, but the ${endpointNote.toLowerCase()} service is not connected yet, so nothing was sent. Please reach us directly at ${mailTo ? `<a href="mailto:${mailTo}">${mailTo}</a>` : 'the address listed on the contact page'} and we will confirm availability personally.`
      );
      return;
    }

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      setStatus(
        'success',
        'Request received',
        `Thank you, ${payload.name || 'guest'}. Your ${endpointNote.toLowerCase()} has been received and our team will reply personally within one working day. This is a request, not a confirmed appointment — we will confirm availability by e-mail.`
      );
      form.reset();
      form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-set', 'is-err'));
    } catch (err) {
      const mailTo = form.dataset.contactEmail || '';
      setStatus(
        'error',
        'Something went wrong',
        `Your request could not be submitted right now. Please try again shortly, or e-mail us directly at ${mailTo ? `<a href="mailto:${mailTo}">${mailTo}</a>` : 'the address listed on the contact page'}.`
      );
    } finally {
      submitBtn?.classList.remove('is-loading');
      submitBtn?.removeAttribute('disabled');
    }
  });
}
