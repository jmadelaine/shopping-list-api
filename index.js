const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const { is, isStringOrUndefined, isNumberOrUndefined } = require('ts-guardian')

const app = express()
app.use(bodyParser.json())

// In-memory database of shopping list items.
const shoppingList = new Map([
  ['d2c0baa1-3da2-450a-bb53-93d3f3987e5b', { name: 'Bread', count: 2 }],
  ['c32de34e-6fa5-49bb-8435-734d066b9937', { name: 'Whole Milk 2L', count: 1 }],
  ['483f12ba-217f-4f5f-b65e-19f5f2c8955e', { name: 'Eggs', count: 12 }],
])

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'README.html'))
})

// Read all items
app.get('/shoppingListItems', (req, res) => {
  res.status(200).json([...shoppingList].map(([id, item]) => ({ id, ...item })))
})

// Delete all items
app.delete('/shoppingListItems', (req, res) => {
  shoppingList.clear()
  res.status(200).end()
})

// Create item
app.post('/shoppingListItem', (req, res) => {
  const data = req.body
  if (!is({ name: 'string', count: 'number' })(data)) {
    res.statusMessage = 'Request body is not a ShoppingListItem'
    return res.status(400).end()
  }
  const id = crypto.randomUUID()
  shoppingList.set(id, { name: data.name, count: data.count })
  res.status(200).send({ id })
})

// Read item matching ID
app.get('/shoppingListItem/:id', (req, res) => {
  const { id } = req.params
  const item = shoppingList.get(id)
  if (!item) {
    res.statusMessage = 'ShoppingListItem not found'
    return res.status(404).end()
  }
  res.status(200).json({ id, ...item })
})

// Update item matching ID
app.put('/shoppingListItem/:id', (req, res) => {
  const { id } = req.params
  const data = req.body
  if (!is({ name: isStringOrUndefined, count: isNumberOrUndefined })(data)) {
    res.statusMessage = 'Request body is not a partial ShoppingListItem'
    return res.status(400).end()
  }

  const { name, count } = req.body

  if (count !== undefined && (count <= 0 || count > Number.MAX_SAFE_INTEGER)) {
    res.statusMessage = 'Count must be a valid positive number'
    return res.status(400).end()
  }

  const item = shoppingList.get(id)

  if (!item) {
    res.statusMessage = 'ShoppingListItem not found'
    return res.status(404).end()
  }

  const newItem = { ...item }
  if (name !== undefined) newItem.name = name
  if (count !== undefined) newItem.count = count
  shoppingList.set(id, newItem)
  res.status(200).send({ id })
})

// Delete item matching ID
app.delete('/shoppingListItem/:id', (req, res) => {
  const { id } = req.params
  shoppingList = shoppingList.delete(id)
  res.status(200).end()
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Shopping List API is running on port ${PORT}`)
})
