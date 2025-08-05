import styles from './CardEditorPopup.module.css';
import React, { useEffect, useState } from 'react';
import type { Card } from '../utils/types';
import type { ScryfallCard, ScryfallSearch } from '../utils/scryfall';
import { encodeIdURL, getMainImages, loadSearchResults } from '../utils/scryfall';

export interface CardEditorProps {
    card: Card,
    onDelete: () => void,
    onCancel: () => void,
    onSave: (newCard: Card) => void,
}

function CardEditor({card, onDelete, onCancel, onSave}: CardEditorProps) {
    const [newCard, setNewCard] = useState<Card>({...card});
    const [cardData, setCardData] = useState<ScryfallCard | null>(null);
    const [printingOptions, setPrintingOptions] = useState<ScryfallCard[]>([]);
    const [languageOptions, setLanguageOptions] = useState<ScryfallCard[]>([]);

    useEffect(() => {
        const controller: AbortController = new AbortController();

        fetch(encodeIdURL(card.id), {signal: controller.signal})
        .then(resp => resp.json())
        .then(async (card: ScryfallCard) => {
            setCardData(card);

            const search: ScryfallSearch = {
                q: [`oracle_id:${card.oracle_id}`],
                unique: 'prints',
                include_extras: true,
                include_variations: true,
            }

            for await (const page of loadSearchResults(search, controller.signal)) {
                setPrintingOptions(current => [...current, ...page]);
            }
        }).catch(e => {
            if (e.name != 'AbortError') {
                console.error(e);
            }
        });

        return () => {
            controller.abort();
            setPrintingOptions([]);
        }
    }, []);

    useEffect(() => {
        if (!cardData) return;

        const search: ScryfallSearch = {
            q: [`set:'${cardData.set}'`, `cn:'${cardData.collector_number}'`],
            unique: 'prints',
            include_extras: true,
            include_multilingual: true,
            include_variations: true,
        }

        const controller: AbortController = new AbortController();

        async function loadLanguages() {
            for await (const page of loadSearchResults(search)) {
                setLanguageOptions(current => [...current, ...page]);
            }
        }

        loadLanguages();

        return () => {
            controller.abort();
            setLanguageOptions([]);
        }
    }, [cardData]);

    function changeQuantity(e: React.ChangeEvent<HTMLInputElement>) {
        const newVal: number = parseInt(e.target.value);
        setNewCard({...newCard, qty: newVal});
    }

    function changePrinting(e: React.ChangeEvent<HTMLSelectElement>) {
        const index = e.target.selectedIndex;
        const newData = printingOptions[index];
        setCardData(newData);
        setNewCard({...newCard, set: newData.set, cn: newData.collector_number});
    }

    function changeLanguage(e: React.ChangeEvent<HTMLSelectElement>) {
        const index = e.target.selectedIndex;
        const newData = languageOptions[index];
        setCardData(newData);
        setNewCard({...newCard, lang: newData.lang});
    }

    function changeFinish(e: React.ChangeEvent<HTMLSelectElement>) {
        const index = e.target.selectedIndex;
        const finish = cardData!.finishes[index];
        setNewCard({...newCard, finish});
    }

    return (
        <div className={styles['background']}>
            <div className={styles['window']}>
                <div className={styles['main']}>
                    <img className={styles['card']} src={cardData ? getMainImages(cardData).large : undefined}></img>
                    <div className={styles['options']}>
                        <p>
                            <label htmlFor='quantity'>Quantity:</label>
                            <br/>
                            <input
                                className={styles['quantity']}
                                name='quantity'
                                type='number'
                                value={newCard.qty}
                                onChange={changeQuantity}>
                            </input>
                        </p>
                        <p>
                            <label htmlFor='printing'>Printing:</label>
                            <br/>
                            <select
                                name='printing'
                                onChange={changePrinting}
                                value={`(${newCard.set}) ${newCard.cn}`}
                            >
                                {printingOptions.map(card => (
                                    <option key={card.id}>
                                        {`(${card.set}) ${card.collector_number}`}
                                    </option>
                                ))}
                            </select>
                        </p>
                        <p>
                            <label htmlFor='language'>Language:</label>
                            <br/>
                            <select name='language' onChange={changeLanguage} value={newCard.lang}>
                                {languageOptions.map(card => (
                                    <option key={card.id}>{card.lang}</option>
                                ))}
                            </select>
                        </p>
                        <p>
                            <label htmlFor='finish'>Finish:</label>
                            <br/>
                            <select name='finish' onChange={changeFinish} value={newCard.finish}>
                                {cardData?.finishes.map(finish => (
                                    <option key={finish}>{finish}</option>
                                ))}
                            </select>
                        </p>
                    </div>
                </div>
                <div className={styles['buttons']}>
                    <div className={styles['left']}>
                        <button onClick={onDelete}>Delete</button>
                    </div>
                    <div className={styles['right']}>
                        <button onClick={() => onSave(newCard)}>Save</button>
                        <button onClick={onCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CardEditor;