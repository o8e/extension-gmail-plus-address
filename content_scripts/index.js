;(() => {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return
  }
  window.hasRun = true

  const getAllInputs = () => document.querySelectorAll('input[type="email"]')

  /**
   * For all email inputs on the page, replace with value
   */
  function updateInputs(value) {
    removeExistingInputs()
    const inputs = getAllInputs()
    inputs.forEach((input) => {
      input.value = value
    })
  }

  /**
   * Reset all email inputs to empty string
   */
  function removeExistingInputs() {
    const existingInputs = getAllInputs()
    existingInputs.forEach((input) => {
      input.value = ''
    })
  }

  /**
   * Listen for messages from the background script
   */
  browser.runtime.onMessage.addListener((message) => {
    if (message.command === 'generate') {
      updateInputs(message.value)
    } else if (message.command === 'reset') {
      removeExistingInputs()
    }
  })
})()
