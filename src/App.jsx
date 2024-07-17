import { useState, useRef, useEffect } from 'react';
import CardSelector from './components/CardSelector.jsx';
import CardTable from './components/CardTable.jsx';
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
                const array = reader.result.split('\n')
                                           .map(line => line.substr(1,line.length-2)
                                                            .split('","')
                                                            .map(entry => entry.replaceAll('""','"')));
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

        for (let row of array) {
            for (let i in row) {
                if (typeof row[i] == 'string') {
                    row[i] = row[i].replaceAll('"', '""');
                }
            }
        }

        const data = array.map(row => '"' + row.join('","') + '"').join('\n');
        const blob = new Blob([data], {type: 'text/csv'})
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
