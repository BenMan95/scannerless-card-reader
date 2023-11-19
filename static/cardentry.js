const entryForm = document.getElementById('search');
const nameField = document.getElementById('name');
const setField = document.getElementById('set');
const cnField = document.getElementById('cn');

const bigCard = document.getElementById('big-card');
const smallCards = document.getElementById('small-cards');
const tbody = document.getElementsByTagName('tbody')[0];

const dlButton = document.getElementById('download');

// Applies func to each card found by the filters
// Returns null if there is no error
// Returns error code otherwise
async function search(filters) {
    // Determine query
    let query = filters.join(' ');
    let url = `https://api.scryfall.com/cards/search?unique=prints&q=${encodeURI(query)}`;

    // Process cards in query
    let cards = [];
    let json;
    do {
        // Get and check response
        let response = await fetch(url);
        try {
            json = await response.json();
            if (json.object === 'error')
                throw new Error(json.status);
        } catch {
            throw new Error(response.status);
        }

        // Process data
        cards = cards.concat(json.data);
        url = json.next_page;
    } while (json.has_more);

    return cards;
}

// Debouncing function
const timeouts = {}
function debounce(func, time, id) {
    clearTimeout(timeouts[id])
    timeouts[id] = setTimeout(func, time);
}


function addCard(card) {
    // Create nodes
    let row = document.createElement('tr');
    let qt = document.createElement('td');
    let cname = document.createElement('td');
    let set = document.createElement('td');
    let cn = document.createElement('td');
    let lang = document.createElement('td');
    let finish = document.createElement('td');

    // Add content to nodes
    qt.textContent = '1';
    cname.textContent = card.name;
    set.textContent = card.set.toUpperCase();
    cn.textContent = card.collector_number;
    lang.textContent = card.lang.toUpperCase();
    finish.textContent = card.finishes[0];

    // Add nodes to DOM
    row.appendChild(qt);
    row.appendChild(cname);
    row.appendChild(set);
    row.appendChild(cn);
    row.appendChild(lang);
    row.appendChild(finish);
    tbody.prepend(row);
}

// Update card list on search
let time = 0;
let selectedCard = null;
async function updateCardList() {
    selectedCard = null;
    smallCards.textContent = '';
    bigCard.src = '';

    // Get search values
    let cname = nameField.value;
    let set = setField.value;
    let cn = cnField.value;

    // Update timestamp
    let timestamp = ++time;

    // Determine filters to apply to search
    let filters = []
    if (cname) filters.push(`"${cname}"`);
    if (set) filters.push(`s:"${set}"`);
    if (cn) filters.push(`cn:"${cn}"`);

    if (filters.length == 0)
        return;

    let cards;
    try {
        cards = await search(filters);
    } catch (error) {
        smallCards.textContent = error.message;
    }

    for (i in cards) {
        // Get card and images at index
        let card = cards[i];
        let images = card.image_uris ?? card.card_faces[0].image_uris;

        // Create node
        let newNode = document.createElement('img');
        newNode.classList.add('card');
        newNode.src = images.small;

        // Add listener to update selection on hover
        newNode.addEventListener('mouseover', () => {
            bigCard.src = images.large;
            selectedCard = card;
        });

        // Add listener to add card on click
        newNode.addEventListener('click', () => {
            addCard(card);
            entryForm.reset();
            nameField.focus();
        });

        // Check timestamp
        if (timestamp < time)
            return;

        // Set selection to first card
        if (i == 0) {
            bigCard.src = images.large;
            selectedCard = card;
        }

        // Add node
        smallCards.append(newNode);
    }
}

// Add event to clear images on reset
entryForm.addEventListener('reset', () => {
    smallCards.textContent = '';
    bigCard.src = '';
    selectedCard = null;
});

// Add event to add card on submit
entryForm.addEventListener('submit', event => {
    event.preventDefault();
    addCard(selectedCard);
    entryForm.reset();
    nameField.focus();
});

const delay = 300;
nameField.addEventListener('input', () => debounce(updateCardList, delay, 0));
setField.addEventListener('input', () => debounce(updateCardList, delay, 0));
cnField.addEventListener('input', () => debounce(updateCardList, delay, 0));

function download(filename, content) {
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/text,' + encodeURI(content);
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.click();
}

dlButton.addEventListener('click', () => {
    let cardList = [];
    for (let row of tbody.children) {
        let cardData = [];
        for (let ele of row.children)
            cardData.push(ele.textContent);
        cardList.push(cardData);
    }

    let csvData = cardList.map(row => '"' + row.join('","') + '"').join('\n');
    download('cards.csv', csvData);
})