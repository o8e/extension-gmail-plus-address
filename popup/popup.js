/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */

let email = ''

function initialize() {
  let getEmailFromStorage = browser.storage.local.get('email')
  getEmailFromStorage.then((results) => {
    email = results.email
    const input = document.querySelector('input')
    input.value = email
  })
}

initialize()

function listenForClicks() {
  document.addEventListener('input', (e) => {
    if (e.target.type !== 'text' || !e.target.closest('#popup-content')) {
      // Ignore when click is not on a button within <div id="popup-content">.
      return
    }

    browser.storage.local.set({ email: e.target.value })
  })

  document.addEventListener('click', (e) => {
    /**
     * Given the name of a button, get the value for the email field.
     */
    function textToValue(text, url) {
      switch (text) {
        case 'Website':
          const hostname = new URL(url).hostname
          const uuid = window.crypto.randomUUID().split('-')[0]
          const website = email.split('@')
          website.splice(1, 0, `+${hostname}${uuid}@`)
          return website.join('').toLowerCase()
        case 'Timestamp':
          const date = new Date()
          const day = date.getDate()
          const month = date.toLocaleString('default', { month: 'short' })
          const hour = date.getHours()
          const minute = date.getMinutes()
          const second = date.getSeconds()
          const timestamp = email.split('@')
          timestamp.splice(1, 0, `+${day}${month}${hour}${minute}${second}@`)
          return timestamp.join('').toLowerCase()
      }
    }

    /**
     * Get the email value from the button text then send a
     * "generate" message to the content script in the active tab.
     */
    function generate(tabs) {
      const url = textToValue(e.target.textContent, tabs[0].url)
      browser.tabs.sendMessage(tabs[0].id, {
        command: 'generate',
        value: url,
      })
    }

    /**
     * Send a "reset" message to the content script in the active tab.
     */
    function reset(tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        command: 'reset',
      })
    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Could not generate: ${error}`)
    }

    /**
     * Get the active tab,
     * then call "generate()" or "reset()" as appropriate.
     */
    if (e.target.tagName !== 'BUTTON' || !e.target.closest('#popup-content')) {
      // Ignore when click is not on a button within <div id="popup-content">.
      return
    }
    if (e.target.type === 'reset') {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(reset)
        .catch(reportError)
    } else {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(generate)
        .catch(reportError)
    }
  })
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector('#popup-content').classList.add('hidden')
  document.querySelector('#error-content').classList.remove('hidden')
  console.error(`Failed to execute generate content script: ${error.message}`)
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
  .executeScript({ file: '../content_scripts/index.js' })
  .then(listenForClicks)
  .catch(reportExecuteScriptError)
