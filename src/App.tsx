import styles from './App.module.css';
import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import CardSelector, { type CardSelectorController } from './components/CardSelector.tsx';
import CardTable from './components/CardTable.tsx';
import CardEditor, { type CardEditorProps } from './components/CardEditorPopup.tsx';
import { toCSV, fromCSV } from './utils/csv.ts';
import type { Card } from './utils/types.ts';
import type { ScryfallCard } from './utils/scryfall';

function App(): ReactNode {
    const [cards, setCards] = useState<Card[]>([]);
    const [outURL, setOutURL] = useState<string | undefined>(undefined);
    const [editorProps, setEditorProps] = useState<CardEditorProps | null>(null)
    const [shiftHeld, setShiftHeld] = useState<boolean>(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const selectorController = useRef<CardSelectorController>(null);

    useEffect(() => {
        function downHandler(e: KeyboardEvent) {
            if (e.key === 'Shift') setShiftHeld(true);
        }

        function upHandler(e: KeyboardEvent) {
            if (e.key === 'Shift') setShiftHeld(false);
        }

        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);
        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, []);

    function addCard(cardData: ScryfallCard) {
        function checkDuplicatesAndAdd(newCard: Card) {
            setCards(current => {
                let isDuplicate = false;
                const newCards = current.map(card => {
                    if (card.id === newCard.id && card.finish === newCard.finish) {
                        isDuplicate = true;
                        return {...card, qty: card.qty + newCard.qty};
                    }

                    return card;
                })

                if (!isDuplicate) newCards.push(newCard);
                return newCards;
            });
        }

        let newCard: Card = {
            qty:    1,
            id:     cardData.id,
            name:   cardData.name,
            set:    cardData.set,
            cn:     cardData.collector_number,
            lang:   cardData.lang,
            finish: cardData.finishes[0],
        };

        if (shiftHeld) {
            const props: CardEditorProps = {
                card: newCard,
                onCancel: () => {
                    setEditorProps(null);
                    selectorController.current!.focus();
                },
                onSave: (editedCard) => {
                    checkDuplicatesAndAdd(editedCard);
                    setEditorProps(null);
                    selectorController.current!.focus();
                    selectorController.current!.clear();
                },
            }

            setEditorProps(props)
        } else {
            checkDuplicatesAndAdd(newCard);
            selectorController.current!.focus();
            selectorController.current!.clear();
        }
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

    function handleEdit(editIndex: number) {
        const props: CardEditorProps = {
            card: cards[editIndex],
            onDelete: () => {
                setCards(current => current.filter((_, idx) => idx !== editIndex));
                setEditorProps(null);
            },
            onCancel: () => setEditorProps(null),
            onSave: (newCard: Card) => {
                setCards(current => {
                    let isDuplicate = false;

                    const newCards = current.map((card, idx) => {
                        if (idx === editIndex)
                            return newCard;

                        if (card.id === newCard.id && card.finish === newCard.finish) {
                            isDuplicate = true;
                            return {...card, qty: card.qty + newCard.qty};
                        }

                        return card;
                    });

                    if (isDuplicate) newCards.splice(editIndex, 1);
                    return newCards;
                })

                setEditorProps(null);
            },
        }

        setEditorProps(props);
    }

    return (
        <>
            <CardSelector onSelect={addCard} controller={selectorController}/>
            <br/>
            <CardTable cards={cards} handleClick={handleEdit}/>
            <br/>
            <div className={styles['buttons']}>
                <button onClick={() => fileInput.current?.click()}>Import</button>
                <input id="input" type="file" ref={fileInput} onChange={readFile} hidden/>
                <a href={outURL} download="cards.csv">
                    <button>Export</button>
                </a>
            </div>
            {editorProps && <CardEditor {...editorProps}/>}
        </>
    );
}

export default App;
