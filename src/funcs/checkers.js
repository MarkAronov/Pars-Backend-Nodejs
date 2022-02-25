const validator = require('validator')

// FUNCTIONS 
const filterDupes = (arr = []) => {
  const map = new Map()
  let filtered = []
  for (let a of arr) {
    if (map.get(a) === undefined) {
      map.set(a, true)
      filtered = filtered.concat(a)
    }
  }
  return filtered
}

exports.usernameChecker = (str = "") => {
  let nameErrors = []
  if (validator.contains(str, ' ')) nameErrors.push(['validation', 'Username contains whitespace'])
  if (!str.match(/^[0-9a-zA-Z\s]+$/)) nameErrors.push(['validation', 'Username contains none alphanumeric characters'])
  return nameErrors
}

exports.emailChecker = (str = "") => {
  let emailErrors = []
  if (!validator.isEmail(str)) emailErrors.push(['validation', 'Invalid email'])
  return emailErrors
}

exports.passwordChecker = (str = "") => {
  let passwordErrors = []
  const lowercase = str.match(/[a-z]/)
  const uppercase = str.match(/[A-Z]/)
  const numbers = str.match(/[0-9]/)

  // Minimum: 10 chars | 1 Uppercase | 1 lowercase | 1 digit
  if (str.length < 10) passwordErrors.push(['validation', "Password is less than 10 characters"])
  if (!lowercase) passwordErrors.push(['validation', "Password must have at least one lowercase"])
  if (!uppercase) passwordErrors.push(['validation', "Password must have at least one uppercase"])
  if (!numbers) passwordErrors.push(['validation', "Password must have at least one digit"])

  return passwordErrors
}

exports.entropy = (str) => {
  // Password entropy
  const E = str.length * Math.log2(filterDupes(str.split('')).length)

  return E
}
