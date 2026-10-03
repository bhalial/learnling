import { webFrame } from 'electron'

// Magister's login page asks for a passkey as soon as it opens ("conditional
// mediation"). A normal browser keeps that quiet; here Windows turns it into a
// PIN dialog right away. Saying the quiet mode is unavailable stops that, while
// the page's own "log in with a passkey" button keeps working for whoever wants it.
void webFrame.executeJavaScript(`
  if (window.PublicKeyCredential) {
    window.PublicKeyCredential.isConditionalMediationAvailable = () => Promise.resolve(false)
  }
`)
