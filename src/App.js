import { useState } from 'react';
import './App.css';
import CardSelector from './components/CardSelector.js'
import CardTable from './components/CardTable.js'

function App() {
    const [cards, setCards] = useState([]);

    function addCard(newCard) {
        setCards(current => {
            const newCards = [...current];

            for (let card of newCards) {
                if (card.id === newCard.id) {
                    card.qty += 1;
                    return newCards;
                }
            }

            const row = {
                qty:    1,
                id:     newCard.id,
                name:   newCard.name,
                set:    newCard.set,
                cn:     newCard.collector_number,
                lang:   newCard.lang,
                finish: newCard.finishes[0],
            };

            newCards.push(row);
            return newCards;
        });
    }

    const data = cards.map(card => [card.qty, card.id, card.name, card.set, card.cn, card.lang, card.finish]);
    data.unshift(['Count', 'ID', 'Name', 'Edition', 'Collector Number', 'Language', 'Foil']);
    const output = data.map(row => '"' + row.join('","') + '"').join('\n');
    const blob = new Blob([output], {type: 'text/csv'})
    const url = URL.createObjectURL(blob);

    return (
        <div>
            <CardSelector onSelect={addCard}/>
            <br/>
            <CardTable cards={cards}/>
            <br/>
            <div id='buttons'>
                <a href={url} download='cards.csv'>
                    <button>Export</button>
                </a>
            </div>
        </div>
    );
}

export default App;
