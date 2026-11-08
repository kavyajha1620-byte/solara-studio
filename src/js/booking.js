/* ============================================================
   WELLNESS — BOOKING PAGE (class/session enquiry flow)
   Reads ?class=… for preselection and renders a placeholder
   weekly timetable per discipline. All schedule values are
   [Placeholder] until the client supplies real times. The
   submission itself stays honest (see forms.js — no fake
   confirmations without a connected backend).
   ============================================================ */

/* Placeholder per-class timetable shape. Values are deliberately
   generic labels; nothing here claims a real class exists. */
const SCHEDULE = {
  yoga: 'Yoga',
  pilates: 'Pilates',
  meditation: 'Meditation & mindfulness',
  strength: 'Strength training',
  functional: 'Functional fitness',
  mobility: 'Mobility & stretching',
  'personal-training': 'Personal training',
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function initBooking() {
  const select = document.querySelector('#b-class');
  const scheduleTitle = document.querySelector('[data-sched-title]');
  const scheduleList = document.querySelector('[data-sched-list]');
  const scheduleNote = document.querySelector('[data-sched-note]');
  if (!select || !scheduleList) return;

  /* 1. URL preselect: booking.html?class=yoga */
  const wanted = new URLSearchParams(window.location.search).get('class');
  if (wanted && [...select.options].some((o) => o.value === wanted)) {
    select.value = wanted;
    select.closest('.field')?.classList.add('is-set');
  }

  /* 2. Placeholder timetable per chosen discipline */
  const render = () => {
    const key = SCHEDULE[select.value] ? select.value : null;

    if (!key) {
      if (scheduleTitle) scheduleTitle.textContent = 'Choose a class to view its schedule';
      scheduleList.innerHTML = '';
      if (scheduleNote) {
        scheduleNote.textContent = 'Schedules are placeholders until the studio supplies final times — availability is always confirmed personally by e-mail.';
      }
      return;
    }

    if (scheduleTitle) scheduleTitle.textContent = `${SCHEDULE[key]} — weekly schedule (placeholder)`;
    scheduleList.innerHTML = DAYS.map((day) => `
      <li>
        <span class="s-day">${day}</span>
        <span class="s-what">[Placeholder session — to be supplied]</span>
        <span class="s-slot">[Placeholder time]</span>
      </li>`).join('');
    if (scheduleNote) {
      scheduleNote.innerHTML = 'Placeholder rows — replace with the verified timetable. Requested sessions are held only after we confirm by e-mail.';
    }
  };

  select.addEventListener('change', render);
  render();

  /* 3. Briefly foreground the schedule when the class changes */
  if (scheduleTitle && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    select.addEventListener('change', () => {
      scheduleTitle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}
