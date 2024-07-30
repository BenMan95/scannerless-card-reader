import { useState, useRef, useEffect } from 'react';
import CardSelector from './components/CardSelector.jsx';
import CardTable from './components/CardTable.jsx';
import { toCSV, fromCSV } from './csv.js';
import './App.css';

function App() {
    const [cards, setCards] = useState([]);
    const [outURL, setOutURL] = useState(null);
    const fileInput = useRef(null);

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

    async function readFile() {
        const files = fileInput.current.files;
        if (files.length > 0) {
            const reader = new FileReader();

            reader.onerror = () => alert('Failed to read file');
            reader.onloadend = () => fileInput.current.value = null;
            reader.onload = () => {
                const array = fromCSV(reader.result);

                // Map csv headers to internal attribute names
                const header = array.shift().map(attr => {
                    const attrs_map = {
                        'Count':            'qty',
                        'ID':               'id',
                        'Name':             'name',
                        'Edition':          'set',
                        'Collector Number': 'cn',
                        'Language':         'lang',
                        'Foil':             'finish'
                    }
                    return attrs_map[attr];
                });

                // Convert list data to card objects
                const cards = array.map(row => {
                    const card = {};
                    row.map((val,i) => card[header[i]] = val);
                    return card;
                });

                setCards(cards);
            }

            reader.readAsText(files[0]);
        }
    }

    useEffect(() => {
        const array = cards.map(card => [card.qty, card.id, card.name, card.set, card.cn, card.lang, card.finish]);
        array.unshift(['Count', 'ID', 'Name', 'Edition', 'Collector Number', 'Language', 'Foil']);

        const csv = toCSV(array);
        const blob = new Blob([csv], {type: 'text/csv'})
        const url = URL.createObjectURL(blob);

        setOutURL(url);
        return () => URL.revokeObjectURL(url);
    }, [cards]);

    return (
        <div>
            <CardSelector onSelect={addCard}/>
            <br/>
            <CardTable cards={cards}/>
            <br/>
            <div id="buttons">
                <button onClick={() => fileInput.current.click()}>Import</button>
                <input id="input" type="file" ref={fileInput} onChange={readFile} hidden/>
                <a href={outURL} download="cards.csv">
                    <button>Export</button>
                </a>
            </div>
        </div>
    );
}

export default App;
