const express = require('express')
const app = express()
const port = 8080

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

app.use("/", express.static("static"))

// app.get('/entry', (req, res) => {
//     res.sendFile('./static/cardentry.html', {root:'.'})
// })
// app.get('/entry.js', (req, res) => {
//     res.sendFile('./static/cardentry.js', {root:'.'})
// })
// app.get('/entry.css', (req, res) => {
//     res.sendFile('./static/cardentry.css', {root:'.'})
// })