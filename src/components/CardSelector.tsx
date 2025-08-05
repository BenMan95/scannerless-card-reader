import styles from './CardSelector.module.css';
import React, { useEffect, useState } from 'react';
import type { ScryfallCard, ScryfallSearch } from '../utils/scryfall';
import { loadSearchResults, getMainImages } from '../utils/scryfall';

export interface CardSelectorProps {
    // onSelect function can return true to avoid clearing fields
    onSelect: (card: ScryfallCard) => boolean | void,
}

interface FormVals {
    name: string,
    set: string,
    cn: string,
}

function CardSelector({ onSelect }: CardSelectorProps) {
    const [formVals, setVals] = useState<FormVals>({name:'', set:'', cn:''});
    const [results, setResults] = useState<ScryfallCard[]>([]);
    const [hovered, setHovered] = useState<ScryfallCard | null>(null);

    useEffect(() => {
        const controller: AbortController = new AbortController();

        const search: ScryfallSearch = {
            q: [],
            unique: 'prints',
            include_extras: true,
            include_variations: true,
        }
        if (formVals.name) {
            const escaped: string = formVals.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            search.q.push(`name:/${escaped}/`);
        }
        if (formVals.set) search.q.push(`s:'${formVals.set}'`);
        if (formVals.cn) search.q.push(`cn:'${formVals.cn}'`);

        // If query is not empty, search for cards and add them to the results
        if (search.q.length) {
            search.q.push('not:digital');
            setTimeout(async () => {
                try {
                    for await (const page of loadSearchResults(search, controller.signal)) {
                        setResults(current => [...current, ...page])
                        setHovered(current => current || page[0])
                    }
                } catch (e) {
                    if (e instanceof Error && e.name !== 'AbortError') {
                        alert(e.message);
                    }
                }
            }, 500);
        }

        // Cancel search if input values are still being edited
        return () => {
            controller.abort();
            setResults([]);
            setHovered(null);
        };
    }, [formVals]);

    // Functions for updating and checking form values
    function updateName(e: React.ChangeEvent<HTMLInputElement>) {
        const newVal: string = e.target.value;
        setVals(oldVals => ({...oldVals, name: newVal}))
    }
    function updateSet(e: React.ChangeEvent<HTMLInputElement>) {
        const newVal: string = e.target.value.replaceAll(' ','');
        setVals(oldVals => ({...oldVals, set: newVal}))
    }
    function updateCN(e: React.ChangeEvent<HTMLInputElement>) {
        const newVal: string = e.target.value.replaceAll(' ','');
        setVals(oldVals => ({...oldVals, cn: newVal}))
    }

    // When a card is selected, run the passed onSelect function
    // and reset the form values
    function selectCard(card: ScryfallCard) {
        if (onSelect(card)) return;
        setVals({name:'', set:'', cn:''});
        setResults([]);
        setHovered(null);
    }

    // When submitted through the form, select the hovered card
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (hovered !== null)
            selectCard(hovered);
    }

    return (
        <div className={styles['outer']}>
            <div className={styles['inner']}>
                <form className={styles['search']} autoComplete="off" onSubmit={handleSubmit}>
                    <p>
                        <label htmlFor="name">Card Name: </label>
                        <input value={formVals.name} name="name" placeholder="Card Name" onChange={updateName} autoFocus/>
                    </p>
                    <p>
                        <label htmlFor="set">Set Code: </label>
                        <input value={formVals.set} name="set" placeholder="Set Code" onChange={updateSet}/>
                    </p>
                    <p>
                        <label htmlFor="cn">Number: </label>
                        <input value={formVals.cn} name="cn" placeholder="Collector Number" onChange={updateCN}/>
                    </p>
                    <input type="submit" hidden/>
                </form>
                <div className={styles['big-card-container']}>
                    {hovered && (
                        <img className={`${styles['card']} ${styles['big-card']}`} alt="Selected Card"
                             src={getMainImages(hovered).large}/>
                    )}
                </div>
            </div>
            <div className={styles['small-cards']}>
                {results.map(card => {
                    return (<img className={styles['card']}
                                 src={getMainImages(card).small}
                                 key={card.id}
                                 alt={card.name}
                                 onMouseOver={() => setHovered(card)}
                                 onClick={() => selectCard(card)}/>)
                })}
            </div>
        </div>
    );
}

export default CardSelector;