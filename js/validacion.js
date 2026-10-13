document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formCotizacion');
  if (!form) return;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('formStatus');
  const initialButton = button.innerHTML;
  const fields = ['nombre', 'celular', 'correo', 'ruc', 'servicio'].map(id => document.getElementById(id));
  const descriptions = new Map(fields.map(field => [field, field.getAttribute('aria-describedby')]));
  let sending = false;
  let recoveryTimer;

  function clearError(field) {
    document.getElementById(`${field.id}-error`)?.remove();
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
    const description = descriptions.get(field);
    if (description) field.setAttribute('aria-describedby', description);
    else field.removeAttribute('aria-describedby');
  }
  function messageFor(field) {
    const value = field.value.trim();
    if (field.id === 'nombre' && value.length < 3) return 'Escribe tu nombre con al menos 3 caracteres.';
    if (field.id === 'celular' && !/^[0-9]{9}$/.test(value)) return 'Escribe un teléfono de 9 dígitos, sin espacios.';
    if (field.id === 'correo' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) return 'Escribe un correo electrónico válido.';
    if (field.id === 'ruc' && value && !/^[0-9]{11}$/.test(value)) return 'El RUC debe tener 11 dígitos. Puedes dejarlo vacío.';
    if (field.id === 'servicio' && !value) return 'Selecciona el servicio que necesitas.';
    return '';
  }
  function showError(field, message) {
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
    const error = document.createElement('small');
    error.id = `${field.id}-error`;
    error.className = 'error-text';
    error.textContent = message;
    field.parentElement.append(error);
    field.setAttribute('aria-describedby', [descriptions.get(field), error.id].filter(Boolean).join(' '));
  }
  function resetSending() {
    clearTimeout(recoveryTimer);
    sending = false;
    button.disabled = false;
    button.innerHTML = initialButton;
    form.removeAttribute('aria-busy');
  }
  fields.forEach(field => field.addEventListener('input', () => {
    if (field.hasAttribute('aria-invalid') && !messageFor(field)) clearError(field);
    if (!form.querySelector('[aria-invalid="true"]') && !sending) status.textContent = '';
  }));
  form.addEventListener('submit', event => {
    if (sending) { event.preventDefault(); return; }
    fields.forEach(clearError);
    const errors = fields.map(field => [field, messageFor(field)]).filter(([, message]) => message);
    if (errors.length) {
      event.preventDefault();
      errors.forEach(([field, message]) => showError(field, message));
      status.textContent = `Revisa ${errors.length === 1 ? 'el campo indicado' : `los ${errors.length} campos indicados`} antes de enviar.`;
      errors[0][0].focus();
      return;
    }
    // Preserve the normal POST to FormSubmit. No simulated success or AJAX request.
    fields.forEach(field => { field.value = field.value.trim(); });
    sending = true;
    button.disabled = true;
    button.textContent = 'Enviando solicitud…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Conectando con el servicio de envío. Espera la confirmación en la siguiente página.';
    recoveryTimer = setTimeout(() => {
      resetSending();
      status.textContent = 'No hemos recibido una confirmación aquí. Comprueba tu conexión. Antes de reenviar, puedes contactarnos para verificar la recepción.';
    }, 20000);
  });
  window.addEventListener('pageshow', () => { resetSending(); status.textContent = ''; });
  // Native required/type/pattern validation still works when JavaScript is unavailable.
  form.noValidate = true;
});
