import styles from './App.module.css';
import React, { useState, useRef, useEffect } from 'react';
import CardSelector from './components/CardSelector.tsx';
import CardTable from './components/CardTable.tsx';
import CardEditor from './components/CardEditorPopup.tsx';
import { toCSV, fromCSV } from './utils/csv.ts';
import type { Card } from './utils/types.ts';
import type { ScryfallCard } from './utils/scryfall';


function App() {
    const [cards, setCards] = useState<Card[]>([]);
    const [outURL, setOutURL] = useState<string | undefined>(undefined);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    function addCard(newCard: ScryfallCard) {
        setCards(current => {
            const newCards = [...current];

            for (const card of newCards) {
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

    async function readFile(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (files && files.length > 0) {
            const reader = new FileReader();
            reader.readAsText(files[0]);

            reader.onerror = () => alert('Failed to read file');
            reader.onloadend = () => e.target.value = '';
            reader.onload = () => {
                const array: string[][] = fromCSV(reader.result as string);

                const headers: string[] | undefined = array.shift();
                if (!headers) return;

                const mappedHeaders: (string | undefined)[] = headers.map(attr => {
                    const attrs_map: any = {
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

                const cards: Card[] = array.map(row => {
                    const card: any = {};
                    for (const i in row) {
                        const header = mappedHeaders[i];
                        if (header) card[header] = row[i];
                    }
                    return card;
                });

                setCards(cards);
            }
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

    function handleEditDelete() {
        setCards(current => current.filter((_, index) => index !== editIndex));
        setEditIndex(null);
    }
    function handleEditCancel() {
        setEditIndex(null);
    }
    function handleEditSave(newCard: Card) {
        // TODO: Save updated card to cards list
        console.log(newCard);
        setEditIndex(null);
    }

    return (
        <>
            <CardSelector onSelect={addCard}/>
            <br/>
            <CardTable cards={cards} handleClick={setEditIndex}/>
            <br/>
            <div className={styles['buttons']}>
                <button onClick={() => fileInput.current && fileInput.current.click()}>Import</button>
                <input id="input" type="file" ref={fileInput} onChange={readFile} hidden/>
                <a href={outURL} download="cards.csv">
                    <button>Export</button>
                </a>
            </div>
            {
                editIndex === null ? null :
                <CardEditor
                    card={cards[editIndex]}
                    onDelete={handleEditDelete}
                    onCancel={handleEditCancel}
                    onSave={handleEditSave}
                />
            }
        </>
    );
}

export default App;
