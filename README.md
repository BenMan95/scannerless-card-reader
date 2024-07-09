# Scannerless Card Reader

A simple way to quickly input cards from Magic: The Gathering without a camera.

I made this because in my experience, I've found card scanners to be clunky and finicky to use. Additionaly, they can have difficulty differentiating between different printings of the same card, slowing them down even more. Inputting cards this way lets you quickly narrow down to the correct card.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Setup
- Make sure Node.js has been installed
- Clone this repo to your system
- Run `npm install` in the project directory

## Usage
- Run the command `npm start` to begin running this project
- Navigate to `localhost:3000` in your browser
- Input cards as follows:
  - Input some combination of name, set code, and collector number in the fields at the top left
    - The name can be found at the top of the card
    - Set code and collector number are found at the bottom left corner
  - Press enter or click on one of the icons that appear on the right to add your card to the table at the bottom
  - Edit the table to make any necessary adjustments
  - Download the inputted cards with the button at the bottom
