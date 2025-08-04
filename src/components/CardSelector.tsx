import styles from './CardSelector.module.css';
import React, { useEffect, useState } from 'react';
import type { ScryfallCard, ScryfallError, ScryfallList, ScryfallSearch } from '../utils/scryfall';
import { encodeSearch, getMainImages } from '../utils/scryfall';

interface CardSelectorProps {
    onSelect: (card: ScryfallCard) => void,
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
            query: ['not:digital'],
            unique: 'prints',
            include_extras: true,
        }
        if (formVals.name) {
            const escaped: string = formVals.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            search.query.push(`name:/${escaped}/`);
        }
        if (formVals.set) search.query.push(`s:'${formVals.set}'`);
        if (formVals.cn) search.query.push(`cn:'${formVals.cn}'`);

        // If query is not empty, search for cards and add them to the results
        if (formVals.name || formVals.set || formVals.cn) {
            let next_url: string | undefined = encodeSearch(search);
            setTimeout(async () => {
                try {
                    while (next_url) {
                        const response: Response = await fetch(next_url, {signal:controller.signal});
                        const json: ScryfallError | ScryfallList = await response.json();

                        if (json.object === 'error') {
                            const error = json as ScryfallError;
                            alert(`${error.status} Error: ${error.code}\n${error.details}`);
                            return;
                        }

                        const list = json as ScryfallList;
                        setResults(current => [...current, ...list.data]);
                        setHovered(current => current || list.data[0]);

                        next_url = list.next_page;
                    }
                } catch (e) {
                    if (e instanceof Error && e.name !== 'AbortError') {
                        console.log(e);
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
        setVals({...formVals, name:newVal})
    }
    function updateSet(e: React.ChangeEvent<HTMLInputElement>) {
        const newVal: string = e.target.value.replaceAll(' ','');
        setVals({...formVals, set:newVal})
    }
    function updateCN(e: React.ChangeEvent<HTMLInputElement>) {
        const newVal: string = e.target.value.replaceAll(' ','');
        setVals({...formVals, cn:newVal})
    }

    // When a card is selected, run the passed onSelect function
    // and reset the form values
    function selectCard(card: ScryfallCard) {
        if (card != null) {
            onSelect(card);
        }

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
                {results.filter(card => card.image_status !== 'missing')
                        .map(card => {
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