import { padStart, remove } from "lodash";
import styles from "../../../../styles/scheduleEditor.module.css"

export default function TimeSlotList(props) {
    const { slots, selectedSlots, onChangeSelection } = props;

    const onClickItem = (slot, checked) => {
        if (checked) {
            const newlySelectedSlots = [...selectedSlots];
            remove(newlySelectedSlots, selectedSlot => selectedSlot === slot);
            onChangeSelection(newlySelectedSlots);
        } else {
            onChangeSelection(selectedSlots.concat([slot]));
        }
    }

    const checkboxes = slots.map(slot => {
        const startHourString = `${slot}:00`;
        const endHour = Number(slot) + 1;
        const endHourString = `${padStart(`${endHour}`, 2, '0')}:00`;
        const checked = selectedSlots.includes(slot);

        return (
            <li key={startHourString} onClick={() => onClickItem(slot, checked)}>
                <input type='checkbox' checked={checked} onChange={() => onClickItem(slot, checked)}/>
                <label className={styles.labelText}>
                    {`${startHourString} ~ ${endHourString}`}
                </label>
            </li>
        )
    }).concat([<li key='footer' className={styles.footer} />])

    return (
        <div className={styles.timeSlotList}>
            <label className={styles.headerText}>시간 선택</label>
            <ul>
                {checkboxes}
            </ul>
        </div>
    )
}
