import styles from './CardTable.module.css';
import type { Row } from '../utils/types';

export interface CardTableProps {
    rows: Row[],
    handleClick: (index: number) => void,
}

function CardTable({ rows, handleClick }: CardTableProps) {
    return (
        <table border={1} rules='rows' className={styles['cards']}>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Set</th>
                    <th>Num</th>
                    <th>Lang</th>
                    <th>Finish</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((card, index) => (
                    <tr key={index} onClick={() => handleClick(index)}>
                        <td>{card.quantity}</td>
                        <td>{card.card_name}</td>
                        <td>{card.set_code}</td>
                        <td>{card.collector_number}</td>
                        <td>{card.language}</td>
                        <td>{card.finish}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default CardTable;