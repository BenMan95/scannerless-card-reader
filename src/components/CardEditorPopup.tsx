import styles from './CardEditorPopup.module.css';
import { useEffect, useState } from 'react';
import type { Card } from '../utils/types';

interface CardEditorProps {
    card: Card,
    onDelete: () => void,
    onCancel: () => void,
    onSave: (newCard: Card) => void,
}

function CardEditor({card, onDelete, onCancel, onSave}: CardEditorProps) {
    const [cardData, setCardData] = useState<Card>();
    const [newCard, setNewCard] = useState<Card>({...card});

    return (
        <div className={styles['background']}>
            <div className={styles['window']}>
                <div className={styles['main']}>
                    <img></img>
                    <div className={styles['options']}>
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