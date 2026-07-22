const LOGIN_FOCUS_EVENT = "documento:focus-login";

export function emitLoginFocus() {
  window.dispatchEvent(new CustomEvent(LOGIN_FOCUS_EVENT));
}

export function subscribeToLoginFocus(callback: () => void) {
  window.addEventListener(LOGIN_FOCUS_EVENT, callback);
  return () => window.removeEventListener(LOGIN_FOCUS_EVENT, callback);
}
