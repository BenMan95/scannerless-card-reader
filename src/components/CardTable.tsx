import './CardTable.module.css';
import type { Row } from '../utils/types';

export interface CardTableProps {
    rows: Row[],
    handleClick: (index: number) => void,
}

function CardTable({ rows, handleClick }: CardTableProps) {
    return (
        <table>
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
                        <td>{card.qty}</td>
                        <td>{card.name}</td>
                        <td>{card.set}</td>
                        <td>{card.cn}</td>
                        <td>{card.lang}</td>
                        <td>{card.finish}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default CardTable;